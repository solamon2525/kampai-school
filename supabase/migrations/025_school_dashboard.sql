-- ============================================================================
-- Migration 025: School Dashboard — flexible store for school metadata
-- (รหัสโรงเรียน, บัญชีระบบราชการ, เครือข่ายอินเทอร์เน็ต ฯลฯ)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.school_dashboard_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category        TEXT NOT NULL CHECK (category IN ('codes','systems','network','contacts','other')),
  title           TEXT NOT NULL,
  description     TEXT,

  -- Common typed fields (nullable)
  url             TEXT,
  username        TEXT,
  password        TEXT,

  -- Flexible array of extra fields, each: {"label","value","type"}
  -- type ∈ ('text','password','url','ip','note')
  extra_fields    JSONB NOT NULL DEFAULT '[]'::jsonb,

  tags            TEXT[] NOT NULL DEFAULT '{}',
  is_sensitive    BOOLEAN NOT NULL DEFAULT false,
  order_position  INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_dashboard_category
  ON public.school_dashboard_entries(category, order_position);
CREATE INDEX IF NOT EXISTS idx_school_dashboard_tags
  ON public.school_dashboard_entries USING GIN (tags);

-- Auto-update updated_at on row update
CREATE OR REPLACE FUNCTION public.touch_school_dashboard_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_school_dashboard_updated_at
  ON public.school_dashboard_entries;
CREATE TRIGGER trg_school_dashboard_updated_at
  BEFORE UPDATE ON public.school_dashboard_entries
  FOR EACH ROW EXECUTE FUNCTION public.touch_school_dashboard_updated_at();

-- ── RLS: admin only (sensitive credentials) ────────────────────────────────
ALTER TABLE public.school_dashboard_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_school_dashboard"
  ON public.school_dashboard_entries
  FOR SELECT USING (public.is_admin());

CREATE POLICY "admin_insert_school_dashboard"
  ON public.school_dashboard_entries
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "admin_update_school_dashboard"
  ON public.school_dashboard_entries
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "admin_delete_school_dashboard"
  ON public.school_dashboard_entries
  FOR DELETE USING (public.is_admin());

-- ── Seed initial data (รหัสโรงเรียน + ระบบ ป.ป.ช. + เน็ตอินเทอร์เน็ต × 2) ──
INSERT INTO public.school_dashboard_entries
  (category, title, description, url, username, password, extra_fields, tags, is_sensitive, order_position)
VALUES
  ('codes',
   'รหัสประจำตัวโรงเรียน',
   'รหัส 10 หลัก + รหัส O-NET ของโรงเรียนบ้านคำไผ่',
   NULL, NULL, NULL,
   '[
      {"label":"รหัส 10 หลัก","value":"1041020050","type":"text"},
      {"label":"รหัส O-NET","value":"KaMpAi680165","type":"text"}
   ]'::jsonb,
   ARRAY['รหัส','โรงเรียน','O-NET'],
   false, 1),

  ('systems',
   'ระบบโรงเรียนพร้อม ป.ป.ช.',
   'ระบบประเมินคุณธรรมและความโปร่งใสในการดำเนินงานของหน่วยงานภาครัฐ (ITA)',
   'https://school.nacc.go.th/login',
   '1041020050',
   'kp680165',
   '[]'::jsonb,
   ARRAY['ป.ป.ช.','ITA','ระบบราชการ'],
   true, 1),

  ('network',
   'อินเทอร์เน็ต — บริการ 4239J0434',
   'WAN SPARE 182.93.165.228 / WAN 203.172.181.155',
   NULL, NULL, NULL,
   '[
      {"label":"หมู่บ้าน/พื้นที่","value":"บ้านคำไผ่","type":"text"},
      {"label":"ตำบล","value":"เวียงคำ","type":"text"},
      {"label":"อำเภอ","value":"กุมภวาปี","type":"text"},
      {"label":"รหัสบริการ","value":"4239J0434","type":"text"},
      {"label":"WAN SPARE","value":"182.93.165.228","type":"ip"},
      {"label":"WAN","value":"203.172.181.155","type":"ip"}
   ]'::jsonb,
   ARRAY['เครือข่าย','อินเทอร์เน็ต','WAN'],
   false, 1),

  ('network',
   'อินเทอร์เน็ต — บริการ 4239J0433',
   'WAN SPARE 182.93.165.229 / WAN 203.172.180.255',
   NULL, NULL, NULL,
   '[
      {"label":"หมู่บ้าน/พื้นที่","value":"บ้านคำไผ่","type":"text"},
      {"label":"ตำบล","value":"เวียงคำ","type":"text"},
      {"label":"อำเภอ","value":"กุมภวาปี","type":"text"},
      {"label":"รหัสบริการ","value":"4239J0433","type":"text"},
      {"label":"WAN SPARE","value":"182.93.165.229","type":"ip"},
      {"label":"WAN","value":"203.172.180.255","type":"ip"}
   ]'::jsonb,
   ARRAY['เครือข่าย','อินเทอร์เน็ต','WAN'],
   false, 2)
ON CONFLICT DO NOTHING;
