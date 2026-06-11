-- ===============================================================
-- Migration 157: Leaderboard + Honor Profile RPCs (Gamification P4)
-- ===============================================================
-- อันดับ 3 แบบ (รวม / รายวิชา / รายสัปดาห์) + โปรไฟล์เหรียญรายนักเรียน
-- SECURITY DEFINER + anon — leaderboard เป็นสาธารณะภายในโรงเรียน
-- (pattern เดียวกับ get_game_leaderboard เดิม)
-- ===============================================================

-- ─── 1) อันดับ XP รวมทุกเกม ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_global_xp_leaderboard(
  p_limit int DEFAULT 10,
  p_student_code text DEFAULT NULL
)
RETURNS TABLE (
  rank int, student_id uuid, display_name text, photo_url text, class_label text,
  total_xp int, games_played int, medals_count int, is_me boolean
)
LANGUAGE plpgsql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_me uuid;
BEGIN
  IF p_student_code IS NOT NULL THEN
    SELECT id INTO v_me FROM public.students s
    WHERE s.student_code = p_student_code AND COALESCE(s.is_active, true) LIMIT 1;
  END IF;

  RETURN QUERY
  SELECT ROW_NUMBER() OVER (ORDER BY p.total_xp DESC, p.last_played_at ASC)::int AS rank,
         st.id, st.name, st.photo_url, st."class",
         p.total_xp, p.games_played,
         COALESCE(m.cnt, 0)::int AS medals_count,
         (st.id = v_me) AS is_me
  FROM public.student_global_profile p
  JOIN public.students st ON st.id = p.student_id AND COALESCE(st.is_active, true)
  LEFT JOIN (SELECT a.student_id AS sid, COUNT(*) AS cnt
             FROM public.game_student_achievements a GROUP BY a.student_id) m
    ON m.sid = p.student_id
  ORDER BY p.total_xp DESC, p.last_played_at ASC
  LIMIT GREATEST(p_limit, 1);
END;
$$;

-- ─── 2) อันดับรายวิชา (math / thai / english / other) ───────────────────
CREATE OR REPLACE FUNCTION public.get_subject_leaderboard(
  p_subject_key text,
  p_limit int DEFAULT 10,
  p_student_code text DEFAULT NULL
)
RETURNS TABLE (
  rank int, student_id uuid, display_name text, photo_url text, class_label text,
  xp int, is_me boolean
)
LANGUAGE plpgsql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_me uuid;
BEGIN
  IF p_student_code IS NOT NULL THEN
    SELECT id INTO v_me FROM public.students s
    WHERE s.student_code = p_student_code AND COALESCE(s.is_active, true) LIMIT 1;
  END IF;

  RETURN QUERY
  SELECT ROW_NUMBER() OVER (ORDER BY x.xp DESC)::int AS rank,
         st.id, st.name, st.photo_url, st."class",
         x.xp, (st.id = v_me) AS is_me
  FROM public.student_subject_xp x
  JOIN public.students st ON st.id = x.student_id AND COALESCE(st.is_active, true)
  WHERE x.subject_key = p_subject_key
  ORDER BY x.xp DESC
  LIMIT GREATEST(p_limit, 1);
END;
$$;

-- ─── 3) อันดับรายสัปดาห์ (จันทร์เริ่ม Asia/Bangkok — เด็กใหม่มีลุ้นทุกสัปดาห์) ─
CREATE OR REPLACE FUNCTION public.get_weekly_xp_leaderboard(
  p_limit int DEFAULT 10,
  p_student_code text DEFAULT NULL
)
RETURNS TABLE (
  rank int, student_id uuid, display_name text, photo_url text, class_label text,
  weekly_xp int, weekly_plays int, is_me boolean
)
LANGUAGE plpgsql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me uuid;
  v_week_start date := date_trunc('week', (now() AT TIME ZONE 'Asia/Bangkok'))::date;
BEGIN
  IF p_student_code IS NOT NULL THEN
    SELECT id INTO v_me FROM public.students s
    WHERE s.student_code = p_student_code AND COALESCE(s.is_active, true) LIMIT 1;
  END IF;

  RETURN QUERY
  SELECT ROW_NUMBER() OVER (ORDER BY w.xp DESC, w.last_at ASC)::int AS rank,
         st.id, st.name, st.photo_url, st."class",
         w.xp, w.plays, (st.id = v_me) AS is_me
  FROM (
    SELECT gs.student_id AS sid, COALESCE(SUM(gs.xp_earned), 0)::int AS xp,
           COUNT(*)::int AS plays, MAX(gs.created_at) AS last_at
    FROM public.game_sessions gs
    WHERE (gs.created_at AT TIME ZONE 'Asia/Bangkok')::date >= v_week_start
    GROUP BY gs.student_id
  ) w
  JOIN public.students st ON st.id = w.sid AND COALESCE(st.is_active, true)
  ORDER BY w.xp DESC, w.last_at ASC
  LIMIT GREATEST(p_limit, 1);
