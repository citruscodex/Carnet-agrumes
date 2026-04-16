/**
 * server/routes/training.js — Chantier 9 : Inscription stages pépinière
 * Plugin Fastify — À enregistrer dans server/app.js avec :
 *   await app.register(require('./routes/training'), { prefix: '/api' })
 *
 * Routes publiques (pas d'auth) :
 *   GET  /training/:slug              → page publique du stage
 *   POST /api/training/:slug/register → inscription
 *   GET  /api/training/confirm/:token → confirmation email
 *   POST /api/training/cancel/:token  → annulation
 *
 * Routes pépiniériste (auth) :
 *   POST  /api/training/sessions          → créer un stage
 *   GET   /api/training/sessions/mine     → mes stages
 *   PATCH /api/training/sessions/:id      → modifier
 *   DELETE /api/training/sessions/:id     → annuler (+ notify)
 *   GET   /api/training/sessions/:id/registrations → inscrits
 */

'use strict';

const crypto = require('crypto');

function sanitize(str, max = 500) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim().slice(0, max);
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function generateSlug(title) {
  return title.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    .slice(0, 80) + '-' + Date.now().toString(36);
}

module.exports = async function trainingPlugin(fastify) {

  const rateLimitRegister = {
    max: 3, timeWindow: '1 hour',
    keyGenerator: req => req.ip,
    errorResponseBuilder: () => ({ statusCode: 429, error: 'Too Many Requests', message: 'Trop de tentatives. Réessayez dans une heure.' })
  };

  // ── POST /api/training/sessions — Créer un stage ────────────────────────────
  fastify.post('/training/sessions', {
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['title', 'location', 'start_datetime', 'end_datetime', 'capacity'],
        properties: {
          title:          { type: 'string', minLength: 3, maxLength: 200 },
          description:    { type: 'string', maxLength: 5000 },
          type:           { type: 'string' },
          location:       { type: 'string', maxLength: 500 },
          start_datetime: { type: 'string' },
          end_datetime:   { type: 'string' },
          capacity:       { type: 'integer', minimum: 1 },
          price_eur:      { type: 'number', minimum: 0 }
        }
      }
    }
  }, async (req, reply) => {
    const { title, description, type, location, start_datetime, end_datetime, capacity, price_eur = 0 } = req.body;
    const slug = generateSlug(title);
    const { rows } = await fastify.pg.query(
      `INSERT INTO training_sessions (organizer_id,title,description,type,location,start_datetime,end_datetime,capacity,price_eur,public_url_slug)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.user.id, sanitize(title,200), sanitize(description||'',5000), type||'autre',
       sanitize(location,500), start_datetime, end_datetime, capacity, price_eur, slug]
    );
    reply.code(201).send(rows[0]);
  });

  // ── GET /api/training/sessions/mine — Mes stages ────────────────────────────
  fastify.get('/training/sessions/mine', {
    preHandler: fastify.authenticate
  }, async (req, reply) => {
    const { rows } = await fastify.pg.query(
      `SELECT s.*,
              (SELECT COUNT(*) FROM training_registrations r WHERE r.session_id=s.id AND r.confirmed=true AND r.cancelled=false) AS confirmed_count
       FROM training_sessions s WHERE s.organizer_id=$1 ORDER BY s.start_datetime DESC`,
      [req.user.id]
    );
    reply.send(rows);
  });

  // ── PATCH /api/training/sessions/:id — Modifier ─────────────────────────────
  fastify.patch('/training/sessions/:id', {
    preHandler: fastify.authenticate
  }, async (req, reply) => {
    const { title, description, location, start_datetime, end_datetime, capacity, price_eur, status } = req.body;
    const { rows: chk } = await fastify.pg.query(`SELECT organizer_id FROM training_sessions WHERE id=$1`, [req.params.id]);
    if (!chk.length) return reply.code(404).send({ error: 'Not found' });
    if (chk[0].organizer_id !== req.user.id && req.user.role !== 'admin') return reply.code(403).send({ error: 'Forbidden' });
    const fields = []; const vals = [];
    if (title)           { vals.push(sanitize(title,200));      fields.push(`title=$${vals.length}`); }
    if (description)     { vals.push(sanitize(description,5000));fields.push(`description=$${vals.length}`); }
    if (location)        { vals.push(sanitize(location,500));    fields.push(`location=$${vals.length}`); }
    if (start_datetime)  { vals.push(start_datetime);            fields.push(`start_datetime=$${vals.length}`); }
    if (end_datetime)    { vals.push(end_datetime);              fields.push(`end_datetime=$${vals.length}`); }
    if (capacity)        { vals.push(capacity);                  fields.push(`capacity=$${vals.length}`); }
    if (price_eur !== undefined) { vals.push(price_eur);         fields.push(`price_eur=$${vals.length}`); }
    if (status)          { vals.push(status);                    fields.push(`status=$${vals.length}`); }
    if (!fields.length)  return reply.code(400).send({ error: 'Nothing to update' });
    vals.push(req.params.id);
    const { rows } = await fastify.pg.query(`UPDATE training_sessions SET ${fields.join(',')} WHERE id=$${vals.length} RETURNING *`, vals);
    reply.send(rows[0]);
  });

  // ── DELETE /api/training/sessions/:id — Annuler ─────────────────────────────
  fastify.delete('/training/sessions/:id', {
    preHandler: fastify.authenticate
  }, async (req, reply) => {
    const { rows: chk } = await fastify.pg.query(`SELECT organizer_id,title FROM training_sessions WHERE id=$1`, [req.params.id]);
    if (!chk.length) return reply.code(404).send({ error: 'Not found' });
    if (chk[0].organizer_id !== req.user.id && req.user.role !== 'admin') return reply.code(403).send({ error: 'Forbidden' });
    // Marquer comme annulé (soft delete)
    await fastify.pg.query(`UPDATE training_sessions SET status='cancelled' WHERE id=$1`, [req.params.id]);
    reply.send({ ok: true });
  });

  // ── GET /api/training/sessions/:id/registrations — Liste inscrits ───────────
  fastify.get('/training/sessions/:id/registrations', {
    preHandler: fastify.authenticate
  }, async (req, reply) => {
    const { rows: chk } = await fastify.pg.query(`SELECT organizer_id FROM training_sessions WHERE id=$1`, [req.params.id]);
    if (!chk.length) return reply.code(404).send({ error: 'Not found' });
    if (chk[0].organizer_id !== req.user.id && req.user.role !== 'admin') return reply.code(403).send({ error: 'Forbidden' });
    const { rows } = await fastify.pg.query(
      `SELECT id,email,first_name,last_name,phone,notes,confirmed,confirmed_at,cancelled,created_at
       FROM training_registrations WHERE session_id=$1 ORDER BY created_at`,
      [req.params.id]
    );
    reply.send(rows);
  });

  // ── GET /api/training/public/:slug — Info publique (sans auth) ──────────────
  fastify.get('/training/public/:slug', async (req, reply) => {
    const { rows: [session] } = await fastify.pg.query(
      `SELECT s.id, s.title, s.description, s.location, s.start_datetime, s.end_datetime,
              s.capacity, s.price_eur, s.status, s.public_url_slug,
              (SELECT COUNT(*) FROM training_registrations r
               WHERE r.session_id=s.id AND r.confirmed=true AND r.cancelled=false) AS confirmed_count
       FROM training_sessions s WHERE s.public_url_slug=$1`,
      [req.params.slug]
    );
    if (!session) return reply.code(404).send({ error: 'Stage introuvable' });
    reply.send(session);
  });

  // ── POST /api/training/:slug/register — Inscription publique ────────────────
  fastify.post('/training/:slug/register', {
    config: { rateLimit: rateLimitRegister },
    schema: {
      body: {
        type: 'object',
        required: ['email','first_name','last_name'],
        properties: {
          email:      { type: 'string', format: 'email', maxLength: 200 },
          first_name: { type: 'string', minLength: 1, maxLength: 100 },
          last_name:  { type: 'string', minLength: 1, maxLength: 100 },
          phone:      { type: 'string', maxLength: 30 },
          notes:      { type: 'string', maxLength: 1000 }
        }
      }
    }
  }, async (req, reply) => {
    const { email, first_name, last_name, phone, notes } = req.body;
    // Récupérer le stage
    const { rows: [session] } = await fastify.pg.query(
      `SELECT id,title,location,start_datetime,capacity,status FROM training_sessions WHERE public_url_slug=$1`,
      [req.params.slug]
    );
    if (!session) return reply.code(404).send({ error: 'Stage introuvable' });
    if (session.status !== 'open') return reply.code(400).send({ error: 'Inscriptions fermées' });
    // Vérifier capacité
    const { rows: [cnt] } = await fastify.pg.query(
      `SELECT COUNT(*) AS n FROM training_registrations WHERE session_id=$1 AND confirmed=true AND cancelled=false`,
      [session.id]
    );
    if (parseInt(cnt.n) >= session.capacity) {
      await fastify.pg.query(`UPDATE training_sessions SET status='full' WHERE id=$1`, [session.id]);
      return reply.code(400).send({ error: 'Stage complet' });
    }
    const token = generateToken();
    try {
      await fastify.pg.query(
        `INSERT INTO training_registrations (session_id,email,first_name,last_name,phone,notes,confirmation_token)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [session.id, email.toLowerCase().trim(), sanitize(first_name,100), sanitize(last_name,100),
         sanitize(phone||'',30), sanitize(notes||'',1000), token]
      );
    } catch (err) {
      if (err.code === '23505') return reply.code(400).send({ error: 'Déjà inscrit avec cet email' });
      throw err;
    }
    // TODO: envoyer email de confirmation via Scaleway TEM
    // await sendConfirmationEmail({ email, first_name, session, token });
    reply.code(201).send({ ok: true, message: 'Inscription enregistrée. Vérifiez votre email.' });
  });

  // ── GET /api/training/confirm/:token — Confirmation ─────────────────────────
  fastify.get('/training/confirm/:token', async (req, reply) => {
    const { rows } = await fastify.pg.query(
      `UPDATE training_registrations SET confirmed=true, confirmed_at=NOW()
       WHERE confirmation_token=$1 AND confirmed=false AND cancelled=false
       RETURNING id,email,first_name,session_id`,
      [req.params.token]
    );
    if (!rows.length) return reply.code(400).send({ error: 'Token invalide ou déjà confirmé' });
    reply.send({ ok: true, message: 'Inscription confirmée !' });
  });

  // ── POST /api/training/cancel/:token — Annulation ───────────────────────────
  fastify.post('/training/cancel/:token', async (req, reply) => {
    const { rows } = await fastify.pg.query(
      `UPDATE training_registrations SET cancelled=true, cancelled_at=NOW()
       WHERE confirmation_token=$1 AND cancelled=false
       RETURNING id,email,session_id`,
      [req.params.token]
    );
    if (!rows.length) return reply.code(400).send({ error: 'Token invalide' });
    // Remettre le stage en 'open' si il était 'full'
    await fastify.pg.query(
      `UPDATE training_sessions SET status='open'
       WHERE id=$1 AND status='full' AND end_datetime > NOW()`,
      [rows[0].session_id]
    );
    reply.send({ ok: true, message: 'Inscription annulée.' });
  });
};
