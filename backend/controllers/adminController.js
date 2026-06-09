const db = require('../models/db');
const mailer = require('../utils/mailer');

// 🔧 Helper pour transformer un audio SQL → format API
function mapAudio(row, req) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.main_category,
    subCategory: row.sub_category,
    image: row.image_path
      ? `${req.protocol}://${req.get('host')}/${row.image_path}`
      : null,
    file: `${req.protocol}://${req.get('host')}/${row.file_path}`,
    createdAt: row.created_at
  };
}

// 📊 GET /api/admin/dashboard — stats admin
exports.dashboard = async (req, res) => {
  try {
    const totalAudios = await db.query(`SELECT COUNT(*) FROM audio_files`);
    const totalUsers = await db.query(`SELECT COUNT(*) FROM users`);
    const totalPlaylists = await db.query(`SELECT COUNT(*) FROM playlists`);

    res.json({
      stats: {
        audios: Number(totalAudios.rows[0].count),
        users: Number(totalUsers.rows[0].count),
        playlists: Number(totalPlaylists.rows[0].count)
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
    const { title, description, category, subCategory } = req.body;

    const audioFile = req.files?.audio?.[0];
    const imageFile = req.files?.image?.[0];

    if (!audioFile) {
      return res.status(400).json({ error: "Le fichier audio est obligatoire." });
    }
    if (!title || !category) {
      return res.status(400).json({ error: "Le titre et la catégorie principale sont obligatoires." });
    }

    const validMainCategories = ['Enseignement', 'Emission', 'Musique spirituelle'];
    const validSubCategories = ['Conférence', 'Bayane', 'Exclusif'];

    if (!validMainCategories.includes(category)) {
      return res.status(400).json({ error: "Catégorie principale invalide." });
    }

    let finalSubCategory = null;
    if (category === 'Enseignement') {
      if (!validSubCategories.includes(subCategory)) {
        return res.status(400).json({ error: "Pour un Enseignement, la sous-catégorie doit être Conférence, Bayane ou Exclusif." });
      }
      finalSubCategory = subCategory;
    }

    const filePath = audioFile.path.replace(/\\/g, '/');
    const imagePath = imageFile ? imageFile.path.replace(/\\/g, '/') : null;
    const uploadedBy = req.user.id; 

    // 1. Insertion de l'audio
    const result = await db.query(
      `INSERT INTO audio_files (title, description, main_category, sub_category, image_path, file_path, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, description, category, finalSubCategory, imagePath, filePath, uploadedBy]
    );

    const newAudio = result.rows[0];

    // ⚡ 2. DÉGAGE DES NOTIFICATIONS EN ARRIÈRE-PLAN (pour ne pas faire attendre la réponse HTTP)
    process.nextTick(async () => {
      try {
        // A. Récupérer tous les utilisateurs enregistrés
        const usersResult = await db.query(`SELECT id, email FROM users`);
        const users = usersResult.rows;

        if (users.length > 0) {
          // B. Création des notifications In-App pour chaque utilisateur
          const notifTitle = "Nouveau contenu disponible";
          const notifMessage = `L'audio "${title}" a été ajouté dans la catégorie ${category}.`;
          
          for (const user of users) {
            await db.query(
              `INSERT INTO notifications (user_id, title, message, audio_id) 
               VALUES ($1, $2, $3, $4)`,
              [user.id, notifTitle, notifMessage, newAudio.id]
            );
          }

          // C. Envoi de l'email groupé via la liste des adresses récupérées
          const emailList = users.map(u => u.email);
          await mailer.sendNewAudioEmail(emailList, title, category);
        }
      } catch (notifErr) {
        console.error("Erreur lors de la génération des notifications:", notifErr);
      }
    });

    // 3. Réponse immédiate à l'admin
    res.status(201).json({ 
      success: true, 
      message: "Audio ajouté avec succès. Les notifications sont en cours d'envoi.", 
      audio: mapAudio(newAudio, req) 
    });

  } catch (err) {
    console.error("Erreur lors de l'upload Admin:", err);
    res.status(500).json({ error: "Erreur serveur lors de l'enregistrement de l'audio" });
  }
};
// 🎧 GET /api/admin/audios — liste complète Admin
exports.listAudios = async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM audio_files ORDER BY created_at DESC`);
    const audios = result.rows.map(row => mapAudio(row, req));
    res.json({ audios });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement des audios" });
  }
};

// 🎧 GET /api/admin/audios/:id — voir un audio
exports.viewAudio = async (req, res) => {
  const id = req.params.id;
  try {
    const result = await db.query(`SELECT * FROM audio_files WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Audio introuvable" });
    }
    res.json({ audio: mapAudio(result.rows[0], req) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement de l’audio" });
  }
};

// ✏️ PUT /api/admin/audios/:id — modifier un audio
exports.updateAudio = async (req, res) => {
  const id = req.params.id;
  const { title, description, category, subCategory } = req.body;

  try {
    // Petit check de sécurité sur les catégories lors de la modification aussi
    const validMainCategories = ['Enseignement', 'Emission', 'Musique spirituelle'];
    if (category && !validMainCategories.includes(category)) {
      return res.status(400).json({ error: "Catégorie principale invalide." });
    }

    let finalSubCategory = category === 'Enseignement' ? subCategory : null;

    await db.query(
      `UPDATE audio_files
       SET title = $1, description = $2, main_category = $3, sub_category = $4
       WHERE id = $5`,
      [title, description, category, finalSubCategory, id]
    );

    res.json({ success: true, message: "Audio mis à jour avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la mise à jour" });
  }
};

// 🗑 DELETE /api/admin/audios/:id — supprimer un audio
exports.deleteAudio = async (req, res) => {
  const id = req.params.id;
  try {
    await db.query(`DELETE FROM favorites WHERE audio_id = $1`, [id]);
    await db.query(`DELETE FROM playlist_items WHERE audio_id = $1`, [id]);
    await db.query(`DELETE FROM audio_files WHERE id = $1`, [id]);
    res.json({ success: true, message: "Audio supprimé définitivement" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
};

// 👥 PUT /api/admin/users/:id/role — changer le rôle d'un membre
exports.updateUserRole = async (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;

  const allowedRoles = ["user", "admin", "superadmin"];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: "Rôle invalide" });
  }

  try {
    await db.query(`UPDATE users SET role = $1 WHERE id = $2`, [role, userId]);
    res.json({ success: true, message: "Rôle mis à jour", role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la mise à jour du rôle" });
  }
};

// 👥 GET /api/admin/users — liste complète des membres
exports.listUsers = async (req, res) => {
  try {
    const result = await db.query(`SELECT id, username, email, role, created_at FROM users ORDER BY id ASC`);
    res.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement des utilisateurs" });
  }
};