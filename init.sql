-- =============================================================================
-- SUJET 2 — Arbres de recherche & Index PostgreSQL
-- Dataset synthétique : Capteurs IoT — relevés environnementaux
-- Volume : 1 000 000 lignes | random_state : setseed(0.42)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Seed
-- -----------------------------------------------------------------------------
SELECT setseed(0.42);

-- -----------------------------------------------------------------------------
-- 1. Tables de référence
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS relevés    CASCADE;
DROP TABLE IF EXISTS capteurs   CASCADE;
DROP TABLE IF EXISTS sites      CASCADE;

-- Sites industriels / urbains (8 sites → faible cardinalité voulue)
CREATE TABLE sites (
    site_id     SMALLINT PRIMARY KEY,
    nom         VARCHAR(30) NOT NULL,
    type_site   VARCHAR(20) NOT NULL,
    latitude    NUMERIC(8,5),
    longitude   NUMERIC(8,5)
);

INSERT INTO sites VALUES
    (1, 'Paris-Nord',      'urbain',      48.90200,  2.34750),
    (2, 'Lyon-Est',        'urbain',      45.74800,  4.87600),
    (3, 'Marseille-Port',  'industriel',  43.30000,  5.37000),
    (4, 'Bordeaux-Zone',   'industriel',  44.85000, -0.57600),
    (5, 'Lille-Centre',    'urbain',      50.63000,  3.07000),
    (6, 'Nantes-Ouest',    'rural',       47.21800, -1.55300),
    (7, 'Strasbourg-A',    'industriel',  48.58400,  7.74600),
    (8, 'Toulouse-Sud',    'rural',       43.60000,  1.44400);

-- 50 000 capteurs
CREATE TABLE capteurs (
    capteur_id      INTEGER PRIMARY KEY,
    site_id         SMALLINT NOT NULL REFERENCES sites(site_id),
    type_capteur    VARCHAR(20) NOT NULL,
    modele          VARCHAR(15) NOT NULL,
    installé_le     DATE NOT NULL
);

INSERT INTO capteurs (capteur_id, site_id, type_capteur, modele, installé_le)
SELECT
    i,
    CASE
        WHEN random() < 0.18 THEN 3
        WHEN random() < 0.33 THEN 7
        WHEN random() < 0.46 THEN 4
        WHEN random() < 0.59 THEN 1
        WHEN random() < 0.70 THEN 2
        WHEN random() < 0.80 THEN 5
        WHEN random() < 0.90 THEN 6
        ELSE                       8
    END,
    CASE
        WHEN random() < 0.40 THEN 'temperature'
        WHEN random() < 0.65 THEN 'humidite'
        WHEN random() < 0.85 THEN 'co2'
        ELSE                       'pression'
    END,
    CASE (i % 4)
        WHEN 0 THEN 'SHT31-D'
        WHEN 1 THEN 'BME280'
        WHEN 2 THEN 'MH-Z19B'
        ELSE        'BMP390'
    END,
    DATE '2020-01-01' + (random() * 1460)::INTEGER
FROM generate_series(1, 50000) AS i;

-- -----------------------------------------------------------------------------
-- 2. Table principale : relevés (1 000 000 lignes)
-- -----------------------------------------------------------------------------
CREATE TABLE relevés (
    id              BIGSERIAL       PRIMARY KEY,
    capteur_id      INTEGER         NOT NULL REFERENCES capteurs(capteur_id),
    timestamp_utc   TIMESTAMP       NOT NULL,
    valeur          NUMERIC(8, 3)   NOT NULL,
    qualite         SMALLINT        NOT NULL,
    alerte          BOOLEAN         NOT NULL DEFAULT FALSE,
    traité          BOOLEAN         NOT NULL DEFAULT FALSE
);

-- Pré-calcul du nombre de capteurs pour le tirage LATERAL
DO $$
DECLARE
    nb_capteurs INTEGER;
BEGIN
    SELECT COUNT(*) INTO nb_capteurs FROM capteurs;

    INSERT INTO relevés (capteur_id, timestamp_utc, valeur, qualite, alerte, traité)
    SELECT
        c.capteur_id,

        CASE
            WHEN random() < 0.80 THEN
                TIMESTAMP '2023-01-01 00:00:00'
                + (random() * INTERVAL '730 days')
                + (random() * INTERVAL '86399 seconds')
            ELSE
                TIMESTAMP '2024-11-15 00:00:00'
                + (random() * INTERVAL '30 days')
                + (random() * INTERVAL '86399 seconds')
        END,

        ROUND(CAST(
            CASE
                WHEN random() < 0.40 THEN 10 + random() * 35
                WHEN random() < 0.65 THEN 20 + random() * 75
                WHEN random() < 0.85 THEN 350 + random() * 2150
                ELSE 950 + random() * 100
            END
        AS NUMERIC), 3),

        CASE
            WHEN random() < 0.05 THEN 0
            WHEN random() < 0.30 THEN 2
            ELSE                       1
        END,

        (random() < 0.02),

        (random() < 0.70)

    FROM generate_series(1, 1000000) AS g
    CROSS JOIN LATERAL (
        SELECT capteur_id
        FROM capteurs
        OFFSET (floor(random() * nb_capteurs))::INTEGER
        LIMIT 1
    ) c;
END $$;

-- -----------------------------------------------------------------------------
-- 3. Index — décommenter un par un dans le notebook
-- -----------------------------------------------------------------------------

-- Index B-tree sur capteur_id (50 000 valeurs → très sélectif)
-- CREATE INDEX idx_capteur_id ON relevés (capteur_id);

-- Index B-tree sur timestamp_utc (ORDER BY, BETWEEN)
-- CREATE INDEX idx_timestamp ON relevés (timestamp_utc);

-- Index B-tree sur valeur (requêtes de seuil)
-- CREATE INDEX idx_valeur ON relevés (valeur);

-- Index sur traité (faible sélectivité → Seq Scan attendu)
-- CREATE INDEX idx_traite ON relevés (traité);

-- Index partiel sur alertes (~2% des lignes)
-- CREATE INDEX idx_alerte_partiel ON relevés (capteur_id, timestamp_utc)
--     WHERE alerte = TRUE;

-- Index composite (démo règle du préfixe)
-- CREATE INDEX idx_capteur_timestamp ON relevés (capteur_id, timestamp_utc);

-- -----------------------------------------------------------------------------
-- 4. Statistiques
-- -----------------------------------------------------------------------------
ANALYZE relevés;
ANALYZE capteurs;
ANALYZE sites;

-- -----------------------------------------------------------------------------
-- 5. Vérifications rapides
-- -----------------------------------------------------------------------------

SELECT
    COUNT(*)                                        AS total_relevés,
    COUNT(DISTINCT capteur_id)                      AS capteurs_actifs,
    SUM(alerte::INT)                                AS total_alertes,
    ROUND(SUM(alerte::INT) * 100.0 / COUNT(*), 2)  AS pct_alertes,
    ROUND(AVG(valeur), 3)                           AS valeur_moyenne,
    MIN(timestamp_utc)::DATE                        AS date_min,
    MAX(timestamp_utc)::DATE                        AS date_max
FROM relevés;

SELECT qualite, COUNT(*) AS nb,
       ROUND(COUNT(*) * 100.0 / 1000000, 1) AS pct
FROM relevés
GROUP BY qualite ORDER BY qualite;

SELECT traité, COUNT(*) AS nb,
       ROUND(COUNT(*) * 100.0 / 1000000, 1) AS pct
FROM relevés GROUP BY traité;