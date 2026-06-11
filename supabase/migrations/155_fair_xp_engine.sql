-- ===============================================================
-- Migration 155: Fair XP Engine + Global Profile (Gamification P0+P1)
-- ===============================================================
-- ปัญหาเดิม: XP = score/10 → เกมสเกลคะแนนต่าง (pizza 20k vs listen-spell 20)
-- ได้ XP ต่างกันมหาศาลทั้งที่เก่งเท่ากัน
--
-- ใหม่: XP = base(10) + perf(0..20 เทียบ median ของเกมตัวเอง) + mode bonus
--       + diminishing เกมเดิมเกิน 10 รอบ/วัน ได้แค่ base (ผลักให้เล่นหลายเกม)
-- + recompute ย้อนหลังทุก session (user เลือกความยุติธรรมตั้งแต่วันแรก)
-- + subject_keys mapping (คณิต/ไทย/อังกฤษ เป็นวิชาหลัก) + global profile views
-- ===============================================================

-- ─── 1) Baseline คะแนนต่อเกม (median/p75/p90 จาก sessions จริง) ─────────
CREATE TABLE IF NOT EXISTS public.game_score_baseline (
  game_slug text PRIMARY KEY,
  median_score numeric,
  p75_score numeric,
  p90_score numeric,
  sample_count int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.game_score_baseline ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_baseline" ON public.game_score_baseline;
CREATE POLICY "read_baseline" ON public.game_score_baseline FOR SELECT USING (true);

COMMENT ON TABLE public.game_score_baseline IS 'Percentile คะแนนรายเกม — ใช้ normalize XP ให้ยุติธรรมข้ามเกม (refresh ทุก insert ใน record_game_session)';

CREATE OR REPLACE FUNCTION public.refresh_game_score_baseline(p_game_slug text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.game_score_baseline (game_slug, median_score, p75_score, p90_score, sample_count, updated_at)
  SELECT p_game_slug,
         percentile_cont(0.5)  WITHIN GROUP (ORDER BY score),
         percentile_cont(0.75) WITHIN GROUP (ORDER BY score),
         percentile_cont(0.9)  WITHIN GROUP (ORDER BY score),
         COUNT(*), now()
  FROM public.game_sessions WHERE game_slug = p_game_slug
  ON CONFLICT (game_slug) DO UPDATE SET
    median_score = EXCLUDED.median_score,
    p75_score    = EXCLUDED.p75_score,
    p90_score    = EXCLUDED.p90_score,
    sample_count = EXCLUDED.sample_count,
    updated_at   = now();
$$;

-- ─── 2) Subject normalization (วิชา free text → key) ─────────────────────
-- math/thai/english = วิชาหลัก · ที่เหลือ = other
-- "บูรณาการ (ไทย+อังกฤษ)" → {thai, english} (นับให้ทั้งคู่)
CREATE OR REPLACE FUNCTION public.subject_keys(p_subject text)
RETURNS text[]
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_subject IS NULL THEN ARRAY['other']
    WHEN p_subject NOT LIKE '%คณิต%' AND p_subject NOT LIKE '%ไทย%' AND p_subject NOT LIKE '%อังกฤษ%'
      THEN ARRAY['other']
    ELSE ARRAY(SELECT k FROM (VALUES
        ('math',    p_subject LIKE '%คณิต%'),
        ('thai',    p_subject LIKE '%ไทย%'),
        ('english', p_subject LIKE '%อังกฤษ%')
      ) AS v(k, hit) WHERE hit)
  END;
$$;

-- ─── 3) Views: โปรไฟล์รวมข้ามเกม + XP รายวิชา ───────────────────────────
CREATE OR REPLACE VIEW public.student_global_profile AS
SELECT student_id,
       COALESCE(SUM(xp_earned), 0)::int AS total_xp,
       COUNT(DISTINCT game_slug)::int   AS games_played,
       COUNT(*)::int                    AS plays_count,
       MAX(created_at)                  AS last_played_at,
       COUNT(DISTINCT (created_at AT TIME ZONE 'Asia/Bangkok')::date)::int AS active_days
