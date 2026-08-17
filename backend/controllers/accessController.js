const prisma = require('../models/db');
const crypto = require('crypto');

// 🔑 POST /api/admin/codes — Générer un code pour un album (Admin seulement)
exports.generateCode = async (req, res) => {
  const { playlist_id, playlistId } = req.body;
  const targetPlaylistId = parseInt(playlist_id || playlistId);

  if (isNaN(targetPlaylistId)) {
    return res.status(400).json({ error: "L'ID de l'album/playlist est obligatoire et doit être un entier." });
  }

  try {
    // Vérifier si la playlist existe
    const playlist = await prisma.playlist.findUnique({
      where: { id: targetPlaylistId },
      select: { id: true, name: true }
    });

    if (!playlist) {
      return res.status(404).json({ error: "L'album/playlist spécifié n'existe pas." });
    }

    // Génération d'un code unique de 12 caractères (ex: DI-8-A8F299B1)
    const randomString = crypto.randomBytes(4).toString('hex').toUpperCase();
    const code = `DI-${targetPlaylistId}-${randomString}`;

    const newCode = await prisma.accessCode.create({
      data: {
        code,
        playlistId: targetPlaylistId
      }
    });

    res.status(201).json({
      success: true,
      message: "Code d'accès généré avec succès !",
      code: newCode.code,
      album: playlist.name
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la génération du code" });
  }
};

// 🔓 POST /api/playlists/unlock — Débloquer un album avec un code (Utilisateur connecté)
exports.unlockPlaylist = async (req, res) => {
  const { code } = req.body;
  const userId = req.user.id;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: "Le code d'accès est obligatoire." });
  }

  const cleanCode = code.trim();

  try {
    // 1. Vérifier si le code existe et inclure la playlist associées
    const accessCode = await prisma.accessCode.findUnique({
      where: { code: cleanCode },
      include: {
        playlist: {
          select: { name: true }
        }
      }
    });

    if (!accessCode) {
      return res.status(404).json({ error: "Code invalide ou inexistant." });
    }

    if (accessCode.isUsed) {
      return res.status(400).json({ error: "Ce code a déjà été utilisé par un autre disciple." });
    }

    // 2. Transaction atomique : Déblocage de la playlist + Invalidation du code
    await prisma.$transaction(async (tx) => {
      // Associer l'utilisateur à cet album (Équivalent ON CONFLICT DO NOTHING)
      await tx.unlockedPlaylist.upsert({
        where: {
          userId_playlistId: {
            userId,
            playlistId: accessCode.playlistId
          }
        },
        update: {}, // Aucune modification si déjà présent
        create: {
          userId,
          playlistId: accessCode.playlistId
        }
      });

      // Marquer le code comme utilisé
      await tx.accessCode.update({
        where: { id: accessCode.id },
        data: { isUsed: true }
      });
    });

    res.json({
      success: true,
      message: `Félicitations ! L'album "${accessCode.playlist.name}" est désormais débloqué sur votre compte.`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du déblocage de l'album" });
  }
};