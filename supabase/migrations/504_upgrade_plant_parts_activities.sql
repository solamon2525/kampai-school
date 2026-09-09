-- Extend the existing plant-parts media unit with the shared illustrated activity cards.
INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
SELECT id, owner_staff_id, 'สำรวจส่วนของพืชดอกด้วยภาพและกิจกรรม ป.4',
 ARRAY['ภาพขยายในจับคู่หน้าที่', 'ภาพตัวอย่างในกินส่วนไหน', 'ภาพลำดับการเติบโต',
       'ภาพประกอบคำถามฝึกสั้น', 'ภาพเสียมี emoji fallback', 'ฟังเมื่อกดเท่านั้น'],
 'v1.3.0',
 'กิจกรรมเดิมใช้คลังภาพเดียวกับโหมดสอน; ไม่มีเสียงอัตโนมัติ; คงใบงานและ URL เดิม'
FROM public.educational_hub_items
WHERE external_url = '/games/science/plant-parts-media.html'
ON CONFLICT (item_id) DO UPDATE SET
 game_format = EXCLUDED.game_format, features = EXCLUDED.features,
 version = EXCLUDED.version, notes = EXCLUDED.notes, updated_at = now();

UPDATE public.educational_hub_items
SET build_version = 'v1.3.0', build_updated_at = now(), updated_at = now()
WHERE external_url = '/games/science/plant-parts-media.html';
