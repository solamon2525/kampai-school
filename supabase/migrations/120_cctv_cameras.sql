-- ===============================================================
-- Migration 120: CCTV cameras (teacher-only, backend view)
-- ===============================================================
-- กล้องวงจรปิดโรงเรียน (Tapo/Vigi) — relay เป็น HLS แล้วเก็บ URL ที่นี่
-- ดูได้เฉพาะครู/แอดมิน (ผ่าน portal ครู) — ไม่ public เพื่อความเป็นส่วนตัว (PDPA)
-- ===============================================================

CREATE TABLE IF NOT EXISTS public.cctv_cameras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location_label text,
  lat double precision,
  lng double precision,
  hls_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cctv_active ON public.cctv_cameras(is_active, sort_order);

ALTER TABLE public.cctv_cameras ENABLE ROW LEVEL SECURITY;

-- อ่านได้เฉพาะครู/แอดมิน (is_teacher() ครอบคลุม teacher + admin อยู่แล้ว)
DROP POLICY IF EXISTS "teacher_read_cctv" ON public.cctv_cameras;
CREATE POLICY "teacher_read_cctv" ON public.cctv_cameras
  FOR SELECT USING (public.is_teacher());

-- เพิ่ม/แก้/ลบ เฉพาะแอดมิน
DROP POLICY IF EXISTS "admin_manage_cctv" ON public.cctv_cameras;
CREATE POLICY "admin_manage_cctv" ON public.cctv_cameras
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

COMMENT ON TABLE public.cctv_cameras IS 'School CCTV cameras (Tapo/Vigi via HLS relay) — teacher/admin only, never public (PDPA)';
COMMENT ON COLUMN public.cctv_cameras.hls_url IS 'HLS (.m3u8) URL from media relay (e.g. MediaMTX via Cloudflare Tunnel)';
