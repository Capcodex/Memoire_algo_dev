# 🐘 PostgreSQL — Docker Compose

Container PostgreSQL 16 avec persistance des données et healthcheck intégré.

---

## 📋 Prérequis

- [Docker](https://docs.docker.com/get-docker/) ≥ 20.x
- [Docker Compose](https://docs.docker.com/compose/install/) ≥ 2.x

---

## ⚙️ Configuration

Les identifiants sont configurables via un fichier `.env` à créer à la racine du projet :

```env
POSTGRES_USER=admin
POSTGRES_PASSWORD=changeme
POSTGRES_DB=mydb
```

> Si le fichier `.env` est absent, les valeurs par défaut ci-dessus sont utilisées automatiquement.

---

## 🚀 Lancer le container

```bash
docker compose up -d
```

L'option `-d` lance le container en arrière-plan (mode détaché).

Pour vérifier que le container est bien démarré et en bonne santé :

```bash
docker compose ps
```

---

## 🔄 Relancer le container

### Redémarrage simple (sans recréer le container)

```bash
docker compose restart
```

### Arrêt puis redémarrage complet

```bash
docker compose down
docker compose up -d
```

### Forcer la recréation du container (après modification du `docker-compose.yml`)

```bash
docker compose up -d --force-recreate
```

---

## 🛑 Arrêter le container

Arrêt sans supprimer les données :

```bash
docker compose stop
```

Arrêt et suppression du container (les données sont conservées dans le volume) :

```bash
docker compose down
```

> ⚠️ Pour supprimer également les données (volume), ajouter le flag `-v` :
> ```bash
> docker compose down -v
> ```

---

## 🔌 Se connecter à la base

### Depuis le terminal (psql)

```bash
docker exec -it postgres psql -U admin -d mydb
```

### Depuis un client externe (DBeaver, TablePlus, etc.)

| Paramètre | Valeur            |
|-----------|-------------------|
| Host      | `localhost`       |
| Port      | `5432`            |
| User      | `admin`           |
| Password  | `changeme`        |
| Database  | `mydb`            |

---

## 🗄️ Initialiser la base de données

### Dataset complet (50 000 capteurs, 1 000 000 relevés)

```bash
docker exec -i postgres psql -U admin -d mydb < init.sql
```

> Durée estimée : 2–3 minutes.

### Échantillon de test (5 000 capteurs, 100 000 relevés)

Le script `init.sql` est transformé à la volée par `sed` pour réduire les volumes :

```bash
sed \
  -e 's/generate_series(1, 50000)/generate_series(1, 5000)/g' \
  -e 's/random() \* 50000/random() * 5000/g' \
  -e 's/generate_series(1, 1000000)/generate_series(1, 100000)/g' \
  -e 's|\* 100\.0 / 1000000|* 100.0 / 100000|g' \
  init.sql | docker exec -i postgres psql -U admin -d mydb
```

> Durée estimée : ~15 secondes. Les comportements d'index et la seed (`setseed(0.42)`) restent identiques.

> ℹ️ Si vous avez modifié les identifiants dans `.env`, remplacez `admin` et `mydb` par vos valeurs.

---

## 📂 Structure des fichiers

```
.
├── docker-compose.yml   # Configuration du container
├── .env                 # Variables d'environnement (à créer)
└── README.md            # Ce fichier
```

---

## 📝 Notes

- Les données sont persistées dans un volume Docker nommé `postgres_data`. Elles survivent aux redémarrages et suppressions du container (sauf avec `down -v`).
- Le container redémarre automatiquement en cas de crash grâce à la politique `restart: unless-stopped`.
- Le healthcheck vérifie toutes les 10 secondes que PostgreSQL est prêt à accepter des connexions.