-- Migration 005 — Bourse aux greffons
-- users.id est INTEGER (SERIAL)

CREATE TABLE IF NOT EXISTS graft_exchange (
  id           SERIAL       PRIMARY KEY,
  user_id      INTEGER      REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type         VARCHAR(20)  NOT NULL CHECK (type IN ('offre', 'recherche')),
  species      VARCHAR(200) NOT NULL,
  variety      VARCHAR(200),
  rootstock    VARCHAR(200),
  quantity     INT          NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  region       VARCHAR(100),
  description  TEXT,
  status       VARCHAR(20)  NOT NULL DEFAULT 'active'
               CHECK (status IN ('active', 'reservee', 'conclue', 'expiree')),
  contact_method VARCHAR(20) NOT NULL DEFAULT 'message'
               CHECK (contact_method IN ('message', 'email')),
  expires_at   TIMESTAMP    NOT NULL DEFAULT NOW() + INTERVAL '90 days',
  created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_graft_status  ON graft_exchange(status);
CREATE INDEX IF NOT EXISTS idx_graft_species ON graft_exchange(species);
CREATE INDEX IF NOT EXISTS idx_graft_user    ON graft_exchange(user_id);
CREATE INDEX IF NOT EXISTS idx_graft_type    ON graft_exchange(type);

CREATE TABLE IF NOT EXISTS graft_messages (
  id           SERIAL       PRIMARY KEY,
  exchange_id  INTEGER      REFERENCES graft_exchange(id) ON DELETE CASCADE NOT NULL,
  sender_id    INTEGER      REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  body         TEXT         NOT NULL,
  sent_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_graftmsg_exchange ON graft_messages(exchange_id);
CREATE INDEX IF NOT EXISTS idx_graftmsg_sender   ON graft_messages(sender_id);

-- Trigger updated_at
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    DROP TRIGGER IF EXISTS trg_graft_updated_at ON graft_exchange;
    CREATE TRIGGER trg_graft_updated_at
      BEFORE UPDATE ON graft_exchange
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- Expiration automatique (cron quotidien) :
-- UPDATE graft_exchange SET status='expiree' WHERE status='active' AND expires_at < NOW();
