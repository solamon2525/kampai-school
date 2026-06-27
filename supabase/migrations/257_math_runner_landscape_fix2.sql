-- 257: math-runner — แก้ orientation ค้าง (screen.width ไม่สลับบน iOS + parentViewport ping)
DO $$
DECLARE
  v_staff_id UUID;
  v_url   TEXT := '/games/math/math-runner/index.html';
  v_feat  TEXT := '📱 embed v2: parentViewport ping + ไม่ใช้ screen.height>width ใน iframe';
BEGIN
  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'staff not found'; END IF;

  UPDATE public.game_docs d
     SET version = 'v2.3.1',
         notes = 'v2.3.1: แก้ overlay ค้างหลังหมุน — embed เชื่อ parentViewport/matchMedia/innerWidth แทน screen.width · ping parent · ' || COALESCE(d.notes, ''),
         updated_at = now()
    FROM public.educational_hub_items i
   WHERE d.item_id = i.id AND i.owner_staff_id = v_staff_id AND i.external_url = v_url;

  UPDATE public.game_docs d
     SET features = d.features || v_feat
    FROM public.educational_hub_items i
   WHERE d.item_id = i.id AND i.owner_staff_id = v_staff_id AND i.external_url = v_url
     AND NOT (v_feat = ANY(d.features));
END $$;
