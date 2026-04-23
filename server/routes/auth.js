'use strict';

const crypto = require('crypto');

const VALID_PROFILES = new Set(['collectionneur','pepinieriste','arboriculteur','conservatoire']);

function sanitize(str, max = 200) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim().slice(0, max);
}

function randomToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = async function authRoutes(fastify) {
  const bcrypt = require('bcrypt');
  const BASE   = fastify.baseUrl || 'https://citruscodex.fr';

  const rlStrict = { max: 10, timeWindow: '15 minutes', keyGenerator: req => req.ip };
  const rlLoose  = { max: 20, timeWindow: '15 minutes', keyGenerator: req => req.ip };

  // ── POST /api/auth/register ──────────────────────────────────────────────────
  fastify.post('/api/auth/register', { config: { rateLimit: rlStrict } }, async (req, reply) => {
    const email          = sanitize(req.body?.email || '', 200).toLowerCase();
    const password       = req.body?.password || '';
    const invitation_code = sanitize(req.body?.invitation_code || '', 20).toUpperCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return reply.code(400).send({ error: 'Email invalide.' });
    if (password.length < 8)
      return reply.code(400).send({ error: 'Mot de passe trop court (8 caractères minimum).' });
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password))
      return reply.code(400).send({ error: 'Le mot de passe doit contenir au moins 1 lettre et 1 chiffre.' });
    if (!invitation_code)
      return reply.code(400).send({ error: 'Code d\'invitation requis.' });

    // Valider le code d'invitation
    const codeRes = await fastify.pg.query(
      `SELECT id, profile_type, uses, max_uses, expires_at
       FROM invitation_codes WHERE code=$1 AND (expires_at IS NULL OR expires_at > NOW())`,
      [invitation_code]
    );
    if (!codeRes.rows.length)
      return reply.code(400).send({ error: 'Code d\'invitation invalide ou expiré.' });
    const inv = codeRes.rows[0];
    if (inv.uses >= inv.max_uses)
      return reply.code(400).send({ error: 'Ce code d\'invitation a déjà été utilisé.' });

    // Unicité email
    const exists = await fastify.pg.query('SELECT id FROM users WHERE email=$1', [email]);
    if (exists.rows.length)
      return reply.code(409).send({ error: 'Un compte existe déjà avec cet email.' });

    const profile_type = VALID_PROFILES.has(inv.profile_type) ? inv.profile_type : 'collectionneur';
    const hash = await bcrypt.hash(password, 12);

    const { rows } = await fastify.pg.query(
      `INSERT INTO users (email, password_hash, profile_type, role, email_verified)
       VALUES ($1,$2,$3,'member',false)
       RETURNING id, email`,
      [email, hash, profile_type]
    );
    const user = rows[0];

    // Marquer le code utilisé
    await fastify.pg.query(
      `UPDATE invitation_codes SET uses=uses+1, used_by=$1 WHERE id=$2`,
      [user.id, inv.id]
    );

    // Générer token de vérification email
    const token    = randomToken();
    const tokenHash = hashToken(token);
    await fastify.pg.query(
      `INSERT INTO auth_tokens (user_id, token_hash, type, expires_at)
       VALUES ($1,$2,'verify_email', NOW() + INTERVAL '72 hours')`,
      [user.id, tokenHash]
    );

    // Envoyer email de vérification
    if (fastify.sendMail) {
      const link = `${BASE}/api/auth/verify?token=${token}`;
      fastify.sendMail(
        email,
        '🍊 CitrusCodex — Confirmez votre email',
        `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h1 style="color:#c75b2a">🍊 CitrusCodex</h1>
          <p>Bienvenue ! Cliquez sur le bouton ci-dessous pour confirmer votre adresse email.</p>
          <p><a href="${link}" style="display:inline-block;padding:12px 24px;background:#c75b2a;color:white;text-decoration:none;border-radius:8px">Confirmer mon email</a></p>
          <p style="color:#666;font-size:12px">Lien valable 72h. Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.</p>
        </div>`
      ).catch(err => fastify.log.warn('[mail] verify email failed:', err.message));
    }

    reply.code(201).send({ ok: true, message: 'Compte créé. Vérifiez votre email pour activer votre compte.' });
  });


  // ── GET /api/auth/verify?token=xxx ───────────────────────────────────────────
  fastify.get('/api/auth/verify', { config: { rateLimit: rlLoose } }, async (req, reply) => {
    const token = req.query?.token || '';
    if (!token) return reply.redirect(`${BASE}/?verified=0`);

    const tokenHash = hashToken(token);
    const res = await fastify.pg.query(
      `SELECT t.id, t.user_id, t.expires_at, t.used_at
       FROM auth_tokens t
       WHERE t.token_hash=$1 AND t.type='verify_email'`,
      [tokenHash]
    );

    if (!res.rows.length || res.rows[0].used_at || new Date(res.rows[0].expires_at) < new Date())
      return reply.redirect(`${BASE}/?verified=0`);

    const { id: tokenId, user_id } = res.rows[0];
    await fastify.pg.query(`UPDATE users SET email_verified=true WHERE id=$1`, [user_id]);
    await fastify.pg.query(`UPDATE auth_tokens SET used_at=NOW() WHERE id=$1`, [tokenId]);

    reply.redirect(`${BASE}/?verified=1`);
  });


  // ── POST /api/auth/login ──────────────────────────────────────────────────────
  fastify.post('/api/auth/login', { config: { rateLimit: rlStrict } }, async (req, reply) => {
    const email    = sanitize(req.body?.email || '', 200).toLowerCase();
    const password = req.body?.password || '';

    if (!email || !password)
      return reply.code(400).send({ error: 'Email et mot de passe requis.' });

    const { rows } = await fastify.pg.query(
      `SELECT id, email, password_hash, profile_type, role, email_verified, disabled_at, suspended_until
       FROM users WHERE email=$1`,
      [email]
    );
    if (!rows.length)
      return reply.code(401).send({ error: 'Identifiants invalides.' });

    const user = rows[0];
    if (user.disabled_at)
      return reply.code(403).send({ error: 'Ce compte a été désactivé.' });
    if (user.suspended_until && new Date(user.suspended_until) > new Date())
      return reply.code(403).send({ error: 'Ce compte est temporairement suspendu.' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok)
      return reply.code(401).send({ error: 'Identifiants invalides.' });

    if (!user.email_verified)
      return reply.code(403).send({ error: 'Veuillez confirmer votre email avant de vous connecter.' });

    await fastify.pg.query(`UPDATE users SET last_login_at=NOW() WHERE id=$1`, [user.id]);

    const token = fastify.jwt.sign(
      { id: user.id, email: user.email, role: user.role, profile: user.profile_type },
      { expiresIn: '7d' }
    );

    reply.send({
      token,
      email:    user.email,
      profile:  user.profile_type,
      role:     user.role
    });
  });


  // ── POST /api/auth/forgot ─────────────────────────────────────────────────────
  fastify.post('/api/auth/forgot', { config: { rateLimit: rlStrict } }, async (req, reply) => {
    const email = sanitize(req.body?.email || '', 200).toLowerCase();
    if (!email) return reply.code(400).send({ error: 'Email requis.' });

    // Toujours renvoyer 200 pour éviter l'énumération des emails
    const { rows } = await fastify.pg.query(
      `SELECT id FROM users WHERE email=$1 AND email_verified=true AND disabled_at IS NULL`,
      [email]
    );

    if (rows.length) {
      const token     = randomToken();
      const tokenHash = hashToken(token);
      await fastify.pg.query(
        `INSERT INTO auth_tokens (user_id, token_hash, type, expires_at)
         VALUES ($1,$2,'reset_password', NOW() + INTERVAL '2 hours')`,
        [rows[0].id, tokenHash]
      );

      if (fastify.sendMail) {
        const link = `${BASE}/?reset_token=${token}`;
        fastify.sendMail(
          email,
          '🔑 CitrusCodex — Réinitialisation de mot de passe',
          `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h1 style="color:#c75b2a">🍊 CitrusCodex</h1>
            <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
            <p><a href="${link}" style="display:inline-block;padding:12px 24px;background:#c75b2a;color:white;text-decoration:none;border-radius:8px">Choisir un nouveau mot de passe</a></p>
            <p style="color:#666;font-size:12px">Lien valable 2h. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
          </div>`
        ).catch(err => fastify.log.warn('[mail] reset email failed:', err.message));
      }
    }

    reply.send({ ok: true });
  });


  // ── POST /api/auth/reset ──────────────────────────────────────────────────────
  fastify.post('/api/auth/reset', { config: { rateLimit: rlStrict } }, async (req, reply) => {
    const token       = req.body?.token || '';
    const new_password = req.body?.new_password || '';

    if (!token || !new_password)
      return reply.code(400).send({ error: 'Token et mot de passe requis.' });
    if (new_password.length < 8)
      return reply.code(400).send({ error: 'Mot de passe trop court (8 caractères minimum).' });
    if (!/[a-zA-Z]/.test(new_password) || !/[0-9]/.test(new_password))
      return reply.code(400).send({ error: 'Le mot de passe doit contenir au moins 1 lettre et 1 chiffre.' });

    const tokenHash = hashToken(token);
    const res = await fastify.pg.query(
      `SELECT t.id, t.user_id, t.expires_at, t.used_at
       FROM auth_tokens t
       WHERE t.token_hash=$1 AND t.type='reset_password'`,
      [tokenHash]
    );

    if (!res.rows.length)
      return reply.code(400).send({ error: 'Lien invalide ou expiré.' });
    const row = res.rows[0];
    if (row.used_at)
      return reply.code(400).send({ error: 'Ce lien a déjà été utilisé.' });
    if (new Date(row.expires_at) < new Date())
      return reply.code(400).send({ error: 'Lien expiré. Demandez un nouveau lien.' });

    const hash = await bcrypt.hash(new_password, 12);
    await fastify.pg.query(`UPDATE users SET password_hash=$1 WHERE id=$2`, [hash, row.user_id]);
    await fastify.pg.query(`UPDATE auth_tokens SET used_at=NOW() WHERE id=$1`, [row.id]);

    reply.send({ ok: true });
  });


  // ── PUT /api/auth/change-password ─────────────────────────────────────────────
  fastify.put('/api/auth/change-password', {
    preHandler: [fastify.authenticate]
  }, async (req, reply) => {
    const { current_password, new_password } = req.body || {};
    if (!current_password || !new_password)
      return reply.code(400).send({ error: 'Mot de passe actuel et nouveau requis.' });
    if (new_password.length < 8)
      return reply.code(400).send({ error: 'Nouveau mot de passe trop court (8 caractères minimum).' });
    if (!/[a-zA-Z]/.test(new_password) || !/[0-9]/.test(new_password))
      return reply.code(400).send({ error: 'Le mot de passe doit contenir au moins 1 lettre et 1 chiffre.' });

    const { rows } = await fastify.pg.query(
      'SELECT password_hash FROM users WHERE id=$1', [req.user.id]
    );
    if (!rows.length) return reply.code(404).send({ error: 'Utilisateur introuvable.' });

    const ok = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!ok) return reply.code(401).send({ error: 'Mot de passe actuel incorrect.' });

    const hash = await bcrypt.hash(new_password, 12);
    await fastify.pg.query(`UPDATE users SET password_hash=$1 WHERE id=$2`, [hash, req.user.id]);
    reply.send({ ok: true });
  });
};
