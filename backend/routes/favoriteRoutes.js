const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { authenticateToken } = require('../middleware/auth');

// Toutes les routes de ce fichier exigent une connexion valide
router.use(authenticateToken);

router.get('/', favoriteController.listFavorites);
router.post('/:audioId', favoriteController.addFavorite);
router.delete('/:audioId', favoriteController.removeFavorite);

module.exports = router;