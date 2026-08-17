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

// 🔥 Autoriser React à accéder à l'API
// CORS_ORIGINS attendu au format "https://domaine1.com,https://domaine2.com"
// (voir .env). En local, les valeurs par défaut couvrent Vite (5173/5174).
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:5174")
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Authorization"]
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 Note : les fichiers audio/image sont désormais servis directement depuis
// le bucket S3/R2/B2 (voir backend/utils/publicUrl.js), plus besoin de les
// servir depuis ce serveur.

// 🔥 ROUTES API
app.use('/api/auth', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/audios', audioRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/themes', themeRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/home', homeRoutes);

// 🔥 Route test
app.get('/', (req, res) => {
  res.json({ message: "API Hidaya opérationnelle" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur API Hidaya lancé sur http://localhost:${PORT}`);
});
