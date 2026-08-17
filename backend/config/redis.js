// Client Redis — utilisé pour cacher les endpoints les plus consultés
// (page d'accueil, audios populaires) afin d'éviter de retaper la base
// à chaque requête sous forte charge.
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  // Ne bloque jamais le serveur si Redis est momentanément indisponible :
  // les appels échoueront proprement et cache.js retombera sur la base.
  maxRetriesPerRequest: 2,
  lazyConnect: false
});

redis.on('error', (err) => {
  console.error('🔥 Erreur Redis :', err.message);
});

module.exports = redis;
