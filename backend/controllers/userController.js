const db = require('../models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// 📝 POST /api/auth/register
exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existing = await db.query(`SELECT * FROM users WHERE email = $1`, [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Cet email est déjà utilisé" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (username, email, password) VALUES ($1, $2, $3)
       RETURNING id, username, email, role, created_at`,
      [username, email, hashedPassword]
    );

    const user = result.rows[0];
    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'inscription" });
  }
};

// 🔑 POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query(`SELECT * FROM users WHERE email = $1`, [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Email ou mot de passe incorrect" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: "Email ou mot de passe incorrect" });
    }

    const token = generateToken(user);
    res.json({
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la connexion" });
  }
};

// 👤 GET /api/auth/me (Sécurisée par le middleware global)
exports.me = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, username, email, role, created_at FROM users WHERE id = $1`,
      [req.user.id] // Récupéré directement depuis le token décodé par le middleware
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🚪 POST /api/auth/logout (Sécurisée par le middleware global)
exports.logout = async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  try {
    // Insérer le token dans la blacklist avec sa date d'expiration
    await db.query(
      `INSERT INTO token_blacklist (token, expires_at) VALUES ($1, to_timestamp($2))`,
      [token, req.user.exp]
    );
    res.json({ success: true, message: "Déconnexion réussie" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la déconnexion" });
  }
};