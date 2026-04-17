# CLAUDE CODE — PHASE 0A — Sync serveur normalisée

## Contexte

Lire `CLAUDE.md` avant toute action.

Migration complète du stockage localStorage client vers PostgreSQL serveur, architecture normalisée. Objectif : un utilisateur se connecte depuis n'importe quel appareil et retrouve sa collection intacte, son profileType verrouillé côté serveur, ses événements synchronisés.

**Prérequis bloquant** : déploiement Vite commit `18a539c` fonctionnel sur citruscodex.fr. Vérifier login OK avant de commencer.

**Règle impérative** : test réel multi-appareils obligatoire. `npm run build` ne suffit pas.

## Zones protégées — NE PAS TOUCHER

PDF engine, AES-GCM sync (devient optionnelle, contenu inchangé), `sumAppliedNPK`, Firebase legacy, `barcode-scanner.js`, ServiceWorker, phytosanitary pipeline.

## Contraintes

- `addEventListener` exclusivement — zéro `onclick` inline nouveau
- `esc()` sur tout innerHTML dynamique
- i18n 5 langues (FR/EN/IT/ES/PT) pour toute nouvelle chaîne UI
- `node --check` après chaque modification JS
- RGPD : données exportables (JSON) et supprimables (cascade)

---

## Plan

1. Migration SQL (17 tables)
2. Plugin `routes/user-data.js` (CRUD)
3. Plugin `routes/user-sync.js` (delta + bulk + export)
4. Plugin `routes/user-account.js` (delete RGPD)
5. Module `src/modules/server-sync.js`
6. Modal migration premier login
7. Indicateur sync topbar
8. Adaptation stores (12 fichiers)
9. Déprécation AES-GCM (UI only)
10. Tests Playwright + manuels

Gate `node --check` + `npm run build` + test entre chaque étape.

---

## ÉTAPE 1 — Migration SQL

### Fichier

`server/migrations/002_user_data_normalized.sql`

### Contenu

