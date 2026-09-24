-- Thai Vocab Hub visual vocabulary pilot: source metadata for generated local assets.
ALTER TABLE public.thai_vocab_items
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS image_alt text;

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
      'content_status', i.content_status,
      'image_url', i.image_url,
      'image_alt', i.image_alt
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
            'content_status', i.content_status,
            'image_url', i.image_url,
            'image_alt', i.image_alt
          ) ORDER BY i.sort_order, i.word) AS items
        FROM public.thai_vocab_items i
        WHERE i.content_status = 'approved'
        GROUP BY i.category_slug
      ) grouped
    ), '{}'::jsonb)
  );
$$;
GRANT EXECUTE ON FUNCTION public.get_thai_vocab_catalog() TO anon, authenticated;

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
    'คลังคำศัพท์ภาษาไทย 16 หมวด พร้อมโหมดทบทวน บัตรคำ เกมฝึก และภาพประกอบคำศัพท์',
    ARRAY[
      'แยกสถานะคำ approved และ quarantined พร้อมเหตุผลตรวจทาน',
      'ผู้เรียนใช้เฉพาะคำที่ approved ผ่าน static fallback และ lazy RPC',
      'pilot ภาพประกอบคำราชาศัพท์ 25 คำ: เห็นคำก่อนแล้วเปิดภาพสมจริง',
      'ภาพเป็นตัวอย่างความหมายทั่วไป ไม่อ้างอิงบุคคลหรือสัญลักษณ์ราชสำนัก',
      'validator และรายงานครูตรวจ image_url/image_alt และไฟล์ภาพจริง'
    ],
    'v2.2.0',
    'v2.2.0: เพิ่มภาพประกอบ AI 25 คำในหมวดคำราชาศัพท์ พร้อมแท็บภาพและปุ่มเปิดภาพในบัตรคำ'
  FROM public.educational_hub_items i
  WHERE i.id = v_item_id
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features = EXCLUDED.features,
        version = EXCLUDED.version,
        notes = EXCLUDED.notes,
        updated_at = now();
END $$;
