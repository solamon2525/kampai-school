-- ============================================================================
-- Migration 372: Game Research Studies — ติดตามสถิติการเล่นเกมเพื่อวิจัยในชั้นเรียน
-- Pre/post design · กำหนดเกม+โหมด+ชั้น · จำกัดรอบ/วัน · เจ้าของเกมเห็นข้อมูล
-- ============================================================================

-- ---------- 1. ตารางโครงการวิจัย ----------
CREATE TABLE IF NOT EXISTS public.game_research_studies (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_staff_id      UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  edu_hub_item_id     UUID REFERENCES public.educational_hub_items(id) ON DELETE SET NULL,
  title               TEXT NOT NULL,
  game_slug           TEXT NOT NULL,
  game_mode           TEXT NOT NULL,
  class_name          TEXT NOT NULL,
  pretest_start       DATE NOT NULL,
  pretest_end         DATE NOT NULL,
  posttest_start      DATE NOT NULL,
  posttest_end        DATE NOT NULL,
  max_rounds_per_day  INT NOT NULL DEFAULT 3 CHECK (max_rounds_per_day BETWEEN 1 AND 20),
  consent_confirmed   BOOLEAN NOT NULL DEFAULT true,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (pretest_end >= pretest_start),
  CHECK (posttest_end >= posttest_start),
  CHECK (posttest_start > pretest_end)
);

CREATE INDEX IF NOT EXISTS idx_game_research_studies_owner
  ON public.game_research_studies(owner_staff_id, is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_game_research_studies_game
  ON public.game_research_studies(game_slug, class_name)
  WHERE is_active = true;

-- ---------- 2. ผูก session กับโครงการวิจัย ----------
ALTER TABLE public.game_sessions
  ADD COLUMN IF NOT EXISTS research_study_id UUID REFERENCES public.game_research_studies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_game_sessions_research_study
  ON public.game_sessions(research_study_id, student_id, created_at DESC)
  WHERE research_study_id IS NOT NULL;

-- ---------- 3. RLS ----------
ALTER TABLE public.game_research_studies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "research_owner_manage" ON public.game_research_studies;
DROP POLICY IF EXISTS "research_admin_manage" ON public.game_research_studies;

CREATE POLICY "research_owner_manage"
  ON public.game_research_studies FOR ALL
  USING (
    owner_staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    owner_staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid())
    OR public.is_admin()
  );

-- ---------- 4. RPC: นับรอบวันนี้ (anon — ใช้ตอนเล่นเกม) ----------
CREATE OR REPLACE FUNCTION public.count_research_rounds_today(
  p_study_id      UUID,
  p_student_code  TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id UUID;
  v_study      public.game_research_studies%ROWTYPE;
  v_today      DATE;
  v_count      INT;
BEGIN
  v_today := (now() AT TIME ZONE 'Asia/Bangkok')::date;

  SELECT * INTO v_study
  FROM public.game_research_studies
  WHERE id = p_study_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'study_not_found');
  END IF;

  SELECT id INTO v_student_id
  FROM public.students
  WHERE student_code = p_student_code AND COALESCE(is_active, true) = true;

  IF v_student_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'student_not_found');
  END IF;

  SELECT COUNT(*)::INT INTO v_count
  FROM public.game_sessions
  WHERE student_id = v_student_id
    AND research_study_id = p_study_id
    AND (created_at AT TIME ZONE 'Asia/Bangkok')::date = v_today;

  RETURN jsonb_build_object(
    'ok', true,
    'played_today', v_count,
    'remaining', GREATEST(0, v_study.max_rounds_per_day - v_count),
    'max_rounds', v_study.max_rounds_per_day,
    'game_slug', v_study.game_slug,
    'game_mode', v_study.game_mode,
    'class_name', v_study.class_name,
    'title', v_study.title
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.count_research_rounds_today(UUID, TEXT) TO anon, authenticated;

-- ---------- 5. อัปเดต record_game_session — รองรับโครงการวิจัย ----------
CREATE OR REPLACE FUNCTION public.record_game_session(
  p_student_code       TEXT,
  p_game_slug          TEXT,
  p_score              INT,
  p_mode               TEXT DEFAULT NULL,
  p_duration_sec       INT DEFAULT NULL,
  p_metadata           JSONB DEFAULT '{}'::jsonb,
  p_research_study_id  UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id   UUID;
  v_student_class TEXT;
  v_hub_item_id  UUID;
  v_subject      TEXT;
  v_session_id   UUID;
  v_xp_earned    INT;
  v_total_xp     INT;
  v_unlocked     JSONB := '[]'::jsonb;
  v_new_xp_bonus INT;
  v_study        public.game_research_studies%ROWTYPE;
  v_today        DATE;
  v_round_count  INT;
  v_meta         JSONB;
BEGIN
  -- 1) resolve student
  SELECT id, "class" INTO v_student_id, v_student_class
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

  v_meta := COALESCE(p_metadata, '{}'::jsonb);

  -- 3b) โครงการวิจัย — ตรวจสอบก่อนบันทึก
  IF p_research_study_id IS NOT NULL THEN
    SELECT * INTO v_study
    FROM public.game_research_studies
    WHERE id = p_research_study_id AND is_active = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'research_study_not_found' USING ERRCODE = 'P0001';
    END IF;

    IF v_study.game_slug <> p_game_slug THEN
      RAISE EXCEPTION 'research_game_mismatch' USING ERRCODE = 'P0001';
    END IF;

    IF v_study.game_mode IS NOT NULL AND COALESCE(p_mode, '') <> v_study.game_mode THEN
      RAISE EXCEPTION 'research_mode_mismatch' USING ERRCODE = 'P0001';
    END IF;

    IF v_student_class IS DISTINCT FROM v_study.class_name THEN
      RAISE EXCEPTION 'research_class_mismatch' USING ERRCODE = 'P0001';
    END IF;

    v_today := (now() AT TIME ZONE 'Asia/Bangkok')::date;

    SELECT COUNT(*)::INT INTO v_round_count
    FROM public.game_sessions
    WHERE student_id = v_student_id
      AND research_study_id = p_research_study_id
      AND (created_at AT TIME ZONE 'Asia/Bangkok')::date = v_today;

    IF v_round_count >= v_study.max_rounds_per_day THEN
      RAISE EXCEPTION 'research_round_limit' USING ERRCODE = 'P0001';
    END IF;

    v_meta := v_meta || jsonb_build_object('research_study_id', p_research_study_id::text);
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
    (student_id, game_slug, edu_hub_item_id, score, mode, duration_sec, xp_earned, metadata, research_study_id)
  VALUES
    (v_student_id, p_game_slug, v_hub_item_id, p_score, p_mode, p_duration_sec, v_xp_earned, v_meta, p_research_study_id)
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

-- Drop old 6-arg overload signature then grant 7-arg
DROP FUNCTION IF EXISTS public.record_game_session(TEXT, TEXT, INT, TEXT, INT, JSONB);
GRANT EXECUTE ON FUNCTION public.record_game_session(TEXT, TEXT, INT, TEXT, INT, JSONB, UUID)
  TO anon, authenticated;

COMMENT ON TABLE public.game_research_studies IS
  'โครงการวิจัยในชั้นเรียน — กำหนดเกม/โหมด/ชั้น/ช่วง pre-post + จำกัดรอบต่อวัน';
