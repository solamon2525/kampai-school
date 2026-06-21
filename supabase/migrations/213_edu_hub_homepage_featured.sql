-- 213_edu_hub_homepage_featured.sql
-- ปักหมุดเกมให้ขึ้นโซน "เกมแนะนำ" บนหน้าแรก (เลือกเองจากหลังบ้าน GamesTab)
-- published items อ่านได้แบบ anon อยู่แล้ว (หน้า /h/:identifier เป็น public) → ไม่ต้องเพิ่ม policy

ALTER TABLE public.educational_hub_items
  ADD COLUMN IF NOT EXISTS homepage_featured boolean NOT NULL DEFAULT false;

-- partial index: หน้าแรกดึงเฉพาะที่ปักหมุด (เซ็ตเล็ก)
CREATE INDEX IF NOT EXISTS idx_edu_hub_homepage_featured
  ON public.educational_hub_items (homepage_featured)
  WHERE homepage_featured;
