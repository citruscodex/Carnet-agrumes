/**
 * server/routes/admin.js — Chantier 2 : Panel Admin Gestion des Utilisateurs
 * Plugin Fastify — À enregistrer avec :
 *   fastify.register(require('./routes/admin'), { prefix: '/api' })
 *
 * Toutes les routes nécessitent req.user.role === 'admin' (guard requireAdmin).
 * Rate limiting : 30 req/min sur /api/admin/*.
 */

'use strict';

const VALID_PROFILES = new Set(['collectionneur','pepinieriste','arboriculteur','conservatoire']);
const VALID_ROLES    = new Set(['member','editor','moderator','admin']);

function sanitize(str, max = 200) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim().slice(0, max);
}

function generatePassword(len = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let out = '';
  const arr = new Uint8Array(len);
  require('crypto').getRandomValues
    ? require('crypto').getRandomValues(arr)
    : arr.fill(0).map(() => Math.random() * chars.length | 0);
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length];
  return out;
}

module.exports = async function adminPlugin(fastify) {

  const rateLimitAdmin = { max: 30, timeWindow: '1 minute',
    keyGenerator: req => req.user?.id || req.ip };
  const rateLimitInvite = { max: 20, timeWindow: '24 hours',
    keyGenerator: req => req.user?.id || req.ip };

  // ── GET /api/admin/users — Liste tous les utilisateurs ──────────────────────
  fastify.get('/admin/users', {
    config: { rateLimit: rateLimitAdmin },
    preHandler: [fastify.authenticate, requireAdmin]
  }, async (req, reply) => {
    const { profile_type, role, status, sort = 'created_at', limit = 100 } = req.query;
    let where = "WHERE 1=1";
    const vals = [];
    if (profile_type && VALID_PROFILES.has(profile_type)) { vals.push(profile_type); where += ` AND profile_type=$${vals.length}`; }
    if (role         && VALID_ROLES.has(role))             { vals.push(role);         where += ` AND role=$${vals.length}`; }
    if (status === 'disabled') where += ' AND disabled_at IS NOT NULL';
    if (status === 'active')   where += ' AND disabled_at IS NULL';

    const orderBy = sort === 'email' ? 'email' : 'created_at DESC';
    const lim = Math.min(parseInt(limit) || 100, 500);

    const { rows } = await fastify.pg.query(
      `SELECT u.id, u.email, u.profile_type, u.role, u.created_at, u.disabled_at,
              u.last_login_at,
              COUNT(DISTINCT p.id)::int AS plant_count,
              COUNT(DISTINCT e.id)::int AS event_count
       FROM users u
       LEFT JOIN plants p ON p.user_id = u.id
       LEFT JOIN events e ON e.user_id = u.id
       ${where}
       GROUP BY u.id
       ORDER BY ${orderBy}
       LIMIT $${vals.length + 1}`,
      [...vals, lim]
    );
    reply.send(rows);
  });


  // ── GET /api/admin/users/:id — Détail utilisateur ───────────────────────────
  fastify.get('/admin/users/:id', {
    config: { rateLimit: rateLimitAdmin },
    preHandler: [fastify.authenticate, requireAdmin]
  }, async (req, reply) => {
    const { rows } = await fastify.pg.query(
      `SELECT u.id, u.email, u.profile_type, u.role, u.created_at, u.disabled_at, u.last_login_at,
              COUNT(DISTINCT p.id)::int AS plant_count,
              COUNT(DISTINCT e.id)::int AS event_count
       FROM users u
       LEFT JOIN plants p ON p.user_id = u.id
       LEFT JOIN events e ON e.user_id = u.id
       WHERE u.id = $1 GROUP BY u.id`,
      [req.params.id]
    );
    if (!rows.length) return reply.code(404).send({ error: 'Not found' });
    reply.send(rows[0]);
  });


  // ── PUT /api/admin/users/:id/profile — Changer le profileType ───────────────
  fastify.put('/admin/users/:id/profile', {
    config: { rateLimit: rateLimitAdmin },
    preHandler: [fastify.authenticate, requireAdmin],
    schema: { body: { type: 'object', required: ['profile_type'], properties: { profile_type: { type: 'string' } } } }
  }, async (req, reply) => {
    const { profile_type } = req.body;
    if (!VALID_PROFILES.has(profile_type)) return reply.code(400).send({ error: 'Invalid profile_type' });
    const { rows } = await fastify.pg.query(
      'UPDATE users SET profile_type=$1 WHERE id=$2 RETURNING id,email,profile_type',
      [profile_type, req.params.id]
    );
    if (!rows.length) return reply.code(404).send({ error: 'Not found' });
    reply.send(rows[0]);
  });


  // ── PUT /api/admin/users/:id/role — Changer le rôle ─────────────────────────
  fastify.put('/admin/users/:id/role', {
    config: { rateLimit: rateLimitAdmin },
    preHandler: [fastify.authenticate, requireAdmin],
    schema: { body: { type: 'object', required: ['role'], properties: { role: { type: 'string' } } } }
  }, async (req, reply) => {
    const { role } = req.body;
    if (!VALID_ROLES.has(role)) return reply.code(400).send({ error: 'Invalid role' });
    // Sécurité : un admin ne peut pas retirer son propre rôle admin
    if (req.params.id === req.user.id && role !== 'admin') {
      return reply.code(403).send({ error: 'Cannot demote yourself' });
    }
    const { rows } = await fastify.pg.query(
      'UPDATE users SET role=$1 WHERE id=$2 RETURNING id,email,role',
      [role, req.params.id]
    );
    if (!rows.length) return reply.code(404).send({ error: 'Not found' });
    reply.send(rows[0]);
  });


  // ── DELETE /api/admin/users/:id — Désactiver un compte (soft delete) ────────
  fastify.delete('/admin/users/:id', {
    config: { rateLimit: rateLimitAdmin },
    preHandler: [fastify.authenticate, requireAdmin]
  }, async (req, reply) => {
    if (req.params.id === req.user.id) return reply.code(403).send({ error: 'Cannot disable yourself' });
    const { rows } = await fastify.pg.query(
      "UPDATE users SET disabled_at=NOW() WHERE id=$1 AND disabled_at IS NULL RETURNING id,email,disabled_at",
      [req.params.id]
    );
    if (!rows.length) return reply.code(404).send({ error: 'Not found or already disabled' });
    reply.send(rows[0]);
  });


  // ── GET /api/admin/stats — Statistiques globales (Chantier 8) ──────────────
  fastify.get('/admin/stats', {
    config: { rateLimit: rateLimitAdmin },
    preHandler: [fastify.authenticate, requireAdmin]
  }, async (_req, reply) => {
    const { rows } = await fastify.pg.query(`
      SELECT
        COUNT(*)::int                                                         AS total,
        COUNT(*) FILTER (WHERE last_login_at > NOW() - INTERVAL '7 days')::int  AS active_7d,
        COUNT(*) FILTER (WHERE created_at    > NOW() - INTERVAL '30 days')::int AS new_30d,
        COUNT(*) FILTER (WHERE disabled_at IS NOT NULL)::int                  AS disabled
      FROM users
    `);
    reply.send(rows[0]);
  });


  // ── PATCH /api/admin/users/:id/notes — Notes admin (Chantier 8) ─────────────
  fastify.patch('/admin/users/:id/notes', {
    config: { rateLimit: rateLimitAdmin },
    preHandler: [fastify.authenticate, requireAdmin],
    schema: { body: { type: 'object', required: ['notes'], properties: { notes: { type: 'string', maxLength: 2000 } } } }
  }, async (req, reply) => {
    const { rows } = await fastify.pg.query(
      'UPDATE users SET admin_notes=$1 WHERE id=$2 RETURNING id,email',
      [sanitize(req.body.notes, 2000), req.params.id]
    );
    if (!rows.length) return reply.code(404).send({ error: 'Not found' });
    reply.send(rows[0]);
  });


  // ── POST /api/admin/users/:id/reset-password — Réinitialiser mdp (Chantier 8)
  fastify.post('/admin/users/:id/reset-password', {
    config: { rateLimit: rateLimitAdmin },
    preHandler: [fastify.authenticate, requireAdmin]
  }, async (req, reply) => {
    const bcrypt = require('bcrypt');
    const newPwd = generatePassword();
    const hash = await bcrypt.hash(newPwd, 12);
    const { rows } = await fastify.pg.query(
      'UPDATE users SET password_hash=$1 WHERE id=$2 RETURNING id,email',
      [hash, req.params.id]
    );
    if (!rows.length) return reply.code(404).send({ error: 'Not found' });
    // Email de réinitialisation (Scaleway TEM)
    if (fastify.sendMail) {
      const BASE = fastify.baseUrl || 'https://citruscodex.fr';
      fastify.sendMail(
        rows[0].email,
        '🔑 CitrusCodex — Nouveau mot de passe temporaire',
        `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h1 style="color:#c75b2a">🍊 CitrusCodex</h1>
          <p>Votre mot de passe a été réinitialisé par un administrateur.</p>
          <p>Nouveau mot de passe temporaire :<br>
            <strong style="font-size:1.3em;font-family:monospace;letter-spacing:2px">${newPwd}</strong>
          </p>
          <p><a href="${BASE}" style="display:inline-block;padding:12px 24px;background:#c75b2a;color:white;text-decoration:none;border-radius:8px">Se connecter</a></p>
          <p style="color:#666;font-size:12px">Changez ce mot de passe dès votre prochaine connexion.</p>
        </div>`
      ).catch(err => fastify.log.warn('[mail] reset-pwd email failed:', err.message));
    }
    reply.send({ ok: true, email: rows[0].email, temp_password: newPwd });
  });


  // ── PUT /api/admin/users/:id/suspend — Suspendre un compte (Chantier 8) ──────
  fastify.put('/admin/users/:id/suspend', {
    config: { rateLimit: rateLimitAdmin },
    preHandler: [fastify.authenticate, requireAdmin],
    schema: { body: { type: 'object', properties: { days: { type: 'integer', minimum: 1, default: 7 } } } }
  }, async (req, reply) => {
    if (req.params.id === req.user.id) return reply.code(403).send({ error: 'Cannot suspend yourself' });
    const days = req.body?.days || 7;
    const { rows } = await fastify.pg.query(
      `UPDATE users SET suspended_until = NOW() + INTERVAL '${Math.min(days, 365)} days'
       WHERE id=$1 RETURNING id,email,suspended_until`,
      [req.params.id]
    );
    if (!rows.length) return reply.code(404).send({ error: 'Not found' });
    reply.send(rows[0]);
  });


  // ── POST /api/admin/invite — Inviter un beta-testeur ────────────────────────
  fastify.post('/admin/invite', {
    config: { rateLimit: rateLimitInvite },
    preHandler: [fastify.authenticate, requireAdmin],
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email:        { type: 'string', maxLength: 200 },
          password:     { type: 'string', minLength: 8, maxLength: 200 },
          profile_type: { type: 'string', default: 'collectionneur' }
        }
      }
    }
  }, async (req, reply) => {
    const bcrypt = require('bcrypt');
    const email = sanitize(req.body.email, 200).toLowerCase();
    const password = req.body.password;
    const profile_type = VALID_PROFILES.has(req.body.profile_type) ? req.body.profile_type : 'collectionneur';

    // Validation email basique
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return reply.code(400).send({ error: 'Email invalide' });
    }
    if (password.length < 8) {
      return reply.code(400).send({ error: 'Mot de passe trop court (min 8 caractères)' });
    }

    // Unicité email
    const exists = await fastify.pg.query('SELECT id FROM users WHERE email=$1', [email]);
    if (exists.rows.length) return reply.code(409).send({ error: 'Email déjà utilisé' });

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await fastify.pg.query(
      'INSERT INTO users (email, password_hash, profile_type, role) VALUES ($1,$2,$3,$4) RETURNING id,email,profile_type,created_at',
      [email, hash, profile_type, 'member']
    );

    // Email de bienvenue optionnel (Scaleway TEM)
    if (fastify.sendMail) {
      const BASE = fastify.baseUrl || 'https://citruscodex.fr';
      fastify.sendMail(
        email,
        '🍊 Bienvenue sur CitrusCodex — Votre accès bêta',
        `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h1 style="color:#c75b2a">🍊 CitrusCodex</h1>
          <p>Bonjour,</p>
          <p>Votre compte bêta-testeur a été créé :</p>
          <ul>
            <li><strong>Email :</strong> ${email}</li>
            <li><strong>Mot de passe :</strong> ${password}</li>
            <li><strong>Profil :</strong> ${profile_type}</li>
          </ul>
          <p><a href="${BASE}" style="display:inline-block;padding:12px 24px;background:#c75b2a;color:white;text-decoration:none;border-radius:8px">Accéder à CitrusCodex</a></p>
          <p style="color:#666;font-size:12px">Changez votre mot de passe dès votre première connexion.</p>
        </div>`
      ).catch(err => fastify.log.warn('[mail] welcome email failed:', err.message));
    }

    reply.code(201).send(rows[0]);
  });
};

// ── Guard admin ────────────────────────────────────────────────────────────────
async function requireAdmin(req, reply) {
  if (req.user?.role !== 'admin') reply.code(403).send({ error: 'Admin required' });
}
