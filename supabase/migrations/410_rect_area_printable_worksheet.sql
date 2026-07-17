-- Migration 410: Area Lab printable worksheets, 10 questions per shape/page (v2.4.0)
DO $$
DECLARE
  v_item_id UUID;
  v_owner_id UUID;
  v_worksheet_category_id UUID;
BEGIN
  SELECT id, owner_staff_id INTO v_item_id, v_owner_id
  FROM public.educational_hub_items
  WHERE external_url = '/games/math/rect-area-media.html'
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_item_id IS NULL THEN RAISE EXCEPTION 'item rect-area-media not found'; END IF;

  SELECT id INTO v_worksheet_category_id
  FROM public.educational_hub_categories
  WHERE category_key = 'worksheets' AND is_active = true
  LIMIT 1;

  IF v_worksheet_category_id IS NULL THEN RAISE EXCEPTION 'category worksheets not found'; END IF;

  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, description, external_url,
     thumbnail_url, subject, grade_levels, tags, sort_order, tracked_game, is_published)
  SELECT
    v_owner_id, v_worksheet_category_id, 'link',
    '📝 ใบงานพื้นที่รูปเรขาคณิต — 110 ข้อ',
    'ใบงาน A4 พื้นที่ 11 รูป รูปละ 10 ข้อ พร้อมภาพ ช่องแสดงวิธีทำ สุ่มชุดใหม่ เฉลยครู และบันทึก PDF',
    '/games/math/rect-area-worksheet.html',
    '/games/math/rect-area-media-cover.png',
    'คณิตศาสตร์', ARRAY['ป.4','ป.5','ป.6'],
    ARRAY['ใบงาน','พื้นที่','เรขาคณิต','พิมพ์ได้','PDF'],
    96, false, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_owner_id
      AND external_url = '/games/math/rect-area-worksheet.html'
  );

  UPDATE public.educational_hub_items
  SET category_id = v_worksheet_category_id,
      title = '📝 ใบงานพื้นที่รูปเรขาคณิต — 110 ข้อ',
      description = 'ใบงาน A4 พื้นที่ 11 รูป รูปละ 10 ข้อ พร้อมภาพ ช่องแสดงวิธีทำ สุ่มชุดใหม่ เฉลยครู และบันทึก PDF',
      thumbnail_url = '/games/math/rect-area-media-cover.png',
      subject = 'คณิตศาสตร์',
      grade_levels = ARRAY['ป.4','ป.5','ป.6'],
      tags = ARRAY['ใบงาน','พื้นที่','เรขาคณิต','พิมพ์ได้','PDF'],
      tracked_game = false,
      is_published = true,
      updated_at = now()
  WHERE owner_staff_id = v_owner_id
    AND external_url = '/games/math/rect-area-worksheet.html';

  UPDATE public.game_docs
  SET version = 'v2.4.0',
      features = array_append(features, 'ใบงาน A4 พื้นที่ 11 แบบ รูปละ 10 ข้อ รวม 110 ข้อ พร้อมภาพและเฉลยครู'),
      notes = 'v2.4.0: ลงทะเบียน rect-area-worksheet.html ในคลังใบงาน เชื่อมสองทางกับ Area Lab สุ่มโจทย์ใหม่ พิมพ์/PDF และเฉลยครู',
      updated_at = now()
  WHERE item_id = v_item_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'game_docs rect-area-media not found'; END IF;
END $$;
