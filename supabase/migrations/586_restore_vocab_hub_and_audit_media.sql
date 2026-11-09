-- =============================================================================
-- Migration 586: Restore English Vocab Hub and Upgrade Media RPC Deduplication
-- 1. Re-publish English Vocab Hub (58ca7383-8b28-4628-a73e-f3d326f10868)
-- 2. Update get_public_media_catalog RPC to deduplicate by external_url
-- 3. Catalog 8 uncataloged interactive HTML media items under Teacher Natthapong
-- =============================================================================

-- 1. Re-publish and enrich English Vocab Hub (58ca7383)
UPDATE public.educational_hub_items
SET is_published = true,
    title = '📚 คำศัพท์ภาษาอังกฤษ ป.4–6 (English Vocab Hub) — ฝึกอ่าน สะกดคำ & Math Challenge',
    grade_levels = ARRAY['ป.4', 'ป.5', 'ป.6'],
    tags = ARRAY['คำศัพท์', 'English', 'Math Challenge', 'คำนวณเลข', 'บวกเลข', 'ฝึกพูด', 'ป.4-6'],
    updated_at = NOW()
WHERE id = '58ca7383-8b28-4628-a73e-f3d326f10868'::uuid;

-- 2. Upgrade get_public_media_catalog with window deduplication
CREATE OR REPLACE FUNCTION public.get_public_media_catalog(p_subject text default null)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  thumbnail_url text,
  external_url text,
  subject text,
  grade_levels text[],
  view_count integer,
  sort_order integer,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked_items AS (
    SELECT
      i.id,
      i.title,
      i.description,
      i.thumbnail_url,
      i.external_url,
      i.subject,
      i.grade_levels,
      i.view_count,
      i.sort_order,
      i.created_at,
      ROW_NUMBER() OVER (
        PARTITION BY COALESCE(i.external_url, i.id::text)
        ORDER BY
          (i.tracked_game IS TRUE) DESC,
          i.sort_order ASC,
          i.created_at ASC
      ) AS rn
    FROM public.educational_hub_items i
    WHERE i.is_published = true
      AND (
        i.external_url ILIKE '%-media.html'
        OR i.external_url ILIKE '%media%'
        OR i.category_id IN (SELECT id FROM public.educational_hub_categories WHERE category_key = 'media')
      )
      AND (p_subject IS NULL OR p_subject = 'all' OR i.subject = p_subject)
  )
  SELECT
    id,
    title,
    description,
    thumbnail_url,
    external_url,
    subject,
    grade_levels,
    view_count,
    sort_order,
    created_at
  FROM ranked_items
  WHERE rn = 1
  ORDER BY
    CASE
      WHEN subject = 'ภาษาอังกฤษ' THEN 1
      WHEN subject = 'คณิตศาสตร์' THEN 2
      WHEN subject = 'ภาษาไทย' THEN 3
      ELSE 4
    END,
    sort_order ASC,
    created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_media_catalog(text) TO anon, authenticated;

-- 3. Catalog previously uncataloged interactive HTML teaching media
DO $$
DECLARE
  v_staff_id uuid := 'a5f53911-b9cb-465a-b963-7202bcb907b1'::uuid;
  v_cat_media uuid := '9e353886-9890-4222-9d33-53f7883dbcd4'::uuid;
