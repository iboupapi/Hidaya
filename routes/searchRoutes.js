const express = require('express');
const router = express.Router();
const audioController = require('../controllers/audioController');

router.get('/search', audioController.searchAudios);

module.exports = router;
