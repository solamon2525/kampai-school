-- 238_update_math_runner_v2.sql
-- math-runner v2: ค่าเริ่มต้น Mix · ความยาก (ง่ายมาก/ง่าย/ยาก) มีผลจริง · ขยายระบบหัวใจ + ไอเทมใหม่
-- ไม่เปลี่ยน schema · บันทึก game_docs (กฎ CLAUDE.md) — append ฟีเจอร์ + เด้งเวอร์ชัน (idempotent)
DO $$
DECLARE
  v_staff_id UUID;
  v_url   TEXT := '/games/math/math-runner/index.html';
  v_feats TEXT[] := ARRAY[
    '⚙️ ค่าเริ่มต้น: เครื่องหมาย "Mix" (สุ่ม +−×÷) + ความยาก "ง่าย"',
    '🏔️ ความยากมีผลจริง: ง่ายมาก (เลขน้อย/ช้า/ไม่มีมอนสเตอร์/ตอบผิดไม่เสียหัวใจ) · ง่าย (ไล่ระดับตามคะแนน) · ยาก (เลขใหญ่/หาตัวแปร ?×B=Ans/เร็ว/ตอบผิดเสียหัวใจ)',
    '❤️ ระบบหัวใจขยาย: สูงสุด 5 ดวง · คอมโบครบ 8 → ได้หัวใจ · ตอบผิด/ชนมอนสเตอร์ = เสียหัวใจ · มีหัวใจทั้งโหมดผจญภัย + แข่งเวลา · ไอเทม 1-UP 🍀',
    '🎁 ไอเทมใหม่: ✖️2 คะแนนคูณสอง · 🧲 แม่เหล็กดูดไอเทม/เหรียญเข้าเลน · 💣 ระเบิดเคลียร์มอนสเตอร์ทั้งจอ'
  ];
  v_f TEXT;
BEGIN
  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'staff not found'; END IF;

  -- insert minimal ถ้ายังไม่มี
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id, 'เกมวิ่งเก็บคำตอบคณิต (lane runner)', v_feats, 'v2.0.0',
         'อัป v2: Mix default + ความยากใช้งานจริง + ขยายหัวใจ/ไอเทม'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE SET version = 'v2.0.0',
    notes = 'อัป v2: Mix default + ความยากใช้งานจริง + ขยายหัวใจ/ไอเทม · ' || COALESCE(public.game_docs.notes, ''),
    updated_at = now();

  -- append เฉพาะฟีเจอร์ที่ยังไม่มี (idempotent)
  FOREACH v_f IN ARRAY v_feats LOOP
    UPDATE public.game_docs d
       SET features = d.features || v_f
      FROM public.educational_hub_items i
     WHERE d.item_id = i.id AND i.owner_staff_id = v_staff_id AND i.external_url = v_url
       AND NOT (v_f = ANY(d.features));
  END LOOP;
END $$;
