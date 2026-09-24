-- 510: align Everyday Conversation speaker identity, voices, and named scenes
DO $$
DECLARE
  v_item_id UUID;
BEGIN
  SELECT id INTO v_item_id
  FROM public.educational_hub_items
  WHERE external_url = '/games/english/everyday-conversation-p4-media.html'
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'everyday conversation media item not found; apply the seed migration first';
  END IF;

  UPDATE public.game_docs
  SET game_format = 'สื่อฝึกพูดบทสนทนาภาษาอังกฤษ ป.4 แบบครูนำ จับคู่ A/B เรื่องของฉัน และฉากพูดได้ โดยไม่เก็บคะแนน',
      features = ARRAY[
        '30 บทสนทนา 120 ช่วงพูดใน 6 สถานการณ์ใกล้ตัว',
        'ภาพ 32 ฉากผูกตำแหน่งและเพศผู้พูดไว้กับ metadata ของแต่ละบท',
        'แก้บท Nan และ Joe/Pim ให้ภาพ ชื่อ บท A/B และเสียงตรงกัน',
        'เลือกเสียงหญิงหรือชายสำหรับข้อมูลเด็กได้โดยไม่บันทึกข้อมูลส่วนตัว',
        'เลือกเสียงอังกฤษตามเพศอย่างคงที่โดยไม่ขึ้นกับลำดับ voice ของ browser',
        'คาราโอเกะคำอังกฤษตรงกันทั้งไดอะล็อกและฉากภาพ',
        'เสียงเริ่มจากการกดของครูเท่านั้นและหยุดเมื่อเปลี่ยนบริบทหรือซ่อนแท็บ'
      ],
      version = 'v1.5.1',
      notes = 'แก้ speaker identity ของบท Nan และ Joe/Pim เพิ่มเสียงของฉันแบบ session-only และป้องกัน fallback เลือกเสียงสลับเพศตามลำดับ browser',
      updated_at = now()
  WHERE item_id = v_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'game_docs not found for everyday conversation media';
  END IF;

  UPDATE public.educational_hub_items
  SET build_version = 'v1.5.1', build_updated_at = now(), updated_at = now()
  WHERE id = v_item_id;
END $$;
