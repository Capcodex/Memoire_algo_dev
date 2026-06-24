# Plan d'implementation V3 — Refonte de la demo pour la soutenance

## 1. Objectif de la V3

Faire de l'application un **support d'oral clair et progressif** qui repond a la problematique centrale du memoire :

> Comment passe-t-on du BST elementaire a l'index B+Tree utilise par PostgreSQL, et pourquoi chaque evolution devient-elle necessaire ?

Le jeu de donnees IoT reste le support experimental du memoire, mais il ne constitue plus le sujet principal de la narration. Il sert uniquement a fournir des exemples concrets, des volumes et des requetes reproductibles.

La V3 doit privilegier :

- une structure visuelle identique dans chaque chapitre ;
- une visualisation principale lisible sur videoprojecteur ;
- peu de metriques, mais des metriques directement interpretables ;
- des textes courts qui servent de points d'appui a l'oral ;
- une progression explicite `BST -> AVL -> B-Tree -> B+Tree -> PostgreSQL` ;
- une conclusion qui repond clairement a la problematique du memoire.

---

## 2. Structure cible de chaque chapitre

Chaque chapitre doit suivre le meme ordre vertical afin d'eviter la concurrence entre widgets.

### Bloc A — Repere pedagogique

Un bandeau court place immediatement apres le titre :

- **Concept** : definition en une phrase ;
- **Probleme resolu** : limite de la structure precedente ;
- **Question de demonstration** : ce que l'utilisateur doit observer.

Ce bloc doit rester lisible en moins de 20 secondes et ne pas remplacer l'explication orale.

### Bloc B — Visualisation principale

- arbre ou structure sur toute la largeur disponible ;
- hauteur visuelle stable entre `480 px` et `620 px` ;
- chemin courant, noeuds modifies et evenements mis en evidence ;
- legende integree et constante ;
- aucun graphique secondaire place a cote de l'arbre.

### Bloc C — Parametres et commandes

Place sous la visualisation principale :

- sliders et presets regroupes dans une barre horizontale ;
- commandes avancees repliees dans un panneau `Parametres avances` ;
- animation et navigation dans les etapes au meme endroit ;
- maximum de quatre controles visibles simultanement.

### Bloc D — Mesures et comparaisons

- trois ou quatre metriques maximum ;
- un graphique principal, eventuellement un graphique secondaire ;
- libelles exprimant l'unite mesuree : hauteur, pages, comparaisons ou temps ;
- suppression des cartes redondantes avec le graphique.

### Bloc E — Conclusion pedagogique

Le composant commun `Ce qu'on observe / Pourquoi / A retenir` termine obligatoirement le chapitre.

Il ne doit plus apparaitre au milieu des controles ou a cote de l'arbre.

---

## 3. Lot transverse — Stabiliser les graphiques

### 3.1 Reproduire les graphiques invisibles

Le code ne contient actuellement pas de composant `BoxPlotComponent`. La premiere etape consiste donc a identifier si le terme "boxplot" designe :

- les graphiques de comparaison `app-compare-chart` ;
- les histogrammes `app-bar-chart` ;
- un graphique du notebook qui n'a pas encore ete porte dans Angular.

Ajouter une page ou un composant de test interne affichant tous les cas :

- serie vide ;
- une seule valeur ;
- valeurs identiques ;
- axe logarithmique ;
- valeurs tres grandes et tres petites ;
- redimensionnement desktop, laptop et mobile.

### 3.2 Corriger le moteur de graphiques

- garantir une hauteur minimale et un ratio SVG stable ;
- utiliser un conteneur mesurable avec `ResizeObserver` si necessaire ;
- proteger les axes logarithmiques contre `0`, les valeurs negatives et `NaN` ;
- afficher un etat vide explicite plutot qu'un SVG invisible ;
- ajouter des marges adaptees aux libelles longs ;
- empecher les graphiques de se comprimer dans les grilles ;
- verifier la lisibilite des legendes en mode soutenance.

### 3.3 Ajouter un vrai boxplot uniquement si necessaire

Si les distributions du notebook doivent etre conservees, creer un composant SVG dedie avec :

- minimum ;
- premier quartile ;
- mediane ;
- troisieme quartile ;
- maximum ;
- valeurs aberrantes optionnelles.

Le boxplot ne doit etre utilise que pour comparer une distribution reelle, jamais comme simple decoration.

### Criteres d'acceptation

- aucun graphique ne possede une hauteur nulle ;
- tous les graphiques restent visibles entre `1024 px` et `1920 px` ;
- les cas logarithmiques ne produisent ni `NaN` ni coordonnee SVG invalide ;
- des tests couvrent les domaines vides, constants et logarithmiques ;
- une verification visuelle est effectuee sur chaque route.

