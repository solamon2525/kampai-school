-- ===============================================================
-- Migration 156: Honor Medals — เหรียญสากล + auto per-game (Gamification P2)
-- ===============================================================
-- 1) extend game_achievements_catalog: game_slug NULL = เหรียญสากล (ข้ามเกม),
--    tier (bronze/silver/gold/diamond), subject_key (สำหรับ subject_xp_gte)
-- 2) seed เหรียญสากล 30 ใบ — ครอบทุกเกมรวมเกมอนาคต ไม่ต้อง seed รายเกมอีก
-- 3) เหรียญประจำเกม 5 ใบ default: auto-instantiate ใน record_game_session
--    ตอนเกมใหม่ถูกเล่นครั้งแรก + backfill เกมเดิมทั้งหมดทันที
-- 4) unlock CTE ขยาย: เช็คเหรียญสากลทุกครั้งที่จบเกม (volume เล็ก — ถูก)
-- ===============================================================

-- ─── 1) Schema extension ─────────────────────────────────────────────────
ALTER TABLE public.game_achievements_catalog
  ALTER COLUMN game_slug DROP NOT NULL;

ALTER TABLE public.game_achievements_catalog
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'bronze',
  ADD COLUMN IF NOT EXISTS subject_key text;

-- CHECK เดิมจำกัด 5 kinds → ขยาย
ALTER TABLE public.game_achievements_catalog
  DROP CONSTRAINT IF EXISTS game_achievements_catalog_threshold_kind_check;
ALTER TABLE public.game_achievements_catalog
  ADD CONSTRAINT game_achievements_catalog_threshold_kind_check CHECK (threshold_kind = ANY (ARRAY[
    'first_play', 'score_gte', 'plays_gte', 'improvement_ratio', 'streak_days',
    'score_pctl',
    'games_distinct_gte', 'global_xp_gte', 'subject_xp_gte', 'subjects_distinct_gte',
    'streak_days_global', 'online_plays_gte', 'online_wins_gte', 'tournament_wins_gte',
    'daily_plays_gte', 'modes_distinct_gte'
  ]));

ALTER TABLE public.game_achievements_catalog
  ADD CONSTRAINT game_achievements_catalog_tier_check
  CHECK (tier = ANY (ARRAY['bronze', 'silver', 'gold', 'diamond']));

-- UNIQUE(game_slug, code) ไม่กันซ้ำเมื่อ game_slug NULL → partial unique
CREATE UNIQUE INDEX IF NOT EXISTS uq_achievements_universal_code
  ON public.game_achievements_catalog(code) WHERE game_slug IS NULL;

-- ─── 2) Seed เหรียญสากล 30 ใบ ───────────────────────────────────────────
INSERT INTO public.game_achievements_catalog
  (game_slug, code, title_th, description_th, icon, threshold_kind, threshold_value, xp_bonus, tier, subject_key, sort_order)
