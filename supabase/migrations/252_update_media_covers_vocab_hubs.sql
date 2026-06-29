-- 252: อัปเดตปกสื่อคลังสื่อการสอน — คลังคำศัพท์ไทย + คำศัพท์อังกฤษ (PNG 1280×720 สดใส ป.ประถม)

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/thai/thai-vocab-hub/cover.png',
    updated_at = now()
WHERE external_url = '/games/thai/thai-vocab-hub/index.html';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/english/vocab-hub-cover.png',
    updated_at = now()
WHERE external_url = '/games/english/vocab-hub.html';
