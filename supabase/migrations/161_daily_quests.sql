-- 161_daily_quests.sql
-- ระบบ Daily Quest (เดลี่เควส): ภารกิจประจำวันแยกตามวิชาแกน (คณิต/ไทย/อังกฤษ)
-- กระตุ้นให้นักเรียนเข้ามาเล่นเก็บคะแนนทุกวัน — ผ่านเควสวิชาโดยเล่นเกมในวิชานั้น
-- ให้ได้คะแนนถึงเกณฑ์ขั้นต่ำ. ทำครบทุกวิชา/วัน = คะแนนพิเศษเก็บแยก + streak + โบนัส XP.
--
-- Design: hook ที่ AFTER INSERT trigger บน game_sessions (ไม่แตะ record_game_session เดิม)
-- → credit อัตโนมัติทุก session รวม mode='online' (2 คน ต่างคน submit → ได้เครดิตทั้งคู่)
-- วันคิดด้วย timezone Asia/Bangkok ทุกที่ (ตาม pattern migration 155)

-- ════════════════════════════════════════════════════════════════════════
-- 1) Config tables (แอดมินจัดการ)
-- ════════════════════════════════════════════════════════════════════════

-- วิชาแกนที่เป็นเควสประจำวัน (เริ่ม math/thai/english, เพิ่ม subject_key อื่นได้ทีหลัง)
CREATE TABLE IF NOT EXISTS public.daily_quest_subjects (
  subject_key  text PRIMARY KEY,           -- ตรงกับ subject_keys(): math|thai|english|science|...
  label_th     text NOT NULL,
  icon         text,                        -- emoji
  is_active    boolean NOT NULL DEFAULT true,
  sort_order   int NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ตั้งค่ารวม (single-row) — โบนัสตอนทำครบทุกวิชา
CREATE TABLE IF NOT EXISTS public.daily_quest_config (
  id                  boolean PRIMARY KEY DEFAULT true CHECK (id),  -- บังคับ 1 แถว
  all_complete_points int NOT NULL DEFAULT 50,   -- คะแนนพิเศษเก็บแยก (quest points)
  all_complete_xp     int NOT NULL DEFAULT 30,   -- โบนัส XP เข้าระบบ gamification เดิม
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- เกณฑ์คะแนนขั้นต่ำต่อเกม (NULL = auto จาก baseline median * 0.5)
ALTER TABLE public.educational_hub_items
  ADD COLUMN IF NOT EXISTS quest_min_score int;

-- ════════════════════════════════════════════════════════════════════════
-- 2) Record tables (denormalized — เร็วต่อ stats + streak)
-- ════════════════════════════════════════════════════════════════════════

-- ผ่านเควสวิชาใด วันใด (แถวแรกที่ผ่านของวิชานั้นในวัน)
CREATE TABLE IF NOT EXISTS public.daily_quest_completions (
  challenge_date date NOT NULL,
  student_id     uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_key    text NOT NULL,
  score          int NOT NULL,
  session_id     uuid REFERENCES public.game_sessions(id) ON DELETE SET NULL,
  game_slug      text,
  completed_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (challenge_date, student_id, subject_key)
);

-- rollup ต่อ คน/วัน (all-complete + streak + bonus)
CREATE TABLE IF NOT EXISTS public.daily_quest_days (
  challenge_date  date NOT NULL,
  student_id      uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  completed_count int  NOT NULL DEFAULT 0,
  required_count  int  NOT NULL DEFAULT 0,
  all_complete    boolean NOT NULL DEFAULT false,
  bonus_points    int NOT NULL DEFAULT 0,
  bonus_xp        int NOT NULL DEFAULT 0,
  streak_days     int NOT NULL DEFAULT 0,
  completed_at    timestamptz,
  PRIMARY KEY (challenge_date, student_id)
);

CREATE INDEX IF NOT EXISTS idx_dq_completions_date ON public.daily_quest_completions (challenge_date);
CREATE INDEX IF NOT EXISTS idx_dq_days_date        ON public.daily_quest_days (challenge_date);
CREATE INDEX IF NOT EXISTS idx_dq_days_student     ON public.daily_quest_days (student_id);

-- ════════════════════════════════════════════════════════════════════════
-- 3) Trigger: process daily quest หลังบันทึก game_sessions ทุกแถว
-- ════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.process_daily_quest()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_subject    text;
  v_min_score  int;
  v_median     numeric;
  v_threshold  int;
  v_today      date := (NEW.created_at AT TIME ZONE 'Asia/Bangkok')::date;
  v_keys       text[];
  v_required   int;
  v_completed  int;
  v_was_all    boolean;
  v_bonus_pts  int;
  v_bonus_xp   int;
  v_streak     int;
  v_prev       date;
