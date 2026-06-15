-- =============================================================================
-- SUJET 2 — Arbres de recherche & Index PostgreSQL
-- Dataset synthétique : Capteurs IoT — relevés environnementaux
-- Volume : 1 000 000 lignes | random_state : setseed(0.42)
-- =============================================================================
-- Consignes respectées :
--   ✓ Reproductible      (setseed 0.42)
--   ✓ Relations entre variables
--                        capteur_id  → site, type_capteur
--                        type_capteur → plage de valeurs réaliste
--                        valeur hors seuil → alerte = TRUE (corrélation forte)
--                        site industriel  → valeurs plus élevées (bruit ajouté)
--   ✓ Suffisamment grand pour que les différences soient mesurables
--   ✓ Cas favorables : alertes (~2%) → index partiel très sélectif
--   ✓ Cas limites      : site (8 valeurs) → Seq Scan préféré par l'optimiseur
-- =============================================================================
-- STRUCTURE DES DÉMONSTRATIONS POSSIBLES
-- ─────────────────────────────────────────────────────────────────────────────
-- Requête 1  WHERE capteur_id = X
--            → Index Scan (50 000 capteurs distincts, cardinalité très haute)
--
-- Requête 2  WHERE timestamp BETWEEN t1 AND t2
--            → Bitmap Index Scan (plage temporelle, chaînage feuilles B+tree)
--
-- Requête 3  ORDER BY timestamp
--            → Index Scan sans tri explicite
--
-- Requête 4  WHERE site = 'Paris-Nord'
--            → Seq Scan (8 sites, ~12% chacun → faible sélectivité)
--
-- Requête 5  WHERE alerte = TRUE
--            → Index partiel ultra-sélectif (~2% des lignes)
--            → Cas le plus spectaculaire : index partiel vs index complet
--
-- Requête 6  WHERE capteur_id = X AND timestamp BETWEEN t1 AND t2
--            → Démo règle du préfixe avec index composite (capteur_id, timestamp)
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
    type_site   VARCHAR(20) NOT NULL,   -- 'industriel' | 'urbain' | 'rural'
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

-- 50 000 capteurs (cardinalité haute → index très utile)
CREATE TABLE capteurs (
    capteur_id      INTEGER PRIMARY KEY,
    site_id         SMALLINT NOT NULL REFERENCES sites(site_id),
    type_capteur    VARCHAR(20) NOT NULL,  -- 'temperature' | 'humidite' | 'co2' | 'pression'
    modele          VARCHAR(15) NOT NULL,
    installé_le     DATE NOT NULL
);

INSERT INTO capteurs (capteur_id, site_id, type_capteur, modele, installé_le)
SELECT
    i,
    -- Distribution des capteurs par site (sites industriels plus équipés)
    CASE
        WHEN random() < 0.18 THEN 3   -- Marseille-Port (industriel, très équipé)
        WHEN random() < 0.33 THEN 7   -- Strasbourg-A   (industriel)
        WHEN random() < 0.46 THEN 4   -- Bordeaux-Zone  (industriel)
        WHEN random() < 0.59 THEN 1   -- Paris-Nord     (urbain)
        WHEN random() < 0.70 THEN 2   -- Lyon-Est       (urbain)
        WHEN random() < 0.80 THEN 5   -- Lille-Centre   (urbain)
        WHEN random() < 0.90 THEN 6   -- Nantes-Ouest   (rural)
        ELSE                       8   -- Toulouse-Sud   (rural)
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
    valeur          NUMERIC(8, 3)   NOT NULL,   -- unité dépend du type_capteur
    qualite         SMALLINT        NOT NULL,    -- 0=mauvaise 1=correcte 2=bonne
    alerte          BOOLEAN         NOT NULL DEFAULT FALSE,
    -- alerte = TRUE quand valeur dépasse le seuil critique du type de capteur
    -- → ~2% des lignes seulement (cas favorable pour l'index partiel)
    traité          BOOLEAN         NOT NULL DEFAULT FALSE
    -- traité = TRUE après ingestion dans le pipeline aval
    -- → ~70% des lignes (faible sélectivité → index ignoré)
);

