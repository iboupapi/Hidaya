// Script ponctuel : migre les fichiers déjà présents sur le disque local
// (backend/uploads/audios, backend/uploads/images) vers le bucket S3/R2/B2
// configuré dans .env, puis met à jour filePath/imagePath/coverImage en base
// pour qu'ils pointent vers la nouvelle clé objet au lieu du chemin disque.
//
// Usage : node scripts/migrate-to-s3.js
// (à lancer une seule fois, après avoir configuré S3_* dans .env et AVANT
// de retirer app.use('/uploads', express.static('uploads')) de app.js)

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Upload } = require('@aws-sdk/lib-storage');
const s3 = require('../config/storage');
const prisma = require('../models/db');

const BUCKET = process.env.S3_BUCKET;
const UPLOADS_ROOT = path.join(__dirname, '..'); // backend/

if (!BUCKET) {
  console.error('❌ S3_BUCKET manquant dans .env — abandon.');
  process.exit(1);
}

// "uploads/audios/1699999999-123.mp3" -> "audios/1699999999-123.mp3"
function toObjectKey(localPath) {
  return localPath.replace(/\\/g, '/').replace(/^uploads\//, '');
}

function guessContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.mp3') return 'audio/mpeg';
  if (ext === '.wav') return 'audio/wav';
  if (ext === '.m4a') return 'audio/mp4';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return 'application/octet-stream';
}

async function uploadIfLocal(localPath) {
  if (!localPath) return { key: null, skipped: true };
  // Déjà migré (les nouvelles clés ne commencent pas par "uploads/")
  if (!localPath.replace(/\\/g, '/').startsWith('uploads/')) {
    return { key: localPath, skipped: true };
  }

  const absolutePath = path.join(UPLOADS_ROOT, localPath.replace(/\\/g, '/'));
  if (!fs.existsSync(absolutePath)) {
    console.warn(`   ⚠️  Fichier introuvable sur disque, ignoré : ${localPath}`);
    return { key: null, skipped: true, missing: true };
  }

  const key = toObjectKey(localPath);

  const upload = new Upload({
    client: s3,
    params: {
      Bucket: BUCKET,
      Key: key,
      Body: fs.createReadStream(absolutePath),
      ContentType: guessContentType(absolutePath)
    }
  });

  await upload.done();
  return { key, skipped: false };
}

async function migrateAudios() {
  const audios = await prisma.audioFile.findMany({
    select: { id: true, title: true, filePath: true, imagePath: true }
  });

  console.log(`🎧 ${audios.length} audio(s) à vérifier...`);
  let migrated = 0;

  for (const audio of audios) {
    const fileResult = await uploadIfLocal(audio.filePath);
    const imageResult = await uploadIfLocal(audio.imagePath);

    const data = {};
    if (!fileResult.skipped && fileResult.key) data.filePath = fileResult.key;
    if (!imageResult.skipped && imageResult.key) data.imagePath = imageResult.key;

    if (Object.keys(data).length > 0) {
      await prisma.audioFile.update({ where: { id: audio.id }, data });
      migrated++;
      console.log(`   ✅ [audio #${audio.id}] "${audio.title}" migré`);
    }
  }

  console.log(`🎧 Audios migrés : ${migrated}/${audios.length}`);
}

async function migratePlaylists() {
  const playlists = await prisma.playlist.findMany({
    select: { id: true, name: true, coverImage: true }
  });

  console.log(`📂 ${playlists.length} album(s) à vérifier...`);
  let migrated = 0;

  for (const playlist of playlists) {
    const coverResult = await uploadIfLocal(playlist.coverImage);

    if (!coverResult.skipped && coverResult.key) {
      await prisma.playlist.update({
        where: { id: playlist.id },
        data: { coverImage: coverResult.key }
      });
      migrated++;
      console.log(`   ✅ [album #${playlist.id}] "${playlist.name}" migré`);
    }
  }

  console.log(`📂 Albums migrés : ${migrated}/${playlists.length}`);
}

async function main() {
  console.log(`🚀 Migration vers le bucket "${BUCKET}" (endpoint: ${process.env.S3_ENDPOINT})\n`);
  await migrateAudios();
  await migratePlaylists();
  console.log('\n🎉 Migration terminée. Vérifiez quelques audios/images avant de retirer');
  console.log('   app.use(\'/uploads\', express.static(\'uploads\')) de app.js.');
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('🔥 Erreur pendant la migration :', err);
  await prisma.$disconnect();
  process.exit(1);
});
