-- Public category order; existing school_settings RLS allows admin writes only.
-- Canonical wrapper route requires one published tracked item, not teacher clones.
UPDATE public.educational_hub_items
SET game_slug = 'vocab-hub', tracked_game = true, updated_at = now()
WHERE id = (
  SELECT id FROM public.educational_hub_items
  WHERE external_url = '/games/english/vocab-hub.html' AND is_published = true
  ORDER BY (game_slug = 'vocab-hub') DESC NULLS LAST, created_at ASC LIMIT 1
);

INSERT INTO public.school_settings (key, value, category, description)
VALUES ('vocab_hub_category_order',
  '["numbers","colors","days","months","alphabet","animals","fruits","body","shapes","family","food","jobs","weather","verbs","clothes","classroom","house-rooms","toys","transportation","sports","places","instruments","vegetables","insects","sea-animals","seasons","emotions","directions","birds"]',
  'educational-hub', 'ลำดับกลางหมวดหมู่คำศัพท์ภาษาอังกฤษ — ผู้ดูแลจัดเรียง')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
SELECT i.id, i.owner_staff_id, 'คลังคำศัพท์ / ฝึกฝน / แข่งขัน',
  ARRAY['29 หมวดหมู่ พร้อมภาพปก 3D และรายการโปรด',
    'เลือกกริดภาพใหญ่ มาตรฐาน หรือกะทัดรัด',
    'ผู้ดูแลลากจัดลำดับกลางด้วยเมาส์ สัมผัส หรือปุ่มคีย์บอร์ด',
    'บันทึกลำดับผ่าน wrapper และ school_settings RLS',
    'คงเนื้อหา เสียง ความคืบหน้า และโหมดเล่นเดิม'],
  'v2.8.0', 'ปรับหน้าเลือกหมวดหมู่เป็นแกลเลอรีพื้นสว่าง ภาพใหญ่ 3 วิว พร้อมลำดับกลางสำหรับทุกคน'
FROM public.educational_hub_items i
WHERE i.external_url = '/games/english/vocab-hub.html'
ON CONFLICT (item_id) DO UPDATE SET
  game_format = EXCLUDED.game_format, features = EXCLUDED.features,
  version = EXCLUDED.version, notes = EXCLUDED.notes, updated_at = now();
