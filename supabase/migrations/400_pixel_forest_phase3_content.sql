-- 400_pixel_forest_phase3_content.sql
-- Phase 3 content build: distinctive zone enemies, two-phase bosses and first dungeon.

UPDATE public.educational_hub_items
SET build_version = '4.0.0',
    build_updated_at = now(),
    updated_at = now()
WHERE game_slug = 'pixel-forest-explorer';

INSERT INTO public.game_docs
  (item_id, owner_staff_id, game_format, features, version, notes)
SELECT
  item.id,
  item.owner_staff_id,
  'Action RPG 2D pixel-art มุมมองบนลงล่างแบบแคมเปญ 4 บท พร้อมดันเจี้ยนจับเวลา',
  ARRAY[
    '3 อาชีพพร้อมอาวุธและสกิลเฉพาะตัว',
    '4 โซนพร้อมมอนสเตอร์เฉพาะถิ่นและรูปแบบโจมตีต่างกัน',
    'บอสประจำบท 4 ตัวแบบสองเฟสพร้อมสกิลคลั่ง',
    'ดันเจี้ยนถ้ำรากโบราณ 3 ห้องพร้อมบอสผู้กลืนกินราก',
    'บันทึกเวลาเร็วที่สุด จำนวนครั้งที่ผ่าน และรางวัลถาวร',
    'ระบบเซฟข้ามเครื่อง คราฟ ตีบวก รูน และ telemetry บาลานซ์'
  ],
  '4.0.0',
  'Phase 3 Content Expansion: เพิ่มภูตรากหนาม คางคกหมอกพิษ อัศวินศิลารูน; บอสทุกบทมีช่วงคลั่งเมื่อ HP ต่ำกว่า 50%; เปิดดันเจี้ยนแรกหลังจบบท 1 พร้อม 3 ห้อง เวลา 100 วินาที บอสและสถิติถาวร'
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