SELECT NULL, v.code, v.title, v.descr, v.icon, v.kind, v.val, v.bonus, v.tier, v.subj, v.sort
FROM (VALUES
  -- 🗺️ นักสำรวจ (เล่นหลายเกม)
  ('g_explorer_1', 'นักสำรวจมือใหม่',      'เล่นเกมต่างกันครบ 3 เกม',          '🗺️', 'games_distinct_gte',   3::numeric,    10, 'bronze',  NULL::text, 10),
  ('g_explorer_2', 'นักสำรวจตัวยง',        'เล่นเกมต่างกันครบ 7 เกม',          '🧭', 'games_distinct_gte',   7,             20, 'silver',  NULL, 11),
  ('g_explorer_3', 'นักสำรวจรอบโลก',       'เล่นเกมต่างกันครบ 15 เกม',         '🌏', 'games_distinct_gte',   15,            40, 'gold',    NULL, 12),
  -- ⭐ นักสะสม XP
  ('g_xp_1',       'นักสะสมดาวรุ่ง',        'สะสม XP รวม 300',                  '⭐', 'global_xp_gte',        300,           10, 'bronze',  NULL, 20),
  ('g_xp_2',       'นักสะสมดาวเด่น',        'สะสม XP รวม 1,000',                '🌟', 'global_xp_gte',        1000,          20, 'silver',  NULL, 21),
  ('g_xp_3',       'นักสะสมดาวทอง',         'สะสม XP รวม 3,000',                '💫', 'global_xp_gte',        3000,          40, 'gold',    NULL, 22),
  ('g_xp_4',       'ตำนานนักสะสม',          'สะสม XP รวม 10,000',               '👑', 'global_xp_gte',        10000,         80, 'diamond', NULL, 23),
  -- 🔢 เซียนคณิต (วิชาหลัก)
  ('g_math_1',     'เซียนคณิต ระดับต้น',    'สะสม XP จากเกมคณิต 200',           '🔢', 'subject_xp_gte',       200,           15, 'bronze',  'math', 30),
  ('g_math_2',     'เซียนคณิต ระดับกลาง',   'สะสม XP จากเกมคณิต 600',           '➗', 'subject_xp_gte',       600,           30, 'silver',  'math', 31),
  ('g_math_3',     'เซียนคณิต ระดับสูง',    'สะสม XP จากเกมคณิต 1,500',         '🧮', 'subject_xp_gte',       1500,          60, 'gold',    'math', 32),
  -- 📖 เซียนภาษาไทย (วิชาหลัก)
  ('g_thai_1',     'เซียนภาษาไทย ระดับต้น',  'สะสม XP จากเกมภาษาไทย 200',        '📖', 'subject_xp_gte',       200,           15, 'bronze',  'thai', 40),
  ('g_thai_2',     'เซียนภาษาไทย ระดับกลาง', 'สะสม XP จากเกมภาษาไทย 600',        '✍️', 'subject_xp_gte',       600,           30, 'silver',  'thai', 41),
  ('g_thai_3',     'เซียนภาษาไทย ระดับสูง',  'สะสม XP จากเกมภาษาไทย 1,500',      '📜', 'subject_xp_gte',       1500,          60, 'gold',    'thai', 42),
  -- 🔤 เซียนอังกฤษ (วิชาหลัก)
  ('g_eng_1',      'เซียนอังกฤษ ระดับต้น',   'สะสม XP จากเกมอังกฤษ 200',         '🔤', 'subject_xp_gte',       200,           15, 'bronze',  'english', 50),
  ('g_eng_2',      'เซียนอังกฤษ ระดับกลาง',  'สะสม XP จากเกมอังกฤษ 600',         '💬', 'subject_xp_gte',       600,           30, 'silver',  'english', 51),
  ('g_eng_3',      'เซียนอังกฤษ ระดับสูง',   'สะสม XP จากเกมอังกฤษ 1,500',       '🎓', 'subject_xp_gte',       1500,          60, 'gold',    'english', 52),
  -- 📚 รอบรู้
  ('g_allround',   'รอบรู้ทุกหมวด',          'เล่นเกมครบทุกหมวดวิชา',             '📚', 'subjects_distinct_gte', 4,            30, 'gold',    NULL, 60),
  -- 🔥 ขยันต่อเนื่อง
  ('g_streak_3',   'ขยัน 3 วันติด',          'เล่นเกมติดต่อกัน 3 วัน',            '🔥', 'streak_days_global',   3,             10, 'bronze',  NULL, 70),
  ('g_streak_7',   'ขยัน 7 วันติด',          'เล่นเกมติดต่อกัน 7 วัน',            '🔥', 'streak_days_global',   7,             25, 'silver',  NULL, 71),
  ('g_streak_14',  'ขยัน 14 วันติด',         'เล่นเกมติดต่อกัน 14 วัน',           '🔥', 'streak_days_global',   14,            50, 'gold',    NULL, 72),
  -- 🌐 นักแข่งออนไลน์
  ('g_online_1',   'ก้าวสู่สังเวียน',        'แข่งออนไลน์ครั้งแรก',               '🌐', 'online_plays_gte',     1,             10, 'bronze',  NULL, 80),
  ('g_online_2',   'นักแข่งออนไลน์',         'แข่งออนไลน์ครบ 10 ครั้ง',           '🌐', 'online_plays_gte',     10,            20, 'silver',  NULL, 81),
  ('g_online_3',   'ขาประจำสังเวียน',        'แข่งออนไลน์ครบ 30 ครั้ง',           '🌐', 'online_plays_gte',     30,            40, 'gold',    NULL, 82),
  -- 🏆 แชมป์ออนไลน์
  ('g_champ_1',    'แชมป์หน้าใหม่',          'ชนะแข่งออนไลน์ 3 ครั้ง',            '🏆', 'online_wins_gte',      3,             25, 'silver',  NULL, 90),
  ('g_champ_2',    'แชมป์ตัวจริง',           'ชนะแข่งออนไลน์ 10 ครั้ง',           '🏆', 'online_wins_gte',      10,            50, 'gold',    NULL, 91),
  -- 👑 เจ้าลีก (tournament)
  ('g_tour_1',     'เจ้าลีกหน้าใหม่',        'ชนะลีก (tournament) ครั้งแรก',      '👑', 'tournament_wins_gte',  1,             40, 'gold',    NULL, 100),
  ('g_tour_2',     'ราชาลีก',                'ชนะลีกครบ 5 ครั้ง',                 '👑', 'tournament_wins_gte',  5,             80, 'diamond', NULL, 101),
  -- 📅 สายชาเลนจ์
  ('g_daily_1',    'สายชาเลนจ์',             'เล่น Daily Challenge ครบ 5 วัน',    '📅', 'daily_plays_gte',      5,             20, 'silver',  NULL, 110),
  ('g_daily_2',    'ขาประจำชาเลนจ์',         'เล่น Daily Challenge ครบ 20 วัน',   '📅', 'daily_plays_gte',      20,            40, 'gold',    NULL, 111),
  -- 🎮 ครบเครื่อง
  ('g_modes',      'ครบเครื่อง',             'เล่นครบ 3 แบบ: เดี่ยว + ออนไลน์ + ชาเลนจ์', '🎮', 'modes_distinct_gte', 3,       25, 'silver',  NULL, 120)
) AS v(code, title, descr, icon, kind, val, bonus, tier, subj, sort)
WHERE NOT EXISTS (
  SELECT 1 FROM public.game_achievements_catalog c
  WHERE c.game_slug IS NULL AND c.code = v.code
);

