# Backlog priorise — Demo interactive V3

Ce backlog traduit le fichier `PLAN_IMPLEMENTATION_REVIEW_V3.md` en un ordre de livraison executable.

## 1. Legende

### Priorites

- `P0` — indispensable pour obtenir une demo stable et exploitable a l'oral ;
- `P1` — forte valeur pedagogique, a livrer apres le socle P0 ;
- `P2` — amelioration ou approfondissement non bloquant.

### Tailles

- `S` — modification locale ;
- `M` — composant ou scenario complet ;
- `L` — refonte transversale ou nouveau laboratoire interactif.

### Statuts

- `[ ]` a faire ;
- `[~]` en cours ;
- `[x]` termine.

---

## 2. Ordre de livraison recommande

| Vague | Objectif | EPICs |
|---|---|---|
| Vague 0 | Supprimer les blocages d'affichage | EPIC 0 |
| Vague 1 | Installer le nouveau cadre pedagogique | EPIC 1, EPIC 2 |
| Vague 2 | Reorganiser la partie I | EPIC 3, EPIC 4 |
| Vague 3 | Renforcer le coeur B-Tree/B+Tree | EPIC 5, EPIC 6 |
| Vague 4 | Simplifier la fin du parcours | EPIC 7 |
| Vague 5 | Conclure et recetter la soutenance | EPIC 8, EPIC 9 |

Regle de dependance principale : ne pas migrer tous les chapitres avant d'avoir valide le layout cible sur BST et AVL.

---

# EPIC 0 — Stabilisation des graphiques

**Objectif :** aucun graphique ne doit etre invisible, compresse ou invalide avant la refonte des pages.

## `V3-001` — Reproduire les graphiques signales comme invisibles

- Statut : `[x]` Termine — axes logarithmiques invalides identifies
- Priorite : `P0`
- Taille : `S`
- Dependances : aucune

### Travail

- Identifier les routes et dimensions ou le bug apparait.
- Determiner si le terme "boxplot" designe `LineChart`, `BarChart` ou un graphique absent du portage Angular.
- Documenter les donnees, la taille du conteneur et l'etat attendu.

### Criteres d'acceptation

- le bug est reproductible par un test ou un scenario documente ;
- le composant fautif est identifie ;
- aucune correction speculative n'est engagee avant cette identification.

## `V3-002` — Creer une galerie de tests des graphiques

- Statut : `[x]` Termine — galerie interne non routee
- Priorite : `P0`
- Taille : `M`
- Dependances : `V3-001`

### Travail

- Afficher series vides, constantes, uniques, logarithmiques et de grands volumes.
- Tester les largeurs `390`, `1024`, `1366` et `1920 px`.
- Ajouter un cas avec plusieurs series et libelles longs.

### Criteres d'acceptation

- tous les cas peuvent etre controles depuis une seule page de developpement ;
- les donnees utilisees sont deterministes ;
- la galerie n'apparait pas dans la navigation de production.

## `V3-003` — Securiser les dimensions des graphiques SVG

- Statut : `[x]` Termine — hauteur minimale et ratio SVG stables
- Priorite : `P0`
- Taille : `M`
- Dependances : `V3-002`

### Travail

- Garantir une hauteur minimale.
- Ajouter un ratio stable et un conteneur non compressible.
- Utiliser `ResizeObserver` uniquement si la taille reelle doit piloter le rendu.
- Eviter qu'une grille donne une largeur ou hauteur nulle au graphique.

### Criteres d'acceptation

- aucun SVG ne possede une largeur ou hauteur nulle ;
- les courbes restent visibles dans les layouts desktop et laptop ;
- le redimensionnement ne necessite pas de rechargement.

## `V3-004` — Securiser les domaines et axes logarithmiques

- Statut : `[x]` Termine — filtrage et etats invalides explicites
- Priorite : `P0`
- Taille : `M`
- Dependances : `V3-002`

### Travail

- Filtrer ou signaler `0`, valeurs negatives, `NaN` et infinies.
- Gerer une serie avec une seule valeur.
- Gerer un domaine ou `minimum === maximum`.
- Ajouter un etat vide explicite.

### Criteres d'acceptation

- aucune coordonnee SVG n'est `NaN` ou infinie ;
- tous les cas limites possedent un test unitaire ;
- l'utilisateur comprend pourquoi une serie ne peut pas etre affichee.

