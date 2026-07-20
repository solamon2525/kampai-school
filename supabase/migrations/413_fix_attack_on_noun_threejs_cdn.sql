-- Migration 413: Fix attack-on-noun playability (Three.js CDN 404)
DO $$
DECLARE
  v_item_id UUID;
BEGIN
  SELECT id INTO v_item_id
  FROM public.educational_hub_items
  WHERE game_slug = 'attack-on-noun'
  LIMIT 1;

  IF v_item_id IS NOT NULL THEN
    INSERT INTO public.game_docs (
      item_id,
      owner_staff_id,
      game_format,
      features,
      version,
      notes
    )
    SELECT
      v_item_id,
      owner_staff_id,
      '3D/FPS Action Shooter Game (ลักษณะนาม ภาษาไทย)',
      ARRAY[
        'แนวต่อสู้แอคชั่น FPS ยิงทำลายขุนพลไททันด้วยคำตอบลักษณะนามที่ถูกต้อง',
        'รองรับการเล่นบนทุกอุปกรณ์ (Mouse/Keyboard + Mouse Drag Fallback + Touch Virtual Joystick)',
        'โหมดดวล 2 คน (Versus Mode) แข่งเก็บคะแนนและกำจัดไททัน',
        'เชื่อมต่อ KAMPAI SDK บันทึกคะแนนสูงสุดและตารางผู้นำ (Leaderboard)',
        'โหมดเนื้อเรื่อง 10 ด่าน + สกิน + Leitner adaptive learning'
      ],
      'v1.2.0',
      'แก้บักเข้าเล่นไม่ได้: Three.js 0.170 ไม่มี build/three.min.js บน CDN (404) ทำให้ THREE undefined — เปลี่ยนเป็น three@0.160.0 UMD + <base href> กัน relative path หลุดเมื่อ URL ไม่มี trailing slash + beginRound/kampai-result'
    FROM public.educational_hub_items
    WHERE id = v_item_id
    ON CONFLICT (item_id) DO UPDATE SET
      game_format = EXCLUDED.game_format,
      features = EXCLUDED.features,
      version = EXCLUDED.version,
      notes = EXCLUDED.notes,
      updated_at = now();
  END IF;
END $$;
