/**
 * server/routes/orders.js — Chantier 10 : Commandes groupées géographiques
 * Plugin Fastify — À enregistrer dans server/app.js avec :
 *   await app.register(require('./routes/orders'), { prefix: '/api' })
 *
 * Routes (auth requise) :
 *   POST   /api/orders              → créer une commande
 *   GET    /api/orders/nearby       → commandes dans un rayon (?lat=&lng=&km=50)
 *   GET    /api/orders/mine         → mes commandes (organisées)
 *   GET    /api/orders/:id          → détail
 *   PATCH  /api/orders/:id          → modifier (organisateur)
 *   POST   /api/orders/:id/join     → rejoindre (avec items)
 *   PATCH  /api/orders/:id/participants/:uid → modifier statut participant
 *   GET    /api/orders/:id/messages → messages internes
 *   POST   /api/orders/:id/messages → envoyer un message
 */

'use strict';

const VALID_CATEGORIES = new Set(['plants','pots','engrais','substrats','amendements','outils','divers']);
const VALID_STATUSES   = new Set(['open','closed','ordered','delivered','cancelled']);

function sanitize(str, max = 500) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim().slice(0, max);
}

// Distance Haversine en km
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

module.exports = async function ordersPlugin(fastify) {

  const rateLimitCreate = { max: 5, timeWindow: '1 hour', keyGenerator: req => req.user?.id || req.ip };

  // ── POST /api/orders — Créer une commande ───────────────────────────────────
  fastify.post('/orders', {
    config: { rateLimit: rateLimitCreate },
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['title','deadline'],
        properties: {
          title:                  { type: 'string', minLength: 3, maxLength: 200 },
          description:            { type: 'string', maxLength: 5000 },
          category:               { type: 'string' },
          supplier_name:          { type: 'string', maxLength: 200 },
          supplier_url:           { type: 'string', maxLength: 500 },
          delivery_location_lat:  { type: 'number', minimum: -90, maximum: 90 },
          delivery_location_lng:  { type: 'number', minimum: -180, maximum: 180 },
          delivery_address:       { type: 'string', maxLength: 500 },
          deadline:               { type: 'string' },
          min_total_eur:          { type: 'number', minimum: 0 }
        }
      }
    }
  }, async (req, reply) => {
    const { title, description, category, supplier_name, supplier_url,
            delivery_location_lat, delivery_location_lng, delivery_address,
            deadline, min_total_eur } = req.body;
    const cat = VALID_CATEGORIES.has(category) ? category : 'divers';
    const { rows } = await fastify.pg.query(
      `INSERT INTO group_orders
         (organizer_id,title,description,category,supplier_name,supplier_url,
          delivery_location_lat,delivery_location_lng,delivery_address,deadline,min_total_eur)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [req.user.id, sanitize(title,200), sanitize(description||'',5000), cat,
       sanitize(supplier_name||'',200), sanitize(supplier_url||'',500),
       delivery_location_lat||null, delivery_location_lng||null,
       sanitize(delivery_address||'',500), deadline, min_total_eur||null]
    );
    reply.code(201).send(rows[0]);
  });

  // ── GET /api/orders/nearby — Commandes proches ──────────────────────────────
  fastify.get('/orders/nearby', {
    preHandler: fastify.authenticate
  }, async (req, reply) => {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const km  = Math.min(parseFloat(req.query.km)||50, 500);
    if (!isFinite(lat)||!isFinite(lng)) return reply.code(400).send({ error: 'lat/lng requis' });

    // Bounding box pour pré-filtrage SQL (approximation)
    const dLat = km / 111;
    const dLng = km / (111 * Math.cos(lat * Math.PI / 180));

    const { rows } = await fastify.pg.query(
      `SELECT o.*,
              u.email AS organizer_email,
              (SELECT COUNT(*) FROM group_order_participants p WHERE p.order_id=o.id) AS participant_count
       FROM group_orders o
       JOIN users u ON u.id=o.organizer_id
       WHERE o.status='open'
         AND o.deadline > NOW()
         AND o.delivery_location_lat BETWEEN $1 AND $2
         AND o.delivery_location_lng BETWEEN $3 AND $4
       ORDER BY o.deadline`,
      [lat-dLat, lat+dLat, lng-dLng, lng+dLng]
    );

    // Filtrage précis + calcul distance
    const nearby = rows
      .map(r => ({ ...r, distance_km: haversineKm(lat, lng, r.delivery_location_lat, r.delivery_location_lng) }))
      .filter(r => r.distance_km <= km)
      .sort((a,b) => a.distance_km - b.distance_km);

    reply.send(nearby);
  });

  // ── GET /api/orders/mine — Mes commandes (organisateur) ─────────────────────
  fastify.get('/orders/mine', {
    preHandler: fastify.authenticate
  }, async (req, reply) => {
    const { rows } = await fastify.pg.query(
      `SELECT o.*,
              (SELECT COUNT(*) FROM group_order_participants p WHERE p.order_id=o.id) AS participant_count
       FROM group_orders o WHERE o.organizer_id=$1 ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    reply.send(rows);
  });

  // ── GET /api/orders/:id — Détail ────────────────────────────────────────────
  fastify.get('/orders/:id', {
    preHandler: fastify.authenticate
  }, async (req, reply) => {
    const { rows: [order] } = await fastify.pg.query(`SELECT * FROM group_orders WHERE id=$1`, [req.params.id]);
    if (!order) return reply.code(404).send({ error: 'Not found' });
    const { rows: participants } = await fastify.pg.query(
      `SELECT p.id,p.user_id,p.items,p.total_eur,p.status,p.joined_at, u.email
       FROM group_order_participants p JOIN users u ON u.id=p.user_id
       WHERE p.order_id=$1 ORDER BY p.joined_at`,
      [req.params.id]
    );
    reply.send({ ...order, participants });
  });

  // ── PATCH /api/orders/:id — Modifier ────────────────────────────────────────
  fastify.patch('/orders/:id', {
    preHandler: fastify.authenticate
  }, async (req, reply) => {
    const { rows: [chk] } = await fastify.pg.query(`SELECT organizer_id FROM group_orders WHERE id=$1`, [req.params.id]);
    if (!chk) return reply.code(404).send({ error: 'Not found' });
    if (chk.organizer_id !== req.user.id && req.user.role !== 'admin') return reply.code(403).send({ error: 'Forbidden' });
    const { status, title, description, deadline } = req.body;
    const fields = []; const vals = [];
    if (status && VALID_STATUSES.has(status)) { vals.push(status); fields.push(`status=$${vals.length}`); }
    if (title)       { vals.push(sanitize(title,200));       fields.push(`title=$${vals.length}`); }
    if (description) { vals.push(sanitize(description,5000));fields.push(`description=$${vals.length}`); }
    if (deadline)    { vals.push(deadline);                  fields.push(`deadline=$${vals.length}`); }
    if (!fields.length) return reply.code(400).send({ error: 'Nothing to update' });
    vals.push(req.params.id);
    const { rows } = await fastify.pg.query(`UPDATE group_orders SET ${fields.join(',')} WHERE id=$${vals.length} RETURNING *`, vals);
    reply.send(rows[0]);
  });

  // ── POST /api/orders/:id/join — Rejoindre ───────────────────────────────────
  fastify.post('/orders/:id/join', {
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['items','total_eur'],
        properties: {
          items:     { type: 'array' },
          total_eur: { type: 'number', minimum: 0 }
        }
      }
    }
  }, async (req, reply) => {
    const { rows: [order] } = await fastify.pg.query(`SELECT status FROM group_orders WHERE id=$1`, [req.params.id]);
    if (!order) return reply.code(404).send({ error: 'Not found' });
    if (order.status !== 'open') return reply.code(400).send({ error: 'Commande fermée' });
    try {
      const { rows } = await fastify.pg.query(
        `INSERT INTO group_order_participants (order_id,user_id,items,total_eur)
         VALUES ($1,$2,$3,$4) RETURNING *`,
        [req.params.id, req.user.id, JSON.stringify(req.body.items), req.body.total_eur]
      );
      reply.code(201).send(rows[0]);
    } catch (err) {
      if (err.code === '23505') return reply.code(400).send({ error: 'Déjà participant' });
      throw err;
    }
  });

  // ── GET /api/orders/:id/messages — Messages ─────────────────────────────────
  fastify.get('/orders/:id/messages', {
    preHandler: fastify.authenticate
  }, async (req, reply) => {
    // Vérifier que l'utilisateur est participant ou organisateur
    const { rows: [access] } = await fastify.pg.query(
      `SELECT 1 FROM group_orders WHERE id=$1 AND organizer_id=$2
       UNION SELECT 1 FROM group_order_participants WHERE order_id=$1 AND user_id=$2`,
      [req.params.id, req.user.id]
    );
    if (!access && req.user.role !== 'admin') return reply.code(403).send({ error: 'Accès refusé' });
    const { rows } = await fastify.pg.query(
      `SELECT m.id,m.body,m.created_at,u.email FROM group_order_messages m
       JOIN users u ON u.id=m.user_id
       WHERE m.order_id=$1 ORDER BY m.created_at`,
      [req.params.id]
    );
    reply.send(rows);
  });

  // ── POST /api/orders/:id/messages — Envoyer un message ──────────────────────
  fastify.post('/orders/:id/messages', {
    preHandler: fastify.authenticate,
    schema: { body: { type: 'object', required: ['body'], properties: { body: { type: 'string', maxLength: 2000 } } } }
  }, async (req, reply) => {
    const { rows } = await fastify.pg.query(
      `INSERT INTO group_order_messages (order_id,user_id,body) VALUES ($1,$2,$3) RETURNING *`,
      [req.params.id, req.user.id, sanitize(req.body.body, 2000)]
    );
    reply.code(201).send(rows[0]);
  });
};
