import math


class Node:
    """Un nœud de l'arbre : une clé et un pointeur vers la ligne complète."""

    def __init__(self, value, id_ligne=None):
        self.value = value
        self.id_ligne = id_ligne    # pointeur vers la ligne dans le heap
        self.left = None
        self.right = None


class BinarySearchTree:
    """
    Arbre binaire de recherche naïf (non équilibré).

    Propriété d'invariant maintenue à CHAQUE nœud :
        toutes les valeurs du sous-arbre gauche  < valeur du nœud
        toutes les valeurs du sous-arbre droit   >= valeur du nœud
    """

    def __init__(self):
        self.root = None
        self.heap = {}  # id_ligne -> ligne complète

    # ------------------------------------------------------------------
    # Insertion — O(h)
    # ------------------------------------------------------------------
    def insert(self, value, ligne_complete=None):
        """
        Insère une valeur dans l'arbre en respectant la propriété BST,
        et stocke la ligne complète associée dans le heap.

        Implémentation itérative (et non récursive) : sur un arbre dégénéré
        en liste chaînée — précisément le cas pathologique étudié en
        section 1.2 — une version récursive atteindrait la limite de
        récursion de Python dès quelques milliers d'éléments. C'est en soi
        une illustration frappante du coût d'une hauteur h = n.
        """
        id_ligne = len(self.heap)
        self.heap[id_ligne] = ligne_complete
        new_node = Node(value, id_ligne)

        if self.root is None:
            self.root = new_node
            return

        current = self.root
        while True:
            if value < current.value:
                if current.left is None:
                    current.left = new_node
                    return
                current = current.left
            else:
                if current.right is None:
                    current.right = new_node
                    return
                current = current.right

    # ------------------------------------------------------------------
    # Recherche — O(h)
    # ------------------------------------------------------------------
    def search(self, value):
        """
        Traverse uniquement l'arbre et retourne l'id_ligne (pointeur)
        si la valeur est présente, None sinon.

        Équivalent d'un Index Scan : on localise le pointeur sans encore
        accéder à la donnée elle-même. Pour récupérer la ligne complète,
        voir get_row() ou search_row().
        """
        return self._search_recursive(self.root, value)

    def _search_recursive(self, node, value):
        if node is None:
            return None
        if value == node.value:
            return node.id_ligne
        if value < node.value:
            return self._search_recursive(node.left, value)
        else:
            return self._search_recursive(node.right, value)

    def get_row(self, id_ligne):
        """Accès au heap : récupère la ligne complète à partir d'un id_ligne."""
        return self.heap.get(id_ligne)

    def search_row(self, value):
        """
        Recherche complète en deux temps : Index Scan (search) puis
        accès heap (get_row). C'est l'équivalent d'un Index Scan PostgreSQL
        qui traverse le B+tree puis va chercher la ligne dans la table.
        """
        id_ligne = self.search(value)
        if id_ligne is None:
            return None
        return self.get_row(id_ligne)

    # ------------------------------------------------------------------
    # Suppression — O(h)
    # ------------------------------------------------------------------
    def delete(self, value):
        """
        Supprime une valeur de l'arbre si elle est présente, et retire
        également la ligne correspondante du heap pour éviter toute
        fuite de données (un nœud supprimé ne doit plus laisser de trace
        accessible).
        """
        self.root, id_ligne_supprimee = self._delete_recursive(self.root, value)
        if id_ligne_supprimee is not None:
            self.heap.pop(id_ligne_supprimee, None)

    def _delete_recursive(self, node, value):
        """
        Retourne un tuple (nouveau_sous_arbre, id_ligne_supprimee).

        Le deuxième élément du tuple est nécessaire car, dans le cas à deux
        enfants, on remplace la VALEUR du nœud par celle de son successeur
        mais on supprime physiquement le nœud successeur : c'est donc
        l'id_ligne du successeur (et non celui du nœud de départ) qui doit
        être retiré du heap.
        """
        if node is None:
            return None, None

        if value < node.value:
            node.left, id_supprimee = self._delete_recursive(node.left, value)
            return node, id_supprimee
        elif value > node.value:
            node.right, id_supprimee = self._delete_recursive(node.right, value)
            return node, id_supprimee
        else:
            # Nœud trouvé : trois cas classiques de suppression dans un BST
            id_supprimee = node.id_ligne

            if node.left is None:
                return node.right, id_supprimee
            if node.right is None:
                return node.left, id_supprimee

            # Deux enfants : on remplace par le plus petit du sous-arbre droit
            successor = self._min_node(node.right)
            node.value = successor.value
            node.id_ligne = successor.id_ligne  # le nœud hérite du pointeur du successeur
            node.right, _ = self._delete_recursive(node.right, successor.value)
            return node, id_supprimee

    def _min_node(self, node):
        while node.left is not None:
            node = node.left
        return node

    # ------------------------------------------------------------------
    # Parcours in-order — produit les valeurs dans l'ordre croissant
    # ------------------------------------------------------------------
    def inorder_traversal(self, with_rows=False):
        """
        Visite récursivement : sous-arbre gauche, nœud courant, sous-arbre droit.

        Conséquence directe de la propriété BST : ce parcours produit
        systématiquement les valeurs en ordre croissant, sans aucun tri
        explicite. C'est cette propriété qui permet à un BST de répondre
        nativement aux requêtes ORDER BY et aux requêtes de plage.

        Si with_rows=True, retourne une liste de tuples (value, ligne_complete)
        au lieu d'une simple liste de clés — utile pour reconstituer un
        résultat de requête triée, ligne par ligne, comme le ferait
        PostgreSQL en parcourant les feuilles chaînées d'un B+tree.
        """
        result = []
        self._inorder_recursive(self.root, result, with_rows)
        return result

    def _inorder_recursive(self, node, result, with_rows):
        if node is None:
            return
        self._inorder_recursive(node.left, result, with_rows)
        if with_rows:
            result.append((node.value, self.heap.get(node.id_ligne)))
        else:
            result.append(node.value)
        self._inorder_recursive(node.right, result, with_rows)

    # ------------------------------------------------------------------
    # Hauteur — paramètre central déterminant le coût de toute opération
    # ------------------------------------------------------------------
    def height(self):
        """
        Hauteur de l'arbre = nombre maximal d'arêtes entre la racine et une feuille.
        Un arbre vide a une hauteur de -1, un arbre à un seul nœud a une hauteur de 0.

        Implémentation itérative (parcours en largeur), pour la même raison
        que l'insertion : un arbre dégénéré casserait une version récursive.
        """
        if self.root is None:
            return -1

        max_height = -1
        queue = [(self.root, 0)]
        while queue:
            node, depth = queue.pop()
            max_height = max(max_height, depth)
            if node.left is not None:
                queue.append((node.left, depth + 1))
            if node.right is not None:
                queue.append((node.right, depth + 1))
        return max_height

    def size(self):
        """
        Nombre total de nœuds dans l'arbre.

        Reflète le nombre de clés réellement présentes dans l'arbre — et
        non la taille du heap, qui peut être légèrement supérieure si des
        suppressions ont laissé des trous d'id_ligne non réutilisés.
        """
        return self._size_recursive(self.root)

    def _size_recursive(self, node):
        if node is None:
            return 0
        return 1 + self._size_recursive(node.left) + self._size_recursive(node.right)


