'use strict'

module.exports = async function userAccountRoutes(fastify) {
  fastify.delete('/api/user/account', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { confirm } = req.body || {}
    const expected = `DELETE_MY_ACCOUNT_${req.user.email}`
    if (confirm !== expected) {
      return reply.code(400).send({ error: 'Confirmation mismatch', expected_pattern: 'DELETE_MY_ACCOUNT_<email>' })
    }
    try {
      await fastify.pg.query(
        `INSERT INTO audit_log(admin_id, action, target_id, details) VALUES($1,$2,$3,$4)`,
        [req.user.id, 'ACCOUNT_DELETED', req.user.id,
         JSON.stringify({ email: req.user.email, date: new Date().toISOString() })])
    } catch (_) { /* audit_log best-effort */ }
    await fastify.pg.query(`DELETE FROM users WHERE id=$1`, [req.user.id])
    return { ok: true, message: 'Account deleted' }
  })
}
