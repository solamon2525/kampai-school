-- 286_update_voxel_quiz_adventure_v1_2.sql
-- Voxel Quiz Adventure v1.2.0 — เฟส 3: minimap, power-ups, juice, cover PNG
DO $$
DECLARE
  v_url TEXT := '/games/english/voxel-quiz-adventure/index.html';
BEGIN
  UPDATE public.educational_hub_items
  SET thumbnail_url = '/games/english/voxel-quiz-adventure/cover.png', updated_at = now()
  WHERE external_url = v_url;

  UPDATE public.game_docs
  SET
    game_format = '3D Voxel Adventure — สำรวจ เก็บคะแนน ตอบควิซ หลบศัตรู + power-up',
    features = ARRAY[
      'มินิแมปมุมล่างขวา — แสดงผู้เล่น กล่อง ศัตรู power-up',
      'Power-up กล่องน้ำเงิน = วิ่งเร็ว 5 วิ · กล่องม่วง = แช่แข็งศัตรู 5 วิ',
      'Particle burst + คะแนนลอย + ตัวละครกระเด้งเมื่อเก็บของ',
      'TTS อ่านคำศัพท์ทุกข้อ (speakForQuestion)',
      'หมวดโจทย์ 4 แบบ + ระดับชั้น ป.4-6 + 3 ชีวิต + collision',
      'เดี่ยว + แข่ง 2 คน (KampaiVersus)'
    ],
    version = 'v1.2.0',
    notes = 'Phase 3: minimap, power-ups, juice FX, cover.png (migration 286)',
    updated_at = now()
  WHERE item_id IN (
    SELECT id FROM public.educational_hub_items WHERE external_url = v_url
  );
END $$;
