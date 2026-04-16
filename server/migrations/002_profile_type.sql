-- Migration 002 — Champ profile_type sur la table users (Chantier 1)
-- Source de vérité du profileType côté serveur

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS profile_type VARCHAR(30)
    NOT NULL DEFAULT 'collectionneur'
    CHECK (profile_type IN ('collectionneur','pepinieriste','arboriculteur','conservatoire'));

-- Colonne disabled_at pour soft-delete (Chantier 2)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMP DEFAULT NULL;

-- Index pour les requêtes admin
CREATE INDEX IF NOT EXISTS idx_users_profile_type ON users(profile_type);
CREATE INDEX IF NOT EXISTS idx_users_disabled     ON users(disabled_at) WHERE disabled_at IS NOT NULL;
