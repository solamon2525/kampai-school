-- 256: math-runner — แก้ landscape ใน iframe /play/math-runner (device orientation + parentViewport)
DO $$
DECLARE
  v_staff_id UUID;
  v_url   TEXT := '/games/math/math-runner/index.html';
  v_feat  TEXT := '📱 embed landscape: ตรวจ orientation จาก screen API + parentViewport จาก PlayGame';
BEGIN
  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'staff not found'; END IF;

  UPDATE public.game_docs d
     SET version = 'v2.3.0',
         notes = 'v2.3: แก้ overlay หมุนเครื่องค้างใน iframe — getDeviceOrientation จาก screen.orientation/screen.width · visualViewport resize · PlayGame ส่ง parentViewport + ซ่อน header · HUD แนวนอนกระชับ · ' || COALESCE(d.notes, ''),
         updated_at = now()
    FROM public.educational_hub_items i
   WHERE d.item_id = i.id AND i.owner_staff_id = v_staff_id AND i.external_url = v_url;

  UPDATE public.game_docs d
     SET features = d.features || v_feat
    FROM public.educational_hub_items i
   WHERE d.item_id = i.id AND i.owner_staff_id = v_staff_id AND i.external_url = v_url
     AND NOT (v_feat = ANY(d.features));
END $$;