# ── AVL ───────────────────────────────────────────────────────────────────────

class NodeAVL:
    """Un nœud d'arbre AVL : une clé, un pointeur heap, et sa hauteur locale."""

    def __init__(self, value, id_ligne=None):
        self.value = value
        self.id_ligne = id_ligne
        self.left = None
        self.right = None
        self.height = 0


class AVLTree:
    """
    Arbre binaire de recherche auto-équilibré (AVL).

    Garantit h <= 1.44 * log2(n) quel que soit l'ordre d'insertion,
    contrairement au BST naïf qui peut dégénérer jusqu'à h = n - 1.
    """

    def __init__(self):
        self.root = None
        self.heap = {}

    # ------------------------------------------------------------------
    # Utilitaires de hauteur et de facteur d'équilibre
    # ------------------------------------------------------------------
    def _h(self, node):
        """Hauteur d'un nœud, -1 pour un nœud absent (convention standard)."""
        return node.height if node is not None else -1

    def _maj_hauteur(self, node):
        node.height = 1 + max(self._h(node.left), self._h(node.right))

    def _facteur_equilibre(self, node):
        """hauteur(gauche) - hauteur(droite). Doit rester dans {-1, 0, 1}."""
        return self._h(node.left) - self._h(node.right)

    # ------------------------------------------------------------------
    # Les 4 rotations — chacune réarrange 3 nœuds sans changer l'ordre in-order
    # ------------------------------------------------------------------
    def _rotation_droite(self, y):
        """Rotation simple droite (cas LL) : le sous-arbre gauche est trop profond à gauche."""
        x = y.left
        y.left = x.right
        x.right = y
        self._maj_hauteur(y)
        self._maj_hauteur(x)
        return x  # x devient la nouvelle racine du sous-arbre

    def _rotation_gauche(self, x):
        """Rotation simple gauche (cas RR) : le sous-arbre droit est trop profond à droite."""
        y = x.right
        x.right = y.left
        y.left = x
        self._maj_hauteur(x)
        self._maj_hauteur(y)
        return y

    def _rebalancer(self, node):
        """
        Calcule le facteur d'équilibre et applique la rotation adéquate
        si nécessaire. Les cas LR et RL sont des rotations doubles,
        construites à partir des deux rotations simples ci-dessus.
        """
        self._maj_hauteur(node)
        facteur = self._facteur_equilibre(node)

        # Cas gauche trop profond
        if facteur > 1:
            if self._facteur_equilibre(node.left) < 0:
                # Cas LR : le sous-arbre gauche est trop profond à droite
                node.left = self._rotation_gauche(node.left)
            # Cas LL (ou LR après la rotation préparatoire ci-dessus)
            return self._rotation_droite(node)

        # Cas droit trop profond
        if facteur < -1:
            if self._facteur_equilibre(node.right) > 0:
                # Cas RL : le sous-arbre droit est trop profond à gauche
                node.right = self._rotation_droite(node.right)
            # Cas RR (ou RL après la rotation préparatoire ci-dessus)
            return self._rotation_gauche(node)

        return node  # déjà équilibré, aucune rotation nécessaire

    # ------------------------------------------------------------------
    # Insertion — O(log n) garanti, rééquilibrage en remontant la récursion
    # ------------------------------------------------------------------
    def insert(self, value, ligne_complete=None):
        id_ligne = len(self.heap)
        self.heap[id_ligne] = ligne_complete
        self.root = self._insert_recursive(self.root, value, id_ligne)

    def _insert_recursive(self, node, value, id_ligne):
        if node is None:
            return NodeAVL(value, id_ligne)

        if value < node.value:
            node.left = self._insert_recursive(node.left, value, id_ligne)
        else:
            node.right = self._insert_recursive(node.right, value, id_ligne)

        # Rééquilibrage en remontant : c'est ce qui garantit h = O(log n)
        return self._rebalancer(node)

    # ------------------------------------------------------------------
    # Recherche — O(log n) garanti, identique au BST naïf
    # ------------------------------------------------------------------
    def search(self, value):
        return self._search_recursive(self.root, value)

    def _search_recursive(self, node, value):
        if node is None:
            return None
        if value == node.value:
            return node.id_ligne
        if value < node.value:
            return self._search_recursive(node.left, value)
        return self._search_recursive(node.right, value)

    def search_row(self, value):
        id_ligne = self.search(value)
        return self.heap.get(id_ligne) if id_ligne is not None else None

    # ------------------------------------------------------------------
    # Parcours in-order — identique au BST naïf : l'ordre est préservé
    # par construction, les rotations ne modifient jamais cet ordre
    # ------------------------------------------------------------------
    def inorder_traversal(self, with_rows=False):
        result = []
        self._inorder_recursive(self.root, result, with_rows)
        return result

    def _inorder_recursive(self, node, result, with_rows):
        if node is None:
            return
        self._inorder_recursive(node.left, result, with_rows)
        result.append((node.value, self.heap.get(node.id_ligne)) if with_rows else node.value)
        self._inorder_recursive(node.right, result, with_rows)

    # ------------------------------------------------------------------
    # Hauteur globale de l'arbre
    # ------------------------------------------------------------------
    def height(self):
        return self._h(self.root)

    def size(self):
        return len(self.heap)


