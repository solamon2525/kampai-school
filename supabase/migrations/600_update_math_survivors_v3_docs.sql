-- 600_update_math_survivors_v3_docs.sql
-- อัปเดต game_docs เป็น v3.0.0 (7 อาชีพสมดุล 25 แต้ม + โหมด 2P โคออฟช่วยกัน & 2P แข่งกันจอเดียวกัน)

INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
SELECT i.id,
       i.owner_staff_id,
       'Roguelite Auto-Shooter คณิตศาสตร์ ป.4–ป.6 (Godot 4.4.1 · 7 อาชีพสมดุล · 1P / 2P โคออฟ & แข่งกัน)',
       ARRAY[
         'ระบบ 7 อาชีพสมดุล (งบค่าพลัง 25 แต้มเท่ากัน: อึด/เร็ว/แกร่ง/เวท/รัว + Ratio Defense): 3 อาชีพเริ่มต้น (จอมเวทดาวฤกษ์, อัศวินโล่พาย, พรานความเร็ว) และ 4 อาชีพปลดล็อก (นักประดิษฐ์สายฟ้า, หมอยาพฤกษา, นักรบคลั่งสมการ, ปราชญ์กาลเวลา) พร้อมลองฟรีทุกอาชีพในโหมดฝึกซ้อม',
         'สกิลเอกลักษณ์แยก 7 อาชีพ: Arcane Echo, Fortress Guard เกราะบล็อกทุก 6 วิ, Wind Runner Dash 2 วิ+ยิงรัว, เสาเทสลาอัตโนมัติ, Math Elixir ฮีลทีม+ชุบไว ×2, Blood Math คลั่ง+ดูดเลือด และ Time Dilation หน่วงเวลาศัตรู',
         'โหมด 2P โคออฟช่วยกัน (180 วิ · P1: WASD+Space / P2: ลูกศร+Enter หรือ Dual Touch Joystick): กล้องซูมร่วมอัตโนมัติ, วงชุบชีวิตสีเขียว (2.5 วิ หรือเก็บลูกแก้วถูก), Dual Level-Up Draft ซ้าย-ขวา (1/2/3 & J/K/L) และ Super Math ระเบิดพร้อมกัน 2 จุด',
         'โหมด 2P แข่งกันจอเดียวกัน (120 วิ · Rival): แถบชักเย่อคะแนน P1 vs P2 เรียลไทม์ แย่งชนลูกแก้วคำตอบถูกก่อนรับ +200 และส่งดีบัฟหน่วงความเร็วคู่แข่ง 2 วิ พร้อมระบบเกิดใหม่อัตโนมัติใน 2.5 วิ',
         'รองรับครบ 3 แผนที่ (วิหารรูน, ป่าคริสตัล, ปราสาทลาวา), 5 Weapon Evolutions Lv.6, บอส 3 องก์พร้อมหีบสมบัติ, Minimap 2 ผู้เล่น, Pause/ตั้งค่า และ KampaiVersus ออนไลน์'
       ],
       'v3.0.0',
       'อัปเกรด Math Survivors สู่ v3.0.0 บน Godot 4.4.1 WebAssembly: เพิ่ม 7 อาชีพสมดุล (ตรวจสอบด้วย automated balance test งบ 25 แต้ม + Power Index deviation <= 16%) และโหมด 2 ผู้เล่นจอเดียวกันทั้ง Co-op Team และ Rival พร้อม Dual Draft และ Dual Touch Joystick'
FROM public.educational_hub_items i
WHERE i.game_slug = 'math-survivors'
ON CONFLICT (item_id) DO UPDATE
  SET game_format = EXCLUDED.game_format,
      features = EXCLUDED.features,
      version = EXCLUDED.version,
      notes = EXCLUDED.notes,
      updated_at = now();
