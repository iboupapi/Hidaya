const prisma = require('../models/db');
const mailer = require('../utils/mailer');
const publicUrl = require('../utils/publicUrl');
const { invalidate } = require('../utils/cache');

// 🔧 Helper pour transformer un audio Prisma → format API
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
    createdAt: audio.createdAt
  };
}

// 📊 GET /api/admin/dashboard — stats admin
exports.dashboard = async (req, res) => {
  try {
    const [totalAudios, totalUsers, totalPlaylists] = await Promise.all([
      prisma.audioFile.count(),
      prisma.user.count(),
      prisma.playlist.count()
    ]);

    res.json({
      stats: {
        audios: totalAudios,
        users: totalUsers,
        playlists: totalPlaylists
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement du dashboard" });
  }
};

// 🎤 POST /api/admin/audios — uploader un audio + générer notifications (In-App & Email)
exports.uploadAudio = async (req, res) => {
  try {
    const { title, description, category, subCategory, duration } = req.body;

    const audioFile = req.files?.audio?.[0];
    const imageFile = req.files?.image?.[0];

    if (!audioFile) {
      return res.status(400).json({ error: "Le fichier audio est obligatoire." });
    }
    if (!title || !category) {
      return res.status(400).json({ error: "Le titre et la catégorie principale sont obligatoires." });
    }

    const trimmedTitle = title.trim();

    // 🔒 Vériﬁcation : Empêcher les doublons de titre
    const existingAudio = await prisma.audioFile.findFirst({
      where: { title: trimmedTitle }
    });

    if (existingAudio) {
      return res.status(400).json({ error: "Un audio portant ce titre existe déjà." });
    }

    // Accepte avec ou sans accent pour éviter les conflits d'encodage frontend
    const validMainCategories = ['Enseignement', 'Émission', 'Emission', 'Musique spirituelle'];
    const validSubCategories = ['Bayane', 'Conférence', 'Rappel'];

    if (!validMainCategories.includes(category.trim())) {
      return res.status(400).json({ error: "Catégorie principale invalide." });
    }

    let finalSubCategory = null;
    if (category.trim() === 'Enseignement') {
      if (!subCategory || !validSubCategories.includes(subCategory.trim())) {
        return res.status(400).json({ 
          error: "Pour un Enseignement, la sous-catégorie doit être Bayane, Conférence ou Rappel." 
        });
      }
      finalSubCategory = subCategory.trim();
    }

    const filePath = audioFile.key;
    const imagePath = imageFile ? imageFile.key : null;
    const uploadedBy = req.user.id;

    // Normaliser la catégorie principale ("Emission" -> "Émission")
    const finalMainCategory = category.trim() === 'Emission' ? 'Émission' : category.trim();

    // 1. Insertion de l'audio via Prisma
    const newAudio = await prisma.audioFile.create({
      data: {
        title: trimmedTitle,
        description: description ? description.trim() : null,
        mainCategory: finalMainCategory,
        subCategory: finalSubCategory,
        duration: duration ? parseInt(duration, 10) : 0,
        imagePath,
        filePath,
        uploadedBy
      }
    });

    // ⚡ 2. DÉGAGE DES NOTIFICATIONS EN ARRIÈRE-PLAN
    process.nextTick(async () => {
      try {
        const users = await prisma.user.findMany({
          select: { id: true, email: true }
        });

        if (users.length > 0) {
          const notifTitle = "Nouveau contenu disponible";
          const notifMessage = `L'audio "${trimmedTitle}" a été ajouté dans la catégorie ${finalMainCategory}.`;

          const notificationsData = users.map(user => ({
            userId: user.id,
            title: notifTitle,
            message: notifMessage,
            audioId: newAudio.id
          }));

          await prisma.notification.createMany({
            data: notificationsData
          });

          const emailList = users.map(u => u.email);
          await mailer.sendNewAudioEmail(emailList, trimmedTitle, finalMainCategory);
        }
      } catch (notifErr) {
        console.error("Erreur lors de la génération des notifications:", notifErr);
      }
    });

    // 3. Invalider le cache home/populaires pour que le nouvel audio apparaisse tout de suite
    await invalidate('home:feed:*');
    await invalidate('audios:popular:*');

    // 4. Réponse immédiate à l'admin
    res.status(201).json({
      success: true,
      message: "Audio ajouté avec succès. Les notifications sont en cours d'envoi.",
      audio: mapAudio(newAudio)
    });

  } catch (err) {
    console.error("Erreur lors de l'upload Admin:", err);
    res.status(500).json({ error: "Erreur serveur lors de l'enregistrement de l'audio" });
  }
};

// 🎧 GET /api/admin/audios — liste complète Admin
exports.listAudios = async (req, res) => {
  try {
    const audios = await prisma.audioFile.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json({ audios: audios.map(audio => mapAudio(audio)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement des audios" });
  }
};

// 🎧 GET /api/admin/audios/:id — voir un audio
exports.viewAudio = async (req, res) => {
  const id = parseInt(req.params.id, 10);

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

    res.json({ audio: mapAudio(audio) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement de l’audio" });
  }
};

// ✏️ PUT /api/admin/audios/:id — modifier un audio
exports.updateAudio = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { title, description, category, subCategory, duration } = req.body;

  if (isNaN(id)) {
    return res.status(400).json({ error: "ID invalide" });
  }

  try {
    // 🔒 Vériﬁcation de l'unicité du titre en cas de modification
    let trimmedTitle;
    if (title) {
      trimmedTitle = title.trim();
      const existingAudio = await prisma.audioFile.findFirst({
        where: {
          title: trimmedTitle,
          id: { not: id } // Exclure l'audio en cours de modification
        }
      });

      if (existingAudio) {
        return res.status(400).json({ error: "Un autre audio porte déjà ce titre." });
      }
    }

    const validMainCategories = ['Enseignement', 'Émission', 'Emission', 'Musique spirituelle'];
    const validSubCategories = ['Bayane', 'Conférence', 'Rappel'];

    let finalMainCategory = category;
    if (category) {
      if (!validMainCategories.includes(category.trim())) {
        return res.status(400).json({ error: "Catégorie principale invalide." });
      }
      finalMainCategory = category.trim() === 'Emission' ? 'Émission' : category.trim();
    }

    let finalSubCategory; 
    if (category) {
      if (finalMainCategory === 'Enseignement') {
        if (subCategory && !validSubCategories.includes(subCategory.trim())) {
          return res.status(400).json({ error: "Sous-catégorie invalide pour Enseignement." });
        }
        finalSubCategory = subCategory ? subCategory.trim() : null;
      } else {
        finalSubCategory = null;
      }
    } else if (subCategory !== undefined) {
      if (subCategory && !validSubCategories.includes(subCategory.trim())) {
        return res.status(400).json({ error: "Sous-catégorie invalide." });
      }
      finalSubCategory = subCategory ? subCategory.trim() : null;
    }

    const updatedAudio = await prisma.audioFile.update({
      where: { id },
      data: {
        title: trimmedTitle !== undefined ? trimmedTitle : undefined,
        description: description !== undefined ? (description ? description.trim() : null) : undefined,
        mainCategory: finalMainCategory,
        subCategory: finalSubCategory,
        duration: duration !== undefined ? parseInt(duration, 10) : undefined
      }
    });

    await invalidate('home:feed:*');
    await invalidate('audios:popular:*');

    res.json({ 
      success: true, 
      message: "Audio mis à jour avec succès",
      audio: mapAudio(updatedAudio)
    });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: "Audio introuvable" });
    }
    res.status(500).json({ error: "Erreur lors de la mise à jour" });
  }
};

// 🗑 DELETE /api/admin/audios/:id — supprimer un audio
exports.deleteAudio = async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({ error: "ID invalide" });
  }

  try {
    await prisma.audioFile.delete({
      where: { id }
    });

    await invalidate('home:feed:*');
    await invalidate('audios:popular:*');

    res.json({ success: true, message: "Audio supprimé définitivement" });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: "Audio introuvable" });
    }
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
};

// 👥 PUT /api/admin/users/:id/role — changer le rôle d'un membre
exports.updateUserRole = async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { role } = req.body;

  if (isNaN(userId)) {
    return res.status(400).json({ error: "ID utilisateur invalide" });
  }

  const allowedRoles = ["user", "admin", "superadmin"];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: "Rôle invalide" });
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role }
    });

    res.json({ success: true, message: "Rôle mis à jour", role });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }
    res.status(500).json({ error: "Erreur lors de la mise à jour du rôle" });
  }
};

// 👥 GET /api/admin/users — liste complète des membres
exports.listUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { id: 'asc' }
    });

    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement des utilisateurs" });
  }
};