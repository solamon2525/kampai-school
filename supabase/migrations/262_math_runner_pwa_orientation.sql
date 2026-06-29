-- 262: math-runner — PWA manifest orientation any (ปลดล็อกหมุนแนวนอน)
DO $$
DECLARE
  v_staff_id UUID;
  v_url   TEXT := '/games/math/math-runner/index.html';
  v_feat  TEXT := '📱 PWA manifest orientation:any — ปลดล็อกหมุนแนวนอนบนมือถือ';
BEGIN
  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'staff not found'; END IF;

  UPDATE public.game_docs d
     SET version = 'v2.5.0',
         notes = 'v2.5: แก้มือถือหมุนไม่ได้ — PWA manifest portrait→any · getParentLandscape ใช้ visualViewport · lock landscape ตอน gameStart · ' || COALESCE(d.notes, ''),
         updated_at = now()
    FROM public.educational_hub_items i
   WHERE d.item_id = i.id AND i.owner_staff_id = v_staff_id AND i.external_url = v_url;

  UPDATE public.game_docs d
     SET features = d.features || v_feat
    FROM public.educational_hub_items i
   WHERE d.item_id = i.id AND i.owner_staff_id = v_staff_id AND i.external_url = v_url
     AND NOT (v_feat = ANY(d.features));
END $$;