## `V3-005` — Decider et implementer le vrai boxplot

- Statut : `[x]` Cloture sans ajout — aucune source boxplot ou quartile dans le notebook et l'application
- Priorite : `P2`
- Taille : `M`
- Dependances : `V3-001`

### Travail

- Confirmer qu'une distribution du notebook justifie un boxplot.
- Si oui, creer un composant affichant minimum, quartiles, mediane, maximum et valeurs aberrantes.
- Sinon, fermer la story avec la justification du non-ajout.

### Criteres d'acceptation

- le boxplot n'est ajoute que pour une comparaison statistique utile ;
- les quartiles sont testes ;
- le composant partage le meme cadre visuel que les autres graphiques.

---

# EPIC 1 — Layout pedagogique commun

**Objectif :** imposer le parcours vertical `comprendre -> visualiser -> manipuler -> mesurer -> conclure`.

## `V3-101` — Creer `ChapterLayoutComponent`

- Statut : `[x]` Termine — zones ordonnees et testees, migrations detaillees dans les EPICs suivants
- Priorite : `P0`
- Taille : `L`
- Dependances : EPIC 0

### Travail

- Definir les zones `header`, `concept`, `visual`, `controls`, `metrics`, `charts`, `conclusion`.
- Donner la pleine largeur a la visualisation principale.
- Garantir une hauteur de visualisation entre `480` et `620 px`.
- Gerer les layouts laptop, Full HD et mobile.

### Criteres d'acceptation

- l'ordre des zones est identique dans tous les chapitres pilotes ;
- aucun graphique n'est place a cote de l'arbre principal ;
- les controles apparaissent sous la visualisation ;
- le layout reste utilisable en mode soutenance.

## `V3-102` — Creer `ConceptBriefComponent`

- Statut : `[x]` Termine — utilise dans les six chapitres
- Priorite : `P0`
- Taille : `S`
- Dependances : aucune

### Travail

- Afficher `Concept`, `Probleme resolu` et `Question de demonstration`.
- Limiter chaque champ a une ou deux phrases.
- Ajouter les accents de couleur par chapitre.

### Criteres d'acceptation

- le bloc est lisible en moins de 20 secondes ;
- le contenu est accessible au clavier et aux lecteurs d'ecran ;
- aucun paragraphe long n'est accepte.

## `V3-103` — Creer `ChapterControlsComponent`

- Statut : `[x]` Termine — controles avances replies par defaut
- Priorite : `P1`
- Taille : `M`
- Dependances : `V3-101`

### Travail

- Regrouper les controles principaux horizontalement.
- Limiter a quatre controles visibles.
- Ajouter une zone repliable `Parametres avances`.
- Integrer les commandes d'animation au meme niveau.

### Criteres d'acceptation

- les controles ne masquent jamais l'arbre ;
- le groupe passe sur plusieurs lignes sans chevauchement ;
- les parametres avances sont fermes par defaut en soutenance.

## `V3-104` — Deplacer toutes les conclusions en fin de chapitre

- Statut : `[x]` Termine — une synthese finale par chapitre
- Priorite : `P0`
- Taille : `M`
- Dependances : `V3-101`

### Travail

- Retirer les panneaux pedagogiques places dans les sidebars.
- Conserver un seul bloc final `Ce qu'on observe / Pourquoi / A retenir`.
- Adapter les textes pour servir de transition vers le chapitre suivant.

### Criteres d'acceptation

- chaque chapitre possede une unique conclusion finale ;
- aucune conclusion ne concurrence les controles ;
- la phrase `A retenir` annonce la suite du parcours.

---

# EPIC 2 — Metriques essentielles

**Objectif :** supprimer les mesures redondantes ou incomprehensibles.

## `V3-201` — Creer le modele `ChapterMetric`

- Statut : `[x]` Termine — unite, explication, accent et projection
- Priorite : `P0`
- Taille : `S`
- Dependances : aucune

### Travail

- Definir `label`, `value`, `unit`, `explanation` et `accent`.
- Interdire les valeurs sans unite lorsque l'unite est necessaire.
- Distinguer metrique d'operation et metrique cumulee.

### Criteres d'acceptation

