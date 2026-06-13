-- ============================================================================
-- Migration 170: Curriculum Indicators Backbone (กระดูกสันหลังตัวชี้วัด)
-- ============================================================================
-- ชั้นข้อมูลใหม่: ตัวชี้วัดหลักสูตรแกนกลาง 2551 ระดับนักเรียน เชื่อม
--   เกม ↔ ตัวชี้วัด ↔ แผนการเรียน ↔ ความก้าวหน้านักเรียน (หลักฐานผสม เกม + สมุดคะแนน)
-- Phase 1: ตาราง + RLS + view + helper (seed ตัวชี้วัดอยู่ในไฟล์ seed แยก)
-- subject_key sync กับ subject_keys() (migration 158): thai|math|science|english|...
-- ============================================================================

-- ─── helper: derive ระดับชั้น จาก class TEXT ('ป.1/2' → 'ป.1') ────────────────
CREATE OR REPLACE FUNCTION public.grade_from_class(p_class text)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
  SELECT NULLIF(TRIM(split_part(COALESCE(p_class, ''), '/', 1)), '');
$$;

-- ─── 1. ตัวชี้วัด ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.curriculum_indicators (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_key    TEXT NOT NULL,           -- 'thai'|'math'|'science'|'english' (sync subject_keys())
  grade          TEXT NOT NULL,           -- 'ป.1'..'ป.6'
  strand_no      TEXT,                    -- สาระที่
  strand_title   TEXT,                    -- ชื่อสาระ
  standard_code  TEXT,                    -- มาตรฐาน เช่น 'ท 1.1'
  indicator_code TEXT NOT NULL,           -- ตัวชี้วัด เช่น 'ท 1.1 ป.1/1'
  description    TEXT NOT NULL,           -- ข้อความตัวชี้วัด
  sort_order     INT NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (indicator_code, grade)
);
CREATE INDEX IF NOT EXISTS idx_curr_ind_subject_grade
  ON public.curriculum_indicators (subject_key, grade, sort_order);

