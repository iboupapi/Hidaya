const prisma = require('../models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: "7d" }
  );
}

// 📝 POST /api/auth/register
exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "Tous les champs sont obligatoires." });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim();

  try {
    // Vérification d'unicité sur l'email ET le nom d'utilisateur
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { username: cleanUsername }
        ]
      }
    });

    if (existing) {
      if (existing.email === cleanEmail) {
        return res.status(400).json({ error: "Cet email est déjà utilisé." });
      }
      return res.status(400).json({ error: "Ce nom d'utilisateur est déjà pris." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username: cleanUsername,
        email: cleanEmail,
        password: hashedPassword
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'inscription." });
  }
};

// 🔑 POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Veuillez fournir l'email et le mot de passe." });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect." });
    }

    const token = generateToken(user);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la connexion." });
  }
};

// 👤 GET /api/auth/me (Sécurisée par le middleware global)
exports.me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable." });
    }

    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
};

// 🚪 POST /api/auth/logout (Sécurisée par le middleware global)
exports.logout = async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(400).json({ error: "Token manquant." });
  }

  try {
    // Conversion de la date d'expiration (req.user.exp est un timestamp en secondes)
    const expiresAt = req.user && req.user.exp
      ? new Date(req.user.exp * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Upsert sécurisé pour éviter un crash si le token est déjà blacklisté
    await prisma.tokenBlacklist.upsert({
      where: { token },
      update: {},
      create: {
        token,
        expiresAt
      }
    });

    res.json({ success: true, message: "Déconnexion réussie." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la déconnexion." });
  }
};