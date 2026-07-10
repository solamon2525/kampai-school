-- 391_one_day_research_phases.sql
-- รองรับแผนวิจัยก่อนเรียน/หลังเรียนภายในวันเดียว โดยให้ session แยก phase ผ่าน metadata.research_phase

DO $constraints$
DECLARE
  v_constraint RECORD;
BEGIN
  FOR v_constraint IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.game_research_studies'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%posttest_start%pretest_end%'
  LOOP
    EXECUTE format('ALTER TABLE public.game_research_studies DROP CONSTRAINT %I', v_constraint.conname);
  END LOOP;

  ALTER TABLE public.game_research_studies
    DROP CONSTRAINT IF EXISTS game_research_studies_one_day_phase_dates_check;

  ALTER TABLE public.game_research_studies
    ADD CONSTRAINT game_research_studies_one_day_phase_dates_check
    CHECK (
      pretest_end >= pretest_start
      AND posttest_end >= posttest_start
      AND posttest_start >= pretest_start
    );
END $constraints$;

UPDATE public.game_research_studies
SET pretest_start = CURRENT_DATE,
    pretest_end = CURRENT_DATE,
    posttest_start = CURRENT_DATE,
    posttest_end = CURRENT_DATE,
    max_rounds_per_day = GREATEST(max_rounds_per_day, 4),
    updated_at = now()
WHERE game_slug = 'multiply-race'
  AND class_name = 'ป.4'
  AND is_active = true;

DO $docs$
DECLARE
  v_staff_id UUID;
  v_url TEXT := '/games/math/multiply-race.html';
BEGIN
  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE NOTICE 'staff multiply-race owner not found - skip game_docs'; RETURN; END IF;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'ตอบคำถามสูตรคูณ (quiz) - เดี่ยว + ออนไลน์ + 2 คนจอเดียว + โหมดวิจัยก่อน/หลังเรียนวันเดียว',
         ARRAY[
           'แข่งเร็ว/ไม่จำกัด/ฝึกแม่/ชาเลนจ์วันนี้',
           'ปุ่มวิจัยในเมนูเกมแยกเป็น ก่อนเรียน และ หลังเรียน เพื่อเก็บคะแนนคนละ phase ในวันเดียว',
           'session วิจัยบันทึก metadata.research_phase = pretest/posttest เพื่อให้รายงานครูแยกคะแนนทันที',
           'Daily Challenge ใช้ seed รายวันและกันเล่นซ้ำจาก wrapper data',
           'Adaptive per-table mastery + ตราเก่งแม่สูตรคูณ',
           'โหมดออนไลน์ผ่าน KampaiMatch',
           'โหมด 2 คน split-screen บน PC (P1 ลูกศร / P2 WASD) + จอยแพด',
           'จอจบรองรับ KAMPAI result slot'
         ],
         'v1.1.3',
         'ปรับโหมดวิจัยให้ทำได้ในวันเดียว ด้วยปุ่มก่อนเรียน/หลังเรียนทั้งในเกมและหน้า wrapper พร้อมบันทึก phase ใน metadata ของ game_sessions'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
END $docs$;
