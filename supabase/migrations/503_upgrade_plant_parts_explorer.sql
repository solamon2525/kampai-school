-- Upgrade the existing teaching resource only; no schema or URL duplication.
INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
SELECT id, owner_staff_id, 'สำรวจส่วนของพืชดอกด้วยภาพกึ่งสมจริง ป.4',
 ARRAY['ภาพพืชและภาพขยาย WebP 7 ภาพ', 'สำรวจราก ลำต้น ใบ ดอก; ผลและเมล็ดเป็นส่วนเพิ่มเติม',
       'อธิบายทีละขั้นและคำถามชวนคิด', 'ฟังเมื่อกดพร้อมเน้นประโยค',
       'จับคู่หน้าที่', 'กินส่วนไหน', 'เรียงเติบโต', 'ฝึกสั้น MCQ'],
 'v1.2.0',
 'ว 1.2 ป.4/1; ใช้ต้นมะเขือเปราะเป็นภาพอ้างอิงร่วม ไม่มี SVG ในพื้นที่สอน ไม่มีเสียงเมื่อเปิดหน้าหรือเลือกส่วนพืช; คงกิจกรรมเดิม ไม่แก้ใบงาน; เนื้อหาจาก SciMath/สสวท. ภาพจำลองไม่ใช่มาตราส่วนจริง'
FROM public.educational_hub_items
WHERE external_url = '/games/science/plant-parts-media.html'
ON CONFLICT (item_id) DO UPDATE SET
 game_format = EXCLUDED.game_format, features = EXCLUDED.features,
 version = EXCLUDED.version, notes = EXCLUDED.notes, updated_at = now();

UPDATE public.educational_hub_items
SET thumbnail_url = '/games/science/plant-parts-media-cover.png',
    build_version = 'v1.2.0', build_updated_at = now(), updated_at = now()
WHERE external_url = '/games/science/plant-parts-media.html';
