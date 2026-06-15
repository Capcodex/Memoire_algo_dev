# Schéma de la base de données

```mermaid
erDiagram
    sites {
        SMALLINT site_id PK
        VARCHAR nom
        VARCHAR type_site
        NUMERIC latitude
        NUMERIC longitude
    }

    capteurs {
        INTEGER capteur_id PK
        SMALLINT site_id FK
        VARCHAR type_capteur
        VARCHAR modele
        DATE installe_le
    }

    releves {
        BIGSERIAL id PK
        INTEGER capteur_id FK
        TIMESTAMP timestamp_utc
        NUMERIC valeur
        SMALLINT qualite
        BOOLEAN alerte
        BOOLEAN traite
    }

    sites ||--o{ capteurs : "accueille"
    capteurs ||--o{ releves : "produit"
```

## Cardinalités

| Relation | Gauche | Droite |
|---|---|---|
| sites → capteurs | 1 site | N capteurs (8 sites, 50 000 capteurs) |
| capteurs → releves | 1 capteur | N relevés (50 000 capteurs, 1 000 000 relevés) |

## Colonnes clés pour les démos d'index

| Colonne | Table | Cardinalité | Cas d'usage |
|---|---|---|---|
| `capteur_id` | releves | Haute (50 000) | Index B-tree très sélectif |
| `timestamp_utc` | releves | Haute | `BETWEEN`, `ORDER BY` |
| `alerte` | releves | Très basse (~2% TRUE) | Index partiel spectaculaire |
| `traite` | releves | Basse (~70% TRUE) | Seq Scan attendu |
| `site_id` via capteurs | — | Très basse (8 valeurs) | Seq Scan attendu |
