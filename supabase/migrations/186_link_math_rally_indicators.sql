-- Migration 186: Link Math Rally curriculum indicators & seed game documentation & update trigger
DO $$
DECLARE
  v_item_id   UUID;
  v_staff_id  UUID;
BEGIN
  -- 1. Get the game item ID and its owner
  SELECT id, owner_staff_id INTO v_item_id, v_staff_id
  FROM public.educational_hub_items
  WHERE game_slug = 'math-rally' OR external_url = '/games/math/math-rally/index.html'
  LIMIT 1;

  IF v_item_id IS NULL THEN
    RAISE NOTICE 'Game item math-rally not found, skipping indicator linking';
    RETURN;
  END IF;

  -- 2. Link standard Math indicators for ป.2 - ป.4
  -- ป.2: ค 1.1 ป.2/4, ค 1.1 ป.2/5, ค 1.1 ป.2/6, ค 1.1 ป.2/7
  -- ป.3: ค 1.1 ป.3/5, ค 1.1 ป.3/6, ค 1.1 ป.3/7, ค 1.1 ป.3/8
  -- ป.4: ค 1.1 ป.4/10
  INSERT INTO public.indicator_games (indicator_id, edu_hub_item_id)
  SELECT id, v_item_id
  FROM public.curriculum_indicators
  WHERE indicator_code IN (
    'ค 1.1 ป.2/4', 'ค 1.1 ป.2/5', 'ค 1.1 ป.2/6', 'ค 1.1 ป.2/7',
    'ค 1.1 ป.3/5', 'ค 1.1 ป.3/6', 'ค 1.1 ป.3/7', 'ค 1.1 ป.3/8',
    'ค 1.1 ป.4/10'
  )
  ON CONFLICT (indicator_id, edu_hub_item_id) DO NOTHING;

  -- 3. Seed/Update game documentation (game_docs)
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  VALUES (
    v_item_id,
    v_staff_id,
    'ตอบคำถาม/บวกลบคูณหาร/แข่งรถซิ่ง',
    ARRAY[
      'ตอบคำถามเลขคณิต บวก ลบ คูณ หาร และแบบผสม',
      'ความเร็วรถเพิ่มและลดตามความถูกต้องและการตอบคำถาม',
      'ระบบคอมโบสะสมพลังพุ่งตัวเร็วขึ้น',
      'ไอเทมพิเศษบนถนน: ไนโทร 🚀 โล่กันตอบผิด 🛡️ ดาวคูณสอง ⭐ เต่าชะลอคู่แข่ง 🐢',
      'โหมดเล่นเดี่ยวกับ AI คู่แข่ง 3 ระดับความยาก',
      'โหมดผู้เล่นหลายคนแบบออนไลน์ผ่านระบบ KampaiMatch พร้อมตารางคะแนนสด'
    ],
    'v1.1.0',
    'ปรับปรุงจาก Multiply Rally เป็น Math Rally รองรับการผสม บวก ลบ คูณ หาร และเชื่อมโยงตัวชี้วัดหลักสูตร'
  )
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
END $$;

-- 4. Update the trigger function to support online win condition
CREATE OR REPLACE FUNCTION public.fn_game_session_to_indicator_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item_id UUID;
  v_passed  BOOLEAN;
BEGIN
  -- หา edu_hub_item_id (column ตรง หรือ fallback ผ่าน game_slug)
  v_item_id := NEW.edu_hub_item_id;
  IF v_item_id IS NULL AND NEW.game_slug IS NOT NULL THEN
    SELECT id INTO v_item_id
    FROM public.educational_hub_items
    WHERE game_slug = NEW.game_slug
    LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    RETURN NEW;  -- เกมไม่อยู่ในคลัง → ไม่มีตัวชี้วัดให้ผูก
  END IF;

  -- "ผ่าน" เมื่อชนะในโหมดปกติ หรือได้อันดับ 1 ในโหมดออนไลน์
  v_passed := lower(COALESCE(
                NEW.metadata->>'passed',
                NEW.metadata->>'won',
                NEW.metadata->>'cleared',
                '')) IN ('true', '1', 'yes', 'y', 't')
              OR (NEW.metadata->>'rank' = '1');

  INSERT INTO public.student_indicator_events
    (student_id, indicator_id, game_slug, session_id, score, passed)
  SELECT NEW.student_id, ig.indicator_id, NEW.game_slug, NEW.id, NEW.score, v_passed
  FROM public.indicator_games ig
  WHERE ig.edu_hub_item_id = v_item_id
  ON CONFLICT DO NOTHING; -- Ensure idempotency if any exists

  RETURN NEW;
END;
$$;