---

## 4. Refonte de l'introduction

### 4.1 Nouvelle narration principale

Remplacer l'axe "Du flux IoT a la decision du planner" par :

> Du BST au B+Tree de PostgreSQL : faire evoluer la structure selon le cout reel des acces.

L'introduction doit presenter successivement :

1. **Le contexte** — rechercher efficacement dans un volume croissant de donnees ;
2. **La problematique** — une complexite correcte en theorie ne garantit pas un bon comportement sur disque ;
3. **L'approche** — construire chaque arbre from scratch, mesurer, comparer puis rapprocher les resultats du planner PostgreSQL ;
4. **Le parcours** — BST, AVL, B-Tree, B+Tree, cout des index et choix du planner.

### 4.2 Presentation courte du dataset

Conserver une seule carte compacte :

- `50 000` capteurs ;
- `1 000 000` releves ;
- colonnes principales : `capteur_id`, `timestamp_utc`, `valeur`, `alerte` ;
- usage : produire des insertions ordonnees, recherches ponctuelles et requetes de plage.

Le dataset doit etre presente comme **terrain d'experimentation**, pas comme fil directeur de la demonstration.

### 4.3 Supprimer le pivot theorique de l'intro

Retirer le tableau "La complexite reste logarithmique, mais l'unite de cout change" de l'introduction.

Cette idee sera introduite plus naturellement a la fin du chapitre AVL, dans la section RAM contre disque.

### 4.4 Ajouter un schema de progression

Afficher une frise simple :

`BST non equilibre -> AVL equilibre -> B-Tree pagine -> B+Tree indexe -> choix PostgreSQL`

Chaque etape indique seulement :

- la limite precedente ;
- la nouvelle garantie ;
- le chapitre correspondant.

### Criteres d'acceptation

- la problematique du memoire est visible sans faire defiler la page ;
- le dataset occupe moins d'un quart de l'introduction ;
- le parcours complet est explicable oralement en moins de deux minutes ;
- aucun tableau theorique dense n'apparait dans l'introduction.

---

## 5. Simplification des metriques

Remplacer le composant generique affichant toutes les proprietes disponibles par des metriques selectionnees au niveau de chaque chapitre.

| Chapitre | Metriques principales a conserver |
|---|---|
| BST | nombre de cles `n`, hauteur `h`, comparaisons de la recherche |
| AVL | hauteur `h`, facteur d'equilibre maximal, rotations de l'operation |
| B-Tree | ordre `m`, hauteur/pages traversees, splits, remplissage moyen |
| B+Tree | pages verticales, feuilles parcourues, lignes retournees |
| Cout d'ecriture | temps par insertion, facteur de surcout, pages ecrites |
| PostgreSQL | lignes estimees, cout du plan retenu, type de scan |

Supprimer de la vue principale :

- nombre total de noeuds lorsqu'il est identique au nombre de cles ;
- nombre de noeuds internes sans usage dans l'explication ;
- hauteur theorique si elle est deja visible dans un graphique ;
- cout moyen estime sans unite explicite ;
- metriques cumulees qui melangent plusieurs operations sans le signaler.

Creer un composant `ChapterMetricsComponent` recevant une liste explicite de cartes :

```ts
interface ChapterMetric {
  label: string;
  value: string | number;
  unit?: string;
  explanation: string;
  accent: ChapterAccent;
}
```

Chaque carte dispose d'une infobulle ou d'une phrase courte expliquant sa signification.

---

## 6. Chapitre BST

### Reorganisation

1. repere pedagogique sur la propriete d'ordre et l'absence d'equilibrage ;
2. arbre pleine largeur ;
3. controles `n`, ordre d'insertion et recherche sous l'arbre ;
4. metriques essentielles ;
5. graphique `n` contre `h` ;
6. conclusion pedagogique finale.

### Simplifications

- retirer les panneaux qui repetent l'interpretation deja visible dans le graphique ;
- conserver les presets `trie`, `melange`, `decroissant` ;
- renommer le preset IoT en `chronologique — exemple du dataset` pour ne pas recentrer le chapitre sur l'IoT ;
- mettre en evidence le chemin de recherche plutot que toutes les metriques de construction.

### Criteres d'acceptation

- l'arbre degenere occupe le premier plan ;
- le lien `h ≈ n - 1` est compris avec le seul graphique principal ;
- la conclusion annonce clairement pourquoi l'AVL devient necessaire.

---

## 7. Chapitre AVL et section 1.4

