-- Migration 497: add the personal speaking mode to Everyday Conversation P4
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
    RAISE EXCEPTION 'everyday conversation media item not found; apply migration 496 first';
  END IF;

  UPDATE public.educational_hub_items
  SET description = 'สื่อฝึกพูดภาษาอังกฤษ ป.4 จำนวน 30 บท พร้อมโหมดเรื่องของฉัน ให้เด็กสร้างบทแนะนำตัว 6 ประโยคและบทถามตอบ 6 คู่จากข้อมูลที่กรอกเฉพาะในแท็บ',
      tags = ARRAY['บทสนทนา','ฝึกพูด','ถามตอบ','แนะนำตัว','ภาษาอังกฤษ','role play'],
      updated_at = now()
  WHERE id = v_item_id;

  UPDATE public.game_docs
  SET game_format = 'สื่อครูนำ จับคู่บทบาท A/B และสร้างบทพูดเรื่องของฉัน สำหรับฝึกสนทนาภาษาอังกฤษ ป.4 โดยไม่เก็บคะแนน',
      features = ARRAY[
        '30 บทสนทนา 120 ช่วงพูดใน 6 สถานการณ์ใกล้ตัว',
        'บทแนะนำตัวจากข้อมูลเด็ก 6 ประโยค',
        'บทถามตอบข้อมูลส่วนตัว 6 คู่ พร้อมสลับบท A/B',
        'นำชื่อ อายุ จังหวัด โรงเรียน และครอบครัวไปใช้ในบทเดิมได้',
        'ข้อมูลส่วนตัวอยู่เฉพาะในหน่วยความจำของแท็บและมีปุ่มนักเรียนคนใหม่',
        'ฟังทีละประโยคหรือทั้งบท พร้อมเปิดปิดคำอ่านและคำแปล',
        'ไม่มีเสียงอัตโนมัติ ไม่ใช้ไมโครโฟน และไม่ส่งข้อมูลส่วนตัว'
      ],
      version = 'v1.1.0',
      notes = 'ต่อยอดตามตัวชี้วัด ต 1.2 ป.4/1, ต 1.2 ป.4/4, ต 1.2 ป.4/5 และ ต 4.1 ป.4/1',
      updated_at = now()
  WHERE item_id = v_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'game_docs not found for everyday conversation media';
  END IF;
END $$;
