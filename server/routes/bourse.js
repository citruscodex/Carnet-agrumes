/**
 * server/routes/bourse.js — Bourse aux greffons
 * Plugin Fastify — Enregistrer dans server.js avec :
 *   fastify.register(require('./routes/bourse'), { prefix: '/api' })
 *
 * Routes :
 *   GET    /api/bourse              → annonces actives (public)
 *   GET    /api/bourse/mine         → mes annonces (auth)
 *   POST   /api/bourse              → créer une annonce (auth)
 *   PATCH  /api/bourse/:id          → modifier (auth: propriétaire ou admin)
 *   DELETE /api/bourse/:id          → supprimer (auth: propriétaire ou admin)
 *   POST   /api/bourse/:id/contact  → envoyer un message au propriétaire (auth)
 */

'use strict';

function sanitize(str, max) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim().slice(0, max || 500);
}

module.exports = async function boursePlugin(fastify) {

  // ── GET /api/bourse — Liste publique ─────────────────────────────────────────
  fastify.get('/bourse', async (req, reply) => {
    const { type, q, page = 1, limit = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * Math.min(50, parseInt(limit) || 20);
    const lim = Math.min(50, parseInt(limit) || 20);

    const conditions = ["g.status = 'active'", "g.expires_at > NOW()"];
    const vals = [];

    if (type === 'offre' || type === 'recherche') {
      vals.push(type);
      conditions.push(`g.type = $${vals.length}`);
    }
    if (q && q.trim()) {
      vals.push('%' + q.trim().toLowerCase() + '%');
      conditions.push(`(LOWER(g.species) LIKE $${vals.length} OR LOWER(g.variety) LIKE $${vals.length} OR LOWER(g.region) LIKE $${vals.length})`);
    }

    const where = conditions.join(' AND ');
    vals.push(lim, offset);

    const { rows } = await fastify.pg.query(
      `SELECT g.id, g.type, g.species, g.variety, g.rootstock, g.quantity,
              g.region, g.description, g.status, g.contact_method,
              g.expires_at, g.created_at,
              COALESCE(NULLIF(u.display_name,''), split_part(u.email,'@',1)) AS author
       FROM graft_exchange g
       JOIN users u ON u.id = g.user_id
       WHERE ${where}
       ORDER BY g.created_at DESC
       LIMIT $${vals.length - 1} OFFSET $${vals.length}`,
      vals
    );
    reply.send(rows);
  });

  // ── GET /api/bourse/mine — Mes annonces ──────────────────────────────────────
  fastify.get('/bourse/mine', {
    preHandler: fastify.authenticate
  }, async (req, reply) => {
    const { rows } = await fastify.pg.query(
      `SELECT g.id, g.type, g.species, g.variety, g.rootstock, g.quantity,
              g.region, g.description, g.status, g.contact_method,
              g.expires_at, g.created_at,
              (SELECT COUNT(*) FROM graft_messages m WHERE m.exchange_id = g.id) AS msg_count
       FROM graft_exchange g
       WHERE g.user_id = $1
       ORDER BY g.created_at DESC`,
      [req.user.id]
    );
    reply.send(rows);
  });

  // ── POST /api/bourse — Créer une annonce ─────────────────────────────────────
  fastify.post('/bourse', {
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['type', 'species'],
        properties: {
          type:           { type: 'string', enum: ['offre', 'recherche'] },
          species:        { type: 'string', minLength: 1, maxLength: 200 },
          variety:        { type: 'string', maxLength: 200 },
          rootstock:      { type: 'string', maxLength: 200 },
          quantity:       { type: 'integer', minimum: 0, maximum: 999 },
          region:         { type: 'string', maxLength: 100 },
          description:    { type: 'string', maxLength: 2000 },
          contact_method: { type: 'string', enum: ['message', 'email'] }
        }
      }
    }
  }, async (req, reply) => {
    const { type, species, variety, rootstock, quantity = 1, region, description, contact_method = 'message' } = req.body;
    const { rows } = await fastify.pg.query(
      `INSERT INTO graft_exchange (user_id, type, species, variety, rootstock, quantity, region, description, contact_method)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user.id, type, sanitize(species, 200), sanitize(variety || '', 200) || null,
       sanitize(rootstock || '', 200) || null, quantity,
       sanitize(region || '', 100) || null, sanitize(description || '', 2000) || null,
       contact_method]
    );
    reply.code(201).send(rows[0]);
  });

  // ── PATCH /api/bourse/:id — Modifier ─────────────────────────────────────────
  fastify.patch('/bourse/:id', {
    preHandler: fastify.authenticate
  }, async (req, reply) => {
    const { rows: chk } = await fastify.pg.query(
      `SELECT user_id FROM graft_exchange WHERE id = $1`, [req.params.id]
    );
    if (!chk.length) return reply.code(404).send({ error: 'Annonce introuvable' });
    if (chk[0].user_id !== req.user.id && req.user.role !== 'admin')
      return reply.code(403).send({ error: 'Forbidden' });

    const { type, species, variety, rootstock, quantity, region, description, contact_method, status } = req.body;
    const fields = []; const vals = [];

    if (type && ['offre','recherche'].includes(type)) { vals.push(type); fields.push(`type=$${vals.length}`); }
    if (species)         { vals.push(sanitize(species, 200)); fields.push(`species=$${vals.length}`); }
    if (variety !== undefined) { vals.push(sanitize(variety || '', 200) || null); fields.push(`variety=$${vals.length}`); }
    if (rootstock !== undefined) { vals.push(sanitize(rootstock || '', 200) || null); fields.push(`rootstock=$${vals.length}`); }
    if (quantity !== undefined) { vals.push(parseInt(quantity) || 0); fields.push(`quantity=$${vals.length}`); }
    if (region !== undefined) { vals.push(sanitize(region || '', 100) || null); fields.push(`region=$${vals.length}`); }
    if (description !== undefined) { vals.push(sanitize(description || '', 2000) || null); fields.push(`description=$${vals.length}`); }
    if (contact_method && ['message','email'].includes(contact_method)) { vals.push(contact_method); fields.push(`contact_method=$${vals.length}`); }
    if (status && ['active','reservee','conclue'].includes(status)) { vals.push(status); fields.push(`status=$${vals.length}`); }

    if (!fields.length) return reply.code(400).send({ error: 'Nothing to update' });
    vals.push(req.params.id);
    const { rows } = await fastify.pg.query(
      `UPDATE graft_exchange SET ${fields.join(',')} WHERE id=$${vals.length} RETURNING *`, vals
    );
    reply.send(rows[0]);
  });

  // ── DELETE /api/bourse/:id — Supprimer ───────────────────────────────────────
  fastify.delete('/bourse/:id', {
    preHandler: fastify.authenticate
  }, async (req, reply) => {
    const { rows: chk } = await fastify.pg.query(
      `SELECT user_id FROM graft_exchange WHERE id = $1`, [req.params.id]
    );
    if (!chk.length) return reply.code(404).send({ error: 'Annonce introuvable' });
    if (chk[0].user_id !== req.user.id && req.user.role !== 'admin')
      return reply.code(403).send({ error: 'Forbidden' });

    await fastify.pg.query(`DELETE FROM graft_exchange WHERE id = $1`, [req.params.id]);
    reply.send({ ok: true });
  });

  // ── POST /api/bourse/:id/contact — Envoyer un message ───────────────────────
  fastify.post('/bourse/:id/contact', {
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['body'],
        properties: {
          body: { type: 'string', minLength: 1, maxLength: 2000 }
        }
      }
    }
  }, async (req, reply) => {
    const { rows: chk } = await fastify.pg.query(
      `SELECT id, user_id, species, status FROM graft_exchange WHERE id = $1`, [req.params.id]
    );
    if (!chk.length) return reply.code(404).send({ error: 'Annonce introuvable' });
    if (chk[0].status !== 'active') return reply.code(400).send({ error: 'Annonce inactive' });
    if (chk[0].user_id === req.user.id) return reply.code(400).send({ error: 'Vous ne pouvez pas vous contacter vous-même' });

    const msg = sanitize(req.body.body, 2000);
    await fastify.pg.query(
      `INSERT INTO graft_messages (exchange_id, sender_id, body) VALUES ($1, $2, $3)`,
      [req.params.id, req.user.id, msg]
    );

    // TODO: notifier le propriétaire par email via Scaleway TEM
    reply.code(201).send({ ok: true, message: 'Message envoyé ✓' });
  });
};
