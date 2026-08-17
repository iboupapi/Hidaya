const express = require('express');
const cors = require('cors');
const compression = require('compression');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const audioRoutes = require('./routes/audioRoutes');
const playlistRoutes = require('./routes/playlistRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const themeRoutes = require('./routes/themeRoutes');
const accessRoutes = require('./routes/accessRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const homeRoutes = require('./routes/homeRoutes');

const app = express();

app.use(compression());

// Nettoyage et normalisation des origines autorisées (retrait des slashs de fin)
const rawOrigins = process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:5174";
const allowedOrigins = rawOrigins
  .split(',')
  .map(origin => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

// Configuration robuste du middleware CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Autorise les requêtes sans origine (comme Postman ou requêtes serveur à serveur)
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
      callback(null, true);
    } else {
      callback(new Error(`Origine ${origin} non autorisée par CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Authorization"]
};

app.use(cors(corsOptions));

// 🔥 Gestion explicite des requêtes preflight HTTP OPTIONS pour toutes les routes
app.options(/(.*)/, cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ROUTES API
app.use('/api/auth', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/audios', audioRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/themes', themeRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/home', homeRoutes);

// Route test
app.get('/', (req, res) => {
  res.json({ message: "API Hidaya opérationnelle" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur API Hidaya lancé sur le port ${PORT}`);
});