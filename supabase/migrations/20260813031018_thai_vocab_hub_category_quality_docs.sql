-- Thai Vocab Hub: quarantine cross-category expansion and publish approved-only catalog.
ALTER TABLE public.thai_vocab_items
  ADD COLUMN IF NOT EXISTS content_status text NOT NULL DEFAULT 'approved'
    CHECK (content_status IN ('approved', 'quarantined')),
  ADD COLUMN IF NOT EXISTS review_reason text,
  ADD COLUMN IF NOT EXISTS category_evidence text,
  ADD COLUMN IF NOT EXISTS duplicate_rationale text;

CREATE INDEX IF NOT EXISTS idx_thai_vocab_items_approved_category
  ON public.thai_vocab_items (category_slug, sort_order)
  WHERE content_status = 'approved';

-- The expansion script marked all 151-200 entries with the P.4 review tag.
-- Keep them for editorial review but never return them to learners.
UPDATE public.thai_vocab_items
SET content_status = 'quarantined',
    review_reason = 'ชุดขยาย ป.4 เดิมยืมคำจากหมวดอื่นเพื่อให้ครบ 200 คำ; รอคำทดแทนที่ผ่านการตรวจหมวด',
    category_evidence = COALESCE(category_evidence, 'ยังไม่มีหลักฐานเฉพาะของหมวด; ส่งเข้าคิวตรวจทาน'),
    updated_at = now()
WHERE 'ชุดเสริม ป.4' = ANY(tags)
  AND content_status <> 'quarantined';

CREATE OR REPLACE FUNCTION public.get_thai_vocab_words(p_category_slug text)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'word', i.word,
      'reading', i.reading,
      'meaning', i.meaning,
      'emoji', i.emoji,
      'grade', i.grade,
      'difficulty', i.difficulty,
      'indicator_code', i.indicator_code,
      'classifier_for', i.classifier_for,
      'pair_id', i.pair_id,
      'synonym_group', i.synonym_group,
      'origin_lang', i.origin_lang,
      'content_status', i.content_status
    ) ORDER BY i.sort_order, i.word)
    FROM public.thai_vocab_items i
    WHERE i.category_slug = p_category_slug
      AND i.content_status = 'approved'
  ), '[]'::jsonb);
$$;
GRANT EXECUTE ON FUNCTION public.get_thai_vocab_words(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_thai_vocab_catalog()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'categories', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'slug', c.slug,
        'title', c.title,
        'icon', c.icon,
        'desc', c.description
      ) ORDER BY c.sort_order, c.slug)
      FROM public.thai_vocab_categories c
    ), '[]'::jsonb),
    'words', COALESCE((
      SELECT jsonb_object_agg(slug, items)
      FROM (
        SELECT i.category_slug AS slug,
          jsonb_agg(jsonb_build_object(
            'word', i.word,
            'reading', i.reading,
            'meaning', i.meaning,
            'emoji', i.emoji,
            'grade', i.grade,
            'difficulty', i.difficulty,
            'indicator_code', i.indicator_code,
            'classifier_for', i.classifier_for,
            'pair_id', i.pair_id,
            'synonym_group', i.synonym_group,
            'origin_lang', i.origin_lang,
            'content_status', i.content_status
          ) ORDER BY i.sort_order, i.word) AS items
        FROM public.thai_vocab_items i
        WHERE i.content_status = 'approved'
        GROUP BY i.category_slug
      ) grouped
    ), '{}'::jsonb)
  );
$$;
GRANT EXECUTE ON FUNCTION public.get_thai_vocab_catalog() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_thai_vocab_stats()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'slug', c.slug,
    'title', c.title,
    'item_count', (SELECT COUNT(*)::int FROM public.thai_vocab_items i WHERE i.category_slug = c.slug AND i.content_status = 'approved'),
    'quarantined_count', (SELECT COUNT(*)::int FROM public.thai_vocab_items i WHERE i.category_slug = c.slug AND i.content_status = 'quarantined'),
    'with_indicator', (SELECT COUNT(*)::int FROM public.thai_vocab_items i WHERE i.category_slug = c.slug AND i.content_status = 'approved' AND i.indicator_code IS NOT NULL)
  ) ORDER BY c.sort_order), '[]'::jsonb)
  FROM public.thai_vocab_categories c;
$$;
GRANT EXECUTE ON FUNCTION public.get_thai_vocab_stats() TO authenticated;

DO $$
DECLARE
  v_item_id uuid;
BEGIN
  SELECT id INTO v_item_id
  FROM public.educational_hub_items
  WHERE external_url = '/games/thai/thai-vocab-hub/index.html'
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'item thai-vocab-hub not found';
  END IF;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT
    i.id,
    i.owner_staff_id,
    'คลังคำศัพท์ภาษาไทย 16 หมวด พร้อมโหมดทบทวน บัตรคำ และเกมฝึก',
    ARRAY[
      'แยกสถานะคำ approved และ quarantined พร้อมเหตุผลตรวจทาน',
      'ผู้เรียนใช้เฉพาะคำที่ approved ผ่าน static fallback และ lazy RPC',
      'กักกันชุดขยายข้ามหมวด 800 รายการ เหลือ 2,400 คำที่เปิดเรียนและตรงหมวด',
      'validator ตรวจคำซ้ำพร้อมเหตุผล หมวดคำพ้องเสียง ลักษณนาม ไวพจน์ ตรงข้าม และราชาศัพท์',
      'รายงาน CSV สำหรับครูสุ่มตรวจคำที่กักกันและคำที่อนุมัติ'
    ],
    'v2.1.0',
    'v2.1.0: กักกันคำศัพท์ปนหมวด 800 รายการจากชุดขยาย ป.4 และให้ผู้เรียนเห็นเฉพาะคำที่ผ่านการตรวจหมวด 2,400 คำ'
  FROM public.educational_hub_items i
  WHERE i.id = v_item_id
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features = EXCLUDED.features,
        version = EXCLUDED.version,
        notes = EXCLUDED.notes,
        updated_at = now();

  UPDATE public.educational_hub_items SET updated_at = now() WHERE id = v_item_id;
END $$;
