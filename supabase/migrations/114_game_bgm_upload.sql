-- 114_game_bgm_upload.sql
-- อัปโหลดเพลง mp3 เอง (คลังเพลงกลาง) แล้วเลือกใช้รายเกม
-- ต่อจาก 113 (bgm_preset = เพลงสังเคราะห์) — เพิ่ม bgm_url = เพลงอัปโหลด (ถ้ามี = เล่นแทน synth)
-- ไฟล์เพลงเก็บใน bucket 'educational-hub' (โฟลเดอร์ bgm/) ที่รองรับ audio อยู่แล้ว (migration 061)

-- 1) คอลัมน์ URL เพลงต่อเกม
ALTER TABLE public.educational_hub_items
  ADD COLUMN IF NOT EXISTS bgm_url text;

-- 2) คลังเพลงกลาง (ใช้ซ้ำข้ามเกมได้)
CREATE TABLE IF NOT EXISTS public.game_bgm_tracks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  storage_path text NOT NULL,
  url          text NOT NULL,
  created_by   uuid,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.game_bgm_tracks ENABLE ROW LEVEL SECURITY;

-- อ่านได้: ผู้ล็อกอิน (หน้า admin จัดการคลัง) — URL จริงถูก denormalize ไป educational_hub_items.bgm_url (anon อ่านได้อยู่แล้ว)
DROP POLICY IF EXISTS "bgm_tracks_select_auth" ON public.game_bgm_tracks;
CREATE POLICY "bgm_tracks_select_auth" ON public.game_bgm_tracks
  FOR SELECT USING (auth.role() = 'authenticated');

-- เพิ่ม/ลบ: admin เท่านั้น
DROP POLICY IF EXISTS "bgm_tracks_insert_admin" ON public.game_bgm_tracks;
CREATE POLICY "bgm_tracks_insert_admin" ON public.game_bgm_tracks
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "bgm_tracks_delete_admin" ON public.game_bgm_tracks;
CREATE POLICY "bgm_tracks_delete_admin" ON public.game_bgm_tracks
  FOR DELETE USING (public.is_admin());
