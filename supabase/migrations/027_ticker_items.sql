-- News Ticker CMS — table + global settings
-- Items shown in addition to latest published news (mixed mode)

CREATE TABLE IF NOT EXISTS ticker_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  link        text,                       -- nullable; auto-detect internal vs external
  start_at    timestamptz,                -- nullable = always started
  end_at      timestamptz,                -- nullable = never ends
  sort_order  int NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ticker_items_active_idx
  ON ticker_items (is_active, sort_order);

CREATE INDEX IF NOT EXISTS ticker_items_schedule_idx
  ON ticker_items (start_at, end_at);

-- updated_at auto-touch
CREATE OR REPLACE FUNCTION touch_ticker_items_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_ticker_items_updated_at ON ticker_items;
CREATE TRIGGER trg_ticker_items_updated_at
  BEFORE UPDATE ON ticker_items
  FOR EACH ROW EXECUTE FUNCTION touch_ticker_items_updated_at();

-- RLS
ALTER TABLE ticker_items ENABLE ROW LEVEL SECURITY;

-- Public can read active items within their schedule window
DROP POLICY IF EXISTS ticker_items_public_read ON ticker_items;
CREATE POLICY ticker_items_public_read ON ticker_items
  FOR SELECT TO anon, authenticated
  USING (
    is_active = true
    AND (start_at IS NULL OR start_at <= now())
    AND (end_at   IS NULL OR end_at   >  now())
  );

-- Admins/teachers can do anything (relies on existing has_role helper)
DROP POLICY IF EXISTS ticker_items_admin_all ON ticker_items;
CREATE POLICY ticker_items_admin_all ON ticker_items
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Seed default global settings into school_settings (key/value)
INSERT INTO school_settings (key, value) VALUES
  ('ticker_speed_seconds', '30'),
  ('ticker_gap_px',        '60'),
  ('ticker_pause_on_hover','true')
ON CONFLICT (key) DO NOTHING;
