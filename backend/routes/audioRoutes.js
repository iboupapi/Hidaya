const express = require('express');
const router = express.Router();
const audioController = require('../controllers/audioController');
const upload = require('../middleware/upload');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Configuration de multer pour recevoir deux types de fichiers optionnels/obligatoires
const cpUpload = upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]);

// Routes publiques
router.get('/', audioController.listAudios);
router.get('/popular', audioController.listPopularAudios);
router.get('/search', audioController.searchAudios);
router.get('/category/:main', audioController.listByMainCategory);
router.get('/sub/:sub', audioController.listBySubCategory);
router.get('/:id', authenticateToken, audioController.viewAudio);
router.post('/:id/play', audioController.incrementPlayCount);
router.delete('/:id', authenticateToken, requireAdmin, audioController.deleteAudio);

module.exports = router;