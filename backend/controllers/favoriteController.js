const db = require('../models/db');

// 🔧 Helper pour transformer un audio SQL → format API
function mapAudio(row, req) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.main_category,
    subCategory: row.sub_category,
    image: row.image_path
      ? `${req.protocol}://${req.get('host')}/${row.image_path}`
      : null,
    file: `${req.protocol}://${req.get('host')}/${row.file_path}`,
    createdAt: row.created_at
  };
}

// ❤️ POST /api/favorites/:audioId — ajouter un favori
exports.addFavorite = async (req, res) => {
  const userId = req.user.id; // Injecté par le middleware authenticateToken
  const audioId = req.params.audioId;

  try {
    await db.query(
      `INSERT INTO favorites (user_id, audio_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, audioId]
    );

    res.json({ success: true, message: "Ajouté aux favoris" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l’ajout aux favoris" });
  }
};

// 💔 DELETE /api/favorites/:audioId — retirer un favori
exports.removeFavorite = async (req, res) => {
  const userId = req.user.id; 
  const audioId = req.params.audioId;

  try {
    await db.query(
      `DELETE FROM favorites WHERE user_id = $1 AND audio_id = $2`,
      [userId, audioId]
    );

    res.json({ success: true, message: "Retiré des favoris" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la suppression du favori" });
  }
};

// 📂 GET /api/favorites — liste des favoris de l’utilisateur connecté
exports.listFavorites = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(
      `SELECT a.*
       FROM favorites f
       JOIN audio_files a ON f.audio_id = a.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );

    const audios = result.rows.map(row => mapAudio(row, req));
    res.json({ favorites: audios });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement des favoris" });
  }
};