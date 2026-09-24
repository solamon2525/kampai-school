-- Document the mobile pronunciation fix; Vocabulary Hub remains learning-only media.
UPDATE public.game_docs AS d
SET version = 'v2.8.2',
    notes = 'สื่อการสอนคำศัพท์ ไม่เก็บคะแนนนักเรียน; ปุ่มเสียงมือถืออย่างน้อย 44px แตะซ้ำเพื่อฟังใหม่ได้ และแจ้งเมื่อเสียงสังเคราะห์ไม่พร้อม',
    updated_at = now()
FROM public.educational_hub_items AS i
WHERE d.item_id = i.id
  AND i.game_slug = 'vocab-hub'
  AND i.external_url = '/games/english/vocab-hub.html';
