/**
 * server/routes/orders.js — Chantier 10 : Commandes groupées géographiques
 * Plugin Fastify — Enregistrer dans server.js avec :
 *   fastify.register(require('./routes/orders'), { prefix: '/api' })
 *
 * Routes (auth requise sauf mention) :
 *   POST   /api/orders                              → créer une commande
 *   GET    /api/orders/nearby                       → proches (?lat=&lng=&km=50)
 *   GET    /api/orders/mine                         → mes commandes (organisées + rejointes)
 *   GET    /api/orders/:id                          → détail + participants
 *   PATCH  /api/orders/:id                          → modifier (organisateur ou admin)
 *   DELETE /api/orders/:id                          → annuler (organisateur ou admin)
 *   POST   /api/orders/:id/join                     → rejoindre avec items
 *   PATCH  /api/orders/:id/participants/:uid        → modifier statut participant (organisateur)
 *   GET    /api/orders/:id/messages                 → messages internes
 *   POST   /api/orders/:id/messages                 → envoyer un message
 */

'use strict';

const VALID_CATEGORIES = new Set(['plants','pots','engrais','substrats','amendements','outils','divers']);
const VALID_STATUSES   = new Set(['open','closed','ordered','delivered','cancelled']);
const VALID_PART_STATUSES = new Set(['pending','confirmed','paid','received','cancelled']);

function sanitize(str, max = 500) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim().slice(0, max);
}

// Haversine distance in km
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

