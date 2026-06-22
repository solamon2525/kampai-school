-- 222_english_quest.sql
-- English Quest — แอปเรียนศัพท์อังกฤษรายวันแบบเกม (server-backed progress + reuse XP engine)
-- ตาราง: หลักสูตร (worlds→lessons→words, public read) + progress ต่อนักเรียน (RPC-only)
-- RPC: get_state / complete_lesson (→ record_game_session ให้ XP+streak) / set_mascot
-- เนื้อหา (คำศัพท์) แยกไฟล์ seed ถัดไป

-- ─── 1) หลักสูตร ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.english_quest_worlds (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  world_key   text UNIQUE NOT NULL,
  title_th    text NOT NULL,
  title_en    text NOT NULL,
  theme       text,
  icon_emoji  text,
  color       text,                       -- token เช่น 'sky'|'amber' (map เป็น CSS var ฝั่ง UI — ห้าม hex)
  sort_order  int  NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.english_quest_lessons (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id    uuid NOT NULL REFERENCES public.english_quest_worlds(id) ON DELETE CASCADE,
  lesson_no   int  NOT NULL,
  title_th    text NOT NULL,
  sort_order  int  NOT NULL DEFAULT 0,
  UNIQUE (world_id, lesson_no)
);

CREATE TABLE IF NOT EXISTS public.english_quest_words (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id       uuid NOT NULL REFERENCES public.english_quest_lessons(id) ON DELETE CASCADE,
  word_en         text NOT NULL,
  meaning_th      text NOT NULL,
  part_of_speech  text,
  example_en      text,
  emoji           text,
  sort_order      int  NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_eq_lessons_world ON public.english_quest_lessons(world_id);
CREATE INDEX IF NOT EXISTS idx_eq_words_lesson  ON public.english_quest_words(lesson_id);

-- ─── 2) progress ต่อนักเรียน ───────────────────────────────────────────────
-- lesson_stars: { "<lesson_id>": 1..3 } (มี key = เรียนจบแล้ว · ดาวรวม = sum ของ value)
CREATE TABLE IF NOT EXISTS public.english_quest_progress (
  student_id        uuid PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  mascot_name       text,
  lesson_stars      jsonb NOT NULL DEFAULT '{}'::jsonb,
  current_world_id  uuid REFERENCES public.english_quest_worlds(id),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ─── 3) RLS ────────────────────────────────────────────────────────────────
-- หลักสูตร = public read (เหมือน 159_achievements_public_read)
ALTER TABLE public.english_quest_worlds  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.english_quest_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.english_quest_words   ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS read_eq_worlds  ON public.english_quest_worlds;
DROP POLICY IF EXISTS read_eq_lessons ON public.english_quest_lessons;
DROP POLICY IF EXISTS read_eq_words   ON public.english_quest_words;
CREATE POLICY read_eq_worlds  ON public.english_quest_worlds  FOR SELECT USING (true);
CREATE POLICY read_eq_lessons ON public.english_quest_lessons FOR SELECT USING (true);
CREATE POLICY read_eq_words   ON public.english_quest_words   FOR SELECT USING (true);

-- progress = ไม่เปิด anon ตรง (เข้าผ่าน RPC SECURITY DEFINER) · admin ดูได้ (teacher dashboard อนาคต)
ALTER TABLE public.english_quest_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_eq_progress ON public.english_quest_progress;
CREATE POLICY admin_eq_progress ON public.english_quest_progress FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ─── 4) RPC: get_state ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.english_quest_get_state(p_student_code text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
  v_prog       public.english_quest_progress;
  v_total_xp   int;
BEGIN
  SELECT id INTO v_student_id FROM public.students
  WHERE student_code = p_student_code AND COALESCE(is_active, true) = true;
  IF v_student_id IS NULL THEN RAISE EXCEPTION 'student_not_found' USING ERRCODE = 'P0001'; END IF;

  INSERT INTO public.english_quest_progress (student_id) VALUES (v_student_id)
  ON CONFLICT (student_id) DO NOTHING;
  SELECT * INTO v_prog FROM public.english_quest_progress WHERE student_id = v_student_id;

  SELECT COALESCE(total_xp, 0) INTO v_total_xp
  FROM public.student_global_profile WHERE student_id = v_student_id;

  RETURN jsonb_build_object(
    'mascot_name',      v_prog.mascot_name,
    'lesson_stars',     v_prog.lesson_stars,
    'current_world_id', v_prog.current_world_id,
    'total_xp',         COALESCE(v_total_xp, 0)
  );
END;
$$;

-- ─── 5) RPC: complete_lesson (→ record_game_session ให้ XP/streak/อันดับ) ───
CREATE OR REPLACE FUNCTION public.english_quest_complete_lesson(
  p_student_code text, p_lesson_id uuid, p_correct int, p_total int
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
  v_score      int;
  v_stars      int;
  v_xp_result  jsonb := jsonb_build_object('xp_earned', 0, 'total_xp', 0, 'unlocked', '[]'::jsonb);
BEGIN
  SELECT id INTO v_student_id FROM public.students
  WHERE student_code = p_student_code AND COALESCE(is_active, true) = true;
  IF v_student_id IS NULL THEN RAISE EXCEPTION 'student_not_found' USING ERRCODE = 'P0001'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.english_quest_lessons WHERE id = p_lesson_id) THEN
    RAISE EXCEPTION 'lesson_not_found' USING ERRCODE = 'P0001';
  END IF;

  v_score := LEAST(100, GREATEST(0, ROUND(p_correct::numeric / GREATEST(p_total, 1) * 100)))::int;
  v_stars := CASE WHEN v_score >= 100 THEN 3 WHEN v_score >= 80 THEN 2 WHEN v_score >= 50 THEN 1 ELSE 0 END;

  -- เก็บดาวที่ "ดีที่สุด" ต่อบท (เล่นซ้ำได้ดาวเพิ่ม ไม่ลด)
  INSERT INTO public.english_quest_progress (student_id, lesson_stars)
  VALUES (v_student_id, jsonb_build_object(p_lesson_id::text, v_stars))
  ON CONFLICT (student_id) DO UPDATE SET
    lesson_stars = public.english_quest_progress.lesson_stars || jsonb_build_object(
      p_lesson_id::text,
      GREATEST(v_stars, COALESCE((public.english_quest_progress.lesson_stars->>p_lesson_id::text)::int, 0))
    ),
    updated_at = now();

  -- XP/streak ผ่าน engine กลาง (score ≤100 = ปลอด anti-farm duration check). rate-limit 1/5s → กันพังด้วย sub-block
  BEGIN
    v_xp_result := public.record_game_session(
      p_student_code, 'english-quest', v_score, 'lesson', NULL,
      jsonb_build_object('lesson_id', p_lesson_id, 'correct', p_correct, 'total', p_total)
    );
  EXCEPTION WHEN OTHERS THEN
    v_xp_result := jsonb_build_object('xp_earned', 0, 'total_xp', 0, 'unlocked', '[]'::jsonb, 'xp_skipped', SQLERRM);
  END;

  RETURN v_xp_result || jsonb_build_object('score', v_score, 'stars', v_stars);
