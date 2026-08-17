const prisma = require('../models/db');
const publicUrl = require('../utils/publicUrl');
const { cached } = require('../utils/cache');

// 🔧 Helper pour transformer un audio Prisma → format API client
function mapAudio(audio) {
  return {
    id: audio.id,
    title: audio.title,
    description: audio.description,
    category: audio.mainCategory,
    subCategory: audio.subCategory,
    duration: audio.duration || 0,
    playCount: audio.playCount || 0,
    image: publicUrl(audio.imagePath),
    file: publicUrl(audio.filePath),
    createdAt: audio.createdAt,
    isFavorite: Array.isArray(audio.favorites) ? audio.favorites.length > 0 : false
  };
}

// 🔧 Helper pour transformer une playlist Prisma → format API client
function mapPlaylist(playlist) {
  return {
    id: playlist.id,
    title: playlist.name,
    description: null, // Pas de description dans le schéma actuel
    isPublic: !playlist.isPrivate, // On inverse isPrivate pour correspondre à isPublic
    image: publicUrl(playlist.coverImage),
    tracksCount: playlist._count?.items || 0, // Utilisation correcte de _count.items
    createdAt: playlist.createdAt
  };
}

// Construit les données du feed pour un utilisateur donné (ou un visiteur si userId est null)
async function buildFeedData(userId) {
  // Inclusion conditionnelle des favoris si l'utilisateur est connecté
  const favoriteInclude = userId
    ? { where: { userId: userId }, select: { userId: true } }
    : false;

  // Requêtes parallèles pour charger toutes les sections
  const [mostPlayed, enseignements, emissions, musiques, playlists] = await Promise.all([
    // 1. Les plus écoutés (exclut les audios liés à une playlist/album)
    prisma.audioFile.findMany({
      where: { 
        playlists: { none: {} }
      },
      take: 10,
      orderBy: { playCount: 'desc' },
      include: { favorites: favoriteInclude }
    }),

    // 2. Les Enseignements (limite à 10)
    prisma.audioFile.findMany({
      where: { 
        mainCategory: 'Enseignement',
        playlists: { none: {} }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { favorites: favoriteInclude }
    }),

    // 3. Les Émissions (limite à 10)
    prisma.audioFile.findMany({
      where: {
        mainCategory: { in: ['Émission', 'Emission'] },
        playlists: { none: {} }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { favorites: favoriteInclude }
    }),

    // 4. Musique spirituelle (limite à 10)
    prisma.audioFile.findMany({
      where: { 
        mainCategory: 'Musique spirituelle',
        playlists: { none: {} }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { favorites: favoriteInclude }
    }),

    // 5. Playlists et Albums (Publiques ou appartenant à l'utilisateur connecté)
    prisma.playlist.findMany({
      where: userId 
        ? { OR: [{ isPrivate: false }, { userId: userId }] }
        : { isPrivate: false },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        _count: { select: { items: true } } // Utilisation correcte de items
      }
    })
  ]);

  return {
    playlists: playlists.map(p => mapPlaylist(p)),
    mostPlayed: mostPlayed.map(a => mapAudio(a)),
    enseignements: {
      all: enseignements.map(a => mapAudio(a)),
      bayane: enseignements.filter(a => a.subCategory === 'Bayane').map(a => mapAudio(a)),
      conference: enseignements.filter(a => a.subCategory === 'Conférence').map(a => mapAudio(a)),
      rappel: enseignements.filter(a => a.subCategory === 'Rappel').map(a => mapAudio(a))
    },
    emissions: emissions.map(a => mapAudio(a)),
    musiques: musiques.map(a => mapAudio(a))
  };
}

// 🏠 GET /api/home/feed — Récupérer toutes les sections de la page d'accueil
exports.getHomeFeed = async (req, res) => {
  try {
    const userId = req.user?.id || null;

    // On ne met en cache que la version "visiteur" (userId null) car c'est de
    // très loin la plus demandée, et elle est identique pour tout le monde.
    // Pour un utilisateur connecté, les favoris changent le contenu retourné
    // (isFavorite) donc on recalcule à chaque fois.
    const data = userId
      ? await buildFeedData(userId)
      : await cached('home:feed:guest', 60, () => buildFeedData(null));

    res.json({ success: true, data });

  } catch (err) {
    console.error("Erreur lors du chargement du feed Home:", err);
    res.status(500).json({ error: "Erreur serveur lors du chargement de la page d'accueil" });
  }
};

// 🎧 POST /api/audios/:id/play — Incrémenter le compteur d'écoutes (playCount)
exports.incrementPlayCount = async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({ error: "ID audio invalide" });
  }

  try {
    const updatedAudio = await prisma.audioFile.update({
      where: { id },
      data: {
        playCount: {
          increment: 1
        }
      },
      select: {
        id: true,
        playCount: true
      }
    });

    res.json({
      success: true,
      audioId: updatedAudio.id,
      playCount: updatedAudio.playCount
    });

  } catch (err) {
    console.error("Erreur incrementPlayCount:", err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: "Audio introuvable" });
    }
    res.status(500).json({ error: "Erreur lors de l'incrémentation du nombre d'écoutes" });
  }
};