const jwt = require('jsonwebtoken');
const prisma = require('../models/db');

module.exports = async function optionalAuth(req, res, next) {
  req.user = null; // Par défaut, l'utilisateur est considéré comme invité/anonyme

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // Pas de token -> on continue sans erreur, req.user reste null
  }

  const token = authHeader.split(' ')[1];

  try {
    // 1. Vérification optionnelle de la blacklist (si vous gérez la déconnexion par blacklist)
    const isBlacklisted = await prisma.tokenBlacklist.findFirst({
      where: { token }
    });

    if (isBlacklisted) {
      return next(); // Token révoqué -> on traite la requête comme anonyme
    }

    // 2. Décodage et vérification de la signature du JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. (Optionnel mais recommandé) Récupération rapide de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, email: true }
    });

    if (user) {
      req.user = user; // Utilisateur identifié avec succès
    }
  } catch (err) {
    // Si le token est expiré ou invalide, on ne bloque pas la requête.
    // req.user reste null et on continue.
    console.debug("optionalAuth : Token invalide ou expiré, passage en mode invité.");
  }

  next();
};