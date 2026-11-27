-- 596_update_thai_mario_vocab_godot_docs.sql
-- อัปเดต game_docs หลังสร้างเกมมาริโอตะลุยคำไทยใหม่ทั้งหมดด้วย Godot 4.4.1 (GDScript + WebAssembly)

INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
SELECT i.id,
       i.owner_staff_id,
       '2D Platformer ผจญภัยคำศัพท์ภาษาไทย (Godot 4.4.1 GDScript · WebAssembly)',
       ARRAY[
         'Godot 4.4.1 (GDScript 2.0) 640×360 canvas_items + pixel art แนวมาริโอแท้ (3 ด่าน: วิสรรชนีย์ / สมาส-ตัวสะกด / การันต์-พ้องรูป)',
         'ฟิสิกส์ CharacterBody2D พร้อม coyote time, jump buffer, variable jump, squash-and-stretch, เหยียบศัตรู และบล็อก ? สุ่มเหรียญ/หัวใจ 1-UP',
         'ระบบหัวใจ 5 ดวง เก็บคำถูก +100 (คอมโบ) เก็บคำผิด/ชนศัตรู/ตกเหวเสีย 1 ดวงพร้อมเฉลยหลักภาษา + อ่านออกเสียงไทย (TTS)',
         'เสียง 8-bit NES Chiptune BGM และ SFX สังเคราะห์ผ่าน Godot AudioServer (บัส Master / Music / SFX)',
         'รองรับ 3 โหมดผ่าน KampaiVersus (เดี่ยว · 2 คนเครื่องเดียว · ออนไลน์) + KampaiOrient + HUD ตรึงขอบจอ 100vw ไม่ล้นขวา'
       ],
       'v2.0.0',
       'สร้างใหม่ทั้งหมดด้วย Godot 4.4.1 GDScript (แทน Phaser 4.2.1); Export single-threaded WebAssembly (thai_mario.wasm + thai_mario.pck); แก้ปัญหา HUD/ป้ายหัวใจล้นขอบขวาบนหน้าจอกว้างและปรับระยะปุ่มสัมผัสมือถือไม่ทับแผงเสียง'
FROM public.educational_hub_items i
WHERE i.game_slug = 'thai-mario-vocab'
ON CONFLICT (item_id) DO UPDATE
  SET game_format = EXCLUDED.game_format,
      features = EXCLUDED.features,
      version = EXCLUDED.version,
      notes = EXCLUDED.notes,
      updated_at = now();
