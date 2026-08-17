const jwt = require('jsonwebtoken');
const prisma = require('../models/db');

module.exports = async function authUser(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Token manquant" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // 1. Vérifier si le token est blacklisté
    const blacklisted = await prisma.tokenBlacklist.findFirst({
      where: { token }
    });

    if (blacklisted) {
      return res.status(401).json({ error: "Token expiré ou invalide" });
    }

    // 2. Vérifier et décoder le token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Vérifier que l'utilisateur existe toujours dans la base de données
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: "Utilisateur introuvable" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Token invalide" });
  }
};