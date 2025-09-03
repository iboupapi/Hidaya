const db = require('../models/db');

// 🛠️ Tableau de bord admin
exports.dashboard = (req, res) => {
  res.render('adminDashboard', {
    title: 'Espace administrateur',
    session: req.session
  });
};

// 🎧 Liste des audios (admin)
exports.listAudios = async (req, res) => {
  const playlistId = req.params.id;
  const userId = req.session.userId;

  try {
    // Récupérer les playlists
    const [playlists] = await db.execute(
      'SELECT id, name FROM playlists WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    // Émission
    const [emissions] = await db.execute(`
      SELECT * FROM audio_files WHERE main_category = 'emission' ORDER BY created_at DESC LIMIT 3
    `);

    // Musique
    const [musiques] = await db.execute(`
      SELECT * FROM audio_files WHERE main_category = 'musique' ORDER BY created_at DESC LIMIT 3
    `);

    // Enseignement
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
      enseignements.push({ ...enseignements[0] });
    }
    const [audios] = await db.execute(`
  SELECT * FROM audio_files
  ORDER BY created_at DESC
`);

    res.render('adminAudios', {
      title: 'Tous les audios',
      session: req.session,
      enseignements,
      emissions,
      musiques,
      playlists,     
      playlistId,  
      audios   
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors du chargement des audios');
  }
};


// 💾 Mise à jour d’un audio
exports.updateAudio = async (req, res) => {
  const { title, description, main_category, sub_category } = req.body;
  const audioId = req.params.id;

  // Validation : sub_category uniquement si main_category = enseignement
  const finalSubCategory = main_category === 'enseignement' ? sub_category || null : null;

  await db.execute(
    'UPDATE audio_files SET title = ?, description = ?, main_category = ?, sub_category = ? WHERE id = ?',
    [title, description, main_category, finalSubCategory, audioId]
  );

  res.redirect('/admin/audios');
};



exports.editAudioForm = async (req, res) => {
  const audioId = req.params.id;

  try {
    const [[audio]] = await db.execute('SELECT * FROM audio_files WHERE id = ?', [audioId]);

    if (!audio) {
      return res.status(404).send('Audio introuvable');
    }

    res.render('editAudioForm', {
      title: 'Modifier l’audio',
      session: req.session,
      audio
    });
  } catch (err) {
    console.error('Erreur lors du chargement de l’audio :', err);
    res.status(500).send('Impossible d’afficher le formulaire de modification');
  }
};


// 🗑️ Suppression d’un audio
exports.deleteAudio = async (req, res) => {
  if (!req.session || req.session.userRole !== 'admin') {
    return res.status(403).send('Accès refusé.');
  }

  const audioId = req.params.id;

  try {
    const [audio] = await db.execute('SELECT * FROM audio_files WHERE id = ?', [audioId]);

    if (audio.length === 0) {
      return res.status(404).send('Audio introuvable.');
    }

    // Supprimer les favoris liés
    await db.execute('DELETE FROM favorites WHERE audio_id = ?', [audioId]);

    // Supprimer les entrées dans les playlists
    await db.execute('DELETE FROM playlist_items WHERE audio_id = ?', [audioId]);

    // Supprimer le fichier physique
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '..', 'public', audio[0].file_path);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Supprimer l'audio en base
    await db.execute('DELETE FROM audio_files WHERE id = ?', [audioId]);

    res.redirect('/admin/audios');
  } catch (err) {
    console.error('Erreur lors de la suppression de l’audio :', err);
    res.status(500).send('Impossible de supprimer cet audio.');
  }
};
exports.audioPlaylists = async (req, res) => {
  const audioId = req.params.id;

  try {
    const [playlists] = await db.execute(`
      SELECT p.id, p.name
      FROM playlist_items pi
      JOIN playlists p ON pi.playlist_id = p.id
      WHERE pi.audio_id = ?
      ORDER BY p.created_at DESC
    `, [audioId]);

    res.render('audioPlaylists', {
      title: 'Playlists contenant cet audio',
      session: req.session,
      playlists,
      audioId
    });
  } catch (err) {
    console.error('Erreur lors du chargement des playlists liées à l’audio :', err);
    res.status(500).send('Impossible d’afficher les playlists');
  }
};

exports.viewAudio = async (req, res) => {
  const audioId = req.params.id;

  try {
    const [[audio]] = await db.execute('SELECT * FROM audio_files WHERE id = ?', [audioId]);

    if (!audio) {
      return res.status(404).send('Audio introuvable');
    }

    res.render('viewAudio', {
      title: `Audio : ${audio.title}`,
      session: req.session,
      audio
    });
  } catch (err) {
    console.error('Erreur lors du chargement de l’audio :', err);
    res.status(500).send('Impossible d’afficher cet audio.');
  }
};
