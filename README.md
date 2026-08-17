# Hidaya

Plateforme d'écoute et de partage des audios de l'Imam Mahdi — enseignements, rappels,
émissions et musique spirituelle, classés par thème, avec albums privés à accès restreint
pour le contenu réservé à une communauté précise.

## Fonctionnalités

- **Bibliothèque audio classée par catégorie** — Enseignement (Bayane, Conférence, Rappel),
  Émission, Musique spirituelle.
- **Albums (playlists)** publics ou privés — un album privé se débloque via un code d'accès
  et un numéro de contact.
- **Favoris** et historique d'écoute (compteur de lectures par audio).
- **Recherche** par titre/description, avec pagination.
- **Notifications** — un email est envoyé aux utilisateurs lors de l'ajout d'un nouvel audio.
- **Panneau d'administration** — upload d'audios, gestion des albums, des utilisateurs et de
  leurs rôles, tableau de bord avec statistiques.
- **Lecteur audio persistant** (mini-player) qui suit la navigation dans l'application.

## Stack technique

**Backend**
- Node.js / Express 5
- PostgreSQL + Prisma ORM
- Authentification par JWT
- Stockage des fichiers (audio/images) compatible S3 — Cloudflare R2, Backblaze B2, AWS S3
  ou MinIO en local (via `@aws-sdk/client-s3` + `multer-s3`)
- Cache Redis optionnel (`ioredis`) pour la page d'accueil et les audios populaires — l'app
  fonctionne normalement même sans Redis configuré, juste sans l'accélération du cache
- Emails transactionnels via `nodemailer`

**Frontend**
- React 18 + Vite
- React Router 7
- Tailwind CSS
- Axios pour les appels API

## Prérequis

- Node.js 18+
- PostgreSQL
- Un bucket compatible S3 (Cloudflare R2 recommandé — 10 Go gratuits en permanence) ou
  MinIO en local pour le développement
- Redis (optionnel)

## Installation

```bash
git clone <url-du-repo>
cd hidaya

# Backend
cd backend
npm install
cp .env.example .env   # puis renseignez les variables (voir ci-dessous)
npx prisma generate
npx prisma migrate deploy
npm run dev

# Frontend (dans un autre terminal)
cd frontend
npm install
npm run dev
```

## Variables d'environnement (`backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | Port du serveur backend (défaut : 3000) |
| `JWT_SECRET` | Clé secrète pour signer les tokens JWT |
| `DATABASE_URL` | Chaîne de connexion PostgreSQL (format Prisma) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Configuration de l'envoi d'emails |
| `S3_ENDPOINT` | Endpoint du service de stockage (R2, B2, S3, ou MinIO en local) |
| `S3_REGION` | Région (`auto` pour R2/MinIO) |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | Identifiants du bucket |
| `S3_BUCKET` | Nom du bucket |
| `S3_FORCE_PATH_STYLE` | `true` pour MinIO, `false` pour R2/S3 |
| `S3_PUBLIC_URL` | URL publique de base pour construire les liens des fichiers |
| `REDIS_URL` | *(optionnel)* URL de connexion Redis — omettez-la pour désactiver le cache |
| `CORS_ORIGINS` | Domaines autorisés à appeler l'API, séparés par des virgules |

Voir `backend/.env.example` pour le modèle complet.

## Variables d'environnement (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | URL de base de l'API backend (ex : `https://votre-backend.onrender.com/api`) |

## Migration des fichiers vers un stockage S3

Si vous migrez d'un stockage disque local vers un bucket S3-compatible, un script est fourni :

```bash
cd backend
node scripts/migrate-to-s3.js
```

Il transfère les fichiers déjà présents dans `backend/uploads/` vers le bucket configuré et
met à jour les références en base de données.

## Déploiement

- **Frontend** : Vercel (ou tout hébergeur de sites statiques compatible Vite)
- **Backend** : Render, ou tout hébergeur Node.js — `ecosystem.config.js` est fourni pour un
  déploiement en cluster avec PM2 (`pm2 start ecosystem.config.js --env production`)
- **Base de données** : PostgreSQL managé (Render, Supabase, etc.)
- **Stockage** : Cloudflare R2, Backblaze B2 ou AWS S3

## Structure du projet

```
hidaya/
├── backend/
│   ├── controllers/     # Logique métier par ressource
│   ├── routes/           # Définition des routes Express
│   ├── middleware/       # Authentification, upload, etc.
│   ├── prisma/            # Schéma et migrations de base de données
│   ├── config/            # Clients S3 et Redis
│   ├── utils/              # Fonctions utilitaires (cache, URLs publiques, emails)
│   └── scripts/            # Scripts ponctuels (migration vers S3)
└── frontend/
    └── src/
        ├── pages/         # Pages de l'application (auth, user, admin)
        ├── components/    # Composants réutilisables
        ├── context/        # Contextes React (auth, lecteur audio)
        └── services/        # Appels à l'API
```

## Auteur

Ibrahima Ndoye — DevPioneers