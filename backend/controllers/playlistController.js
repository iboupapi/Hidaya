const prisma = require('../models/db');
const publicUrl = require('../utils/publicUrl');
const { invalidate } = require('../utils/cache');

// 🔧 Helper pour transformer un enregistrement Audio Prisma → format API
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

// 🔧 Helper pour transformer un enregistrement Playlist Prisma → format API
function mapPlaylist(playlist) {
  return {
    id: playlist.id,
    name: playlist.name,
    isPrivate: playlist.isPrivate || false,
    contactNumber: playlist.contactNumber || null,
    coverImage: publicUrl(playlist.coverImage),
    createdAt: playlist.createdAt
  };
}

// 📂 GET /api/playlists — Liste globale de tous les albums (Public)
exports.listPlaylists = async (req, res) => {
  try {
    const playlists = await prisma.playlist.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const formattedPlaylists = playlists.map((pl) => mapPlaylist(pl));

    res.json({ playlists: formattedPlaylists });
  } catch (err) {
    console.error("🔥 ERREUR LISTING PLAYLISTS :", err);
    res.status(500).json({ error: "Erreur lors du chargement des albums" });
  }
};

// ➕ POST /api/playlists — Créer un album
exports.createPlaylist = async (req, res) => {
  console.log("=== 🚀 CRÉATION ALBUM (LIEN DIRECT) ===");

  const { name, isPrivate, accessCode, contactNumber } = req.body || {};
  const userId = req.user?.id ? parseInt(req.user.id, 10) : null;
  const userRole = req.user?.role;

  if (userRole !== 'admin' && userRole !== 'superadmin') {
    return res.status(403).json({ error: "Accès refusé." });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Le nom de l'album est obligatoire" });
  }

  const trimmedName = name.trim();

  try {
    // 🔒 Vérification : Empêcher les doublons de nom d'album
    const existingPlaylist = await prisma.playlist.findFirst({
      where: { name: trimmedName }
    });

    if (existingPlaylist) {
      return res.status(400).json({ error: "Un album portant ce nom existe déjà." });
    }

    const isPrivateBool = isPrivate === 'true' || isPrivate === true;
    const coverImageFile = req.files?.image ? req.files.image[0] : null;
    const coverImagePath = coverImageFile ? coverImageFile.key : null;
    const uploadedAudioFiles = req.files?.audios || [];

    // Utilisation d'une transaction pour lier l'audio à l'album de façon garantie
    const result = await prisma.$transaction(async (tx) => {
      // 1. Création de la Playlist
      const playlist = await tx.playlist.create({
        data: {
          name: trimmedName,
          isPrivate: isPrivateBool,
          coverImage: coverImagePath,
          contactNumber: isPrivateBool && contactNumber ? contactNumber.trim() : null,
          ...(userId ? { user: { connect: { id: userId } } } : {})
        }
      });

      const itemsToCreate = [];

      // 2. Création des audios avec leur catégorie normale (ex: 'Enseignement')
      for (let index = 0; index < uploadedAudioFiles.length; index++) {
        const file = uploadedAudioFiles[index];
        const cleanPath = file.key;
        const audioTitle = file.originalname.replace(/\.[^/.]+$/, "");

        const newAudio = await tx.audioFile.create({
          data: {
            title: audioTitle,
            filePath: cleanPath,
            ...(userId ? { uploader: { connect: { id: userId } } } : {})
          }
        });

        itemsToCreate.push({
          playlistId: playlist.id,
          audioId: newAudio.id,
          position: index + 1
        });
      }

      // 3. Récupération des IDs d'audios existants si envoyés
      let existingAudioIds = [];
      if (req.body.audioIds) {
        try {
          const parsed = JSON.parse(req.body.audioIds);
          existingAudioIds = Array.isArray(parsed) 
            ? parsed.map(id => parseInt(id, 10)).filter(id => !isNaN(id)) 
            : [];
        } catch (e) {}
      }

      existingAudioIds.forEach((audioId, index) => {
        itemsToCreate.push({
          playlistId: playlist.id,
          audioId: audioId,
          position: uploadedAudioFiles.length + index + 1
        });
      });

      // 4. Association immédiate dans PlaylistItem
      if (itemsToCreate.length > 0) {
        await tx.playlistItem.createMany({
          data: itemsToCreate,
          skipDuplicates: true
        });
      }

      return playlist;
    });

    console.log(`✅ ALBUM CRÉÉ AVEC SUCCÈS : "${result.name}"`);
    await invalidate('home:feed:*');
    return res.status(201).json({ success: true, playlist: mapPlaylist(result) });

  } catch (err) {
    console.error("🔥 ERREUR CRÉATION ALBUM :", err);
    return res.status(500).json({ error: "Erreur lors de la création de l'album" });
  }
};

