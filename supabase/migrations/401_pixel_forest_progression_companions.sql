-- 401_pixel_forest_progression_companions.sql
-- Phase 4–5 build: progression economy, rare loot, expanded dungeons and companions.

UPDATE public.educational_hub_items
SET build_version = '6.0.0',
    build_updated_at = now(),
    updated_at = now()
WHERE game_slug = 'pixel-forest-explorer';

INSERT INTO public.game_docs
  (item_id, owner_staff_id, game_format, features, version, notes)
SELECT
  item.id,
  item.owner_staff_id,
  'Action RPG 2D pixel-art มุมมองบนลงล่าง พร้อมเศรษฐกิจไอเทม ดันเจี้ยน และคู่หูช่วยต่อสู้',
  ARRAY[
    'ร้านค้า ยาฟื้นพลัง ชุดวัตถุดิบ และผงรูน พร้อมสมดุลต้นทุนทองใหม่',
    'คราฟอาวุธหลายระดับความหายากและตีบวกแบบสำเร็จแน่นอนสูงสุด +10',
    'รูนสองช่อง รูนคราฟได้ และบิลด์โจมตี ป้องกัน คริติคอล ฟื้นฟู และเศรษฐกิจ',
    'ดรอปเทเบิลเฉพาะมอนสเตอร์และอาวุธหายาก Rare Epic Legendary เฉพาะโซน',
    'ดันเจี้ยน 2 แห่ง 3 ห้องพร้อมบอสสองเฟส เวลา รางวัล และสถิติถาวร',
    'คู่หู 3 แบบ: ฮีล ยิงเป้าหมาย และเวทวงกว้าง ปลดล็อกจากเนื้อหาในเกม',
    'รองรับเซฟเดิม เซฟข้ามเครื่อง และ telemetry สำหรับปรับสมดุลเศรษฐกิจ'
  ],
  '6.0.0',
  'Phase 4–5: ขยาย progression loop ให้ทองและวัตถุดิบมีทางใช้ชัดเจน เพิ่ม rare drop chase, rune loadout สองช่อง, ดันเจี้ยนเขาวงกตหมอกคราม และคู่หูช่วยต่อสู้โดยไม่เพิ่มพลังแบบ pay-to-win'
FROM public.educational_hub_items AS item
WHERE item.game_slug = 'pixel-forest-explorer'
ORDER BY item.created_at
LIMIT 1
ON CONFLICT (item_id) DO UPDATE
SET game_format = EXCLUDED.game_format,
    features = EXCLUDED.features,
    version = EXCLUDED.version,
    notes = EXCLUDED.notes,
    updated_at = now();
