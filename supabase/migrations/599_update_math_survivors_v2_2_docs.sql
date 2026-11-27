-- 599_update_math_survivors_v2_2_docs.sql
-- อัปเดต game_docs เป็น v2.2.0 (เฟส 1+2: 3 แผนที่, 3 ฮีโร่, Dash, Fever, 5 Weapon Evolutions, Boss Telegraph & Chest, Pause/Minimap)

INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
SELECT i.id,
       i.owner_staff_id,
       'Roguelite Auto-Shooter แนว Vampire Survivors คณิตศาสตร์ ป.4–ป.6 (Godot 4.4.1 · 3 แผนที่ + 5 Evolutions)',
       ARRAY[
         'เลือกเล่นได้ 3 แผนที่ (วิหารรูนโบราณ ×1.0 / ป่าคริสตัลคณิต ×1.1 แท่นเร่งความเร็ว / ปราสาทลาวาสมการ ×1.25 วงเตือนลาวาปะทุ) พร้อมเพลง Chiptune แยกธีม',
         '3 จอมเวทปลดล็อกได้ (จอมเวทดาวฤกษ์, อัศวินพาย, นักประดิษฐ์สายฟ้า) พร้อมท่า Dash หลบอมตะ 0.24 วิ (Space/Shift หรือปุ่มสัมผัส) และโหมด Streak Fever',
         'ระบบ Weapon Evolution 5 คู่ (Lv.5 + พาสซีฟคู่ผสม → อาวุธขั้นเทพ Lv.6) พร้อมป้าย Synergy บนการ์ด Level-Up',
         'บอสประจำ 3 องก์มีท่าโจมตีแบบมีวงเตือน (Telegraph) + หีบสมบัติบอส (Boss Math Chest) ไขโจทย์รับ Evolution หรืออัปเกรด ×2',
         'UX/UI สมบูรณ์: ปุ่ม Pause + ตั้งค่าระดับเสียง BGM/SFX + ลดจอสั่น, แถบเลือดบอส, Minimap ชี้ตำแหน่งลูกแก้ว/บอส/หีบ และไต่ระดับ ป.4→ป.6 อัตโนมัติ'
       ],
       'v2.2.0',
       'อัปเกรดเฟส 1 และ 2 พร้อมกันบน Godot 4.4.1 WebAssembly; เพิ่ม Multi-biome TileSet 3 แผนที่, 3 ฮีโร่, Dash + Afterimage, Streak Fever, 5 Weapon Evolutions, Boss Chest, Minimap และเมนู Pause'
FROM public.educational_hub_items i
WHERE i.game_slug = 'math-survivors'
ON CONFLICT (item_id) DO UPDATE
  SET game_format = EXCLUDED.game_format,
      features = EXCLUDED.features,
      version = EXCLUDED.version,
      notes = EXCLUDED.notes,
      updated_at = now();
