const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlistController');
const { ensureAuthenticated } = require('../middleware/auth');

router.get('/', ensureAuthenticated, playlistController.listPlaylists);
router.get('/create', ensureAuthenticated, playlistController.createForm);
router.post('/create', ensureAuthenticated, playlistController.createPlaylist);
router.get('/:id/add', ensureAuthenticated, playlistController.addForm);
router.post('/:id/add', ensureAuthenticated, playlistController.addAudio);
router.get('/:id', ensureAuthenticated, playlistController.viewPlaylist);
router.post('/add/:id', playlistController.addAudio);
router.get('/view/:id', playlistController.viewPlaylist);
router.post('/add', ensureAuthenticated, playlistController.addAudioToPlaylist);



module.exports = router;
