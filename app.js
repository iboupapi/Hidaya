const express = require('express');
const session = require('express-session');
require('dotenv').config();
const db = require('./models/db');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const audioRoutes = require('./routes/audioRoutes');
// const themeRoutes = require('./routes/themeRoutes');
const playlistRoutes = require('./routes/playlistRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const searchRoutes = require('./routes/searchRoutes');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(expressLayouts);

// Configuration du moteur de vues EJS
app.set('view engine', 'ejs');
app.set('layout', 'partials/layout'); // chemin vers ton layout.ejs
app.set('views', path.join(__dirname, 'views')); // dossier où tu mets tes fichiers .ejs
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static('public'));


app.get('/', async (req, res) => {
  try {
    const [audios] = await db.execute('SELECT * FROM audio_files ORDER BY created_at DESC');
    const [topAudios] = await db.execute(`
  SELECT a.*, COUNT(f.id) AS favorite_count
  FROM audio_files a
  JOIN favorites f ON f.audio_id = a.id
  GROUP BY a.id
  ORDER BY favorite_count DESC
  LIMIT 5
`);
    res.render('acceuil', {
  title: 'Accueil',
  session: req.session,
  audios,
  topAudios
});

  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors du chargement de la page d’accueil');
  }
});


// app.use('/', themeRoutes);
app.use('/audios', audioRoutes);
app.use('/playlists', playlistRoutes);
app.use('/', favoriteRoutes);
app.use('/admin', adminRoutes);
app.use('/', userRoutes);
app.use('/', searchRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur Hidaya lancé sur le port ${PORT}`);
});
