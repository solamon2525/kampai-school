-- 582_seed_vocab_race_and_spelling_game_docs.sql
-- Upsert game_docs and update educational_hub_items for vocab-race and spelling (v2.0.0 evolution)

DO $$
DECLARE
  v_staff_id UUID;
BEGIN
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;

  -- 1) vocab-race (English Vocabulary Race)
  UPDATE public.educational_hub_items
  SET game_slug = 'vocab-race',
      tracked_game = true,
      is_published = true,
      thumbnail_url = '/games/english/vocab-race-cover.png',
      bgm_preset = 'playful',
      updated_at = now()
  WHERE external_url = '/games/english/vocab-race.html' OR game_slug = 'vocab-race';

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'Speed Vocabulary Quiz & Flashcards — แข่งคำศัพท์ภาษาอังกฤษ ป.1-6 ตามหลักสูตรแกนกลาง สพฐ.',
         ARRAY[
           'คลังคำศัพท์ภาษาอังกฤษ 12 หมวด 200+ คำตามมาตรฐาน สพฐ. (สัตว์, ห้องเรียน, อาหาร, คำกริยา, อากาศ, อาชีพ)',
           'ระบบเสียงอ่านออกเสียงภาษาอังกฤษ Native Web Speech API พร้อมปุ่มฟังซ้ำและเปิด/ปิดอัตโนมัติ',
           'ระบบ KampaiVersus แข่งขัน 2 ผู้เล่น (เล่นเดี่ยว, 2 คนเครื่องนี้ Hot-seat, และแข่งออนไลน์)',
           'ใบงานพิมพ์ A4 คำศัพท์ภาษาอังกฤษ พร้อมเฉลยครู และโหมดห้องเรียนฉายโปรเจกเตอร์'
         ],
         'v2.0.0',
         'แข่งคำศัพท์ (vocab-race) — อัปเกรดคลังคำศัพท์ OBEC, Native TTS, KampaiVersus, Quality Contract hooks และ A4 Worksheet'
  FROM public.educational_hub_items i
  WHERE i.game_slug = 'vocab-race' OR i.external_url = '/games/english/vocab-race.html'
  LIMIT 1
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features = EXCLUDED.features,
        version = EXCLUDED.version,
        notes = EXCLUDED.notes,
        updated_at = now();

  -- 2) spelling (Thai Spelling Shooter)
  UPDATE public.educational_hub_items
  SET game_slug = 'spelling',
      tracked_game = true,
      is_published = true,
      thumbnail_url = '/games/thai/spelling-cover.png',
      bgm_preset = 'action',
      updated_at = now()
  WHERE external_url = '/games/thai/spelling.html' OR game_slug = 'spelling';

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'Top-Down Action Shooter Spelling — มือปราบคำผิด ปราบปีศาจคำผิดตามบัญชีคำมักเขียนผิด สพฐ.',
         ARRAY[
           'คลังคำศัพท์ภาษาไทยที่มักเขียนผิด 300 คู่คำตามมาตรฐานราชบัณฑิตยสภาและ สพฐ.',
           'ระบบแสดงผลคำถูก-ผิดคู่ขนานแบบ Side-by-Side ทันทีที่ยิงผิดหรือทบทวนหลังจบเกม',
           'ระบบ KampaiVersus แข่งขัน 2 ผู้เล่น (เล่นเดี่ยว, 2 คนเครื่องนี้ Hot-seat, และแข่งออนไลน์)',
           'ใบงานพิมพ์ A4 เขียนตามคำบอกภาษาไทย พร้อมเฉลยครู และโหมดห้องเรียนฉายโปรเจกเตอร์'
         ],
         'v2.0.0',
         'มือปราบคำผิด (spelling) — อัปเกรดคลัง 300 คำ OBEC, Side-by-side correction, KampaiVersus, Quality Contract hooks และ A4 Worksheet'
  FROM public.educational_hub_items i
  WHERE i.game_slug = 'spelling' OR i.external_url = '/games/thai/spelling.html'
  LIMIT 1
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features = EXCLUDED.features,
        version = EXCLUDED.version,
        notes = EXCLUDED.notes,
        updated_at = now();

  -- 3) Register /games/english/vocab-race-worksheet.html
  INSERT INTO public.educational_hub_items (
    title, description, subject, grade_levels, tags, curriculum_indicators,
    external_url, is_published, content_kind, owner_staff_id, created_at, updated_at
  )
  VALUES (
    'ใบงานคำศัพท์ Vocabulary Race ป.1–ป.6',
    'ใบงานฝึกคำศัพท์ภาษาอังกฤษ คำอ่าน ความหมาย และตัวอย่างประโยคตามหลักสูตรแกนกลาง สพฐ.',
    'ภาษาอังกฤษ',
    ARRAY['ป.1','ป.2','ป.3','ป.4','ป.5','ป.6']::text[],
    ARRAY['ใบงาน','ภาษาอังกฤษ','คำศัพท์','vocab-race']::text[],
    ARRAY['ต 1.1 ป.1/2','ต 1.1 ป.2/2','ต 1.1 ป.3/2','ต 1.1 ป.4/2']::text[],
    '/games/english/vocab-race-worksheet.html',
    true,
    'worksheet',
    v_staff_id,
    now(),
    now()
  )
  ON CONFLICT (external_url) DO UPDATE
    SET title = EXCLUDED.title,
        description = EXCLUDED.description,
        subject = EXCLUDED.subject,
        grade_levels = EXCLUDED.grade_levels,
        tags = EXCLUDED.tags,
        curriculum_indicators = EXCLUDED.curriculum_indicators,
        is_published = true,
        updated_at = now();

  -- 4) Register /games/thai/spelling-worksheet.html
  INSERT INTO public.educational_hub_items (
    title, description, subject, grade_levels, tags, curriculum_indicators,
    external_url, is_published, content_kind, owner_staff_id, created_at, updated_at
  )
  VALUES (
    'ใบงานเขียนคำบอกและแก้ไขคำผิด ป.3–ป.6',
    'ใบงานวิเคราะห์และแก้ไขคำที่มักเขียนผิดตามมาตรฐานราชบัณฑิตยสภาและ สพฐ. 300 คำ',
    'ภาษาไทย',
    ARRAY['ป.3','ป.4','ป.5','ป.6']::text[],
    ARRAY['ใบงาน','ภาษาไทย','คำผิด','เขียนคำบอก','spelling']::text[],
    ARRAY['ท 4.1 ป.3/1','ท 4.1 ป.4/1','ท 4.1 ป.4/4']::text[],
    '/games/thai/spelling-worksheet.html',
    true,
    'worksheet',
    v_staff_id,
    now(),
    now()
  )
  ON CONFLICT (external_url) DO UPDATE
    SET title = EXCLUDED.title,
        description = EXCLUDED.description,
        subject = EXCLUDED.subject,
        grade_levels = EXCLUDED.grade_levels,
        tags = EXCLUDED.tags,
        curriculum_indicators = EXCLUDED.curriculum_indicators,
        is_published = true,
        updated_at = now();

END $$;