### 7.1 Rotation Lab

- arbre pleine largeur ;
- choix `LL`, `RR`, `LR`, `RL` sous l'arbre ;
- animation avant/desiquilibre/rotation/apres ;
- afficher uniquement `hauteur`, `BF maximal` et `rotations de l'insertion` ;
- deplacer la chronologie detaillee dans un panneau repliable.

### 7.2 Comparaison BST contre AVL sur gros volumes

Etendre la plage de volume jusqu'a au moins `10^7` ou `10^8` cles.

Pour eviter de bloquer le navigateur :

- conserver les mesures exactes par construction jusqu'a un seuil raisonnable ;
- utiliser ensuite les modeles mesures/theoriques `n - 1`, `log2(n)` et `1,44 × log2(n)` ;
- distinguer visuellement les points mesures des projections ;
- proposer des presets `1 000`, `1 million`, `100 millions`.

### 7.3 RAM vs Disk Cost Explorer

- volumes de `10^3` a `10^9` ;
- comparaison RAM, SSD et HDD sur la meme hauteur ;
- afficher le nombre d'acces puis le temps estime ;
- conserver un seul graphique logarithmique ;
- expliquer en une phrase pourquoi `O(log n)` reste insuffisant lorsque chaque niveau devient une E/S.

### Criteres d'acceptation

- la difference BST/AVL reste spectaculaire au-dela d'un million de cles ;
- l'interface reste reactive pour les gros volumes ;
- les valeurs projetees sont clairement identifiees ;
- la conclusion introduit naturellement le besoin de pages larges du B-Tree.

---

## 8. Chapitre B-Tree

### 8.1 Remplacer la cascade de splits

Ajouter un controle `Nombre de cles a inserer` :

- plage recommandee : `1` a `100` pour la visualisation ;
- ordre des cles : croissant, decroissant, melange deterministe ;
- bouton `Construire` ;
- animation permettant de suivre chaque insertion ;
- compteur `insertion courante / total` ;
- marqueurs specifiques sur le noeud plein, la mediane promue et les deux pages creees.

Le preset de cascade peut rester dans les exemples avances, mais ne doit plus etre l'action principale.

### 8.2 Visualisation principale

- arbre sur toute la largeur ;
- controles d'ordre `m`, nombre de cles et ordre d'insertion en dessous ;
- animation integree ;
- metriques : hauteur, pages traversees, splits et taux de remplissage.

### 8.3 Nouveau `Disk Page Anatomy Explorer`

Representer une page de `8 KiB` avec une repartition evolutive :

1. en-tete de page ;
2. tableau des pointeurs de lignes ;
3. entrees d'index ;
4. espace libre ;
5. fragmentation ou marge reservee.

Parametres :

- taille de page ;
- taille de cle ;
- taille du pointeur/downlink ;
- taille du TID ;
- fill factor ;
- type de page `interne` ou `feuille`.

Afficher simultanement :

- octets utilises par chaque zone ;
- nombre maximal d'entrees ;
- ordre `m` derive ;
- pourcentage d'espace libre ;
- effet direct sur la hauteur estimee.

### 8.4 Nouveau `Index Entry -> TID -> Heap Tuple`

Ajouter une demonstration en trois panneaux relies :

1. **Page interne** — cle separatrice et downlink vers une page enfant ;
2. **Page feuille de l'index** — couple `cle + TID` ;
3. **Page heap** — tuple reel contenant les colonnes de la ligne.

Exemple de TID visible : `(bloc 128, position 7)`.

Interaction :

- cliquer sur une cle interne suit le downlink ;
- cliquer sur une entree feuille suit le TID ;
- la ligne cible est surlignee dans la page heap ;
- afficher la difference entre la cle indexee et les donnees non stockees dans l'index ;
- mentionner le cas `Index Only Scan` comme extension, sans l'introduire dans le parcours principal.

### Criteres d'acceptation

- l'utilisateur distingue une page interne, une feuille d'index et une page heap ;
- le TID est compris comme une adresse physique et non comme la donnee elle-meme ;
- modifier la taille de cle change visiblement la capacite de page et la hauteur ;
- la construction avec `n` cles remplace la cascade predefinie dans le parcours principal.

---

## 9. Chapitre B+Tree

### 9.1 Clarifier la structure

- arbre B+Tree pleine largeur ;
- separer visuellement les pages internes et les feuilles ;
- afficher `cle de routage` dans les noeuds internes ;
- afficher `cle + TID` dans les feuilles ;
- conserver la chaine horizontale des feuilles ;
- reutiliser le panneau heap du chapitre B-Tree pour montrer que les donnees completes restent hors de l'index.

