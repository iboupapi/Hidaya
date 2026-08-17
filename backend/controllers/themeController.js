const prisma = require('../models/db');

// 🎧 GET /api/themes/main
// Récupère toutes les catégories principales existantes (sans doublons)
exports.getMainCategories = async (req, res) => {
  try {
    const rows = await prisma.audioFile.findMany({
      where: {
        mainCategory: {
          notIn: ['', null]
        }
      },
      distinct: ['mainCategory'],
      select: {
        mainCategory: true
      },
      orderBy: {
        mainCategory: 'asc'
      }
    });

    const categories = rows.map(row => row.mainCategory);
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
    const rows = await prisma.audioFile.findMany({
      where: {
        subCategory: {
          notIn: ['', null]
        }
      },
      distinct: ['subCategory'],
      select: {
        subCategory: true
      },
      orderBy: {
        subCategory: 'asc'
      }
    });

    const subCategories = rows.map(row => row.subCategory);
    res.json({ subCategories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la récupération des sous-catégories" });
  }
};

// 🎧 GET /api/themes/mapping
// Renvoie l'arborescence complète (Quelle sous-catégorie appartient à quelle catégorie principale)
exports.getCategoryMapping = async (req, res) => {
  try {
    const rows = await prisma.audioFile.findMany({
      where: {
        mainCategory: { notIn: ['', null] },
        subCategory: { notIn: ['', null] }
      },
      distinct: ['mainCategory', 'subCategory'],
      select: {
        mainCategory: true,
        subCategory: true
      },
      orderBy: [
        { mainCategory: 'asc' },
        { subCategory: 'asc' }
      ]
    });

    // Structuration des données : { "Religion": ["Cours", "Conférences"], "Sante": [...] }
    const mapping = {};
    rows.forEach(row => {
      if (!mapping[row.mainCategory]) {
        mapping[row.mainCategory] = [];
      }
      if (row.subCategory && !mapping[row.mainCategory].includes(row.subCategory)) {
        mapping[row.mainCategory].push(row.subCategory);
      }
    });

    res.json({ mapping });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la génération du mapping des catégories" });
  }
};