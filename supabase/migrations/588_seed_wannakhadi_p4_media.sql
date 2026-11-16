-- Migration 588: seed Wannakhadi Lamnam P4 poetry translator media and companion worksheet
DO $$
DECLARE
  v_staff_id UUID;
  v_media_cat_id UUID;
  v_worksheet_cat_id UUID;
  v_item_id UUID;
  v_worksheet_id UUID;
BEGIN
  -- 1. Get staff owner
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE staff_type = 'teaching'
  ORDER BY created_at
  LIMIT 1;

  IF v_staff_id IS NULL THEN
    RAISE EXCEPTION 'teaching staff owner not found';
  END IF;

  -- 2. Get categories
  SELECT id INTO v_media_cat_id
  FROM public.educational_hub_categories
  WHERE category_key = 'media' AND is_active = true
  LIMIT 1;

  SELECT id INTO v_worksheet_cat_id
  FROM public.educational_hub_categories
  WHERE category_key = 'worksheet' AND is_active = true
  LIMIT 1;

  IF v_media_cat_id IS NULL THEN
    RAISE EXCEPTION 'active media category not found';
  END IF;

  -- 3. Profile active
  INSERT INTO public.educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_staff_id, true)
  ON CONFLICT (staff_id) DO UPDATE SET is_hub_active = true;

  -- 4. Seed Media Item
  INSERT INTO public.educational_hub_items (
    owner_staff_id, category_id, item_type, title, description, external_url,
    thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published
  )
  SELECT
    v_staff_id,
    v_media_cat_id,
    'link',
    '📖 สื่อแปลกลอนสุภาพ วรรณคดีลำนำ ป.4',
    'สื่อการเรียนรู้วรรณคดีลำนำ ชั้น ป.4 ครบ ๗ บทเรียน พร้อมระบบถอดคำประพันธ์รายวรรค คลังคำศัพท์ยากพร้อมป๊อปอัปความหมาย เสียงอ่านคำกลอนและคำแปล TTS โหมดฝึกทักษะ และใบงานพิมพ์ A4',
    '/games/thai/wannakhadi-p4-media.html',
    '/games/thai/wannakhadi-p4-media-cover.png',
    'ภาษาไทย',
    ARRAY['ป.4'],
    ARRAY['วรรณคดีลำนำ', 'กลอนสุภาพ', 'ถอดคำประพันธ์', 'ภาษาไทย', 'ป.4', 'สุดสาคร', 'พฤษภกาสร'],
    COALESCE((SELECT MAX(sort_order) + 1 FROM public.educational_hub_items WHERE category_id = v_media_cat_id), 1),
    false,
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id
      AND external_url = '/games/thai/wannakhadi-p4-media.html'
  );

  UPDATE public.educational_hub_items
  SET category_id = v_media_cat_id,
      title = '📖 สื่อแปลกลอนสุภาพ วรรณคดีลำนำ ป.4',
      description = 'สื่อการเรียนรู้วรรณคดีลำนำ ชั้น ป.4 ครบ ๗ บทเรียน พร้อมระบบถอดคำประพันธ์รายวรรค คลังคำศัพท์ยากพร้อมป๊อปอัปความหมาย เสียงอ่านคำกลอนและคำแปล TTS โหมดฝึกทักษะ และใบงานพิมพ์ A4',
      thumbnail_url = '/games/thai/wannakhadi-p4-media-cover.png',
      subject = 'ภาษาไทย',
      grade_levels = ARRAY['ป.4'],
      tags = ARRAY['วรรณคดีลำนำ', 'กลอนสุภาพ', 'ถอดคำประพันธ์', 'ภาษาไทย', 'ป.4', 'สุดสาคร', 'พฤษภกาสร'],
      tracked_game = false,
      is_published = true,
      updated_at = now()
  WHERE owner_staff_id = v_staff_id
    AND external_url = '/games/thai/wannakhadi-p4-media.html'
  RETURNING id INTO v_item_id;

  -- 5. Seed Worksheet Item (if worksheet category exists)
  IF v_worksheet_cat_id IS NOT NULL THEN
    INSERT INTO public.educational_hub_items (
      owner_staff_id, category_id, item_type, title, description, external_url,
      thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published
    )
    SELECT
      v_staff_id,
      v_worksheet_cat_id,
      'worksheet',
      '📝 ใบงานวรรณคดีลำนำ ป.4 (ถอดคำประพันธ์และคำศัพท์)',
      'ใบงานพิมพ์ A4 สำหรับฝึกถอดความบทร้อยกรองและแปลความหมายคำศัพท์จากวรรณคดีลำนำ ๗ บทเรียน ชั้น ป.4',
      '/games/thai/wannakhadi-p4-media-worksheet.html',
      '/games/thai/wannakhadi-p4-media-cover.png',
      'ภาษาไทย',
      ARRAY['ป.4'],
      ARRAY['ใบงาน', 'วรรณคดีลำนำ', 'ถอดคำประพันธ์', 'ภาษาไทย', 'ป.4'],
      COALESCE((SELECT MAX(sort_order) + 1 FROM public.educational_hub_items WHERE category_id = v_worksheet_cat_id), 1),
      false,
      true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.educational_hub_items
      WHERE owner_staff_id = v_staff_id
        AND external_url = '/games/thai/wannakhadi-p4-media-worksheet.html'
    );

    UPDATE public.educational_hub_items
    SET category_id = v_worksheet_cat_id,
        title = '📝 ใบงานวรรณคดีลำนำ ป.4 (ถอดคำประพันธ์และคำศัพท์)',
        description = 'ใบงานพิมพ์ A4 สำหรับฝึกถอดความบทร้อยกรองและแปลความหมายคำศัพท์จากวรรณคดีลำนำ ๗ บทเรียน ชั้น ป.4',
        thumbnail_url = '/games/thai/wannakhadi-p4-media-cover.png',
        subject = 'ภาษาไทย',
        grade_levels = ARRAY['ป.4'],
        tags = ARRAY['ใบงาน', 'วรรณคดีลำนำ', 'ถอดคำประพันธ์', 'ภาษาไทย', 'ป.4'],
        tracked_game = false,
        is_published = true,
        updated_at = now()
    WHERE owner_staff_id = v_staff_id
      AND external_url = '/games/thai/wannakhadi-p4-media-worksheet.html'
    RETURNING id INTO v_worksheet_id;
  END IF;

  -- 6. Link Curriculum Indicators for Media
  IF v_item_id IS NOT NULL THEN
    INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
    SELECT v_item_id, indicator.id
    FROM public.curriculum_indicators indicator
    WHERE indicator.indicator_code = ANY (ARRAY[
      'ท 1.1 ป.4/1',
      'ท 1.1 ป.4/2',
      'ท 5.1 ป.4/1',
      'ท 5.1 ป.4/3'
    ])
    ON CONFLICT DO NOTHING;

    -- 7. Game Docs
    INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
    VALUES (
      v_item_id,
      v_staff_id,
      'สื่อการสอนเชิงโต้ตอบสำหรับแปลกลอนสุภาพและถอดความวรรณคดีลำนำ ป.4',
      ARRAY[
        '๗ บทเรียนตามสารบัญแบบเรียนวรรณคดีลำนำ ป.4',
        'ระบบถอดคำประพันธ์และคำแปลภาษาง่ายรายวรรค/รายบาท',
        'คลังคำศัพท์ยากพร้อมป๊อปอัปความหมายและชนิดของคำ',
        'เสียงอ่านบทกลอนและคำแปลด้วย TTS สำเนียงไทย',
        'โหมดฝึกถอดความและทบทวนความรู้โดยไม่แข่งขัน',
        'ใบงานพิมพ์ A4 คู่บทเรียนรองรับการจัดพิมพ์มาตรฐาน'
      ],
      'v1.0.0',
      'สร้างจากตัวชี้วัดภาษาไทย ป.4 สาระที่ 1 และ 5: ท 1.1 ป.4/1-2 และ ท 5.1 ป.4/1, 3'
    )
    ON CONFLICT (item_id) DO UPDATE
      SET game_format = EXCLUDED.game_format,
          features = EXCLUDED.features,
          version = EXCLUDED.version,
          notes = EXCLUDED.notes,
          updated_at = now();
  END IF;

  -- 8. Link Curriculum Indicators for Worksheet
  IF v_worksheet_id IS NOT NULL THEN
    INSERT INTO public.indicator_games (edu_hub_item_id, indicator_id)
    SELECT v_worksheet_id, indicator.id
    FROM public.curriculum_indicators indicator
    WHERE indicator.indicator_code = ANY (ARRAY[
      'ท 1.1 ป.4/1',
      'ท 1.1 ป.4/2',
      'ท 5.1 ป.4/1',
      'ท 5.1 ป.4/3'
    ])
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
