-- 434: seed 10 new educational games (Phase 9 content fill)
-- clock-quest · moon-phases-race · light-sort · bone-muscle-quest · first-aid-rush
-- sufficiency-sim · community-jobs-match · past-tense-run · follow-instructions-lab · fact-opinion-duel

DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  r RECORD;
BEGIN
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN
    RAISE EXCEPTION '434: staff not found';
  END IF;

  SELECT id INTO v_cat_games
  FROM public.educational_hub_categories WHERE category_key = 'games'
  LIMIT 1;
  IF v_cat_games IS NULL THEN
    RAISE EXCEPTION '434: category games not found';
  END IF;

  INSERT INTO public.educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_staff_id, true)
  ON CONFLICT (staff_id) DO NOTHING;

  FOR r IN
    SELECT * FROM (VALUES
      ('/games/math/clock-quest.html', 'clock-quest', 'นาฬิกาแสนสนุก', 'คณิตศาสตร์',
       '/games/math/clock-quest-cover.svg', ARRAY['ป.2','ป.3','ป.4']::text[], 70,
       'ควิซอ่านนาฬิกา', ARRAY['หน้าปัดแอนะล็อก/ดิจิทัล','เวลาผ่านไป','KampaiVersus','MCQ'],
       'cheerful'),
      ('/games/science/moon-phases-race.html', 'moon-phases-race', 'แข่งเฟสดวงจันทร์', 'วิทยาศาสตร์',
       '/games/science/moon-phases-race-cover.svg', ARRAY['ป.4','ป.5','ป.6']::text[], 71,
       'ควิซเฟสดวงจันทร์', ARRAY['8 เฟส','จับคู่ชื่อ','เฟสถัดไป','KampaiVersus'],
       'calm'),
      ('/games/science/light-sort.html', 'light-sort', 'แสงผ่านได้ไหม?', 'วิทยาศาสตร์',
       '/games/science/light-sort-cover.svg', ARRAY['ป.4','ป.5']::text[], 72,
       'จำแนกการผ่านของแสง', ARRAY['ทึบแสง','โปร่งแสง','โปร่งใส','KampaiVersus'],
       'bright'),
      ('/games/health/bone-muscle-quest.html', 'bone-muscle-quest', 'กระดูก–กล้ามเนื้อควิซ', 'สุขศึกษา',
       '/games/health/bone-muscle-quest-cover.svg', ARRAY['ป.4','ป.5','ป.6']::text[], 73,
       'ควิซระบบโครงร่าง', ARRAY['กระดูก','กล้ามเนื้อ','ข้อต่อ','KampaiVersus'],
       'playful'),
      ('/games/health/first-aid-rush.html', 'first-aid-rush', 'ปฐมพยาบาลด่วน', 'สุขศึกษา',
       '/games/health/first-aid-rush-cover.svg', ARRAY['ป.4','ป.5','ป.6']::text[], 74,
       'สถานการณ์ปฐมพยาบาล', ARRAY['RICE','เลือดออก','ไฟไหม้','KampaiVersus'],
       'warm'),
      ('/games/social/sufficiency-sim.html', 'sufficiency-sim', 'เศรษฐกิจพอเพียง', 'สังคมศึกษา',
       '/games/social/sufficiency-sim-cover.svg', ARRAY['ป.4','ป.5','ป.6']::text[], 75,
       'เลือกการกระทำพอเพียง', ARRAY['มัธยัสถ์','เหตุผล','ภูมิคุ้มกัน','KampaiVersus'],
       'mellow'),
      ('/games/career/community-jobs-match.html', 'community-jobs-match', 'อาชีพในชุมชน', 'การงานอาชีพ',
       '/games/career/community-jobs-match-cover.svg', ARRAY['ป.1','ป.2','ป.3']::text[], 76,
       'จับคู่อาชีพ–เครื่องมือ', ARRAY['อาชีพชุมชน','สถานที่ทำงาน','KampaiVersus'],
       'cheerful'),
      ('/games/english/past-tense-run.html', 'past-tense-run', 'Past Tense Run', 'ภาษาอังกฤษ',
       '/games/english/past-tense-run-cover.svg', ARRAY['ป.4','ป.5','ป.6']::text[], 77,
       'ควิซอดีตกาล', ARRAY['was/were','-ed','irregular','TTS','KampaiVersus'],
       'playful'),
      ('/games/english/follow-instructions-lab.html', 'follow-instructions-lab', 'Follow Instructions Lab', 'ภาษาอังกฤษ',
       '/games/english/follow-instructions-lab-cover.svg', ARRAY['ป.3','ป.4','ป.5']::text[], 78,
       'ทำตามคำสั่ง', ARRAY['ลำดับการแตะ','คำสั่งภาษาอังกฤษ','TTS','KampaiVersus'],
       'bright'),
      ('/games/thai/fact-opinion-duel.html', 'fact-opinion-duel', 'ข้อเท็จจริง vs ความคิดเห็น', 'ภาษาไทย',
       '/games/thai/fact-opinion-duel-cover.svg', ARRAY['ป.4','ป.5']::text[], 79,
       'จำแนกข้อความ', ARRAY['ข้อเท็จจริง','ความคิดเห็น','KampaiVersus'],
       'warm')
    ) AS t(url, slug, title, subject, thumb, grades, sort_order, fmt, feats, bgm)
  LOOP
    INSERT INTO public.educational_hub_items (
      owner_staff_id, category_id, item_type, title, description, external_url,
      subject, grade_levels, tags, sort_order, tracked_game, is_published
    )
    SELECT
      v_staff_id, v_cat_games, 'link', r.title,
      'เกมการศึกษา · ' || r.fmt || ' · เดี่ยว/2 คน/ออนไลน์',
      r.url, r.subject, r.grades,
      ARRAY['game', r.slug]::text[],
      r.sort_order, true, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.educational_hub_items
      WHERE external_url = r.url
    );

    UPDATE public.educational_hub_items
    SET game_slug = r.slug,
        tracked_game = true,
        is_published = true,
        thumbnail_url = r.thumb,
        bgm_preset = r.bgm,
        subject = r.subject,
        grade_levels = r.grades,
        title = r.title,
        updated_at = now()
    WHERE external_url = r.url;

    INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
    SELECT i.id, i.owner_staff_id, r.fmt, r.feats, 'v1.0.0',
           'Phase 9 batch — เกมใหม่ปิดช่องว่างเนื้อหา'
    FROM public.educational_hub_items i
    WHERE i.external_url = r.url
    ON CONFLICT (item_id) DO UPDATE
      SET game_format = EXCLUDED.game_format,
          features    = EXCLUDED.features,
          version     = EXCLUDED.version,
          notes       = EXCLUDED.notes,
          updated_at  = now();
  END LOOP;
END $$;
