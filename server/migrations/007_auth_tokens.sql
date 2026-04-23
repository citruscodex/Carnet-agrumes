-- Migration 007 — Auth tokens : email verification + password reset

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_login_at  TIMESTAMPTZ;

-- Les utilisateurs créés par admin sont déjà vérifiés
UPDATE users SET email_verified = true WHERE email_verified = false;

-- Table des tokens auth (vérification email + reset mot de passe)
CREATE TABLE IF NOT EXISTS auth_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  type       VARCHAR(20) NOT NULL CHECK (type IN ('verify_email','reset_password')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_hash ON auth_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_user  ON auth_tokens(user_id);
