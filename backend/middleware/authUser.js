const jwt = require('jsonwebtoken');
const db = require('../models/db');

const JWT_SECRET = "TON_SECRET_A_CHANGER";

module.exports = async function authUser(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader)
    return res.status(401).json({ error: "Token manquant" });

  const token = authHeader.split(" ")[1];

  try {
    // Vérifier si le token est blacklisté
    const blacklisted = await db.query(
      `SELECT id FROM token_blacklist WHERE token = $1`,
      [token]
    );

    if (blacklisted.rows.length > 0) {
      return res.status(401).json({ error: "Token expiré ou invalide" });
    }

    // Vérifier le token JWT
    const decoded = jwt.verify(token, JWT_SECRET);

    // Vérifier que l'utilisateur existe toujours
    const result = await db.query(
      `SELECT id, username, email, role FROM users WHERE id = $1`,
      [decoded.id]
    );

    if (result.rows.length === 0)
      return res.status(401).json({ error: "Utilisateur introuvable" });

    req.user = result.rows[0];
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Token invalide" });
  }
};
