-- ===============================================================
-- Migration 549: Waste Bank Promotion, Lucky Spin & Classroom League
-- 1. Create tables: waste_promotions & waste_lucky_spins
-- 2. Create RPCs: get_active_waste_promotions & get_classroom_waste_rankings
-- 3. RLS policies & permissions
-- 4. Seed default campaigns (Green Friday x2, Happy Hour +5, Milk Cartons x3)
-- ===============================================================

-- 1. ตารางแคมเปญและโปรโมชั่นขยะรีไซเคิล
CREATE TABLE IF NOT EXISTS public.waste_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  banner_type TEXT NOT NULL DEFAULT 'green_friday', -- 'green_friday', 'happy_hour', 'target_item', 'flash_sale', 'home_quest', 'custom'
  multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.00,
  bonus_points INTEGER NOT NULL DEFAULT 0,
  category_ids UUID[] DEFAULT NULL, -- NULL = ทุกประเภทขยะ
  days_of_week INTEGER[] DEFAULT NULL, -- NULL = ทุกวัน, 0=อา, 1=จ, ..., 5=ศ, 6=ส
  start_time TIME DEFAULT NULL, -- เวลาเริ่ม เช่น 12:00:00
  end_time TIME DEFAULT NULL,   -- เวลาสิ้นสุด เช่น 12:45:00
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  badge_text TEXT,
  order_position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. ตารางบันทึกการหมุนวงล้อเสี่ยงโชค (Eco Lucky Wheel)
CREATE TABLE IF NOT EXISTS public.waste_lucky_spins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_class TEXT,
  transaction_id UUID REFERENCES public.waste_transactions(id) ON DELETE SET NULL,
  spin_result TEXT NOT NULL, -- เช่น '+20 แต้มโบนัส', 'สติกเกอร์รักษ์โลก 🌟'
  bonus_points_awarded INTEGER NOT NULL DEFAULT 0,
  spun_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  recorded_by TEXT
);

-- Index เพื่อความรวดเร็วในการคิวรี
CREATE INDEX IF NOT EXISTS idx_waste_promotions_active ON public.waste_promotions(is_active, order_position);
CREATE INDEX IF NOT EXISTS idx_waste_lucky_spins_student ON public.waste_lucky_spins(student_id);
CREATE INDEX IF NOT EXISTS idx_waste_lucky_spins_spun_at ON public.waste_lucky_spins(spun_at DESC);