```sql
BEGIN;

-- Helper trigger function (idempotent)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- ─── user_plants ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cca_number VARCHAR(20),
  scientific_name TEXT NOT NULL,
  common_name TEXT,
  variety TEXT,
  rootstock TEXT,
  acquisition_date DATE,
  date_precision VARCHAR(10) DEFAULT 'full' CHECK (date_precision IN ('full','month','year','unknown')),
  provenance_type VARCHAR(20) DEFAULT 'inconnu',
  provenance_mode VARCHAR(20) DEFAULT 'inconnu',
  production_type VARCHAR(20) DEFAULT 'inconnu',
  provenance_detail TEXT,
  emplacement_zone TEXT,
  emplacement_section TEXT,
  emplacement_position TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  photo_urls JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  client_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_user_plants_user_id ON user_plants(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_plants_updated_at ON user_plants(updated_at);
CREATE UNIQUE INDEX idx_user_plants_cca_number ON user_plants(user_id, cca_number) 
  WHERE cca_number IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX idx_user_plants_client_id ON user_plants(user_id, client_id) WHERE client_id IS NOT NULL;
CREATE TRIGGER trg_user_plants_updated_at BEFORE UPDATE ON user_plants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── user_events ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plant_id UUID REFERENCES user_plants(id) ON DELETE CASCADE,
  event_type VARCHAR(30) NOT NULL,
  event_date DATE NOT NULL,
  date_precision VARCHAR(10) DEFAULT 'full',
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  client_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_user_events_user_plant ON user_events(user_id, plant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_events_date ON user_events(event_date);
CREATE INDEX idx_user_events_updated ON user_events(updated_at);
CREATE INDEX idx_user_events_type ON user_events(event_type);
CREATE UNIQUE INDEX idx_user_events_client_id ON user_events(user_id, client_id) WHERE client_id IS NOT NULL;
CREATE TRIGGER trg_user_events_updated_at BEFORE UPDATE ON user_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── user_fertilizations ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_fertilizations (
  event_id UUID PRIMARY KEY REFERENCES user_events(id) ON DELETE CASCADE,
  product_name TEXT,
  weight_g NUMERIC(10,2),
  npk_n NUMERIC(5,2),
  npk_p NUMERIC(5,2),
  npk_k NUMERIC(5,2),
  mgo NUMERIC(5,2),
  oligos JSONB DEFAULT '{}'::jsonb,
  stock_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── user_harvests ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_harvests (
  event_id UUID PRIMARY KEY REFERENCES user_events(id) ON DELETE CASCADE,
  weight_kg NUMERIC(10,3),
  brix NUMERIC(5,2),
  buyer TEXT,
  price_per_kg_cents INTEGER,
  lot_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── user_graftings ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_graftings (
  event_id UUID PRIMARY KEY REFERENCES user_events(id) ON DELETE CASCADE,
  scion_variety TEXT,
  rootstock_plant_id UUID REFERENCES user_plants(id) ON DELETE SET NULL,
  graft_type VARCHAR(30),
  success_at TIMESTAMPTZ,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── user_parcelles ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_parcelles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  surface_ha NUMERIC(8,3),
  densite_arbres INTEGER,
  geojson JSONB,
  notes TEXT,
  client_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_user_parcelles_user ON user_parcelles(user_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_user_parcelles_client_id ON user_parcelles(user_id, client_id) WHERE client_id IS NOT NULL;
CREATE TRIGGER trg_user_parcelles_updated_at BEFORE UPDATE ON user_parcelles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── user_stocks ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_type VARCHAR(20) NOT NULL CHECK (product_type IN ('fert','amend','phyto')),
  unit VARCHAR(10) NOT NULL,
  current_qty NUMERIC(12,3) DEFAULT 0,
  alert_qty NUMERIC(12,3),
  metadata JSONB DEFAULT '{}'::jsonb,
  client_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_user_stocks_user ON user_stocks(user_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_user_stocks_client_id ON user_stocks(user_id, client_id) WHERE client_id IS NOT NULL;
CREATE TRIGGER trg_user_stocks_updated_at BEFORE UPDATE ON user_stocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS user_stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID NOT NULL REFERENCES user_stocks(id) ON DELETE CASCADE,
  movement_date DATE NOT NULL,
  qty NUMERIC(12,3) NOT NULL,
  direction VARCHAR(3) NOT NULL CHECK (direction IN ('in','out')),
  event_id UUID REFERENCES user_events(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_user_stock_movements_stock ON user_stock_movements(stock_id);

-- ─── user_economic_entries ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_economic_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  plant_id UUID REFERENCES user_plants(id) ON DELETE SET NULL,
  parcelle_id UUID REFERENCES user_parcelles(id) ON DELETE SET NULL,
  entry_type VARCHAR(10) NOT NULL CHECK (entry_type IN ('cost','revenue')),
  category VARCHAR(20) NOT NULL,
  amount_cents INTEGER NOT NULL,
  qty NUMERIC(10,3),
  unit VARCHAR(10),
  note TEXT,
  event_id UUID REFERENCES user_events(id) ON DELETE SET NULL,
  client_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_user_eco_user ON user_economic_entries(user_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_user_eco_client_id ON user_economic_entries(user_id, client_id) WHERE client_id IS NOT NULL;
CREATE TRIGGER trg_user_eco_updated_at BEFORE UPDATE ON user_economic_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── user_lots + user_lot_plants ─────────────────────────────────
CREATE TABLE IF NOT EXISTS user_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lot_number TEXT NOT NULL,
  lot_date DATE NOT NULL,
  total_kg NUMERIC(10,3),
  price_per_kg_cents INTEGER,
  certification VARCHAR(20),
  operator_name TEXT,
  notes TEXT,
  client_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_user_lots_user ON user_lots(user_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_user_lots_client_id ON user_lots(user_id, client_id) WHERE client_id IS NOT NULL;
CREATE TRIGGER trg_user_lots_updated_at BEFORE UPDATE ON user_lots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS user_lot_plants (
  lot_id UUID REFERENCES user_lots(id) ON DELETE CASCADE,
  plant_id UUID REFERENCES user_plants(id) ON DELETE CASCADE,
  PRIMARY KEY (lot_id, plant_id)
);

-- ─── user_boutures ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_boutures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_plant_id UUID REFERENCES user_plants(id) ON DELETE SET NULL,
  date_prise DATE NOT NULL,
  nb_boutures INTEGER NOT NULL,
  substrat TEXT,
  success_rate NUMERIC(5,2),
  notes TEXT,
  client_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_user_boutures_user ON user_boutures(user_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_user_boutures_client_id ON user_boutures(user_id, client_id) WHERE client_id IS NOT NULL;
CREATE TRIGGER trg_user_boutures_updated_at BEFORE UPDATE ON user_boutures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── user_devis + user_devis_lignes ──────────────────────────────
CREATE TABLE IF NOT EXISTS user_devis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_type VARCHAR(20) NOT NULL,
  client_email TEXT,
  date_emission DATE NOT NULL,
  tva_rate NUMERIC(5,2) DEFAULT 20.0,
  status VARCHAR(20) DEFAULT 'draft',
  total_ht_cents INTEGER,
  total_ttc_cents INTEGER,
  notes TEXT,
  client_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_user_devis_user ON user_devis(user_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_user_devis_client_id ON user_devis(user_id, client_id) WHERE client_id IS NOT NULL;
CREATE TRIGGER trg_user_devis_updated_at BEFORE UPDATE ON user_devis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS user_devis_lignes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devis_id UUID NOT NULL REFERENCES user_devis(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  qty NUMERIC(10,3) NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  line_order INTEGER DEFAULT 0
);
CREATE INDEX idx_user_devis_lignes_devis ON user_devis_lignes(devis_id);

-- ─── user_settings ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  language VARCHAR(5) DEFAULT 'fr',
  theme VARCHAR(10) DEFAULT 'light',
  notif_gel BOOLEAN DEFAULT TRUE,
  notif_calendrier BOOLEAN DEFAULT TRUE,
  notif_bbch BOOLEAN DEFAULT TRUE,
  readonly_mode BOOLEAN DEFAULT FALSE,
  profile_json JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── user_sortis ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_sortis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plant_id UUID NOT NULL REFERENCES user_plants(id) ON DELETE CASCADE,
  date_sortie DATE NOT NULL,
  date_rentree DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_user_sortis_user ON user_sortis(user_id);
CREATE TRIGGER trg_user_sortis_updated_at BEFORE UPDATE ON user_sortis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── user_lumiere ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_lumiere (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plant_id UUID NOT NULL REFERENCES user_plants(id) ON DELETE CASCADE,
  lamp_type TEXT,
  hours_per_day NUMERIC(4,1),
  intensity_umol NUMERIC(6,1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_user_lumiere_user ON user_lumiere(user_id);
CREATE TRIGGER trg_user_lumiere_updated_at BEFORE UPDATE ON user_lumiere
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── user_phyto_register ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_phyto_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  treatment_date DATE NOT NULL,
  parcelle_id UUID REFERENCES user_parcelles(id) ON DELETE SET NULL,
  plant_ids JSONB DEFAULT '[]'::jsonb,
  product_name TEXT NOT NULL,
  amm_number TEXT,
  active_ingredient TEXT,
  dose_value NUMERIC(10,3),
  dose_unit VARCHAR(10),
  dar_days INTEGER,
  operator_name TEXT,
  cert_certiphyto TEXT,
  notes TEXT,
  client_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_user_phyto_user ON user_phyto_register(user_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_user_phyto_client_id ON user_phyto_register(user_id, client_id) WHERE client_id IS NOT NULL;
CREATE TRIGGER trg_user_phyto_updated_at BEFORE UPDATE ON user_phyto_register
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO cca;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cca;

COMMIT;
```

### Application

```bash
# Écrire le fichier dans /tmp/ puis appliquer — JAMAIS coller multi-ligne SQL dans bash
scp server/migrations/002_user_data_normalized.sql root@62.210.237.49:/tmp/
ssh root@62.210.237.49 "sudo -u postgres psql -d cca_prod -f /tmp/002_user_data_normalized.sql"
```

### Validation

```bash
ssh root@62.210.237.49 'sudo -u postgres psql -d cca_prod -c "\dt user_*"'
# Doit lister 17 tables user_*
```