BEGIN
  -- 1) resolve subject + เกณฑ์ของเกมนี้ (best-effort)
  SELECT i.subject, i.quest_min_score, b.median_score
    INTO v_subject, v_min_score, v_median
  FROM public.educational_hub_items i
  LEFT JOIN public.game_score_baseline b ON b.game_slug = i.game_slug
  WHERE i.game_slug = NEW.game_slug AND i.tracked_game = true
  LIMIT 1;

  IF v_subject IS NULL THEN
    RETURN NEW;  -- เกมไม่ tracked / ไม่มี subject → ไม่นับเควส
  END IF;

  -- 2) เกณฑ์คะแนนขั้นต่ำ (ต่อเกม > auto จาก median)
  v_threshold := COALESCE(v_min_score, GREATEST(1, ROUND(COALESCE(v_median, 0) * 0.5))::int);
  IF NEW.score < v_threshold THEN
    RETURN NEW;  -- คะแนนไม่ถึงเกณฑ์ → ยังไม่ผ่านเควส
  END IF;

  -- 3) วิชาแกน active ที่เกมนี้ครอบคลุม
  SELECT array_agg(s.subject_key)
    INTO v_keys
  FROM public.daily_quest_subjects s
  WHERE s.is_active = true
    AND s.subject_key = ANY (public.subject_keys(v_subject));

  IF v_keys IS NULL OR array_length(v_keys, 1) IS NULL THEN
    RETURN NEW;  -- subject ของเกมไม่ใช่เควสแกน
  END IF;

  -- 4) credit แต่ละวิชา (แถวแรกที่ผ่านของวันเท่านั้น)
  INSERT INTO public.daily_quest_completions
    (challenge_date, student_id, subject_key, score, session_id, game_slug, completed_at)
  SELECT v_today, NEW.student_id, k, NEW.score, NEW.id, NEW.game_slug, now()
  FROM unnest(v_keys) AS k
  ON CONFLICT (challenge_date, student_id, subject_key) DO NOTHING;

  -- 5) recompute rollup
  SELECT count(*) INTO v_completed
  FROM public.daily_quest_completions
  WHERE challenge_date = v_today AND student_id = NEW.student_id;

  SELECT count(*) INTO v_required
  FROM public.daily_quest_subjects WHERE is_active = true;

  SELECT COALESCE(all_complete, false) INTO v_was_all
  FROM public.daily_quest_days
  WHERE challenge_date = v_today AND student_id = NEW.student_id;
  v_was_all := COALESCE(v_was_all, false);

  IF v_completed >= v_required AND v_required > 0 AND NOT v_was_all THEN
    -- 6) เพิ่งครบวันนี้ → คำนวณ streak + bonus
    SELECT all_complete_points, all_complete_xp INTO v_bonus_pts, v_bonus_xp
    FROM public.daily_quest_config WHERE id = true;
    v_bonus_pts := COALESCE(v_bonus_pts, 0);
    v_bonus_xp  := COALESCE(v_bonus_xp, 0);

    -- streak = วันที่ all_complete ติดกันย้อนหลัง + วันนี้
    v_streak := 1;
    v_prev := v_today - 1;
    LOOP
      IF EXISTS (
        SELECT 1 FROM public.daily_quest_days
        WHERE student_id = NEW.student_id AND challenge_date = v_prev AND all_complete
      ) THEN
        v_streak := v_streak + 1;
        v_prev := v_prev - 1;
      ELSE
        EXIT;
      END IF;
    END LOOP;

    INSERT INTO public.daily_quest_days
      (challenge_date, student_id, completed_count, required_count, all_complete,
       bonus_points, bonus_xp, streak_days, completed_at)
    VALUES (v_today, NEW.student_id, v_completed, v_required, true,
       v_bonus_pts, v_bonus_xp, v_streak, now())
    ON CONFLICT (challenge_date, student_id) DO UPDATE SET
      completed_count = EXCLUDED.completed_count,
      required_count  = EXCLUDED.required_count,
      all_complete    = true,
      bonus_points    = EXCLUDED.bonus_points,
      bonus_xp        = EXCLUDED.bonus_xp,
      streak_days     = EXCLUDED.streak_days,
      completed_at    = now();

    -- โบนัส XP เข้า session นี้ (จึงรวมใน gamification totals) — UPDATE ไม่ re-fire AFTER INSERT
    IF v_bonus_xp > 0 THEN
      UPDATE public.game_sessions SET xp_earned = xp_earned + v_bonus_xp WHERE id = NEW.id;
    END IF;
  ELSE
    -- 7) อัปเดต progress (ยังไม่ครบ หรือครบไปแล้ว)
    INSERT INTO public.daily_quest_days
      (challenge_date, student_id, completed_count, required_count, all_complete)
    VALUES (v_today, NEW.student_id, v_completed, v_required,
       (v_completed >= v_required AND v_required > 0))
    ON CONFLICT (challenge_date, student_id) DO UPDATE SET
      completed_count = EXCLUDED.completed_count,
      required_count  = EXCLUDED.required_count;
  END IF;

  RETURN NEW;
