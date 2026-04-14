-- ============================================================================
-- CitrusCodex — Phase 1 Schema
-- Backend: Fastify + PostgreSQL (Scaleway DEV1-S)
-- ============================================================================

-- Extension pour UUID et chiffrement
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. USERS ─────────────────────────────────────────────────────────────────

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,                    -- bcrypt hash
  display_name  TEXT NOT NULL DEFAULT '',
  profile_type  TEXT NOT NULL DEFAULT 'collectionneur'
                CHECK (profile_type IN ('collectionneur','pepinieriste','arboriculteur','conservatoire')),
  role          TEXT NOT NULL DEFAULT 'member'
                CHECK (role IN ('member','editor','moderator','admin')),
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_token TEXT,                        -- token envoyé par mail
  verification_expires TIMESTAMPTZ,
  reset_token   TEXT,                             -- reset password token
  reset_expires TIMESTAMPTZ,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,    -- désactivation admin
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login    TIMESTAMPTZ,
  metadata      JSONB DEFAULT '{}'                -- données supplémentaires
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_verification ON users (verification_token) WHERE verification_token IS NOT NULL;
CREATE INDEX idx_users_reset ON users (reset_token) WHERE reset_token IS NOT NULL;

-- ── 2. BETA WHITELIST ────────────────────────────────────────────────────────
-- Seuls les emails présents ici peuvent s'inscrire.
-- L'admin ajoute les emails manuellement.

CREATE TABLE beta_whitelist (
  id          SERIAL PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  invited_by  UUID REFERENCES users(id),
  profile_type TEXT DEFAULT 'collectionneur'
               CHECK (profile_type IN ('collectionneur','pepinieriste','arboriculteur','conservatoire')),
  note        TEXT DEFAULT '',                    -- "Membre du forum, testeur iOS"
  used        BOOLEAN NOT NULL DEFAULT FALSE,     -- true quand l'inscription est faite
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_beta_email ON beta_whitelist (email);

-- ── 3. REFRESH TOKENS ────────────────────────────────────────────────────────

CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,                      -- SHA-256 du refresh token
  device_info TEXT DEFAULT '',                    -- User-Agent résumé
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked     BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_refresh_user ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_hash ON refresh_tokens (token_hash);

-- ── 4. USER DATA SYNC ────────────────────────────────────────────────────────
-- Miroir des clés localStorage côté serveur (last-write-wins).

CREATE TABLE user_data (
  id          SERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_key   TEXT NOT NULL,                      -- ex: 'agrumes_v5', 'agrumes_cfg'
  payload     TEXT,                               -- JSON sérialisé
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, store_key)
);

CREATE INDEX idx_userdata_user ON user_data (user_id);

-- ── 5. FEEDBACK (bêta-testeurs) ──────────────────────────────────────────────

