'use strict';

// Routes complémentaires au panel admin (audit log, bug groups, activate/deactivate,
// hard-delete, stats étendues). Ne duplique pas les routes déjà dans admin.js.

function sanitize(str, max = 500) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim().slice(0, max);
}

async function logAdminAction(pg, adminId, targetUserId, action, details = {}) {
  await pg.query(
    `INSERT INTO admin_audit_log (admin_id, target_user_id, action, details)
     VALUES ($1, $2, $3, $4)`,
    [adminId, targetUserId || null, action, JSON.stringify(details)]
  );
}

module.exports = async function adminPanelPlugin(fastify) {

  const rl = { max: 30, timeWindow: '1 minute', keyGenerator: req => req.user?.id || req.ip };

  async function requireAdmin(req, reply) {
    if (!['admin', 'moderator'].includes(req.user?.role)) {
      return reply.code(403).send({ error: 'Forbidden' });
    }
  }

  const guard = { preHandler: [fastify.authenticate, requireAdmin] };
  const guardCfg = { config: { rateLimit: rl }, preHandler: [fastify.authenticate, requireAdmin] };

  // ── PUT /api/admin/users/:id/activate ────────────────────────────────────────
  fastify.put('/api/admin/users/:id/activate', guardCfg, async (req, reply) => {
    const { rows } = await fastify.pg.query(
      `UPDATE users SET is_active=true, disabled_at=NULL, deactivated_at=NULL, deactivated_reason=NULL
       WHERE id=$1 RETURNING id, email`,
      [req.params.id]
    );
    if (!rows.length) return reply.code(404).send({ error: 'User not found' });
    await logAdminAction(fastify.pg, req.user.id, parseInt(req.params.id), 'user_activated', {
      email: rows[0].email
    });
    reply.send({ ok: true, user: rows[0] });
  });

  // ── PUT /api/admin/users/:id/deactivate ──────────────────────────────────────
  fastify.put('/api/admin/users/:id/deactivate', guardCfg, async (req, reply) => {
    if (String(req.params.id) === String(req.user.id))
      return reply.code(403).send({ error: 'Cannot deactivate yourself' });
    const reason = sanitize(req.body?.reason || '', 500);
    const { rows } = await fastify.pg.query(
      `UPDATE users SET is_active=false, disabled_at=NOW(), deactivated_at=NOW(), deactivated_reason=$2
       WHERE id=$1 RETURNING id, email`,
      [req.params.id, reason || null]
    );
    if (!rows.length) return reply.code(404).send({ error: 'User not found' });
    await logAdminAction(fastify.pg, req.user.id, parseInt(req.params.id), 'user_deactivated', {
      email: rows[0].email, reason
    });
    reply.send({ ok: true, user: rows[0] });
  });

  // ── POST /api/admin/users/:id/hard-delete ────────────────────────────────────
  fastify.post('/api/admin/users/:id/hard-delete', guardCfg, async (req, reply) => {
    if (String(req.params.id) === String(req.user.id))
      return reply.code(403).send({ error: 'Cannot delete yourself' });
    const { confirm } = req.body || {};
    const { rows: target } = await fastify.pg.query(
      `SELECT id, email FROM users WHERE id=$1`, [req.params.id]
    );
    if (!target.length) return reply.code(404).send({ error: 'User not found' });
    if (confirm !== `DELETE_USER_${target[0].email}`)
      return reply.code(400).send({ error: `Confirmation required: DELETE_USER_${target[0].email}` });
    await logAdminAction(fastify.pg, req.user.id, parseInt(req.params.id), 'user_deleted', {
      email: target[0].email
    });
    await fastify.pg.query(`DELETE FROM users WHERE id=$1`, [req.params.id]);
    reply.send({ ok: true });
  });

  // ── GET /api/admin/users/:id/audit ───────────────────────────────────────────
  fastify.get('/api/admin/users/:id/audit', guardCfg, async (req, reply) => {
    const { rows } = await fastify.pg.query(
      `SELECT l.id, l.action, l.details, l.created_at,
              a.email AS admin_email
       FROM admin_audit_log l
       JOIN users a ON a.id = l.admin_id
       WHERE l.target_user_id=$1
       ORDER BY l.created_at DESC
       LIMIT 100`,
      [req.params.id]
    );
    reply.send(rows);
  });

  // ── GET /api/admin/audit-log ─────────────────────────────────────────────────
  fastify.get('/api/admin/audit-log', guardCfg, async (req, reply) => {
    const page  = Math.max(1, parseInt(req.query?.page  || '1'));
    const limit = Math.min(100, parseInt(req.query?.limit || '50'));
    const offset = (page - 1) * limit;
    const action = sanitize(req.query?.action || '', 50);
    const targetId = req.query?.target_user_id ? parseInt(req.query.target_user_id) : null;

    let where = 'WHERE 1=1';
    const vals = [];
    if (action) { vals.push(action); where += ` AND l.action=$${vals.length}`; }
    if (targetId) { vals.push(targetId); where += ` AND l.target_user_id=$${vals.length}`; }

    vals.push(limit); vals.push(offset);
    const { rows } = await fastify.pg.query(
      `SELECT l.id, l.action, l.details, l.created_at,
              a.email AS admin_email,
              t.email AS target_email
       FROM admin_audit_log l
       JOIN users a ON a.id = l.admin_id
       LEFT JOIN users t ON t.id = l.target_user_id
       ${where}
       ORDER BY l.created_at DESC
       LIMIT $${vals.length - 1} OFFSET $${vals.length}`,
      vals
    );
    reply.send(rows);
  });

  // ── GET /api/admin/bugs/groups ───────────────────────────────────────────────
  fastify.get('/api/admin/bugs/groups', guardCfg, async (req, reply) => {
    const { rows } = await fastify.pg.query(
      `SELECT g.id, g.title, g.description, g.status, g.priority, g.created_at, g.updated_at,
              COUNT(b.id)::int AS bug_count,
              u.email AS created_by_email
       FROM bug_report_groups g
       LEFT JOIN bug_reports b ON b.group_id = g.id
       JOIN users u ON u.id = g.created_by
       GROUP BY g.id, u.email
       ORDER BY g.created_at DESC`
    );
    reply.send(rows);
  });

  // ── POST /api/admin/bugs/groups ──────────────────────────────────────────────
  fastify.post('/api/admin/bugs/groups', guardCfg, async (req, reply) => {
    const title       = sanitize(req.body?.title || '', 200);
    const description = sanitize(req.body?.description || '', 2000);
    if (!title) return reply.code(400).send({ error: 'title required' });
    const { rows } = await fastify.pg.query(
      `INSERT INTO bug_report_groups (title, description, created_by)
       VALUES ($1, $2, $3) RETURNING *`,
      [title, description || null, req.user.id]
    );
    await logAdminAction(fastify.pg, req.user.id, null, 'bug_group_created', { title, id: rows[0].id });
    reply.code(201).send(rows[0]);
  });

  // ── PUT /api/admin/bugs/groups/:id ───────────────────────────────────────────
  fastify.put('/api/admin/bugs/groups/:id', guardCfg, async (req, reply) => {
    const VALID_STATUSES  = new Set(['open','in_progress','resolved','closed','wontfix']);
    const VALID_PRIORITIES = new Set(['low','normal','high','critical']);
    const title       = req.body?.title       ? sanitize(req.body.title, 200) : undefined;
    const description = req.body?.description !== undefined ? sanitize(req.body.description, 2000) : undefined;
    const status      = req.body?.status && VALID_STATUSES.has(req.body.status) ? req.body.status : undefined;
    const priority    = req.body?.priority && VALID_PRIORITIES.has(req.body.priority) ? req.body.priority : undefined;

    const sets = []; const vals = [];
    if (title       !== undefined) { vals.push(title);       sets.push(`title=$${vals.length}`); }
    if (description !== undefined) { vals.push(description); sets.push(`description=$${vals.length}`); }
    if (status      !== undefined) { vals.push(status);      sets.push(`status=$${vals.length}`); }
    if (priority    !== undefined) { vals.push(priority);    sets.push(`priority=$${vals.length}`); }
    if (!sets.length) return reply.code(400).send({ error: 'No fields to update' });

    vals.push(req.params.id);
    const { rows } = await fastify.pg.query(
      `UPDATE bug_report_groups SET ${sets.join(',')} WHERE id=$${vals.length} RETURNING *`,
      vals
    );
    if (!rows.length) return reply.code(404).send({ error: 'Group not found' });
    reply.send(rows[0]);
  });

  // ── POST /api/admin/bugs/:id/merge/:groupId ───────────────────────────────────
  fastify.post('/api/admin/bugs/:id/merge/:groupId', guardCfg, async (req, reply) => {
    const { rows } = await fastify.pg.query(
      `UPDATE bug_reports SET group_id=$1 WHERE id=$2 RETURNING id`,
      [req.params.groupId, req.params.id]
    );
    if (!rows.length) return reply.code(404).send({ error: 'Bug not found' });
    await logAdminAction(fastify.pg, req.user.id, null, 'bug_merged', {
      bug_id: req.params.id, group_id: req.params.groupId
    });
    reply.send({ ok: true });
  });

  // ── PUT /api/admin/bugs/:id ───────────────────────────────────────────────────
  fastify.put('/api/admin/bugs/:id', guardCfg, async (req, reply) => {
    const VALID_STATUSES   = new Set(['open','acknowledged','in_progress','resolved','closed','wont_fix']);
    const VALID_PRIORITIES = new Set(['low','normal','high','critical']);
    const status      = req.body?.status && VALID_STATUSES.has(req.body.status) ? req.body.status : undefined;
    const priority    = req.body?.priority && VALID_PRIORITIES.has(req.body.priority) ? req.body.priority : undefined;
    const assigned_to = req.body?.assigned_to !== undefined ? (req.body.assigned_to || null) : undefined;
    const admin_notes = req.body?.admin_notes !== undefined ? sanitize(req.body.admin_notes, 2000) : undefined;

    const sets = []; const vals = [];
    if (status      !== undefined) { vals.push(status);      sets.push(`status=$${vals.length}`); }
    if (priority    !== undefined) { vals.push(priority);    sets.push(`priority=$${vals.length}`); }
    if (assigned_to !== undefined) { vals.push(assigned_to); sets.push(`assigned_to=$${vals.length}`); }
    if (admin_notes !== undefined) { vals.push(admin_notes); sets.push(`admin_notes=$${vals.length}`); }
    if (!sets.length) return reply.code(400).send({ error: 'No fields to update' });

    vals.push(req.params.id);
    const { rows } = await fastify.pg.query(
      `UPDATE bug_reports SET ${sets.join(',')} WHERE id=$${vals.length} RETURNING id`,
      vals
    );
    if (!rows.length) return reply.code(404).send({ error: 'Bug not found' });
    await logAdminAction(fastify.pg, req.user.id, null, 'bug_status_changed', {
      bug_id: req.params.id, status, priority, assigned_to
    });
    reply.send({ ok: true });
  });

  // ── DELETE /api/admin/bugs/:id ────────────────────────────────────────────────
  fastify.delete('/api/admin/bugs/:id', guardCfg, async (req, reply) => {
    const { rowCount } = await fastify.pg.query(
      `DELETE FROM bug_reports WHERE id=$1`, [req.params.id]
    );
    if (!rowCount) return reply.code(404).send({ error: 'Bug not found' });
    await logAdminAction(fastify.pg, req.user.id, null, 'bug_deleted', { bug_id: req.params.id });
    reply.send({ ok: true });
  });

  // ── GET /api/admin/bugs (avancé, filtres complets) ────────────────────────────
  fastify.get('/api/admin/bugs/list', guardCfg, async (req, reply) => {
    const VALID_STATUSES   = new Set(['open','acknowledged','in_progress','resolved','closed','wont_fix']);
    const VALID_PRIORITIES = new Set(['low','normal','high','critical']);
    const { status, priority, group_id, assigned_to, limit = 100, offset = 0 } = req.query || {};

    let where = 'WHERE 1=1'; const vals = [];
    if (status && VALID_STATUSES.has(status))     { vals.push(status);      where += ` AND b.status=$${vals.length}`; }
    if (priority && VALID_PRIORITIES.has(priority)){ vals.push(priority);   where += ` AND b.priority=$${vals.length}`; }
    if (group_id)    { vals.push(group_id);    where += ` AND b.group_id=$${vals.length}`; }
    if (assigned_to) { vals.push(assigned_to); where += ` AND b.assigned_to=$${vals.length}`; }

    vals.push(Math.min(parseInt(limit) || 100, 500));
    vals.push(Math.max(parseInt(offset) || 0, 0));

    const { rows } = await fastify.pg.query(
      `SELECT b.id, b.title, b.description, b.category, b.severity, b.status, b.priority,
              b.group_id, b.assigned_to, b.created_at, b.updated_at,
              u.email AS user_email
       FROM bug_reports b
       LEFT JOIN users u ON u.id::text = b.user_id::text
       ${where}
       ORDER BY b.created_at DESC
       LIMIT $${vals.length - 1} OFFSET $${vals.length}`,
      vals
    );
    reply.send(rows);
  });

  // ── GET /api/admin/stats/extended ────────────────────────────────────────────
  fastify.get('/api/admin/stats/extended', guardCfg, async (req, reply) => {
    const [users, bugs, plants] = await Promise.all([
      fastify.pg.query(`
        SELECT
          COUNT(*)::int                                                            AS total,
          COUNT(*) FILTER (WHERE is_active = true OR is_active IS NULL)::int      AS active,
          COUNT(*) FILTER (WHERE is_active = false)::int                          AS inactive,
          COUNT(*) FILTER (WHERE last_login_at > NOW() - INTERVAL '7 days')::int  AS logins_week,
          COALESCE(json_agg(json_build_object('email',email,'login_count',COALESCE(login_count,0))
            ORDER BY login_count DESC NULLS LAST) FILTER (WHERE row_num <= 5), '[]') AS top_users
        FROM (
          SELECT *, ROW_NUMBER() OVER (ORDER BY login_count DESC NULLS LAST) AS row_num FROM users
        ) sub
      `),
      fastify.pg.query(`
        SELECT
          COUNT(*) FILTER (WHERE status='open')::int     AS open,
          COUNT(*) FILTER (WHERE status='resolved')::int AS resolved
        FROM bug_reports
      `),
      fastify.pg.query(`SELECT COUNT(*)::int AS total FROM user_plants WHERE deleted_at IS NULL`)
    ]);
    reply.send({
      users: users.rows[0],
      bugs:  bugs.rows[0],
      plants: plants.rows[0].total
    });
  });
};
