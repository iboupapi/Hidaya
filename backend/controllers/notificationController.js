const prisma = require('../models/db');

// 🔔 GET /api/notifications — Liste des notifications de l'utilisateur connecté
exports.getNotifications = async (req, res) => {
  const userId = req.user.id;

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({ notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la récupération des notifications" });
  }
};

// ↗️ PUT /api/notifications/:id/read — Marquer une notification comme lue
exports.markAsRead = async (req, res) => {
  const userId = req.user.id;
  const notifId = parseInt(req.params.id);

  if (isNaN(notifId)) {
    return res.status(400).json({ error: "ID de notification invalide" });
  }

  try {
    const result = await prisma.notification.updateMany({
      where: {
        id: notifId,
        userId
      },
      data: {
        isRead: true
      }
    });

    if (result.count === 0) {
      return res.status(404).json({ error: "Notification introuvable ou non autorisée." });
    }

    res.json({ success: true, message: "Notification marquée comme lue" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la mise à jour de la notification" });
  }
};