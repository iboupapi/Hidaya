const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { ensureAuthenticated } = require('../middleware/auth');

router.get('/favorites', ensureAuthenticated, favoriteController.listFavorites);
router.post('/favorites/add/:audioId', ensureAuthenticated, favoriteController.addFavorite);

module.exports = router;