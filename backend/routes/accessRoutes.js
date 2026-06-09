const express = require('express');
const router = express.Router();
const accessController = require('../controllers/accessController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Route Admin : Générer un code
router.post('/admin/generate-code', authenticateToken, requireAdmin, accessController.generateCode);

// Route Disciple : Activer un code
router.post('/unlock', authenticateToken, accessController.unlockPlaylist);

module.exports = router;