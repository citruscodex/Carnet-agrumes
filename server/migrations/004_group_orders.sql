-- Migration 004 — Commandes groupées géographiques (Chantier 10)
-- À exécuter sur le serveur PostgreSQL citruscodex.fr

CREATE TABLE IF NOT EXISTS group_orders (
  id                      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id            UUID         REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title                   VARCHAR(200) NOT NULL,
  description             TEXT,
  category                VARCHAR(50)  CHECK (category IN ('plants','pots','engrais','substrats','amendements','outils','divers')),
  supplier_name           VARCHAR(200),
  supplier_url            VARCHAR(500),
  delivery_location_lat   NUMERIC(10,6),
  delivery_location_lng   NUMERIC(10,6),
  delivery_address        TEXT,
  deadline                TIMESTAMP    NOT NULL,
  min_total_eur           NUMERIC(10,2),
  current_total_eur       NUMERIC(10,2) NOT NULL DEFAULT 0,
  status                  VARCHAR(20)  NOT NULL DEFAULT 'open'
                          CHECK (status IN ('open','closed','ordered','delivered','cancelled')),
  created_at              TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_order_participants (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID         REFERENCES group_orders(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID         REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  items      JSONB        NOT NULL DEFAULT '[]',
  total_eur  NUMERIC(10,2) NOT NULL,
  status     VARCHAR(20)  NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending','confirmed','paid','received')),
  joined_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  UNIQUE (order_id, user_id)
);

-- Messages internes entre participants
CREATE TABLE IF NOT EXISTS group_order_messages (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID         REFERENCES group_orders(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID         REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  body       TEXT         NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gorder_organizer  ON group_orders(organizer_id);
CREATE INDEX IF NOT EXISTS idx_gorder_status     ON group_orders(status);
CREATE INDEX IF NOT EXISTS idx_gorder_deadline   ON group_orders(deadline);
CREATE INDEX IF NOT EXISTS idx_gorder_location   ON group_orders(delivery_location_lat, delivery_location_lng);
CREATE INDEX IF NOT EXISTS idx_gpart_order       ON group_order_participants(order_id);
CREATE INDEX IF NOT EXISTS idx_gpart_user        ON group_order_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_gmsg_order        ON group_order_messages(order_id);

DROP TRIGGER IF EXISTS trg_gorder_updated_at ON group_orders;
CREATE TRIGGER trg_gorder_updated_at
  BEFORE UPDATE ON group_orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Mettre à jour current_total_eur après ajout/modification d'un participant (à faire via trigger ou API)
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE group_orders
     SET current_total_eur = (
           SELECT COALESCE(SUM(total_eur), 0)
           FROM group_order_participants
           WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
             AND status != 'pending'
         )
   WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_gpart_total ON group_order_participants;
CREATE TRIGGER trg_gpart_total
  AFTER INSERT OR UPDATE OR DELETE ON group_order_participants
  FOR EACH ROW EXECUTE FUNCTION update_order_total();
