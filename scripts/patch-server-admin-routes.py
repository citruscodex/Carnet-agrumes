#!/usr/bin/env python3
"""
patch-server-admin-routes.py
Injects POST /api/admin/invite and POST /api/admin/users/:id/reset-password
into /opt/cca/server.js (runs on the server directly).
"""
import sys

SERVERJS = '/opt/cca/server.js'

with open(SERVERJS, 'r') as f:
    content = f.read()

if '/api/admin/invite' in content:
    print('Already patched — /api/admin/invite found, skipping.')
    sys.exit(0)

ROUTES = r"""
// ── POST /api/admin/invite — Créer un compte beta-testeur directement ─────
fastify.post('/api/admin/invite', { preHandler: [requireRole(['admin'])] }, async (req, reply) => {
  const { email, password, profile_type } = req.body
  if (!email || !password) return reply.code(400).send({ error: 'Email et mot de passe requis' })
  if (password.length < 8) return reply.code(400).send({ error: 'Mot de passe trop court (min 8)' })
  const VALID_PT = ['collectionneur','pepinieriste','arboriculteur','conservatoire']
  const pt = VALID_PT.includes(profile_type) ? profile_type : 'collectionneur'
  const cleanEmail = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return reply.code(400).send({ error: 'Email invalide' })
  const exists = await pool.query('SELECT id FROM users WHERE email=$1', [cleanEmail])
  if (exists.rows.length) return reply.code(409).send({ error: 'Email deja utilise' })
  const hash = await bcrypt.hash(password, 12)
  const { rows } = await pool.query(
    'INSERT INTO users (email, password_hash, profile_type, email_verified, is_active) VALUES ($1,$2,$3,TRUE,TRUE) RETURNING id,email,profile_type,created_at',
    [cleanEmail, hash, pt]
  )
  await pool.query('INSERT INTO audit_log (admin_id, action, details) VALUES ($1,$2,$3)', [req.user.id, 'invite_user', JSON.stringify({ email: cleanEmail, profile_type: pt })])
  sendMail(
    cleanEmail,
    'Bienvenue sur CitrusCodex',
    '<div style="font-family:sans-serif;max-width:600px;margin:0 auto">' +
    '<h1 style="color:#c75b2a">CitrusCodex</h1>' +
    '<p>Votre compte beta-testeur a ete cree :</p>' +
    '<ul><li><strong>Email :</strong> ' + cleanEmail + '</li>' +
    '<li><strong>Mot de passe :</strong> ' + password + '</li>' +
    '<li><strong>Profil :</strong> ' + pt + '</li></ul>' +
    '<p><a href="' + BASE_URL + '" style="display:inline-block;padding:12px 24px;background:#c75b2a;color:white;text-decoration:none;border-radius:8px">Acceder a CitrusCodex</a></p>' +
    '<p style="color:#666;font-size:12px">Changez votre mot de passe des votre premiere connexion.</p></div>'
  ).catch(e => fastify.log.warn('[mail] welcome failed:', e.message))
  reply.code(201).send(rows[0])
})

// ── POST /api/admin/users/:id/reset-password — Réinitialiser mdp ───────────
fastify.post('/api/admin/users/:id/reset-password', { preHandler: [requireRole(['admin'])] }, async (req, reply) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let newPwd = ''; for (let i = 0; i < 12; i++) newPwd += chars[Math.floor(Math.random() * chars.length)]
  const hash = await bcrypt.hash(newPwd, 12)
  const { rows } = await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2 RETURNING id,email', [hash, req.params.id])
  if (!rows.length) return reply.code(404).send({ error: 'Not found' })
  await pool.query('INSERT INTO audit_log (admin_id, action, target_id, details) VALUES ($1,$2,$3,$4)',
    [req.user.id, 'reset_password', parseInt(req.params.id), '{}'])
  sendMail(
    rows[0].email,
    'CitrusCodex - Nouveau mot de passe temporaire',
    '<div style="font-family:sans-serif;max-width:600px;margin:0 auto">' +
    '<h1 style="color:#c75b2a">CitrusCodex</h1>' +
    '<p>Votre mot de passe a ete reinitialise par un administrateur.</p>' +
    '<p>Nouveau mot de passe temporaire :<br>' +
    '<strong style="font-size:1.3em;font-family:monospace;letter-spacing:2px">' + newPwd + '</strong></p>' +
    '<p><a href="' + BASE_URL + '">Acceder a CitrusCodex</a></p>' +
    '<p style="color:#666;font-size:12px">Changez-le des votre prochaine connexion.</p></div>'
  ).catch(e => fastify.log.warn('[mail] reset-pwd failed:', e.message))
  reply.send({ ok: true, email: rows[0].email, temp_password: newPwd })
})

"""

# Insert after DELETE /api/admin/whitelist/:id route (the next route is wiki/deleted)
INSERT_AFTER = "  return { ok: true }\n})\n\nfastify.get('/api/admin/wiki/deleted'"
REPLACEMENT  = "  return { ok: true }\n})\n" + ROUTES + "\nfastify.get('/api/admin/wiki/deleted'"

if INSERT_AFTER not in content:
    print('ERROR: anchor not found in server.js — check manually')
    sys.exit(1)

content = content.replace(INSERT_AFTER, REPLACEMENT, 1)

with open(SERVERJS, 'w') as f:
    f.write(content)

print('Patched OK — routes added to server.js')