// 🔍 GET /api/playlists/:id — Voir le contenu d'un album (AVEC VÉRIFICATION D'ACCÈS)
exports.viewPlaylist = async (req, res) => {
  const playlistId = parseInt(req.params.id, 10);
  
  const rawUserId = req.user?.id || req.user?.userId;
  const userId = rawUserId ? parseInt(rawUserId, 10) : null;
  const userRole = req.user?.role;

  if (isNaN(playlistId)) {
    return res.status(400).json({ error: "ID d'album invalide" });
  }

  try {
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: {
        unlockedPlaylists: userId ? {
          where: { userId: userId }
        } : false,
        items: {
          orderBy: [
            { position: 'asc' },
            { audio: { createdAt: 'asc' } }
          ],
          include: {
            audio: true
          }
        }
      }
    });

    if (!playlist) {
      return res.status(404).json({ error: "Album introuvable" });
    }

    // VÉRIFICATION D'ACCÈS
    const isAdmin = userRole === 'admin' || userRole === 'superadmin';
    const hasUnlocked = Array.isArray(playlist.unlockedPlaylists) && playlist.unlockedPlaylists.length > 0;
    
    // Si l'album est privé et que l'utilisateur N'EST PAS admin ET n'a pas déverrouillé :
    if (playlist.isPrivate && !isAdmin && !hasUnlocked) {
      return res.status(403).json({
        error: "Cet album est privé. Veuillez contacter le propriétaire pour obtenir le code d'accès.",
        isLocked: true,
        contactNumber: playlist.contactNumber // Transmet le numéro au front
      });
    }

    const audios = playlist.items.map(item => mapAudio(item.audio));
    const formattedPlaylist = mapPlaylist(playlist);

    res.json({
      playlist: {
        ...formattedPlaylist,
        audiosCount: audios.length
      },
      audios
    });
  } catch (err) {
    console.error("🔥 ERREUR VIEW PLAYLIST :", err);
    res.status(500).json({ error: "Erreur lors du chargement de l'album" });
  }
};

// ➕ POST /api/playlists/:id/add — Ajouter un audio à l'album (Admin)
exports.addAudio = async (req, res) => {
  const playlistId = parseInt(req.params.id, 10);
  const { audio_id, audioId } = req.body;
  const targetAudioId = parseInt(audio_id || audioId, 10);
  const userRole = req.user?.role;

  if (userRole !== 'admin' && userRole !== 'superadmin') {
    return res.status(403).json({ error: "Accès refusé. Privilèges insuffisants." });
  }

  if (isNaN(playlistId) || isNaN(targetAudioId)) {
    return res.status(400).json({ error: "Identifiants invalides" });
  }

  try {
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      select: { id: true, isPrivate: true }
    });

    if (!playlist) {
      return res.status(404).json({ error: "Album introuvable" });
    }

    await prisma.playlistItem.upsert({
      where: {
        playlistId_audioId: {
          playlistId,
          audioId: targetAudioId
        }
      },
      update: {},
      create: {
        playlistId,
        audioId: targetAudioId
      }
    });

    res.json({
      success: true,
      message: "Audio ajouté à l'album avec succès"
    });
  } catch (err) {
    console.error("🔥 ERREUR ADD AUDIO TO PLAYLIST :", err);
    res.status(500).json({ error: "Erreur lors de l'ajout de l'audio à l'album" });
  }
};

