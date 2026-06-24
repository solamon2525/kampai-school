-- 233_update_3d_cluster_versus.sql
-- กลุ่มเกม 3 มิติ (Three.js MCQ): block-3d, coord-3d, net-3d, solid-3d, globe-3d
-- เพิ่มโหมดแข่ง 2 คน ผ่านเฟรมเวิร์ก KampaiVersus (เดี่ยว + local hot-seat + online delegate kampai-match)
-- ไม่เปลี่ยน schema · โหมดเดี่ยว (แข่งเวลา/ฝึก) คงเดิม · บันทึก game_docs + เด้งเวอร์ชัน (กฎ CLAUDE.md)
-- Idempotent: re-run ได้ (UPSERT game_docs)
DO $$
DECLARE
  v_staff_id UUID;
  v_common   TEXT[] := ARRAY[
    'โหมดเดี่ยว: ⚡ แข่งเวลา (จับเวลา/ชีวิต/คอมโบ) · 📚 ฝึก',
    '🏁 แข่ง 2 คน ผ่าน KampaiVersus: 2 คนเครื่องนี้ (local hot-seat จอเดียว — P1 จบ → ส่งเครื่อง → P2 → เทียบผู้ชนะ) + ออนไลน์ต่างเครื่อง',
    'ความยุติธรรม: ทั้งสองตา/ทุกเครื่องใช้ seed เดียวกัน (qrand) → โจทย์ตรงกัน · เลือกคู่แข่ง P2 จากรายชื่อห้อง (เก็บสถิติแชมป์) หรือเล่นเร็วไม่ระบุชื่อ',
    'หมุนดูโมเดล 3 มิติ (Three.js) รอบด้าน + ผูก KAMPAI SDK (คะแนน/XP/Leaderboard) + เสียง'
  ];
  v_note TEXT := 'เพิ่มโหมดแข่ง 2 คน (KampaiVersus: เดี่ยว + local hot-seat + online) — reuse /games/kampai-versus.js · โหมดเดี่ยวคงเดิม';
BEGIN
  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'staff not found'; END IF;

  -- helper: upsert 1 เกม (topic = ฟีเจอร์บรรทัดแรกเฉพาะเกม)
  -- block-3d
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id, 'เกมคณิต 3 มิติ (MCQ) — นับลูกบาศก์ปริมาตร + อ่านเศษส่วนจากบล็อกสีทอง · เดี่ยว + แข่ง 2 คน',
         ARRAY['วิชาคณิตศาสตร์ ป.4-6 ปริมาตร (นับลูกบาศก์) + เศษส่วน M/N จากแถวบล็อก'] || v_common, 'v1.1.0', v_note
  FROM public.educational_hub_items i WHERE i.owner_staff_id = v_staff_id AND i.external_url = '/games/math/block-3d.html'
  ON CONFLICT (item_id) DO UPDATE SET game_format=EXCLUDED.game_format, features=EXCLUDED.features, version=EXCLUDED.version, notes=EXCLUDED.notes, updated_at=now();

  -- coord-3d
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id, 'เกมคณิต 3 มิติ (MCQ) — อ่านพิกัด (x, y, z) ของจุดในปริภูมิ 3 มิติ · เดี่ยว + แข่ง 2 คน',
         ARRAY['วิชาคณิตศาสตร์ ป.5-6/ม.ต้น พิกัดในปริภูมิสามมิติ (x, y, z)'] || v_common, 'v1.1.0', v_note
  FROM public.educational_hub_items i WHERE i.owner_staff_id = v_staff_id AND i.external_url = '/games/math/coord-3d.html'
  ON CONFLICT (item_id) DO UPDATE SET game_format=EXCLUDED.game_format, features=EXCLUDED.features, version=EXCLUDED.version, notes=EXCLUDED.notes, updated_at=now();

  -- net-3d
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id, 'เกมคณิต 3 มิติ (MCQ) — จับคู่รูปคลี่ (net) กับรูปทรงสามมิติ · เดี่ยว + แข่ง 2 คน',
         ARRAY['วิชาคณิตศาสตร์ ป.4-6 รูปคลี่ของรูปทรงเรขาคณิต (ลูกบาศก์/พีระมิด/ปริซึม)'] || v_common, 'v1.1.0', v_note
  FROM public.educational_hub_items i WHERE i.owner_staff_id = v_staff_id AND i.external_url = '/games/math/net-3d.html'
  ON CONFLICT (item_id) DO UPDATE SET game_format=EXCLUDED.game_format, features=EXCLUDED.features, version=EXCLUDED.version, notes=EXCLUDED.notes, updated_at=now();

  -- solid-3d
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id, 'เกมคณิต 3 มิติ (MCQ) — นับหน้า/ขอบ/มุม ของรูปทรงสามมิติ · เดี่ยว + แข่ง 2 คน',
         ARRAY['วิชาคณิตศาสตร์ ป.4-6 รูปทรงเรขาคณิตสามมิติ (หน้า ขอบ จุดยอด)'] || v_common, 'v1.1.0', v_note
  FROM public.educational_hub_items i WHERE i.owner_staff_id = v_staff_id AND i.external_url = '/games/math/solid-3d.html'
  ON CONFLICT (item_id) DO UPDATE SET game_format=EXCLUDED.game_format, features=EXCLUDED.features, version=EXCLUDED.version, notes=EXCLUDED.notes, updated_at=now();

  -- globe-3d
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id, 'เกมภูมิศาสตร์ 3 มิติ (MCQ) — หมุนลูกโลกหาทวีป/ประเทศ · เดี่ยว + แข่ง 2 คน',
         ARRAY['วิชาสังคม/ภูมิศาสตร์ ป.4-6 ทวีป มหาสมุทร และตำแหน่งบนลูกโลก'] || v_common, 'v1.1.0', v_note
  FROM public.educational_hub_items i WHERE i.owner_staff_id = v_staff_id AND i.external_url = '/games/social/globe-3d.html'
  ON CONFLICT (item_id) DO UPDATE SET game_format=EXCLUDED.game_format, features=EXCLUDED.features, version=EXCLUDED.version, notes=EXCLUDED.notes, updated_at=now();
END $$;
