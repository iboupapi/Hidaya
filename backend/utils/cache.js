const redis = require('../config/redis');

// Récupère une valeur en cache, ou l'obtient via fetchFn() et la met en cache
// pendant ttlSeconds. Si Redis est indisponible, on ignore le cache et on
// exécute simplement fetchFn() — le site continue de fonctionner, juste sans
// l'accélération du cache.
async function cached(key, ttlSeconds, fetchFn) {
  try {
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit);
  } catch (err) {
    console.error(`⚠️  Lecture cache échouée pour "${key}" :`, err.message);
  }

  const data = await fetchFn();

  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  } catch (err) {
    console.error(`⚠️  Écriture cache échouée pour "${key}" :`, err.message);
  }

  return data;
}

// Supprime toutes les clés correspondant à un pattern (ex: 'home:feed:*'),
// à appeler après toute création/modification/suppression de contenu pour
// que les utilisateurs voient le changement sans attendre l'expiration du TTL.
async function invalidate(pattern) {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
  } catch (err) {
    console.error(`⚠️  Invalidation cache échouée pour "${pattern}" :`, err.message);
  }
}

module.exports = { cached, invalidate };
