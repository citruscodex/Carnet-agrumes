BEGIN;

-- Helper trigger function (idempotent)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- ─── user_plants ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_user_plants_user_id ON user_plants(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_plants_updated_at ON user_plants(updated_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_plants_cca_number ON user_plants(user_id, cca_number)
  WHERE cca_number IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_plants_client_id ON user_plants(user_id, client_id) WHERE client_id IS NOT NULL;
DROP TRIGGER IF EXISTS trg_user_plants_updated_at ON user_plants;
CREATE TRIGGER trg_user_plants_updated_at BEFORE UPDATE ON user_plants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── user_events ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_user_events_user_plant ON user_events(user_id, plant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_events_date ON user_events(event_date);
CREATE INDEX IF NOT EXISTS idx_user_events_updated ON user_events(updated_at);
CREATE INDEX IF NOT EXISTS idx_user_events_type ON user_events(event_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_events_client_id ON user_events(user_id, client_id) WHERE client_id IS NOT NULL;
DROP TRIGGER IF EXISTS trg_user_events_updated_at ON user_events;
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
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_user_parcelles_user ON user_parcelles(user_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_parcelles_client_id ON user_parcelles(user_id, client_id) WHERE client_id IS NOT NULL;
DROP TRIGGER IF EXISTS trg_user_parcelles_updated_at ON user_parcelles;
CREATE TRIGGER trg_user_parcelles_updated_at BEFORE UPDATE ON user_parcelles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── user_stocks ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_user_stocks_user ON user_stocks(user_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_stocks_client_id ON user_stocks(user_id, client_id) WHERE client_id IS NOT NULL;
DROP TRIGGER IF EXISTS trg_user_stocks_updated_at ON user_stocks;
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
CREATE INDEX IF NOT EXISTS idx_user_stock_movements_stock ON user_stock_movements(stock_id);

-- ─── user_economic_entries ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_economic_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_user_eco_user ON user_economic_entries(user_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_eco_client_id ON user_economic_entries(user_id, client_id) WHERE client_id IS NOT NULL;
DROP TRIGGER IF EXISTS trg_user_eco_updated_at ON user_economic_entries;
CREATE TRIGGER trg_user_eco_updated_at BEFORE UPDATE ON user_economic_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── user_lots + user_lot_plants ─────────────────────────────────
CREATE TABLE IF NOT EXISTS user_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_user_lots_user ON user_lots(user_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_lots_client_id ON user_lots(user_id, client_id) WHERE client_id IS NOT NULL;
DROP TRIGGER IF EXISTS trg_user_lots_updated_at ON user_lots;
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
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_user_boutures_user ON user_boutures(user_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_boutures_client_id ON user_boutures(user_id, client_id) WHERE client_id IS NOT NULL;
DROP TRIGGER IF EXISTS trg_user_boutures_updated_at ON user_boutures;
CREATE TRIGGER trg_user_boutures_updated_at BEFORE UPDATE ON user_boutures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── user_devis + user_devis_lignes ──────────────────────────────
CREATE TABLE IF NOT EXISTS user_devis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_user_devis_user ON user_devis(user_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_devis_client_id ON user_devis(user_id, client_id) WHERE client_id IS NOT NULL;
DROP TRIGGER IF EXISTS trg_user_devis_updated_at ON user_devis;
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
CREATE INDEX IF NOT EXISTS idx_user_devis_lignes_devis ON user_devis_lignes(devis_id);

-- ─── user_settings ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  language VARCHAR(5) DEFAULT 'fr',
  theme VARCHAR(10) DEFAULT 'light',
  notif_gel BOOLEAN DEFAULT TRUE,
  notif_calendrier BOOLEAN DEFAULT TRUE,
  notif_bbch BOOLEAN DEFAULT TRUE,
  readonly_mode BOOLEAN DEFAULT FALSE,
  profile_json JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_user_settings_updated_at ON user_settings;
CREATE TRIGGER trg_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── user_sortis ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_sortis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plant_id UUID NOT NULL REFERENCES user_plants(id) ON DELETE CASCADE,
  date_sortie DATE NOT NULL,
  date_rentree DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_sortis_user ON user_sortis(user_id);
DROP TRIGGER IF EXISTS trg_user_sortis_updated_at ON user_sortis;
CREATE TRIGGER trg_user_sortis_updated_at BEFORE UPDATE ON user_sortis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── user_lumiere ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_lumiere (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plant_id UUID NOT NULL REFERENCES user_plants(id) ON DELETE CASCADE,
  lamp_type TEXT,
  hours_per_day NUMERIC(4,1),
  intensity_umol NUMERIC(6,1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_lumiere_user ON user_lumiere(user_id);
DROP TRIGGER IF EXISTS trg_user_lumiere_updated_at ON user_lumiere;
CREATE TRIGGER trg_user_lumiere_updated_at BEFORE UPDATE ON user_lumiere
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── user_phyto_register ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_phyto_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_user_phyto_user ON user_phyto_register(user_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_phyto_client_id ON user_phyto_register(user_id, client_id) WHERE client_id IS NOT NULL;
DROP TRIGGER IF EXISTS trg_user_phyto_updated_at ON user_phyto_register;
CREATE TRIGGER trg_user_phyto_updated_at BEFORE UPDATE ON user_phyto_register
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO cca;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cca;

COMMIT;
