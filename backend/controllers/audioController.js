const prisma = require('../models/db');
const publicUrl = require('../utils/publicUrl');
const { cached, invalidate } = require('../utils/cache');

// 🔧 Helper pour transformer l'objet Prisma → format API
function mapAudio(audio) {
  return {
    id: audio.id,
    title: audio.title,
    description: audio.description,
    category: audio.mainCategory,
    subCategory: audio.subCategory,
    duration: audio.duration,
    playCount: audio.playCount || 0,
    image: publicUrl(audio.imagePath),
    file: publicUrl(audio.filePath),
    createdAt: audio.createdAt
  };
}

// 🎧 GET /api/audios?page=1&limit=20 — liste paginée
exports.listAudios = async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 50); // plafond à 50/page
  const skip = (page - 1) * limit;

  try {
    const where = {
      isPrivate: false,
      playlists: { none: {} }
    };

    const [audios, total] = await Promise.all([
      prisma.audioFile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.audioFile.count({ where })
    ]);

    res.json({
      audios: audios.map(audio => mapAudio(audio)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("🔥 Erreur listAudios:", err);
    res.status(500).json({ error: "Erreur lors du chargement des audios" });
  }
};

// 🎧 GET /api/audios/:id — voir/écouter un audio (Avec gestion des verrous d'albums)
exports.viewAudio = async (req, res) => {
  const id = parseInt(req.params.id);
  const userId = req.user?.id;
  const userRole = req.user?.role;

  if (isNaN(id)) {
    return res.status(400).json({ error: "ID invalide" });
  }

  try {
    const audio = await prisma.audioFile.findUnique({
      where: { id }
    });

    if (!audio) {
      return res.status(404).json({ error: "Audio introuvable" });
    }

    const lockedItem = await prisma.playlistItem.findFirst({
      where: {
        audioId: id,
        playlist: {
          accessCodes: {
            some: {}
          }
        }
      },
      select: { playlistId: true }
    });

    if (lockedItem) {
      const playlistId = lockedItem.playlistId;

      if (userRole !== 'admin' && userRole !== 'superadmin') {
        if (!userId) {
          return res.status(401).json({ error: "Cet audio fait partie d'un album privé. Veuillez vous connecter." });
        }

        const unlocked = await prisma.unlockedPlaylist.findUnique({
          where: {
            userId_playlistId: { userId, playlistId }
          }
        });

        if (!unlocked) {
          return res.status(403).json({ 
            error: "Contenu privé", 
            message: "Cet audio est verrouillé. Veuillez entrer le code d'accès de l'album pour le débloquer." 
          });
        }
      }
    }

    res.json({ audio: mapAudio(audio) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement de l’audio" });
  }
};

// 🎧 GET /api/audios/category/:main?page=1&limit=20 — par catégorie principale
exports.listByMainCategory = async (req, res) => {
  const main = req.params.main;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const skip = (page - 1) * limit;

  try {
    const where = {
      mainCategory: main,
      isPrivate: false,
      playlists: { none: {} } // 🟢 Correction
    };

    const [audios, total] = await Promise.all([
      prisma.audioFile.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.audioFile.count({ where })
    ]);

    res.json({
      main,
      audios: audios.map(audio => mapAudio(audio)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement des audios" });
  }
};

// 🎧 GET /api/audios/sub/:sub?page=1&limit=20 — par sous-catégorie
exports.listBySubCategory = async (req, res) => {
  const sub = req.params.sub;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const skip = (page - 1) * limit;

  try {
    const where = {
      subCategory: sub,
      isPrivate: false,
      playlists: { none: {} } // 🟢 Correction
    };

    const [audios, total] = await Promise.all([
      prisma.audioFile.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.audioFile.count({ where })
    ]);

    res.json({
      sub,
      audios: audios.map(audio => mapAudio(audio)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement des audios" });
  }
};

// 🔍 GET /api/audios/search?q=mot&page=1&limit=20
exports.searchAudios = async (req, res) => {
  const q = req.query.q || "";
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const skip = (page - 1) * limit;

  try {
    const where = {
      isPrivate: false,
      playlists: { none: {} }, // 🟢 Correction
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      ]
    };

    const [audios, total] = await Promise.all([
      prisma.audioFile.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.audioFile.count({ where })
    ]);

    res.json({
      keyword: q,
      audios: audios.map(audio => mapAudio(audio)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la recherche" });
  }
};

// 🗑 DELETE /api/audios/:id
exports.deleteAudio = async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "ID invalide" });
  }

  try {
    await prisma.audioFile.delete({
      where: { id }
    });

    await invalidate('home:feed:*');
    await invalidate('audios:popular:*');

    res.json({ success: true, message: "Audio supprimé" });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: "Audio introuvable" });
    }
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
};

// 🔥 GET /api/audios/popular — Récupérer le top des audios les plus écoutés
exports.listPopularAudios = async (req, res) => {
  const limit = parseInt(req.query.limit) || 5;

  try {
    const audios = await cached(`audios:popular:${limit}`, 60, () =>
      prisma.audioFile.findMany({
        where: {
          isPrivate: false,
          playlists: { none: {} } // 🟢 Correction
        },
        take: limit,
        orderBy: { playCount: 'desc' }
      })
    );

    res.json({ audios: audios.map(audio => mapAudio(audio)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement des audios populaires" });
  }
};

// 📈 POST /api/audios/:id/play — Incrémenter le compteur d'écoutes
exports.incrementPlayCount = async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "ID invalide" });
  }

  try {
    const updatedAudio = await prisma.audioFile.update({
      where: { id },
      data: {
        playCount: { increment: 1 }
      }
    });

    res.json({ 
      success: true, 
      playCount: updatedAudio.playCount 
    });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: "Audio introuvable" });
    }
    res.status(500).json({ error: "Erreur lors de l'incrémentation de la lecture" });
  }
};

// 🎧 POST /api/audios/upload (Réservé aux Admins)
exports.uploadAudio = async (req, res) => {
  try {
    const audioFile = req.files?.audio?.[0];
    const imageFile = req.files?.image?.[0] ?? null; // Safe fallback

    if (!audioFile) {
      return res.status(400).json({ error: "Le fichier audio est obligatoire." });
    }

    const { title, description, main_category, sub_category } = req.body;

    if (!title || !main_category) {
      return res.status(400).json({ error: "Le titre et la catégorie principale sont obligatoires." });
    }

    const filePath = audioFile.key;
    const imagePath = imageFile ? imageFile.key : null;
    const uploadedBy = req.user.id;

    const newAudio = await prisma.audioFile.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        filePath,
        imagePath,
        mainCategory: main_category.trim(),
        subCategory: sub_category ? sub_category.trim() : null,
        uploadedBy
      }
    });

    res.status(201).json({
      success: true,
      message: "Audio ajouté avec succès !",
      audio: mapAudio(newAudio)
    });

  } catch (err) {
    console.error("Erreur lors de l'upload:", err);
    res.status(500).json({ error: "Erreur serveur lors de l'enregistrement de l'audio" });
  }
};