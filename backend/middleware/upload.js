const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const { Upload } = require("@aws-sdk/lib-storage");
const s3 = require("../config/storage");

// Les fichiers sont gardés en mémoire (buffer) le temps qu'on les traite,
// au lieu d'être envoyés directement sur S3 comme avant — ça nous permet de
// compresser les images avant l'upload final. Les audios, eux, passent tels
// quels (déjà compressés par nature, recompresser dégraderait la qualité).
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100 Mo max par fichier reçu
});

function buildKey(fieldname, originalname) {
  const folder = fieldname === "image" ? "images" : "audios";
  const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
  // Les images compressées sont toujours réencodées en .webp, quel que soit
  // le format d'origine (jpg/png/etc.) — les audios gardent leur extension.
  const ext = fieldname === "image" ? ".webp" : path.extname(originalname);
  return `${folder}/${unique}${ext}`;
}

// Compresse une image : redimensionne à 1200px de large maximum (jamais
// agrandie si elle est plus petite) et réencode en WebP qualité 80 — un bon
// compromis qui réduit généralement la taille de 60 à 90% sans perte
// visible à l'écran.
async function compressImage(buffer) {
  return sharp(buffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
}

async function processAndUpload(file) {
  let buffer = file.buffer;
  let contentType = file.mimetype;

  if (file.fieldname === "image") {
    buffer = await compressImage(file.buffer);
    contentType = "image/webp";
  }

  const key = buildKey(file.fieldname, file.originalname);

  const upload = new Upload({
    client: s3,
    params: {
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType
    }
  });

  await upload.done();

  // On attache "key" au fichier pour que les controllers existants
  // continuent de fonctionner sans aucune modification (ils lisent
  // file.key, exactement comme avec multer-s3 avant).
  file.key = key;
}

// Traite tous les fichiers reçus par multer (req.files, sous forme d'objet
// { fieldname: [file, ...] } avec upload.fields()) puis les envoie sur S3.
async function uploadToS3(req, res, next) {
  try {
    const files = [];

    if (req.file) files.push(req.file);
    if (Array.isArray(req.files)) {
      files.push(...req.files);
    } else if (req.files && typeof req.files === "object") {
      Object.values(req.files).forEach((arr) => files.push(...arr));
    }

    await Promise.all(files.map(processAndUpload));
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  fields: (config) => [memoryUpload.fields(config), uploadToS3]
};