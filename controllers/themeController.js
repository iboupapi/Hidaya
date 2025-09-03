// const db = require('../models/db');

// exports.listThemes = async (req, res) => {
//   const [themes] = await db.execute('SELECT * FROM themes');
//   res.render('themeManager', { themes, session: req.session });
// };

// exports.addTheme = async (req, res) => {
//   const { name } = req.body;
//   await db.execute('INSERT INTO themes (name) VALUES (?)', [name]);
//   res.redirect('/admin/themes');
// };
// exports.editTheme = async (req, res) => {
//   const { id } = req.params;
//   const { name } = req.body;
//   try {
//     await db.execute('UPDATE themes SET name = ? WHERE id = ?', [name, id]);
//     res.redirect('/admin/themes');
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Erreur lors de la modification du thème');
//   }
// };

// exports.deleteTheme = async (req, res) => {
//   const { id } = req.params;
//   try {
//     await db.execute('DELETE FROM themes WHERE id = ?', [id]);
//     res.redirect('/admin/themes');
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Erreur lors de la suppression du thème');
//   }
// };
