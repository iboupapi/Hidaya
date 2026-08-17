const jwt = require('jsonwebtoken');
const prisma = require('../models/db');

// Middleware global pour vérifier le Token JWT et la Blacklist
exports.authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Accès refusé. Token manquant." });
  }

  try {
    // 1. Vérifier si le token est dans la blacklist PostgreSQL via Prisma
    const blacklisted = await prisma.tokenBlacklist.findFirst({
      where: { token }
    });

    if (blacklisted) {
      return res.status(401).json({ error: "Session expirée ou déconnectée. Veuillez vous reconnecter." });
    }

    // 2. Valider le token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Injecter les données décodées dans req.user
    req.user = decoded; 
    next();
  } catch (err) {
    console.error("Erreur validation token:", err);
    return res.status(403).json({ error: "Token invalide ou expiré." });
  }
};

// Middleware restrictif pour les Admins uniquement (admin et superadmin)
exports.requireAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    return res.status(403).json({ error: "Accès interdit. Droits Administrateur requis." });
  }
  next();
};