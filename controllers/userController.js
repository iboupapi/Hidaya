const db = require('../models/db');
const bcrypt = require('bcryptjs');

// 📝 Formulaire d’inscription
exports.registerForm = (req, res) => {
  res.render('register', {
    title: 'Créer un compte',
    session: req.session
  });
};

// 💾 Traitement de l’inscription
exports.register = async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const [existing] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.send('Cet email est déjà utilisé.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.execute(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role || 'user']
    );

    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors de l’inscription.');
  }
};

// 🔐 Formulaire de connexion
exports.loginForm = (req, res) => {
  res.render('login', {
    title: 'Connexion',
    session: req.session
  });
};

// 🔑 Traitement de la connexion
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.send('Email non reconnu');
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.send('Mot de passe incorrect');
    }

    req.session.userId = user.id;
    req.session.userRole = user.role;

    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors de la connexion');
  }
};

// 🚪 Déconnexion
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};

// 👤 Tableau de bord utilisateur
exports.dashboard = (req, res) => {
  res.render('dashboard', {
    title: 'Tableau de bord',
    session: req.session
  });
};
