const prisma = require('../models/db');
const publicUrl = require('../utils/publicUrl');

// 🔧 Helper pour transformer un audio Prisma → format API
function mapAudio(audio) {
  return {
    id: audio.id,
    title: audio.title,
    description: audio.description,
    category: audio.mainCategory,
    subCategory: audio.subCategory,
    image: publicUrl(audio.imagePath),
    file: publicUrl(audio.filePath),
    createdAt: audio.createdAt
  };
}

// ❤️ POST /api/favorites/:audioId — ajouter un favori
exports.addFavorite = async (req, res) => {
  const userId = req.user.id;
  const audioId = parseInt(req.params.audioId);

  if (isNaN(audioId)) {
    return res.status(400).json({ error: "ID d'audio invalide" });
  }

  try {
    // Équivalent à ON CONFLICT DO NOTHING grâce à la clé composée userId_audioId
    await prisma.favorite.upsert({
      where: {
        userId_audioId: {
          userId,
          audioId
        }
      },
      update: {}, // Aucune action si le favori existe déjà
      create: {
        userId,
        audioId
      }
    });

    res.json({ success: true, message: "Ajouté aux favoris" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l’ajout aux favoris" });
  }
};

// 💔 DELETE /api/favorites/:audioId — retirer un favori
exports.removeFavorite = async (req, res) => {
  const userId = req.user.id;
  const audioId = parseInt(req.params.audioId);

  if (isNaN(audioId)) {
    return res.status(400).json({ error: "ID d'audio invalide" });
  }

  try {
    await prisma.favorite.delete({
      where: {
        userId_audioId: {
          userId,
          audioId
        }
      }
    });

    res.json({ success: true, message: "Retiré des favoris" });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: "Favori non trouvé" });
    }
    res.status(500).json({ error: "Erreur lors de la suppression du favori" });
  }
};

// 📂 GET /api/favorites — liste des favoris de l’utilisateur connecté
exports.listFavorites = async (req, res) => {
  const userId = req.user.id;

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        audio: true
      }
    });

    const audios = favorites.map(fav => mapAudio(fav.audio));
    res.json({ favorites: audios });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement des favoris" });
  }
};