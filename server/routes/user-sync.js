'use strict'

module.exports = async function userSyncRoutes(fastify) {
  const auth = { preHandler: [fastify.authenticate] }

  // ── GET /api/user/sync/snapshot?since=<ISO> ───────────────────────
  fastify.get('/api/user/sync/snapshot', auth, async (req) => {
    const since = req.query.since || '1970-01-01T00:00:00Z'
    const uid = req.user.id

    const [plants, events, parcelles, stocks, eco, lots, lotPlants, boutures,
           phyto, settings, sortis, lumiere] = await Promise.all([
      fastify.pg.query(`SELECT * FROM user_plants WHERE user_id=$1 AND (updated_at > $2 OR deleted_at > $2)`, [uid, since]),
      fastify.pg.query(`SELECT e.*, f.product_name, f.weight_g, f.npk_n, f.npk_p, f.npk_k, f.mgo, f.oligos,
                               h.weight_kg, h.brix, h.buyer, h.price_per_kg_cents,
                               g.scion_variety, g.rootstock_plant_id, g.graft_type, g.success_at
                        FROM user_events e
                        LEFT JOIN user_fertilizations f ON f.event_id=e.id
                        LEFT JOIN user_harvests h ON h.event_id=e.id
                        LEFT JOIN user_graftings g ON g.event_id=e.id
                        WHERE e.user_id=$1 AND (e.updated_at > $2 OR e.deleted_at > $2)`, [uid, since]),
      fastify.pg.query(`SELECT * FROM user_parcelles WHERE user_id=$1 AND (updated_at > $2 OR deleted_at > $2)`, [uid, since]),
      fastify.pg.query(`SELECT * FROM user_stocks WHERE user_id=$1 AND (updated_at > $2 OR deleted_at > $2)`, [uid, since]),
      fastify.pg.query(`SELECT * FROM user_economic_entries WHERE user_id=$1 AND (updated_at > $2 OR deleted_at > $2)`, [uid, since]),
      fastify.pg.query(`SELECT * FROM user_lots WHERE user_id=$1 AND (updated_at > $2 OR deleted_at > $2)`, [uid, since]),
      fastify.pg.query(`SELECT lp.* FROM user_lot_plants lp JOIN user_lots l ON l.id=lp.lot_id WHERE l.user_id=$1`, [uid]),
      fastify.pg.query(`SELECT * FROM user_boutures WHERE user_id=$1 AND (updated_at > $2 OR deleted_at > $2)`, [uid, since]),
      fastify.pg.query(`SELECT * FROM user_phyto_register WHERE user_id=$1 AND (updated_at > $2 OR deleted_at > $2)`, [uid, since]),
      fastify.pg.query(`SELECT * FROM user_settings WHERE user_id=$1 AND updated_at > $2`, [uid, since]),
      fastify.pg.query(`SELECT * FROM user_sortis WHERE user_id=$1 AND updated_at > $2`, [uid, since]),
      fastify.pg.query(`SELECT * FROM user_lumiere WHERE user_id=$1 AND updated_at > $2`, [uid, since])
    ])

    return {
      server_time: new Date().toISOString(),
      plants: plants.rows,
      events: events.rows,
      parcelles: parcelles.rows,
      stocks: stocks.rows,
      economic: eco.rows,
      lots: lots.rows,
      lot_plants: lotPlants.rows,
      boutures: boutures.rows,
      phyto: phyto.rows,
      settings: settings.rows[0] || null,
      sortis: sortis.rows,
      lumiere: lumiere.rows
    }
  })

  // ── POST /api/user/sync/bulk-import ──────────────────────────────
  fastify.post('/api/user/sync/bulk-import', auth, async (req, reply) => {
    const {
      plants = [], events = [], parcelles = [], stocks = [],
      economic = [], lots = [], lot_plants = [], boutures = [],
      devis = [], devis_lignes = [], phyto = [],
      sortis = [], lumiere = [],
      settings = null,
      strategy = 'skip_existing'
    } = req.body

    const client = await fastify.pg.connect()
    try {
      await client.query('BEGIN')
      const stats = {
        plants: 0, events: 0, parcelles: 0, stocks: 0, economic: 0,
        lots: 0, lot_plants: 0, boutures: 0, devis: 0,
        phyto: 0, sortis: 0, lumiere: 0,
        conflicts: []
      }

      for (const p of plants) {
        const clientId = p.id || p.client_id || null
        if (strategy === 'skip_existing' && clientId) {
          const exists = await client.query(
            `SELECT id FROM user_plants WHERE user_id=$1 AND client_id=$2 LIMIT 1`,
            [req.user.id, clientId])
          if (exists.rowCount) {
            stats.conflicts.push({ entity: 'plant', client_id: clientId, reason: 'exists' })
            continue
          }
        }
        const sname = (p.scientific_name || p.name || '').trim()
        if (!sname) continue
        await client.query(
          `INSERT INTO user_plants
           (user_id, scientific_name, common_name, variety, rootstock,
            acquisition_date, notes, client_id, metadata, photo_urls)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           ON CONFLICT (user_id, client_id) WHERE client_id IS NOT NULL DO NOTHING`,
          [req.user.id, sname, p.common_name || null, p.variety || null, p.rootstock || null,
           p.acquisition_date || p.dateAcquisition || null, p.notes || null, clientId,
           JSON.stringify(p.metadata || {}), JSON.stringify(p.photos || p.photo_urls || [])])
        stats.plants++
      }

      for (const ev of events) {
        const clientId = ev.id || ev.client_id || null
        if (strategy === 'skip_existing' && clientId) {
          const exists = await client.query(
            `SELECT id FROM user_events WHERE user_id=$1 AND client_id=$2 LIMIT 1`,
            [req.user.id, clientId])
          if (exists.rowCount) {
            stats.conflicts.push({ entity: 'event', client_id: clientId, reason: 'exists' })
            continue
          }
        }
        if (!ev.event_type || !ev.event_date) continue
        await client.query(
          `INSERT INTO user_events (user_id, event_type, event_date, notes, metadata, client_id)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (user_id, client_id) WHERE client_id IS NOT NULL DO NOTHING`,
          [req.user.id, ev.event_type, ev.event_date, ev.notes || null,
           JSON.stringify(ev.metadata || {}), clientId])
        stats.events++
      }

      for (const p of parcelles) {
        const clientId = p.id || p.client_id || null
        if (!p.name) continue
        await client.query(
          `INSERT INTO user_parcelles (user_id, name, surface_ha, densite_arbres, geojson, notes, client_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT (user_id, client_id) WHERE client_id IS NOT NULL DO NOTHING`,
          [req.user.id, p.name, p.surface_ha || null, p.densite_arbres || null,
           p.geojson ? JSON.stringify(p.geojson) : null, p.notes || null, clientId])
        stats.parcelles++
      }

      for (const s of stocks) {
        const clientId = s.id || s.client_id || null
        if (!s.product_name || !s.product_type || !s.unit) continue
        await client.query(
          `INSERT INTO user_stocks (user_id, product_name, product_type, unit, current_qty, alert_qty, metadata, client_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           ON CONFLICT (user_id, client_id) WHERE client_id IS NOT NULL DO NOTHING`,
          [req.user.id, s.product_name, s.product_type, s.unit,
           s.current_qty || 0, s.alert_qty || null, JSON.stringify(s.metadata || {}), clientId])
        stats.stocks++
      }

      for (const l of lots) {
        const clientId = l.id || l.client_id || null
        if (!l.lot_number || !l.lot_date) continue
        await client.query(
          `INSERT INTO user_lots (user_id, lot_number, lot_date, total_kg, price_per_kg_cents, certification, operator_name, notes, client_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT (user_id, client_id) WHERE client_id IS NOT NULL DO NOTHING`,
          [req.user.id, l.lot_number, l.lot_date, l.total_kg || null,
           l.price_per_kg_cents || null, l.certification || null,
           l.operator_name || null, l.notes || null, clientId])
        stats.lots++
      }

      for (const lp of lot_plants) {
        if (!lp.lot_id || !lp.plant_id) continue
        await client.query(
          `INSERT INTO user_lot_plants (lot_id, plant_id) VALUES ($1,$2)
           ON CONFLICT DO NOTHING`,
          [lp.lot_id, lp.plant_id])
        stats.lot_plants++
      }

      for (const b of boutures) {
        const clientId = b.id || b.client_id || null
        if (!b.date_prise || !b.nb_boutures) continue
        await client.query(
          `INSERT INTO user_boutures (user_id, parent_plant_id, date_prise, nb_boutures, substrat, success_rate, notes, client_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           ON CONFLICT (user_id, client_id) WHERE client_id IS NOT NULL DO NOTHING`,
          [req.user.id, b.parent_plant_id || null, b.date_prise, b.nb_boutures,
           b.substrat || null, b.success_rate || null, b.notes || null, clientId])
        stats.boutures++
      }

      for (const d of devis) {
        const clientId = d.id || d.client_id || null
        if (!d.client_name || !d.client_type || !d.date_emission) continue
        await client.query(
          `INSERT INTO user_devis (user_id, client_name, client_type, client_email, date_emission, tva_rate, status, notes, client_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT (user_id, client_id) WHERE client_id IS NOT NULL DO NOTHING`,
          [req.user.id, d.client_name, d.client_type, d.client_email || null,
           d.date_emission, d.tva_rate || 20.0, d.status || 'draft', d.notes || null, clientId])
        stats.devis++
      }

      for (const ph of phyto) {
        const clientId = ph.id || ph.client_id || null
        if (!ph.treatment_date || !ph.product_name) continue
        await client.query(
          `INSERT INTO user_phyto_register
           (user_id, treatment_date, parcelle_id, plant_ids, product_name, amm_number,
            active_ingredient, dose_value, dose_unit, dar_days, operator_name, cert_certiphyto, notes, client_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
           ON CONFLICT (user_id, client_id) WHERE client_id IS NOT NULL DO NOTHING`,
          [req.user.id, ph.treatment_date, ph.parcelle_id || null,
           JSON.stringify(ph.plant_ids || []), ph.product_name,
           ph.amm_number || null, ph.active_ingredient || null,
           ph.dose_value || null, ph.dose_unit || null, ph.dar_days || null,
           ph.operator_name || null, ph.cert_certiphyto || null, ph.notes || null, clientId])
        stats.phyto++
      }

      for (const so of sortis) {
        if (!so.plant_id || !so.date_sortie) continue
        await client.query(
          `INSERT INTO user_sortis (user_id, plant_id, date_sortie, date_rentree)
           VALUES ($1,$2,$3,$4)`,
          [req.user.id, so.plant_id, so.date_sortie, so.date_rentree || null])
        stats.sortis++
      }

      for (const lu of lumiere) {
        if (!lu.plant_id) continue
        await client.query(
          `INSERT INTO user_lumiere (user_id, plant_id, lamp_type, hours_per_day, intensity_umol)
           VALUES ($1,$2,$3,$4,$5)`,
          [req.user.id, lu.plant_id, lu.lamp_type || null,
           lu.hours_per_day || null, lu.intensity_umol || null])
        stats.lumiere++
      }

      if (settings) {
        await client.query(
          `INSERT INTO user_settings(user_id, language, theme, notif_gel, notif_calendrier, notif_bbch, readonly_mode, profile_json)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8)
           ON CONFLICT (user_id) DO UPDATE SET
             language=EXCLUDED.language, profile_json=EXCLUDED.profile_json`,
          [req.user.id, settings.language || 'fr', settings.theme || 'light',
           settings.notif_gel !== false, settings.notif_calendrier !== false,
           settings.notif_bbch !== false, settings.readonly_mode === true,
           JSON.stringify(settings.profile_json || {})])
      }

      await client.query('COMMIT')
      return { ok: true, stats }
    } catch (err) {
      await client.query('ROLLBACK')
      fastify.log.error(err)
      return reply.code(500).send({ error: 'Bulk import failed', message: err.message })
    } finally {
      client.release()
    }
  })

  // ── GET /api/user/export (RGPD complet) ──────────────────────────
  fastify.get('/api/user/export', auth, async (req, reply) => {
    const uid = req.user.id
    const [user, plants, events, parcelles, stocks, stockMov, eco, lots, lotPlants,
           boutures, phyto, settings, sortis, lumiere] = await Promise.all([
      fastify.pg.query(`SELECT id, email, role, profile_type, created_at, last_login FROM users WHERE id=$1`, [uid]),
      fastify.pg.query(`SELECT * FROM user_plants WHERE user_id=$1`, [uid]),
      fastify.pg.query(`SELECT * FROM user_events WHERE user_id=$1`, [uid]),
      fastify.pg.query(`SELECT * FROM user_parcelles WHERE user_id=$1`, [uid]),
      fastify.pg.query(`SELECT * FROM user_stocks WHERE user_id=$1`, [uid]),
      fastify.pg.query(`SELECT m.* FROM user_stock_movements m JOIN user_stocks s ON s.id=m.stock_id WHERE s.user_id=$1`, [uid]),
      fastify.pg.query(`SELECT * FROM user_economic_entries WHERE user_id=$1`, [uid]),
      fastify.pg.query(`SELECT * FROM user_lots WHERE user_id=$1`, [uid]),
      fastify.pg.query(`SELECT lp.* FROM user_lot_plants lp JOIN user_lots l ON l.id=lp.lot_id WHERE l.user_id=$1`, [uid]),
      fastify.pg.query(`SELECT * FROM user_boutures WHERE user_id=$1`, [uid]),
      fastify.pg.query(`SELECT * FROM user_phyto_register WHERE user_id=$1`, [uid]),
      fastify.pg.query(`SELECT * FROM user_settings WHERE user_id=$1`, [uid]),
      fastify.pg.query(`SELECT * FROM user_sortis WHERE user_id=$1`, [uid]),
      fastify.pg.query(`SELECT * FROM user_lumiere WHERE user_id=$1`, [uid])
    ])

    const data = {
      export_date: new Date().toISOString(),
      export_version: '2.0',
      rgpd_basis: 'Article 20 RGPD — Droit à la portabilité',
      user: user.rows[0],
      plants: plants.rows,
      events: events.rows,
      parcelles: parcelles.rows,
      stocks: stocks.rows,
      stock_movements: stockMov.rows,
      economic_entries: eco.rows,
      lots: lots.rows,
      lot_plants: lotPlants.rows,
      boutures: boutures.rows,
      phyto_register: phyto.rows,
      settings: settings.rows[0] || null,
      sortis: sortis.rows,
      lumiere: lumiere.rows
    }

    reply.header('Content-Type', 'application/json')
    reply.header('Content-Disposition', `attachment; filename="citruscodex_export_${uid}_${new Date().toISOString().slice(0,10)}.json"`)
    return data
  })
}
