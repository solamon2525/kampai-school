-- Migration 443: Media Batch Z (M6 geometry-3d) + W8 teacher guide + starter notes
-- category media/videos · tracked_game=false

DO $$
DECLARE
  v_owner uuid;
  v_media uuid;
  v_videos uuid;
  v_item uuid;
  v_ind uuid;
BEGIN
  SELECT id INTO v_owner
  FROM staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%'
    AND staff_type = 'teaching'
  ORDER BY created_at
  LIMIT 1;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'owner staff not found';
  END IF;

  INSERT INTO educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_owner, true)
  ON CONFLICT (staff_id) DO UPDATE SET is_hub_active = true;

  SELECT id INTO v_media FROM educational_hub_categories
  WHERE category_key = 'media' AND is_active = true LIMIT 1;
  SELECT id INTO v_videos FROM educational_hub_categories
  WHERE category_key = 'videos' AND is_active = true LIMIT 1;

  IF v_media IS NULL THEN
    RAISE EXCEPTION 'media category missing';
  END IF;

  -- M6 geometry-3d-media
  INSERT INTO educational_hub_items (
    owner_staff_id, category_id, item_type, title, description,
    external_url, thumbnail_url, subject, grade_levels, tags,
    sort_order, tracked_game, is_published
  ) VALUES (
    v_owner, v_media, 'link',
    '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด',
    'สื่อการสอนคณิตศาสตร์ ป.4–6 — เลือกทรง · นับหน้า/ขอบ/จุดยอด · รูปคลี่ · สมมาตร · คู่เกม solid-3d/net-3d · ไม่เก็บคะแนน',
    '/games/math/geometry-3d-media.html',
    '/games/math/geometry-3d-media-cover.png',
    'คณิตศาสตร์', ARRAY['ป.4','ป.5','ป.6'],
    ARRAY['เรขาคณิต','3D','รูปคลี่','สมมาตร'],
    181, false, true
  )
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_item FROM educational_hub_items
  WHERE owner_staff_id = v_owner AND external_url = '/games/math/geometry-3d-media.html'
  LIMIT 1;

  IF v_item IS NULL THEN
    -- upsert path when unique constraint differs
    UPDATE educational_hub_items SET
      title = '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด',
      description = 'สื่อการสอนคณิตศาสตร์ ป.4–6 — เลือกทรง · นับหน้า/ขอบ/จุดยอด · รูปคลี่ · สมมาตร · คู่เกม solid-3d/net-3d · ไม่เก็บคะแนน',
      thumbnail_url = '/games/math/geometry-3d-media-cover.png',
      subject = 'คณิตศาสตร์',
      grade_levels = ARRAY['ป.4','ป.5','ป.6'],
      tags = ARRAY['เรขาคณิต','3D','รูปคลี่','สมมาตร'],
      sort_order = 181,
      tracked_game = false,
      is_published = true,
      updated_at = now()
    WHERE external_url = '/games/math/geometry-3d-media.html'
    RETURNING id INTO v_item;
  END IF;

  IF v_item IS NULL THEN
    INSERT INTO educational_hub_items (
      owner_staff_id, category_id, item_type, title, description,
      external_url, thumbnail_url, subject, grade_levels, tags,
      sort_order, tracked_game, is_published
    ) VALUES (
      v_owner, v_media, 'link',
      '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด',
      'สื่อการสอนคณิตศาสตร์ ป.4–6 — เลือกทรง · นับหน้า/ขอบ/จุดยอด · รูปคลี่ · สมมาตร · คู่เกม solid-3d/net-3d · ไม่เก็บคะแนน',
      '/games/math/geometry-3d-media.html',
      '/games/math/geometry-3d-media-cover.png',
      'คณิตศาสตร์', ARRAY['ป.4','ป.5','ป.6'],
      ARRAY['เรขาคณิต','3D','รูปคลี่','สมมาตร'],
      181, false, true
    )
    RETURNING id INTO v_item;
  END IF;

  FOREACH v_ind IN ARRAY ARRAY[
    (SELECT id FROM curriculum_indicators WHERE indicator_code = 'ค 2.2 ป.5/4' LIMIT 1),
    (SELECT id FROM curriculum_indicators WHERE indicator_code = 'ค 2.2 ป.6/3' LIMIT 1),
    (SELECT id FROM curriculum_indicators WHERE indicator_code = 'ค 2.2 ป.6/4' LIMIT 1),
    (SELECT id FROM curriculum_indicators WHERE indicator_code = 'ค 2.2 ป.3/1' LIMIT 1)
  ]
  LOOP
    IF v_ind IS NOT NULL THEN
      INSERT INTO indicator_games (edu_hub_item_id, indicator_id)
      VALUES (v_item, v_ind)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  INSERT INTO game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  VALUES (
    v_item, v_owner,
    'เรขาคณิต 2D/3D',
    ARRAY['เลือกทรง','นับหน้า/ขอบ/จุดยอด','รูปคลี่','โหมดฝึก'],
    'v1.0.0',
    'M6 · Media Batch Z · คู่ solid-3d/net-3d'
  )
  ON CONFLICT (item_id) DO UPDATE SET
    game_format = EXCLUDED.game_format,
    features = EXCLUDED.features,
    version = EXCLUDED.version,
    notes = EXCLUDED.notes,
    updated_at = now();

  -- W8 teacher guide (media)
  INSERT INTO educational_hub_items (
    owner_staff_id, category_id, item_type, title, description,
    external_url, subject, grade_levels, tags,
    sort_order, tracked_game, is_published
  ) VALUES (
    v_owner, v_media, 'link',
    '📘 คู่มือครูอัปสื่อใน 5 นาที (W8)',
    'คู่มือ 1 หน้า — เข้า /teacher/edu-hub → เพิ่ม PDF/YouTube/ข้อความ → ใส่วิชา·ชั้น·tags → เผยแพร่ · พิมพ์ได้',
    '/docs/teacher-upload-media-guide.html',
    'ทั่วไป', ARRAY['ครู'],
    ARRAY['คู่มือครู','W8','อัปสื่อ'],
    10, false, true
  )
  ON CONFLICT DO NOTHING;

  -- Starter notes (videos category if present, else media)
  IF v_videos IS NULL THEN
    v_videos := v_media;
  END IF;

  INSERT INTO educational_hub_items (
    owner_staff_id, category_id, item_type, title, description,
    external_url, subject, grade_levels, tags,
    sort_order, tracked_game, is_published
  ) VALUES
  (
    v_owner, v_videos, 'link',
    '📌 ความรู้สั้น: ค่าประจำหลัก',
    'ตัวอย่างสื่อข้อความคณิต — ครูอัปเองได้ที่ Teacher Portal',
    '/docs/starter-media/math-place-value-note.html',
    'คณิตศาสตร์', ARRAY['ป.3','ป.4'],
    ARRAY['ความรู้สั้น','ตัวอย่างครู'],
    200, false, true
  ),
  (
    v_owner, v_videos, 'link',
    '📌 ความรู้สั้น: สระสั้น–สระยาว',
    'ตัวอย่างสื่อข้อความไทย — ใช้คู่แผนภาพสระ',
    '/docs/starter-media/thai-vowel-note.html',
    'ภาษาไทย', ARRAY['ป.1','ป.2'],
    ARRAY['ความรู้สั้น','ตัวอย่างครู'],
    201, false, true
  ),
  (
    v_owner, v_videos, 'link',
    '📌 Classroom English: Greetings',
    'ตัวอย่างสื่อข้อความอังกฤษ — ทักทายในห้องเรียน',
    '/docs/starter-media/english-greetings-note.html',
    'ภาษาอังกฤษ', ARRAY['ป.1','ป.2','ป.3'],
    ARRAY['ความรู้สั้น','ตัวอย่างครู','classroom english'],
    202, false, true
  ),
  (
    v_owner, v_videos, 'link',
    '📌 ความรู้สั้น: วัฏจักรน้ำ 4 ขั้น',
    'ตัวอย่างสื่อข้อความวิทย์ — ใช้คู่สื่อแผนภาพวัฏจักรน้ำ',
    '/docs/starter-media/science-water-cycle-note.html',
    'วิทยาศาสตร์', ARRAY['ป.3','ป.4','ป.5'],
    ARRAY['ความรู้สั้น','ตัวอย่างครู'],
    203, false, true
  )
  ON CONFLICT DO NOTHING;
END $$;
