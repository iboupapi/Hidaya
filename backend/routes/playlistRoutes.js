const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlistController');
const { authenticateToken } = require('../middleware/auth');

// Toutes les routes de ce fichier exigent une connexion valide
router.use(authenticateToken);

router.get('/', playlistController.listPlaylists);
router.post('/', playlistController.createPlaylist);
router.get('/:id', playlistController.viewPlaylist);
router.post('/:id/add', playlistController.addAudio);
router.delete('/:id', playlistController.deletePlaylist);
router.delete('/:id/remove/:audioId', playlistController.removeAudio);

module.exports = router;