---

## ÉTAPE 2 — Plugin `routes/user-data.js`

### Fichier

`server/routes/user-data.js`

### Pattern CRUD uniforme

Pour chaque entité (plants, events, parcelles, stocks, economic, lots, boutures, devis, phyto, sortis, lumiere, settings) :
- `GET /api/user/<entity>` → liste non-supprimés
- `POST /api/user/<entity>` → création, retour 201
- `PUT /api/user/<entity>/:id` → update
- `DELETE /api/user/<entity>/:id` → soft delete (UPDATE deleted_at=NOW())

### Squelette

```javascript
import fp from 'fastify-plugin'

export default fp(async function(fastify) {
  const { pool, authenticate } = fastify
  const requireAuth = { preHandler: [authenticate] }
  
  // Helper sanitize plant
  const sanitizePlant = (b) => ({
    cca_number: b.cca_number || null,
    scientific_name: (b.scientific_name || '').trim(),
    common_name: b.common_name || null,
    variety: b.variety || null,
    rootstock: b.rootstock || null,
    acquisition_date: b.acquisition_date || null,
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
    client_id: b.client_id || null
  })
  
  // ── PLANTS ────────────────────────────────────────────────────
  
  fastify.get('/api/user/plants', requireAuth, async (req) => {
    const r = await pool.query(
      `SELECT * FROM user_plants WHERE user_id=$1 AND deleted_at IS NULL ORDER BY created_at DESC`,
      [req.user.id])
    return r.rows
  })
  
  fastify.post('/api/user/plants', requireAuth, async (req, reply) => {
    const p = sanitizePlant(req.body)
    if (!p.scientific_name) return reply.code(400).send({ error: 'scientific_name required' })
    try {
      const r = await pool.query(
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
  
  fastify.put('/api/user/plants/:id', requireAuth, async (req, reply) => {
    const p = sanitizePlant(req.body)
    const r = await pool.query(
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
  
  fastify.delete('/api/user/plants/:id', requireAuth, async (req, reply) => {
    const r = await pool.query(
      `UPDATE user_plants SET deleted_at=NOW() WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL`,
      [req.params.id, req.user.id])
    if (!r.rowCount) return reply.code(404).send({ error: 'Not found' })
    return { ok: true }
  })
  
  // ── EVENTS (avec jointure sub-tables selon event_type) ────────
  
  fastify.get('/api/user/events', requireAuth, async (req) => {
    const r = await pool.query(
      `SELECT e.*, f.product_name, f.weight_g, f.npk_n, f.npk_p, f.npk_k, f.mgo, f.oligos,
              h.weight_kg, h.brix, h.buyer, h.price_per_kg_cents,
              g.scion_variety, g.rootstock_plant_id, g.graft_type, g.success_at
       FROM user_events e
       LEFT JOIN user_fertilizations f ON f.event_id = e.id
       LEFT JOIN user_harvests h ON h.event_id = e.id
       LEFT JOIN user_graftings g ON g.event_id = e.id
       WHERE e.user_id=$1 AND e.deleted_at IS NULL ORDER BY e.event_date DESC`,
      [req.user.id])
    return r.rows
  })
  
  fastify.post('/api/user/events', requireAuth, async (req, reply) => {
    const b = req.body
    const client = await pool.connect()
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
          `INSERT INTO user_fertilizations 
           (event_id, product_name, weight_g, npk_n, npk_p, npk_k, mgo, oligos, stock_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [eventId, b.fert.product_name, b.fert.weight_g, b.fert.npk_n, b.fert.npk_p, 
           b.fert.npk_k, b.fert.mgo, JSON.stringify(b.fert.oligos || {}), b.fert.stock_id || null])
      }
      if (b.event_type === 'harvest' && b.harvest) {
        await client.query(
          `INSERT INTO user_harvests 
           (event_id, weight_kg, brix, buyer, price_per_kg_cents, lot_id)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [eventId, b.harvest.weight_kg, b.harvest.brix, b.harvest.buyer, 
           b.harvest.price_per_kg_cents, b.harvest.lot_id || null])
      }
      if (b.event_type === 'grafting' && b.graft) {
        await client.query(
          `INSERT INTO user_graftings 
           (event_id, scion_variety, rootstock_plant_id, graft_type, success_at, failure_reason)
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
  
  // PUT / DELETE events : même logique, UPDATE ou soft delete
  
  // ── PARCELLES, STOCKS, ECO, LOTS, BOUTURES, DEVIS, PHYTO, SORTIS, LUMIERE ──
  // Même pattern CRUD. Implémenter pour chaque entité.
  
  // ── SETTINGS (UPSERT) ─────────────────────────────────────────
  
  fastify.get('/api/user/settings', requireAuth, async (req) => {
    const r = await pool.query(`SELECT * FROM user_settings WHERE user_id=$1`, [req.user.id])
    if (!r.rowCount) {
      await pool.query(`INSERT INTO user_settings(user_id) VALUES($1) ON CONFLICT DO NOTHING`, [req.user.id])
      const r2 = await pool.query(`SELECT * FROM user_settings WHERE user_id=$1`, [req.user.id])
      return r2.rows[0]
    }
    return r.rows[0]
  })
  
  fastify.put('/api/user/settings', requireAuth, async (req) => {
    const s = req.body
    await pool.query(
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
  
  // ── PROFILE TYPE (read-only user, write admin only) ──────────
  
  fastify.get('/api/user/profile-type', requireAuth, async (req) => {
    const r = await pool.query(`SELECT profile_type FROM users WHERE id=$1`, [req.user.id])
    return { profile_type: r.rows[0]?.profile_type || 'collectionneur' }
  })
})
```

### Enregistrement dans `server.js`

```javascript
import userDataRoutes from './routes/user-data.js'
fastify.register(userDataRoutes)
```

### Validation

```bash
# Après restart service
curl -H "Authorization: Bearer $TOKEN" https://citruscodex.fr/api/user/plants
# Doit retourner [] (array vide pour nouveau user)

curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"scientific_name":"Citrus limon"}' \
  https://citruscodex.fr/api/user/plants
# Doit retourner 201 + objet plante
```

---

## ÉTAPE 3 — Plugin `routes/user-sync.js`

### Fichier

`server/routes/user-sync.js`

### Endpoints

**GET /api/user/sync/snapshot?since=&lt;ISO_timestamp&gt;**

Retourne toutes les entités modifiées depuis `since`, par type.

```javascript
fastify.get('/api/user/sync/snapshot', requireAuth, async (req) => {
  const since = req.query.since || '1970-01-01T00:00:00Z'
  const uid = req.user.id
  
  const [plants, events, parcelles, stocks, eco, lots, lotPlants, boutures, 
         devis, devisLignes, phyto, settings, sortis, lumiere] = await Promise.all([
    pool.query(`SELECT * FROM user_plants WHERE user_id=$1 AND (updated_at > $2 OR deleted_at > $2)`, [uid, since]),
    pool.query(`SELECT e.*, f.*, h.*, g.* FROM user_events e
                LEFT JOIN user_fertilizations f ON f.event_id=e.id
                LEFT JOIN user_harvests h ON h.event_id=e.id
                LEFT JOIN user_graftings g ON g.event_id=e.id
                WHERE e.user_id=$1 AND (e.updated_at > $2 OR e.deleted_at > $2)`, [uid, since]),
    pool.query(`SELECT * FROM user_parcelles WHERE user_id=$1 AND (updated_at > $2 OR deleted_at > $2)`, [uid, since]),
    pool.query(`SELECT * FROM user_stocks WHERE user_id=$1 AND (updated_at > $2 OR deleted_at > $2)`, [uid, since]),
    pool.query(`SELECT * FROM user_economic_entries WHERE user_id=$1 AND (updated_at > $2 OR deleted_at > $2)`, [uid, since]),
    pool.query(`SELECT * FROM user_lots WHERE user_id=$1 AND (updated_at > $2 OR deleted_at > $2)`, [uid, since]),
    pool.query(`SELECT lp.* FROM user_lot_plants lp JOIN user_lots l ON l.id=lp.lot_id WHERE l.user_id=$1`, [uid]),
    pool.query(`SELECT * FROM user_boutures WHERE user_id=$1 AND (updated_at > $2 OR deleted_at > $2)`, [uid, since]),
    pool.query(`SELECT * FROM user_devis WHERE user_id=$1 AND (updated_at > $2 OR deleted_at > $2)`, [uid, since]),
    pool.query(`SELECT dl.* FROM user_devis_lignes dl JOIN user_devis d ON d.id=dl.devis_id WHERE d.user_id=$1`, [uid]),
    pool.query(`SELECT * FROM user_phyto_register WHERE user_id=$1 AND (updated_at > $2 OR deleted_at > $2)`, [uid, since]),
    pool.query(`SELECT * FROM user_settings WHERE user_id=$1 AND updated_at > $2`, [uid, since]),
    pool.query(`SELECT * FROM user_sortis WHERE user_id=$1 AND updated_at > $2`, [uid, since]),
    pool.query(`SELECT * FROM user_lumiere WHERE user_id=$1 AND updated_at > $2`, [uid, since])
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
    devis: devis.rows,
    devis_lignes: devisLignes.rows,
    phyto: phyto.rows,
    settings: settings.rows[0] || null,
    sortis: sortis.rows,
    lumiere: lumiere.rows
  }
})
```

**POST /api/user/sync/bulk-import**

Pour migration initiale localStorage → serveur.

```javascript
fastify.post('/api/user/sync/bulk-import', requireAuth, async (req, reply) => {
  const { plants = [], events = [], parcelles = [], stocks = [], 
          economic = [], lots = [], boutures = [], devis = [], phyto = [],
          settings = null, sortis = [], lumiere = [],
          strategy = 'skip_existing' } = req.body
  
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const stats = { plants: 0, events: 0, parcelles: 0, stocks: 0, economic: 0, 
                    lots: 0, boutures: 0, devis: 0, phyto: 0, sortis: 0, lumiere: 0,
                    conflicts: [] }
    
    for (const p of plants) {
      if (strategy === 'skip_existing') {
        const exists = await client.query(
          `SELECT id FROM user_plants WHERE user_id=$1 AND client_id=$2 LIMIT 1`,
          [req.user.id, p.id])
        if (exists.rowCount) { 
          stats.conflicts.push({entity:'plant', client_id:p.id, reason:'exists'})
          continue 
        }
      }
      await client.query(
        `INSERT INTO user_plants (user_id, scientific_name, common_name, variety, 
          rootstock, acquisition_date, notes, client_id, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (user_id, client_id) WHERE client_id IS NOT NULL DO NOTHING`,
        [req.user.id, p.scientific_name || p.name || 'Citrus spp.', 
         p.common_name || null, p.variety || null, p.rootstock || null,
         p.acquisition_date || p.dateAcquisition || null, 
         p.notes || null, p.id, JSON.stringify(p.metadata || {})])
      stats.plants++
    }
    
    // Same for events, parcelles, etc. Handle event sub-types (fert/harvest/graft).
    
    if (settings) {
      await client.query(
        `INSERT INTO user_settings(user_id, language, theme, notif_gel, notif_calendrier, 
          notif_bbch, readonly_mode, profile_json)
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
```

**GET /api/user/export** (RGPD)

```javascript
fastify.get('/api/user/export', requireAuth, async (req, reply) => {
  const uid = req.user.id
  const [user, plants, events, parcelles, stocks, stockMov, eco, lots, lotPlants,
         boutures, devis, devisLignes, phyto, settings, sortis, lumiere] = 
    await Promise.all([
      pool.query(`SELECT id, email, role, profile_type, created_at, last_login_at FROM users WHERE id=$1`, [uid]),
      pool.query(`SELECT * FROM user_plants WHERE user_id=$1`, [uid]),
      pool.query(`SELECT * FROM user_events WHERE user_id=$1`, [uid]),
      pool.query(`SELECT * FROM user_parcelles WHERE user_id=$1`, [uid]),
      pool.query(`SELECT * FROM user_stocks WHERE user_id=$1`, [uid]),
      pool.query(`SELECT m.* FROM user_stock_movements m JOIN user_stocks s ON s.id=m.stock_id WHERE s.user_id=$1`, [uid]),
      pool.query(`SELECT * FROM user_economic_entries WHERE user_id=$1`, [uid]),
      pool.query(`SELECT * FROM user_lots WHERE user_id=$1`, [uid]),
      pool.query(`SELECT lp.* FROM user_lot_plants lp JOIN user_lots l ON l.id=lp.lot_id WHERE l.user_id=$1`, [uid]),
      pool.query(`SELECT * FROM user_boutures WHERE user_id=$1`, [uid]),
      pool.query(`SELECT * FROM user_devis WHERE user_id=$1`, [uid]),
      pool.query(`SELECT dl.* FROM user_devis_lignes dl JOIN user_devis d ON d.id=dl.devis_id WHERE d.user_id=$1`, [uid]),
      pool.query(`SELECT * FROM user_phyto_register WHERE user_id=$1`, [uid]),
      pool.query(`SELECT * FROM user_settings WHERE user_id=$1`, [uid]),
      pool.query(`SELECT * FROM user_sortis WHERE user_id=$1`, [uid]),
      pool.query(`SELECT * FROM user_lumiere WHERE user_id=$1`, [uid])
    ])
  
  const data = {
    export_date: new Date().toISOString(),
    export_version: '1.0',
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
    devis: devis.rows,
    devis_lignes: devisLignes.rows,
    phyto_register: phyto.rows,
    settings: settings.rows[0] || null,
    sortis: sortis.rows,
    lumiere: lumiere.rows
  }
  
  reply.header('Content-Type', 'application/json')
  reply.header('Content-Disposition', `attachment; filename="citruscodex_export_${uid}_${Date.now()}.json"`)
  return data
})
```

---

## ÉTAPE 4 — Plugin `routes/user-account.js`

```javascript
import fp from 'fastify-plugin'

export default fp(async function(fastify) {
  const { pool, authenticate } = fastify
  
  fastify.delete('/api/user/account', { preHandler: [authenticate] }, async (req, reply) => {
    const { confirm } = req.body || {}
    const expected = `DELETE_MY_ACCOUNT_${req.user.email}`
    if (confirm !== expected) {
      return reply.code(400).send({ error: 'Confirmation mismatch', expected })
    }
    
    await pool.query(`DELETE FROM users WHERE id=$1`, [req.user.id])  // CASCADE via FK
    await pool.query(
      `INSERT INTO audit_log(actor_id, action, details) VALUES($1, 'ACCOUNT_DELETED', $2)`,
      [req.user.id, JSON.stringify({ email: req.user.email, date: new Date().toISOString() })])
    
    return { ok: true, message: 'Account deleted' }
  })
})
```

---

## ÉTAPE 5 — Module client `src/modules/server-sync.js`

### Architecture

```javascript
import { loadToken } from '../store/auth.js'
// Imports des setters server-side de chaque store
import { setPlantsFromServer } from '../store/plants.js'
import { setEventsFromServer } from '../store/events.js'
// ... etc

const SYNC_INTERVAL_MS = 5 * 60 * 1000
const SYNC_DEBOUNCE_MS = 2000
const LS_LAST_SYNC = 'agrumes_last_synced_at'
const LS_QUEUE = 'agrumes_sync_queue'

let _syncQueue = []
let _lastSyncedAt = null
let _syncIndicator = 'synced'
let _debounceTimer = null
let _intervalTimer = null
let _skipEnqueue = false

// ── Public API ─────────────────────────────────────────────────────

export async function initServerSync() {
  const token = loadToken()
  if (!token) return
  
  _lastSyncedAt = localStorage.getItem(LS_LAST_SYNC)
  _syncQueue = JSON.parse(localStorage.getItem(LS_QUEUE) || '[]')
  
  // Flush queue restante d'une session précédente
  if (_syncQueue.length) {
    _updateIndicator('pending')
    await flushQueue()
  }
  
  // Pull initial
  await pullFromServer()
  
  _intervalTimer = setInterval(() => pullFromServer(), SYNC_INTERVAL_MS)
  
  window.addEventListener('online', () => {
    _updateIndicator('pending')
    flushQueue()
  })
  
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) pullFromServer()
  })
}

export function enqueueChange(entity, action, data) {
  if (_skipEnqueue) return
  _syncQueue.push({ entity, action, data, queued_at: Date.now() })
  _persistQueue()
  _updateIndicator('pending')
  _scheduleFlush()
}

export async function syncNow() {
  await flushQueue()
  await pullFromServer()
}

export function getSyncStatus() {
  return {
    indicator: _syncIndicator,
    queue_length: _syncQueue.length,
    last_synced_at: _lastSyncedAt
  }
}

// ── Internal ───────────────────────────────────────────────────────

function _persistQueue() {
  localStorage.setItem(LS_QUEUE, JSON.stringify(_syncQueue))
}

function _scheduleFlush() {
  clearTimeout(_debounceTimer)
  _debounceTimer = setTimeout(() => flushQueue(), SYNC_DEBOUNCE_MS)
}

async function flushQueue() {
  if (!_syncQueue.length) return
  if (!navigator.onLine) return
  
  _updateIndicator('syncing')
  const snapshot = [..._syncQueue]
  let failures = 0
  
  for (const op of snapshot) {
    try {
      await _sendOp(op)
      _syncQueue.shift()
      _persistQueue()
    } catch (err) {
      console.error('[server-sync] op failed', op, err)
      failures++
      break  // Stop on first failure, retry later
    }
  }
  
  _updateIndicator(failures ? 'error' : (_syncQueue.length ? 'pending' : 'synced'))
}

async function _sendOp(op) {
  const token = loadToken()
  const base = `/api/user/${_entityPath(op.entity)}`
  const authHeaders = { 
    'Content-Type': 'application/json', 
    'Authorization': `Bearer ${token}` 
  }
  
  if (op.action === 'create') {
    const r = await fetch(base, {
      method: 'POST', headers: authHeaders, 
      body: JSON.stringify(op.data)
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  }
  if (op.action === 'update') {
    const r = await fetch(`${base}/${op.data.id}`, {
      method: 'PUT', headers: authHeaders,
      body: JSON.stringify(op.data)
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  }
  if (op.action === 'delete') {
    const r = await fetch(`${base}/${op.data.id}`, {
      method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  }
}

function _entityPath(entity) {
  const map = {
    plant: 'plants', event: 'events', parcelle: 'parcelles',
    stock: 'stocks', eco: 'economic', lot: 'lots',
    bouture: 'boutures', devis: 'devis', phyto: 'phyto',
    sortis: 'sortis', lumiere: 'lumiere', settings: 'settings'
  }
  return map[entity] || entity
}

async function pullFromServer() {
  const token = loadToken()
  if (!token) return
  
  _updateIndicator('syncing')
  
  try {
    const url = _lastSyncedAt 
      ? `/api/user/sync/snapshot?since=${encodeURIComponent(_lastSyncedAt)}`
      : `/api/user/sync/snapshot`
    const r = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` }})
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const data = await r.json()
    
    _skipEnqueue = true  // Prevent push loop during merge
    if (data.plants?.length) setPlantsFromServer(data.plants)
    if (data.events?.length) setEventsFromServer(data.events)
    // ... pour chaque type d'entité
    _skipEnqueue = false
    
    _lastSyncedAt = data.server_time
    localStorage.setItem(LS_LAST_SYNC, _lastSyncedAt)
    
    _updateIndicator(_syncQueue.length ? 'pending' : 'synced')
  } catch (err) {
    console.error('[server-sync] pull failed', err)
    _updateIndicator('error')
    _skipEnqueue = false
  }
}

function _updateIndicator(status) {
  _syncIndicator = status
  window.dispatchEvent(new CustomEvent('cca-sync-status', { 
    detail: { status, queue_length: _syncQueue.length } 
  }))
}

// ── Bulk import (migration initiale) ─────────────────────────────

export async function bulkImportLocalData(strategy = 'skip_existing') {
  const token = loadToken()
  
  // Rassembler toutes les données localStorage existantes
  const plants = JSON.parse(localStorage.getItem('agrumes_plants') || '[]')
  const events = JSON.parse(localStorage.getItem('agrumes_events') || '[]')
  const verger = JSON.parse(localStorage.getItem('agrumes_verger') || '{}')
  const parcelles = verger.parcelles || []
  const stocks = JSON.parse(localStorage.getItem('agrumes_stocks') || '{"items":[]}').items || []
  const ecoData = JSON.parse(localStorage.getItem('agrumes_economic') || '{"entries":[]}')
  const economic = ecoData.entries || []
  const lots = JSON.parse(localStorage.getItem('agrumes_lots') || '[]')
  const boutures = JSON.parse(localStorage.getItem('agrumes_boutures') || '[]')
  const devis = JSON.parse(localStorage.getItem('agrumes_devis') || '[]')
  const phyto = JSON.parse(localStorage.getItem('agrumes_phyto') || '[]')
  const sortis = JSON.parse(localStorage.getItem('agrumes_sortis') || '[]')
  const lumiere = JSON.parse(localStorage.getItem('agrumes_lumiere') || '[]')
  const settings = {
    language: localStorage.getItem('agrumes_lang') || 'fr',
    profile_json: JSON.parse(localStorage.getItem('agrumes_profile') || '{}')
  }
  
  const data = { plants, events, parcelles, stocks, economic, lots, 
                 boutures, devis, phyto, sortis, lumiere, settings, strategy }
  
  const r = await fetch('/api/user/sync/bulk-import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data)
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}
```

### Integration

Dans `src/app.js`, après login réussi :
```javascript
import { initServerSync } from './modules/server-sync.js'
import { showMigrationModalIfNeeded } from './modules/migration-modal.js'

// Après authenticateUser(...)
await showMigrationModalIfNeeded()
await initServerSync()
```

---

## ÉTAPE 6 — Modal migration premier login

### Fichier

`src/modules/migration-modal.js`

### Logique

```javascript
import { loadToken } from '../store/auth.js'
import { bulkImportLocalData } from './server-sync.js'
import { T, esc } from '../lib/util.js'

export async function showMigrationModalIfNeeded() {
  if (localStorage.getItem('agrumes_migrated_to_server') === 'true') return
  
  const plants = JSON.parse(localStorage.getItem('agrumes_plants') || '[]')
  const hasLocal = plants.length > 0
  
  if (!hasLocal) {
    localStorage.setItem('agrumes_migrated_to_server', 'true')
    return
  }
  
  const token = loadToken()
  const r = await fetch('/api/user/plants', { 
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const serverPlants = await r.json()
  
  if (serverPlants.length > 0) {
    // Serveur déjà rempli → conflit
    return await _showConflictModal(plants.length, serverPlants.length)
  }
  
  // Serveur vide → push simple
  return await _showPushModal(plants.length)
}

async function _showPushModal(localCount) {
  return new Promise((resolve) => {
    const modal = document.createElement('div')
    modal.className = 'cca-modal-overlay'
    modal.innerHTML = `
      <div class="cca-modal">
        <h2>${esc(T('sync.migrationTitle'))}</h2>
        <p>${esc(T('sync.migrationIntro', { n: localCount }))}</p>
        <div class="cca-modal-actions">
          <button id="mig-push" class="cca-btn-primary">${esc(T('sync.migrationPush'))}</button>
          <button id="mig-skip" class="cca-btn-secondary">${esc(T('sync.migrationLater'))}</button>
        </div>
      </div>`
    document.body.appendChild(modal)
    
    modal.querySelector('#mig-push').addEventListener('click', async () => {
      modal.querySelector('.cca-modal').innerHTML = `<p>${esc(T('sync.migrating'))}</p>`
      try {
        const stats = await bulkImportLocalData('skip_existing')
        localStorage.setItem('agrumes_migrated_to_server', 'true')
        modal.querySelector('.cca-modal').innerHTML = `
          <h2>✅ ${esc(T('sync.migrationSuccess', { n: stats.stats.plants, e: stats.stats.events }))}</h2>
          <button id="mig-close" class="cca-btn-primary">${esc(T('common.close'))}</button>`
        modal.querySelector('#mig-close').addEventListener('click', () => {
          document.body.removeChild(modal)
          resolve()
        })
      } catch (err) {
        modal.querySelector('.cca-modal').innerHTML = `
          <h2>❌ ${esc(T('sync.migrationFailed'))}</h2>
          <p>${esc(err.message)}</p>
          <button id="mig-close" class="cca-btn-primary">${esc(T('common.close'))}</button>`
        modal.querySelector('#mig-close').addEventListener('click', () => {
          document.body.removeChild(modal)
          resolve()
        })
      }
    })
    
    modal.querySelector('#mig-skip').addEventListener('click', () => {
      document.body.removeChild(modal)
      resolve()
    })
  })
}

async function _showConflictModal(localCount, serverCount) {
  // 3 choix : cet appareil écrase serveur / serveur écrase cet appareil / merge
  // Implémentation similaire à _showPushModal
}
```

---

## ÉTAPE 7 — Indicateur sync topbar

### Modification

Identifier le fichier topbar et ajouter :

```html
<button class="cca-sync-btn" id="sync-btn" title="État de la synchronisation">
  <span class="cca-sync-dot" data-status="synced"></span>
  <span class="cca-sync-label">Synchronisé</span>
</button>
```

### CSS

```css
.cca-sync-btn { display:inline-flex; align-items:center; gap:6px; background:none; border:none; cursor:pointer; padding:4px 8px; font-size:12px; }
.cca-sync-dot { display:inline-block; width:8px; height:8px; border-radius:50%; background:#4caf50; }
.cca-sync-dot[data-status="synced"] { background:#4caf50; }
.cca-sync-dot[data-status="pending"] { background:#ff9800; animation: cca-pulse 1.5s infinite; }
.cca-sync-dot[data-status="syncing"] { background:#2196f3; animation: cca-spin 1s linear infinite; }
.cca-sync-dot[data-status="error"] { background:#f44336; }
@keyframes cca-pulse { 0%,100% {opacity:1} 50% {opacity:.3} }
@keyframes cca-spin { from {transform:rotate(0)} to {transform:rotate(360deg)} }
```

### Listener

```javascript
import { syncNow } from './server-sync.js'
import { T } from '../lib/util.js'

window.addEventListener('cca-sync-status', (e) => {
  const dot = document.querySelector('.cca-sync-dot')
  const label = document.querySelector('.cca-sync-label')
  if (!dot || !label) return
  dot.setAttribute('data-status', e.detail.status)
  label.textContent = {
    synced: T('sync.status.synced'),
    pending: T('sync.status.pending', { n: e.detail.queue_length }),
    syncing: T('sync.status.syncing'),
    error: T('sync.status.error')
  }[e.detail.status] || ''
})

document.getElementById('sync-btn')?.addEventListener('click', () => syncNow())
```

### i18n 5 langues

```javascript
// fr.js
sync: {
  status: {
    synced: 'Synchronisé',
    pending: '{n} en attente',
    syncing: 'Synchronisation…',
    error: 'Erreur de sync'
  },
  forceNow: 'Forcer la synchronisation',
  manualBackup: 'Sauvegarde manuelle (AES-GCM)',
  migrationTitle: 'Migration de vos données',
  migrationIntro: 'Vos données locales ({n} sujets) vont être sauvegardées sur le serveur pour être accessibles depuis tous vos appareils.',
  migrationPush: 'Envoyer vers le serveur',
  migrationLater: 'Plus tard',
  migrationPull: 'Récupérer depuis le serveur',
  migrationMerge: 'Fusionner les deux',
  migrating: 'Migration en cours…',
  migrationSuccess: 'Migration réussie : {n} sujets, {e} événements',
  migrationFailed: 'Échec de la migration',
  migrationConflict: 'Conflit détecté',
  migrationConflictIntro: 'Vous avez {local} sujets en local et {server} sujets sur le serveur. Que voulez-vous faire ?'
}
```

Produire les équivalents EN / IT / ES / PT avec traduction fidèle.

---

## ÉTAPE 8 — Adaptation stores existants

### Stores concernés

`src/store/plants.js`, `events.js`, `parcelles.js`, `stocks.js`, `economic.js`, `lots.js`, `boutures.js`, `devis.js`, `phyto.js`, `settings.js`, `sortis.js`, `lumiere.js`

### Pattern à appliquer sur chaque store

**1. Ajouter setter server-side**

```javascript
import { enqueueChange } from '../modules/server-sync.js'

export function setPlantsFromServer(list) {
  // Remplace sans déclencher enqueueChange (géré par _skipEnqueue côté sync)
  plants.length = 0
  plants.push(...list)
  _savePlants()
}
```

**2. Wrapper chaque mutation**

```javascript
// Avant
export function addPlant(p) {
  plants.push(p)
  _savePlants()
}

// Après
export function addPlant(p) {
  plants.push(p)
  _savePlants()
  enqueueChange('plant', 'create', p)
}

export function updatePlant(id, changes) {
  const idx = plants.findIndex(p => p.id === id)
  if (idx < 0) return
  plants[idx] = { ...plants[idx], ...changes }
  _savePlants()
  enqueueChange('plant', 'update', plants[idx])
}

export function removePlant(id) {
  const idx = plants.findIndex(p => p.id === id)
  if (idx < 0) return
  plants.splice(idx, 1)
  _savePlants()
  enqueueChange('plant', 'delete', { id })
}
```

`node --check` après chaque store modifié. `npm run build` avant de passer au suivant.

---

## ÉTAPE 9 — Déprécation AES-GCM

### Action UI uniquement

Dans les Réglages :
- L'onglet Sync actuel est renommé : **"🔐 Sauvegarde manuelle (avancé)"**
- Le contenu reste identique (AES-GCM + Gist/WebDAV) mais est précédé d'un disclaimer :

```html
<div class="cca-info-box">
  <p>${T('sync.manualBackupIntro')}</p>
</div>
```

i18n FR :
> *Cette fonction est désormais optionnelle. Vos données sont sauvegardées automatiquement sur le serveur CitrusCodex. Cette option chiffrée reste disponible pour une sauvegarde personnelle indépendante du serveur (export chiffré vers GitHub Gist ou WebDAV).*

Aucune modification du code AES-GCM. Aucune suppression.

---

## ÉTAPE 10 — Tests

### Tests Playwright

`tests/phase0a-sync.spec.js`

```javascript
const { test, expect } = require('@playwright/test')

test.describe('Phase 0A — Sync serveur', () => {
  
  test('T1 sync cross-device (device A → device B)', async ({ browser }) => {
    const ctxA = await browser.newContext()
    const pageA = await ctxA.newPage()
    await pageA.goto('http://localhost:5173')
    await _login(pageA, 'testsync1@citruscodex.fr', 'TestSync1234!')
    await _addPlant(pageA, 'Citrus limon Cross Device A')
    await pageA.waitForTimeout(4000)
    await expect(pageA.locator('.cca-sync-dot[data-status="synced"]')).toBeVisible({ timeout: 10000 })
    
    const ctxB = await browser.newContext()
    const pageB = await ctxB.newPage()
    await pageB.goto('http://localhost:5173')
    await _login(pageB, 'testsync1@citruscodex.fr', 'TestSync1234!')
    await pageB.waitForTimeout(3000)
    await expect(pageB.locator('text=Citrus limon Cross Device A')).toBeVisible({ timeout: 10000 })
  })
  
  test('T2 offline mutation + online flush', async ({ page, context }) => {
    await page.goto('http://localhost:5173')
    await _login(page, 'testsync2@citruscodex.fr', 'TestSync1234!')
    
    await context.setOffline(true)
    await _addPlant(page, 'Offline Citrus')
    await expect(page.locator('.cca-sync-dot[data-status="pending"]')).toBeVisible()
    
    await context.setOffline(false)
    await page.waitForTimeout(4000)
    await expect(page.locator('.cca-sync-dot[data-status="synced"]')).toBeVisible({ timeout: 10000 })
  })
  
  test('T3 profileType lecture seule côté user', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await _login(page, 'testsync3@citruscodex.fr', 'TestSync1234!')
    await page.click('text=Profil')
    const field = page.locator('[name="profileType"], select[data-profile-type]').first()
    const isReadonly = await field.evaluate(el => el.disabled || el.readOnly || el.hasAttribute('readonly'))
    expect(isReadonly).toBeTruthy()
  })
  
  test('T4 export RGPD JSON', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await _login(page, 'testsync4@citruscodex.fr', 'TestSync1234!')
    await _addPlant(page, 'Export Test Plant')
    await page.waitForTimeout(3000)
    
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('text=Exporter mes données')
    ])
    
    const path = await download.path()
    const fs = require('fs')
    const content = JSON.parse(fs.readFileSync(path, 'utf8'))
    expect(content.user).toBeTruthy()
    expect(content.plants.some(p => p.scientific_name === 'Export Test Plant')).toBeTruthy()
  })
  
  test('T5 migration modal premier login', async ({ page }) => {
    await page.goto('http://localhost:5173')
    // Pré-remplir localStorage avec des plantes
    await page.evaluate(() => {
      localStorage.setItem('agrumes_plants', JSON.stringify([
        { id: 'local-1', scientific_name: 'Local Plant Pre-Migration', acquisition_date: '2024-01-01' }
      ]))
      localStorage.removeItem('agrumes_migrated_to_server')
    })
    await _login(page, 'testsync5@citruscodex.fr', 'TestSync1234!')
    
    await expect(page.locator('text=Migration de vos données')).toBeVisible({ timeout: 10000 })
    await page.click('text=Envoyer vers le serveur')
    await expect(page.locator('text=Migration réussie')).toBeVisible({ timeout: 15000 })
  })
})

async function _login(page, email, password) {
  await page.fill('[name="email"]', email)
  await page.fill('[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForSelector('[data-view="dashboard"], .dashboard, #dashboard', { timeout: 15000 })
}

async function _addPlant(page, name) {
  await page.click('text=Ajouter')
  await page.waitForTimeout(500)
  await page.fill('[name="scientific_name"]', name)
  await page.click('button:has-text("Enregistrer"), button:has-text("Valider")')
  await page.waitForTimeout(1000)
}
```

### Exécution

Prérequis : 5 comptes test en DB (`testsync1..5@citruscodex.fr`, même mot de passe `TestSync1234!`).

```bash
npx playwright test tests/phase0a-sync.spec.js
# 5 passed attendus
```

### Tests manuels obligatoires

1. Inscription nouveau compte → ajout 3 plantes → déconnexion → reconnexion autre navigateur → 3 plantes visibles
2. Smartphone réel : ajout plante → PC : refresh → plante visible en &lt;10s
3. profileType non modifiable dans UI user, modifiable uniquement admin (Phase 1)
4. Export JSON → fichier contient bien toutes les entités
5. Offline → ajout → pending → online → synced (durée &lt;5s)
6. Delete account test → vérification cascade DB

---

## Livrables

- `server/migrations/002_user_data_normalized.sql`
- `server/routes/user-data.js`
- `server/routes/user-sync.js`
- `server/routes/user-account.js`
- `server/server.js` (modifié : register plugins)
- `src/modules/server-sync.js`
- `src/modules/migration-modal.js`
- `src/modules/topbar.js` (modifié : indicateur)
- `src/app.js` (modifié : init + modal)
- 12 stores `src/store/*.js` modifiés
- 5 fichiers i18n `src/i18n/*.js` (bloc `sync.*`)
- `tests/phase0a-sync.spec.js`

## Critères de réussite

- [ ] 17 tables `user_*` existent en DB
- [ ] `curl /api/user/plants` retourne 200
- [ ] 5/5 tests Playwright passent
- [ ] Test smartphone↔PC : sync &lt;10s
- [ ] profileType non-éditable user
- [ ] Indicateur topbar visible et fonctionnel
- [ ] Export JSON RGPD complet et téléchargeable
- [ ] AES-GCM relégué à "Sauvegarde manuelle avancée"
- [ ] `node --check` OK sur tous fichiers JS
- [ ] `npm run build` OK
- [ ] Aucune erreur console

Ne pas livrer tant que tous les critères ne sont pas cochés.

## Livraison

ZIP final : `cca_phase_0a_sync.zip` à la racine du projet.
