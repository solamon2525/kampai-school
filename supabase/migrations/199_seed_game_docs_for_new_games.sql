-- ============================================================================
-- Migration 199: Seed game documentation (game_docs) for 7 new games
-- ============================================================================
-- Owner: ครูณัฐพงศ์ สิงห์ชมภู
-- Idempotent: re-run keeps specifications updated
-- ============================================================================

DO $$
DECLARE
  v_staff_id  UUID;
  v_item_id   UUID;
BEGIN
  -- 1. Resolve staff_id
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  
  IF v_staff_id IS NULL THEN
    RAISE EXCEPTION 'staff "ครูณัฐพงศ์ สิงห์ชมภู" not found';
  END IF;

  -- --------------------------------------------------------------------------
  -- Game 1: Rhythm Master (จังหวะดนตรี)
  -- --------------------------------------------------------------------------
  SELECT id INTO v_item_id
  FROM public.educational_hub_items
  WHERE owner_staff_id = v_staff_id AND game_slug = 'rhythm-master';

  IF v_item_id IS NOT NULL THEN
    INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
    VALUES (
      v_item_id,
      v_staff_id,
      'เกมเคาะจังหวะสไตล์ Taiko เคาะตัวโน้ตดนตรี',
      ARRAY['เล่นเคาะจังหวะดนตรีตามเป้า', 'เคาะตัวโน้ต Spacebar/Enter', 'เสียงเอฟเฟกต์ด้วย Web Audio API', 'สะสมคะแนนและความแม่นยำ'],
      'v1.0.0',
      'สร้างเกมครั้งแรก'
    )
    ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
  END IF;

  -- --------------------------------------------------------------------------
  -- Game 2: Color Wheel Explorer (วงล้อสีแสนสนุก)
  -- --------------------------------------------------------------------------
  SELECT id INTO v_item_id
  FROM public.educational_hub_items
  WHERE owner_staff_id = v_staff_id AND game_slug = 'color-wheel';

  IF v_item_id IS NOT NULL THEN
    INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
    VALUES (
      v_item_id,
      v_staff_id,
      'บอร์ดทบทวนทฤษฎีสีและแบบทดสอบ',
      ARRAY['วงล้อสีทฤษฎี 12 ส่วน', 'ปรับไฮไลต์ตามทฤษฎีสีคู่ตรงข้าม/ข้างเคียง/สามมุม', 'กระดานจดจำพาเลทสีส่วนตัว', 'แบบทดสอบคำถามสี 10 ข้อ'],
      'v1.0.0',
      'สร้างเกมครั้งแรก'
    )
    ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
  END IF;

  -- --------------------------------------------------------------------------
  -- Game 3: Line Trace Art (ลากเส้นตามแบบ)
  -- --------------------------------------------------------------------------
  SELECT id INTO v_item_id
  FROM public.educational_hub_items
  WHERE owner_staff_id = v_staff_id AND game_slug = 'line-trace';

  IF v_item_id IS NOT NULL THEN
    INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
    VALUES (
      v_item_id,
      v_staff_id,
      'เกมฝึกลากเส้นตามรอยไกด์กระพริบ',
      ARRAY['ฝึกลากเส้นตามรอยไกด์ (ตรง โค้ง ซิกแซก)', 'วัดค่าความแม่นยำกล้ามเนื้อมือ (%)', 'ลงสีภาพวาดสดใสสวยงามเมื่อทำสำเร็จ', 'ภาพลากเส้นหลากหลายแบบ (หัวใจ, ดาว, บ้าน, ปลา, เพชร)'],
      'v1.0.0',
      'สร้างเกมครั้งแรก'
    )
    ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
  END IF;

  -- --------------------------------------------------------------------------
  -- Game 4: Thai Instruments (เครื่องดนตรีไทยน่ารู้)
  -- --------------------------------------------------------------------------
  SELECT id INTO v_item_id
  FROM public.educational_hub_items
  WHERE owner_staff_id = v_staff_id AND game_slug = 'thai-instruments';

  IF v_item_id IS NOT NULL THEN
    INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
    VALUES (
      v_item_id,
      v_staff_id,
      'บอร์ดจำลองเสียงคีย์บอร์ดดนตรีไทยและแบบทดสอบทายเสียง',
      ARRAY['คัดแยกประเภทเครื่องดนตรีไทย (ดีด สี ตี เป่า)', 'บรรเลงโน้ตคีย์บอร์ดไทยจำลอง (ขิม ซอ ขลุ่ย ระนาดเอก จะเข้)', 'Web Audio API สังเคราะห์เสียงและลูกคอ', 'แบบทดสอบทายเสียงปริศนา'],
      'v1.0.0',
      'สร้างเกมครั้งแรก'
    )
    ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
  END IF;

  -- --------------------------------------------------------------------------
  -- Game 5: วัดและเปรียบเทียบ (Measure Up!)
  -- --------------------------------------------------------------------------
  SELECT id INTO v_item_id
  FROM public.educational_hub_items
  WHERE owner_staff_id = v_staff_id AND game_slug = 'measure-up';

  IF v_item_id IS NOT NULL THEN
    INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
    VALUES (
      v_item_id,
      v_staff_id,
      'เกมจำลองการวัดความยาว น้ำหนัก ปริมาตร',
      ARRAY['ทาบไม้บรรทัดวัดความยาวหน่วยเซนติเมตร', 'อ่านน้ำหนักจากตาชั่งสปริง', 'คาดเดาตุ้มน้ำหนักตาชั่งสองแขน', 'อ่านปริมาตรของเหลวในบีกเกอร์', 'แบบทดสอบเปรียบเทียบความยาว/น้ำหนัก/ปริมาตร'],
      'v1.0.0',
      'สร้างเกมครั้งแรก'
    )
    ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
  END IF;

  -- --------------------------------------------------------------------------
  -- Game 6: แลกเหรียญ (Coin Exchange)
  -- --------------------------------------------------------------------------
  SELECT id INTO v_item_id
  FROM public.educational_hub_items
  WHERE owner_staff_id = v_staff_id AND game_slug = 'coin-exchange';

  IF v_item_id IS NOT NULL THEN
    INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
    VALUES (
      v_item_id,
      v_staff_id,
      'เกมทอนเงินสหกรณ์จำลอง',
      ARRAY['ลากธนบัตร (500, 100, 50, 20) และเหรียญไทย (10, 5, 2, 1)', 'ทอนเงินลงถาดทอนเงินให้มีมูลค่ารวมพอดีเป๊ะ', 'โจทย์คำนวณตามเงินทอนที่ได้รับจากลูกค้า', 'สะสมคะแนนความรวดเร็วและความแม่นยำ'],
      'v1.0.0',
      'สร้างเกมครั้งแรก'
    )
    ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
  END IF;

  -- --------------------------------------------------------------------------
  -- Game 7: คลังคำศัพท์ภาษาไทย ป.4 (Thai Vocab Hub)
  -- --------------------------------------------------------------------------
  SELECT id INTO v_item_id
  FROM public.educational_hub_items
  WHERE owner_staff_id = v_staff_id AND game_slug = 'thai-vocab-hub';

  IF v_item_id IS NOT NULL THEN
    INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
    VALUES (
      v_item_id,
      v_staff_id,
      'การ์ดคำศัพท์ภาษาไทย ป.4 ทบทวนสะกดคำ',
      ARRAY['ทบทวนคำศัพท์ 10 หมวดหลัก (60 คำ)', 'เขียนตามคำบอกด้วยระบบเสียงอ่าน TTS', 'ทายความหมายจากนิยามศัพท์', 'จับคู่คำศัพท์กับเสียงคำอ่านสะกด', 'สังเคราะห์เสียงพูดภาษาไทยผ่าน Web Speech API'],
      'v1.0.0',
      'สร้างเกมครั้งแรก'
    )
    ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
  END IF;

END $$;
