const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlistController');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Toutes les routes de ce fichier exigent une connexion valide
router.use(authenticateToken);

// 📂 Liste des albums
router.get('/', playlistController.listPlaylists);

// ➕ Création d'un album avec fichiers (Multer)
router.post(
  '/',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'audios', maxCount: 20 }
  ]),
  playlistController.createPlaylist
);

// 🔍 Consultation d'un album
router.get('/:id', playlistController.viewPlaylist);

// ✏️ Mettre à jour un album (Admin)
router.put('/:id', upload.fields([{ name: 'image', maxCount: 1 }]), playlistController.updatePlaylist);

// ➕ Ajouter un audio à un album
router.post('/:id/add', playlistController.addAudio);

// ❌ Supprimer un album
router.delete('/:id', playlistController.deletePlaylist);

// ❌ Retirer un audio d'un album
router.delete('/:id/remove/:audioId', playlistController.removeAudio);

// 🔓 Déverrouiller un album privé via code d'accès
router.post('/:id/unlock', playlistController.unlockPlaylist);

// 👥 Obtenir la liste des personnes ayant accès (Admin)
router.get('/:id/access-list', playlistController.getPlaylistAccessList);

module.exports = router;