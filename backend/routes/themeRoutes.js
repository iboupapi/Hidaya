const express = require('express');
const router = express.Router();
const themeController = require('../controllers/themeController');

// Routes pour récupérer les listes de filtres (utilisées côté Front)
router.get('/main', themeController.getMainCategories);
router.get('/sub', themeController.getSubCategories);
router.get('/mapping', themeController.getCategoryMapping);

module.exports = router;