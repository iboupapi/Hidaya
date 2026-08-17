// Client S3 compatible — fonctionne avec Cloudflare R2, Backblaze B2 ou AWS S3
// selon les variables d'environnement renseignées (voir .env.example).
const { S3Client } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: process.env.S3_REGION || 'auto', // 'auto' pour R2, ex. 'us-east-1' pour AWS/B2
  endpoint: process.env.S3_ENDPOINT,       // ex: https://<account_id>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY
  },
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true' // utile pour certains fournisseurs compatibles S3
});

module.exports = s3;
