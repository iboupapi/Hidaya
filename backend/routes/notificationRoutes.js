const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient(); // Remplacez par votre instance singleton Prisma si vous en avez une (ex: require('../lib/prisma'))
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

// Sécurité : Il faut être connecté pour accéder à ses notifications
router.use(authenticateToken);

// Récupérer toutes les notifications de l'utilisateur connecté
router.get('/', async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user.id, // Assurez-vous que le champ correspond à votre schema.prisma (userId ou user_id)
      },
      orderBy: {
        createdAt: 'desc', // Assurez-vous que le champ correspond à votre schema.prisma (createdAt ou created_at)
      },
    });

    res.json({ notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur lors du chargement des notifications" });
  }
});

router.put('/:id/read', notificationController.markAsRead);

module.exports = router;