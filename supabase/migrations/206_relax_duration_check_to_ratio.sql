-- Replace fixed-threshold duration_too_short anti-cheat check with a points/sec ratio.
-- The old check (duration_sec < 5 AND score > 100) has the same fragile-constant shape
-- that already needed one bump in 096 (rate limit 20s -> 5s): math-jumper sessions cluster
-- with max recorded score sitting exactly at 100 for duration_sec < 5, the classic signature
-- of a hard cutoff silently censoring legitimate fast/high-scoring plays above it.
--
-- Calibrated against real game_sessions data (lkpqssbqxxpasidfqhpb): highest legitimate
-- score/duration ratio observed across all games is 217.1 (ai-hand-gesture-game,
-- score 13460 / 62s) -- a continuous-scoring game type the old fixed constant never
-- anticipated. Ratio threshold set well above that with safety margin; score floor keeps
-- low-score reflex-game finishes untouched.
CREATE OR REPLACE FUNCTION public.record_game_session(
  p_student_code  TEXT,
  p_game_slug     TEXT,
  p_score         INT,
  p_mode          TEXT DEFAULT NULL,
  p_duration_sec  INT DEFAULT NULL,
  p_metadata      JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id   UUID;
  v_hub_item_id  UUID;
  v_subject      TEXT;
  v_session_id   UUID;
  v_xp_earned    INT;
  v_total_xp     INT;
  v_unlocked     JSONB := '[]'::jsonb;
  v_new_xp_bonus INT;
BEGIN
  -- 1) resolve student
  SELECT id INTO v_student_id
  FROM public.students
  WHERE student_code = p_student_code
    AND COALESCE(is_active, true) = true;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'student_not_found' USING ERRCODE = 'P0001';
  END IF;

  -- 2) sanity checks
  IF p_score IS NULL OR p_score < 0 OR p_score > 1000000 THEN
    RAISE EXCEPTION 'invalid_score' USING ERRCODE = 'P0001';
  END IF;
  IF p_duration_sec IS NOT NULL AND p_duration_sec > 0
     AND p_score > 300
     AND (p_score::numeric / p_duration_sec) > 500 THEN
    RAISE EXCEPTION 'duration_too_short' USING ERRCODE = 'P0001';
  END IF;

  -- 3) rate-limit: 1 session per 5s per (student, game)
  IF EXISTS (
    SELECT 1 FROM public.game_sessions
    WHERE student_id = v_student_id
      AND game_slug  = p_game_slug
      AND created_at > now() - interval '5 seconds'
  ) THEN
    RAISE EXCEPTION 'rate_limited' USING ERRCODE = 'P0001';
  END IF;

  -- 4) resolve hub item for FK linkage (best-effort)
  SELECT id, subject INTO v_hub_item_id, v_subject
  FROM public.educational_hub_items
  WHERE game_slug = p_game_slug
    AND tracked_game = true
  LIMIT 1;

  -- 5) XP = floor(score / 10), min 1
  v_xp_earned := GREATEST(1, p_score / 10);

  -- 6) insert session
  INSERT INTO public.game_sessions
    (student_id, game_slug, edu_hub_item_id, score, mode, duration_sec, xp_earned, metadata)
  VALUES
    (v_student_id, p_game_slug, v_hub_item_id, p_score, p_mode, p_duration_sec, v_xp_earned, COALESCE(p_metadata,'{}'::jsonb))
  RETURNING id INTO v_session_id;

  -- 7) unlock badges (stats includes the just-inserted session)
  WITH s AS (
    SELECT * FROM public.game_student_stats
    WHERE student_id = v_student_id AND game_slug = p_game_slug
  ),
  cands AS (
    SELECT c.id, c.code, c.title_th, c.icon, c.xp_bonus
    FROM public.game_achievements_catalog c, s
    WHERE c.game_slug = p_game_slug
      AND (
        (c.threshold_kind = 'first_play'        AND s.plays_count >= 1)
        OR (c.threshold_kind = 'score_gte'      AND s.personal_best >= c.threshold_value)
        OR (c.threshold_kind = 'plays_gte'      AND s.plays_count   >= c.threshold_value)
        OR (c.threshold_kind = 'improvement_ratio'
            AND s.plays_count >= 6 AND s.first_5_avg > 0
            AND s.last_5_avg / s.first_5_avg >= c.threshold_value)
        OR (c.threshold_kind = 'streak_days'
            AND (
              SELECT COUNT(DISTINCT (created_at AT TIME ZONE 'Asia/Bangkok')::date)
              FROM public.game_sessions
              WHERE student_id = v_student_id
                AND game_slug  = p_game_slug
                AND created_at > now() - (c.threshold_value || ' days')::interval
            ) >= c.threshold_value)
      )
  ),
  ins AS (
    INSERT INTO public.game_student_achievements (student_id, achievement_id, session_id)
    SELECT v_student_id, id, v_session_id FROM cands
    ON CONFLICT (student_id, achievement_id) DO NOTHING
    RETURNING achievement_id
  )
  SELECT
    COALESCE(jsonb_agg(jsonb_build_object(
      'code', c.code,
      'title', c.title_th,
      'icon', c.icon,
      'xp_bonus', c.xp_bonus
    )), '[]'::jsonb),
    COALESCE(SUM(c.xp_bonus), 0)
  INTO v_unlocked, v_new_xp_bonus
  FROM ins
  JOIN cands c ON c.id = ins.achievement_id;

  -- 8) apply xp_bonus to session
  IF v_new_xp_bonus > 0 THEN
    UPDATE public.game_sessions
       SET xp_earned = xp_earned + v_new_xp_bonus
     WHERE id = v_session_id;
    v_xp_earned := v_xp_earned + v_new_xp_bonus;
  END IF;

  -- 9) get total xp
  SELECT total_xp INTO v_total_xp
  FROM public.game_student_stats
  WHERE student_id = v_student_id AND game_slug = p_game_slug;

  RETURN jsonb_build_object(
    'session_id', v_session_id,
    'xp_earned',  v_xp_earned,
    'total_xp',   COALESCE(v_total_xp, v_xp_earned),
    'unlocked',   v_unlocked,
    'subject',    v_subject
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_game_session(TEXT, TEXT, INT, TEXT, INT, JSONB)
  TO anon, authenticated;
