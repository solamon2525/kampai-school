-- 390_update_multiply_race_research_menu_docs.sql
-- บันทึก game_docs สำหรับปุ่ม "วิจัย" ในเมนูเกม multiply-race

DO $docs$
DECLARE
  v_staff_id UUID;
  v_url TEXT := '/games/math/multiply-race.html';
BEGIN
  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE NOTICE 'staff multiply-race owner not found — skip game_docs'; RETURN; END IF;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'ตอบคำถามสูตรคูณ (quiz) — เดี่ยว + ออนไลน์ + 2 คนจอเดียว + โหมดวิจัย',
         ARRAY[
           'แข่งเร็ว/ไม่จำกัด/ฝึกแม่/ชาเลนจ์วันนี้',
           'ปุ่มวิจัยในเมนูเกม แสดงเมื่อ wrapper พบโครงการวิจัย active ที่ตรงกับเกมและชั้นเรียน',
           'โหมดวิจัยเปิดผ่าน study + autostart เพื่อแยกคะแนนเข้า /teacher/game-research',
           'Daily Challenge ใช้ seed รายวันและกันเล่นซ้ำจาก wrapper data',
           'Adaptive per-table mastery + ตราเก่งแม่สูตรคูณ',
           'โหมดออนไลน์ผ่าน KampaiMatch',
           'โหมด 2 คน split-screen บน PC (P1 ลูกศร / P2 WASD) + จอยแพด',
           'จอจบรองรับ KAMPAI result slot'
         ],
         'v1.1.2',
         'เพิ่มปุ่มวิจัยในเมนูเริ่มของเกม โดยรับ research studies จาก wrapper ผ่าน KAMPAI.gameData.research และนำทางเข้าโหมดวิจัยอัตโนมัติ'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
END $docs$;
