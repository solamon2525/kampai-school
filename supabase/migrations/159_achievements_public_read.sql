-- ===============================================================
-- Migration 159: game_student_achievements — เปิดอ่าน public
-- ===============================================================
-- บั๊ก: นักเรียนเล่นเกมแบบ anonymous (รหัส 4 หลัก ไม่มี auth.uid)
-- → RLS เดิม (self ผ่าน user_roles / teacher / admin) ปิดหมด
-- → จอ pre-game "ป้ายสะสม 0/5" + แม่กุญแจทุกใบ ทั้งที่ปลดครบแล้ว
-- (ขัดกับ HonorWall ที่ใช้ RPC SECURITY DEFINER เห็นเหรียญครบ)
--
-- เหรียญ/ป้ายไม่ใช่ข้อมูลอ่อนไหว และ get_student_honor_profile (anon)
-- คืนข้อมูลเดียวกันอยู่แล้ว → เปิด SELECT public ไม่เพิ่ม exposure ใหม่
-- ===============================================================

DROP POLICY IF EXISTS "ach_public_read" ON public.game_student_achievements;
CREATE POLICY "ach_public_read" ON public.game_student_achievements
  FOR SELECT USING (true);
