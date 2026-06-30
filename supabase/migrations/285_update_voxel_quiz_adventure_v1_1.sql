-- 285_update_voxel_quiz_adventure_v1_1.sql
-- Voxel Quiz Adventure v1.1.0 — เฟส 2: หมวดโจทย์, ระดับชั้น, ชีวิต, collision
DO $$
DECLARE
  v_url TEXT := '/games/english/voxel-quiz-adventure/index.html';
BEGIN
  UPDATE public.game_docs
  SET
    game_format = '3D Voxel Adventure — เดินสำรวจ เก็บคะแนน ตอบควิซตามหมวด/ชั้น หลบศัตรู (3 ชีวิต)',
    features = ARRAY[
      'โลก 3D สไตล์บล็อก — ตัวละคร เมือง ต้นไม้ ศัตรูไล่ตาม',
      'เลือกหมวดก่อนเล่น: สัตว์ / สี / ทักทาย / ตัวเลข',
      'เลือกระดับชั้น ป.4 / ป.5 / ป.6 — กรองโจทย์ตาม grades ใน data.js',
      '3 ชีวิต (หัวใจ) — โดนศัตรูแล้วเสียชีวิต + ไม่สะเทือน 2 วิ',
      'ขอบเขตแผนที่ + ชนตึก/ต้นไม้ไม่ทะลุ (AABB collision)',
      'เก็บกล่องส้ม (+10) · กล่องทองควิซ (+50 +1 ดาว) · ชนะที่ 10 ดาว',
      'เดี่ยว + แข่ง 2 คน (KampaiVersus) · D-pad มือถือ'
    ],
    version = 'v1.1.0',
    notes = 'Phase 2: topics, grades, lives, map bounds, obstacle collision (migration 285)',
    updated_at = now()
  WHERE item_id IN (
    SELECT id FROM public.educational_hub_items WHERE external_url = v_url
  );
END $$;
