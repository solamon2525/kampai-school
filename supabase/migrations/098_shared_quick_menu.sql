-- ============================================================================
-- Migration 098: Shared Quick Menu (singleton)
-- ============================================================================
-- Single source of truth สำหรับ "เมนูลัด" บน dashboard
-- - แอดมินทุกคนแก้ row เดียวกัน (ไม่ทะเลาะกันเหมือนเดิม)
-- - ครูทุกคนอ่าน row นี้ (RLS อนุญาต SELECT ให้ authenticated ทุกคน)
-- - known_catalog_ids ใช้ดักว่า "เมนูใหม่ที่ catalog เพิ่มเข้ามา" — frontend
--   จะ auto-append ลง menu_item_ids เพื่อให้ทุกคนเห็นทันที
--
-- แทนที่ flow เดิมที่ user_quick_menu_preferences เก็บ pref ต่อแอดมิน
-- + RLS auth.uid()=user_id ทำให้ครูอ่านของแอดมินไม่ได้ → fallback เป็น
-- default 4 เมนู (incident: ครูเห็นเมนูไม่ครบกับที่แอดมินปัก)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.shared_quick_menu (
  id                SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  menu_item_ids     TEXT[] NOT NULL DEFAULT '{}',
  known_catalog_ids TEXT[] NOT NULL DEFAULT '{}',
  updated_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.shared_quick_menu ENABLE ROW LEVEL SECURITY;

-- ทุกคนที่ล็อกอินอ่านได้ (ครู, แอดมิน, viewer)
DROP POLICY IF EXISTS "authenticated_read_shared_quick_menu" ON public.shared_quick_menu;
CREATE POLICY "authenticated_read_shared_quick_menu"
  ON public.shared_quick_menu FOR SELECT
  TO authenticated
  USING (true);

-- เฉพาะแอดมินเท่านั้นที่ INSERT/UPDATE/DELETE ได้
DROP POLICY IF EXISTS "admin_write_shared_quick_menu" ON public.shared_quick_menu;
CREATE POLICY "admin_write_shared_quick_menu"
  ON public.shared_quick_menu FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Seed: ดึงจาก user_quick_menu_preferences ของแอดมินคนแรก (ถ้ามี) เพื่อ
-- ไม่ให้แอดมินต้องตั้งใหม่ทั้งหมด
INSERT INTO public.shared_quick_menu (id, menu_item_ids, known_catalog_ids, updated_by)
SELECT
  1,
  COALESCE(uqm.menu_item_ids, ARRAY['news','gallery','events','settings']),
  '{}'::TEXT[],
  ur.user_id
FROM public.user_roles ur
LEFT JOIN public.user_quick_menu_preferences uqm
  ON uqm.user_id = ur.user_id AND uqm.context = 'admin'
WHERE ur.role = 'admin'
ORDER BY ur.created_at ASC
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- ถ้าไม่มีแอดมินเลย (edge case) ใส่ default ว่างไว้ก่อน
INSERT INTO public.shared_quick_menu (id, menu_item_ids, known_catalog_ids)
VALUES (1, ARRAY['news','gallery','events','settings'], '{}'::TEXT[])
ON CONFLICT (id) DO NOTHING;
