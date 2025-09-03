const db = require('../models/db');
const multer = require('multer');
const path = require('path');
const sanitize = require('sanitize-filename');
// 📤 Formulaire d’upload audio
exports.uploadForm = async (req, res) => {
  try {
    res.render('uploadAudio', {
      title: 'Uploader un audio',
      session: req.session
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors du chargement du formulaire');
  }
};

// 💾 Enregistrement d’un audio
exports.saveAudio = async (req, res) => {
  const { title, description, main_category, sub_category } = req.body;

  // 📁 Récupération des fichiers
  const audioFile = req.files?.audio?.[0];
  const imageFile = req.files?.image?.[0];

const file_path = audioFile ? `uploads/${audioFile.filename}` : null;
const image_path = imageFile
  ? `uploads/${imageFile.filename}`
  : (main_category === 'enseignement' ? 'images/enseignement-default.jpg' : null);

  // 🔍 Validation logique
  const finalSubCategory = main_category === 'enseignement' ? sub_category || null : null;

  try {
    await db.execute(
      `INSERT INTO audio_files 
       (title, description, file_path, image_path, uploaded_by, main_category, sub_category) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, description, file_path, image_path, req.session.userId, main_category, finalSubCategory]
    );

    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors de l’enregistrement de l’audio');
  }
};


// 📂 Liste des audios
exports.listAudios = async (req, res) => {
  const playlistId = req.params.id;
  try {
    // Émission
    const [emissions] = await db.execute(`
      SELECT * FROM audio_files WHERE main_category = 'emission' ORDER BY created_at DESC LIMIT 3
    `);

    // Musique
    const [musiques] = await db.execute(`
      SELECT * FROM audio_files WHERE main_category = 'musique' ORDER BY created_at DESC LIMIT 3
    `);

    // Enseignement → 1 par sous-catégorie
    const [rappel] = await db.execute(`
      SELECT * FROM audio_files WHERE main_category = 'enseignement' AND sub_category = 'rappel' ORDER BY created_at DESC LIMIT 1
    `);
    const [conference] = await db.execute(`
      SELECT * FROM audio_files WHERE main_category = 'enseignement' AND sub_category = 'conference' ORDER BY created_at DESC LIMIT 1
    `);
    const [bayane] = await db.execute(`
      SELECT * FROM audio_files WHERE main_category = 'enseignement' AND sub_category = 'bayane' ORDER BY created_at DESC LIMIT 1
    `);

    const enseignements = [rappel[0], conference[0], bayane[0]].filter(audio => audio && audio.id);

while (enseignements.length < 3 && enseignements.length > 0) {
  enseignements.push({ ...enseignements[0] }); // copie propre
}


    res.render('audioList', {
      title: 'Tous les audios',
      session: req.session,
      enseignements,
      emissions,
      musiques,
      playlistId
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors du chargement des audios');
  }
};


// 🔍 Audios par catégorie principale
exports.listByMainCategory = async (req, res) => {
  const main = req.params.main;

  try {
    let audios = [];
    let sousCategories = [];

    if (main === 'enseignement') {
      const [rappel] = await db.execute(`
        SELECT * FROM audio_files WHERE main_category = 'enseignement' AND sub_category = 'rappel' ORDER BY created_at DESC
      `);
      const [conference] = await db.execute(`
        SELECT * FROM audio_files WHERE main_category = 'enseignement' AND sub_category = 'conference' ORDER BY created_at DESC
      `);
      const [bayane] = await db.execute(`
        SELECT * FROM audio_files WHERE main_category = 'enseignement' AND sub_category = 'bayane' ORDER BY created_at DESC
      `);

      sousCategories = [
        { name: 'rappel', label: '🗣️ Rappel', audios: rappel },
        { name: 'conference', label: '🎓 Conférence', audios: conference },
        { name: 'bayane', label: '📖 Bayane', audios: bayane }
      ];
    } else {
      const [rows] = await db.execute(`
        SELECT * FROM audio_files WHERE main_category = ? ORDER BY created_at DESC
      `, [main]);
      audios = rows;
    }

    res.render('audioListByMain', {
      title: `Audios : ${main}`,
      session: req.session,
      main,
      audios,
      sousCategories // ✅ toujours défini, même vide
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors du chargement des audios');
  }
};


// 📘 Audios par sous-catégorie (enseignement uniquement)
exports.listBySubCategory = async (req, res) => {
  const sub = req.params.sub;

  try {
    const [audios] = await db.execute(
      'SELECT * FROM audio_files WHERE main_category = "enseignement" AND sub_category = ? ORDER BY created_at DESC',
      [sub]
    );
    res.render('audioListBySub', {
      title: `Sous-catégorie : ${sub}`,
      session: req.session,
      audios,
      sub
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors du chargement des audios');
  }
};

exports.listByMainCategory = async (req, res) => {
  const main = req.params.main;

  try {
    let audios = [];
    let sousCategories = [];

    if (main === 'enseignement') {
      // 🔍 Tous les audios d’enseignement
      const [rows] = await db.execute(`
        SELECT * FROM audio_files
        WHERE main_category = 'enseignement'
        ORDER BY created_at DESC
      `);
      audios = rows;

      // 🔍 Audios par sous-catégorie
      const [rappel] = await db.execute(`
        SELECT * FROM audio_files
        WHERE main_category = 'enseignement' AND sub_category = 'rappel'
        ORDER BY created_at DESC
      `);
      const [conference] = await db.execute(`
        SELECT * FROM audio_files
        WHERE main_category = 'enseignement' AND sub_category = 'conference'
        ORDER BY created_at DESC
      `);
      const [bayane] = await db.execute(`
        SELECT * FROM audio_files
        WHERE main_category = 'enseignement' AND sub_category = 'bayane'
        ORDER BY created_at DESC
      `);

      sousCategories = [
        { name: 'rappel', label: '🗣️ Rappel', audios: rappel },
        { name: 'conference', label: '🎓 Conférence', audios: conference },
        { name: 'bayane', label: '📖 Bayane', audios: bayane }
      ];
    } else {
      // 🔍 Autres catégories (musique, émission, etc.)
      const [rows] = await db.execute(`
        SELECT * FROM audio_files
        WHERE main_category = ?
        ORDER BY created_at DESC
      `, [main]);
      audios = rows;
    }

    // ✅ Rendu de la vue
    res.render('audioListByMain', {
      title: `Audios : ${main}`,
      session: req.session,
      main,
      audios,
      sousCategories
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors du chargement des audios');
  }
};


// 🔎 Résultats de recherche
exports.searchAudios = async (req, res) => {
  const keyword = req.query.q;

  try {
    const [audios] = await db.execute(
      `SELECT * FROM audio_files 
       WHERE title LIKE ? OR description LIKE ?
       ORDER BY created_at DESC`,
      [`%${keyword}%`, `%${keyword}%`]
    );

    res.render('searchResults', {
      title: `Résultats pour "${keyword}"`,
      session: req.session,
      audios,
      keyword
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors de la recherche');
  }
};
exports.viewAudio = async (req, res) => {
  const audioId = req.params.id;

  try {
    const [[audio]] = await db.execute('SELECT * FROM audio_files WHERE id = ?', [audioId]);

    if (!audio) return res.status(404).send('Audio introuvable');
    let playlists = [];
if (req.session.userId) {
  const [rows] = await db.execute(
    'SELECT * FROM playlists WHERE user_id = ? ORDER BY created_at DESC',
    [req.session.userId]
  );
  playlists = rows;
}
    res.render('viewAudio', {
      title: audio.title,
      session: req.session,
      audio,
  playlists
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors du chargement de l’audio');
  }
};


exports.downloadAudio = async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(403).send('Accès refusé. Connectez-vous pour télécharger.');
  }

  const audioId = req.params.id;

  try {
    const [rows] = await db.execute('SELECT file_path FROM audio_files WHERE id = ?', [audioId]);

    if (rows.length === 0) {
      return res.status(404).send('Audio introuvable.');
    }

const filePath = path.join(__dirname, '..', rows[0].file_path);
    res.download(filePath);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors du téléchargement.');
  }
};

// ⚙️ Configuration du stockage

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads')); // ✅ dossier dans ton projet
  },
  filename: (req, file, cb) => {
    const originalName = sanitize(file.originalname).replace(/\s+/g, '-');
    const timestamp = Date.now();
    cb(null, `${timestamp}-${originalName}`);
  }
});

exports.upload = multer({ storage }).fields([
  { name: 'audio', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]);

