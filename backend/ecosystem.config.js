// Configuration PM2 — fait tourner l'API sur plusieurs process Node (un par
// cœur CPU disponible) derrière un répartiteur de charge interne à PM2, au
// lieu d'un seul process comme avec `node app.js`.
//
// Démarrage en production : pm2 start ecosystem.config.js --env production
// Arrêt :                   pm2 stop ecosystem.config.js
// Logs en direct :          pm2 logs hidaya-api
//
// ⚠️ Prérequis : le point 2 (stockage S3/R2/B2) doit être en place avant
// d'utiliser le mode cluster/plusieurs instances — sinon les différents
// process ne verraient pas les mêmes fichiers uploadés.
module.exports = {
  apps: [
    {
      name: 'hidaya-api',
      script: 'app.js',
      instances: 'max', // un process par cœur CPU disponible
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};
