-- ===============================================================
-- Migration 078: Kampai Hero System Database Optimizations
-- ===============================================================

-- 1. สร้างฟังก์ชัน RPC สำหรับดึงข้อมูล 10 อันดับแรกของฮีโร่ความดี (เพื่อล้างความล่าช้าใน Carousel)
CREATE OR REPLACE FUNCTION public.get_top_heroes(limit_val int DEFAULT 10)
RETURNS TABLE (
  student_id UUID,
  name TEXT,
  class TEXT,
  photo_url TEXT,
  total_xp BIGINT,
  deeds_count BIGINT
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as student_id,
    s.name,
    s.class,
    s.photo_url,
    COALESCE(SUM(CASE WHEN cs.type = 'add' THEN cs.score ELSE -cs.score END), 0)::BIGINT as total_xp,
    COALESCE(COUNT(cs.id) FILTER (WHERE cs.type = 'add'), 0)::BIGINT as deeds_count
  FROM public.students s
  LEFT JOIN public.conduct_scores cs ON s.id = cs.student_id
  WHERE s.is_active = true
  GROUP BY s.id, s.name, s.class, s.photo_url
  HAVING COALESCE(SUM(CASE WHEN cs.type = 'add' THEN cs.score ELSE -cs.score END), 0) > 0
  ORDER BY total_xp DESC, deeds_count DESC
  LIMIT limit_val;
END;
$$ LANGUAGE plpgsql;

-- 2. สร้างฟังก์ชัน RPC สำหรับรวมคะแนนความดีทั้งห้องเรียนตามภาคเรียน/ปีการศึกษาที่กำลังใช้งาน
CREATE OR REPLACE FUNCTION public.get_classroom_xp_sum(
  class_name TEXT,
  room_name TEXT,
  sem TEXT DEFAULT NULL,
  year TEXT DEFAULT NULL
)
RETURNS BIGINT SECURITY DEFINER AS $$
DECLARE
  active_sem TEXT := sem;
  active_year TEXT := year;
  total_sum BIGINT;
BEGIN
  -- ดึงค่าตั้งค่าระบบปัจจุบันหากไม่มีการส่งมา
  IF active_sem IS NULL THEN
    SELECT value INTO active_sem FROM public.school_settings WHERE key = 'active_semester';
  END IF;
  IF active_year IS NULL THEN
    SELECT value INTO active_year FROM public.school_settings WHERE key = 'active_academic_year';
  END IF;
  
  -- Fallback หากไม่มีการระบุค่า
  active_sem := COALESCE(active_sem, '1');
  active_year := COALESCE(active_year, (EXTRACT(YEAR FROM NOW()) + 543)::TEXT);

  -- รวมแต้มสุทธิ (ห้ามต่ำกว่า 0) ของนักเรียนทุกคนในห้องเรียน
  SELECT COALESCE(SUM(student_net_xp), 0) INTO total_sum
  FROM (
    SELECT 
      s.id,
      GREATEST(0, COALESCE(SUM(CASE WHEN cs.type = 'add' THEN cs.score ELSE -cs.score END), 0)) as student_net_xp
    FROM public.students s
    LEFT JOIN public.conduct_scores cs ON s.id = cs.student_id 
      AND cs.semester = active_sem 
      AND cs.academic_year = active_year
    WHERE s.class = class_name 
      AND s.room = room_name 
      AND s.is_active = true
    GROUP BY s.id
  ) sub;
  
  RETURN total_sum;
END;
$$ LANGUAGE plpgsql;

-- 3. กำหนดสิทธิ์ให้ผู้ใช้ทั่วไป (anon / authenticated) สามารถเรียกใช้งาน RPC ได้
GRANT EXECUTE ON FUNCTION public.get_top_heroes(int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_classroom_xp_sum(text, text, text, text) TO anon, authenticated;
