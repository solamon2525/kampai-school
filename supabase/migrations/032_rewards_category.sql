-- 032_rewards_category.sql
-- เพิ่ม category column ให้ rewards (ประเภทของรางวัล: เครื่องเขียน / ขนม / กีฬา / ของเล่น / อื่นๆ)
-- Free-text — admin พิมพ์เอง ระบบ derive distinct values สำหรับ chip filter ในหน้า public

ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS category TEXT;

CREATE INDEX IF NOT EXISTS idx_rewards_category
  ON public.rewards(category)
  WHERE is_active = true;
