# Hidaya API — Dahiratoul Imane

Bienvenue sur l'API de l'application **Hidaya**, une plateforme de streaming audio et de gestion de contenus spirituels conçue spécifiquement pour la **Dahiratoul Imane**. 

Cette API robuste développée avec **Node.js**, **Express**, et **PostgreSQL** gère l'authentification sécurisée, un catalogue audio strict, un système de verrouillage d'albums par codes d'accès uniques, ainsi qu'un moteur de notifications multi-canal (In-App & Email).

---

## Architecture du Projet (`backend/`)

Le projet suit une architecture MVC (Modèles-Vues-Contrôleurs) découplée, propre aux API REST modernes :

```text
backend/
├── config/             # Configurations annexes
├── controllers/        # Logique métier (requêtes SQL, calculs, validations)
│   ├── accessController.js        ➔ Gestion des codes d'accès & verrous
│   ├── adminController.js         ➔ Actions d'administration & Uploads
│   ├── audioController.js         ➔ Consultations et écoutes des disciples
│   ├── userController.js          ➔ Inscription, Connexion, Déconnexion
│   ├── homeController.js          ➔ Feed de la page d'accueil (sections, compteur d'écoutes)
│   ├── notificationController.js  ➔ Gestion de la cloche in-app
│   └── playlistController.js      ➔ Gestion des albums (Playlists)
├── middleware/         # Filtres de sécurité et de traitement
│   ├── auth.js                    ➔ Vérification des Tokens JWT & Rôles
│   └── upload.js                  ➔ Configuration de Multer (fichiers .mp3/.jpg)
├── models/             # Connexion à la base de données
│   └── db.js                      ➔ Pool de connexion PostgreSQL
├── routes/             # Aiguillage des URL vers les contrôleurs
│   ├── accessRoutes.js
│   ├── adminRoutes.js
│   ├── audioRoutes.js
│   ├── favoriteRoutes.js
│   ├── homeRoutes.js
│   ├── notificationRoutes.js
│   ├── playlistRoutes.js
│   ├── themeRoutes.js
│   └── userRoutes.js
├── uploads/            # Stockage physique des fichiers audio et images
│   ├── audios/
│   └── images/
├── utils/              # Outils secondaires (Envoi de mails)
│   └── mailer.js                  ➔ Configuration et templates Nodemailer
├── .env                # Variables d'environnement secrètes (clés, bdd)
├── app.js              # Point d'entrée de l'application Express
└── package.json        # Dépendances du projet

Prise en main et Lancement
1. Prérequis
Assure-toi d'avoir installé Node.js (v18+) et PostgreSQL sur ta machine.

2. Configuration des Variables d'Environnement (.env)
À la racine du dossier backend, crée ou vérifie ton fichier .env avec les accès suivants :

Extrait de code
PORT=3000
DATABASE_URL=postgres://utilisateur:mot_de_passe@localhost:5432/nom_de_bdd
JWT_SECRET=votre_cle_secrete_ultra_securisee

# Configuration Email (Staging / Mailtrap)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=votre_user_mailtrap
SMTP_PASS=votre_pass_mailtrap
3. Installation et Démarrage
Ouvre ton terminal dans le dossier backend :

Bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur en mode développement (avec auto-reload Nodemon)
npm run dev
Le serveur démarre sur : http://localhost:3000

🔒 Règles Métier Imposées (Spécificités Dahira)
Rôles utilisateurs : user, admin, superadmin.

Catégorisation stricte (Postgres) :

Catégories principales : Enseignement, Emission, Musique spirituelle.

Sous-catégories (Seulement pour Enseignement) : Conférence, Bayane, Exclusif.

Sécurité Globale : Les tokens JWT invalidés lors d'une déconnexion sont révoqués en base de données pour empêcher toute réutilisation frauduleuse.

🧪 Protocole Complet des Tests (Postman)
Pour tester l'intégralité du cycle de l'application, configure tes requêtes sur Postman dans l'ordre suivant :

📂 MODULE 1 : Authentification
Inscription d'un Admin / User :

POST http://localhost:3000/api/auth/register

Body (JSON) : { "username": "ibrahima", "email": "disciple@test.com", "password": "password123" }

Connexion :

POST http://localhost:3000/api/auth/login

Récupère le token dans la réponse JSON.

Règle Postman : Pour toutes les routes suivantes, configure l'onglet Authorization sur Bearer Token et colle ce jeton.

📂 MODULE 2 : Catalogue & Notifications (Action Admin)
Téléverser un Audio :

POST http://localhost:3000/api/admin/audios

Authorization : Token Admin

Body : Cocher form-data (Ne pas utiliser JSON)

title (Text) : Mon premier Podcast de test

description (Text) : Une description sympa

category (Text) : Enseignement

subCategory (Text) : Bayane

audio (File) : (Sélectionner un fichier .mp3)

Vérification tâche de fond : L'API répond instantanément. Va sur ton compte Mailtrap, tu dois voir l'email de notification stylisé s'afficher.

Note l'ID de l'audio renvoyé (Ex: 4).

📂 MODULE 3 : Albums Privés & Codes d'Accès
Étape 1 : Créer et Verrouiller l'Album
Créer une Playlist/Album :

POST http://localhost:3000/api/playlists (Token Admin, JSON : { "name": "Mawlaya 2026" }). Note l'ID de l'album (Ex: 1).

Ajouter l'audio à l'album :

POST http://localhost:3000/api/playlists/1/add (JSON : { "audio_id": 4 }).

Générer un Code d'accès unique :

POST http://localhost:3000/api/access/admin/generate-code (JSON : { "playlist_id": 1 }).

Copie le code généré (Ex: DI-1-A8F299B1).

Étape 2 : Le Test du Verrou (Action Disciple)
Prends le Token d'un compte utilisateur simple (non admin).

Tente d'écouter l'audio créé : GET http://localhost:3000/api/audios/4.

Résultat attendu : L'API te bloque avec une erreur 403 Contenu privé.

Étape 3 : Déblocage de l'Album
Avec le compte de ton disciple, entre le code :

POST http://localhost:3000/api/access/unlock (JSON : { "code": "DI-1-A8F299B1" }).

Retente le GET http://localhost:3000/api/audios/4.

Résultat attendu : Le verrou saute, l'écoute est désormais autorisée et fluide !

📂 MODULE 4 : Gestion de la Cloche (In-App)
Consulter ses alertes (Disciple) :

GET http://localhost:3000/api/notifications

Renvoie la liste des audios sortis avec is_read: false.

Marquer comme lue :

PUT http://localhost:3000/api/notifications/ID_NOTIF/read

Passe le statut à true pour effacer le badge rouge de l'interface.