'use strict'

module.exports = async function userDataRoutes(fastify) {
  const auth = { preHandler: [fastify.authenticate] }

  const sanitizePlant = (b) => ({
    cca_number: b.cca_number || null,
    scientific_name: (b.scientific_name || b.name || '').trim(),
    common_name: b.common_name || null,
    variety: b.variety || null,
    rootstock: b.rootstock || null,
    acquisition_date: b.acquisition_date || b.dateAcquisition || null,
    date_precision: ['full','month','year','unknown'].includes(b.date_precision) ? b.date_precision : 'full',
    provenance_type: b.provenance_type || 'inconnu',
    provenance_mode: b.provenance_mode || 'inconnu',
    production_type: b.production_type || 'inconnu',
    provenance_detail: b.provenance_detail || null,
    emplacement_zone: b.emplacement_zone || null,
    emplacement_section: b.emplacement_section || null,
    emplacement_position: b.emplacement_position || null,
    lat: b.lat || null,
    lng: b.lng || null,
    photo_urls: JSON.stringify(b.photo_urls || []),
    notes: b.notes || null,
    metadata: JSON.stringify(b.metadata || {}),
    client_id: b.client_id || b.id || null
  })

  // ── PLANTS ────────────────────────────────────────────────────────
  fastify.get('/api/user/plants', auth, async (req) => {
    const r = await fastify.pg.query(
      `SELECT * FROM user_plants WHERE user_id=$1 AND deleted_at IS NULL ORDER BY created_at DESC`,
      [req.user.id])
    return r.rows
  })

  fastify.post('/api/user/plants', auth, async (req, reply) => {
    const p = sanitizePlant(req.body)
    if (!p.scientific_name) return reply.code(400).send({ error: 'scientific_name required' })
    try {
      const r = await fastify.pg.query(
        `INSERT INTO user_plants
         (user_id, cca_number, scientific_name, common_name, variety, rootstock,
          acquisition_date, date_precision, provenance_type, provenance_mode, production_type,
          provenance_detail, emplacement_zone, emplacement_section, emplacement_position,
          lat, lng, photo_urls, notes, metadata, client_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
         RETURNING *`,
        [req.user.id, p.cca_number, p.scientific_name, p.common_name, p.variety, p.rootstock,
         p.acquisition_date, p.date_precision, p.provenance_type, p.provenance_mode, p.production_type,
         p.provenance_detail, p.emplacement_zone, p.emplacement_section, p.emplacement_position,
         p.lat, p.lng, p.photo_urls, p.notes, p.metadata, p.client_id])
      return reply.code(201).send(r.rows[0])
    } catch (err) {
      if (err.code === '23505') return reply.code(409).send({ error: 'Duplicate cca_number or client_id' })
      throw err
    }
  })

  fastify.put('/api/user/plants/:id', auth, async (req, reply) => {
    const p = sanitizePlant(req.body)
    const r = await fastify.pg.query(
      `UPDATE user_plants SET
        cca_number=$1, scientific_name=$2, common_name=$3, variety=$4, rootstock=$5,
        acquisition_date=$6, date_precision=$7, provenance_type=$8, provenance_mode=$9,
        production_type=$10, provenance_detail=$11, emplacement_zone=$12,
        emplacement_section=$13, emplacement_position=$14, lat=$15, lng=$16,
        photo_urls=$17, notes=$18, metadata=$19
       WHERE id=$20 AND user_id=$21 AND deleted_at IS NULL RETURNING *`,
      [p.cca_number, p.scientific_name, p.common_name, p.variety, p.rootstock,
       p.acquisition_date, p.date_precision, p.provenance_type, p.provenance_mode,
       p.production_type, p.provenance_detail, p.emplacement_zone,
       p.emplacement_section, p.emplacement_position, p.lat, p.lng,
       p.photo_urls, p.notes, p.metadata, req.params.id, req.user.id])
    if (!r.rowCount) return reply.code(404).send({ error: 'Not found' })
    return r.rows[0]
  })

  fastify.delete('/api/user/plants/:id', auth, async (req, reply) => {
    const r = await fastify.pg.query(
      `UPDATE user_plants SET deleted_at=NOW() WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL`,
      [req.params.id, req.user.id])
    if (!r.rowCount) return reply.code(404).send({ error: 'Not found' })
    return { ok: true }
  })

  // ── EVENTS ────────────────────────────────────────────────────────
  fastify.get('/api/user/events', auth, async (req) => {
    const plant = req.query.plant_id
    const base = `SELECT e.*, f.product_name, f.weight_g, f.npk_n, f.npk_p, f.npk_k, f.mgo, f.oligos,
                         h.weight_kg, h.brix, h.buyer, h.price_per_kg_cents,
                         g.scion_variety, g.rootstock_plant_id, g.graft_type, g.success_at
                  FROM user_events e
                  LEFT JOIN user_fertilizations f ON f.event_id = e.id
                  LEFT JOIN user_harvests h ON h.event_id = e.id
                  LEFT JOIN user_graftings g ON g.event_id = e.id
                  WHERE e.user_id=$1 AND e.deleted_at IS NULL`
    const r = plant
      ? await fastify.pg.query(base + ` AND e.plant_id=$2 ORDER BY e.event_date DESC`, [req.user.id, plant])
      : await fastify.pg.query(base + ` ORDER BY e.event_date DESC`, [req.user.id])
    return r.rows
  })

  fastify.post('/api/user/events', auth, async (req, reply) => {
    const b = req.body
    const client = await fastify.pg.connect()
    try {
      await client.query('BEGIN')
      const e = await client.query(
        `INSERT INTO user_events
         (user_id, plant_id, event_type, event_date, date_precision, notes, metadata, client_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [req.user.id, b.plant_id || null, b.event_type, b.event_date,
         b.date_precision || 'full', b.notes || null,
         JSON.stringify(b.metadata || {}), b.client_id || null])
      const eventId = e.rows[0].id
      if (b.event_type === 'fertilization' && b.fert) {
        await client.query(
          `INSERT INTO user_fertilizations (event_id, product_name, weight_g, npk_n, npk_p, npk_k, mgo, oligos, stock_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [eventId, b.fert.product_name, b.fert.weight_g, b.fert.npk_n, b.fert.npk_p,
           b.fert.npk_k, b.fert.mgo, JSON.stringify(b.fert.oligos || {}), b.fert.stock_id || null])
      }
      if (b.event_type === 'harvest' && b.harvest) {
        await client.query(
          `INSERT INTO user_harvests (event_id, weight_kg, brix, buyer, price_per_kg_cents, lot_id)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [eventId, b.harvest.weight_kg, b.harvest.brix, b.harvest.buyer,
           b.harvest.price_per_kg_cents, b.harvest.lot_id || null])
      }
      if (b.event_type === 'grafting' && b.graft) {
        await client.query(
          `INSERT INTO user_graftings (event_id, scion_variety, rootstock_plant_id, graft_type, success_at, failure_reason)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [eventId, b.graft.scion_variety, b.graft.rootstock_plant_id,
           b.graft.graft_type, b.graft.success_at || null, b.graft.failure_reason || null])
      }
      await client.query('COMMIT')
      return reply.code(201).send(e.rows[0])
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  })

  fastify.put('/api/user/events/:id', auth, async (req, reply) => {
    const b = req.body
    const r = await fastify.pg.query(
      `UPDATE user_events SET event_type=$1, event_date=$2, date_precision=$3, notes=$4, metadata=$5
       WHERE id=$6 AND user_id=$7 AND deleted_at IS NULL RETURNING *`,
      [b.event_type, b.event_date, b.date_precision || 'full',
       b.notes || null, JSON.stringify(b.metadata || {}), req.params.id, req.user.id])
    if (!r.rowCount) return reply.code(404).send({ error: 'Not found' })
    return r.rows[0]
  })

  fastify.delete('/api/user/events/:id', auth, async (req, reply) => {
    const r = await fastify.pg.query(
      `UPDATE user_events SET deleted_at=NOW() WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL`,
      [req.params.id, req.user.id])
    if (!r.rowCount) return reply.code(404).send({ error: 'Not found' })
    return { ok: true }
  })

  // ── PARCELLES ─────────────────────────────────────────────────────
  fastify.get('/api/user/parcelles', auth, async (req) => {
    const r = await fastify.pg.query(
      `SELECT * FROM user_parcelles WHERE user_id=$1 AND deleted_at IS NULL ORDER BY created_at DESC`, [req.user.id])
    return r.rows
  })
  fastify.post('/api/user/parcelles', auth, async (req, reply) => {
    const b = req.body
    if (!b.name) return reply.code(400).send({ error: 'name required' })
    const r = await fastify.pg.query(
      `INSERT INTO user_parcelles (user_id, name, surface_ha, densite_arbres, geojson, notes, client_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.id, b.name, b.surface_ha || null, b.densite_arbres || null,
       b.geojson ? JSON.stringify(b.geojson) : null, b.notes || null, b.client_id || null])
    return reply.code(201).send(r.rows[0])
  })
  fastify.put('/api/user/parcelles/:id', auth, async (req, reply) => {
    const b = req.body
    const r = await fastify.pg.query(
      `UPDATE user_parcelles SET name=$1, surface_ha=$2, densite_arbres=$3, geojson=$4, notes=$5
       WHERE id=$6 AND user_id=$7 AND deleted_at IS NULL RETURNING *`,
      [b.name, b.surface_ha || null, b.densite_arbres || null,
       b.geojson ? JSON.stringify(b.geojson) : null, b.notes || null, req.params.id, req.user.id])
    if (!r.rowCount) return reply.code(404).send({ error: 'Not found' })
    return r.rows[0]
  })
  fastify.delete('/api/user/parcelles/:id', auth, async (req, reply) => {
    const r = await fastify.pg.query(
      `UPDATE user_parcelles SET deleted_at=NOW() WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL`,
      [req.params.id, req.user.id])
    if (!r.rowCount) return reply.code(404).send({ error: 'Not found' })
    return { ok: true }
  })

  // ── STOCKS ────────────────────────────────────────────────────────
  fastify.get('/api/user/stocks', auth, async (req) => {
    const r = await fastify.pg.query(
      `SELECT * FROM user_stocks WHERE user_id=$1 AND deleted_at IS NULL ORDER BY product_name`, [req.user.id])
    return r.rows
  })
  fastify.post('/api/user/stocks', auth, async (req, reply) => {
    const b = req.body
    if (!b.product_name || !b.product_type || !b.unit)
      return reply.code(400).send({ error: 'product_name, product_type, unit required' })
    const r = await fastify.pg.query(
      `INSERT INTO user_stocks (user_id, product_name, product_type, unit, current_qty, alert_qty, metadata, client_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.id, b.product_name, b.product_type, b.unit,
       b.current_qty || 0, b.alert_qty || null, JSON.stringify(b.metadata || {}), b.client_id || null])
    return reply.code(201).send(r.rows[0])
  })
  fastify.put('/api/user/stocks/:id', auth, async (req, reply) => {
    const b = req.body
    const r = await fastify.pg.query(
      `UPDATE user_stocks SET product_name=$1, product_type=$2, unit=$3, current_qty=$4, alert_qty=$5, metadata=$6
       WHERE id=$7 AND user_id=$8 AND deleted_at IS NULL RETURNING *`,
      [b.product_name, b.product_type, b.unit, b.current_qty || 0,
       b.alert_qty || null, JSON.stringify(b.metadata || {}), req.params.id, req.user.id])
    if (!r.rowCount) return reply.code(404).send({ error: 'Not found' })
    return r.rows[0]
  })
  fastify.delete('/api/user/stocks/:id', auth, async (req, reply) => {
    const r = await fastify.pg.query(
      `UPDATE user_stocks SET deleted_at=NOW() WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL`,
      [req.params.id, req.user.id])
    if (!r.rowCount) return reply.code(404).send({ error: 'Not found' })
    return { ok: true }
  })

  // ── ECONOMIC ──────────────────────────────────────────────────────
  fastify.get('/api/user/economic', auth, async (req) => {
    const r = await fastify.pg.query(
      `SELECT * FROM user_economic_entries WHERE user_id=$1 AND deleted_at IS NULL ORDER BY entry_date DESC`, [req.user.id])
    return r.rows
  })
  fastify.post('/api/user/economic', auth, async (req, reply) => {
    const b = req.body
    if (!b.entry_date || !b.entry_type || !b.category || b.amount_cents == null)
      return reply.code(400).send({ error: 'entry_date, entry_type, category, amount_cents required' })
    const r = await fastify.pg.query(
      `INSERT INTO user_economic_entries
       (user_id, entry_date, plant_id, parcelle_id, entry_type, category, amount_cents, qty, unit, note, event_id, client_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [req.user.id, b.entry_date, b.plant_id || null, b.parcelle_id || null,
       b.entry_type, b.category, b.amount_cents, b.qty || null, b.unit || null,
       b.note || null, b.event_id || null, b.client_id || null])
    return reply.code(201).send(r.rows[0])
  })
  fastify.put('/api/user/economic/:id', auth, async (req, reply) => {
    const b = req.body
    const r = await fastify.pg.query(
      `UPDATE user_economic_entries SET entry_date=$1, entry_type=$2, category=$3, amount_cents=$4, qty=$5, unit=$6, note=$7
       WHERE id=$8 AND user_id=$9 AND deleted_at IS NULL RETURNING *`,
      [b.entry_date, b.entry_type, b.category, b.amount_cents,
       b.qty || null, b.unit || null, b.note || null, req.params.id, req.user.id])
    if (!r.rowCount) return reply.code(404).send({ error: 'Not found' })
    return r.rows[0]
  })
  fastify.delete('/api/user/economic/:id', auth, async (req, reply) => {
    const r = await fastify.pg.query(
      `UPDATE user_economic_entries SET deleted_at=NOW() WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL`,
      [req.params.id, req.user.id])
    if (!r.rowCount) return reply.code(404).send({ error: 'Not found' })
    return { ok: true }
  })

  // ── BOUTURES ──────────────────────────────────────────────────────
  fastify.get('/api/user/boutures', auth, async (req) => {
    const r = await fastify.pg.query(
      `SELECT * FROM user_boutures WHERE user_id=$1 AND deleted_at IS NULL ORDER BY date_prise DESC`, [req.user.id])
    return r.rows
  })
  fastify.post('/api/user/boutures', auth, async (req, reply) => {
    const b = req.body
    if (!b.date_prise || !b.nb_boutures) return reply.code(400).send({ error: 'date_prise, nb_boutures required' })
    const r = await fastify.pg.query(
      `INSERT INTO user_boutures (user_id, parent_plant_id, date_prise, nb_boutures, substrat, success_rate, notes, client_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.id, b.parent_plant_id || null, b.date_prise, b.nb_boutures,
       b.substrat || null, b.success_rate || null, b.notes || null, b.client_id || null])
    return reply.code(201).send(r.rows[0])
  })
  fastify.put('/api/user/boutures/:id', auth, async (req, reply) => {
    const b = req.body
    const r = await fastify.pg.query(
      `UPDATE user_boutures SET date_prise=$1, nb_boutures=$2, substrat=$3, success_rate=$4, notes=$5
       WHERE id=$6 AND user_id=$7 AND deleted_at IS NULL RETURNING *`,
      [b.date_prise, b.nb_boutures, b.substrat || null,
       b.success_rate || null, b.notes || null, req.params.id, req.user.id])
    if (!r.rowCount) return reply.code(404).send({ error: 'Not found' })
    return r.rows[0]
  })
  fastify.delete('/api/user/boutures/:id', auth, async (req, reply) => {
    const r = await fastify.pg.query(
      `UPDATE user_boutures SET deleted_at=NOW() WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL`,
      [req.params.id, req.user.id])
    if (!r.rowCount) return reply.code(404).send({ error: 'Not found' })
    return { ok: true }
  })

  // ── SETTINGS (UPSERT) ─────────────────────────────────────────────
  fastify.get('/api/user/settings', auth, async (req) => {
    await fastify.pg.query(`INSERT INTO user_settings(user_id) VALUES($1) ON CONFLICT DO NOTHING`, [req.user.id])
    const r = await fastify.pg.query(`SELECT * FROM user_settings WHERE user_id=$1`, [req.user.id])
    return r.rows[0]
  })
  fastify.put('/api/user/settings', auth, async (req) => {
    const s = req.body
    await fastify.pg.query(
      `INSERT INTO user_settings(user_id, language, theme, notif_gel, notif_calendrier, notif_bbch, readonly_mode, profile_json)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (user_id) DO UPDATE SET
         language=EXCLUDED.language, theme=EXCLUDED.theme,
         notif_gel=EXCLUDED.notif_gel, notif_calendrier=EXCLUDED.notif_calendrier,
         notif_bbch=EXCLUDED.notif_bbch, readonly_mode=EXCLUDED.readonly_mode,
         profile_json=EXCLUDED.profile_json`,
      [req.user.id, s.language || 'fr', s.theme || 'light',
       s.notif_gel !== false, s.notif_calendrier !== false, s.notif_bbch !== false,
       s.readonly_mode === true, JSON.stringify(s.profile_json || {})])
    return { ok: true }
  })

  // ── PROFILE TYPE ──────────────────────────────────────────────────
  fastify.get('/api/user/profile-type', auth, async (req) => {
    const r = await fastify.pg.query(`SELECT profile_type FROM users WHERE id=$1`, [req.user.id])
    return { profile_type: r.rows[0] ? r.rows[0].profile_type : 'collectionneur' }
  })
}
