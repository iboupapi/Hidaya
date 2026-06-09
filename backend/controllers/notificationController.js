const db = require('../models/db');

// 🔔 GET /api/notifications — Liste des notifications de l'utilisateur connecté
exports.getNotifications = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    );

    res.json({ notifications: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la récupération des notifications" });
  }
};

//  PUT /api/notifications/:id/read — Marquer une notification comme lue
exports.markAsRead = async (req, res) => {
  const userId = req.user.id;
  const notifId = req.params.id;

  try {
    const result = await db.query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [notifId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Notification introuvable ou non autorisée." });
    }

    res.json({ success: true, message: "Notification marquée comme lue" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la mise à jour de la notification" });
  }
};