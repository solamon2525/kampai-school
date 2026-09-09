-- Integrate English plant-part vocabulary into the existing science media unit.
INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
SELECT id, owner_staff_id, 'สำรวจส่วนของพืชดอกด้วยภาพ กิจกรรม และศัพท์อังกฤษ ป.4',
 ARRAY[
   'ภาพรวมและภาพขยายส่วนของพืช 7 ภาพ',
   'กิจกรรมเดิมใช้คลังภาพเดียวกับโหมดสอน',
   'ศัพท์ root, stem, leaf, flower, fruit, seed พร้อมคำอ่านไทย',
   'ปุ่มฟังศัพท์อังกฤษแยกจากคำอธิบายภาษาไทย',
   'ไม่มีเสียงอัตโนมัติ; ฟังเมื่อครูกดเท่านั้น',
   'ภาพเสียมี emoji fallback'
 ],
 'v1.4.0',
 'บูรณาการภาษาอังกฤษในเนื้อหาวิทยาศาสตร์ ป.4 โดยใช้ข้อมูลร่วมเดิม; คงใบงานและ URL เดิม'
FROM public.educational_hub_items
WHERE external_url = '/games/science/plant-parts-media.html'
ON CONFLICT (item_id) DO UPDATE SET
 game_format = EXCLUDED.game_format,
 features = EXCLUDED.features,
 version = EXCLUDED.version,
 notes = EXCLUDED.notes,
 updated_at = now();

UPDATE public.educational_hub_items
SET build_version = 'v1.4.0', build_updated_at = now(), updated_at = now()
WHERE external_url = '/games/science/plant-parts-media.html';
