-- 232_update_food_chain_versus.sql
-- "ห่วงโซ่อาหาร" (food-chain) — เพิ่มโหมดแข่ง 2 คน ผ่านเฟรมเวิร์ก KampaiVersus
-- (เดี่ยว + 2 คนเครื่องนี้ local hot-seat + ออนไลน์ delegate kampai-match). ไม่เปลี่ยน schema
-- เกมเดิมยังเล่นได้ครบ (แข่งเร็ว/ฝึกหัด). บันทึก game_docs + เด้งเวอร์ชัน (กฎ CLAUDE.md)
-- Idempotent: re-run ได้ (UPSERT game_docs)
DO $$
DECLARE
  v_staff_id UUID;
  v_url      TEXT := '/games/science/food-chain.html';
BEGIN
  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'staff not found'; END IF;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'เกมเรียงลำดับห่วงโซ่อาหาร (ordering) — แตะสิ่งมีชีวิตตามการไหลของพลังงาน ผู้ผลิต → ผู้ล่าสูงสุด · เดี่ยว + แข่ง 2 คน',
         ARRAY[
           'วิชาวิทยาศาสตร์ ป.4-6 ห่วงโซ่อาหาร — ระบบนิเวศไทย 10 แบบ (นาข้าว/ทุ่งหญ้า/ป่า/ทะเล/บ่อน้ำ/...) เรียง 3-5 ตัว',
           'โหมดเดี่ยว: ⚡ แข่งเร็ว (จับเวลา/ชีวิต/คอมโบห่วงโซ่ติดต่อ) · 📚 ฝึกหัด',
           '🏁 แข่ง 2 คน ผ่าน KampaiVersus: 2 คนเครื่องนี้ (local hot-seat จอเดียว — P1 จบ → ส่งเครื่อง → P2 → เทียบผู้ชนะ) + ออนไลน์ต่างเครื่อง',
           'ความยุติธรรม: ทั้งสองตา/ทุกเครื่องใช้ seed เดียวกัน → ลำดับห่วงโซ่ + การสลับการ์ดเหมือนกัน · เลือกคู่แข่ง P2 จากรายชื่อห้อง (เก็บสถิติแชมป์) หรือเล่นเร็วไม่ระบุชื่อ',
           'ผูก KAMPAI SDK (คะแนน/XP/Leaderboard) + เสียง'
         ],
         'v1.1.0',
         'เพิ่มโหมดแข่ง 2 คน (KampaiVersus: เดี่ยว + local hot-seat + online) — reuse /games/kampai-versus.js · โหมดเดี่ยวคงเดิม'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format, features = EXCLUDED.features,
        version = EXCLUDED.version, notes = EXCLUDED.notes, updated_at = now();
END $$;
