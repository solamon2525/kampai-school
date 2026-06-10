-- ===============================================================
-- Migration 152: Multiply Race — per-table mastery (Phase 2)
-- ===============================================================
-- เก็บสถิติการตอบรายแม่สูตรคูณ (2..12) ของนักเรียนแต่ละคน
-- ใช้คำนวณ "adaptive difficulty" (แม่ที่ผิดบ่อย → ขึ้นบ่อย) +
-- ตราเก่ง 🥉🥈🥇 รายแม่ ในจอเริ่มเกม
--
-- เข้าถึงผ่าน RPC SECURITY DEFINER เพราะนักเรียนเล่นเกมแบบ anonymous
-- (lookup ด้วย student_code ไม่มี auth.uid) — pattern เดียวกับ record_game_session
-- ===============================================================

CREATE TABLE IF NOT EXISTS public.multiply_race_mastery (
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  table_num int NOT NULL CHECK (table_num BETWEEN 2 AND 12),
  correct_count int NOT NULL DEFAULT 0,
  wrong_count int NOT NULL DEFAULT 0,
  fastest_avg_ms int,                                       -- เฉลี่ยเร็วสุดในแม่นี้ (sliding avg ms)
  last_practiced_at timestamptz NOT NULL DEFAULT now(),
  badge_level int NOT NULL DEFAULT 0,                       -- 0=none, 1=🥉, 2=🥈, 3=🥇
  PRIMARY KEY (student_id, table_num)
);

CREATE INDEX IF NOT EXISTS idx_multiply_race_mastery_student
  ON public.multiply_race_mastery(student_id, badge_level DESC);

ALTER TABLE public.multiply_race_mastery ENABLE ROW LEVEL SECURITY;

-- ครู/แอดมิน อ่านได้หมด (สำหรับ dashboard Phase 4)
DROP POLICY IF EXISTS "teacher_read_mr_mastery" ON public.multiply_race_mastery;
CREATE POLICY "teacher_read_mr_mastery" ON public.multiply_race_mastery
  FOR SELECT USING (public.is_teacher());

-- ไม่มี policy สำหรับ anon — เข้าถึงผ่าน RPC เท่านั้น

COMMENT ON TABLE public.multiply_race_mastery IS 'Per-table mastery สำหรับ multiply-race (Phase 2: adaptive + badges)';

-- ─── RPC: ดึง mastery + weight ของนักเรียนผ่าน student_code (anon-callable) ─
CREATE OR REPLACE FUNCTION public.get_multiply_race_mastery(p_student_code text)
RETURNS TABLE (
  table_num int,
  correct_count int,
  wrong_count int,
  fastest_avg_ms int,
  badge_level int,
  weight int                                                -- 1..9 — ใช้ใน weighted random
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
BEGIN
  -- resolve student
  SELECT id INTO v_student_id FROM public.students s WHERE s.student_code = p_student_code AND s.is_active = true LIMIT 1;
  IF v_student_id IS NULL THEN RETURN; END IF;

  -- generate 11 แม่ (2..12) เสมอ join กับสถิติที่มี — แม่ไม่มีสถิติ weight = 1
  RETURN QUERY
    SELECT
      t.n AS table_num,
      COALESCE(m.correct_count, 0)::int AS correct_count,
      COALESCE(m.wrong_count, 0)::int AS wrong_count,
      m.fastest_avg_ms,
      COALESCE(m.badge_level, 0)::int AS badge_level,
      -- weight = 1 + (wrong_count * 2), clamp 1..9
      LEAST(9, GREATEST(1, 1 + COALESCE(m.wrong_count, 0) * 2))::int AS weight
    FROM generate_series(2, 12) AS t(n)
    LEFT JOIN public.multiply_race_mastery m
      ON m.student_id = v_student_id AND m.table_num = t.n
    ORDER BY t.n;
END;
$$;

-- ─── RPC: บันทึก per-table stats หลังเล่นจบ (anon-callable) ──────────────
-- p_per_table = jsonb array: [{table:7, correct:3, wrong:2, avgMs:2400}, ...]
CREATE OR REPLACE FUNCTION public.update_multiply_race_mastery(
  p_student_code text,
  p_per_table jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
  v_row jsonb;
  v_table int;
  v_correct int;
  v_wrong int;
  v_avg_ms int;
  v_new_correct int;
  v_new_badge int;
BEGIN
  SELECT id INTO v_student_id FROM public.students s WHERE s.student_code = p_student_code AND s.is_active = true LIMIT 1;
  IF v_student_id IS NULL THEN RETURN; END IF;
  IF p_per_table IS NULL OR jsonb_typeof(p_per_table) <> 'array' THEN RETURN; END IF;

  FOR v_row IN SELECT * FROM jsonb_array_elements(p_per_table)
  LOOP
    v_table := (v_row->>'table')::int;
    v_correct := COALESCE((v_row->>'correct')::int, 0);
    v_wrong := COALESCE((v_row->>'wrong')::int, 0);
    v_avg_ms := NULLIF((v_row->>'avgMs')::int, 0);

    IF v_table IS NULL OR v_table < 2 OR v_table > 12 THEN CONTINUE; END IF;
    IF v_correct = 0 AND v_wrong = 0 THEN CONTINUE; END IF;

    INSERT INTO public.multiply_race_mastery (student_id, table_num, correct_count, wrong_count, fastest_avg_ms, last_practiced_at)
    VALUES (v_student_id, v_table, v_correct, v_wrong, v_avg_ms, now())
    ON CONFLICT (student_id, table_num) DO UPDATE SET
      correct_count = multiply_race_mastery.correct_count + v_correct,
      wrong_count = multiply_race_mastery.wrong_count + v_wrong,
      fastest_avg_ms = CASE
        WHEN v_avg_ms IS NULL THEN multiply_race_mastery.fastest_avg_ms
        WHEN multiply_race_mastery.fastest_avg_ms IS NULL THEN v_avg_ms
        ELSE LEAST(multiply_race_mastery.fastest_avg_ms, v_avg_ms)
      END,
      last_practiced_at = now()
    RETURNING correct_count INTO v_new_correct;

    -- badge thresholds: 🥉 = 30 correct, 🥈 = 80 correct, 🥇 = 150 correct
    v_new_badge := CASE
      WHEN v_new_correct >= 150 THEN 3
      WHEN v_new_correct >= 80 THEN 2
      WHEN v_new_correct >= 30 THEN 1
      ELSE 0
    END;
    UPDATE public.multiply_race_mastery
      SET badge_level = v_new_badge
      WHERE student_id = v_student_id AND table_num = v_table AND badge_level < v_new_badge;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_multiply_race_mastery(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_multiply_race_mastery(text, jsonb) TO anon, authenticated;
