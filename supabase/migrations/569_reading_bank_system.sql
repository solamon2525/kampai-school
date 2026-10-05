-- 569_reading_bank_system.sql
-- Create "ธนาคารการอ่าน" (Reading Bank) for Ban Kamphai School
-- Tracks reading logs, pages, books, ratings, teacher verification, and points

CREATE TABLE IF NOT EXISTS public.reading_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_class TEXT,
  book_title TEXT NOT NULL,
  book_author TEXT,
  book_category TEXT NOT NULL DEFAULT 'นิทาน/วรรณกรรม',
  pages_read INT NOT NULL CHECK (pages_read > 0),
  summary_notes TEXT,
  rating INT NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  reading_date DATE NOT NULL DEFAULT CURRENT_DATE,
  points_earned INT NOT NULL DEFAULT 0 CHECK (points_earned >= 0),
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  recorded_by TEXT,
  recorded_by_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  academic_year TEXT,
  semester TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reading_logs_student ON public.reading_logs(student_id, reading_date DESC);
CREATE INDEX IF NOT EXISTS idx_reading_logs_term ON public.reading_logs(academic_year, semester);
CREATE INDEX IF NOT EXISTS idx_reading_logs_status ON public.reading_logs(status);

ALTER TABLE public.reading_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reading_logs' AND policyname = 'Public read reading_logs'
  ) THEN
    CREATE POLICY "Public read reading_logs" ON public.reading_logs FOR SELECT TO anon, authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reading_logs' AND policyname = 'Staff manage reading_logs'
  ) THEN
    CREATE POLICY "Staff manage reading_logs" ON public.reading_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

GRANT SELECT, INSERT ON public.reading_logs TO anon, authenticated;
GRANT ALL ON public.reading_logs TO authenticated;

-- Auto-tag academic_year and semester
CREATE OR REPLACE FUNCTION public.reading_logs_auto_term()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_term RECORD;
BEGIN
  IF NEW.academic_year IS NULL OR NEW.semester IS NULL THEN
    SELECT year, sem INTO v_term FROM public.active_term();
    NEW.academic_year := COALESCE(NEW.academic_year, v_term.year);
    NEW.semester := COALESCE(NEW.semester, v_term.sem);
  END IF;

  IF NEW.points_earned IS NULL OR NEW.points_earned = 0 THEN
    NEW.points_earned := NEW.pages_read;
  END IF;

  -- Also award 15 Bond XP to the student's equipped pet when reading!
  IF NEW.status = 'approved' AND NEW.student_id IS NOT NULL THEN
    UPDATE public.student_pets
    SET bond_xp = bond_xp + 15, updated_at = NOW()
    WHERE student_id = NEW.student_id AND is_equipped = true;
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_reading_logs_auto_term'
  ) THEN
    CREATE TRIGGER trg_reading_logs_auto_term
      BEFORE INSERT ON public.reading_logs
      FOR EACH ROW
      EXECUTE FUNCTION public.reading_logs_auto_term();
  END IF;
END $$;

-- Summary View for Reading Bank
CREATE OR REPLACE VIEW public.reading_student_summary AS
WITH term AS (SELECT year, sem FROM public.active_term())
SELECT
  s.id AS student_id,
  s.name AS full_name,
  s.class AS class_name,
  s.photo_url,
  s.student_code,
  COALESCE(COUNT(rl.id) FILTER (WHERE rl.status = 'approved'), 0)::int AS total_books,
  COALESCE(SUM(rl.pages_read) FILTER (WHERE rl.status = 'approved'), 0)::int AS total_pages,
  COALESCE(SUM(rl.points_earned) FILTER (WHERE rl.status = 'approved'), 0)::int AS total_points,
  CASE
    WHEN COALESCE(COUNT(rl.id) FILTER (WHERE rl.status = 'approved'), 0) >= 50 OR COALESCE(SUM(rl.pages_read) FILTER (WHERE rl.status = 'approved'), 0) >= 1000 THEN 'ปราชญ์แห่งคำไผ่ 👑'
    WHEN COALESCE(COUNT(rl.id) FILTER (WHERE rl.status = 'approved'), 0) >= 25 OR COALESCE(SUM(rl.pages_read) FILTER (WHERE rl.status = 'approved'), 0) >= 500 THEN 'ยอดนักอ่าน 🌟'
    WHEN COALESCE(COUNT(rl.id) FILTER (WHERE rl.status = 'approved'), 0) >= 10 OR COALESCE(SUM(rl.pages_read) FILTER (WHERE rl.status = 'approved'), 0) >= 200 THEN 'หนอนหนังสือตัวน้อย 📖'
    WHEN COALESCE(COUNT(rl.id) FILTER (WHERE rl.status = 'approved'), 0) >= 1 THEN 'ต้นกล้านักอ่าน 🌱'
    ELSE 'พร้อมเริ่มอ่าน 🌱'
  END AS reading_tier