-- ─── 3) Backfill เหรียญประจำเกม 5 ใบ default ให้ทุกเกมที่ยังไม่มี ─────────
INSERT INTO public.game_achievements_catalog
  (game_slug, code, title_th, description_th, icon, threshold_kind, threshold_value, xp_bonus, tier, sort_order)
SELECT g.game_slug, t.code, t.title, t.descr, t.icon, t.kind, t.val, t.bonus, t.tier, t.sort
FROM (
  SELECT DISTINCT game_slug FROM public.game_sessions
  UNION
  SELECT DISTINCT game_slug FROM public.educational_hub_items
  WHERE tracked_game = true AND game_slug IS NOT NULL
) g
CROSS JOIN (VALUES
  ('first_play', 'ก้าวแรก',     'เล่นเกมนี้ครั้งแรก',               '🎈', 'first_play', 1::numeric,  5, 'bronze', 1),
  ('plays_10',   'ขาประจำ',     'เล่นครบ 10 ครั้ง',                 '🎯', 'plays_gte',  10,          10, 'silver', 2),
  ('plays_30',   'สาวกตัวจริง',  'เล่นครบ 30 ครั้ง',                 '💖', 'plays_gte',  30,          20, 'gold',   3),
  ('top25',      'มือฉมัง',      'คะแนนติดกลุ่ม TOP 25% ของเกมนี้',  '🔥', 'score_pctl', 75,          15, 'silver', 4),
  ('top10',      'ปรมาจารย์',    'คะแนนติดกลุ่ม TOP 10% ของเกมนี้',  '⚡', 'score_pctl', 90,          30, 'gold',   5)
) AS t(code, title, descr, icon, kind, val, bonus, tier, sort)
WHERE NOT EXISTS (
  SELECT 1 FROM public.game_achievements_catalog c WHERE c.game_slug = g.game_slug
);

