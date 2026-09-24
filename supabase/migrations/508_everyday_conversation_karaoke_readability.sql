-- 508: synchronize Everyday Conversation karaoke and enlarge classroom text
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
        'คาราโอเกะคำอังกฤษตรงกันทั้งไดอะล็อกและฉากภาพ',
        'ใช้ speech boundary เป็นหลักและมี timer สำรองเมื่อ browser ไม่ส่งตำแหน่งคำ',
        'คำอ่านไทยและคำแปลขนาดใหญ่พร้อมเน้นทั้งบรรทัดที่กำลังพูด',
        'เสียงเริ่มจากการกดของครูเท่านั้นและหยุดเมื่อเปลี่ยนบริบทหรือซ่อนแท็บ',
        'รองรับข้อมูลเด็ก ชื่อโรงเรียน การสลับ A/B และ direct-open file mode'
      ],
      version = 'v1.5.0',
      notes = 'ขยายคำอ่านและคำแปลสำหรับจอห้องเรียน พร้อมทำ karaoke ภาษาอังกฤษให้เห็นชัดและทำงานได้เมื่อ speech boundary ไม่พร้อม; ไม่มีเสียงอัตโนมัติ',
      updated_at = now()
  WHERE item_id = v_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'game_docs not found for everyday conversation media';
  END IF;

  UPDATE public.educational_hub_items
  SET build_version = 'v1.5.0', build_updated_at = now(), updated_at = now()
  WHERE id = v_item_id;
END $$;
