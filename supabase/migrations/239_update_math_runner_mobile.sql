-- 239_update_math_runner_mobile.sql
-- math-runner: บังคับเล่นแนวนอนบนมือถือ + ปุ่ม ▲▼ วิชวลสลับเลน (เฉพาะจอสัมผัส)
-- ไม่เปลี่ยน schema · บันทึก game_docs (กฎ CLAUDE.md) — append ฟีเจอร์ (idempotent)
DO $$
DECLARE
  v_staff_id UUID;
  v_url   TEXT := '/games/math/math-runner/index.html';
  v_feats TEXT[] := ARRAY[
    '📱 มือถือ: บังคับเล่นแนวนอน (จอแนวตั้ง → ขึ้นป้ายหมุนเครื่อง + หยุดเวลาชั่วคราว)',
    '🕹️ ปุ่ม ▲▼ วิชวลกดง่าย (เฉพาะจอสัมผัส) — 1 คน=ขวาล่าง · 2 คน=ซ้าย P1 / ขวา P2'
  ];
  v_f TEXT;
BEGIN
  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'staff not found'; END IF;

  UPDATE public.game_docs d
     SET version = 'v2.1.0',
         notes = 'อัป v2.1: มือถือเล่นแนวนอน + ปุ่ม ▲▼ วิชวล · ' || COALESCE(d.notes, ''),
         updated_at = now()
    FROM public.educational_hub_items i
   WHERE d.item_id = i.id AND i.owner_staff_id = v_staff_id AND i.external_url = v_url;

  FOREACH v_f IN ARRAY v_feats LOOP
    UPDATE public.game_docs d
       SET features = d.features || v_f
      FROM public.educational_hub_items i
     WHERE d.item_id = i.id AND i.owner_staff_id = v_staff_id AND i.external_url = v_url
       AND NOT (v_f = ANY(d.features));
  END LOOP;
END $$;
