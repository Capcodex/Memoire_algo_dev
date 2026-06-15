# ─────────────────────────────────────────────────────────────────────────────
# Config — surchargeables via variables d'environnement ou fichier .env
# ─────────────────────────────────────────────────────────────────────────────
POSTGRES_USER     ?= admin
POSTGRES_PASSWORD ?= changeme
POSTGRES_DB       ?= mydb
CONTAINER         := postgres

PSQL := docker exec -i $(CONTAINER) psql -U $(POSTGRES_USER) -d $(POSTGRES_DB)

.PHONY: help up down reset init sample wait logs

# ─────────────────────────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "  make up      Démarrer le container PostgreSQL"
	@echo "  make down    Arrêter le container"
	@echo "  make reset   Arrêter + supprimer le volume  ⚠️  données perdues"
	@echo "  make init    Dataset complet   : 50 000 capteurs, 1 000 000 relevés"
	@echo "  make sample  Échantillon test  :  5 000 capteurs,   100 000 relevés"
	@echo "  make logs    Logs du container"
	@echo ""

# ─────────────────────────────────────────────────────────────────────────────
up:
	docker compose up -d
	@$(MAKE) --no-print-directory wait

down:
	docker compose down

reset:
	@echo "⚠️  Suppression du volume postgres_data..."
	docker compose down -v

logs:
	docker compose logs -f postgres

# ─────────────────────────────────────────────────────────────────────────────
wait:
	@echo "Attente de PostgreSQL..."
	@until docker exec $(CONTAINER) pg_isready -U $(POSTGRES_USER) -d $(POSTGRES_DB) \
		> /dev/null 2>&1; do sleep 1; done
	@echo "PostgreSQL prêt."

# ─────────────────────────────────────────────────────────────────────────────
# Chargement complet : 50 000 capteurs + 1 000 000 relevés (~2–3 min)
# ─────────────────────────────────────────────────────────────────────────────
init: wait
	@echo "Chargement du dataset complet (50 000 capteurs, 1 000 000 relevés)..."
	@$(PSQL) < init.sql
	@echo "Terminé."

# ─────────────────────────────────────────────────────────────────────────────
# Échantillon : le SQL est généré à la volée par sed, sans fichier temporaire.
#   50 000 capteurs  →  5 000
#   1 000 000 relevés → 100 000
# Les requêtes de vérification (pct) sont également adaptées.
# ─────────────────────────────────────────────────────────────────────────────
sample: wait
	@echo "Chargement de l'échantillon (5 000 capteurs, 100 000 relevés)..."
	@sed \
		-e 's/generate_series(1, 50000)/generate_series(1, 5000)/g' \
		-e 's/random() \* 50000/random() * 5000/g' \
		-e 's/generate_series(1, 1000000)/generate_series(1, 100000)/g' \
		-e 's|\* 100\.0 / 1000000|* 100.0 / 100000|g' \
		init.sql | $(PSQL)
	@echo "Terminé."
