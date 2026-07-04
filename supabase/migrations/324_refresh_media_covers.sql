-- ============================================================================
-- Migration 324: Refresh media covers (unique + content-matched)
-- ============================================================================
-- แก้ปกซ้ำ: math-fraction-hub / thai-grammar-hub เคยใช้ไฟล์เดียวกับ thai-script-hub
-- อัป thumbnail_url ด้วย ?v=2 เพื่อ cache-bust บน CDN
-- ============================================================================

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/math/math-fraction-hub/cover.png?v=2'
WHERE external_url = '/games/math/math-fraction-hub/index.html';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/thai/thai-grammar-hub/cover.png?v=2'
WHERE external_url = '/games/thai/thai-grammar-hub/index.html';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/english/phonics-chart-cover.png?v=2'
WHERE external_url = '/games/english/phonics-chart.html';

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/thai/thai-script-hub/cover.png?v=2'
WHERE external_url = '/games/thai/thai-script-hub/index.html';
