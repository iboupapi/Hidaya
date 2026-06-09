const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

// Routes publiques
router.post('/register', userController.register);
router.post('/login', userController.login);

// Routes privées (Nécessitent un Token JWT valide)
router.get('/me', authenticateToken, userController.me);
router.post('/logout', authenticateToken, userController.logout);

module.exports = router;