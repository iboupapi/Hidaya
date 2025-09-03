const db = require('../models/db');

// ❤️ Ajouter un audio aux favoris
exports.addFavorite = async (req, res) => {
  const userId = req.session.userId;
  const audioId = req.params.audioId;

  try {
    await db.execute(
      'INSERT IGNORE INTO favorites (user_id, audio_id) VALUES (?, ?)',
      [userId, audioId]
    );
    res.redirect('/audios'); // ou vers la page précédente
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors de l’ajout aux favoris');
  }
};

// 📂 Liste des favoris de l’utilisateur
exports.listFavorites = async (req, res) => {
  const userId = req.session.userId;

  try {
    const [audios] = await db.execute(`
      SELECT a.id, a.title, a.description, a.file_path, a.main_category, a.sub_category
      FROM favorites f
      JOIN audio_files a ON f.audio_id = a.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `, [userId]);

    res.render('favorites', {
      title: 'Mes favoris',
      session: req.session,
      audios
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors du chargement des favoris');
  }
};
