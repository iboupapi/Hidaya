exports.ensureAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return next(); // ✅ Utilisateur connecté
  }
  res.redirect('/login'); // ❌ Redirection si non connecté
};
// Vérifie si l'utilisateur est un administrateur
exports.ensureAdmin = (req, res, next) => {
  if (req.session.userRole === 'admin') {
    return next();
  }
  //res.status(403).send('Accès interdit : administrateur requis');
  res.redirect('/login');
};