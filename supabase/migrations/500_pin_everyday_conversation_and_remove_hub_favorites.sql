-- Migration 500: pin Everyday Conversation first and ensure its 16:9 cover is used
DO $$
DECLARE
  v_item_id UUID;
  v_owner_staff_id UUID;
  v_category_id UUID;
  v_first_pin_order INTEGER;
BEGIN
  SELECT id, owner_staff_id, category_id
  INTO v_item_id, v_owner_staff_id, v_category_id
  FROM public.educational_hub_items
  WHERE external_url = '/games/english/everyday-conversation-p4-media.html'
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'everyday conversation media item not found; apply migration 496 first';
  END IF;

  SELECT COALESCE(MIN(library_pin_order), 10) - 10
  INTO v_first_pin_order
  FROM public.educational_hub_items
  WHERE owner_staff_id = v_owner_staff_id
    AND category_id = v_category_id
    AND library_pinned = true
    AND id <> v_item_id;

  UPDATE public.educational_hub_items
  SET thumbnail_url = '/games/english/everyday-conversation-p4-media-cover.png',
      library_pinned = true,
      library_pin_order = v_first_pin_order,
      updated_at = now()
  WHERE id = v_item_id;

  UPDATE public.game_docs
  SET version = 'v1.2.1',
      notes = 'ใช้ปก Everyday Conversation 16:9 และปักไว้ลำดับแรกของหมวดสื่อการสอน; หน้าคลังใช้ระบบปักหมุดส่วนกลางแทนรายการโปรดบนเครื่อง',
      updated_at = now()
  WHERE item_id = v_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'game_docs not found for everyday conversation media';
  END IF;
END $$;