- chaque metrique expose une definition courte ;
- le type est reutilisable dans tous les chapitres ;
- les valeurs projetees peuvent etre marquees explicitement.

## `V3-202` — Creer `ChapterMetricsComponent`

- Statut : `[x]` Termine — quatre cartes maximum et aide contextuelle
- Priorite : `P0`
- Taille : `M`
- Dependances : `V3-201`

### Travail

- Afficher trois ou quatre cartes maximum.
- Ajouter une explication courte ou une infobulle.
- Uniformiser les unites et couleurs.

### Criteres d'acceptation

- le composant refuse ou signale plus de quatre metriques ;
- chaque carte reste lisible sur laptop ;
- les metriques sont navigables au clavier.

## `V3-203` — Definir les metriques autorisees par chapitre

- Statut : `[x]` Termine — metriques principales explicites par structure
- Priorite : `P0`
- Taille : `M`
- Dependances : `V3-201`

### Travail

- BST : `n`, hauteur, comparaisons.
- AVL : hauteur, BF maximal, rotations.
- B-Tree : ordre, pages/hauteur, splits, remplissage.
- B+Tree : pages verticales, feuilles, resultats.
- Ecriture : temps/insertion, facteur, pages ecrites.
- PostgreSQL : lignes estimees, cout gagnant, scan.

### Criteres d'acceptation

- aucune metrique redondante avec un graphique n'est affichee ;
- les couts possedent une unite ;
- les cumuls sont nommes comme tels.

## `V3-204` — Retirer l'ancien `MetricsCardComponent`

- Statut : `[x]` Termine — aucun consommateur restant
- Priorite : `P1`
- Taille : `M`
- Dependances : `V3-202`, migration de tous les chapitres

### Criteres d'acceptation

- aucun chapitre n'utilise l'ancien composant generique ;
- les proprietes internes des arbres peuvent rester disponibles pour les tests ;
- seule leur presentation est simplifiee.

---

# EPIC 3 — Introduction et fil narratif

**Objectif :** faire de l'intro le point de depart oral de la problematique du memoire.

## `V3-301` — Reecrire le hero de l'introduction

- Statut : `[x]` Termine — problematique BST vers B+Tree/PostgreSQL au premier plan
- Priorite : `P0`
- Taille : `M`
- Dependances : `V3-102`

### Travail

- Centrer le titre sur l'evolution BST vers B+Tree PostgreSQL.
- Presenter contexte, problematique et approche.
- Retirer le flux IoT comme sujet principal.

### Criteres d'acceptation

- la problematique est visible sans scroll ;
- le texte peut etre lu oralement en moins d'une minute ;
- les termes BST, B+Tree et PostgreSQL sont presents.

## `V3-302` — Reduire la presentation du dataset

- Statut : `[x]` Termine — une carte terrain d'experimentation
- Priorite : `P0`
- Taille : `S`
- Dependances : `V3-301`

### Travail

- Creer une seule carte compacte.
- Afficher `50 000` capteurs, `1 000 000` releves et les colonnes principales.
- Expliquer que le dataset sert de terrain experimental.

### Criteres d'acceptation

- le dataset occupe moins d'un quart de la page d'introduction ;
- il n'est plus utilise dans le titre principal ;
- les trois familles de requetes sont mentionnees.

## `V3-303` — Supprimer le tableau du pivot theorique

- Statut : `[x]` Termine — transition RAM/disque deplacee dans la section 1.4
- Priorite : `P0`
- Taille : `S`
- Dependances : aucune

### Travail

- Retirer le tableau dense de l'introduction.
- Replacer la transition RAM/disque dans la section 1.4.

### Criteres d'acceptation

- aucun tableau theorique dense ne reste dans l'intro ;
- l'idee n'est pas perdue mais deplacee dans le bon chapitre.

## `V3-304` — Ajouter la frise d'evolution des structures

- Statut : `[x]` Termine — six etapes navigables
- Priorite : `P0`
- Taille : `M`
- Dependances : `V3-301`

### Travail

- Afficher `BST -> AVL -> B-Tree -> B+Tree -> PostgreSQL`.
- Indiquer pour chaque etape la limite precedente et la nouvelle garantie.
- Rendre chaque etape navigable.

### Criteres d'acceptation

- la progression est comprise sans tableau comparatif ;
- chaque etape ouvre le chapitre correspondant ;
- la frise reste lisible sur laptop.

