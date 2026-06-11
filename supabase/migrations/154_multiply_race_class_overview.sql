-- ===============================================================
-- Migration 154: Multiply Race — Teacher Dashboard RPCs (Phase 4)
-- ===============================================================
-- get_multiply_race_class_overview: รวมข้อมูลรายนักเรียน
--   (correct/wrong/badges/weakest_table/last_played + daily today)
-- get_multiply_race_table_heatmap: เปอร์เซ็นต์ผิดรายแม่ ทั้งโรงเรียน/รายชั้น
--
-- ใช้ใน teacher dashboard /teacher/games/multiply-race
-- ===============================================================

CREATE OR REPLACE FUNCTION public.get_multiply_race_class_overview(
  p_class_filter text DEFAULT NULL
)
RETURNS TABLE (
  student_id uuid,
  student_code text,
  display_name text,
  class_label text,
  total_correct int,
  total_wrong int,
  badge_bronze int,
  badge_silver int,
  badge_gold int,
  weakest_table int,
  last_played_at timestamptz,
  daily_played_today boolean,
  daily_score_today int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := public.bkk_today();
BEGIN
  RETURN QUERY
    SELECT
      s.id AS student_id,
      s.student_code,
      s.name AS display_name,
      s."class" AS class_label,
      COALESCE(SUM(m.correct_count), 0)::int AS total_correct,
      COALESCE(SUM(m.wrong_count), 0)::int AS total_wrong,
      COUNT(*) FILTER (WHERE m.badge_level >= 1)::int AS badge_bronze,
      COUNT(*) FILTER (WHERE m.badge_level >= 2)::int AS badge_silver,
      COUNT(*) FILTER (WHERE m.badge_level >= 3)::int AS badge_gold,
      (SELECT m2.table_num FROM public.multiply_race_mastery m2
        WHERE m2.student_id = s.id AND m2.wrong_count > 0
        ORDER BY m2.wrong_count DESC LIMIT 1) AS weakest_table,
      MAX(m.last_practiced_at) AS last_played_at,
      EXISTS(SELECT 1 FROM public.daily_challenge_scores d
        WHERE d.student_id = s.id AND d.game_slug = 'multiply-race' AND d.challenge_date = v_today) AS daily_played_today,
      COALESCE((SELECT d.score FROM public.daily_challenge_scores d
        WHERE d.student_id = s.id AND d.game_slug = 'multiply-race' AND d.challenge_date = v_today), 0) AS daily_score_today
    FROM public.students s
    LEFT JOIN public.multiply_race_mastery m ON m.student_id = s.id
    WHERE COALESCE(s.is_active, true) = true
      AND (p_class_filter IS NULL OR s."class" = p_class_filter)
    GROUP BY s.id, s.student_code, s.name, s."class"
    HAVING COALESCE(SUM(m.correct_count + m.wrong_count), 0) > 0
        OR EXISTS(SELECT 1 FROM public.daily_challenge_scores d
              WHERE d.student_id = s.id AND d.game_slug = 'multiply-race' AND d.challenge_date = v_today)
    ORDER BY badge_gold DESC, badge_silver DESC, badge_bronze DESC, total_correct DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_multiply_race_table_heatmap(
  p_class_filter text DEFAULT NULL
)
RETURNS TABLE (
  table_num int,
  total_correct int,
  total_wrong int,
  total_attempts int,
  wrong_pct numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT
      t.n::int AS table_num,
      COALESCE(SUM(m.correct_count), 0)::int AS total_correct,
      COALESCE(SUM(m.wrong_count), 0)::int AS total_wrong,
      COALESCE(SUM(m.correct_count + m.wrong_count), 0)::int AS total_attempts,
      CASE
        WHEN COALESCE(SUM(m.correct_count + m.wrong_count), 0) = 0 THEN 0
        ELSE ROUND(100.0 * SUM(m.wrong_count) / SUM(m.correct_count + m.wrong_count), 1)
      END AS wrong_pct
    FROM generate_series(2, 12) AS t(n)
    LEFT JOIN public.multiply_race_mastery m ON m.table_num = t.n
    LEFT JOIN public.students s ON s.id = m.student_id
      AND COALESCE(s.is_active, true) = true
      AND (p_class_filter IS NULL OR s."class" = p_class_filter)
    GROUP BY t.n
    ORDER BY t.n;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_multiply_race_class_overview(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_multiply_race_table_heatmap(text) TO authenticated;