module.exports = async function ordersPlugin(fastify) {

  const rateLimitCreate = {
    max: 5, timeWindow: '1 hour',
    keyGenerator: req => req.user?.id || req.ip,
    errorResponseBuilder: () => ({ statusCode: 429, error: 'Too Many Requests', message: 'Trop de tentatives.' })
  };

  // ── POST /api/orders — Créer une commande ───────────────────────────────────
  fastify.post('/orders', {
    config: { rateLimit: rateLimitCreate },
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['title','deadline'],
        properties: {
          title:                 { type: 'string', minLength: 3, maxLength: 200 },
          description:           { type: 'string', maxLength: 5000 },
          category:              { type: 'string' },
          supplier_name:         { type: 'string', maxLength: 200 },
          supplier_url:          { type: 'string', maxLength: 500 },
          delivery_location_lat: { type: 'number', minimum: -90, maximum: 90 },
          delivery_location_lng: { type: 'number', minimum: -180, maximum: 180 },
          delivery_address:      { type: 'string', maxLength: 500 },
          deadline:              { type: 'string' },
          min_total_eur:         { type: 'number', minimum: 0 }
        }
      }
    }
  }, async (req, reply) => {
    const { title, description, category, supplier_name, supplier_url,
            delivery_location_lat, delivery_location_lng, delivery_address,
            deadline, min_total_eur } = req.body;
    const cat = VALID_CATEGORIES.has(category) ? category : 'divers';
    // Validate supplier_url
    if (supplier_url && !/^https?:\/\//i.test(supplier_url)) {
      return reply.code(400).send({ error: 'URL fournisseur invalide (doit commencer par https://)' });
    }
    const { rows } = await fastify.pg.query(
      `INSERT INTO group_orders
         (organizer_id,title,description,category,supplier_name,supplier_url,
          delivery_location_lat,delivery_location_lng,delivery_address,deadline,min_total_eur)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [req.user.id, sanitize(title,200), sanitize(description||'',5000), cat,
       sanitize(supplier_name||'',200)||null, sanitize(supplier_url||'',500)||null,
       delivery_location_lat||null, delivery_location_lng||null,
       sanitize(delivery_address||'',500)||null, deadline, min_total_eur||null]
    );
    reply.code(201).send(rows[0]);
  });

  // ── GET /api/orders/nearby — Commandes proches ──────────────────────────────
  fastify.get('/orders/nearby', {
    preHandler: fastify.authenticate
  }, async (req, reply) => {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const km  = Math.min(parseFloat(req.query.km) || 50, 500);
    if (!isFinite(lat) || !isFinite(lng)) {
      return reply.code(400).send({ error: 'lat et lng requis' });
    }

    // Bounding box pré-filtrage SQL
    const dLat = km / 111;
    const dLng = km / (111 * Math.cos(lat * Math.PI / 180));

    const { rows } = await fastify.pg.query(
      `SELECT o.id, o.title, o.description, o.category, o.supplier_name, o.supplier_url,
              o.delivery_location_lat, o.delivery_location_lng, o.delivery_address,
              o.deadline, o.min_total_eur, o.current_total_eur, o.status,
              o.created_at, o.organizer_id,
              COALESCE(NULLIF(u.display_name,''), split_part(u.email,'@',1)) AS organizer_name,
              (SELECT COUNT(*) FROM group_order_participants p WHERE p.order_id=o.id AND p.status!='cancelled') AS participant_count
       FROM group_orders o
       JOIN users u ON u.id = o.organizer_id
       WHERE o.status = 'open'
         AND o.deadline > NOW()
         AND o.delivery_location_lat BETWEEN $1 AND $2
         AND o.delivery_location_lng BETWEEN $3 AND $4
       ORDER BY o.deadline`,
      [lat - dLat, lat + dLat, lng - dLng, lng + dLng]
    );

    // Filtrage précis + calcul distance
    const nearby = rows
      .map(r => ({
        ...r,
        distance_km: haversineKm(lat, lng,
          parseFloat(r.delivery_location_lat),
          parseFloat(r.delivery_location_lng))
      }))
      .filter(r => r.distance_km <= km)
      .sort((a, b) => a.distance_km - b.distance_km);

    reply.send(nearby);
  });

  // ── GET /api/orders/mine — Mes commandes ─────────────────────────────────────
  fastify.get('/orders/mine', {
    preHandler: fastify.authenticate
  }, async (req, reply) => {
    // Commandes organisées + commandes rejointes
    const { rows } = await fastify.pg.query(
      `SELECT o.id, o.title, o.category, o.status, o.deadline,
              o.min_total_eur, o.current_total_eur, o.organizer_id,
              COALESCE(NULLIF(u.display_name,''), split_part(u.email,'@',1)) AS organizer_name,
              (SELECT COUNT(*) FROM group_order_participants p WHERE p.order_id=o.id AND p.status!='cancelled') AS participant_count,
              (SELECT total_eur FROM group_order_participants WHERE order_id=o.id AND user_id=$1 LIMIT 1) AS my_total
       FROM group_orders o
       JOIN users u ON u.id = o.organizer_id
       WHERE o.organizer_id = $1
          OR EXISTS (SELECT 1 FROM group_order_participants WHERE order_id=o.id AND user_id=$1)
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    reply.send(rows);
  });

  // ── GET /api/orders/:id — Détail commande ────────────────────────────────────
  fastify.get('/orders/:id', {
    preHandler: fastify.authenticate
  }, async (req, reply) => {
    const { rows: [order] } = await fastify.pg.query(
      `SELECT o.*,
              COALESCE(NULLIF(u.display_name,''), split_part(u.email,'@',1)) AS organizer_name
       FROM group_orders o JOIN users u ON u.id=o.organizer_id
       WHERE o.id=$1`,
      [req.params.id]
    );
    if (!order) return reply.code(404).send({ error: 'Commande introuvable' });

    const { rows: participants } = await fastify.pg.query(
      `SELECT p.id, p.user_id, p.items, p.total_eur, p.status, p.joined_at,
              COALESCE(NULLIF(u.display_name,''), split_part(u.email,'@',1)) AS member_name
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
    const { rows: [chk] } = await fastify.pg.query(
      `SELECT organizer_id FROM group_orders WHERE id=$1`, [req.params.id]
    );
    if (!chk) return reply.code(404).send({ error: 'Commande introuvable' });
    if (chk.organizer_id !== req.user.id && req.user.role !== 'admin') {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const { status, title, description, deadline, supplier_name, supplier_url,
            delivery_address, min_total_eur, delivery_location_lat, delivery_location_lng } = req.body;
    const fields = []; const vals = [];

    if (status && VALID_STATUSES.has(status))  { vals.push(status);                     fields.push(`status=$${vals.length}`); }
    if (title)                                  { vals.push(sanitize(title,200));         fields.push(`title=$${vals.length}`); }
    if (description !== undefined)              { vals.push(sanitize(description||'',5000)||null); fields.push(`description=$${vals.length}`); }
    if (deadline)                               { vals.push(deadline);                   fields.push(`deadline=$${vals.length}`); }
    if (supplier_name !== undefined)            { vals.push(sanitize(supplier_name||'',200)||null); fields.push(`supplier_name=$${vals.length}`); }
    if (supplier_url !== undefined)             { vals.push(sanitize(supplier_url||'',500)||null); fields.push(`supplier_url=$${vals.length}`); }
    if (delivery_address !== undefined)         { vals.push(sanitize(delivery_address||'',500)||null); fields.push(`delivery_address=$${vals.length}`); }
    if (min_total_eur !== undefined)            { vals.push(parseFloat(min_total_eur)||null); fields.push(`min_total_eur=$${vals.length}`); }
    if (delivery_location_lat !== undefined)    { vals.push(parseFloat(delivery_location_lat)||null); fields.push(`delivery_location_lat=$${vals.length}`); }
    if (delivery_location_lng !== undefined)    { vals.push(parseFloat(delivery_location_lng)||null); fields.push(`delivery_location_lng=$${vals.length}`); }

    if (!fields.length) return reply.code(400).send({ error: 'Nothing to update' });
    vals.push(req.params.id);
    const { rows } = await fastify.pg.query(
      `UPDATE group_orders SET ${fields.join(',')} WHERE id=$${vals.length} RETURNING *`, vals
    );
    reply.send(rows[0]);
  });

  // ── DELETE /api/orders/:id — Annuler ─────────────────────────────────────────
  fastify.delete('/orders/:id', {
    preHandler: fastify.authenticate
  }, async (req, reply) => {
    const { rows: [chk] } = await fastify.pg.query(
      `SELECT organizer_id FROM group_orders WHERE id=$1`, [req.params.id]
    );
    if (!chk) return reply.code(404).send({ error: 'Commande introuvable' });
    if (chk.organizer_id !== req.user.id && req.user.role !== 'admin') {
      return reply.code(403).send({ error: 'Forbidden' });
    }
    await fastify.pg.query(`UPDATE group_orders SET status='cancelled' WHERE id=$1`, [req.params.id]);
    reply.send({ ok: true });
  });

  // ── POST /api/orders/:id/join — Rejoindre ────────────────────────────────────
  fastify.post('/orders/:id/join', {
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['items','total_eur'],
        properties: {
          items:     { type: 'array', maxItems: 50 },
          total_eur: { type: 'number', minimum: 0 }
        }
      }
    }
  }, async (req, reply) => {
    const { rows: [order] } = await fastify.pg.query(
      `SELECT status, organizer_id FROM group_orders WHERE id=$1`, [req.params.id]
    );
    if (!order) return reply.code(404).send({ error: 'Commande introuvable' });
    if (order.status !== 'open') return reply.code(400).send({ error: 'Commande fermée' });
    if (order.organizer_id === req.user.id) return reply.code(400).send({ error: 'L\'organisateur ne peut pas rejoindre sa propre commande' });

    // Validate items structure
    const items = (req.body.items || []).map(it => ({
      name:      sanitize(String(it.name||''),200),
      qty:       Math.max(0, parseInt(it.qty)||0),
      price_eur: Math.max(0, parseFloat(it.price_eur)||0)
    })).filter(it => it.name && it.qty > 0);

    if (!items.length) return reply.code(400).send({ error: 'Au moins un article requis' });

    const total = Math.round(req.body.total_eur * 100) / 100;

    try {
      const { rows } = await fastify.pg.query(
        `INSERT INTO group_order_participants (order_id,user_id,items,total_eur)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (order_id,user_id) DO UPDATE
           SET items=$3, total_eur=$4, status='pending'
         RETURNING *`,
        [req.params.id, req.user.id, JSON.stringify(items), total]
      );
      reply.code(201).send(rows[0]);
    } catch (err) {
      throw err;
    }
  });

  // ── PATCH /api/orders/:id/participants/:uid — Modifier statut participant ─────
  fastify.patch('/orders/:id/participants/:uid', {
    preHandler: fastify.authenticate
  }, async (req, reply) => {
    const { rows: [chk] } = await fastify.pg.query(
      `SELECT organizer_id FROM group_orders WHERE id=$1`, [req.params.id]
    );
    if (!chk) return reply.code(404).send({ error: 'Commande introuvable' });
    if (chk.organizer_id !== req.user.id && req.user.role !== 'admin') {
      return reply.code(403).send({ error: 'Forbidden' });
    }
    const { status } = req.body;
    if (!status || !VALID_PART_STATUSES.has(status)) {
      return reply.code(400).send({ error: 'Statut invalide' });
    }
    const { rows } = await fastify.pg.query(
      `UPDATE group_order_participants SET status=$1
       WHERE order_id=$2 AND user_id=$3 RETURNING *`,
      [status, req.params.id, req.params.uid]
    );
    if (!rows.length) return reply.code(404).send({ error: 'Participant introuvable' });
    reply.send(rows[0]);
  });

  // ── GET /api/orders/:id/messages — Messages ──────────────────────────────────
  fastify.get('/orders/:id/messages', {
    preHandler: fastify.authenticate
  }, async (req, reply) => {
    const { rows: [access] } = await fastify.pg.query(
      `SELECT 1 FROM group_orders WHERE id=$1 AND organizer_id=$2
       UNION ALL
       SELECT 1 FROM group_order_participants WHERE order_id=$1 AND user_id=$2 AND status!='cancelled'
       LIMIT 1`,
      [req.params.id, req.user.id]
    );
    if (!access && req.user.role !== 'admin') return reply.code(403).send({ error: 'Accès refusé' });
    const { rows } = await fastify.pg.query(
      `SELECT m.id, m.body, m.created_at,
              COALESCE(NULLIF(u.display_name,''), split_part(u.email,'@',1)) AS author
       FROM group_order_messages m JOIN users u ON u.id=m.user_id
       WHERE m.order_id=$1 ORDER BY m.created_at`,
      [req.params.id]
    );
    reply.send(rows);
  });

  // ── POST /api/orders/:id/messages — Envoyer un message ──────────────────────
  fastify.post('/orders/:id/messages', {
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object', required: ['body'],
        properties: { body: { type: 'string', minLength: 1, maxLength: 2000 } }
      }
    }
  }, async (req, reply) => {
    // Vérifier accès (organisateur ou participant actif)
    const { rows: [access] } = await fastify.pg.query(
      `SELECT 1 FROM group_orders WHERE id=$1 AND organizer_id=$2
       UNION ALL
       SELECT 1 FROM group_order_participants WHERE order_id=$1 AND user_id=$2 AND status!='cancelled'
       LIMIT 1`,
      [req.params.id, req.user.id]
    );
    if (!access && req.user.role !== 'admin') return reply.code(403).send({ error: 'Accès refusé' });
    const { rows } = await fastify.pg.query(
      `INSERT INTO group_order_messages (order_id,user_id,body) VALUES ($1,$2,$3) RETURNING *`,
      [req.params.id, req.user.id, sanitize(req.body.body, 2000)]
    );
    reply.code(201).send(rows[0]);
  });
};