-- ─── 4) record_game_session v3 — auto-instantiate + unlock CTE ขยาย ──────
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
  SELECT id INTO v_student_id
  FROM public.students
  WHERE student_code = p_student_code
    AND COALESCE(is_active, true) = true;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'student_not_found' USING ERRCODE = 'P0001';
  END IF;

  IF p_score IS NULL OR p_score < 0 OR p_score > 1000000 THEN
    RAISE EXCEPTION 'invalid_score' USING ERRCODE = 'P0001';
  END IF;
  IF p_duration_sec IS NOT NULL AND p_duration_sec < 5 AND p_score > 100 THEN
    RAISE EXCEPTION 'duration_too_short' USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.game_sessions
    WHERE student_id = v_student_id
      AND game_slug  = p_game_slug
      AND created_at > now() - interval '5 seconds'
  ) THEN
    RAISE EXCEPTION 'rate_limited' USING ERRCODE = 'P0001';
  END IF;

  SELECT id, subject INTO v_hub_item_id, v_subject
  FROM public.educational_hub_items
  WHERE game_slug = p_game_slug
    AND tracked_game = true
  LIMIT 1;

  -- Fair XP (สูตรจาก migration 155)
  SELECT median_score, sample_count INTO v_median, v_sample
  FROM public.game_score_baseline WHERE game_slug = p_game_slug;

  v_base := 10;
  IF p_duration_sec IS NOT NULL AND p_duration_sec < 20
     AND v_median IS NOT NULL AND v_median > 0 AND p_score < v_median * 0.2 THEN
    v_base := 2;
  END IF;

  IF v_sample IS NULL OR v_sample < 10 OR v_median IS NULL OR v_median <= 0 THEN
    v_ratio := 1.0;
  ELSE
    v_ratio := LEAST(p_score / v_median, 2.0);
  END IF;
  v_perf := ROUND(10 * v_ratio)::int;

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
    v_xp_earned := v_base;
  ELSE
    v_xp_earned := v_base + v_perf + v_mode_bonus;
  END IF;

  INSERT INTO public.game_sessions
    (student_id, game_slug, edu_hub_item_id, score, mode, duration_sec, xp_earned, metadata)
  VALUES
    (v_student_id, p_game_slug, v_hub_item_id, p_score, p_mode, p_duration_sec, v_xp_earned, COALESCE(p_metadata, '{}'::jsonb))
  RETURNING id INTO v_session_id;

  PERFORM public.refresh_game_score_baseline(p_game_slug);

  -- เกมใหม่ที่ไม่มี catalog → instantiate เหรียญ default 5 ใบ (zero authoring)
  INSERT INTO public.game_achievements_catalog
    (game_slug, code, title_th, description_th, icon, threshold_kind, threshold_value, xp_bonus, tier, sort_order)
  SELECT p_game_slug, t.code, t.title, t.descr, t.icon, t.kind, t.val, t.bonus, t.tier, t.sort
  FROM (VALUES
    ('first_play', 'ก้าวแรก',     'เล่นเกมนี้ครั้งแรก',               '🎈', 'first_play', 1::numeric,  5, 'bronze', 1),
    ('plays_10',   'ขาประจำ',     'เล่นครบ 10 ครั้ง',                 '🎯', 'plays_gte',  10,          10, 'silver', 2),
    ('plays_30',   'สาวกตัวจริง',  'เล่นครบ 30 ครั้ง',                 '💖', 'plays_gte',  30,          20, 'gold',   3),
    ('top25',      'มือฉมัง',      'คะแนนติดกลุ่ม TOP 25% ของเกมนี้',  '🔥', 'score_pctl', 75,          15, 'silver', 4),
    ('top10',      'ปรมาจารย์',    'คะแนนติดกลุ่ม TOP 10% ของเกมนี้',  '⚡', 'score_pctl', 90,          30, 'gold',   5)
  ) AS t(code, title, descr, icon, kind, val, bonus, tier, sort)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.game_achievements_catalog c WHERE c.game_slug = p_game_slug
  );

  -- unlock: เหรียญประจำเกม + เหรียญสากล
  WITH s AS (
    SELECT * FROM public.game_student_stats
    WHERE student_id = v_student_id AND game_slug = p_game_slug
  ),
  b AS (
    SELECT * FROM public.game_score_baseline WHERE game_slug = p_game_slug
  ),
  g AS (
    SELECT COUNT(DISTINCT gs.game_slug)::int AS games_distinct,
           COALESCE(SUM(gs.xp_earned), 0)::int AS global_xp,
           COUNT(*) FILTER (WHERE gs.mode = 'online')::int AS online_plays,
           COUNT(*) FILTER (WHERE gs.mode = 'online' AND gs.metadata->>'rank' = '1'
                              AND COALESCE((gs.metadata->>'players')::int, 0) >= 2)::int AS online_wins,
           COUNT(*) FILTER (WHERE gs.mode = 'online' AND gs.metadata->>'rank' = '1'
                              AND COALESCE((gs.metadata->>'players')::int, 0) >= 2
                              AND COALESCE(gs.metadata->>'tournament', 'false') IN ('true', '1'))::int AS tournament_wins,
           COUNT(DISTINCT (gs.created_at AT TIME ZONE 'Asia/Bangkok')::date)
             FILTER (WHERE gs.mode = 'daily')::int AS daily_plays,
           COUNT(DISTINCT CASE WHEN gs.mode = 'online' THEN 'online'
                               WHEN gs.mode = 'daily' THEN 'daily' ELSE 'solo' END)::int AS modes_distinct
    FROM public.game_sessions gs
    WHERE gs.student_id = v_student_id
  ),
  subj AS (
    SELECT sk.key AS subject_key, COALESCE(SUM(gs.xp_earned), 0)::int AS xp
    FROM public.game_sessions gs
    JOIN (SELECT DISTINCT ON (game_slug) game_slug, subject
          FROM public.educational_hub_items
          WHERE tracked_game = true AND game_slug IS NOT NULL) h ON h.game_slug = gs.game_slug
    CROSS JOIN LATERAL unnest(public.subject_keys(h.subject)) AS sk(key)
    WHERE gs.student_id = v_student_id
    GROUP BY sk.key
  ),
  cands AS (
    -- เหรียญประจำเกมนี้
    SELECT c.id, c.code, c.title_th, c.icon, c.xp_bonus, c.tier
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
        OR (c.threshold_kind = 'score_pctl' AND EXISTS (
              SELECT 1 FROM b
              WHERE b.sample_count >= 10
                AND s.personal_best >= CASE WHEN c.threshold_value >= 90 THEN b.p90_score ELSE b.p75_score END))
      )
    UNION ALL
    -- เหรียญสากล (game_slug IS NULL)
    SELECT c.id, c.code, c.title_th, c.icon, c.xp_bonus, c.tier
    FROM public.game_achievements_catalog c, g
    WHERE c.game_slug IS NULL
      AND (
        (c.threshold_kind = 'games_distinct_gte'     AND g.games_distinct >= c.threshold_value)
        OR (c.threshold_kind = 'global_xp_gte'       AND g.global_xp >= c.threshold_value)
        OR (c.threshold_kind = 'online_plays_gte'    AND g.online_plays >= c.threshold_value)
        OR (c.threshold_kind = 'online_wins_gte'     AND g.online_wins >= c.threshold_value)
        OR (c.threshold_kind = 'tournament_wins_gte' AND g.tournament_wins >= c.threshold_value)
        OR (c.threshold_kind = 'daily_plays_gte'     AND g.daily_plays >= c.threshold_value)
        OR (c.threshold_kind = 'modes_distinct_gte'  AND g.modes_distinct >= c.threshold_value)
        OR (c.threshold_kind = 'subjects_distinct_gte' AND (SELECT COUNT(*) FROM subj) >= c.threshold_value)
        OR (c.threshold_kind = 'subject_xp_gte' AND EXISTS (
              SELECT 1 FROM subj WHERE subj.subject_key = c.subject_key AND subj.xp >= c.threshold_value))
        OR (c.threshold_kind = 'streak_days_global'
            AND (
              SELECT COUNT(DISTINCT (created_at AT TIME ZONE 'Asia/Bangkok')::date)
              FROM public.game_sessions
              WHERE student_id = v_student_id
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
      'xp_bonus', c.xp_bonus,
      'tier', c.tier
    )), '[]'::jsonb),
    COALESCE(SUM(c.xp_bonus), 0)
  INTO v_unlocked, v_new_xp_bonus
  FROM ins
  JOIN cands c ON c.id = ins.achievement_id;

  IF v_new_xp_bonus > 0 THEN
    UPDATE public.game_sessions
       SET xp_earned = xp_earned + v_new_xp_bonus
     WHERE id = v_session_id;
    v_xp_earned := v_xp_earned + v_new_xp_bonus;
  END IF;

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
