const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require("path");
const s3 = require("../config/storage");

const storage = multerS3({
  s3,
  bucket: process.env.S3_BUCKET,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  // Pas d'ACL ici : R2 et B2 ne supportent pas les ACL façon AWS.
  // La visibilité publique se gère au niveau du bucket lui-même (voir .env.example).
  key: (req, file, cb) => {
    const folder = file.fieldname === "image" ? "images" : "audios";
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${folder}/${unique}${path.extname(file.originalname)}`);
  }
});

module.exports = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100 Mo max par fichier
});
