const jwt = require('jsonwebtoken');
const db = require('../models/db');

// Middleware global pour vérifier le Token JWT et la Blacklist
exports.authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Accès refusé. Token manquant." });
  }

  try {
    // 1. Vérifier si le token est dans la blacklist PostgreSQL
    const blacklistCheck = await db.query(
      'SELECT * FROM token_blacklist WHERE token = $1',
      [token]
    );

    if (blacklistCheck.rows.length > 0) {
      return res.status(401).json({ error: "Session expirée ou déconnectée. Veuillez vous reconnecter." });
    }

    // 2. Valider le token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // On injecte les infos de l'utilisateur décodé dans la requête
    req.user = decoded; 
    next();
  } catch (err) {
    console.error("Erreur validation token:", err);
    return res.status(403).json({ error: "Token invalide ou expiré." });
  }
};

// Middleware restrictif pour les Admins uniquement
exports.requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: "Accès interdit. Droits Administrateur requis." });
  }
  next();
};