END;
$$;

-- ─── 6) RPC: set_mascot ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.english_quest_set_mascot(p_student_code text, p_name text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_student_id uuid;
BEGIN
  SELECT id INTO v_student_id FROM public.students
  WHERE student_code = p_student_code AND COALESCE(is_active, true) = true;
  IF v_student_id IS NULL THEN RAISE EXCEPTION 'student_not_found' USING ERRCODE = 'P0001'; END IF;

  INSERT INTO public.english_quest_progress (student_id, mascot_name)
  VALUES (v_student_id, NULLIF(btrim(p_name), ''))
  ON CONFLICT (student_id) DO UPDATE SET mascot_name = NULLIF(btrim(p_name), ''), updated_at = now();

  RETURN jsonb_build_object('ok', true, 'mascot_name', NULLIF(btrim(p_name), ''));
END;
$$;

GRANT EXECUTE ON FUNCTION public.english_quest_get_state(text)              TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.english_quest_complete_lesson(text, uuid, int, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.english_quest_set_mascot(text, text)       TO anon, authenticated;

-- ─── 7) seed item ใน educational_hub_items → ให้ record_game_session attribute XP เข้า "ภาษาอังกฤษ" ─
-- subject ต้องมี 'อังกฤษ' (subject_keys ใน 155 match '%อังกฤษ%') · tracked_game=true (เงื่อนไข record_game_session)
-- is_published=false = ไม่โผล่ในกริดเกม (เข้าผ่าน route /english-quest)
DO $$
DECLARE v_staff_id uuid; v_cat_games uuid;
BEGIN
  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching' ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'staff not found'; END IF;
  SELECT id INTO v_cat_games FROM public.educational_hub_categories WHERE category_key = 'games';
  IF v_cat_games IS NULL THEN RAISE EXCEPTION 'category games not found'; END IF;

  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link', '🦊 English Quest — ผจญภัยศัพท์อังกฤษ', '/english-quest', 'ภาษาอังกฤษ', 900
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = '/english-quest'
  );

  UPDATE public.educational_hub_items
  SET game_slug = 'english-quest', tracked_game = true, is_published = false, subject = 'ภาษาอังกฤษ', updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = '/english-quest';
END $$;