END;
$$;

-- ─── 4) โปรไฟล์เหรียญรายนักเรียน (HonorWall) ────────────────────────────
-- คืน jsonb เดียว: aggregates + เหรียญที่ปลดแล้ว + catalog เหรียญสากล
-- (client คำนวณ "ใกล้ปลดล็อก" เองจาก aggregates + thresholds)
CREATE OR REPLACE FUNCTION public.get_student_honor_profile(p_student_code text)
RETURNS jsonb
LANGUAGE plpgsql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me uuid;
  v_streak int := 0;
  v_result jsonb;
BEGIN
  SELECT id INTO v_me FROM public.students s
  WHERE s.student_code = p_student_code AND COALESCE(s.is_active, true) LIMIT 1;
  IF v_me IS NULL THEN RETURN NULL; END IF;

  -- streak ปัจจุบัน: วันติดกันนับถอยจากวันล่าสุดที่เล่น (ต้องเป็นวันนี้/เมื่อวาน)
  SELECT COUNT(*)::int INTO v_streak
  FROM (
    SELECT d, ROW_NUMBER() OVER (ORDER BY d DESC) AS rn, MAX(d) OVER () AS maxd
    FROM (SELECT DISTINCT (created_at AT TIME ZONE 'Asia/Bangkok')::date AS d
          FROM public.game_sessions WHERE student_id = v_me) dd
  ) t
  WHERE t.maxd >= (now() AT TIME ZONE 'Asia/Bangkok')::date - 1
    AND t.d = t.maxd - (t.rn - 1)::int;

  SELECT jsonb_build_object(
    'student', (SELECT jsonb_build_object('id', st.id, 'name', st.name,
                  'photoUrl', st.photo_url, 'classLabel', st."class")
                FROM public.students st WHERE st.id = v_me),
    'total_xp',     COALESCE((SELECT p.total_xp     FROM public.student_global_profile p WHERE p.student_id = v_me), 0),
    'games_played', COALESCE((SELECT p.games_played FROM public.student_global_profile p WHERE p.student_id = v_me), 0),
    'plays_count',  COALESCE((SELECT p.plays_count  FROM public.student_global_profile p WHERE p.student_id = v_me), 0),
    'streak_days',  v_streak,
    'subject_xp',   COALESCE((SELECT jsonb_object_agg(x.subject_key, x.xp)
                              FROM public.student_subject_xp x WHERE x.student_id = v_me), '{}'::jsonb),
    'aggregates', (
      SELECT jsonb_build_object(
        'games_distinct',  COUNT(DISTINCT gs.game_slug),
        'online_plays',    COUNT(*) FILTER (WHERE gs.mode = 'online'),
        'online_wins',     COUNT(*) FILTER (WHERE gs.mode = 'online' AND gs.metadata->>'rank' = '1'
                             AND COALESCE((gs.metadata->>'players')::int, 0) >= 2),
        'tournament_wins', COUNT(*) FILTER (WHERE gs.mode = 'online' AND gs.metadata->>'rank' = '1'
                             AND COALESCE((gs.metadata->>'players')::int, 0) >= 2
                             AND COALESCE(gs.metadata->>'tournament', 'false') IN ('true', '1')),
        'daily_plays',     COUNT(DISTINCT (gs.created_at AT TIME ZONE 'Asia/Bangkok')::date)
                             FILTER (WHERE gs.mode = 'daily'),
        'modes_distinct',  COUNT(DISTINCT CASE WHEN gs.mode = 'online' THEN 'online'
                             WHEN gs.mode = 'daily' THEN 'daily' ELSE 'solo' END),
        'subjects_distinct', (SELECT COUNT(*) FROM public.student_subject_xp x2 WHERE x2.student_id = v_me)
      )
      FROM public.game_sessions gs WHERE gs.student_id = v_me
    ),
    'medals', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'code', c.code, 'title', c.title_th, 'icon', c.icon, 'tier', c.tier,
        'game_slug', c.game_slug, 'unlocked_at', a.unlocked_at)
        ORDER BY a.unlocked_at DESC)
      FROM public.game_student_achievements a
      JOIN public.game_achievements_catalog c ON c.id = a.achievement_id
      WHERE a.student_id = v_me
    ), '[]'::jsonb),
    'universal_catalog', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'code', c.code, 'title', c.title_th, 'description', c.description_th,
        'icon', c.icon, 'tier', c.tier, 'kind', c.threshold_kind,
        'value', c.threshold_value, 'subject_key', c.subject_key)
        ORDER BY c.sort_order)
      FROM public.game_achievements_catalog c WHERE c.game_slug IS NULL
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_global_xp_leaderboard(int, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_subject_leaderboard(text, int, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_weekly_xp_leaderboard(int, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_honor_profile(text) TO anon, authenticated;
