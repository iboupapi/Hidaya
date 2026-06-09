const db = require('../models/db');

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

// 📂 GET /api/playlists — liste des playlists de l’utilisateur
exports.listPlaylists = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(
      `SELECT * FROM playlists WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    res.json({ playlists: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement des playlists" });
  }
};

// ➕ POST /api/playlists — créer une playlist
exports.createPlaylist = async (req, res) => {
  const { name } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({ error: "Le nom de la playlist est obligatoire" });
  }

  try {
    const result = await db.query(
      `INSERT INTO playlists (name, user_id)
       VALUES ($1, $2)
       RETURNING *`,
      [name, userId]
    );
    res.status(201).json({ success: true, playlist: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la création de la playlist" });
  }
};

// 🔍 GET /api/playlists/:id — voir une playlist + ses audios (vérification de propriété)
exports.viewPlaylist = async (req, res) => {
  const playlistId = req.params.id;
  const userId = req.user.id;

  try {
    const playlistResult = await db.query(
      `SELECT * FROM playlists WHERE id = $1 AND user_id = $2`,
      [playlistId, userId]
    );

    if (playlistResult.rows.length === 0) {
      return res.status(404).json({ error: "Playlist introuvable ou accès refusé" });
    }

    const audiosResult = await db.query(
      `SELECT a.*
       FROM playlist_items pi
       JOIN audio_files a ON pi.audio_id = a.id
       WHERE pi.playlist_id = $1
       ORDER BY pi.position ASC`,
      [playlistId]
    );

    const audios = audiosResult.rows.map(row => mapAudio(row, req));
    res.json({
      playlist: playlistResult.rows[0],
      audios
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement de la playlist" });
  }
};

// ➕ POST /api/playlists/:id/add — ajouter un audio
exports.addAudio = async (req, res) => {
  const playlistId = req.params.id;
  const { audio_id } = req.body;
  const userId = req.user.id;

  try {
    // Étape de sécurité : Est-ce bien la playlist de l'utilisateur connecté ?
    const playlistCheck = await db.query(
      `SELECT id FROM playlists WHERE id = $1 AND user_id = $2`,
      [playlistId, userId]
    );

    if (playlistCheck.rows.length === 0) {
      return res.status(403).json({ error: "Action non autorisée sur cette playlist" });
    }

    await db.query(
      `INSERT INTO playlist_items (playlist_id, audio_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [playlistId, audio_id]
    );

    res.json({ success: true, message: "Audio ajouté à la playlist" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l’ajout à la playlist" });
  }
};

// ❌ DELETE /api/playlists/:id — supprimer une playlist
exports.deletePlaylist = async (req, res) => {
  const playlistId = req.params.id;
  const userId = req.user.id;

  try {
    // Sécurité : On tente de supprimer directement si l'id ET le user_id correspondent
    const result = await db.query(
      `DELETE FROM playlists WHERE id = $1 AND user_id = $2 RETURNING *`,
      [playlistId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: "Action non autorisée ou playlist introuvable" });
    }

    // Si la cascade n'est pas gérée au niveau de ta base de données (Foreign Key constraints),
    // on nettoie manuellement les éléments orphelins de la playlist supprimée.
    await db.query(`DELETE FROM playlist_items WHERE playlist_id = $1`, [playlistId]);

    res.json({ success: true, message: "Playlist supprimée avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la suppression de la playlist" });
  }
};

// ❌ DELETE /api/playlists/:id/remove/:audioId — retirer un audio
exports.removeAudio = async (req, res) => {
  const playlistId = req.params.id;
  const audioId = req.params.audioId;
  const userId = req.user.id;

  try {
    // Sécurité : Est-ce bien la playlist de l'utilisateur ?
    const playlistCheck = await db.query(
      `SELECT id FROM playlists WHERE id = $1 AND user_id = $2`,
      [playlistId, userId]
    );

    if (playlistCheck.rows.length === 0) {
      return res.status(403).json({ error: "Action non autorisée sur cette playlist" });
    }

    await db.query(
      `DELETE FROM playlist_items WHERE playlist_id = $1 AND audio_id = $2`,
      [playlistId, audioId]
    );

    res.json({ success: true, message: "Audio retiré de la playlist" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du retrait de l’audio" });
  }
};