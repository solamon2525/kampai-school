-- Migration 411: Update game_docs for attack-on-noun (v1.1.0 fix pointer lock)
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
        'เชื่อมต่อ KAMPAI SDK บันทึกคะแนนสูงสุดและตารางผู้นำ (Leaderboard)'
      ],
      'v1.1.0',
      'แก้ไขบั๊ก Pointer Lock บนเว็บและ iframe ทำให้กดเริ่มภารกิจและเข้าเล่นเกมได้อย่างลื่นไหลทุกอุปกรณ์ (Mouse/Keyboard/Touch drag)'
    FROM public.educational_hub_items
    WHERE id = v_item_id
    ON CONFLICT (item_id) DO UPDATE SET
      game_format = EXCLUDED.game_format,
      features = EXCLUDED.features,
      version = EXCLUDED.version,
      notes = EXCLUDED.notes,
      updated_at = NOW();
  END IF;
END $$;