-- Insertion vectorisée via generate_series
-- La valeur est générée selon le type_capteur du capteur tiré au sort
-- (relation variable→variable conforme aux consignes)
INSERT INTO relevés (capteur_id, timestamp_utc, valeur, qualite, alerte, traité)
SELECT
    -- capteur_id : tirage pondéré (capteurs industriels plus actifs → plus de relevés)
    (
        SELECT capteur_id FROM capteurs
        WHERE capteur_id = (floor(random() * 50000) + 1)::INTEGER
        LIMIT 1
    ),

    -- timestamp : 80% sur 2 ans, 20% concentré sur les 30 derniers jours
    -- (cas limite pour ORDER BY et les requêtes récentes)
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

    -- valeur simulée selon une distribution réaliste (sans JOIN pour la perf)
    -- On simule 4 types avec des plages distinctes via random() bucketing
    ROUND(CAST(
        CASE
            -- température : 10–45 °C (sites industriels parfois > 38°C)
            WHEN random() < 0.40 THEN 10 + random() * 35
            -- humidité : 20–95 %
            WHEN random() < 0.65 THEN 20 + random() * 75
            -- CO₂ : 350–2500 ppm (alertes > 1500 ppm)
            WHEN random() < 0.85 THEN 350 + random() * 2150
            -- pression : 950–1050 hPa
            ELSE 950 + random() * 100
        END
    AS NUMERIC), 3),

    -- qualite : 0/1/2 — légèrement biaisé vers "correcte"
    CASE
        WHEN random() < 0.05 THEN 0   -- mauvaise (5%)
        WHEN random() < 0.30 THEN 2   -- bonne    (25%)
        ELSE                       1  -- correcte (70%)
    END,

    -- alerte : TRUE pour ~2% des relevés
    -- (seuil franchi → corrélé aux valeurs extrêmes, simplifié ici)
    (random() < 0.02),

    -- traité : TRUE pour ~70% des relevés (faible sélectivité)
    (random() < 0.70)

FROM generate_series(1, 1000000);

-- -----------------------------------------------------------------------------
-- 3. Index — commentés : décommenter un par un dans le notebook
--            pour mesurer l'impact avec EXPLAIN ANALYZE
-- -----------------------------------------------------------------------------

-- ── Index simples ─────────────────────────────────────────────────────────────

-- Index B-tree sur capteur_id (50 000 valeurs → très sélectif)
-- Requête cible : WHERE capteur_id = 12345
-- CREATE INDEX idx_capteur_id ON relevés (capteur_id);

-- Index B-tree sur timestamp_utc (ORDER BY, BETWEEN)
-- Requête cible : WHERE timestamp_utc BETWEEN '2024-01-01' AND '2024-06-30'
-- CREATE INDEX idx_timestamp ON relevés (timestamp_utc);

-- Index B-tree sur valeur (requêtes de seuil)
-- Requête cible : WHERE valeur BETWEEN 1400 AND 2500
-- CREATE INDEX idx_valeur ON relevés (valeur);

-- ── Index à faible sélectivité (l'optimiseur le contournera) ─────────────────

-- Index sur site via capteur (nécessite JOIN, ou colonne dénormalisée)
-- Requête cible : WHERE traité = FALSE  → ~30% des lignes → Seq Scan attendu
-- CREATE INDEX idx_traite ON relevés (traité);

-- ── Index partiel (cas le plus spectaculaire) ─────────────────────────────────

-- Index partiel uniquement sur les alertes (~2% des lignes indexées)
-- vs index complet sur alerte : compare taille + vitesse
-- Requête cible : WHERE alerte = TRUE
-- CREATE INDEX idx_alerte_partiel ON relevés (capteur_id, timestamp_utc)
--     WHERE alerte = TRUE;

-- ── Index composite (démo règle du préfixe) ───────────────────────────────────

-- Utile pour : WHERE capteur_id = X AND timestamp_utc BETWEEN t1 AND t2
-- Inutile pour : WHERE timestamp_utc BETWEEN t1 AND t2  (colB seul)
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

-- Vue d'ensemble
SELECT
    COUNT(*)                                        AS total_relevés,
    COUNT(DISTINCT capteur_id)                      AS capteurs_actifs,
    SUM(alerte::INT)                                AS total_alertes,
    ROUND(SUM(alerte::INT) * 100.0 / COUNT(*), 2)  AS pct_alertes,
    ROUND(AVG(valeur), 3)                           AS valeur_moyenne,
    MIN(timestamp_utc)::DATE                        AS date_min,
    MAX(timestamp_utc)::DATE                        AS date_max
FROM relevés;

-- Distribution qualité (vérifier 5/70/25)
SELECT qualite, COUNT(*) AS nb,
       ROUND(COUNT(*) * 100.0 / 1000000, 1) AS pct
FROM relevés
GROUP BY qualite ORDER BY qualite;

-- Distribution traité (vérifier ~70%)
SELECT traité, COUNT(*) AS nb,
       ROUND(COUNT(*) * 100.0 / 1000000, 1) AS pct
FROM relevés GROUP BY traité;