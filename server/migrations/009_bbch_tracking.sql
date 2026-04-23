-- Migration 009 — BBCH tracking : suivi du dernier stade notifié par plante

CREATE TABLE IF NOT EXISTS user_bbch_tracking (
  user_id         INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plant_id        UUID        NOT NULL REFERENCES user_plants(id) ON DELETE CASCADE,
  last_stage      VARCHAR(20),
  last_notified_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, plant_id)
);

CREATE INDEX IF NOT EXISTS idx_bbch_tracking_user ON user_bbch_tracking(user_id);
