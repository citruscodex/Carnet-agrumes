-- Migration 003 — Inscription stages pépinière (Chantier 9)
-- À exécuter sur le serveur PostgreSQL citruscodex.fr

CREATE TABLE IF NOT EXISTS training_sessions (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id     UUID         REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title            VARCHAR(200) NOT NULL,
  description      TEXT,
  type             VARCHAR(50)  CHECK (type IN ('greffe','bouture','taille','soins','initiation','autre')),
  location         TEXT         NOT NULL,
  start_datetime   TIMESTAMP    NOT NULL,
  end_datetime     TIMESTAMP    NOT NULL,
  capacity         INT          NOT NULL CHECK (capacity > 0),
  price_eur        NUMERIC(8,2) NOT NULL DEFAULT 0,
  public_url_slug  VARCHAR(100) UNIQUE NOT NULL,
  status           VARCHAR(20)  NOT NULL DEFAULT 'open'
                   CHECK (status IN ('open','full','cancelled','past')),
  created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_registrations (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID         REFERENCES training_sessions(id) ON DELETE CASCADE NOT NULL,
  email               VARCHAR(200) NOT NULL,
  first_name          VARCHAR(100) NOT NULL,
  last_name           VARCHAR(100) NOT NULL,
  phone               VARCHAR(30),
  notes               TEXT,
  confirmation_token  VARCHAR(64)  UNIQUE NOT NULL,
  confirmed           BOOLEAN      NOT NULL DEFAULT FALSE,
  confirmed_at        TIMESTAMP,
  cancelled           BOOLEAN      NOT NULL DEFAULT FALSE,
  cancelled_at        TIMESTAMP,
  created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, email)
);

CREATE INDEX IF NOT EXISTS idx_training_organizer  ON training_sessions(organizer_id);
CREATE INDEX IF NOT EXISTS idx_training_status     ON training_sessions(status);
CREATE INDEX IF NOT EXISTS idx_training_slug       ON training_sessions(public_url_slug);
CREATE INDEX IF NOT EXISTS idx_reg_session         ON training_registrations(session_id);
CREATE INDEX IF NOT EXISTS idx_reg_email           ON training_registrations(email);
CREATE INDEX IF NOT EXISTS idx_reg_token           ON training_registrations(confirmation_token);

-- Trigger updated_at sur training_sessions
DROP TRIGGER IF EXISTS trg_training_updated_at ON training_sessions;
CREATE TRIGGER trg_training_updated_at
  BEFORE UPDATE ON training_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Marquer comme passés automatiquement (à appeler par cron quotidien) :
-- UPDATE training_sessions SET status='past' WHERE status='open' AND end_datetime < NOW();
-- Supprimer les inscriptions non confirmées après 48h :
-- DELETE FROM training_registrations WHERE confirmed=FALSE AND created_at < NOW() - INTERVAL '48 hours';
