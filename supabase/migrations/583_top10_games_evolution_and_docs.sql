-- 583_top10_games_evolution_and_docs.sql
-- Consolidated game_docs & metadata registration for Top 10 Educational Games Evolution
DO $$
DECLARE
  v_staff_id UUID;
BEGIN
  SELECT id INTO v_staff_id
  FROM public.staff
  WHERE staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;

  -- 1. multiply-race
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, COALESCE(i.owner_staff_id, v_staff_id),
         'Multiplication duel — แข่งสูตรคูณ ป.2-6 แม่ 2-12',
         ARRAY[
           'ระบบ KampaiVersus 3 โหมด (เล่นเดี่ยว, 2 คนในเครื่องเดียว Hot-seat, และแข่งออนไลน์)',
           'โหมดโปรเจกเตอร์สำหรับชั้นเรียน (Classroom Projector Mode พร้อมปุ่มลัดแป้นพิมพ์ 1-4 และ Numpad)',
           'เครื่องมือสร้างใบงานสูตรคูณ A4 ในคลิกเดียว พร้อมเฉลยครู',
           'รองรับ Quality Contract, in-memory restart, :focus-visible, prefers-reduced-motion'
         ],
         'v2.0.0',
         'Top 10 Evolution: KampaiVersus 3-mode, Classroom Projector, A4 Worksheet generator and strict quality compliance'
  FROM public.educational_hub_items i
  WHERE i.game_slug = 'multiply-race' OR i.external_url = '/games/math/multiply-race.html'
  LIMIT 1
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features = EXCLUDED.features,
        version = EXCLUDED.version,
        notes = EXCLUDED.notes,
        updated_at = now();

  -- 2. math-runner
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, COALESCE(i.owner_staff_id, v_staff_id),
         'Endless runner math — วิ่งตอบสูตรคูณ 4 เลน',
         ARRAY[
           'Cognitive Pacing ตาม Rule G (เวลาคำนวณก่อนถึงประตูด่าน >= 6.2 วินาที, ความหนาแน่นบนจอ 1 จุด)',
           'ระบบเริ่มเกมด้วย 6 หัวใจ โดนชนลด -5 คะแนนแทนการ Game Over ทันที',
           'ระบบ KampaiVersus 3 โหมด (เดี่ยว, จอแยก Split-screen, และแข่งขัน 2 คน)',
           'Delta-time loop 60fps ป้องกันอาการกระตุกบนจอ High-refresh rate'
         ],
         'v2.3.0',
         'Top 10 Evolution: Cognitive pacing traversal balance, KampaiVersus, 60fps delta-time engine'
  FROM public.educational_hub_items i
  WHERE i.game_slug = 'math-runner' OR i.external_url LIKE '%/games/math/math-runner/%'
  LIMIT 1
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features = EXCLUDED.features,
        version = EXCLUDED.version,
        notes = EXCLUDED.notes,
        updated_at = now();

  -- 3. math-24
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, COALESCE(i.owner_staff_id, v_staff_id),
         'Mental math 24 puzzle — เกม 24 อัจฉริยะ',
         ARRAY[
           'คลังโจทย์ 582 ชุดที่พิสูจน์แล้วว่ามีคำตอบจริง 100% (ง่าย, ปานกลาง, และโจทย์เศษส่วนระดับปรมาจารย์)',
           'ระบบคำใบ้ 2 ระดับ (ระดับกลยุทธ์ย่อย และระดับโครงสร้างสมการเฉลย)',
           'ระบบ KampaiVersus 3 โหมด (เดี่ยว, ผลัดกันเล่น, และแข่งออนไลน์)',
           'โหมดโปรเจกเตอร์ตัวเลข 80px และระบบพิมพ์ใบงานเกม 24 A4 พร้อมเฉลย'
         ],
         'v2.0.0',
         'Top 10 Evolution: 582 verified solvable sets, hint engine, KampaiVersus, A4 worksheet'
  FROM public.educational_hub_items i
  WHERE i.game_slug = 'math-24' OR i.external_url = '/games/math/24.html'
  LIMIT 1
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features = EXCLUDED.features,
        version = EXCLUDED.version,
        notes = EXCLUDED.notes,
        updated_at = now();

  -- 4. math-jumper
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, COALESCE(i.owner_staff_id, v_staff_id),
         'Platform jumping math — กระโดดข้ามเกาะคณิตศาสตร์',
         ARRAY[
           'เลือกระดับชั้น ป.1-2 (บวก-ลบ 20/100), ป.3-4 (คูณ-หาร), ป.5-6 (ระคน multi-step)',
           'ระบบเสียงสังเคราะห์ Web Audio API เมื่อเหยียบเกาะสำเร็จ/ผิดพลาด',
           'ระบบ KampaiVersus 3 โหมด',
           'โหมดโปรเจกเตอร์สำหรับชั้นเรียน และระบบพิมพ์ใบงานกระโดดเกาะ A4'
         ],
         'v2.0.0',
         'Top 10 Evolution: Grade levels P.1-6, KampaiVersus, 16:9 PNG cover, A4 printable worksheet'
  FROM public.educational_hub_items i
  WHERE i.game_slug = 'math-jumper' OR i.external_url = '/games/math/math-jumper.html'
  LIMIT 1
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features = EXCLUDED.features,
        version = EXCLUDED.version,
        notes = EXCLUDED.notes,
        updated_at = now();

  -- 5. pizza-master-chef
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, COALESCE(i.owner_staff_id, v_staff_id),
         'Visual fraction culinary — เชฟพิซซ่าเศษส่วน',
         ARRAY[
           'Visual Equivalent Fraction feedback (ไฮไลต์เศษส่วนสมมูล เช่น 2/4 = 1/2)',
           'ระบบเสียงอบพิซซ่าและมีดตัดพิซซ่า Web Audio API',
           'ระบบ KampaiVersus 3 โหมด พร้อมระบบรายงานคะแนนเรียลไทม์ทุกการเสิร์ฟ',
           'ระบบพิมพ์ใบงานระบายสีถาดพิซซ่าเศษส่วน A4 พร้อมเฉลย'
         ],
         'v2.1.0',
         'Top 10 Evolution: Visual equivalent fractions, KampaiVersus live sync, A4 pizza coloring worksheet'
  FROM public.educational_hub_items i
  WHERE i.game_slug = 'pizza-master-chef' OR i.external_url = '/games/thai/pizza-master-chef.html'
  LIMIT 1
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features = EXCLUDED.features,
        version = EXCLUDED.version,
        notes = EXCLUDED.notes,
        updated_at = now();

  -- 6. tank-commander
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, COALESCE(i.owner_staff_id, v_staff_id),
         'Block coding tank battle — ผู้บังคับการรถถัง วิทยาการคำนวณ',
         ARRAY[
           'Visual Command Queue Stepper ไฮไลต์บล็อกคำสั่งที่กำลังทำงานแบบเรียลไทม์',
           'โหมด Step Tracing สำหรับการสอนอภิปรายในห้องเรียน',
           'ระบบประเมินประสิทธิภาพอัลกอริทึม 1-3 ดาว (Algorithm Optimization)',
           'ระบบ KampaiVersus Coding Duel 3 โหมด และใบงานการเขียนโค้ด A4'
         ],
         'v2.0.0',
         'Top 10 Evolution: Algorithm stepper, step tracing, efficiency stars, KampaiVersus coding duel'
  FROM public.educational_hub_items i
  WHERE i.game_slug = 'tank-commander' OR i.external_url = '/games/tech/tank-commander.html'
  LIMIT 1
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features = EXCLUDED.features,
        version = EXCLUDED.version,
        notes = EXCLUDED.notes,
        updated_at = now();

  -- 7. energy-rocket
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, COALESCE(i.owner_staff_id, v_staff_id),
         'AR hand tracking physics — จรวดพลังงานทดแทน',
         ARRAY[
           'การ์ดสรุปการเปลี่ยนรูปพลังงาน (แสงอาทิตย์ -> เคมี -> กล้ามเนื้อ -> จลน์)',
           'กฎการอนุรักษ์พลังงานในหน้าสรุปผล',
           'ระบบตรวจจับมือ AR กล้องหน้า พร้อมปุ่มสัมผัสขนาดใหญ่ >= 44px',
           'ระบบ KampaiVersus 3 โหมด'
         ],
         'v1.2.0',
         'Top 10 Evolution: Energy transformation science summary cards, accessible touch targets, KampaiVersus'
  FROM public.educational_hub_items i
  WHERE i.game_slug = 'energy-rocket' OR i.external_url LIKE '%/games/science/energy-rocket/%'
  LIMIT 1
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features = EXCLUDED.features,
        version = EXCLUDED.version,
        notes = EXCLUDED.notes,
        updated_at = now();

  -- 8. waste-sort
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, COALESCE(i.owner_staff_id, v_staff_id),
         'Fixed-bins sorting — แยกขยะลงถังมาตรฐาน 4 สี กรมควบคุมมลพิษ 80 ชนิด',
         ARRAY[
           'ขยะมาตรฐาน 4 สี 80 ชิ้น (เปียก, รีไซเคิล, ทั่วไป, อันตราย)',
           'เหตุผลทางสิ่งแวดล้อมและวิทยาศาสตร์ประกอบทุกรายการ',
           'ระบบ KampaiVersus 3 โหมด',
           'ใบงานพิมพ์ A4 และโหมดโปรเจกเตอร์'
         ],
         'v2.0.0',
         'Top 10 Evolution: 80 authentic PCD waste items, rationale tooltips, KampaiVersus, A4 worksheet'
  FROM public.educational_hub_items i
  WHERE i.game_slug = 'waste-sort' OR i.external_url = '/games/career/waste-sort.html'
  LIMIT 1
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features = EXCLUDED.features,
        version = EXCLUDED.version,
        notes = EXCLUDED.notes,
        updated_at = now();

  -- 9. vocab-race
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, COALESCE(i.owner_staff_id, v_staff_id),
         'Speed vocabulary race — แข่งคำศัพท์ภาษาอังกฤษ',
         ARRAY[
           'ระบบออกเสียงคำศัพท์ Native Web Speech API English TTS พร้อมสวิตช์เปิด/ปิด',
           'คลังคำศัพท์ 140+ คำใน 12 หมวดหมู่ตรงตามหลักสูตร',
           'ระบบ KampaiVersus 3 โหมด',
           'ใบงานจับคู่คำศัพท์และ Word Search A4 พร้อมเฉลย'
         ],
         'v2.0.0',
         'Top 10 Evolution: Web Speech API TTS, 140+ words, KampaiVersus, A4 printable worksheet'
  FROM public.educational_hub_items i
  WHERE i.game_slug = 'vocab-race' OR i.external_url = '/games/english/vocab-race.html'
  LIMIT 1
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features = EXCLUDED.features,
        version = EXCLUDED.version,
        notes = EXCLUDED.notes,
        updated_at = now();

  -- 10. spelling
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, COALESCE(i.owner_staff_id, v_staff_id),
         'Space shooter orthography — เขียนไทยให้ถูก',
         ARRAY[
           'คลังคำ 342 คู่คำที่มักเขียนผิดตามเกณฑ์ สพฐ. 10 หมวดหมู่',
           'ป๊อปอัปเฉลยเทียบเคียงคำถูกและคำผิดแบบ Side-by-side',
           'ระบบ KampaiVersus 3 โหมด',
           'ใบงานเขียนตามคำบอก A4 พร้อมเฉลยครู และภาพปก 16:9'
         ],
         'v2.0.0',
         'Top 10 Evolution: 342 OBEC misspelled word pairs, side-by-side correction toast, KampaiVersus, A4 worksheet'
  FROM public.educational_hub_items i
  WHERE i.game_slug = 'spelling' OR i.external_url = '/games/thai/spelling.html'
  LIMIT 1
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features = EXCLUDED.features,
        version = EXCLUDED.version,
        notes = EXCLUDED.notes,
        updated_at = now();

END $$;
