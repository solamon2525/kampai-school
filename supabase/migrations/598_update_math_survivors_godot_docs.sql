-- 598_update_math_survivors_godot_docs.sql
-- อัปเดต game_docs หลังยกระดับเกม Math Survivors ด้วย Godot 4.4.1 (Pixel Art, TileMapLayer, Shaders, AudioServer)

INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
SELECT i.id,
       i.owner_staff_id,
       'Roguelite Auto-Shooter แนว Vampire Survivors คณิตศาสตร์ ป.4–ป.6 (Godot 4.4.1 GDScript · WebAssembly)',
       ARRAY[
         'Godot 4.4.1 (GDScript 2.0) งานพิกเซลอาร์ต NEAREST พร้อมอนิเมชัน SpriteFrames ตัวละครจอมเวท, สไลม์, ค้างคาว, โกเลม, อัศวิน และบอส 3 องก์',
         'แผนที่อารีนา TileMapLayer + TileSet (.tres) ลายหินวิหารรูนพร้อมขอบกำแพงฟิสิกส์ คบไฟกะพริบ เสาเรืองแสง และละอองเวท CPUParticles2D',
         'เอฟเฟกต์ Shader (.gdshader): Hit-flash กระพริบขาวเวลาโดนตี, ออร่าลูกแก้วสมการเรืองแสง, Trauma camera shake และ Hit-stop',
         'เสียง Chiptune BGM/SFX สังเคราะห์ผ่าน Godot AudioServer บนบัส Master / Music / SFX + ทดสอบความเที่ยงตรง 1,800 โจทย์ ป.4–ป.6 ผ่าน headless',
         'Export single-threaded WebAssembly (lazy load) เชื่อม KAMPAI SDK, KampaiVersus, จอยสัมผัสบนมือถือ และ HUD 100vw ไม่ล้นขอบ'
       ],
       'v2.0.0',
       'อัปเกรดจาก Canvas 2D เป็น Godot 4.4.1 GDScript + WebAssembly; เพิ่ม TileMapLayer, Shader, Pixel SpriteFrames, AudioServer BGM/SFX และจัดระยะ #weapon-dock เหนือแผงเสียงบนจอมือถือ 360px'
FROM public.educational_hub_items i
WHERE i.game_slug = 'math-survivors'
ON CONFLICT (item_id) DO UPDATE
  SET game_format = EXCLUDED.game_format,
      features = EXCLUDED.features,
      version = EXCLUDED.version,
      notes = EXCLUDED.notes,
      updated_at = now();