// ❌ DELETE /api/playlists/:id — Supprimer un album et ses audios exclusifs (Admin)
exports.deletePlaylist = async (req, res) => {
  const playlistId = parseInt(req.params.id, 10);
  const userRole = req.user?.role;

  if (userRole !== 'admin' && userRole !== 'superadmin') {
    return res.status(403).json({ error: "Accès refusé. Privilèges insuffisants." });
  }

  if (isNaN(playlistId)) {
    return res.status(400).json({ error: "ID d'album invalide" });
  }

  try {
    // 1. Récupérer tous les audios liés à cet album avant de le supprimer
    const playlistItems = await prisma.playlistItem.findMany({
      where: { playlistId },
      select: { audioId: true }
    });
    const audioIdsToDelete = playlistItems.map(item => item.audioId);

    // 2. Transaction pour supprimer l'album et ses audios en même temps
    await prisma.$transaction(async (tx) => {
      // Supprimer l'album (ce qui supprime les PlaylistItem par cascade)
      await tx.playlist.delete({
        where: { id: playlistId }
      });

      // Supprimer les fichiers audio qui étaient dedans pour éviter qu'ils ne flottent sur le site
      if (audioIdsToDelete.length > 0) {
        await tx.audioFile.deleteMany({
          where: { id: { in: audioIdsToDelete } }
        });
      }
    });

    console.log(`🗑️ Album #${playlistId} et ses ${audioIdsToDelete.length} audio(s) supprimés avec succès.`);
    await invalidate('home:feed:*');
    res.json({ success: true, message: "Album et ses audios supprimés avec succès" });
  } catch (err) {
    console.error("🔥 ERREUR DELETE PLAYLIST :", err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: "Album introuvable" });
    }
    res.status(500).json({ error: "Erreur lors de la suppression de l'album" });
  }
};

// ❌ DELETE /api/playlists/:id/remove/:audioId — Retirer un audio de l'album (Admin)
exports.removeAudio = async (req, res) => {
  const playlistId = parseInt(req.params.id, 10);
  const audioId = parseInt(req.params.audioId, 10);
  const userRole = req.user?.role;

  if (userRole !== 'admin' && userRole !== 'superadmin') {
    return res.status(403).json({ error: "Accès refusé. Privilèges insuffisants." });
  }

  if (isNaN(playlistId) || isNaN(audioId)) {
    return res.status(400).json({ error: "Identifiants invalides" });
  }

  try {
    await prisma.playlistItem.delete({
      where: {
        playlistId_audioId: {
          playlistId,
          audioId
        }
      }
    });

    res.json({ success: true, message: "Audio retiré de l'album" });
  } catch (err) {
    console.error("🔥 ERREUR REMOVE AUDIO FROM PLAYLIST :", err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: "L'audio ne figurait pas dans cet album" });
    }
    res.status(500).json({ error: "Erreur lors du retrait de l’audio" });
  }
};

// 🔓 POST /api/playlists/:id/unlock — Déverrouiller un album privé via code d'accès
exports.unlockPlaylist = async (req, res) => {
  const playlistId = parseInt(req.params.id, 10);
  const { code } = req.body;
  const userId = req.user?.id ? parseInt(req.user.id, 10) : null;

  if (!userId) {
    return res.status(401).json({ error: "Vous devez être connecté pour déverrouiller cet album." });
  }

  if (isNaN(playlistId) || !code || !code.trim()) {
    return res.status(400).json({ error: "Identifiant d'album ou code d'accès manquant." });
  }

  try {
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId }
    });

    if (!playlist) {
      return res.status(404).json({ error: "Album introuvable." });
    }

    const validAccessCode = await prisma.accessCode.findFirst({
      where: {
        playlistId: playlistId,
        code: code.trim()
      }
    });

    if (!validAccessCode) {
      return res.status(403).json({ error: "Code d'accès incorrect pour cet album." });
    }

    await prisma.unlockedPlaylist.upsert({
      where: {
        userId_playlistId: {
          userId,
          playlistId
        }
      },
      update: {},
      create: {
        userId,
        playlistId
      }
    });

    return res.json({
      success: true,
      message: "Album déverrouillé avec succès ! Accès conservé à vie."
    });

  } catch (err) {
    console.error("🔥 ERREUR UNLOCK PLAYLIST :", err);
    return res.status(500).json({ error: "Erreur lors du déverrouillage de l'album" });
  }
};