---

# EPIC 4 — Refonte de la partie I

**Objectif :** valider le layout V3 sur BST et AVL, puis rendre les gros volumes convaincants.

## `V3-401` — Migrer le chapitre BST vers le layout vertical

- Statut : `[x]` Termine — arbre pleine largeur et splitters supprimes
- Priorite : `P0`
- Taille : `L`
- Dependances : EPIC 1, EPIC 2

### Travail

- Placer l'arbre en pleine largeur.
- Deplacer `n`, ordre et recherche sous l'arbre.
- Conserver un seul graphique `n -> h`.
- Renommer le preset IoT en exemple chronologique du dataset.

### Criteres d'acceptation

- le cas pathologique constitue le premier visuel ;
- les controles ne sont plus en sidebar ;
- seules trois metriques sont visibles ;
- la conclusion introduit l'AVL.

## `V3-402` — Migrer le Rotation Lab AVL

- Statut : `[x]` Termine — rotations sous l'arbre et chronologie repliee
- Priorite : `P0`
- Taille : `L`
- Dependances : `V3-401`

### Travail

- Placer l'arbre en pleine largeur.
- Deplacer LL/RR/LR/RL sous l'arbre.
- Garder hauteur, BF maximal et rotations.
- Replier la chronologie detaillee.

### Criteres d'acceptation

- les quatre rotations restent demonstrables ;
- l'etat avant/apres est visible sans sidebars ;
- la rotation courante est explicable en moins de 30 secondes.

## `V3-403` — Etendre BST contre AVL aux gros volumes

- Statut : `[x]` Termine — mesures jusqu'a 10 000 puis projections jusqu'a 100 millions
- Priorite : `P0`
- Taille : `L`
- Dependances : `V3-004`

### Travail

- Ajouter presets `1 000`, `1 million`, `100 millions`.
- Calculer exactement sous un seuil securise.
- Utiliser les modeles theoriques au-dela.
- Distinguer visuellement mesures et projections.

### Criteres d'acceptation

- l'interface ne bloque pas sur `10^8` cles ;
- le statut mesure/projection est visible ;
- la difference BST/AVL reste lisible sur le graphique.

## `V3-404` — Etendre RAM vs Disk jusqu'a `10^9`

- Statut : `[x]` Termine — estimation non bloquante jusqu'a un milliard
- Priorite : `P0`
- Taille : `M`
- Dependances : `V3-004`

### Travail

- Etendre le volume `10^3 -> 10^9`.
- Afficher le nombre d'acces puis le temps RAM/SSD/HDD.
- Conserver un seul graphique logarithmique.

### Criteres d'acceptation

- `10^9` est selectionnable sans construction reelle de l'arbre ;
- les trois supports utilisent la meme hauteur ;
- la conclusion annonce le passage au B-Tree pagine.

---

# EPIC 5 — B-Tree, pages disque et TID

**Objectif :** rendre concret le passage de l'arbre logique aux pages et aux donnees physiques.

## `V3-501` — Ajouter le nombre de cles a inserer

- Statut : `[x]` Termine — 1 a 100 cles et trois ordres deterministes
- Priorite : `P0`
- Taille : `M`
- Dependances : EPIC 1

### Travail

- Ajouter `n` entre `1` et `100`.
- Ajouter ordre croissant, decroissant et melange determine.
- Ajouter bouton `Construire` et progression `i/n`.

### Criteres d'acceptation

- l'utilisateur choisit le volume avant la construction ;
- chaque insertion reste rejouable ;
- le scenario est reproductible.

## `V3-502` — Remplacer la cascade de splits dans le parcours principal

- Statut : `[x]` Termine — construction parametree principale, cascade avancee
- Priorite : `P0`
- Taille : `M`
- Dependances : `V3-501`

### Travail

- Faire de la construction parametree l'action principale.
- Deplacer la cascade dans les presets avances.
- Surligner noeud plein, mediane et nouvelles pages.

### Criteres d'acceptation

- aucun bouton principal ne s'appelle `Cascade de splits` ;
- un split peut etre explique pas a pas ;
- le nombre de splits est affiche comme metrique d'operation.

## `V3-503` — Migrer le B-Tree vers le layout vertical

