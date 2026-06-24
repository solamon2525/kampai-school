-- 236_upgrade_balloon_fighter_versus.sql
-- balloon-fighter (แข่งสะกดคำบอลลูน) — อัป KampaiMatch → KampaiVersus (เพิ่มโหมด 2 คนเครื่องนี้ local hot-seat)
-- onPlay เดิม (ตั้ง gMode='online' + ใช้ rng) ใช้ได้ทั้งสองโหมด · ออนไลน์เดิมคงไว้ · ไม่เปลี่ยน schema
-- บันทึก game_docs (กฎ CLAUDE.md) — append ฟีเจอร์ + เด้งเวอร์ชัน (idempotent)
DO $$
DECLARE
  v_staff_id UUID;
  v_url  TEXT := '/games/thai/balloon-fighter/index.html';
  v_feat TEXT := '🏁 เพิ่มโหมด "2 คนเครื่องนี้" (local hot-seat จอเดียว) ผ่าน KampaiVersus — P1 จบ → ส่งเครื่อง → P2 → เทียบผู้ชนะ (ออนไลน์เดิมคงไว้)';
BEGIN
  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'staff not found'; END IF;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id, 'เกมสะกดคำ/ยิงบอลลูน (ออนไลน์ + แข่ง 2 คนเครื่องนี้)', ARRAY[v_feat], 'v1.1.0 (2P)',
         'อัป KampaiMatch→KampaiVersus: เพิ่มโหมด 2 คนเครื่องนี้ (local hot-seat)'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE SET
    features = CASE WHEN v_feat = ANY(public.game_docs.features) THEN public.game_docs.features ELSE public.game_docs.features || v_feat END,
    version  = CASE WHEN public.game_docs.version LIKE '%(2P)%' THEN public.game_docs.version ELSE public.game_docs.version || ' (2P)' END,
    notes    = 'อัป KampaiMatch→KampaiVersus: เพิ่มโหมด 2 คนเครื่องนี้ (local hot-seat) · ' || COALESCE(public.game_docs.notes, ''),
    updated_at = now();
END $$;
