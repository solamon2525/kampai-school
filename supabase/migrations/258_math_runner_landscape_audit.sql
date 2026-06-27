-- 258: math-runner — audit fix (canvas local size, inIframe ping, parent poll)
DO $$
DECLARE
  v_staff_id UUID;
  v_url   TEXT := '/games/math/math-runner/index.html';
  v_feat  TEXT := '📱 embed v2.1: canvas ใช้ iframe size · ping 10s · parent poll ตลอดเล่น';
BEGIN
  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'staff not found'; END IF;

  UPDATE public.game_docs d
     SET version = 'v2.3.2',
         notes = 'v2.3.2: audit — canvas/touch ใช้ขนาด iframe ไม่ใช้ parent · inIframe vs embed=1 แยกกัน · poll orientation ตลอด · ' || COALESCE(d.notes, ''),
         updated_at = now()
    FROM public.educational_hub_items i
   WHERE d.item_id = i.id AND i.owner_staff_id = v_staff_id AND i.external_url = v_url;

  UPDATE public.game_docs d
     SET features = d.features || v_feat
    FROM public.educational_hub_items i
   WHERE d.item_id = i.id AND i.owner_staff_id = v_staff_id AND i.external_url = v_url
     AND NOT (v_feat = ANY(d.features));
END $$;
