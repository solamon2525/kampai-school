-- ===============================================================
-- Migration 068: Kampai Hero System (ระบบพลังความดีและการเติบโต)
-- ===============================================================

-- 1. สร้างตาราง classroom_goals สำหรับเก็บเป้าหมายและของรางวัลของห้องเรียน
CREATE TABLE IF NOT EXISTS public.classroom_goals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class         TEXT NOT NULL,                              -- e.g., 'ป.5'
  room          TEXT NOT NULL DEFAULT '1',                  -- e.g., '1'
  target_xp     INT NOT NULL DEFAULT 5000,
  reward        TEXT NOT NULL DEFAULT 'วันดูหนังร่วมกัน (Movie Day) 🍿',
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class, room)
);

-- 2. ตั้ง RLS Policies
ALTER TABLE public.classroom_goals ENABLE ROW LEVEL SECURITY;

-- ทุกคนสามารถอ่านเป้าหมายห้องเรียนได้ (รวมถึงผู้ปกครองและสาธารณะ)
CREATE POLICY "Allow public read classroom_goals"
  ON public.classroom_goals FOR SELECT
  USING (true);

-- ผู้ใช้ที่เป็นครูหรือแอดมิน สามารถจัดการเป้าหมายห้องเรียนได้ (เพื่อความปลอดภัย RLS)
CREATE POLICY "Allow teacher manage classroom_goals"
  ON public.classroom_goals FOR ALL
  USING (public.is_teacher())
  WITH CHECK (public.is_teacher());

-- 3. สร้าง Index เพื่อความเร็วในการค้นหา
CREATE INDEX IF NOT EXISTS idx_classroom_goals_lookup ON public.classroom_goals(class, room);
CREATE INDEX IF NOT EXISTS idx_conduct_scores_type ON public.conduct_scores(type);

-- 4. Seed เป้าหมายเริ่มต้นสำหรับทุกชั้นปีหลัก (สมมติห้อง 1 และ 2)
INSERT INTO public.classroom_goals (class, room, target_xp, reward)
VALUES
  ('ป.1', '1', 3000, 'วันฉายการ์ตูนและขนมแสนอร่อย 🍭'),
  ('ป.1', '2', 3000, 'วันฉายการ์ตูนและขนมแสนอร่อย 🍭'),
  ('ป.2', '1', 3500, 'วันปิกนิกใต้ต้นไม้ใหญ่ 🌳'),
  ('ป.2', '2', 3500, 'วันปิกนิกใต้ต้นไม้ใหญ่ 🌳'),
  ('ป.3', '1', 4000, 'กิจกรรมศิลปะสร้างสรรค์และไอศกรีม 🎨'),
  ('ป.3', '2', 4000, 'กิจกรรมศิลปะสร้างสรรค์และไอศกรีม 🎨'),
  ('ป.4', '1', 4500, 'วันนำบอร์ดเกมมาเล่นร่วมกัน 🎲'),
  ('ป.4', '2', 4500, 'วันนำบอร์ดเกมมาเล่นร่วมกัน 🎲'),
  ('ป.5', '1', 5000, 'วันดูภาพยนตร์ (Movie Day) และป๊อปคอร์น 🍿'),
  ('ป.5', '2', 5000, 'วันดูภาพยนตร์ (Movie Day) และป๊อปคอร์น 🍿'),
  ('ป.6', '1', 5000, 'ปาร์ตี้หมูกระทะฉลองปีการศึกษา 🍜'),
  ('ป.6', '2', 5000, 'ปาร์ตี้หมูกระทะฉลองปีการศึกษา 🍜'),
  ('ม.1', '1', 5000, 'วันเล่นกีฬากระชับมิตรและเครื่องดื่มเย็นๆ 🥤'),
  ('ม.2', '1', 5000, 'วันพักผ่อนและแต่งชุดไปรเวทฟรีสไตล์ 👕'),
  ('ม.3', '1', 5000, 'วันร้องคาราโอเกะผ่อนคลายความเครียด 🎤'),
  ('ม.4', '1', 5500, 'ชั่วโมงพักผ่อนฟังเพลงสากล 🎧'),
  ('ม.5', '1', 5500, 'ชั่วโมงกิจกรรมอิสระนอกห้องเรียน 🪁'),
  ('ม.6', '1', 6000, 'วันเลี้ยงสายรหัสและของขวัญอำลา 🎓')
ON CONFLICT (class, room) DO NOTHING;
