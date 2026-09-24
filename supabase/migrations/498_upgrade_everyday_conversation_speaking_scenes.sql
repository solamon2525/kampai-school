-- Migration 498: add visual speaking scenes to Everyday Conversation P4
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
  SET description = 'สื่อฝึกพูดภาษาอังกฤษ ป.4 จำนวน 30 บท พร้อมโหมดฉากพูดได้ 32 ภาพและโหมดเรื่องของฉัน โดยครูเป็นผู้กดเริ่มเสียงทุกครั้ง',
      tags = ARRAY['บทสนทนา','ฝึกพูด','ถามตอบ','แนะนำตัว','ฉากพูดได้','ภาษาอังกฤษ','role play'],
      updated_at = now()
  WHERE id = v_item_id;

  UPDATE public.game_docs
  SET game_format = 'สื่อครูนำ จับคู่บทบาท A/B เรื่องของฉัน และฉากพูดได้ สำหรับฝึกสนทนาภาษาอังกฤษ ป.4 โดยไม่เก็บคะแนน',
      features = ARRAY[
        '30 บทสนทนา 120 ช่วงพูดใน 6 สถานการณ์ใกล้ตัว',
        'ภาพการ์ตูนเด็กไทย 30 ฉาก และภาพเรื่องของฉัน 2 ฉาก รวม 32 ภาพ',
        'บอลลูนคำพูดและกรอบสว่างแสดงผู้พูด A/B ตรงตำแหน่งในภาพ',
        'ครูกดเริ่มฉากก่อนเล่นเสียงอังกฤษและผลัดบทโดยไม่มีเสียงอัตโนมัติ',
        'เว้นช่วงพูดตามพร้อมนับถอยหลัง 3 วินาทีหลังทุกประโยค',
        'กดตัวละครหรือบอลลูนเพื่อหยุดและฟังประโยคนั้นซ้ำได้',
        'คำอ่านและคำแปลเปิดปิดสัมพันธ์กันทั้งการ์ดและฉากภาพ',
        'หยุดเสียงและเวลาเมื่อเปลี่ยนบท เปลี่ยนโหมด ออกจากเต็มจอ หรือซ่อนแท็บ',
        'ภาพสำรองและข้อความยังทำงานต่อได้เมื่อภาพหรือ TTS ไม่พร้อม'
      ],
      version = 'v1.2.0',
      notes = 'ต่อยอดสื่อฝึกพูดตามตัวชี้วัด ต 1.2 ป.4/1, ต 1.2 ป.4/4, ต 1.2 ป.4/5 และ ต 4.1 ป.4/1 ด้วยการเรียนรู้จากภาพและการพูดตาม',
      updated_at = now()
  WHERE item_id = v_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'game_docs not found for everyday conversation media';
  END IF;
END $$;
