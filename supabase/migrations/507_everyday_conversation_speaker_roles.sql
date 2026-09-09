-- 507: align Everyday Conversation speaker roles, voice preferences, and direct-open assets
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
        'ภาพ 32 ฉากผูกตำแหน่งผู้พูด A/B และชนิดเสียงตามตัวละคร',
        'สลับ A/B แล้วย้ายการ์ดและคำบอกฝั่งจริงทั้งบทสนทนา',
        'เสียงเริ่มจากการกดของครูเท่านั้น พร้อม karaoke ตาม speech boundary',
        'รองรับชื่อโรงเรียนสำหรับออกเสียงโดยไม่ทำให้ karaoke หยุดทำงาน',
        'หยุดเสียงและ timer เมื่อเปลี่ยนบท เปลี่ยนโหมด ออกจาก fullscreen หรือซ่อนแท็บ',
        'โหลดภาพและ SDK ได้ทั้ง HTTP และ direct-open file mode'
      ],
      version = 'v1.4.0',
      notes = 'แก้การจับคู่ตัวละครหญิง/ชายกับเสียงและตำแหน่ง A/B; คงข้อมูลเด็กในหน่วยความจำแท็บ และไม่มีเสียงอัตโนมัติ',
      updated_at = now()
  WHERE item_id = v_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'game_docs not found for everyday conversation media';
  END IF;

  UPDATE public.educational_hub_items
  SET build_version = 'v1.4.0', build_updated_at = now(), updated_at = now()
  WHERE id = v_item_id;
END $$;
