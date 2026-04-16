/**
 * server/app.js — Entrée du serveur Fastify CCA
 *
 * Déploiement : copier ce fichier sur /opt/cca/ et relancer pm2
 *   scp server/app.js root@62.210.237.49:/opt/cca/app.js
 *   ssh root@62.210.237.49 "pm2 restart cca"
 *
 * Prérequis : fastify, @fastify/jwt, @fastify/rate-limit, fastify-postgres
 * Variable d'environnement : DATABASE_URL, JWT_SECRET
 */

'use strict';

const Fastify = require('fastify');

async function build(opts = {}) {
  const app = Fastify({ logger: opts.logger ?? true });

  // ── Plugins globaux ──────────────────────────────────────────────────────────
  await app.register(require('@fastify/rate-limit'), {
    global: true,
    max: 100,
    timeWindow: '1 minute'
  });

  await app.register(require('@fastify/jwt'), {
    secret: process.env.JWT_SECRET || 'CHANGE_ME_IN_PROD'
  });

  await app.register(require('fastify-postgres'), {
    connectionString: process.env.DATABASE_URL
  });

  // ── Décorateur authenticate ──────────────────────────────────────────────────
  app.decorate('authenticate', async function (req, reply) {
    try {
      await req.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  // ── Routes publiques (auth) ──────────────────────────────────────────────────
  // Les routes /api/auth/* doivent exister sur le serveur (login, refresh, register)
  // Exemple minimal si pas encore présent :
  // await app.register(require('./routes/auth'), { prefix: '/api' });

  // ── Routes bugs (Chantier 5 — fix 404) ─────────────────────────────────────
  // IMPORTANT : ce register résout les 404 sur /api/bugs/mine et /api/bugs
  await app.register(require('./routes/bugs'), { prefix: '/api' });

  // ── Routes admin panel (Chantier 8) ─────────────────────────────────────────
  await app.register(require('./routes/admin'), { prefix: '/api' });

  // ── Routes sync ─────────────────────────────────────────────────────────────
  // Route GET /api/sync — retourne toutes les clés agrumes_* de l'utilisateur
  // Route PUT /api/sync/:key — enregistre une clé pour l'utilisateur
  // Ces routes doivent exister séparément sur le serveur (non incluses ici car déjà présentes)

  // ── Routes observatoire ──────────────────────────────────────────────────────
  // GET /api/observatoire/map  → [{lat_approx, lng_approx, event_type, region, count}]
  // GET /api/observatoire/journal → [{species, event_type, region, observed_at, member_name}]
  // POST /api/observatoire → créer une observation

  // ── Routes wiki ──────────────────────────────────────────────────────────────
  // (ancien wiki serveur — plus utilisé dans le frontend, conservé pour compatibilité)
  // await app.register(require('./routes/wiki'), { prefix: '/api' });

  return app;
}

// Démarrage direct
if (require.main === module) {
  const port = parseInt(process.env.PORT || '3000', 10);
  build({ logger: true }).then(app => {
    app.listen({ port, host: '0.0.0.0' }, (err, address) => {
      if (err) { console.error(err); process.exit(1); }
      console.log(`CCA server listening at ${address}`);
    });
  });
}

module.exports = build;