- Statut : `[x]` Termine — arbre, controles, metriques puis explorateurs
- Priorite : `P0`
- Taille : `L`
- Dependances : `V3-501`, `V3-202`

### Travail

- Arbre pleine largeur.
- Ordre, volume et insertion sous l'arbre.
- Metriques puis graphiques.
- Conclusion en fin de chapitre.

### Criteres d'acceptation

- aucune sidebar ne concurrence l'arbre ;
- les controles restent visibles sur laptop ;
- hauteur, pages, splits et remplissage sont les seules metriques.

## `V3-504` — Modeliser la repartition d'une page disque

- Statut : `[x]` Termine — octets, capacite, ordre et hauteur testes
- Priorite : `P0`
- Taille : `L`
- Dependances : aucune

### Travail

- Calculer en-tete, line pointers, entrees, espace libre et fill factor.
- Distinguer page interne et feuille.
- Deriver capacite et ordre `m`.

### Criteres d'acceptation

- la somme des zones correspond a la taille de page ;
- aucun nombre d'octets n'est negatif ;
- la capacite diminue lorsque la cle ou le TID grandit ;
- les calculs sont couverts par des tests unitaires.

## `V3-505` — Construire `Disk Page Anatomy Explorer`

- Statut : `[x]` Termine — page evolutive interne ou feuille
- Priorite : `P0`
- Taille : `L`
- Dependances : `V3-504`

### Travail

- Afficher la page sous forme de zones proportionnelles.
- Ajouter sliders page, cle, pointeur, TID et fill factor.
- Afficher capacite, ordre, espace libre et hauteur estimee.

### Criteres d'acceptation

- chaque slider modifie la page en temps reel ;
- les zones restent lisibles lorsqu'elles sont tres petites ;
- la page PostgreSQL `8 KiB` est disponible comme preset.

## `V3-506` — Modeliser le lien `Index -> TID -> Heap`

- Statut : `[x]` Termine — resolution deterministe des adresses physiques
- Priorite : `P0`
- Taille : `M`
- Dependances : `V3-504`

### Travail

- Creer un modele de page interne, feuille d'index et page heap.
- Representer le TID par `(blockNumber, offsetNumber)`.
- Resoudre un TID vers un tuple deterministe.

### Criteres d'acceptation

- chaque entree feuille pointe vers exactement un tuple ;
- un TID absent produit un etat explicite ;
- le modele distingue cle indexee et payload heap.

## `V3-507` — Construire le widget interactif TID

- Statut : `[x]` Termine — downlink, feuille, TID et tuple surligne
- Priorite : `P0`
- Taille : `L`
- Dependances : `V3-506`

### Travail

- Afficher page interne, feuille et heap en trois panneaux.
- Permettre de suivre downlink puis TID par clic.
- Surligner la ligne heap cible.

### Criteres d'acceptation

- le parcours complet est visible sans texte long ;
- le TID est presente comme une adresse physique ;
- l'utilisateur comprend que le tuple complet n'est pas dans l'index.

## `V3-508` — Ajouter l'extension `Index Only Scan`

- Statut : `[x]` Termine — explication repliee hors parcours principal
- Priorite : `P2`
- Taille : `S`
- Dependances : `V3-507`

### Travail

- Ajouter un encart replie expliquant les colonnes couvertes et la visibility map.
- Ne pas interrompre le scenario principal.

---

# EPIC 6 — Comparaison B-Tree/B+Tree sur une meme requete

**Objectif :** montrer la difference structurelle par les acces reels d'une requete identique.

## `V3-601` — Definir les scenarios de requetes communs

- Statut : `[x]` Termine — ponctuelle, deux plages, ORDER BY LIMIT et absence
- Priorite : `P0`
- Taille : `M`
- Dependances : EPIC 5

### Travail

- Recherche ponctuelle.
- Plage courte.
- Plage large.
- `ORDER BY key LIMIT k`.
- Cle absente ou intervalle vide.

### Criteres d'acceptation

- les deux arbres recoivent exactement la meme requete ;
- les donnees et parametres sont identiques ;
- les resultats attendus sont testes.

## `V3-602` — Instrumenter les acces des deux arbres

- Statut : `[x]` Termine — internes, feuilles, retours et total communs
- Priorite : `P0`
- Taille : `L`
- Dependances : `V3-601`

### Travail

