-- 095: seed setting key 'cert_default_view' — วิวเริ่มต้นหน้าเกียรติบัตรที่แอดมินตั้งให้ทุกคน
-- ค่า = ViewMode (grid/bento/masonry/list/spotlight/coverflow/polaroid/timeline/vtimeline)
-- หรือ 'auto' = ใช้ค่าเริ่มต้นเดิมของแต่ละหน้า (soft-lock: ปุ่มสลับยังอยู่)

INSERT INTO public.school_settings (key, value, category, description) VALUES
  ('cert_default_view', 'auto', 'general', 'วิวเริ่มต้นหน้าเกียรติบัตร (training showcase) ที่แอดมินตั้งให้ผู้เข้าชมทุกคน — auto = ค่าเริ่มต้นเดิม')
ON CONFLICT (key) DO NOTHING;
