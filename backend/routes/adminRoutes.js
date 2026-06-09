const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const upload = require("../middleware/upload");
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Configuration du chargement des fichiers avec Multer
const cpUpload = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "audio", maxCount: 1 }
]);

// 🔒 Sécurité globale : Toutes les routes ci-dessous requièrent un jeton JWT ET le rôle Admin
router.use(authenticateToken);
router.use(requireAdmin);

// 📊 Route Dashboard
router.get('/dashboard', adminController.dashboard);

// 🎵 Routes de gestion des Audios (CRUD Admin)
router.post('/audios', cpUpload, adminController.uploadAudio);
router.get('/audios', adminController.listAudios);
router.get('/audios/:id', adminController.viewAudio);
router.put('/audios/:id', adminController.updateAudio);
router.delete('/audios/:id', adminController.deleteAudio);

// 👥 Routes de gestion des Utilisateurs
router.get("/users", adminController.listUsers);
router.put("/users/:id/role", adminController.updateUserRole);

module.exports = router;