- Compter pages internes, feuilles, retours parents et total.
- Conserver le chemin d'animation.
- Utiliser les memes definitions de cout.

### Criteres d'acceptation

- les metriques sont comparables directement ;
- aucune structure ne beneficie d'une convention differente ;
- les plages B+Tree suivent la chaine de feuilles.

## `V3-603` — Construire `Same Query Comparator`

- Statut : `[x]` Termine — execution et etape synchronisees
- Priorite : `P0`
- Taille : `L`
- Dependances : `V3-602`

### Travail

- Afficher les deux structures dans des vues synchronisees.
- Lancer les animations avec une seule action.
- Afficher les couts sous les arbres.

### Criteres d'acceptation

- les animations restent synchronisees ;
- les chemins actifs sont visibles ;
- une plage montre clairement le gain du chainage B+Tree ;
- le rendu reste lisible sur `1366 × 768`.

## `V3-604` — Migrer le chapitre B+Tree vers le layout vertical

- Statut : `[x]` Termine — arbre, chaine, comparateur et TID
- Priorite : `P0`
- Taille : `L`
- Dependances : `V3-603`, `V3-507`

### Travail

- B+Tree pleine largeur.
- Parametres sous l'arbre.
- Reutiliser le widget TID/heap.
- Remplacer les comparaisons redondantes par le comparateur de requetes.

### Criteres d'acceptation

- page interne, feuille et heap sont distinguees ;
- seules pages verticales, feuilles et resultats sont affichees ;
- la conclusion prepare le cout des ecritures.

---

# EPIC 7 — Simplification des chapitres finaux

**Objectif :** conserver la richesse des EPICs 7 et 8 existants sans empiler les laboratoires.

## `V3-701` — Transformer le cout des index en onglets

**Statut :** `[x] Termine` — trois laboratoires exclusifs, controles sous le visuel et metriques contextuelles.

- Priorite : `P1`
- Taille : `M`
- Dependances : EPIC 1, EPIC 2

### Travail

- Onglets `Benchmark`, `Propagation`, `Compromis`.
- N'afficher qu'un laboratoire a la fois.
- Placer controles sous le visuel.

### Criteres d'acceptation

- aucun laboratoire ne se superpose ;
- l'etat de chaque onglet est conserve ;
- seules trois metriques essentielles sont affichees.

## `V3-702` — Transformer PostgreSQL en onglets

**Statut :** `[x] Termine` — trois explorateurs exclusifs et parcours index → TID → tuple heap explicite.

- Priorite : `P1`
- Taille : `M`
- Dependances : EPIC 1, EPIC 2

### Travail

- Onglets `Selectivite`, `Dataset`, `Prefixe gauche`.
- N'afficher qu'un explorateur a la fois.
- Reconnecter le resultat au TID et a l'acces heap.

### Criteres d'acceptation

- le dataset reste limite a son onglet ;
- les trois plans restent demonstrables ;
- seules lignes estimees, cout et scan sont visibles.

## `V3-703` — Uniformiser les conclusions de transition

**Statut :** `[x] Termine` — transitions courtes du cout d'ecriture vers le planner, puis vers la conclusion generale.

- Priorite : `P1`
- Taille : `S`
- Dependances : `V3-701`, `V3-702`

### Criteres d'acceptation

- le cout des ecritures prepare le planner ;
- PostgreSQL prepare la conclusion generale ;
- aucun texte ne depasse trois phrases par colonne.

---

# EPIC 8 — Conclusion generale

**Objectif :** repondre explicitement a la problematique et fournir la derniere diapositive de l'oral.

## `V3-801` — Creer la route `/conclusion`

- Priorite : `P0`
- Taille : `M`
- Dependances : EPIC 3 a EPIC 7

### Travail

- Ajouter la route et la navigation.
- Ajouter precedent, retour sommaire et recommencer.
- Integrer le mode soutenance.

### Criteres d'acceptation

- la conclusion est accessible apres PostgreSQL ;
- les raccourcis clavier fonctionnent ;
- le chapitre apparait dans la progression globale.

## `V3-802` — Rediger la reponse finale a la problematique

- Priorite : `P0`
- Taille : `M`
- Dependances : `V3-801`

### Travail

- Resumer BST, AVL, B-Tree, B+Tree et planner en cinq etapes.
- Ajouter le tableau de decision final.
- Ajouter limites et ouvertures.