# ── B-tree ───────────────────────────────────────────────────────────────────

class NoeudBTree:
    """
    Un nœud d'un B-tree d'ordre m.

    Contient :
        - jusqu'à m-1 clés (triées), chacune associée à un id_ligne
          pointant vers la ligne complète dans le heap
        - jusqu'à m pointeurs enfants (liste vide si nœud feuille)
    """

    def __init__(self, est_feuille=True):
        self.cles = []          # liste de (clé, id_ligne), triée par clé
        self.enfants = []       # liste de NoeudBTree (vide si feuille)
        self.est_feuille = est_feuille

    @property
    def nb_cles(self):
        return len(self.cles)


class BTree:
    """
    B-tree d'ordre m (= nombre maximal d'enfants par nœud).

    Paramètre m :
        - Pédagogique : m=4 ou m=5 (arbre petit, facile à visualiser)
        - Production  : m=100 à 200 (un nœud = une page disque de 4–16 Ko)
    """

    def __init__(self, m=5):
        assert m >= 3, "L'ordre m doit être >= 3."
        self.m = m
        self.racine = NoeudBTree(est_feuille=True)
        self.heap = {}   # id_ligne -> ligne complète

    @property
    def _min_cles(self):
        """Nombre minimum de clés par nœud interne (hors racine) : ceil(m/2) - 1."""
        return math.ceil(self.m / 2) - 1

    @property
    def _max_cles(self):
        """Nombre maximum de clés par nœud : m - 1."""
        return self.m - 1

    # ------------------------------------------------------------------
    # Insertion — O(log_m n)
    # ------------------------------------------------------------------
    def insert(self, cle, ligne_complete=None):
        """
        Insère une clé dans le B-tree en maintenant toutes les propriétés.

        Stratégie : split préventif lors de la descente ("split on the way down").
        Si la racine est pleine, elle est divisée avant l'insertion, ce qui
        augmente la hauteur de l'arbre de 1 — seul moment où la hauteur croît.
        """
        id_ligne = len(self.heap)
        self.heap[id_ligne] = ligne_complete

        if self.racine.nb_cles == self._max_cles:
            ancienne_racine = self.racine
            self.racine = NoeudBTree(est_feuille=False)
            self.racine.enfants.append(ancienne_racine)
            self._diviser_enfant(self.racine, 0)

        self._inserer_non_plein(self.racine, cle, id_ligne)

    def _diviser_enfant(self, parent, idx_enfant):
        """
        Divise l'enfant[idx_enfant] (plein) en deux nœuds, et fait monter
        la clé médiane vers parent.

        C'est l'opération fondamentale du B-tree : elle garantit que toutes
        les feuilles restent à la même profondeur après chaque insertion.
        """
        mediane_idx = self._min_cles
        enfant_plein = parent.enfants[idx_enfant]
        enfant_droit = NoeudBTree(est_feuille=enfant_plein.est_feuille)

        # La clé médiane monte vers le parent
        cle_med, id_med = enfant_plein.cles[mediane_idx]
        parent.cles.insert(idx_enfant, (cle_med, id_med))
        parent.enfants.insert(idx_enfant + 1, enfant_droit)

        # Les clés > médiane migrent dans l'enfant droit
        enfant_droit.cles = enfant_plein.cles[mediane_idx + 1:]
        enfant_plein.cles = enfant_plein.cles[:mediane_idx]

        if not enfant_plein.est_feuille:
            enfant_droit.enfants = enfant_plein.enfants[mediane_idx + 1:]
            enfant_plein.enfants = enfant_plein.enfants[:mediane_idx + 1]

    def _inserer_non_plein(self, noeud, cle, id_ligne):
        """Insère (cle, id_ligne) dans un nœud garanti non plein."""
        i = noeud.nb_cles - 1

        if noeud.est_feuille:
            noeud.cles.append((None, None))
            while i >= 0 and cle < noeud.cles[i][0]:
                noeud.cles[i + 1] = noeud.cles[i]
                i -= 1
            noeud.cles[i + 1] = (cle, id_ligne)
        else:
            while i >= 0 and cle < noeud.cles[i][0]:
                i -= 1
            i += 1
            if noeud.enfants[i].nb_cles == self._max_cles:
                self._diviser_enfant(noeud, i)
                if cle > noeud.cles[i][0]:
                    i += 1
            self._inserer_non_plein(noeud.enfants[i], cle, id_ligne)

    # ------------------------------------------------------------------
    # Recherche — O(log_m n)
    # ------------------------------------------------------------------
    def search(self, cle):
        """
        Retourne id_ligne si la clé est trouvée, None sinon.

        Dans un SGBD réel, chaque descente d'un niveau = un accès disque
        (chargement d'une page physique). La recherche binaire dans le nœud
        (entre les m-1 clés) est effectuée entièrement en RAM après ce seul
        chargement, sans coût supplémentaire.
        """
        return self._search_recursive(self.racine, cle)

    def _search_recursive(self, noeud, cle):
        i = 0
        while i < noeud.nb_cles and cle > noeud.cles[i][0]:
            i += 1
        if i < noeud.nb_cles and cle == noeud.cles[i][0]:
            return noeud.cles[i][1]
        if noeud.est_feuille:
            return None
        return self._search_recursive(noeud.enfants[i], cle)

    def search_row(self, cle):
        """Recherche complète : traverse l'arbre puis accède au heap."""
        id_ligne = self.search(cle)
        return self.heap.get(id_ligne) if id_ligne is not None else None

    # ------------------------------------------------------------------
    # Hauteur
    # ------------------------------------------------------------------
    def height(self):
        """
        Hauteur = nombre d'arêtes entre la racine et une feuille quelconque.
        Par construction du B-tree, toutes les feuilles sont à la même
        profondeur : la hauteur est donc uniforme et mesurable en O(1)
        en descendant par le premier enfant.
        """
        h, noeud = 0, self.racine
        while not noeud.est_feuille:
            noeud = noeud.enfants[0]
            h += 1
        return h

    def size(self):
        """Nombre total de clés dans l'arbre."""
        return len(self.heap)

    # ------------------------------------------------------------------
    # Parcours in-order
    # ------------------------------------------------------------------
    def inorder_traversal(self, with_rows=False):
        """
        Produit les clés dans l'ordre croissant, comme le BST et l'AVL.
        Le B-tree maintient la même propriété d'ordre : clés(enfant_i) < clé_i < clés(enfant_i+1).
        """
        result = []
        self._inorder_recursive(self.racine, result, with_rows)
        return result

    def _inorder_recursive(self, noeud, result, with_rows):
        for i in range(noeud.nb_cles):
            if not noeud.est_feuille:
                self._inorder_recursive(noeud.enfants[i], result, with_rows)
            cle, id_ligne = noeud.cles[i]
            result.append((cle, self.heap.get(id_ligne)) if with_rows else cle)
        if not noeud.est_feuille:
            self._inorder_recursive(noeud.enfants[noeud.nb_cles], result, with_rows)

    # ------------------------------------------------------------------
    # Statistiques internes — pour la démonstration pédagogique
    # ------------------------------------------------------------------
    def stats(self):
        """
        Métriques internes utiles pour visualiser le comportement du B-tree :
            nb_noeuds, nb_feuilles, hauteur, taux_remplissage (%)
        """
        nb_noeuds, nb_feuilles, total_cles = [0], [0], [0]

        def parcourir(noeud):
            nb_noeuds[0] += 1
            total_cles[0] += noeud.nb_cles
            if noeud.est_feuille:
                nb_feuilles[0] += 1
            else:
                for enfant in noeud.enfants:
                    parcourir(enfant)

        parcourir(self.racine)
        taux = (total_cles[0] / (nb_noeuds[0] * self._max_cles)) * 100
        return {
            "nb_noeuds": nb_noeuds[0],
            "nb_feuilles": nb_feuilles[0],
            "hauteur": self.height(),
            "taux_remplissage": round(taux, 1),
        }


