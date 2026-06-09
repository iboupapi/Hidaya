const db = require('../models/db');
const path = require('path');

// 🔧 Helper pour transformer les champs SQL → format API
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

// 🎧 GET /api/audios — liste complète
exports.listAudios = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM audio_files ORDER BY created_at DESC`
    );

    const audios = result.rows.map(row => mapAudio(row, req));

    res.json({ audios });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement des audios" });
  }
};

// 🎧 GET /api/audios/:id — un audio
// 🎧 GET /api/audios/:id — voir/écouter un audio (Avec gestion des verrous d'albums)
exports.viewAudio = async (req, res) => {
  const id = req.params.id;
  const userId = req.user?.id; // Optionnel (au cas où la route devienne accessible hors connexion, mais recommandé d'être connecté ici)
  const userRole = req.user?.role;

  try {
    // 1. Récupérer l'audio
    const result = await db.query(`SELECT * FROM audio_files WHERE id = $1`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Audio introuvable" });
    }

    const audio = result.rows[0];

    // 2. Vérifier si cet audio fait partie d'une playlist verrouillée
    // On regarde si l'audio est dans une playlist qui possède au moins un code d'accès généré
    const lockCheck = await db.query(
      `SELECT pi.playlist_id 
       FROM playlist_items pi
       INNER JOIN access_codes ac ON pi.playlist_id = ac.playlist_id
       WHERE pi.audio_id = $1 LIMIT 1`,
      [id]
    );

    // Si l'audio fait partie d'un album verrouillé
    if (lockCheck.rows.length > 0) {
      const playlistId = lockCheck.rows[0].playlist_id;

      // Si l'utilisateur n'est pas Admin, on doit vérifier s'il a acheté/débloqué cet album
      if (userRole !== 'admin' && userRole !== 'superadmin') {
        if (!userId) {
          return res.status(401).json({ error: "Cet audio fait partie d'un album privé. Veuillez vous connecter." });
        }

        const unlockCheck = await db.query(
          `SELECT 1 FROM unlocked_playlists WHERE user_id = $1 AND playlist_id = $2`,
          [userId, playlistId]
        );

        if (unlockCheck.rows.length === 0) {
          return res.status(403).json({ 
            error: "Contenu privé", 
            message: "Cet audio est verrouillé. Veuillez entrer le code d'accès de l'album pour le débloquer." 
          });
        }
      }
    }

    // 3. Si tout est OK (gratuit, admin ou déjà débloqué), on renvoie l'audio
    res.json({ audio: mapAudio(audio, req) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement de l’audio" });
  }
};

// 🎧 GET /api/audios/category/:main — par catégorie principale
exports.listByMainCategory = async (req, res) => {
  const main = req.params.main;

  try {
    const result = await db.query(
      `SELECT * FROM audio_files WHERE main_category = $1 ORDER BY created_at DESC`,
      [main]
    );

    const audios = result.rows.map(row => mapAudio(row, req));

    res.json({ main, audios });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement des audios" });
  }
};

// 🎧 GET /api/audios/sub/:sub — par sous-catégorie
exports.listBySubCategory = async (req, res) => {
  const sub = req.params.sub;

  try {
    const result = await db.query(
      `SELECT * FROM audio_files 
       WHERE sub_category = $1
       ORDER BY created_at DESC`,
      [sub]
    );

    const audios = result.rows.map(row => mapAudio(row, req));
    res.json({ sub, audios });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement des audios" });
  }
};

// 🔍 GET /api/audios/search?q=mot
exports.searchAudios = async (req, res) => {
  const q = req.query.q || "";

  try {
    const result = await db.query(
      `SELECT * FROM audio_files 
       WHERE title ILIKE $1 OR description ILIKE $1
       ORDER BY created_at DESC`,
      [`%${q}%`]
    );

    const audios = result.rows.map(row => mapAudio(row, req));

    res.json({ keyword: q, audios });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la recherche" });
  }
};

// 🗑 DELETE /api/audios/:id
exports.deleteAudio = async (req, res) => {
  const id = req.params.id;

  try {
    await db.query(`DELETE FROM favorites WHERE audio_id = $1`, [id]);
    await db.query(`DELETE FROM playlist_items WHERE audio_id = $1`, [id]);
    await db.query(`DELETE FROM audio_files WHERE id = $1`, [id]);

    res.json({ success: true, message: "Audio supprimé" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
};

// 🎧 POST /api/audios/upload (Réservé aux Admins)
exports.uploadAudio = async (req, res) => {
  try {
    // Les fichiers uploadés sont accessibles via req.files grâce à Multer (.any() ou .fields())
    // Mais attention : on doit s'assurer que le fichier audio obligatoire est bien là
    const audioFile = req.files?.audio?.[0];
    const imageFile = req.files?.image?.[0];

    if (!audioFile) {
      return res.status(400).json({ error: "Le fichier audio est obligatoire." });
    }

    const { title, description, main_category, sub_category } = req.body;

    if (!title || !main_category) {
      return res.status(400).json({ error: "Le titre et la catégorie principale sont obligatoires." });
    }

    // Extraction des chemins relatifs pour la BDD (ex: "uploads/audios/filename.mp3")
    // On remplace les antislashs Windows (\) par des slashs (/) pour éviter les soucis d'URL
    const filePath = audioFile.path.replace(/\\/g, '/');
    const imagePath = imageFile ? imageFile.path.replace(/\\/g, '/') : null;
    
    // ID de l'admin connecté (injecté par notre middleware d'authentification)
    const uploadedBy = req.user.id; 

    const result = await db.query(
      `INSERT INTO audio_files (title, description, file_path, image_path, main_category, sub_category, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, description, filePath, imagePath, main_category, sub_category, uploadedBy]
    );

    res.status(201).json({
      success: true,
      message: "Audio ajouté avec succès !",
      audio: mapAudio(result.rows[0], req)
    });

  } catch (err) {
    console.error("Erreur lors de l'upload:", err);
    res.status(500).json({ error: "Erreur serveur lors de l'enregistrement de l'audio" });
  }
};
