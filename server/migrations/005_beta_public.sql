-- Migration 005 — Beta publique : codes invitation, change-password, delete-account

-- Table des codes d'invitation
CREATE TABLE IF NOT EXISTS invitation_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  used_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  profile_type VARCHAR(30) DEFAULT 'collectionneur',
  max_uses INTEGER DEFAULT 1,
  uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour lookup rapide
CREATE INDEX IF NOT EXISTS idx_invitation_codes_code ON invitation_codes(code);
