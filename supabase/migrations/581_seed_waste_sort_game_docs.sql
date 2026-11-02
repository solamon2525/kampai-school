-- 581_seed_waste_sort_game_docs.sql
-- Upsert game_docs and update educational_hub_items for waste-sort game (v2.0.0 evolution)
DO $$
DECLARE
  v_staff_id  UUID;
  v_url       TEXT := '/games/career/waste-sort.html';
BEGIN
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;

  UPDATE public.educational_hub_items
  SET game_slug = 'waste-sort',
      tracked_game = true,
      is_published = true,
      thumbnail_url = '/games/career/waste-sort-cover.png',
      bgm_preset = 'bright',
      updated_at = now()
  WHERE external_url = v_url OR game_slug = 'waste-sort';

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'Fixed-bins sorting — แยกขยะลงถังมาตรฐาน 4 สี (เขียว/เหลือง/น้ำเงิน/แดง) 80 ชนิด',
         ARRAY[
           'ขยะมาตรฐาน 4 สี กรมควบคุมมลพิษ: เปียก/ย่อยสลายได้, รีไซเคิล, ทั่วไป, อันตราย (80 ชิ้น)',
           'ระบบ KampaiVersus แข่งขัน 2 ผู้เล่น (เล่นเดี่ยว, 2 คนเครื่องนี้ Hot-seat, และแข่งออนไลน์)',
           'ระบบคำอธิบายเหตุผลทางวิทยาศาสตร์และสิ่งแวดล้อมประกอบทุกชิ้น',
           'ใบงานพิมพ์ A4 พร้อมเฉลยครู และโหมดห้องเรียนฉายโปรเจกเตอร์'
         ],
         'v2.0.0',
         'แยกขยะ 4 ถัง — อัปเกรดมาตรฐานการคัดแยกขยะ 80 ชนิด, KampaiVersus 2 ผู้เล่น, Quality Contract hooks และ A4 Worksheet'
  FROM public.educational_hub_items i
  WHERE i.game_slug = 'waste-sort' OR i.external_url = v_url
  LIMIT 1
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features = EXCLUDED.features,
        version = EXCLUDED.version,
        notes = EXCLUDED.notes,
        updated_at = now();
END $$;
