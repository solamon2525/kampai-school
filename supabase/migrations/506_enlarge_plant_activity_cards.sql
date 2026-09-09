-- Improve the existing plant-parts media card presentation without changing content schema.
INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
SELECT id, owner_staff_id, 'สำรวจส่วนของพืชดอกด้วยภาพ กิจกรรม และศัพท์อังกฤษ ป.4',
 ARRAY[
   'ภาพกิจกรรมกรอบสี่เหลี่ยม 1:1 ใช้ object-fit contain ไม่ครอป',
   'ชื่อไทยและ English label แยกคนละบรรทัด',
   'ภาพและข้อความขยายตามพื้นที่จริง รองรับมือถือ 2 คอลัมน์และจอใหญ่ 3 คอลัมน์',
   'ภาพเสียมี emoji fallback และคงกิจกรรมเดิม',
   'ไม่มีเสียงอัตโนมัติ; ฟังเมื่อครูกดเท่านั้น'
 ],
 'v1.5.0',
 'ปรับการ์ดภาพให้ใช้พื้นที่ห้องเรียนคุ้มขึ้น โดยไม่เปลี่ยนข้อมูลบทเรียนหรือสัดส่วนภาพต้นฉบับ'
FROM public.educational_hub_items
WHERE external_url = '/games/science/plant-parts-media.html'
ON CONFLICT (item_id) DO UPDATE SET
 game_format = EXCLUDED.game_format,
 features = EXCLUDED.features,
 version = EXCLUDED.version,
 notes = EXCLUDED.notes,
 updated_at = now();

UPDATE public.educational_hub_items
SET build_version = 'v1.5.0', build_updated_at = now(), updated_at = now()
WHERE external_url = '/games/science/plant-parts-media.html';
