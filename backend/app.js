const express = require('express');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const audioRoutes = require('./routes/audioRoutes');
const playlistRoutes = require('./routes/playlistRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const themeRoutes = require('./routes/themeRoutes');
const accessRoutes = require('./routes/accessRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// 🔥 Autoriser React à accéder à l’API
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Authorization"]
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 Servir les fichiers uploadés
app.use('/uploads', express.static('uploads'));

// 🔥 ROUTES API
app.use('/api/auth', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/audios', audioRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/themes', themeRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/notifications', notificationRoutes);

// 🔥 Route test
app.get('/', (req, res) => {
  res.json({ message: "API Hidaya opérationnelle" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur API Hidaya lancé sur http://localhost:${PORT}`);
});
