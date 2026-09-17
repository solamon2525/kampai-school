-- Vocabulary Hub remains registered for /play/vocab-hub and its shared category order,
-- but it is teaching media: no student login, score submission, XP, or leaderboard.
UPDATE public.game_docs AS d
SET game_format = 'คลังสื่อการสอนคำศัพท์ / แบบฝึกเฉพาะหน้า',
    features = ARRAY[
      '29 หมวดหมู่ พร้อมภาพปก 3D และรายการโปรด',
      'เลือกกริดภาพใหญ่ มาตรฐาน หรือกะทัดรัด',
      'ผู้ดูแลลากจัดลำดับกลางด้วยเมาส์ สัมผัส หรือปุ่มคีย์บอร์ด',
      'ฝึกคำศัพท์และรับผลตอบกลับเฉพาะหน้าจอ โดยไม่ระบุตัวนักเรียนหรือบันทึกคะแนน'
    ],
    version = 'v2.8.1',
    notes = 'สื่อการสอนสำหรับเรียนและฝึกคำศัพท์เท่านั้น; ไม่ส่ง gameEnd หรือเก็บคะแนนนักเรียน',
    updated_at = now()
FROM public.educational_hub_items AS i
WHERE d.item_id = i.id
  AND i.game_slug = 'vocab-hub'
  AND i.external_url = '/games/english/vocab-hub.html';