### 9.2 Nouveau `Same Query Comparator`

Executer la meme requete sur un B-Tree et un B+Tree construits avec :

- les memes cles ;
- le meme ordre logique ;
- le meme volume ;
- une capacite de page explicitee.

Requetes a proposer :

1. `WHERE key = x` — recherche ponctuelle ;
2. `WHERE key BETWEEN a AND b` — plage courte ;
3. plage large ;
4. `ORDER BY key LIMIT k` ;
5. requete absente ou hors intervalle.

Pour chaque requete, afficher :

- chemin parcouru dans chaque arbre ;
- pages internes lues ;
- feuilles lues ;
- retours vers les parents ;
- nombre de resultats ;
- cout total en pages.

### 9.3 Resultat pedagogique attendu

- une recherche ponctuelle peut avoir un cout proche ;
- une plage met en evidence le chainage des feuilles du B+Tree ;
- `ORDER BY ... LIMIT` profite de l'ordre des feuilles ;
- les noeuds internes plus compacts augmentent le facteur de branchement.

### Criteres d'acceptation

- une seule action lance la requete sur les deux structures ;
- les animations restent synchronisees ;
- les couts utilisent les memes conventions ;
- la difference sur une plage est visible sans lire un long texte.

---

## 10. Cout des index et PostgreSQL

Ces chapitres sont deja plus proches de la structure cible. La V3 doit surtout les simplifier.

### Cout des index

- conserver benchmark, propagation des splits et arbitrage lecture/ecriture ;
- n'afficher qu'un laboratoire a la fois avec des onglets ;
- garder les controles sous la visualisation ;
- terminer par la conclusion pedagogique commune ;
- limiter les metriques a temps/insertion, facteur de surcout et pages ecrites.

### PostgreSQL

- conserver selectivite, dataset et regle du prefixe ;
- presenter le dataset IoT uniquement dans son storyboard dedie ;
- n'afficher qu'un explorateur a la fois ;
- limiter les metriques a lignes estimees, cout gagnant et plan choisi ;
- rappeler le lien entre B+Tree, TID et acces heap dans le resultat du planner.

---

## 11. Ajouter une conclusion generale

Creer une nouvelle route `/conclusion` accessible apres PostgreSQL.

### Contenu

#### Reponse a la problematique

Resumer la progression en cinq idees :

1. le BST fournit l'ordre mais pas la hauteur ;
2. l'AVL garantit la hauteur mais reste trop etroit pour le disque ;
3. le B-Tree regroupe les cles selon la taille des pages ;
4. le B+Tree specialise les feuilles pour les index et les plages ;
5. PostgreSQL choisit cet index seulement lorsque son cout estime est favorable.

#### Tableau de decision final

| Besoin | Structure ou plan | Raison principale |
|---|---|---|
| Recherche en RAM, arbre equilibre | AVL | hauteur logarithmique |
| Recherche paginee | B-Tree | facteur de branchement eleve |
| Index et requetes de plage | B+Tree | feuilles ordonnees et chainees |
| Resultat tres selectif | Index Scan | peu de pages ciblees |
| Grande partie de la table | Seq Scan | lecture sequentielle moins couteuse |

#### Limites et ouverture

- estimations pedagogiques versus cout reel du planner ;
- impact du cache, des statistiques et de la correlation physique ;
- autres index PostgreSQL : hash, BRIN, GIN et GiST ;
- necessite de mesurer avec `EXPLAIN (ANALYZE, BUFFERS)`.

### Criteres d'acceptation

- la conclusion repond explicitement a la problematique ;
- elle peut servir de derniere diapositive de soutenance ;
- elle ne contient aucun nouveau concept indispensable a la comprehension ;
- elle propose un bouton de retour au sommaire et un mode recapitulatif.

---

## 12. Architecture technique recommandee

### Nouveaux composants partages

```text
src/app/shared/
  chapter-layout/
    chapter-layout.component.ts
    concept-brief.component.ts
    chapter-controls.component.ts
  metrics/
    chapter-metrics.component.ts
  charts/
    chart-frame.component.ts
    box-plot.component.ts          # uniquement si confirme necessaire
  storage/
    disk-page-anatomy.component.ts
    tid-heap-link.component.ts
  query-comparison/
    query-comparator.component.ts
```

### Nouveaux modeles

