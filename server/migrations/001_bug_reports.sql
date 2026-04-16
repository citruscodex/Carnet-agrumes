-- Migration 001 — Bug Reports (Module C)
-- À exécuter sur le serveur PostgreSQL Scaleway (citruscodex.fr)

CREATE TABLE IF NOT EXISTS bug_reports (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        REFERENCES users(id) ON DELETE SET NULL,
  title            VARCHAR(200) NOT NULL,
  description      TEXT        NOT NULL,
  category         VARCHAR(50) DEFAULT 'bug'    CHECK (category IN ('bug','feature','ui','perf','other')),
  severity         VARCHAR(20) DEFAULT 'medium' CHECK (severity  IN ('low','medium','high','critical')),
  status           VARCHAR(20) DEFAULT 'open'   CHECK (status    IN ('open','acknowledged','in_progress','resolved','closed','wont_fix')),
  page_context     VARCHAR(100),
  browser_info     TEXT,
  screen_size      VARCHAR(20),
  app_version      VARCHAR(20),
  admin_notes      TEXT,         -- interne admin, invisible du membre
  resolution_notes TEXT,         -- visible du membre si statut resolved/closed
  resolved_at      TIMESTAMP,
  created_at       TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bug_status   ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_user     ON bug_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_bug_severity ON bug_reports(severity);
CREATE INDEX IF NOT EXISTS idx_bug_created  ON bug_reports(created_at DESC);

-- Trigger updated_at automatique
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_bug_updated_at ON bug_reports;
CREATE TRIGGER trg_bug_updated_at
  BEFORE UPDATE ON bug_reports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