FROM public.game_sessions
GROUP BY student_id;

CREATE OR REPLACE VIEW public.student_subject_xp AS
SELECT gs.student_id, sk.key AS subject_key, COALESCE(SUM(gs.xp_earned), 0)::int AS xp
FROM public.game_sessions gs
JOIN (SELECT DISTINCT ON (game_slug) game_slug, subject
      FROM public.educational_hub_items
      WHERE tracked_game = true AND game_slug IS NOT NULL) h
  ON h.game_slug = gs.game_slug
CROSS JOIN LATERAL unnest(public.subject_keys(h.subject)) AS sk(key)
GROUP BY gs.student_id, sk.key;

GRANT SELECT ON public.student_global_profile TO anon, authenticated;
GRANT SELECT ON public.student_subject_xp TO anon, authenticated;

-- ─── 4) Indexes ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_game_sessions_student_created ON public.game_sessions(student_id, created_at);
CREATE INDEX IF NOT EXISTS idx_game_sessions_slug ON public.game_sessions(game_slug);

-- ─── 5) record_game_session — สูตร XP ใหม่ (unlock CTE เดิมคงไว้ — ขยายใน 156) ─
CREATE OR REPLACE FUNCTION public.record_game_session(
  p_student_code text, p_game_slug text, p_score integer,
  p_mode text DEFAULT NULL, p_duration_sec integer DEFAULT NULL, p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_student_id   UUID;
  v_hub_item_id  UUID;
  v_subject      TEXT;
  v_session_id   UUID;
  v_xp_earned    INT;
  v_total_xp     INT;
  v_unlocked     JSONB := '[]'::jsonb;
  v_new_xp_bonus INT;
  v_median       NUMERIC;
  v_sample       INT;
  v_base         INT;
  v_ratio        NUMERIC;
  v_perf         INT;
  v_mode_bonus   INT := 0;
  v_today_plays  INT;
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
  IF p_duration_sec IS NOT NULL AND p_duration_sec < 5 AND p_score > 100 THEN
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

  -- 5) Fair XP: base + perf (เทียบ median ของเกมตัวเอง) + mode bonus + diminishing/วัน
  SELECT median_score, sample_count INTO v_median, v_sample
  FROM public.game_score_baseline WHERE game_slug = p_game_slug;

  v_base := 10;
  IF p_duration_sec IS NOT NULL AND p_duration_sec < 20
     AND v_median IS NOT NULL AND v_median > 0 AND p_score < v_median * 0.2 THEN
    v_base := 2;   -- จบไวผิดปกติ + คะแนนต่ำกว่า 20% ของ median → กันฟาร์ม
  END IF;

  IF v_sample IS NULL OR v_sample < 10 OR v_median IS NULL OR v_median <= 0 THEN
    v_ratio := 1.0;   -- ข้อมูลน้อย/median 0 → กลาง ๆ ไว้ก่อน
  ELSE
    v_ratio := LEAST(p_score / v_median, 2.0);
  END IF;
  v_perf := ROUND(10 * v_ratio)::int;   -- 0..20

  IF p_mode = 'online' THEN
    v_mode_bonus := 3;
    IF COALESCE(p_metadata->>'rank', '') = '1' AND COALESCE((p_metadata->>'players')::int, 0) >= 2 THEN
      v_mode_bonus := v_mode_bonus +
        CASE WHEN COALESCE(p_metadata->>'tournament', 'false') IN ('true', '1') THEN 5 ELSE 2 END;
    END IF;
  ELSIF p_mode = 'daily' THEN
    v_mode_bonus := 3;
  END IF;

  SELECT COUNT(*) INTO v_today_plays
  FROM public.game_sessions
  WHERE student_id = v_student_id AND game_slug = p_game_slug
    AND (created_at AT TIME ZONE 'Asia/Bangkok')::date = (now() AT TIME ZONE 'Asia/Bangkok')::date;

  IF v_today_plays >= 10 THEN
    v_xp_earned := v_base;   -- เกมเดิมเกิน 10 รอบ/วัน → ฐานอย่างเดียว (เกมอื่นได้เต็มเสมอ)
  ELSE
    v_xp_earned := v_base + v_perf + v_mode_bonus;
  END IF;

  -- 6) insert session + refresh baseline ของเกมนี้
  INSERT INTO public.game_sessions
    (student_id, game_slug, edu_hub_item_id, score, mode, duration_sec, xp_earned, metadata)
  VALUES
    (v_student_id, p_game_slug, v_hub_item_id, p_score, p_mode, p_duration_sec, v_xp_earned, COALESCE(p_metadata, '{}'::jsonb))
  RETURNING id INTO v_session_id;

  PERFORM public.refresh_game_score_baseline(p_game_slug);

  -- 7) unlock badges (โครงเดิม — ขยาย kinds ใหม่ใน migration 156)
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
$function$;