END;
$function$;

-- trigger function: ไม่ควรเรียกผ่าน REST RPC (เรียกตรงจะ error อยู่แล้ว แต่ revoke เพื่อความสะอาด)
REVOKE EXECUTE ON FUNCTION public.process_daily_quest() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_process_daily_quest ON public.game_sessions;
CREATE TRIGGER trg_process_daily_quest
AFTER INSERT ON public.game_sessions
FOR EACH ROW EXECUTE FUNCTION public.process_daily_quest();

-- ════════════════════════════════════════════════════════════════════════
-- 4) RPCs
-- ════════════════════════════════════════════════════════════════════════

-- ฝั่งผู้เล่น (anon ผ่าน student_code) — สถานะเควสวันนี้
CREATE OR REPLACE FUNCTION public.get_daily_quest_status(p_student_code text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  v_student_id uuid;
  v_today      date := (now() AT TIME ZONE 'Asia/Bangkok')::date;
  v_subjects   jsonb;
  v_required   int;
  v_completed  int;
  v_day        public.daily_quest_days%ROWTYPE;
  v_total_pts  int;
BEGIN
  SELECT id INTO v_student_id FROM public.students
   WHERE student_code = p_student_code AND COALESCE(is_active, true) = true;
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'student_not_found' USING ERRCODE = 'P0001';
  END IF;

  SELECT
    jsonb_agg(jsonb_build_object(
      'key',   s.subject_key,
      'label', s.label_th,
      'icon',  s.icon,
      'done',  c.subject_key IS NOT NULL,
      'score', c.score
    ) ORDER BY s.sort_order),
    count(*),
    count(c.subject_key)
  INTO v_subjects, v_required, v_completed
  FROM public.daily_quest_subjects s
  LEFT JOIN public.daily_quest_completions c
    ON c.subject_key = s.subject_key
   AND c.student_id  = v_student_id
   AND c.challenge_date = v_today
  WHERE s.is_active = true;

  SELECT * INTO v_day FROM public.daily_quest_days
   WHERE student_id = v_student_id AND challenge_date = v_today;

  SELECT COALESCE(SUM(bonus_points), 0) INTO v_total_pts
   FROM public.daily_quest_days WHERE student_id = v_student_id;

  RETURN jsonb_build_object(
    'subjects',        COALESCE(v_subjects, '[]'::jsonb),
    'completed_count', COALESCE(v_completed, 0),
    'required_count',  COALESCE(v_required, 0),
    'all_complete',    COALESCE(v_day.all_complete, false),
    'bonus_points',    COALESCE(v_day.bonus_points, 0),
    'bonus_xp',        COALESCE(v_day.bonus_xp, 0),
    'streak_days',     COALESCE(v_day.streak_days, 0),
    'total_points',    v_total_pts
  );
END;
$function$;

-- ภาพรวมวันนี้ (non-PII, public big-screen ได้)
CREATE OR REPLACE FUNCTION public.get_daily_quest_overview(p_date date DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  v_date        date := COALESCE(p_date, (now() AT TIME ZONE 'Asia/Bangkok')::date);
  v_per_subject jsonb;
  v_participants int;
  v_all_complete int;
  v_required    int;
BEGIN
  SELECT count(*) INTO v_required FROM public.daily_quest_subjects WHERE is_active;

  SELECT jsonb_agg(jsonb_build_object(
           'subject_key', s.subject_key,
           'label',       s.label_th,
           'icon',        s.icon,
           'completed_students', COALESCE(cnt.n, 0)
         ) ORDER BY s.sort_order)
    INTO v_per_subject
  FROM public.daily_quest_subjects s
  LEFT JOIN (
    SELECT subject_key, count(*) AS n
    FROM public.daily_quest_completions
    WHERE challenge_date = v_date
    GROUP BY subject_key
  ) cnt ON cnt.subject_key = s.subject_key
  WHERE s.is_active;

  SELECT count(DISTINCT student_id) INTO v_participants
  FROM public.daily_quest_completions WHERE challenge_date = v_date;

  SELECT count(*) INTO v_all_complete
  FROM public.daily_quest_days WHERE challenge_date = v_date AND all_complete;

  RETURN jsonb_build_object(
    'date',               v_date,
    'subjects',           COALESCE(v_per_subject, '[]'::jsonb),
    'total_participants', COALESCE(v_participants, 0),
    'all_complete_count', COALESCE(v_all_complete, 0),
    'required_count',     COALESCE(v_required, 0)
  );
END;
$function$;

-- แนวโน้มรายวัน (non-PII)
CREATE OR REPLACE FUNCTION public.get_daily_quest_trend(p_days int DEFAULT 14)
RETURNS TABLE(d date, participants int, all_complete_count int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $function$
  WITH days AS (
    SELECT generate_series(
      (now() AT TIME ZONE 'Asia/Bangkok')::date - (GREATEST(p_days, 1) - 1),
      (now() AT TIME ZONE 'Asia/Bangkok')::date,
      interval '1 day')::date AS d
  )
  SELECT days.d,
    COALESCE((SELECT count(DISTINCT c.student_id)::int FROM public.daily_quest_completions c
              WHERE c.challenge_date = days.d), 0),
    COALESCE((SELECT count(*)::int FROM public.daily_quest_days dd
              WHERE dd.challenge_date = days.d AND dd.all_complete), 0)
  FROM days ORDER BY days.d;
$function$;

-- รายชื่อ participation (PII — เฉพาะครู/แอดมิน)
CREATE OR REPLACE FUNCTION public.get_daily_quest_participation(p_date date DEFAULT NULL)
RETURNS TABLE(student_id uuid, name text, class text, photo_url text,
              subjects_done text[], completed_count int, required_count int, all_complete boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  v_date     date := COALESCE(p_date, (now() AT TIME ZONE 'Asia/Bangkok')::date);
  v_required int;
BEGIN
  IF NOT public.is_teacher() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'P0001';
  END IF;
  SELECT count(*) INTO v_required FROM public.daily_quest_subjects WHERE is_active;

  RETURN QUERY
  SELECT st.id, st.name, st.class, st.photo_url,
         COALESCE(array_agg(c.subject_key) FILTER (WHERE c.subject_key IS NOT NULL), '{}'),
         count(c.subject_key)::int,
         v_required,
         COALESCE(d.all_complete, false)
  FROM public.daily_quest_completions c
  JOIN public.students st ON st.id = c.student_id
  LEFT JOIN public.daily_quest_days d
    ON d.student_id = c.student_id AND d.challenge_date = v_date
  WHERE c.challenge_date = v_date
  GROUP BY st.id, st.name, st.class, st.photo_url, d.all_complete
  ORDER BY count(c.subject_key) DESC, st.name;
END;
$function$;

-- Leaderboard streak ปัจจุบัน + คะแนนพิเศษสะสม (non-PII rank, public ได้)
CREATE OR REPLACE FUNCTION public.get_daily_quest_streak_leaderboard(p_limit int DEFAULT 10)
RETURNS TABLE(student_id uuid, name text, class text, photo_url text,
              current_streak int, total_points int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $function$
  WITH latest AS (
    SELECT DISTINCT ON (dd.student_id) dd.student_id, dd.streak_days, dd.challenge_date
    FROM public.daily_quest_days dd
    WHERE dd.all_complete
    ORDER BY dd.student_id, dd.challenge_date DESC
  ),
  pts AS (
    SELECT dd.student_id, SUM(dd.bonus_points)::int AS total_points
    FROM public.daily_quest_days dd GROUP BY dd.student_id
  )
  SELECT st.id, st.name, st.class, st.photo_url,
    CASE WHEN l.challenge_date >= (now() AT TIME ZONE 'Asia/Bangkok')::date - 1
         THEN l.streak_days ELSE 0 END AS current_streak,
    COALESCE(p.total_points, 0)
  FROM latest l
  JOIN public.students st ON st.id = l.student_id
  LEFT JOIN pts p ON p.student_id = l.student_id
  ORDER BY current_streak DESC, COALESCE(p.total_points, 0) DESC, st.name
  LIMIT GREATEST(p_limit, 1);
$function$;

-- ════════════════════════════════════════════════════════════════════════
-- 5) RLS
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE public.daily_quest_subjects    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_quest_config      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_quest_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_quest_days        ENABLE ROW LEVEL SECURITY;

-- config/subjects: อ่านได้ทุกคน (anon โชว์เควส), เขียนเฉพาะแอดมิน
DROP POLICY IF EXISTS dq_subjects_read  ON public.daily_quest_subjects;
DROP POLICY IF EXISTS dq_subjects_write ON public.daily_quest_subjects;
CREATE POLICY dq_subjects_read  ON public.daily_quest_subjects FOR SELECT USING (true);
CREATE POLICY dq_subjects_write ON public.daily_quest_subjects FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS dq_config_read  ON public.daily_quest_config;
DROP POLICY IF EXISTS dq_config_write ON public.daily_quest_config;
CREATE POLICY dq_config_read  ON public.daily_quest_config FOR SELECT USING (true);
CREATE POLICY dq_config_write ON public.daily_quest_config FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- completions/days: เขียนผ่าน trigger (SECURITY DEFINER) เท่านั้น — ไม่มี client write policy
-- อ่าน: ของตัวเอง (parent/student) หรือ ครู/แอดมิน
DROP POLICY IF EXISTS dq_completions_read ON public.daily_quest_completions;
CREATE POLICY dq_completions_read ON public.daily_quest_completions FOR SELECT
  USING (
    public.is_teacher()
    OR student_id IN (SELECT ur.student_id FROM public.user_roles ur WHERE ur.user_id = auth.uid())
  );

DROP POLICY IF EXISTS dq_days_read ON public.daily_quest_days;
CREATE POLICY dq_days_read ON public.daily_quest_days FOR SELECT
  USING (
    public.is_teacher()
    OR student_id IN (SELECT ur.student_id FROM public.user_roles ur WHERE ur.user_id = auth.uid())
  );

-- ════════════════════════════════════════════════════════════════════════
-- 6) Grants
-- ════════════════════════════════════════════════════════════════════════

GRANT EXECUTE ON FUNCTION public.get_daily_quest_status(text)             TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_quest_overview(date)           TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_quest_trend(int)               TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_quest_streak_leaderboard(int)  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_quest_participation(date)      TO authenticated;

-- ════════════════════════════════════════════════════════════════════════
-- 7) Seed (idempotent)
-- ════════════════════════════════════════════════════════════════════════

INSERT INTO public.daily_quest_config (id, all_complete_points, all_complete_xp)
VALUES (true, 50, 30)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.daily_quest_subjects (subject_key, label_th, icon, is_active, sort_order) VALUES
  ('math',    'คณิตศาสตร์', '🔢', true, 1),
  ('thai',    'ภาษาไทย',    '📖', true, 2),
  ('english', 'ภาษาอังกฤษ', '🔤', true, 3)
ON CONFLICT (subject_key) DO NOTHING;
