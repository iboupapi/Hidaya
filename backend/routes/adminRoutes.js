const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const upload = require('../middleware/upload');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const prisma = require('../models/db'); // Utilisation de votre instance Prisma

// Configuration du chargement des fichiers avec Multer
const cpUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]);

// 🔒 Sécurité globale : Toutes les routes ci-dessous requièrent un jeton JWT ET le rôle Admin
router.use(authenticateToken);
router.use(requireAdmin);

// 📊 Route Dashboard
router.get('/dashboard', adminController.dashboard);

// 🎵 Routes de gestion des Audios (CRUD Admin)
router.post('/audios', cpUpload, adminController.uploadAudio);

// GET /api/admin/audios?page=1&limit=20
router.get('/audios', async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const skip = (page - 1) * limit;

  try {
    const [audios, total] = await Promise.all([
      prisma.audioFile.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.audioFile.count()
    ]);

    res.json({
      audios,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la récupération des audios' });
  }
});

router.get('/audios/:id', adminController.viewAudio);
router.put('/audios/:id', adminController.updateAudio);
router.delete('/audios/:id', adminController.deleteAudio);

// 👥 Routes de gestion des Utilisateurs
router.get('/users', adminController.listUsers);
router.put('/users/:id/role', adminController.updateUserRole);

module.exports = router;