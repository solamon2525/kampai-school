-- 437: expand lesson_packs — ชุดคาบเพิ่มเติม (Phase P6 / phase10)
-- Same owner pattern as 430 (ครูณัฐพงศ์). INSERT WHERE NOT EXISTS on (owner_staff_id, pack_key).
-- Does not re-seed packs from 430: multiplication, short-division, phonics, food-chain, sufficiency.

DO $$
DECLARE
  v_staff_id UUID;
BEGIN
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN
    SELECT id INTO v_staff_id FROM public.staff
    WHERE staff_type = 'teaching' ORDER BY created_at LIMIT 1;
  END IF;
  IF v_staff_id IS NULL THEN
    RAISE NOTICE '437: skip seed lesson_packs (no teaching staff)';
    RETURN;
  END IF;

  -- clock (คณิต)
  INSERT INTO public.lesson_packs (owner_staff_id, pack_key, title, subject, grade_label, sort_order, access, steps)
  SELECT
    v_staff_id, 'clock',
    'คาบนาฬิกา — สอน · ฝึก · ใบงาน',
    'คณิตศาสตร์', 'ป.1–3', 60, 'link',
    '[
      {"type":"note","label":"เป้าหมายคาบ","hint":"อ่านเวลาและบอกช่วงเวลาได้"},
      {"type":"media","label":"1) สอนบนจอ","url":"/games/math/clock-media.html","hint":"โหมดสอน → ฝึกสั้น"},
      {"type":"worksheet","label":"2) ใบงานพิมพ์","url":"/games/math/clock-worksheet.html","worksheet_key":"clock","hint":"เขียนเวลาและวาดเข็ม"},
      {"type":"media","label":"3) เฉลยโปรเจคเตอร์","url":"/games/math/clock-worksheet.html?present=1","hint":"present=1 + เฉลยทีละข้อ"}
    ]'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.lesson_packs lp
    WHERE lp.owner_staff_id = v_staff_id AND lp.pack_key = 'clock'
  );

  -- moon-phases (วิทย์)
  INSERT INTO public.lesson_packs (owner_staff_id, pack_key, title, subject, grade_label, sort_order, access, steps)
  SELECT
    v_staff_id, 'moon-phases',
    'คาบข้างขึ้นข้างแรม — สอน · ฝึก · ใบงาน',
    'วิทยาศาสตร์', 'ป.4–6', 70, 'link',
    '[
      {"type":"note","label":"เป้าหมายคาบ","hint":"เรียงลำดับข้างขึ้นข้างแรมและอธิบายได้"},
      {"type":"media","label":"1) สอนบนจอ","url":"/games/science/moon-phases-media.html","hint":"สอน → ฝึกสั้น"},
      {"type":"worksheet","label":"2) ใบงานพิมพ์","url":"/games/science/moon-phases-worksheet.html","worksheet_key":"moon-phases","hint":"วาด/เรียงเฟสดวงจันทร์"},
      {"type":"media","label":"3) เฉลยโปรเจคเตอร์","url":"/games/science/moon-phases-worksheet.html?present=1","hint":"present=1"}
    ]'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.lesson_packs lp
    WHERE lp.owner_staff_id = v_staff_id AND lp.pack_key = 'moon-phases'
  );

  -- light-sort (วิทย์)
  INSERT INTO public.lesson_packs (owner_staff_id, pack_key, title, subject, grade_label, sort_order, access, steps)
  SELECT
    v_staff_id, 'light-sort',
    'คาบแยกประเภทแสง — สอน · ฝึก · ใบงาน',
    'วิทยาศาสตร์', 'ป.4–6', 80, 'link',
    '[
      {"type":"note","label":"เป้าหมายคาบ","hint":"แยกวัตถุโปร่งใส โปร่งแสง ทึบแสงได้"},
      {"type":"media","label":"1) สอนบนจอ","url":"/games/science/light-sort-media.html","hint":"สอน → จัดกลุ่ม → ฝึกสั้น"},
      {"type":"worksheet","label":"2) ใบงานพิมพ์","url":"/games/science/light-sort-worksheet.html","worksheet_key":"light-sort","hint":"จัดกลุ่มและให้เหตุผล"},
      {"type":"media","label":"3) เฉลยโปรเจคเตอร์","url":"/games/science/light-sort-worksheet.html?present=1","hint":"present=1"}
    ]'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.lesson_packs lp
    WHERE lp.owner_staff_id = v_staff_id AND lp.pack_key = 'light-sort'
  );

  -- first-aid (สุข)
  INSERT INTO public.lesson_packs (owner_staff_id, pack_key, title, subject, grade_label, sort_order, access, steps)
  SELECT
    v_staff_id, 'first-aid',
    'คาบปฐมพยาบาล — สอน · ฝึก · ใบงาน',
    'สุขศึกษา', 'ป.4–6', 90, 'link',
    '[
      {"type":"note","label":"เป้าหมายคาบ","hint":"ลำดับขั้นตอนปฐมพยาบาลเบื้องต้นได้"},
      {"type":"media","label":"1) สอนบนจอ","url":"/games/health/first-aid-media.html","hint":"สอน → สถานการณ์ → ฝึกสั้น"},
      {"type":"worksheet","label":"2) ใบงานพิมพ์","url":"/games/health/first-aid-worksheet.html","worksheet_key":"first-aid","hint":"เลือกขั้นตอนและอธิบาย"},
      {"type":"media","label":"3) เฉลยโปรเจคเตอร์","url":"/games/health/first-aid-worksheet.html?present=1","hint":"present=1"}
    ]'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.lesson_packs lp
    WHERE lp.owner_staff_id = v_staff_id AND lp.pack_key = 'first-aid'
  );

  -- bone-muscle (สุข)
  INSERT INTO public.lesson_packs (owner_staff_id, pack_key, title, subject, grade_label, sort_order, access, steps)
  SELECT
    v_staff_id, 'bone-muscle',
    'คาบกระดูกและกล้ามเนื้อ — สอน · ฝึก · ใบงาน',
    'สุขศึกษา', 'ป.4–6', 100, 'link',
    '[
      {"type":"note","label":"เป้าหมายคาบ","hint":"บอกหน้าที่กระดูกและกล้ามเนื้อได้"},
      {"type":"media","label":"1) สอนบนจอ","url":"/games/health/bone-muscle-media.html","hint":"สอน → ฝึกสั้น"},
      {"type":"worksheet","label":"2) ใบงานพิมพ์","url":"/games/health/bone-muscle-worksheet.html","worksheet_key":"bone-muscle","hint":"จับคู่และอธิบาย"},
      {"type":"media","label":"3) เฉลยโปรเจคเตอร์","url":"/games/health/bone-muscle-worksheet.html?present=1","hint":"present=1"}
    ]'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.lesson_packs lp
    WHERE lp.owner_staff_id = v_staff_id AND lp.pack_key = 'bone-muscle'
  );

  -- past-tense (อังกฤษ) — media/worksheet ใช้ past-tense-mini
  INSERT INTO public.lesson_packs (owner_staff_id, pack_key, title, subject, grade_label, sort_order, access, steps)
  SELECT
    v_staff_id, 'past-tense',
    'คาบ Past Tense — สอน · ฝึก · ใบงาน',
    'ภาษาอังกฤษ', 'ป.4–6', 110, 'link',
    '[
      {"type":"note","label":"เป้าหมายคาบ","hint":"เปลี่ยนกริยาเป็น past tense ได้"},
      {"type":"media","label":"1) สอนบนจอ","url":"/games/english/past-tense-mini-media.html","hint":"สอน → ฝึกสั้น"},
      {"type":"worksheet","label":"2) ใบงานพิมพ์","url":"/games/english/past-tense-mini-worksheet.html","worksheet_key":"past-tense-mini","hint":"เขียนรูป past และประโยค"},
      {"type":"media","label":"3) เฉลยโปรเจคเตอร์","url":"/games/english/past-tense-mini-worksheet.html?present=1","hint":"present=1"}
    ]'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.lesson_packs lp
    WHERE lp.owner_staff_id = v_staff_id AND lp.pack_key = 'past-tense'
  );

  -- fact-opinion (ไทย)
  INSERT INTO public.lesson_packs (owner_staff_id, pack_key, title, subject, grade_label, sort_order, access, steps)
  SELECT
    v_staff_id, 'fact-opinion',
    'คาบข้อเท็จจริง–ความคิดเห็น — สอน · ฝึก · ใบงาน',
    'ภาษาไทย', 'ป.4–6', 120, 'link',
    '[
      {"type":"note","label":"เป้าหมายคาบ","hint":"แยกข้อเท็จจริงกับความคิดเห็นได้"},
      {"type":"media","label":"1) สอนบนจอ","url":"/games/thai/fact-opinion-media.html","hint":"สอน → ฝึกสั้น"},
      {"type":"worksheet","label":"2) ใบงานพิมพ์","url":"/games/thai/fact-opinion-worksheet.html","worksheet_key":"fact-opinion","hint":"จัดกลุ่มประโยคและให้เหตุผล"},
      {"type":"media","label":"3) เฉลยโปรเจคเตอร์","url":"/games/thai/fact-opinion-worksheet.html?present=1","hint":"present=1"}
    ]'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.lesson_packs lp
    WHERE lp.owner_staff_id = v_staff_id AND lp.pack_key = 'fact-opinion'
  );

  -- community-jobs (อาชีพ)
  INSERT INTO public.lesson_packs (owner_staff_id, pack_key, title, subject, grade_label, sort_order, access, steps)
  SELECT
    v_staff_id, 'community-jobs',
    'คาบอาชีพในชุมชน — สอน · ฝึก · ใบงาน',
    'อาชีพ', 'ป.1–3', 130, 'link',
    '[
      {"type":"note","label":"เป้าหมายคาบ","hint":"บอกอาชีพและประโยชน์ต่อชุมชนได้"},
      {"type":"media","label":"1) สอนบนจอ","url":"/games/career/community-jobs-media.html","hint":"สอน → ฝึกสั้น"},
      {"type":"worksheet","label":"2) ใบงานพิมพ์","url":"/games/career/community-jobs-worksheet.html","worksheet_key":"community-jobs","hint":"จับคู่อาชีพกับงาน"},
      {"type":"media","label":"3) เฉลยโปรเจคเตอร์","url":"/games/career/community-jobs-worksheet.html?present=1","hint":"present=1"}
    ]'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.lesson_packs lp
    WHERE lp.owner_staff_id = v_staff_id AND lp.pack_key = 'community-jobs'
  );

  -- online-safety (เทค)
  INSERT INTO public.lesson_packs (owner_staff_id, pack_key, title, subject, grade_label, sort_order, access, steps)
  SELECT
    v_staff_id, 'online-safety',
    'คาบความปลอดภัยออนไลน์ — สอน · ฝึก · ใบงาน',
    'เทคโนโลยี', 'ป.4–6', 140, 'link',
    '[
      {"type":"note","label":"เป้าหมายคาบ","hint":"เลือกพฤติกรรมปลอดภัยบนอินเทอร์เน็ตได้"},
      {"type":"media","label":"1) สอนบนจอ","url":"/games/tech/online-safety-media.html","hint":"สอน → สถานการณ์ → ฝึกสั้น"},
      {"type":"worksheet","label":"2) ใบงานพิมพ์","url":"/games/tech/online-safety-worksheet.html","worksheet_key":"online-safety","hint":"เลือกทางเลือกและให้เหตุผล"},
      {"type":"media","label":"3) เฉลยโปรเจคเตอร์","url":"/games/tech/online-safety-worksheet.html?present=1","hint":"present=1"}
    ]'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.lesson_packs lp
    WHERE lp.owner_staff_id = v_staff_id AND lp.pack_key = 'online-safety'
  );

  -- color-mix (ศิลป์)
  INSERT INTO public.lesson_packs (owner_staff_id, pack_key, title, subject, grade_label, sort_order, access, steps)
  SELECT
    v_staff_id, 'color-mix',
    'คาบผสมสี — สอน · ฝึก · ใบงาน',
    'ศิลปะ', 'ป.1–3', 150, 'link',
    '[
      {"type":"note","label":"เป้าหมายคาบ","hint":"ผสมสีหลักเป็นสีทุติยภูมิได้"},
      {"type":"media","label":"1) สอนบนจอ","url":"/games/arts/color-mix-media.html","hint":"สอน → ฝึกสั้น"},
      {"type":"worksheet","label":"2) ใบงานพิมพ์","url":"/games/arts/color-mix-worksheet.html","worksheet_key":"color-mix","hint":"ผสมสีและบันทึกผล"},
      {"type":"media","label":"3) เฉลยโปรเจคเตอร์","url":"/games/arts/color-mix-worksheet.html?present=1","hint":"present=1"}
    ]'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.lesson_packs lp
    WHERE lp.owner_staff_id = v_staff_id AND lp.pack_key = 'color-mix'
  );
END $$;
