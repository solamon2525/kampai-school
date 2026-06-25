-- 241_edu_hub_preview_video.sql
-- เพิ่มคลิปวิดีโอเดโมต่อเกม — หน้ารวมเกม: การ์ดโชว์รูปปก 2 วิ แล้วเล่นเดโมอัตโนมัติ (มิวต์ วน)
-- ไม่ต้องแก้ RLS: policy ของ educational_hub_items เดิมครอบคลุม · bucket 'educational-hub' public-read อยู่แล้ว
ALTER TABLE public.educational_hub_items
  ADD COLUMN IF NOT EXISTS preview_video_url text;

COMMENT ON COLUMN public.educational_hub_items.preview_video_url IS
  'URL คลิปเดโมเกมสั้น (mp4/webm) — เล่นอัตโนมัติบนการ์ดหน้ารวมเกม (null = โชว์รูปปกเฉย ๆ)';
