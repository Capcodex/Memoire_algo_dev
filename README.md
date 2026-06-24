# Du BST au B+Tree de PostgreSQL

Mémoire — Algo & Dev dans la data · Ynov

---

## Sujet

Les bases de données relationnelles comme PostgreSQL atteignent des performances sub-milliseconde sur des tables de plusieurs millions de lignes. Ce n'est pas uniquement une question de matériel : c'est le résultat d'une structure de données précise, le B+Tree, qui sous-tend chaque index créé avec `CREATE INDEX`.

Ce mémoire retrace la progression algorithmique qui mène jusqu'à cette structure : pourquoi le BST dégénère sur des données ordonnées, comment l'AVL corrige ce problème en mémoire sans résoudre la contrainte disque, pourquoi le B-Tree réduit les accès I/O en regroupant plusieurs clés par page, et enfin comment le B+Tree spécialise ses nœuds pour rendre les requêtes de plage quasi-gratuites.

Chaque étape répond à la limite de la précédente. La contrainte dominante glisse des comparaisons en mémoire vers les lectures disque — la progression des structures suit exactement ce glissement.

---

## Question de recherche

> Comment la progression BST → AVL → B-Tree → B+Tree permet-elle d'expliquer le comportement des index PostgreSQL face à un dataset IoT à fort volume ?

Le terrain d'expérimentation est un dataset de relevés de capteurs : 8 sites, 5 000 capteurs, **1 million de mesures horodatées**. Les timestamps créent naturellement des données croissantes — le pire cas du BST, et un cas d'usage réaliste pour les index de séries temporelles.

---

## Résultats

| Mesure | Valeur | Contexte |
|--------|--------|----------|
| Gain en lecture | **×7 700** | 0,017 ms avec index vs 132 ms sans, sur 1 million de lignes |
| Surcoût en écriture | **×2,3** | 1 294 ms avec index vs 569 ms sans, pour 1 000 insertions |
| Seuil de sélectivité | **~10 %** | Au-delà, le planificateur PostgreSQL préfère le Seq Scan |

L'index n'est pas une solution universelle : il accélère les lectures sélectives mais alourdit chaque écriture. Le planificateur PostgreSQL arbitre en permanence entre Index Scan et Seq Scan selon la sélectivité estimée de la requête.

---

## Structure du projet

```
.
├── exploration.ipynb          # Notebook principal — expériences et graphiques
├── trees.py                   # Implémentations Python : BST, AVL, B-Tree, B+Tree
├── avl_widget.py / widget.py  # Widgets interactifs pour le notebook
│
├── docker-compose.yml         # PostgreSQL 16 (conteneur local)
├── init.sql                   # Script de génération du dataset (sites, capteurs, relevés)
├── Makefile                   # Raccourcis docker compose
│
├── cours/                     # Notes de cours et références bibliographiques
├── Memoire_Index_BTree.pdf    # Mémoire rédigé
│
└── app/                       # Démo interactive Angular (support de présentation)
```

### `exploration.ipynb` — le cœur expérimental

Le notebook contient l'ensemble des mesures qui alimentent le mémoire : comparaisons de hauteur BST/AVL sur données ordonnées vs aléatoires, impact de l'ordre `m` sur la hauteur du B-Tree, benchmarks PostgreSQL avec et sans index (`EXPLAIN ANALYZE`), courbes de sélectivité, et visualisations des rotations AVL. C'est le point d'entrée pour reproduire les expériences.

### `trees.py` — les structures en Python pur

Implémentations from scratch des quatre structures (BST, AVL, B-Tree, B+Tree) sans bibliothèque externe, conçues pour être lisibles et instrumentées : chaque opération expose sa hauteur, son facteur d'équilibre, ses rotations et son nombre de splits. Utilisées directement dans le notebook pour les expériences en mémoire.

### `init.sql` — le dataset IoT

Script SQL qui génère les trois tables avec une seed fixe (`setseed(0.42)`) pour des résultats reproductibles. Les timestamps sont générés de façon croissante pour reproduire le profil réel d'un flux IoT — et donc le pire cas du BST. Une variante allégée (100 000 relevés) est disponible pour les tests rapides.

### `app/` — la démo interactive

Application Angular qui visualise chaque structure avec des animations pas à pas : insertion, rotation, split, requête de plage. Utilisée comme support de présentation orale pour montrer en direct la dégénérescence du BST, les rotations AVL, et le parcours latéral des feuilles B+Tree. Non nécessaire pour reproduire les expériences du mémoire.

---

## Environnement Python

```bash
pip install jupyter matplotlib numpy psycopg2-binary ipywidgets
jupyter notebook exploration.ipynb
```

---

## Base de données PostgreSQL

### Lancer le conteneur

```bash
docker compose up -d
```

Configuration via `.env` (copier depuis `.env.exemple`) :

```env
POSTGRES_USER=admin
POSTGRES_PASSWORD=changeme
POSTGRES_DB=mydb
```

### Initialiser le dataset complet (1 million de relevés)

```bash
docker exec -i postgres psql -U admin -d mydb < init.sql
```

Durée estimée : 2–3 minutes.

### Variante allégée pour les tests (100 000 relevés, ~15 s)

```bash
sed \
  -e 's/generate_series(1, 50000)/generate_series(1, 5000)/g' \
  -e 's/random() \* 50000/random() * 5000/g' \
  -e 's/generate_series(1, 1000000)/generate_series(1, 100000)/g' \
  -e 's|\* 100\.0 / 1000000|* 100.0 / 100000|g' \
  init.sql | docker exec -i postgres psql -U admin -d mydb
```

### Connexion

```bash
docker exec -it postgres psql -U admin -d mydb
```

Ou via DBeaver / TablePlus sur `localhost:5432`.

---

## Démo interactive

```bash
cd app
npm ci
npm start   # localhost:4200
```

Requiert Node.js 22 LTS (fixé dans `app/.nvmrc`).