BEGIN
  -- Verify teacher and category exist
  IF NOT EXISTS (SELECT 1 FROM public.staff WHERE id = v_staff_id) THEN
    SELECT id INTO v_staff_id FROM public.staff WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' LIMIT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.educational_hub_categories WHERE id = v_cat_media) THEN
    SELECT id INTO v_cat_media FROM public.educational_hub_categories WHERE category_key = 'media' LIMIT 1;
  END IF;

  -- 1) Weather and Seasons
  INSERT INTO public.educational_hub_items (
    owner_staff_id, category_id, item_type, title, description,
    thumbnail_url, external_url, subject, grade_levels, tags,
    sort_order, tracked_game, is_published
  )
  SELECT
    v_staff_id, v_cat_media, 'link',
    '🌦️ Weather and Seasons — สภาพอากาศ ป.4',
    'สื่อการสอนเรื่องสภาพอากาศ ฤดูกาล และเครื่องแต่งกาย ป.4 พร้อมสรุปความรู้และแบบฝึกหัด',
    '/games/english/weather-seasons-media-cover.png',
    '/games/english/weather-seasons-media.html',
    'ภาษาอังกฤษ',
    ARRAY['ป.4']::text[],
    ARRAY['weather', 'seasons', 'english', 'ป.4', 'media']::text[],
    100, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items WHERE external_url = '/games/english/weather-seasons-media.html'
  );

  -- 2) Agriculture Basics
  INSERT INTO public.educational_hub_items (
    owner_staff_id, category_id, item_type, title, description,
    thumbnail_url, external_url, subject, grade_levels, tags,
    sort_order, tracked_game, is_published
  )
  SELECT
    v_staff_id, v_cat_media, 'link',
    '🌱 เกษตรพื้นฐาน ป.4–ป.6',
    'สื่อการสอนเกษตรพื้นฐาน การปลูกพืชและเลี้ยงสัตว์เบื้องต้น ป.4–ป.6 พร้อมสรุปความรู้และแบบฝึกหัด',
    '/games/career/agriculture-basics-media-cover.png',
    '/games/career/agriculture-basics-media.html',
    'การงานอาชีพ',
    ARRAY['ป.4', 'ป.5', 'ป.6']::text[],
    ARRAY['เกษตร', 'การงานอาชีพ', 'การปลูกพืช', 'ป.4-6', 'media']::text[],
    100, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items WHERE external_url = '/games/career/agriculture-basics-media.html'
  );

  -- 3) Cooking Basics
  INSERT INTO public.educational_hub_items (
    owner_staff_id, category_id, item_type, title, description,
    thumbnail_url, external_url, subject, grade_levels, tags,
    sort_order, tracked_game, is_published
  )
  SELECT
    v_staff_id, v_cat_media, 'link',
    '🍳 การทำอาหารเบื้องต้น ป.4–ป.6',
    'สื่อการสอนการทำอาหารเบื้องต้น สุขอนามัย และอุปกรณ์เครื่องครัว ป.4–ป.6 พร้อมสรุปความรู้และแบบฝึกหัด',
    '/games/career/cooking-basics-media-cover.png',
    '/games/career/cooking-basics-media.html',
    'การงานอาชีพ',
    ARRAY['ป.4', 'ป.5', 'ป.6']::text[],
    ARRAY['ทำอาหาร', 'การงานอาชีพ', 'เครื่องครัว', 'ป.4-6', 'media']::text[],
    100, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items WHERE external_url = '/games/career/cooking-basics-media.html'
  );

  -- 4) Housework and Craft
  INSERT INTO public.educational_hub_items (
    owner_staff_id, category_id, item_type, title, description,
    thumbnail_url, external_url, subject, grade_levels, tags,
    sort_order, tracked_game, is_published
  )
  SELECT
    v_staff_id, v_cat_media, 'link',
    '🧹 งานบ้านและงานช่าง ป.4–ป.6',
    'สื่อการสอนงานบ้านและการดูแลรักษาของใช้ งานประดิษฐ์ช่างพื้นฐาน ป.4–ป.6 พร้อมสรุปความรู้และแบบฝึกหัด',
    '/games/career/housework-craft-media-cover.png',
    '/games/career/housework-craft-media.html',
    'การงานอาชีพ',
    ARRAY['ป.4', 'ป.5', 'ป.6']::text[],
    ARRAY['งานบ้าน', 'งานช่าง', 'การงานอาชีพ', 'ป.4-6', 'media']::text[],
    100, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items WHERE external_url = '/games/career/housework-craft-media.html'
  );

  -- 5) Homophone in Context
  INSERT INTO public.educational_hub_items (
    owner_staff_id, category_id, item_type, title, description,
    thumbnail_url, external_url, subject, grade_levels, tags,
    sort_order, tracked_game, is_published
  )
  SELECT
    v_staff_id, v_cat_media, 'link',
    '📖 คำพ้องรูป–พ้องเสียง ป.4–ป.6',
    'สื่อการสอนคำพ้องรูป–พ้องเสียง การสังเกตบริบทและการใช้คำให้ถูกต้อง ป.4–ป.6 พร้อมแบบฝึกหัด',
    '/games/thai/homophone-context-media-cover.png',
    '/games/thai/homophone-context-media.html',
    'ภาษาไทย',
    ARRAY['ป.4', 'ป.5', 'ป.6']::text[],
    ARRAY['คำพ้องรูป', 'คำพ้องเสียง', 'ภาษาไทย', 'ป.4-6', 'media']::text[],
    100, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items WHERE external_url = '/games/thai/homophone-context-media.html'
  );

  -- 6) Civic Duty
  INSERT INTO public.educational_hub_items (
    owner_staff_id, category_id, item_type, title, description,
    thumbnail_url, external_url, subject, grade_levels, tags,
    sort_order, tracked_game, is_published
  )
  SELECT
    v_staff_id, v_cat_media, 'link',
    '🏛️ หน้าที่พลเมือง ป.1–ป.3',
    'สื่อการสอนหน้าที่พลเมือง กฎระเบียบโรงเรียน และการปฏิบัติตนในสังคม ป.1–ป.3 พร้อมแบบฝึกหัด',
    '/games/social/civic-duty-media-cover.png',
    '/games/social/civic-duty-media.html',
    'สังคมศึกษา',
    ARRAY['ป.1', 'ป.2', 'ป.3']::text[],
    ARRAY['หน้าที่พลเมือง', 'สังคมศึกษา', 'ป.1-3', 'media']::text[],
    100, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items WHERE external_url = '/games/social/civic-duty-media.html'
  );

  -- 7) Map and Directions
  INSERT INTO public.educational_hub_items (
    owner_staff_id, category_id, item_type, title, description,
    thumbnail_url, external_url, subject, grade_levels, tags,
    sort_order, tracked_game, is_published
  )
  SELECT
    v_staff_id, v_cat_media, 'link',
    '🧭 แผนที่และทิศ ป.1–ป.3',
    'สื่อการสอนทิศ แผนที่ สัญลักษณ์ และการอ่านเข็มทิศ ป.1–ป.3 พร้อมสรุปความรู้และแบบฝึกหัด',
    '/games/social/map-directions-media-cover.png',
    '/games/social/map-directions-media.html',
    'สังคมศึกษา',
    ARRAY['ป.1', 'ป.2', 'ป.3']::text[],
    ARRAY['ทิศ', 'แผนที่', 'สังคมศึกษา', 'ป.1-3', 'media']::text[],
    100, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items WHERE external_url = '/games/social/map-directions-media.html'
  );

  -- 8) Thai Regions
  INSERT INTO public.educational_hub_items (
    owner_staff_id, category_id, item_type, title, description,
    thumbnail_url, external_url, subject, grade_levels, tags,
    sort_order, tracked_game, is_published
  )
  SELECT
    v_staff_id, v_cat_media, 'link',
    '🗺️ ภูมิภาคของไทย ป.4–ป.6',
    'สื่อการสอน 6 ภูมิภาคของประเทศไทย ลักษณะภูมิประเทศและเอกลักษณ์แต่ละภาค ป.4–ป.6 พร้อมแบบฝึกหัด',
    '/games/social/thai-regions-media-cover.png',
    '/games/social/thai-regions-media.html',
    'สังคมศึกษา',
    ARRAY['ป.4', 'ป.5', 'ป.6']::text[],
    ARRAY['ภูมิภาค', 'ประเทศไทย', 'สังคมศึกษา', 'ป.4-6', 'media']::text[],
    100, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items WHERE external_url = '/games/social/thai-regions-media.html'
  );
END $$;