// 👥 GET /api/playlists/:id/access-list — Liste des utilisateurs ayant déverrouillé l'album
exports.getPlaylistAccessList = async (req, res) => {
  const playlistId = parseInt(req.params.id, 10);
  const userRole = req.user?.role;

  if (userRole !== 'admin' && userRole !== 'superadmin') {
    return res.status(403).json({ error: "Accès refusé. Privilèges insuffisants." });
  }

  if (isNaN(playlistId)) {
    return res.status(400).json({ error: "ID d'album invalide" });
  }

  try {
    const unlockedUsers = await prisma.unlockedPlaylist.findMany({
      where: { playlistId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            createdAt: true
          }
        }
      },
      orderBy: { unlockedAt: 'desc' }
    });

    const members = unlockedUsers.map(entry => ({
      userId: entry.user.id,
      username: entry.user.username,
      email: entry.user.email,
      unlockedAt: entry.unlockedAt
    }));

    return res.json({
      playlistId,
      totalAccesses: members.length,
      members
    });

  } catch (err) {
    console.error("🔥 ERREUR GET ACCESS LIST :", err);
    return res.status(500).json({ error: "Erreur lors de la récupération des personnes ayant accès." });
  }
};

// ✏️ PUT /api/playlists/:id — Mettre à jour un album (Admin)
exports.updatePlaylist = async (req, res) => {
  const playlistId = parseInt(req.params.id, 10);
  const userRole = req.user?.role;
  const { name, isPrivate, contactNumber } = req.body || {};

  if (userRole !== 'admin' && userRole !== 'superadmin') {
    return res.status(403).json({ error: "Accès refusé. Privilèges insuffisants." });
  }

  if (isNaN(playlistId)) {
    return res.status(400).json({ error: "ID d'album invalide" });
  }

  try {
    let trimmedName;
    if (name !== undefined) {
      trimmedName = name.trim();
      if (!trimmedName) {
        return res.status(400).json({ error: "Le nom de l'album ne peut pas être vide." });
      }

      // 🔒 Vérification de l'unicité du nom (en excluant l'album actuel)
      const existingPlaylist = await prisma.playlist.findFirst({
        where: {
          name: trimmedName,
          id: { not: playlistId }
        }
      });

      if (existingPlaylist) {
        return res.status(400).json({ error: "Un autre album porte déjà ce nom." });
      }
    }

    const isPrivateBool = isPrivate !== undefined ? (isPrivate === 'true' || isPrivate === true) : undefined;
    const coverImageFile = req.files?.image ? req.files.image[0] : null;
    const coverImagePath = coverImageFile ? coverImageFile.key : undefined;

    const updatedPlaylist = await prisma.playlist.update({
      where: { id: playlistId },
      data: {
        ...(trimmedName !== undefined ? { name: trimmedName } : {}),
        ...(isPrivateBool !== undefined ? { 
          isPrivate: isPrivateBool,
          contactNumber: isPrivateBool && contactNumber ? contactNumber.trim() : (isPrivateBool === false ? null : undefined)
        } : {}),
        ...(coverImagePath !== undefined ? { coverImage: coverImagePath } : {})
      }
    });

    console.log(`✏️ Album #${playlistId} mis à jour avec succès.`);
    await invalidate('home:feed:*');
    return res.json({
      success: true,
      message: "Album mis à jour avec succès",
      playlist: mapPlaylist(updatedPlaylist)
    });

  } catch (err) {
    console.error("🔥 ERREUR UPDATE PLAYLIST :", err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: "Album introuvable" });
    }
    return res.status(500).json({ error: "Erreur lors de la mise à jour de l'album" });
  }
};