### Criteres d'acceptation

- aucun nouveau concept indispensable n'est introduit ;
- la reponse tient sur un ecran Full HD ;
- la page peut servir de derniere diapositive.

## `V3-803` — Ajouter un mode recapitulatif

- Priorite : `P2`
- Taille : `M`
- Dependances : `V3-802`

### Travail

- Afficher les cinq idees sous forme de cartes navigables.
- Permettre de revenir au chapitre correspondant.

---

# EPIC 9 — Recette de soutenance et qualite

**Objectif :** garantir une demo fiable, lisible et pilotable le jour de l'oral.

## `V3-901` — Ajouter les tests de structure des chapitres

- Priorite : `P0`
- Taille : `M`
- Dependances : EPIC 1

### Travail

- Verifier l'ordre `concept -> arbre -> controles -> mesures -> conclusion`.
- Verifier le maximum de quatre metriques.
- Verifier la presence de la conclusion finale.

## `V3-902` — Ajouter les tests des gros volumes

- Priorite : `P0`
- Taille : `M`
- Dependances : `V3-403`, `V3-404`

### Criteres d'acceptation

- aucun arbre de `10^8` ou `10^9` elements n'est construit en memoire ;
- les projections sont deterministes ;
- les calculs se terminent sans blocage de l'interface.

## `V3-903` — Ajouter les tests page disque et TID

- Priorite : `P0`
- Taille : `M`
- Dependances : `V3-504`, `V3-506`

### Criteres d'acceptation

- les zones d'une page totalisent sa taille ;
- tous les TID valides resolvent un tuple ;
- les cas invalides sont geres explicitement.

## `V3-904` — Effectuer la recette visuelle multi-resolution

- Priorite : `P0`
- Taille : `L`
- Dependances : toutes les stories `P0`

### Dimensions

- `1024 × 768` ;
- `1366 × 768` ;
- `1920 × 1080` ;
- `390 × 844`.

### Criteres d'acceptation

- aucun chevauchement ;
- aucun graphique invisible ;
- aucun scroll horizontal sur l'arbre principal ;
- controles et textes lisibles a distance ;
- navigation clavier et mode soutenance fonctionnels.

## `V3-905` — Effectuer la recette complete du parcours oral

- Priorite : `P0`
- Taille : `M`
- Dependances : `V3-904`, EPIC 8

### Travail

- Jouer la demonstration de l'introduction a la conclusion.
- Verifier tous les presets utilises a l'oral.
- Chronometrer les transitions et identifier les attentes longues.
- Preparer un chemin de secours si une animation echoue.

### Criteres d'acceptation

- le parcours complet ne contient aucune impasse ;
- chaque chapitre possede une manipulation principale stable ;
- les tests et le build Angular passent ;
- la conclusion repond explicitement a la problematique.

---

## 3. Minimum Viable Soutenance

La V3 est presentable des que les stories suivantes sont terminees :

- `V3-001` a `V3-004` — graphiques stables ;
- `V3-101`, `V3-102`, `V3-104` — layout pedagogique ;
- `V3-201` a `V3-203` — metriques essentielles ;
- `V3-301` a `V3-304` — nouvelle introduction ;
- `V3-401` a `V3-404` — partie I et gros volumes ;
- `V3-501` a `V3-507` — B-Tree, page et TID ;
- `V3-601` a `V3-604` — comparaison B-Tree/B+Tree ;
- `V3-801`, `V3-802` — conclusion ;
- `V3-901` a `V3-905` — recette.

Les stories `P1` simplifient fortement l'experience mais peuvent etre livrees apres ce noyau si le calendrier l'impose. Les stories `P2` ne doivent jamais retarder une story `P0`.

---

## 4. Definition of Done commune

Une story n'est consideree terminee que si :

- le comportement attendu est couvert par un test lorsque la logique est testable ;
- les textes restent courts et utilisables comme support oral ;
- le rendu est verifie au minimum en `1366 × 768` et `1920 × 1080` ;
- les controles sont utilisables au clavier ;
- les donnees aleatoires utilisent une seed ou un scenario deterministe ;
- les valeurs mesurees et projetees sont distinguees ;
- aucun nouveau widget ne concurrence la visualisation principale ;
- `npm test` et `npm run build` passent.
