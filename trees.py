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
