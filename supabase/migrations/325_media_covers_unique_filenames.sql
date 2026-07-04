-- ============================================================================
-- Migration 325: ปกสื่อใช้ชื่อไฟล์ใหม่ (ตัด cache ปกเก่าที่ซ้ำไตรยางศ์)
-- ============================================================================

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/math/math-fraction-hub/cover-bars.png'
WHERE external_url = '/games/math/math-fraction-hub/index.html';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/thai/thai-grammar-hub/cover-pos.png'
WHERE external_url = '/games/thai/thai-grammar-hub/index.html';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/english/phonics-chart-cover.png'
WHERE external_url = '/games/english/phonics-chart.html';