FROM public.students s
CROSS JOIN term
LEFT JOIN public.reading_logs rl ON rl.student_id = s.id AND rl.academic_year = term.year AND rl.semester = term.sem
WHERE s.is_active = true
GROUP BY s.id, s.name, s.class, s.photo_url, s.student_code;

GRANT SELECT ON public.reading_student_summary TO anon, authenticated;

-- Public Leaderboard RPC
CREATE OR REPLACE FUNCTION public.get_public_reading_leaderboard(p_limit INT DEFAULT 50, p_offset INT DEFAULT 0)
RETURNS TABLE (
  student_id UUID,
  full_name TEXT,
  class_name TEXT,
  photo_url TEXT,
  total_books INT,
  total_pages INT,
  total_points INT,
  reading_tier TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    s.student_id,
    s.full_name,
    s.class_name,
    s.photo_url,
    s.total_books,
    s.total_pages,
    s.total_points,
    s.reading_tier
  FROM public.reading_student_summary s
  WHERE s.total_books > 0
  ORDER BY s.total_pages DESC, s.total_books DESC, s.full_name ASC
  LIMIT p_limit OFFSET p_offset
$$;

GRANT EXECUTE ON FUNCTION public.get_public_reading_leaderboard(INT, INT) TO anon, authenticated;

-- Public Lookup student reading summary by code
CREATE OR REPLACE FUNCTION public.lookup_student_reading(p_code TEXT)
RETURNS TABLE (
  student_id UUID,
  full_name TEXT,
  class_name TEXT,
  photo_url TEXT,
  student_code TEXT,
  total_books INT,
  total_pages INT,
  total_points INT,
  reading_tier TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    s.student_id,
    s.full_name,
    s.class_name,
    s.photo_url,
    s.student_code,
    s.total_books,
    s.total_pages,
    s.total_points,
    s.reading_tier
  FROM public.reading_student_summary s
  WHERE btrim(s.student_code) = btrim(p_code)
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.lookup_student_reading(TEXT) TO anon, authenticated;

-- Public Lookup student reading history
CREATE OR REPLACE FUNCTION public.get_student_reading_history(p_code TEXT, p_limit INT DEFAULT 50)
RETURNS TABLE (
  id UUID,
  book_title TEXT,
  book_author TEXT,
  book_category TEXT,
  pages_read INT,
  summary_notes TEXT,
  rating INT,
  reading_date DATE,
  points_earned INT,
  status TEXT,
  recorded_by TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    rl.id,
    rl.book_title,
    rl.book_author,
    rl.book_category,
    rl.pages_read,
    rl.summary_notes,
    rl.rating,
    rl.reading_date,
    rl.points_earned,
    rl.status,
    rl.recorded_by,
    rl.created_at
  FROM public.reading_logs rl
  JOIN public.students s ON s.id = rl.student_id
  WHERE btrim(s.student_code) = btrim(p_code)
  ORDER BY rl.reading_date DESC, rl.created_at DESC
  LIMIT p_limit
$$;

GRANT EXECUTE ON FUNCTION public.get_student_reading_history(TEXT, INT) TO anon, authenticated;

-- RPC to record a reading entry (from teacher or student code)
CREATE OR REPLACE FUNCTION public.record_reading_entry(
  p_code TEXT,
  p_book_title TEXT,
  p_book_author TEXT DEFAULT NULL,
  p_book_category TEXT DEFAULT 'นิทาน/วรรณกรรม',
  p_pages_read INT DEFAULT 1,
  p_summary_notes TEXT DEFAULT NULL,
  p_rating INT DEFAULT 5,
  p_recorded_by TEXT DEFAULT NULL,
  p_recorded_by_staff_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student RECORD;
  v_id UUID;
BEGIN
  IF p_pages_read IS NULL OR p_pages_read <= 0 THEN
    RAISE EXCEPTION 'READING_INVALID_PAGES';
  END IF;

  SELECT id, name, class INTO v_student
  FROM public.students
  WHERE btrim(student_code) = btrim(p_code) AND is_active = true
  LIMIT 1;

  IF v_student.id IS NULL THEN
    RAISE EXCEPTION 'STUDENT_NOT_FOUND';
  END IF;

  INSERT INTO public.reading_logs (
    student_id,
    student_name,
    student_class,
    book_title,
    book_author,
    book_category,
    pages_read,
    summary_notes,
    rating,
    reading_date,
    points_earned,
    status,
    recorded_by,
    recorded_by_staff_id
  )
  VALUES (
    v_student.id,
    v_student.name,
    v_student.class,
    btrim(p_book_title),
    p_book_author,
    COALESCE(p_book_category, 'นิทาน/วรรณกรรม'),
    p_pages_read,
    p_summary_notes,
    COALESCE(p_rating, 5),
    CURRENT_DATE,
    p_pages_read,
    'approved',
    COALESCE(p_recorded_by, 'บันทึกผ่านระบบคำไผ่รักการอ่าน'),
    p_recorded_by_staff_id
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_reading_entry(TEXT, TEXT, TEXT, TEXT, INT, TEXT, INT, TEXT, UUID) TO anon, authenticated;
