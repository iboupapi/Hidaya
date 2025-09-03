const express = require('express');
const router = express.Router();
const audioController = require('../controllers/audioController');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');

router.get('/', audioController.listAudios);
//router.get('/audios/theme/:id', audioController.listByTheme);

router.get('/category/:main', audioController.listByMainCategory);
router.get('/enseignement/:sub', audioController.listBySubCategory);
//router.get('/search', audioController.searchAudios);
router.get('/view/:id', audioController.viewAudio);
router.get('/download/:id', audioController.downloadAudio);


module.exports = router;
