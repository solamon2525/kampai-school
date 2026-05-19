-- ============================================================================
-- Migration 066: Game Play Tracking (Pizza Master Chef pilot)
-- ============================================================================
-- ระบบติดตามการเล่นเกมการศึกษา + XP/Level/Badge progression
-- Pilot: pizza-master-chef.html (เกมเศษส่วน → วิชาคณิตศาสตร์)
-- ============================================================================

-- ---------- 1. เพิ่ม column ลง educational_hub_items ----------
ALTER TABLE public.educational_hub_items
  ADD COLUMN IF NOT EXISTS game_slug    TEXT,
  ADD COLUMN IF NOT EXISTS tracked_game BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_edu_hub_items_game_slug
  ON public.educational_hub_items(game_slug)
  WHERE game_slug IS NOT NULL;

-- ---------- 2. game_sessions ----------
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  game_slug       TEXT NOT NULL,
  edu_hub_item_id UUID REFERENCES public.educational_hub_items(id) ON DELETE SET NULL,
  score           INT NOT NULL CHECK (score BETWEEN 0 AND 1000000),
  mode            TEXT,
  duration_sec    INT CHECK (duration_sec IS NULL OR duration_sec BETWEEN 1 AND 7200),
  xp_earned       INT NOT NULL DEFAULT 0,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  academic_year   TEXT,
  semester        TEXT,
  pushed_to_score_record_id UUID REFERENCES public.score_records(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_student_game_time
  ON public.game_sessions(student_id, game_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_score
  ON public.game_sessions(game_slug, score DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_created_at
  ON public.game_sessions(created_at DESC);

-- ---------- 3. achievement catalog + per-student unlocks ----------
CREATE TABLE IF NOT EXISTS public.game_achievements_catalog (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_slug       TEXT NOT NULL,
  code            TEXT NOT NULL,
  title_th        TEXT NOT NULL,
  description_th  TEXT,
  icon            TEXT,
  threshold_kind  TEXT NOT NULL CHECK (threshold_kind IN
                    ('first_play','score_gte','plays_gte','improvement_ratio','streak_days')),
  threshold_value NUMERIC,
  xp_bonus        INT NOT NULL DEFAULT 0,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(game_slug, code)
);

CREATE TABLE IF NOT EXISTS public.game_student_achievements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.game_achievements_catalog(id) ON DELETE CASCADE,
  unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_id     UUID REFERENCES public.game_sessions(id) ON DELETE SET NULL,
  UNIQUE(student_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_game_student_achievements_student
  ON public.game_student_achievements(student_id);

-- ---------- 4. aggregation view (per student per game) ----------
CREATE OR REPLACE VIEW public.game_student_stats AS
WITH ranked AS (
  SELECT
    student_id, game_slug, score, xp_earned, created_at,
    ROW_NUMBER() OVER (PARTITION BY student_id, game_slug ORDER BY created_at ASC)  AS rn_asc,
    ROW_NUMBER() OVER (PARTITION BY student_id, game_slug ORDER BY created_at DESC) AS rn_desc
  FROM public.game_sessions
)
SELECT
  student_id,
  game_slug,
  COUNT(*)::INT                                       AS plays_count,
  MAX(score)                                          AS personal_best,
  COALESCE(SUM(xp_earned), 0)::INT                    AS total_xp,
  MAX(created_at)                                     AS last_played_at,
  MIN(created_at)                                     AS first_played_at,
  AVG(score) FILTER (WHERE rn_asc  <= 5)              AS first_5_avg,
  AVG(score) FILTER (WHERE rn_desc <= 5)              AS last_5_avg
FROM ranked
GROUP BY student_id, game_slug;

GRANT SELECT ON public.game_student_stats TO anon, authenticated;

-- ---------- 5. RPC: lookup student for game (anon, read-only) ----------
CREATE OR REPLACE FUNCTION public.lookup_student_for_game(p_student_code TEXT)
RETURNS TABLE(
  id           UUID,
  display_name TEXT,
  photo_url    TEXT,
  class_label  TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id,
    s.name,
    s.photo_url,
    s."class"
  FROM public.students s
  WHERE s.student_code = p_student_code
    AND COALESCE(s.is_active, true) = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_student_for_game(TEXT) TO anon, authenticated;

-- ---------- 6. RPC: record session + auto-unlock badges ----------
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
  IF p_duration_sec IS NOT NULL AND p_duration_sec < 5 AND p_score > 100 THEN
    RAISE EXCEPTION 'duration_too_short' USING ERRCODE = 'P0001';
  END IF;

  -- 3) rate-limit: 1 session per 20s per (student, game)
  IF EXISTS (
    SELECT 1 FROM public.game_sessions
    WHERE student_id = v_student_id
      AND game_slug  = p_game_slug
      AND created_at > now() - interval '20 seconds'
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

-- ---------- 7. RPC: leaderboard (anon-callable, joined with student) ----------
CREATE OR REPLACE FUNCTION public.get_game_leaderboard(
  p_game_slug TEXT,
  p_limit     INT DEFAULT 10
)
RETURNS TABLE(
  student_id      UUID,
  display_name    TEXT,
  photo_url       TEXT,
  class_label     TEXT,
  personal_best   INT,
  plays_count     INT,
  total_xp        INT,
  last_played_at  TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id,
    s.name,
    s.photo_url,
    s."class",
    g.personal_best,
    g.plays_count,
    g.total_xp,
    g.last_played_at
  FROM public.game_student_stats g
  JOIN public.students s ON s.id = g.student_id
  WHERE g.game_slug = p_game_slug
    AND COALESCE(s.is_active, true) = true
  ORDER BY g.personal_best DESC NULLS LAST, g.total_xp DESC
  LIMIT GREATEST(1, LEAST(p_limit, 100));
$$;

GRANT EXECUTE ON FUNCTION public.get_game_leaderboard(TEXT, INT) TO anon, authenticated;

-- ---------- 8. RPC (admin/teacher): push session to score_records ----------
CREATE OR REPLACE FUNCTION public.push_game_session_to_score_records(
  p_session_id  UUID,
  p_score_type  TEXT,
  p_max_score   NUMERIC,
  p_normalized_score NUMERIC,
  p_semester    TEXT,
  p_academic_year TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session     public.game_sessions%ROWTYPE;
  v_subject     TEXT;
  v_score_id    UUID;
  v_recorded_by TEXT;
BEGIN
  IF NOT public.is_teacher() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_session FROM public.game_sessions WHERE id = p_session_id;
  IF v_session.id IS NULL THEN
    RAISE EXCEPTION 'session_not_found' USING ERRCODE = 'P0001';
  END IF;
  IF v_session.pushed_to_score_record_id IS NOT NULL THEN
    RAISE EXCEPTION 'already_pushed' USING ERRCODE = 'P0001';
  END IF;

  SELECT subject INTO v_subject
  FROM public.educational_hub_items
  WHERE game_slug = v_session.game_slug AND tracked_game = true
  LIMIT 1;

  IF v_subject IS NULL THEN
    v_subject := 'อื่น ๆ';
  END IF;

  v_recorded_by := 'game:' || v_session.game_slug;

  INSERT INTO public.score_records
    (student_id, subject, score_type, score, max_score, semester, academic_year, recorded_by, notes)
  VALUES
    (v_session.student_id, v_subject, p_score_type, p_normalized_score, p_max_score,
     p_semester, p_academic_year, v_recorded_by,
     'จาก ' || v_session.game_slug || ' (raw=' || v_session.score || ')')
  ON CONFLICT (student_id, subject, score_type, semester, academic_year)
  DO UPDATE SET
    score       = EXCLUDED.score,
    max_score   = EXCLUDED.max_score,
    notes       = EXCLUDED.notes,
    updated_at  = now()
  RETURNING id INTO v_score_id;

  UPDATE public.game_sessions
     SET pushed_to_score_record_id = v_score_id
   WHERE id = p_session_id;

  RETURN v_score_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.push_game_session_to_score_records(UUID, TEXT, NUMERIC, NUMERIC, TEXT, TEXT)
  TO authenticated;

-- ---------- 9. RLS ----------
ALTER TABLE public.game_sessions               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_achievements_catalog   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_student_achievements   ENABLE ROW LEVEL SECURITY;

-- catalog: public read; admin write
DROP POLICY IF EXISTS "catalog_public_read"  ON public.game_achievements_catalog;
DROP POLICY IF EXISTS "catalog_admin_write"  ON public.game_achievements_catalog;
CREATE POLICY "catalog_public_read"
  ON public.game_achievements_catalog FOR SELECT
  USING (true);
CREATE POLICY "catalog_admin_write"
  ON public.game_achievements_catalog FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- game_sessions: SELECT = teacher/admin or own student via user_roles; writes only via SECURITY DEFINER RPC
DROP POLICY IF EXISTS "sessions_teacher_read"      ON public.game_sessions;
DROP POLICY IF EXISTS "sessions_self_read"         ON public.game_sessions;
DROP POLICY IF EXISTS "sessions_admin_manage"      ON public.game_sessions;
CREATE POLICY "sessions_teacher_read"
  ON public.game_sessions FOR SELECT
  USING (public.is_teacher());
CREATE POLICY "sessions_self_read"
  ON public.game_sessions FOR SELECT
  USING (student_id IN (
    SELECT student_id FROM public.user_roles WHERE user_id = auth.uid()
  ));
CREATE POLICY "sessions_admin_manage"
  ON public.game_sessions FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- game_student_achievements: same select rules
DROP POLICY IF EXISTS "ach_teacher_read"  ON public.game_student_achievements;
DROP POLICY IF EXISTS "ach_self_read"     ON public.game_student_achievements;
DROP POLICY IF EXISTS "ach_admin_manage"  ON public.game_student_achievements;
CREATE POLICY "ach_teacher_read"
  ON public.game_student_achievements FOR SELECT
  USING (public.is_teacher());
CREATE POLICY "ach_self_read"
  ON public.game_student_achievements FOR SELECT
  USING (student_id IN (
    SELECT student_id FROM public.user_roles WHERE user_id = auth.uid()
  ));
CREATE POLICY "ach_admin_manage"
  ON public.game_student_achievements FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- 10. Seed: 8 Pizza badges ----------
INSERT INTO public.game_achievements_catalog
  (game_slug, code, title_th, description_th, icon, threshold_kind, threshold_value, xp_bonus, sort_order)
VALUES
  ('pizza-master-chef','first_play',  'ก้าวแรกเชฟพิซซ่า',    'เล่นเกมพิซซ่าครั้งแรก',             'Sparkles',     'first_play',         NULL,  20, 1),
  ('pizza-master-chef','score_1k',    'พิซซ่ามือใหม่',         'ทำคะแนนสูงสุด 1,000 คะแนน',         'Pizza',        'score_gte',          1000,  30, 2),
  ('pizza-master-chef','score_3k',    'พิซซ่ามือกลาง',         'ทำคะแนนสูงสุด 3,000 คะแนน',         'Pizza',        'score_gte',          3000,  50, 3),
  ('pizza-master-chef','score_5k',    'พิซซ่ามือโปร',          'ทำคะแนนสูงสุด 5,000 คะแนน',         'Award',        'score_gte',          5000,  80, 4),
  ('pizza-master-chef','score_10k',   'พิซซ่ามาสเตอร์',        'ทำคะแนนสูงสุด 10,000 คะแนน',        'Trophy',       'score_gte',         10000, 150, 5),
  ('pizza-master-chef','plays_10',    'ขยันฝึกฝน',             'เล่นครบ 10 ครั้ง',                  'Flame',        'plays_gte',            10,  40, 6),
  ('pizza-master-chef','improve_1_5', 'พัฒนาตัวเอง 1.5x',     '5 ครั้งล่าสุดดีกว่า 5 ครั้งแรก 1.5 เท่า', 'TrendingUp',   'improvement_ratio',  1.5, 100, 7),
  ('pizza-master-chef','streak_7',    'ติดต่อกัน 7 วัน',       'เล่นต่อเนื่อง 7 วัน',                 'CalendarCheck','streak_days',           7,  60, 8)
ON CONFLICT (game_slug, code) DO NOTHING;

-- ---------- 11. แก้ subject เกม Pizza Master Chef + เปิด tracked flag ----------
-- migration 062 seed subject='ภาษาไทย' ผิด (folder path ดูเหมือนภาษาไทย แต่เนื้อหาเป็นเศษส่วน = คณิตศาสตร์)
UPDATE public.educational_hub_items
   SET subject      = 'คณิตศาสตร์',
       game_slug    = 'pizza-master-chef',
       tracked_game = true,
       updated_at   = now()
 WHERE external_url = '/games/thai/pizza-master-chef.html';
