const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { ensureAuthenticated } = require('../middleware/auth');

router.get('/register', userController.registerForm);
router.post('/register', userController.register);
router.get('/login', userController.loginForm);
router.post('/login', userController.login);
router.get('/logout', userController.logout);
router.get('/dashboard', ensureAuthenticated, userController.dashboard); // à protéger plus tard

module.exports = router;