-- ─── 2. Mapping: เกม ↔ ตัวชี้วัด ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.indicator_games (
  indicator_id    UUID NOT NULL REFERENCES public.curriculum_indicators(id) ON DELETE CASCADE,
  edu_hub_item_id UUID NOT NULL REFERENCES public.educational_hub_items(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (indicator_id, edu_hub_item_id)
);
CREATE INDEX IF NOT EXISTS idx_indicator_games_item ON public.indicator_games (edu_hub_item_id);

-- ─── 3. Mapping: แผนการเรียน ↔ ตัวชี้วัด ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.indicator_lesson_plans (
  indicator_id   UUID NOT NULL REFERENCES public.curriculum_indicators(id) ON DELETE CASCADE,
  lesson_plan_id UUID NOT NULL REFERENCES public.lesson_plans(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (indicator_id, lesson_plan_id)
);
CREATE INDEX IF NOT EXISTS idx_indicator_lp_plan ON public.indicator_lesson_plans (lesson_plan_id);

-- ─── 4a. หลักฐานจากเกม (auto via trigger ใน Phase 3) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.student_indicator_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  indicator_id UUID NOT NULL REFERENCES public.curriculum_indicators(id) ON DELETE CASCADE,
  game_slug    TEXT,
  session_id   UUID REFERENCES public.game_sessions(id) ON DELETE SET NULL,
  score        INT,
  passed       BOOLEAN NOT NULL DEFAULT false,
  event_date   DATE NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Bangkok')::date,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sie_student_ind ON public.student_indicator_events (student_id, indicator_id);

-- ─── 4b. หลักฐานจากครู/สมุดคะแนน (manual) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.student_indicator_assessments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  indicator_id  UUID NOT NULL REFERENCES public.curriculum_indicators(id) ON DELETE CASCADE,
  level         INT CHECK (level BETWEEN 1 AND 4),  -- 1 กำลังพัฒนา · 2 พอใช้ · 3 ดี · 4 ดีเยี่ยม
  academic_year TEXT NOT NULL,
  semester      TEXT,
  source        TEXT NOT NULL DEFAULT 'manual',     -- 'manual' | 'from_score_record'
  assessed_by   UUID,
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, indicator_id, academic_year)
);
CREATE INDEX IF NOT EXISTS idx_sia_student_ind ON public.student_indicator_assessments (student_id, indicator_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.curriculum_indicators        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicator_games              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicator_lesson_plans       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_indicator_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_indicator_assessments ENABLE ROW LEVEL SECURITY;

-- ตัวชี้วัด: อ่าน public (active) · เขียน admin
DROP POLICY IF EXISTS "read_curriculum_indicators"  ON public.curriculum_indicators;
DROP POLICY IF EXISTS "admin_write_curriculum_indicators" ON public.curriculum_indicators;
CREATE POLICY "read_curriculum_indicators" ON public.curriculum_indicators
  FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "admin_write_curriculum_indicators" ON public.curriculum_indicators
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- mapping เกม↔ตัวชี้วัด: อ่าน public · เขียน teacher/admin
DROP POLICY IF EXISTS "read_indicator_games"  ON public.indicator_games;
DROP POLICY IF EXISTS "teacher_write_indicator_games" ON public.indicator_games;
CREATE POLICY "read_indicator_games" ON public.indicator_games
  FOR SELECT USING (true);
CREATE POLICY "teacher_write_indicator_games" ON public.indicator_games
  FOR ALL USING (public.is_teacher()) WITH CHECK (public.is_teacher());

-- mapping แผน↔ตัวชี้วัด: อ่าน public · เขียน teacher/admin
DROP POLICY IF EXISTS "read_indicator_lesson_plans"  ON public.indicator_lesson_plans;
DROP POLICY IF EXISTS "teacher_write_indicator_lesson_plans" ON public.indicator_lesson_plans;
CREATE POLICY "read_indicator_lesson_plans" ON public.indicator_lesson_plans
  FOR SELECT USING (true);
CREATE POLICY "teacher_write_indicator_lesson_plans" ON public.indicator_lesson_plans
  FOR ALL USING (public.is_teacher()) WITH CHECK (public.is_teacher());

-- หลักฐานเกม: อ่าน teacher/admin (นักเรียนเข้าถึงผ่าน RPC SECURITY DEFINER ใน Phase 3)
-- insert ทำโดย trigger SECURITY DEFINER → ไม่ต้องมี client write policy
DROP POLICY IF EXISTS "teacher_read_student_indicator_events" ON public.student_indicator_events;
CREATE POLICY "teacher_read_student_indicator_events" ON public.student_indicator_events
  FOR SELECT USING (public.is_teacher());

-- ประเมินครู: teacher/admin จัดการได้
DROP POLICY IF EXISTS "teacher_manage_student_indicator_assessments" ON public.student_indicator_assessments;
CREATE POLICY "teacher_manage_student_indicator_assessments" ON public.student_indicator_assessments
  FOR ALL USING (public.is_teacher()) WITH CHECK (public.is_teacher());

-- ─── View รวมสถานะ (security_invoker = เคารพ RLS ของตารางต้นทาง) ──────────────
CREATE OR REPLACE VIEW public.v_student_indicator_mastery
WITH (security_invoker = true) AS
WITH ev AS (
  SELECT student_id, indicator_id,
         bool_or(passed)  AS any_passed,
         count(*)         AS attempts,
         max(score)       AS best_score,
         max(event_date)  AS last_event
  FROM public.student_indicator_events
  GROUP BY student_id, indicator_id
),
asmt AS (
  SELECT DISTINCT ON (student_id, indicator_id)
         student_id, indicator_id, level, academic_year, source, updated_at
  FROM public.student_indicator_assessments
  ORDER BY student_id, indicator_id, academic_year DESC, updated_at DESC
)
SELECT
  COALESCE(ev.student_id, a.student_id)     AS student_id,
  COALESCE(ev.indicator_id, a.indicator_id) AS indicator_id,
  COALESCE(ev.attempts, 0)                  AS attempts,
  COALESCE(ev.any_passed, false)            AS any_passed,
  ev.best_score,
  ev.last_event,
  a.level                                   AS assessed_level,
  a.source                                  AS assessed_source,
  CASE
    WHEN a.level >= 4                       THEN 'mastered'
    WHEN a.level = 3 OR ev.any_passed       THEN 'passed'
    WHEN a.level IN (1,2) OR ev.attempts > 0 THEN 'practicing'
    ELSE 'not_started'
  END                                       AS status
FROM ev
FULL OUTER JOIN asmt a
  ON a.student_id = ev.student_id AND a.indicator_id = ev.indicator_id;
