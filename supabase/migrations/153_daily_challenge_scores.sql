-- ===============================================================
-- Migration 153: Daily Challenge scores (Phase 3a)
-- ===============================================================
-- ความท้าทายรายวัน: โจทย์ชุดเดียวกันทุกคน (seed = yyyymmdd ของไทย)
-- เล่นได้ครั้งเดียว/วัน — บันทึก score + correct + duration
-- รีเซ็ตเที่ยงคืน Asia/Bangkok
-- ===============================================================

CREATE TABLE IF NOT EXISTS public.daily_challenge_scores (
  challenge_date date NOT NULL,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  game_slug text NOT NULL DEFAULT 'multiply-race',
  score int NOT NULL,
  correct_count int NOT NULL,
  total_questions int NOT NULL DEFAULT 10,
  duration_sec int,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (challenge_date, student_id, game_slug)
);

CREATE INDEX IF NOT EXISTS idx_dcs_leaderboard
  ON public.daily_challenge_scores(game_slug, challenge_date, score DESC, completed_at);

ALTER TABLE public.daily_challenge_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teacher_read_daily_challenge" ON public.daily_challenge_scores;
CREATE POLICY "teacher_read_daily_challenge" ON public.daily_challenge_scores
  FOR SELECT USING (public.is_teacher());

COMMENT ON TABLE public.daily_challenge_scores IS 'Daily Challenge รายเกม — 1 row ต่อ (วัน, นักเรียน, เกม)';

-- helper: วันที่ปัจจุบันใน Asia/Bangkok
CREATE OR REPLACE FUNCTION public.bkk_today()
RETURNS date
LANGUAGE sql STABLE
AS $$ SELECT (now() AT TIME ZONE 'Asia/Bangkok')::date; $$;

-- ─── RPC: ส่งคะแนน Daily Challenge (idempotent — เล่นได้ครั้งเดียว/วัน) ──
CREATE OR REPLACE FUNCTION public.submit_daily_challenge_score(
  p_student_code text,
  p_game_slug text,
  p_score int,
  p_correct int,
  p_total int DEFAULT 10,
  p_duration_sec int DEFAULT NULL
)
RETURNS TABLE (
  challenge_date date,
  score int,
  correct_count int,
  was_first boolean                                          -- true = บันทึกครั้งแรก, false = เคยเล่นแล้ว
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
  v_today date := public.bkk_today();
  v_was_first boolean;
BEGIN
  SELECT id INTO v_student_id FROM public.students s WHERE s.student_code = p_student_code AND s.is_active = true LIMIT 1;
  IF v_student_id IS NULL THEN RETURN; END IF;

  -- ใช้ NOT EXISTS — SELECT INTO ส่ง NULL ตอนไม่มี row ทำให้ IF NOT NULL = NULL พัง logic
  v_was_first := NOT EXISTS (
    SELECT 1 FROM public.daily_challenge_scores d
     WHERE d.challenge_date = v_today AND d.student_id = v_student_id AND d.game_slug = p_game_slug
  );

  IF v_was_first THEN
    INSERT INTO public.daily_challenge_scores (challenge_date, student_id, game_slug, score, correct_count, total_questions, duration_sec)
    VALUES (v_today, v_student_id, p_game_slug, p_score, p_correct, p_total, p_duration_sec);
  END IF;

  RETURN QUERY
    SELECT d.challenge_date, d.score, d.correct_count, v_was_first AS was_first
      FROM public.daily_challenge_scores d
     WHERE d.challenge_date = v_today AND d.student_id = v_student_id AND d.game_slug = p_game_slug;
END;
$$;

-- ─── RPC: leaderboard วันนี้ (top N + อันดับตัวเอง) ─────────────────────
CREATE OR REPLACE FUNCTION public.get_daily_challenge_leaderboard(
  p_game_slug text,
  p_student_code text DEFAULT NULL,
  p_limit int DEFAULT 10
)
RETURNS TABLE (
  rank int,
  student_id uuid,
  display_name text,
  photo_url text,
  class_label text,
  score int,
  correct_count int,
  duration_sec int,
  completed_at timestamptz,
  is_me boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := public.bkk_today();
  v_me uuid;
BEGIN
  IF p_student_code IS NOT NULL THEN
    SELECT id INTO v_me FROM public.students s WHERE s.student_code = p_student_code AND s.is_active = true LIMIT 1;
  END IF;

  RETURN QUERY
    SELECT
      ROW_NUMBER() OVER (ORDER BY d.score DESC, d.completed_at ASC)::int AS rank,
      d.student_id,
      s.name AS display_name,
      s.photo_url,
      s."class" AS class_label,
      d.score,
      d.correct_count,
      d.duration_sec,
      d.completed_at,
      (d.student_id = v_me) AS is_me
    FROM public.daily_challenge_scores d
    JOIN public.students s ON s.id = d.student_id
    WHERE d.challenge_date = v_today AND d.game_slug = p_game_slug
      AND COALESCE(s.is_active, true) = true
    ORDER BY d.score DESC, d.completed_at ASC
    LIMIT GREATEST(p_limit, 1);
END;
$$;

-- ─── RPC: เช็คว่าเคยเล่น Daily Challenge วันนี้หรือยัง ────────────────
CREATE OR REPLACE FUNCTION public.get_my_daily_status(
  p_student_code text,
  p_game_slug text
)
RETURNS TABLE (
  challenge_date date,
  played boolean,
  score int,
  correct_count int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
  v_today date := public.bkk_today();
BEGIN
  SELECT id INTO v_student_id FROM public.students s WHERE s.student_code = p_student_code AND s.is_active = true LIMIT 1;
  IF v_student_id IS NULL THEN
    RETURN QUERY SELECT v_today, false, 0, 0;
    RETURN;
  END IF;

  RETURN QUERY
    SELECT v_today, EXISTS(SELECT 1 FROM public.daily_challenge_scores d
       WHERE d.challenge_date = v_today AND d.student_id = v_student_id AND d.game_slug = p_game_slug) AS played,
       COALESCE((SELECT score FROM public.daily_challenge_scores d
         WHERE d.challenge_date = v_today AND d.student_id = v_student_id AND d.game_slug = p_game_slug), 0),
       COALESCE((SELECT correct_count FROM public.daily_challenge_scores d
         WHERE d.challenge_date = v_today AND d.student_id = v_student_id AND d.game_slug = p_game_slug), 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.bkk_today() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_daily_challenge_score(text, text, int, int, int, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_challenge_leaderboard(text, text, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_daily_status(text, text) TO anon, authenticated;