-- 3. RPC ตรวจสอบโปรโมชั่นที่กำลังเปิดใช้งาน ณ เวลาปัจจุบัน (Bangkok Timezone)
CREATE OR REPLACE FUNCTION public.get_active_waste_promotions()
RETURNS SETOF public.waste_promotions
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT *
  FROM public.waste_promotions
  WHERE is_active = true
    AND (start_date IS NULL OR (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok')::date >= start_date)
    AND (end_date IS NULL OR (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok')::date <= end_date)
    AND (days_of_week IS NULL OR EXTRACT(DOW FROM CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok')::integer = ANY(days_of_week))
    AND (start_time IS NULL OR (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok')::time >= start_time)
    AND (end_time IS NULL OR (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok')::time <= end_time)
  ORDER BY order_position ASC, created_at DESC;
$$;

-- 4. RPC คำนวณอันดับศึกลีกห้องเรียนรักษ์โลก (Eco-Classroom League Per-Capita Rankings)
CREATE OR REPLACE FUNCTION public.get_classroom_waste_rankings(
  p_academic_year TEXT DEFAULT NULL,
  p_semester TEXT DEFAULT NULL,
  p_month INTEGER DEFAULT NULL,
  p_year INTEGER DEFAULT NULL
)
RETURNS TABLE (
  class_name TEXT,
  student_count BIGINT,
  participating_students BIGINT,
  total_items BIGINT,
  total_points BIGINT,
  items_per_student NUMERIC,
  points_per_student NUMERIC,
  rank BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH class_students AS (
    SELECT
      s.class AS c_name,
      COUNT(DISTINCT s.id) AS s_count
    FROM public.students s
    WHERE s.is_active = true
      AND s.class IS NOT NULL
      AND TRIM(s.class) <> ''
    GROUP BY s.class
  ),
  filtered_transactions AS (
    SELECT
      wt.student_class,
      wt.student_id,
      wt.quantity,
      wt.points_earned
    FROM public.waste_transactions wt
    WHERE (p_academic_year IS NULL OR wt.academic_year = p_academic_year)
      AND (p_semester IS NULL OR wt.semester = p_semester)
      AND (p_year IS NULL OR EXTRACT(YEAR FROM wt.transaction_date)::integer = p_year)
      AND (p_month IS NULL OR EXTRACT(MONTH FROM wt.transaction_date)::integer = p_month)
  ),
  aggregated AS (
    SELECT
      cs.c_name,
      cs.s_count,
      COUNT(DISTINCT ft.student_id) AS part_count,
      COALESCE(SUM(ft.quantity), 0)::BIGINT AS tot_items,
      COALESCE(SUM(ft.points_earned), 0)::BIGINT AS tot_points,
      ROUND(COALESCE(SUM(ft.quantity), 0)::NUMERIC / GREATEST(cs.s_count, 1), 2) AS per_capita_items,
      ROUND(COALESCE(SUM(ft.points_earned), 0)::NUMERIC / GREATEST(cs.s_count, 1), 2) AS per_capita_points
    FROM class_students cs
    LEFT JOIN filtered_transactions ft ON ft.student_class = cs.c_name
    GROUP BY cs.c_name, cs.s_count
  )
  SELECT
    a.c_name AS class_name,
    a.s_count AS student_count,
    a.part_count AS participating_students,
    a.tot_items AS total_items,
    a.tot_points AS total_points,
    a.per_capita_items AS items_per_student,
    a.per_capita_points AS points_per_student,
    DENSE_RANK() OVER (ORDER BY a.per_capita_items DESC, a.tot_items DESC, a.c_name ASC) AS rank
  FROM aggregated a
  ORDER BY rank ASC, a.c_name ASC;
END;
$$;

-- 5. กำหนดสิทธิ์ RLS
ALTER TABLE public.waste_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_lucky_spins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read waste promotions" ON public.waste_promotions;
CREATE POLICY "Public read waste promotions" ON public.waste_promotions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff manage waste promotions" ON public.waste_promotions;
CREATE POLICY "Staff manage waste promotions" ON public.waste_promotions
  FOR ALL USING (public.is_teacher() OR public.is_admin());

DROP POLICY IF EXISTS "Public read waste lucky spins" ON public.waste_lucky_spins;
CREATE POLICY "Public read waste lucky spins" ON public.waste_lucky_spins
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff insert waste lucky spins" ON public.waste_lucky_spins;
CREATE POLICY "Staff insert waste lucky spins" ON public.waste_lucky_spins
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Staff manage waste lucky spins" ON public.waste_lucky_spins;
CREATE POLICY "Staff manage waste lucky spins" ON public.waste_lucky_spins
  FOR ALL USING (public.is_teacher() OR public.is_admin());

GRANT SELECT ON public.waste_promotions TO anon, authenticated;
GRANT ALL ON public.waste_promotions TO authenticated;

GRANT SELECT, INSERT ON public.waste_lucky_spins TO anon, authenticated;
GRANT ALL ON public.waste_lucky_spins TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_active_waste_promotions() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_classroom_waste_rankings(TEXT, TEXT, INTEGER, INTEGER) TO anon, authenticated;

-- 6. Seed แคมเปญเริ่มต้นมาตรฐาน (Green Friday x2, Happy Hour +5, สัปดาห์กล่องนมกู้โลก x3, ภารกิจบ้านสู่โรงเรียน)
INSERT INTO public.waste_promotions (title, description, banner_type, multiplier, bonus_points, days_of_week, start_time, end_time, is_active, badge_text, order_position)
VALUES
  (
    'วันศุกร์สีเขียว (Green Friday)',
    'ทุกวันศุกร์ ส่งขยะรีไซเคิลทุกประเภท รับแต้มสะสมเพิ่มเป็น 2 เท่า (x2)',
    'green_friday',
    2.00,
    0,
    ARRAY[5], -- วันศุกร์ (5)
    NULL,
    NULL,
    true,
    '🔥 แต้ม x2 ทุกวันศุกร์',
    1
  ),
  (
    'แฮปปี้อาวร์ พักเที่ยงรักษ์โลก (Lunch Break)',
    'ช่วงพักกลางวัน 12:00 - 12:45 น. นำขวดน้ำหรือกล่องนมมาส่ง รับแต้มโบนัสพิเศษทันที +5 แต้ม',
    'happy_hour',
    1.00,
    5,
    ARRAY[1, 2, 3, 4, 5], -- วันจันทร์ถึงศุกร์
    '12:00:00',
    '12:45:00',
    true,
    '⭐ โบนัส +5 แต้มช่วงพักเที่ยง',
    2
  ),
  (
    'สัปดาห์กล่องนมกู้โลก (Milk Carton Week)',
    'นำกล่องนมโรงเรียนที่ล้างสะอาดและพับแบนมาส่ง รับแต้มสะสมพิเศษ 3 เท่า (x3)',
    'target_item',
    3.00,
    0,
    NULL,
    NULL,
    NULL,
    true,
    '🥛 กล่องนมพับแบนแต้ม x3',
    3
  ),
  (
    'ภารกิจคลีนบ้านส่งโรงเรียน (Home-to-School Quest)',
    'รวบรวมขยะรีไซเคิลจากบ้านใส่ถุงมาส่งทุกเช้าวันจันทร์ ลุ้นรางวัลพิเศษและถ้วยเกียรติยศห้องเรียน',
    'home_quest',
    1.50,
    10,
    ARRAY[1], -- วันจันทร์ (1)
    '07:30:00',
    '08:30:00',
    true,
    '🏡 คลีนบ้านรับโบนัส +10 แต้ม',
    4
  )
ON CONFLICT DO NOTHING;