# ── B+tree ──────────────────────────────────────────────────────────────────

class NoeudInterne:
    """
    Nœud interne du B+tree : clés de routage uniquement, pas de données.

    Rôle unique : guider la recherche vers la bonne feuille.
    La densité élevée (pas d'id_ligne stocké) permet de mettre plus de clés
    dans une même page disque -> arbre moins haut qu'un B-tree.
    """

    def __init__(self):
        self.cles = []       # clés de routage (valeurs seules, pas de pointeur)
        self.enfants = []    # liste de NoeudInterne ou NoeudFeuille

    @property
    def nb_cles(self):
        return len(self.cles)


class NoeudFeuille:
    """
    Nœud feuille du B+tree : clés + id_ligne + chaînage avec la feuille suivante.

    Toutes les données de l'arbre sont ici. Les feuilles forment une liste
    simplement liée de gauche à droite, permettant un parcours séquentiel
    sans remonter vers la racine.
    """

    def __init__(self):
        self.cles = []       # liste de (clé, id_ligne), triée par clé
        self.suivante = None # pointeur vers la feuille suivante (chaînage)

    @property
    def nb_cles(self):
        return len(self.cles)


class BPlusTree:
    """
    B+tree d'ordre m (= nombre maximal d'enfants par nœud interne).

    Les feuilles peuvent contenir jusqu'à m-1 clés (même limite que les
    nœuds internes, par souci de symétrie dans cette implémentation).
    """

    def __init__(self, m=5):
        assert m >= 3, "L'ordre m doit être >= 3."
        self.m = m
        self.racine = NoeudFeuille()   # arbre vide = une seule feuille vide
        self.heap = {}                 # id_ligne -> ligne complète
        self._premiere_feuille = self.racine  # point d'entrée de la liste chaînée

    @property
    def _max_cles(self):
        return self.m - 1

    @property
    def _min_cles_interne(self):
        return math.ceil(self.m / 2) - 1

    # ------------------------------------------------------------------
    # Insertion — O(log_m n)
    # ------------------------------------------------------------------
    def insert(self, cle, ligne_complete=None):
        """
        Insère une clé dans le B+tree.

        Contrairement au B-tree, la clé médiane qui monte dans un nœud
        interne lors d'un split de feuille est COPIÉE (pas déplacée) :
        elle reste dans la feuille pour que les feuilles couvrent la
        totalité des données, et une copie sert de clé de routage dans le
        parent. C'est la distinction copie/déplacement qui différencie
        B-tree et B+tree lors des splits.
        """
        id_ligne = len(self.heap)
        self.heap[id_ligne] = ligne_complete

        resultat = self._inserer(self.racine, cle, id_ligne)

        # Si la racine a été splitée, on crée une nouvelle racine interne
        if resultat is not None:
            cle_montante, noeud_droit = resultat
            nouvelle_racine = NoeudInterne()
            nouvelle_racine.cles = [cle_montante]
            nouvelle_racine.enfants = [self.racine, noeud_droit]
            self.racine = nouvelle_racine

    def _inserer(self, noeud, cle, id_ligne):
        """
        Insère récursivement et retourne (cle_montante, noeud_droit) si un
        split est nécessaire, None sinon.
        """
        if isinstance(noeud, NoeudFeuille):
            return self._inserer_feuille(noeud, cle, id_ligne)
        else:
            return self._inserer_interne(noeud, cle, id_ligne)

    def _inserer_feuille(self, feuille, cle, id_ligne):
        """Insère dans une feuille et splitte si elle dépasse m-1 clés."""
        # Insertion triée dans la feuille
        i = 0
        while i < feuille.nb_cles and cle > feuille.cles[i][0]:
            i += 1
        feuille.cles.insert(i, (cle, id_ligne))

        # Split si la feuille est trop pleine
        if feuille.nb_cles > self._max_cles:
            return self._splitter_feuille(feuille)
        return None

    def _splitter_feuille(self, feuille):
        """
        Divise une feuille en deux et retourne (clé_montante, feuille_droite).

        La clé montante est la PREMIÈRE clé de la feuille droite (copiée,
        pas déplacée) : elle reste dans la feuille droite ET sert de clé
        de routage dans le parent. C'est la règle B+tree.
        """
        milieu = math.ceil(feuille.nb_cles / 2)
        feuille_droite = NoeudFeuille()

        feuille_droite.cles = feuille.cles[milieu:]
        feuille.cles = feuille.cles[:milieu]

        # Chaînage : la nouvelle feuille droite s'insère dans la liste liée
        feuille_droite.suivante = feuille.suivante
        feuille.suivante = feuille_droite

        # La première clé de la feuille droite monte vers le parent (copiée)
        cle_montante = feuille_droite.cles[0][0]
        return cle_montante, feuille_droite

    def _inserer_interne(self, noeud, cle, id_ligne):
        """Descend vers l'enfant approprié et gère le split remonté."""
        i = 0
        while i < noeud.nb_cles and cle >= noeud.cles[i]:
            i += 1

        resultat = self._inserer(noeud.enfants[i], cle, id_ligne)

        if resultat is None:
            return None

        cle_montante, noeud_droit = resultat
        noeud.cles.insert(i, cle_montante)
        noeud.enfants.insert(i + 1, noeud_droit)

        # Split du nœud interne si nécessaire
        if noeud.nb_cles > self._max_cles:
            return self._splitter_interne(noeud)
        return None

    def _splitter_interne(self, noeud):
        """
        Divise un nœud interne en deux.

        Contrairement aux feuilles, la clé médiane est DÉPLACÉE vers le
        parent (pas copiée) : les nœuds internes ne stockent que des clés
        de routage, donc la médiane ne doit pas rester dans l'arbre.
        """
        milieu = self._max_cles // 2
        cle_montante = noeud.cles[milieu]

        noeud_droit = NoeudInterne()
        noeud_droit.cles = noeud.cles[milieu + 1:]
        noeud_droit.enfants = noeud.enfants[milieu + 1:]

        noeud.cles = noeud.cles[:milieu]
        noeud.enfants = noeud.enfants[:milieu + 1]

        return cle_montante, noeud_droit

    # ------------------------------------------------------------------
    # Recherche ponctuelle — O(log_m n)
    # ------------------------------------------------------------------
    def search(self, cle):
        """
        Retourne id_ligne si la clé est trouvée, None sinon.
        Traverse les nœuds internes (routage seul) puis inspecte la feuille.
        """
        feuille = self._trouver_feuille(cle)
        for c, id_ligne in feuille.cles:
            if c == cle:
                return id_ligne
        return None

    def search_row(self, cle):
        """Recherche complète : localise la feuille puis accède au heap."""
        id_ligne = self.search(cle)
        return self.heap.get(id_ligne) if id_ligne is not None else None

    def _trouver_feuille(self, cle):
        """Descend l'arbre jusqu'à la feuille qui devrait contenir la clé."""
        noeud = self.racine
        while isinstance(noeud, NoeudInterne):
            i = 0
            while i < noeud.nb_cles and cle >= noeud.cles[i]:
                i += 1
            noeud = noeud.enfants[i]
        return noeud

    # ------------------------------------------------------------------
    # Requête de plage — O(log_m n + k) où k = nombre de résultats
    # ------------------------------------------------------------------
    def range_query(self, cle_debut, cle_fin, with_rows=False):
        """
        Retourne toutes les clés dans [cle_debut, cle_fin].

        C'est l'avantage décisif du B+tree sur le B-tree :
          1. On localise la feuille de départ via l'arbre (O(log_m n))
          2. On parcourt la liste chaînée des feuilles jusqu'à cle_fin (O(k))
        Aucun retour vers la racine n'est nécessaire.

        Dans PostgreSQL, c'est exactement ce que fait un Bitmap Index Scan
        ou un Index Scan sur une requête WHERE timestamp BETWEEN t1 AND t2.
        """
        resultats = []
        feuille = self._trouver_feuille(cle_debut)

        while feuille is not None:
            for cle, id_ligne in feuille.cles:
                if cle > cle_fin:
                    return resultats
                if cle >= cle_debut:
                    if with_rows:
                        resultats.append((cle, self.heap.get(id_ligne)))
                    else:
                        resultats.append(cle)
            feuille = feuille.suivante

        return resultats

    # ------------------------------------------------------------------
    # Parcours in-order via la liste chaînée de feuilles
    # ------------------------------------------------------------------
    def inorder_traversal(self, with_rows=False):
        """
        Parcourt la liste chaînée des feuilles de gauche à droite.

        Avantage du B+tree : le parcours complet ne nécessite pas de
        traverser l'arbre en entier, juste de suivre la chaîne des feuilles.
        O(n) au lieu de O(n log_m n).
        """
        resultats = []
        feuille = self._premiere_feuille
        while feuille is not None:
            for cle, id_ligne in feuille.cles:
                if with_rows:
                    resultats.append((cle, self.heap.get(id_ligne)))
                else:
                    resultats.append(cle)
            feuille = feuille.suivante
        return resultats

    # ------------------------------------------------------------------
    # Hauteur et taille
    # ------------------------------------------------------------------
    def height(self):
        """Hauteur = niveaux de nœuds internes (les feuilles sont au niveau 0)."""
        h, noeud = 0, self.racine
        while isinstance(noeud, NoeudInterne):
            noeud = noeud.enfants[0]
            h += 1
        return h

    def size(self):
        """Nombre total de clés (= nombre d'enregistrements indexés)."""
        return len(self.heap)

    def stats(self):
        """Métriques internes pour la démonstration pédagogique."""
        nb_internes, nb_feuilles = [0], [0]

        def parcourir(noeud):
            if isinstance(noeud, NoeudInterne):
                nb_internes[0] += 1
                for enfant in noeud.enfants:
                    parcourir(enfant)
            else:
                nb_feuilles[0] += 1

        parcourir(self.racine)

        # Vérification du chaînage
        nb_feuilles_chainage, f = 0, self._premiere_feuille
        while f is not None:
            nb_feuilles_chainage += 1
            f = f.suivante

        return {
            "nb_noeuds_internes": nb_internes[0],
            "nb_feuilles": nb_feuilles[0],
            "nb_feuilles_chainage": nb_feuilles_chainage,
            "hauteur": self.height(),
            "chainage_ok": nb_feuilles[0] == nb_feuilles_chainage,
        }
