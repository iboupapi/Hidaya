const db = require('../models/db');

// 🎧 GET /api/themes/main
// Récupère toutes les catégories principales existantes (sans doublons)
exports.getMainCategories = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT DISTINCT main_category 
       FROM audio_files 
       WHERE main_category IS NOT NULL AND main_category != ''
       ORDER BY main_category ASC`
    );
    
    // On extrait juste les chaînes de caractères dans un tableau propre
    const categories = result.rows.map(row => row.main_category);
    res.json({ categories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la récupération des catégories principales" });
  }
};

// 🎧 GET /api/themes/sub
// Récupère toutes les sous-catégories existantes (sans doublons)
exports.getSubCategories = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT DISTINCT sub_category 
       FROM audio_files 
       WHERE sub_category IS NOT NULL AND sub_category != ''
       ORDER BY sub_category ASC`
    );
    
    const subCategories = result.rows.map(row => row.sub_category);
    res.json({ subCategories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la récupération des sous-catégories" });
  }
};

// 🎧 GET /api/themes/mapping
// Optionnel mais super utile pour le Front : Renvoie l'arborescence complète (Quelle sous-catégorie appartient à quelle catégorie principale)
exports.getCategoryMapping = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT DISTINCT main_category, sub_category 
       FROM audio_files 
       WHERE main_category IS NOT NULL AND sub_category IS NOT NULL
       ORDER BY main_category, sub_category`
    );

    // Structuration des données sous forme d'objet : { "Religion": ["Cours", "Conférences"], "Sante": [...] }
    const mapping = {};
    result.rows.forEach(row => {
      if (!mapping[row.main_category]) {
        mapping[row.main_category] = [];
      }
      if (row.sub_category && !mapping[row.main_category].includes(row.sub_category)) {
        mapping[row.main_category].push(row.sub_category);
      }
    });

    res.json({ mapping });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la génération du mapping des catégories" });
  }
};