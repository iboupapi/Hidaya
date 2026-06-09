const db = require('../models/db');
const crypto = require('crypto'); // Module natif de Node.js pour générer des chaînes aléatoires

// 🔑 POST /api/admin/codes — Générer un code pour un album (Admin seulement)
exports.generateCode = async (req, res) => {
  const { playlist_id } = req.body;

  if (!playlist_id) {
    return res.status(400).json({ error: "L'ID de l'album/playlist est obligatoire." });
  }

  try {
    // Vérifier si la playlist existe
    const playlistCheck = await db.query('SELECT id, name FROM playlists WHERE id = $1', [playlist_id]);
    if (playlistCheck.rows.length === 0) {
      return res.status(404).json({ error: "L'album/playlist spécifié n'existe pas." });
    }

    // Génération d'un code unique de 12 caractères (ex: DI-A8F2-99B1)
    const randomString = crypto.randomBytes(4).toString('hex').toUpperCase();
    const code = `DI-${playlist_id}-${randomString}`;

    const result = await db.query(
      `INSERT INTO access_codes (code, playlist_id) 
       VALUES ($1, $2) 
       RETURNING *`,
      [code, playlist_id]
    );

    res.status(201).json({
      success: true,
      message: "Code d'accès généré avec succès !",
      code: result.rows[0].code,
      album: playlistCheck.rows[0].name
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la génération du code" });
  }
};

// 🔓 POST /api/playlists/unlock — Débloquer un album avec un code (Utilisateur connecté)
exports.unlockPlaylist = async (req, res) => {
  const { code } = req.body;
  const userId = req.user.id; // Récupéré via le jeton JWT

  if (!code) {
    return res.status(400).json({ error: "Le code d'accès est obligatoire." });
  }

  try {
    // 1. Vérifier si le code existe et n'est pas encore utilisé
    const codeResult = await db.query(
      'SELECT * FROM access_codes WHERE code = $1',
      [code]
    );

    if (codeResult.rows.length === 0) {
      return res.status(404).json({ error: "Code invalide ou inexistant." });
    }

    const accessCode = codeResult.rows[0];

    if (accessCode.is_used) {
      return res.status(400).json({ error: "Ce code a déjà été utilisé par un autre disciple." });
    }

    // 2. Associer l'utilisateur à cet album dans la table 'unlocked_playlists'
    // ON CONFLICT DO NOTHING évite de planter si l'utilisateur avait déjà débloqué l'album d'une autre manière
    await db.query(
      `INSERT INTO unlocked_playlists (user_id, playlist_id) 
       VALUES ($1, $2) 
       ON CONFLICT DO NOTHING`,
      [userId, accessCode.playlist_id]
    );

    // 3. Marquer le code comme utilisé
    await db.query(
      'UPDATE access_codes SET is_used = true WHERE id = $1',
      [accessCode.id]
    );

    // Récupérer le nom de l'album pour faire un joli message de confirmation
    const playlistInfo = await db.query('SELECT name FROM playlists WHERE id = $1', [accessCode.playlist_id]);

    res.json({
      success: true,
      message: `Félicitations ! L'album "${playlistInfo.rows[0].name}" est désormais débloqué sur votre compte.`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du déblocage de l'album" });
  }
};