-- ─── 6) Recompute ย้อนหลัง (user เลือก: ยุติธรรมตั้งแต่วันแรก) ──────────
-- baseline ทุกเกมก่อน
INSERT INTO public.game_score_baseline (game_slug, median_score, p75_score, p90_score, sample_count, updated_at)
SELECT game_slug,
       percentile_cont(0.5)  WITHIN GROUP (ORDER BY score),
       percentile_cont(0.75) WITHIN GROUP (ORDER BY score),
       percentile_cont(0.9)  WITHIN GROUP (ORDER BY score),
       COUNT(*), now()
FROM public.game_sessions
GROUP BY game_slug
ON CONFLICT (game_slug) DO UPDATE SET
  median_score = EXCLUDED.median_score,
  p75_score    = EXCLUDED.p75_score,
  p90_score    = EXCLUDED.p90_score,
  sample_count = EXCLUDED.sample_count,
  updated_at   = now();

-- xp_earned ใหม่ทุก session (สูตรเดียวกับ RPC)
WITH calc AS (
  SELECT gs.id,
         CASE WHEN gs.duration_sec IS NOT NULL AND gs.duration_sec < 20
                   AND b.median_score IS NOT NULL AND b.median_score > 0
                   AND gs.score < b.median_score * 0.2
              THEN 2 ELSE 10 END AS base,
         CASE WHEN b.sample_count IS NULL OR b.sample_count < 10
                   OR b.median_score IS NULL OR b.median_score <= 0
              THEN 1.0
              ELSE LEAST(gs.score / b.median_score, 2.0) END AS ratio,
         CASE WHEN gs.mode = 'online' THEN 3 WHEN gs.mode = 'daily' THEN 3 ELSE 0 END AS mode_bonus,
         ROW_NUMBER() OVER (PARTITION BY gs.student_id, gs.game_slug,
                            (gs.created_at AT TIME ZONE 'Asia/Bangkok')::date
                            ORDER BY gs.created_at) AS rn_day
  FROM public.game_sessions gs
  LEFT JOIN public.game_score_baseline b ON b.game_slug = gs.game_slug
)
UPDATE public.game_sessions gs
SET xp_earned = CASE WHEN c.rn_day > 10 THEN c.base
                     ELSE c.base + ROUND(10 * c.ratio)::int + c.mode_bonus END
FROM calc c WHERE gs.id = c.id;

-- บวกคืน xp_bonus ของเหรียญที่ปลดไปแล้ว (ผูกกับ session)
UPDATE public.game_sessions gs
SET xp_earned = gs.xp_earned + sub.bonus
FROM (
  SELECT a.session_id, SUM(c.xp_bonus)::int AS bonus
  FROM public.game_student_achievements a
  JOIN public.game_achievements_catalog c ON c.id = a.achievement_id
  WHERE a.session_id IS NOT NULL
  GROUP BY a.session_id
) sub
WHERE gs.id = sub.session_id;

GRANT EXECUTE ON FUNCTION public.refresh_game_score_baseline(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.subject_keys(text) TO anon, authenticated;
