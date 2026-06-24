-- 237_update_math_runner_blocks.sql
-- math-runner: ก้อนคำตอบ 4 ก้อนเป็นอิสระต่อกัน (ชนก้อนเลนเดียวกับเรา = ตอบ · ก้อนอื่นลอยผ่านไม่จาง · ตอบได้หลายก้อนต่อคำถาม)
-- ไม่เปลี่ยน schema · บันทึก game_docs (กฎ CLAUDE.md) — append ฟีเจอร์ + เด้งเวอร์ชัน (idempotent)
DO $$
DECLARE
  v_staff_id UUID;
  v_url  TEXT := '/games/math/math-runner/index.html';
  v_feat TEXT := '🟦 ก้อนคำตอบแยกอิสระ: ชนก้อนในเลนเดียวกับผู้เล่น = ตอบ (ถูก/ผิด) · ก้อนเลนอื่นลอยผ่านปกติ ไม่จางหาย · ตอบได้หลายก้อนต่อคำถาม';
BEGIN
  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'staff not found'; END IF;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id, 'เกมวิ่งเก็บคำตอบคณิต (lane runner)', ARRAY[v_feat], 'v1.1.0',
         'แก้ก้อนคำตอบให้แยกอิสระ + จอจบฝัง XP ผ่าน #kampai-result'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE SET
    features = CASE WHEN v_feat = ANY(public.game_docs.features) THEN public.game_docs.features ELSE public.game_docs.features || v_feat END,
    version  = CASE WHEN public.game_docs.version LIKE '%blocks%' THEN public.game_docs.version ELSE public.game_docs.version || ' · blocks-fix' END,
    notes    = 'แก้ก้อนคำตอบให้แยกอิสระ + จอจบฝัง XP (#kampai-result) · ' || COALESCE(public.game_docs.notes, ''),
    updated_at = now();
END $$;
