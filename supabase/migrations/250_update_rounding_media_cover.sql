-- อัปเดตปกสื่อ "ค่าประมาณ เต็มสิบ/ร้อย/พัน" (rounding.html) → PNG 1280×720
UPDATE public.educational_hub_items
SET thumbnail_url = '/games/math/rounding-cover.png',
    updated_at = now()
WHERE external_url = '/games/math/rounding.html';