CREATE TABLE feedback (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  category    TEXT NOT NULL DEFAULT 'bug'
              CHECK (category IN ('bug','feature','ux','performance','other')),
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  page        TEXT DEFAULT '',                    -- page/vue où le bug s'est produit
  screenshot  TEXT DEFAULT '',                    -- base64 ou URL
  user_agent  TEXT DEFAULT '',
  app_version TEXT DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'open'
              CHECK (status IN ('open','acknowledged','in_progress','resolved','wontfix')),
  admin_notes TEXT DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_feedback_status ON feedback (status);
CREATE INDEX idx_feedback_user ON feedback (user_id);
CREATE INDEX idx_feedback_created ON feedback (created_at DESC);

-- ── 6. WIKI (existant, enrichi) ──────────────────────────────────────────────

-- Catégories wiki
CREATE TABLE IF NOT EXISTS wiki_categories (
  id          SERIAL PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  label       TEXT NOT NULL,
  icon        TEXT DEFAULT '📄',
  sort_order  INT DEFAULT 0
);

-- Articles wiki avec support notes de bas de page
CREATE TABLE IF NOT EXISTS wiki_articles (
  id          SERIAL PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  category_slug TEXT REFERENCES wiki_categories(slug),
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wiki_slug ON wiki_articles (slug);
CREATE INDEX idx_wiki_cat ON wiki_articles (category_slug);

-- Révisions wiki (historique complet)
CREATE TABLE IF NOT EXISTS wiki_revisions (
  id          SERIAL PRIMARY KEY,
  article_id  INT NOT NULL REFERENCES wiki_articles(id) ON DELETE CASCADE,
  language    TEXT NOT NULL DEFAULT 'fr'
              CHECK (language IN ('fr','en','it','es','pt')),
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,                      -- Markdown avec [[liens]] internes
  footnotes   JSONB DEFAULT '[]',                 -- [{id, text, source_url, source_title}]
  summary     TEXT DEFAULT '',                    -- résumé de la modification
  author_id   UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_current  BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_wiki_rev_article ON wiki_revisions (article_id, language, is_current);

-- Infobox wiki (données structurées par article)
CREATE TABLE IF NOT EXISTS wiki_infoboxes (
  article_id  INT PRIMARY KEY REFERENCES wiki_articles(id) ON DELETE CASCADE,
  data        JSONB NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 7. OBSERVATOIRE ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS observatory_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type   TEXT NOT NULL
               CHECK (event_type IN ('floraison','recolte','gel','maladie','ravageur','autre')),
  species      TEXT DEFAULT '',
  region       TEXT DEFAULT '',
  lat_approx   NUMERIC(7,4),                     -- Précision ~11m, suffisant pour anonymat communal
  lng_approx   NUMERIC(7,4),
  note         TEXT DEFAULT '',
  observed_at  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_anonymous BOOLEAN NOT NULL DEFAULT TRUE       -- masquer l'identité dans l'observatoire
);

CREATE INDEX idx_obs_type ON observatory_events (event_type);
CREATE INDEX idx_obs_date ON observatory_events (observed_at DESC);
CREATE INDEX idx_obs_geo ON observatory_events (lat_approx, lng_approx);
CREATE INDEX idx_obs_user ON observatory_events (user_id);

-- Vue agrégée pour la carte (anonymisée)
CREATE OR REPLACE VIEW observatory_map AS
SELECT
  event_type,
  ROUND(lat_approx, 2) AS lat_approx,    -- Arrondi pour anonymat (~1km)
  ROUND(lng_approx, 2) AS lng_approx,
  region,
  COUNT(*) AS count
FROM observatory_events
GROUP BY event_type, ROUND(lat_approx, 2), ROUND(lng_approx, 2), region;

-- ── 8. AUDIT LOG (actions admin) ─────────────────────────────────────────────

CREATE TABLE audit_log (
  id          SERIAL PRIMARY KEY,
  admin_id    UUID NOT NULL REFERENCES users(id),
  action      TEXT NOT NULL,                      -- 'change_role', 'whitelist_add', etc.
  target_id   UUID,                               -- user_id ciblé
  details     JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_admin ON audit_log (admin_id);
CREATE INDEX idx_audit_created ON audit_log (created_at DESC);

-- ── SEED : Catégories wiki par défaut ────────────────────────────────────────

INSERT INTO wiki_categories (slug, label, icon, sort_order) VALUES
  ('botanique',     'Botanique & Taxonomie',    '🌿', 1),
  ('culture',       'Culture & Entretien',      '🪴', 2),
  ('varietes',      'Variétés & Cultivars',     '🍊', 3),
  ('maladies',      'Maladies & Ravageurs',     '🦠', 4),
  ('nutrition',     'Nutrition & Fertilisation', '🌱', 5),
  ('multiplication','Multiplication',           '✂️', 6),
  ('histoire',      'Histoire & Géographie',    '🗺', 7),
  ('conservation',  'Conservation & Biodiversité','🏛', 8)
ON CONFLICT (slug) DO NOTHING;
