const db = require('../models/db');

// 📤 Formulaire de création de playlist
exports.createForm = (req, res) => {
  res.render('createPlaylist', {
    title: 'Créer une playlist',
    session: req.session
  });
};

// 💾 Création d’une playlist
exports.createPlaylist = async (req, res) => {
  const { name } = req.body;
  const userId = req.session.userId;

  try {
    await db.execute('INSERT INTO playlists (name, user_id) VALUES (?, ?)', [name, userId]);
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors de la création de la playlist');
  }
};

// ➕ Formulaire pour ajouter un audio à une playlist
exports.addForm = async (req, res) => {
  const playlistId = req.params.id;
  const userId = req.session.userId;

  try {
    const [audios] = await db.execute('SELECT id, title FROM audio_files ORDER BY created_at DESC');
    const [playlists] = await db.execute('SELECT id, name FROM playlists WHERE user_id = ?', [userId]);

    res.render('addToPlaylist', {
      title: 'Ajouter à la playlist',
      session: req.session,
      audios,
      playlists,
      playlistId
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors du chargement des audios ou des playlists');
  }
};


// 💾 Ajout d’un audio à une playlist
exports.addAudio = async (req, res) => {
  const audioId = req.body.audio_id;
  const playlistId = req.params.id;

  try {
    if (!playlistId || !audioId) {
      return res.status(400).send('Paramètres manquants : audio ou playlist non défini.');
    }
    const [existing] = await db.execute(
  'SELECT * FROM playlist_items WHERE playlist_id = ? AND audio_id = ?',
  [playlistId, audioId]
);

if (existing.length > 0) {
  return res.status(400).send('Cet audio est déjà dans la playlist.');
}

    await db.execute(
      'INSERT INTO playlist_items (playlist_id, audio_id) VALUES (?, ?)',
      [playlistId, audioId]
    );

    res.redirect('/playlists/view/' + playlistId);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors de l’ajout à la playlist');
  }
};


// 📂 Liste des playlists de l’utilisateur
exports.listPlaylists = async (req, res) => {
  const userId = req.session.userId;

  try {
    const [playlists] = await db.execute(
      'SELECT * FROM playlists WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.render('playlists', {
      title: 'Mes playlists',
      session: req.session,
      playlists
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors du chargement des playlists');
  }
};

// 🔍 Vue d’une playlist avec ses audios
exports.viewPlaylist = async (req, res) => {
  const playlistId = req.params.id;

  try {
    const [[playlist]] = await db.execute('SELECT * FROM playlists WHERE id = ?', [playlistId]);

    if (!playlist) return res.status(404).send('Playlist introuvable');

    const [audios] = await db.execute(`
      SELECT a.id, a.title, a.description, a.file_path, a.image_path
      FROM playlist_items pi
      JOIN audio_files a ON pi.audio_id = a.id
      WHERE pi.playlist_id = ?
      ORDER BY pi.position ASC
    `, [playlistId]);

    res.render('viewPlaylist', {
      title: `Playlist : ${playlist.name}`,
      session: req.session,
      playlist,
      audios
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors du chargement de la playlist');
  }
};
exports.addAudioToPlaylist = async (req, res) => {
  const { playlist_id, audio_id } = req.body;

  try {
    await db.execute(
      'INSERT INTO playlist_items (playlist_id, audio_id) VALUES (?, ?)',
      [playlist_id, audio_id]
    );

    res.redirect(`/playlists/view/${playlist_id}`);
  } catch (err) {
    console.error('Erreur lors de l’ajout à la playlist :', err);
    res.status(500).send('Impossible d’ajouter l’audio à la playlist.');
  }
};
