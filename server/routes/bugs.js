/**
 * server/routes/bugs.js — Module C : Bug Tracker Beta
 * Plugin Fastify — À enregistrer dans server.js avec :
 *   fastify.register(require('./routes/bugs'), { prefix: '/api' })
 *
 * Pré-requis :
 *   - fastify-jwt installé et configuré (fastify.authenticate hook)
 *   - @fastify/rate-limit installé
 *   - Pool pg exposé via fastify.pg (fastify-postgres ou fastify.decorate)
 */

'use strict';

const VALID_CATEGORIES = new Set(['bug', 'feature', 'ui', 'perf', 'other']);
const VALID_SEVERITIES  = new Set(['low', 'medium', 'high', 'critical']);
const VALID_STATUSES    = new Set(['open', 'acknowledged', 'in_progress', 'resolved', 'closed', 'wont_fix']);

// ── Helpers ────────────────────────────────────────────────────────────────────

function sanitize(str, max = 2000) {
  if (typeof str !== 'string') return '';
  // Supprimer balises HTML, limiter longueur
  return str.replace(/<[^>]*>/g, '').trim().slice(0, max);
}

// ── Plugin ─────────────────────────────────────────────────────────────────────

module.exports = async function bugsPlugin(fastify) {

  // Rate limit spécifique à la création (5/jour/utilisateur)
  const rateLimitCreate = {
    max: 5,
    timeWindow: '24 hours',
    keyGenerator: req => req.user?.id || req.ip,
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Limite de 5 rapports par jour atteinte.'
    })
  };

  // ── POST /api/bugs — Créer un rapport ───────────────────────────────────────
  fastify.post('/bugs', {
    config: { rateLimit: rateLimitCreate },
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['title', 'description'],
        properties: {
          title:        { type: 'string', minLength: 1, maxLength: 200 },
          description:  { type: 'string', minLength: 1, maxLength: 4000 },
          category:     { type: 'string', default: 'bug' },
          severity:     { type: 'string', default: 'medium' },
          page_context: { type: 'string', maxLength: 100 },
          browser_info: { type: 'string', maxLength: 500 },
          screen_size:  { type: 'string', maxLength: 20 },
          app_version:  { type: 'string', maxLength: 20 }
        }
      }
    }
  }, async (req, reply) => {
    const userId = req.user.id;
    const {
      title, description,
      category = 'bug', severity = 'medium',
      page_context, browser_info, screen_size, app_version
    } = req.body;

    const cat = VALID_CATEGORIES.has(category) ? category : 'bug';
    const sev = VALID_SEVERITIES.has(severity)  ? severity : 'medium';

    const { rows } = await fastify.pg.query(
      `INSERT INTO bug_reports
         (user_id, title, description, category, severity, page_context, browser_info, screen_size, app_version)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, status, created_at`,
      [
        userId,
        sanitize(title, 200),
        sanitize(description, 4000),
        cat, sev,
        sanitize(page_context  || '', 100),
        sanitize(browser_info  || '', 500),
        sanitize(screen_size   || '', 20),
        sanitize(app_version   || '', 20)
      ]
    );

    reply.code(201).send(rows[0]);
  });


  // ── GET /api/bugs/mine — Mes rapports ───────────────────────────────────────
  fastify.get('/bugs/mine', {
    preHandler: fastify.authenticate
  }, async (req, reply) => {
    const { rows } = await fastify.pg.query(
      `SELECT id, title, category, severity, status, resolution_notes, created_at, updated_at
       FROM bug_reports
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [req.user.id]
    );
    reply.send(rows);
  });


  // ── GET /api/bugs/stats — Compteurs par statut (admin) ─────────────────────
  fastify.get('/bugs/stats', {
    preHandler: [fastify.authenticate, requireAdmin]
  }, async (_req, reply) => {
    const { rows } = await fastify.pg.query(
      `SELECT status, COUNT(*)::int AS count
       FROM bug_reports
       GROUP BY status`
    );
    const stats = {};
    rows.forEach(r => { stats[r.status] = r.count; });
    reply.send(stats);
  });


  // ── GET /api/bugs — Tous les rapports (admin) ───────────────────────────────
  fastify.get('/bugs', {
    preHandler: [fastify.authenticate, requireAdmin]
  }, async (req, reply) => {
    const { status, severity, category } = req.query;
    let where = 'WHERE 1=1';
    const vals = [];
    if (status   && VALID_STATUSES.has(status))    { vals.push(status);   where += ` AND status=$${vals.length}`; }
    if (severity && VALID_SEVERITIES.has(severity)) { vals.push(severity); where += ` AND severity=$${vals.length}`; }
    if (category && VALID_CATEGORIES.has(category)) { vals.push(category); where += ` AND category=$${vals.length}`; }

    const { rows } = await fastify.pg.query(
      `SELECT b.id, b.title, b.description, b.category, b.severity, b.status,
              b.page_context, b.browser_info, b.screen_size, b.app_version,
              b.admin_notes, b.resolution_notes, b.resolved_at,
              b.created_at, b.updated_at,
              u.email AS user_email
       FROM bug_reports b
       LEFT JOIN users u ON u.id = b.user_id
       ${where}
       ORDER BY
         CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
         created_at DESC
       LIMIT 500`,
      vals
    );
    reply.send(rows);
  });


  // ── GET /api/bugs/:id — Détail d'un rapport ─────────────────────────────────
  fastify.get('/bugs/:id', {
    preHandler: fastify.authenticate
  }, async (req, reply) => {
    const { rows } = await fastify.pg.query(
      `SELECT b.id, b.title, b.description, b.category, b.severity, b.status,
              b.page_context, b.browser_info, b.screen_size, b.app_version,
              b.resolution_notes, b.resolved_at,
              b.created_at, b.updated_at,
              b.user_id,
              u.email AS user_email
       FROM bug_reports b
       LEFT JOIN users u ON u.id = b.user_id
       WHERE b.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return reply.code(404).send({ error: 'Not found' });

    const bug = rows[0];
    const isAdmin = req.user.role === 'admin';
    const isOwner = bug.user_id === req.user.id;
    if (!isAdmin && !isOwner) return reply.code(403).send({ error: 'Forbidden' });

    // Masquer admin_notes pour les non-admins
    if (!isAdmin) delete bug.admin_notes;
    reply.send(bug);
  });


  // ── PATCH /api/bugs/:id — Modifier statut/notes (admin) ────────────────────
  fastify.patch('/bugs/:id', {
    preHandler: [fastify.authenticate, requireAdmin],
    schema: {
      body: {
        type: 'object',
        properties: {
          status:           { type: 'string' },
          admin_notes:      { type: 'string', maxLength: 2000 },
          resolution_notes: { type: 'string', maxLength: 2000 }
        }
      }
    }
  }, async (req, reply) => {
    const { status, admin_notes, resolution_notes } = req.body;
    const fields = [];
    const vals   = [];

    if (status !== undefined) {
      if (!VALID_STATUSES.has(status)) return reply.code(400).send({ error: 'Invalid status' });
      vals.push(status); fields.push(`status=$${vals.length}`);
      if (status === 'resolved') {
        fields.push('resolved_at=NOW()');
      }
    }
    if (admin_notes      !== undefined) { vals.push(sanitize(admin_notes, 2000));      fields.push(`admin_notes=$${vals.length}`); }
    if (resolution_notes !== undefined) { vals.push(sanitize(resolution_notes, 2000)); fields.push(`resolution_notes=$${vals.length}`); }

    if (!fields.length) return reply.code(400).send({ error: 'Nothing to update' });

    vals.push(req.params.id);
    const { rows } = await fastify.pg.query(
      `UPDATE bug_reports SET ${fields.join(',')} WHERE id=$${vals.length} RETURNING id,status,updated_at`,
      vals
    );
    if (!rows.length) return reply.code(404).send({ error: 'Not found' });
    reply.send(rows[0]);
  });
};

// ── Guard admin ────────────────────────────────────────────────────────────────
async function requireAdmin(req, reply) {
  if (req.user?.role !== 'admin') {
    reply.code(403).send({ error: 'Admin required' });
  }
}