```ts
interface ChapterConceptBrief {
  concept: string;
  problemSolved: string;
  demoQuestion: string;
}

interface DiskPageLayout {
  pageSizeBytes: number;
  headerBytes: number;
  linePointerBytes: number;
  entriesBytes: number;
  freeBytes: number;
  capacity: number;
}

interface IndexTuplePointer {
  key: number | string;
  blockNumber: number;
  offsetNumber: number;
}

interface ComparableQueryResult {
  structure: 'btree' | 'bplustree';
  internalPages: number;
  leafPages: number;
  parentReturns: number;
  resultCount: number;
  totalPageAccesses: number;
}
```

### Separation des responsabilites

- les algorithmes restent dans `core/algorithms` ;
- les calculs de volume et de pages restent dans `core/experiments` ;
- les composants de feature orchestrent les scenarios ;
- les composants partages ne contiennent aucune logique metier specifique a un chapitre ;
- les textes pedagogiques courts sont declares dans des objets de scenario testables.

---

## 13. Ordre d'implementation priorise

### Phase 0 — Reproduction et securisation

1. reproduire les graphiques invisibles ;
2. ajouter les tests de dimension et domaines SVG ;
3. definir le nouveau contrat des metriques ;
4. ajouter des tests de non-regression visuelle sur les routes principales.

### Phase 1 — Layout commun

1. creer `ChapterLayoutComponent` ;
2. creer `ConceptBriefComponent` ;
3. creer `ChapterMetricsComponent` ;
4. migrer BST puis AVL comme chapitres pilotes ;
5. valider le rendu laptop et videoprojecteur.

### Phase 2 — Narration de soutenance

1. reecrire l'introduction ;
2. ajouter le schema de progression ;
3. ajouter les explications pedagogiques courtes ;
4. creer la conclusion et l'ajouter a la navigation.

### Phase 3 — B-Tree physique

1. ajouter le nombre de cles et l'ordre d'insertion ;
2. remplacer la cascade dans le parcours principal ;
3. construire `Disk Page Anatomy Explorer` ;
4. construire le parcours `index -> TID -> heap` ;
5. ajouter les tests de capacite de page et de TID.

### Phase 4 — Comparaison B-Tree/B+Tree

1. definir les scenarios de requete communs ;
2. instrumenter les deux algorithmes avec les memes metriques ;
3. construire la vue synchronisee ;
4. ajouter ponctuel, plages et `ORDER BY LIMIT` ;
5. verifier les couts et animations.

### Phase 5 — Gros volumes et simplification finale

1. etendre les volumes AVL/RAM/disque ;
2. distinguer mesures et projections ;
3. migrer cout d'ecriture et PostgreSQL vers le layout vertical ;
4. supprimer les widgets et metriques redondants ;
5. effectuer la recette complete en mode soutenance.

---

## 14. Strategie de tests

### Tests unitaires

- domaines et echelles des graphiques ;
- calcul de capacite d'une page ;
- calcul de l'ordre `m` ;
- resolution d'un TID vers un tuple heap ;
- scenarios de requetes B-Tree/B+Tree ;
- volumes projetes AVL ;
- selection explicite des metriques par chapitre.

### Tests de composants

- ordre des blocs `concept -> arbre -> controles -> mesures -> conclusion` ;
- changement des parametres sans chevauchement ;
- presence de trois metriques au minimum et quatre au maximum ;
- affichage des etats vides et des erreurs ;
- synchronisation des deux arbres dans le comparateur.

### Recette visuelle

Verifier toutes les routes aux dimensions :

- `1024 × 768` — laptop compact ;
- `1366 × 768` — soutenance courante ;
- `1920 × 1080` — videoprojecteur Full HD ;
- `390 × 844` — navigation mobile de secours.

Verifier pour chaque chapitre :

- aucun chevauchement ;
- aucun graphique invisible ;
- arbre visible sans scroll horizontal ;
- conclusion toujours apres les mesures ;
- textes lisibles a distance ;
- controles utilisables au clavier.

---

## 15. Definition of Done de la V3

La refonte est terminee lorsque :

- l'introduction pose la problematique BST vers B+Tree/PostgreSQL ;
- le dataset IoT reste un exemple et non le sujet principal ;
- chaque chapitre suit le meme parcours vertical ;
- tous les graphiques sont visibles et testes ;
- les metriques inutiles ont ete retirees ;
- la section 1.4 montre des volumes allant jusqu'a plusieurs millions ou milliards ;
- le B-Tree peut etre construit avec un nombre de cles choisi ;
- la page disque et le TID sont compris visuellement ;
- une meme requete compare B-Tree et B+Tree ;
- chaque chapitre commence par un repere pedagogique et finit par une synthese ;
- une conclusion generale repond a la problematique du memoire ;
- les tests, le build Angular et la recette visuelle passent.
