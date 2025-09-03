const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');
const audioController = require('../controllers/audioController');
console.log('listAudios:', typeof adminController.listAudios);
console.log('updateAudio:', typeof adminController.updateAudio);

router.get('/upload', ensureAuthenticated, ensureAdmin, audioController.uploadForm);
router.post(
  '/upload',
  ensureAuthenticated,
  ensureAdmin,
  audioController.upload,
  audioController.saveAudio
);
// 🔒 Route accessible uniquement aux admins
router.get('/dashboard', ensureAuthenticated, ensureAdmin, adminController.dashboard);
router.get('/audios', ensureAuthenticated, ensureAdmin, adminController.listAudios);
router.get('/audios/:id/edit', ensureAuthenticated, ensureAdmin, adminController.editAudioForm);
router.post('/audios/:id/edit', ensureAuthenticated, ensureAdmin, adminController.updateAudio);
router.post('/audios/:id/delete', ensureAuthenticated, ensureAdmin, adminController.deleteAudio);
console.log('editAudioForm:', typeof adminController.editAudioForm);
router.get('/audios/:id/playlists', ensureAuthenticated, ensureAdmin, adminController.audioPlaylists);
router.get('/audios/:id', ensureAuthenticated, ensureAdmin, adminController.viewAudio);

module.exports = router;
