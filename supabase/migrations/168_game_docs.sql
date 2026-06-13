-- ============================================================================
-- Migration 168: game_docs — รายละเอียดเกม (รูปแบบ/ฟีเจอร์/เวอร์ชันบิลด์)
-- ============================================================================
-- สเปกเดียวต่อเกม (1:1 กับ educational_hub_items, แก้ทับได้)
-- เห็นเฉพาะเจ้าของเกม (owner_staff_id) + ผู้ดูแลระบบ (is_admin) — ไม่มี public read
-- แยกตารางออกจาก educational_hub_items เพราะ policy public_read_ehi เปิดอ่านทั้งแถว
-- ต่อสาธารณะสำหรับเกมที่ published (RLS เป็น row-level คุมระดับคอลัมน์ไม่ได้)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.game_docs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id        UUID NOT NULL UNIQUE REFERENCES public.educational_hub_items(id) ON DELETE CASCADE,
  owner_staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,  -- = owner ของ item (denormalize ไว้ทำ RLS ตรง ๆ)
  game_format    TEXT,                  -- รูปแบบเกม (เช่น "ตอบคำถาม/quiz", "จับคู่", "platformer", "ลากวาง")
  features       TEXT[] NOT NULL DEFAULT '{}',  -- ฟีเจอร์ในเกม (เสียงไทย, โหมดศึกษา, ออนไลน์, ฯลฯ)
  version        TEXT,                  -- เวอร์ชันบิลด์ล่าสุด (เช่น "v1.2.0")
  notes          TEXT,                  -- บันทึก/changelog ย่อ (multiline, optional)
  updated_by     UUID,                  -- auth.uid() คนแก้ล่าสุด
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_docs_owner ON public.game_docs(owner_staff_id);

-- ─── RLS: owner + admin เท่านั้น (ไม่มี public read) ─────────────────────────
ALTER TABLE public.game_docs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_admin_read_game_docs"  ON public.game_docs;
DROP POLICY IF EXISTS "owner_admin_write_game_docs" ON public.game_docs;

CREATE POLICY "owner_admin_read_game_docs" ON public.game_docs
  FOR SELECT USING (
    public.is_admin()
    OR owner_staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "owner_admin_write_game_docs" ON public.game_docs
  FOR ALL USING (
    public.is_admin()
    OR owner_staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid())
  ) WITH CHECK (
    public.is_admin()
    OR owner_staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid())
  );
