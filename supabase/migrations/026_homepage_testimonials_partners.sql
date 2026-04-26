-- Migration 026: Homepage Testimonials + Partners
-- v1.7.1 — Block-level CMS (testimonials + partners + obec links)

-- ─── Testimonials ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS testimonials (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  role            text,                   -- เช่น 'ผู้ปกครอง' / 'นักเรียน' / 'ศิษย์เก่า'
  quote           text NOT NULL,
  rating          int  DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  avatar_url      text,
  order_position  int  DEFAULT 0,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_active_order
  ON testimonials (is_active, order_position);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_testimonials_public" ON testimonials;
CREATE POLICY "select_testimonials_public"
  ON testimonials FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "all_testimonials_admin" ON testimonials;
CREATE POLICY "all_testimonials_admin"
  ON testimonials FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Seed sample data
INSERT INTO testimonials (name, role, quote, rating, order_position) VALUES
  ('คุณสมศรี ใจดี',     'ผู้ปกครอง', 'โรงเรียนมีคุณภาพ ดูแลนักเรียนดีมาก ลูกของฉันมีความสุขกับการมาโรงเรียนทุกวัน', 5, 1),
  ('น้องพิม ม.6',       'นักเรียน',   'ชอบกิจกรรมที่หลากหลาย ทำให้ได้เรียนรู้นอกห้องเรียน อาจารย์ทุกคนเป็นกันเอง',     5, 2),
  ('นายอนันต์ ศิษย์เก่า','ศิษย์เก่า',  'ขอบคุณโรงเรียนที่ปลูกฝังคุณธรรมและความรู้ ทำให้ผมเติบโตเป็นคนที่มีคุณภาพ',  5, 3)
ON CONFLICT DO NOTHING;

-- ─── Partners ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partners (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  logo_url        text,
  link_url        text,
  description     text,
  order_position  int  DEFAULT 0,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partners_active_order
  ON partners (is_active, order_position);

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_partners_public" ON partners;
CREATE POLICY "select_partners_public"
  ON partners FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "all_partners_admin" ON partners;
CREATE POLICY "all_partners_admin"
  ON partners FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Seed sample partners
INSERT INTO partners (name, link_url, order_position) VALUES
  ('กระทรวงศึกษาธิการ', 'https://www.moe.go.th',       1),
  ('สพฐ.',              'https://www.obec.go.th',      2),
  ('สพท.',              '#',                            3),
  ('ท้องถิ่น',          '#',                            4)
ON CONFLICT DO NOTHING;
