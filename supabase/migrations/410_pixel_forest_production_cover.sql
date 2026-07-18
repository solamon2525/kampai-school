-- Publish the Phase 4-5 cover and keep the game specification in sync.

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/general/pixel-forest-explorer/cover.png',
    build_version = '6.0.1',
    build_updated_at = now(),
    updated_at = now()
WHERE game_slug = 'pixel-forest-explorer';

INSERT INTO public.game_docs
  (item_id, owner_staff_id, game_format, features, version, notes)
SELECT
  item.id,
  item.owner_staff_id,
  COALESCE(
    docs.game_format,
    'Action RPG 2D pixel-art มุมมองบนลงล่าง พร้อมเศรษฐกิจไอเทม ดันเจี้ยน และคู่หูช่วยต่อสู้'
  ),
  COALESCE(
    docs.features,
    ARRAY['สำรวจป่า ต่อสู้ เก็บเลเวล คราฟ ตีบวก รูน ดันเจี้ยน และคู่หู']::text[]
  ),
  '6.0.1',
  CONCAT_WS(
    E'\n',
    NULLIF(docs.notes, ''),
    'Production cover: ปก PNG 1280×720 สรุปฮีโร่ มอนสเตอร์ บอส ดันเจี้ยน ไอเทมหายาก ตกปลา และคู่หู พร้อม title safe zone สำหรับการ์ดเกม'
  )
FROM public.educational_hub_items AS item
LEFT JOIN public.game_docs AS docs ON docs.item_id = item.id
WHERE item.game_slug = 'pixel-forest-explorer'
ORDER BY item.created_at
LIMIT 1
ON CONFLICT (item_id) DO UPDATE
SET game_format = EXCLUDED.game_format,
    features = EXCLUDED.features,
    version = EXCLUDED.version,
    notes = EXCLUDED.notes,
    updated_at = now();
