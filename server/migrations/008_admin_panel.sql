-- Migration 008 — Admin panel : audit log, bug groups, colonnes users
-- NB : users.id est INTEGER (SERIAL), update_updated_at_column() existe déjà (006)

BEGIN;

-- ─── admin_audit_log ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id             SERIAL      PRIMARY KEY,
  admin_id       INTEGER     NOT NULL REFERENCES users(id),
  target_user_id INTEGER     REFERENCES users(id) ON DELETE SET NULL,
  action         VARCHAR(50) NOT NULL,
  details        JSONB       DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_admin  ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_target ON admin_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_date   ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON admin_audit_log(action);

-- ─── bug_report_groups ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bug_report_groups (
  id          SERIAL      PRIMARY KEY,
  title       TEXT        NOT NULL,
  description TEXT,
  status      VARCHAR(20) DEFAULT 'open'   CHECK (status   IN ('open','in_progress','resolved','closed','wontfix')),
  priority    VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low','normal','high','critical')),
  created_by  INTEGER     NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_bug_groups_updated_at ON bug_report_groups;
CREATE TRIGGER trg_bug_groups_updated_at BEFORE UPDATE ON bug_report_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Colonnes supplémentaires sur bug_reports ─────────────────────────────────
ALTER TABLE bug_reports ADD COLUMN IF NOT EXISTS group_id    INTEGER REFERENCES bug_report_groups(id) ON DELETE SET NULL;
ALTER TABLE bug_reports ADD COLUMN IF NOT EXISTS priority    VARCHAR(10) DEFAULT 'normal';
ALTER TABLE bug_reports ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bug_reports_group ON bug_reports(group_id) WHERE group_id IS NOT NULL;

-- ─── Colonnes supplémentaires sur users ───────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active          BOOLEAN     DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivated_at     TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivated_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at      TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count        INTEGER     DEFAULT 0;

COMMIT;
