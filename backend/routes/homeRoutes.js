const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const optionalAuth = require('../middleware/optionalAuth'); // Middleware si token présent, sinon req.user est null

// Feed principal
router.get('/feed', optionalAuth, homeController.getHomeFeed);

// Incrémenter le nombre d'écoutes
router.post('/audios/:id/play', homeController.incrementPlayCount);

module.exports = router;