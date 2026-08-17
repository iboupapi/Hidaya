// Construit l'URL publique d'un fichier stocké sur S3/R2/B2 à partir de sa clé
// (ex: "audios/173-xxx.mp3"). On n'utilise pas file.location renvoyé par multer-s3
// car il pointe vers l'endpoint API, qui n'est pas toujours le domaine public
// (R2 nécessite un domaine personnalisé ou un sous-domaine r2.dev, B2 a une URL
// de téléchargement distincte de son endpoint S3).
function publicUrl(key) {
  if (!key) return null;
  const base = (process.env.S3_PUBLIC_URL || "").replace(/\/+$/, "");
  return `${base}/${key}`;
}

module.exports = publicUrl;
