-- 229_update_blocky_safari_online.sql
-- Blocky Safari v3.0.0 — เพิ่มโหมดออนไลน์แข่งต่างเครื่อง + แมคคานิก "ตอบถูก = ป่วนคู่แข่ง"
-- (เพิ่มความเร็วไล่ล่า + เกิดสัตว์ดุพิเศษให้คู่แข่ง). ไม่เปลี่ยน schema — อัปเดต game_docs + เด้งเวอร์ชัน
-- Idempotent: re-run ได้ (UPSERT game_docs)
DO $$
DECLARE
  v_staff_id UUID;
  v_url      TEXT := '/games/science/blocky-safari/index.html';
BEGIN
  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'staff not found'; END IF;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'เกมยิงจำแนกกลุ่มสัตว์ 3D (Three.js) — เล่นเดี่ยวสะสมข้าม 3 ด่าน + โหมดออนไลน์แข่งต่างเครื่อง (KampaiMatch)',
         ARRAY[
           'วิชาวิทยาศาสตร์ ป.4 การจำแนกกลุ่มสัตว์ (เลี้ยงลูกด้วยนม/ปีก/เลื้อยคลาน/สะเทินน้ำสะเทินบก/ปลา) — ยิงเก็บเฉพาะกลุ่มเป้าหมาย',
           '🌐 โหมดออนไลน์แข่งต่างเครื่อง: สร้าง/เข้าห้องด้วยรหัส 4 หลัก แข่งตามเวลา ตอบถูกมากสุดชนะ (ใช้ KampaiMatch — lobby/นับถอยหลัง/แถบคะแนนสด/จัดอันดับ)',
           'แมคคานิกแข่งขัน "ตอบถูก = ป่วนคู่แข่ง": ทุกครั้งที่เราเก็บสัตว์ถูก → โลกของคู่แข่งจะ "เพิ่มความเร็วการไล่ล่า" + "เกิดสัตว์ดุพิเศษ" รอบตัว (ตัวคูณค่อย ๆ ลดกลับ)',
           'โลกแข่งใช้ seed เดียวกันทุกเครื่อง (รหัสห้อง + เลขด่าน) → เป้าหมาย/สัตว์/ตำแหน่งเหมือนกัน ยุติธรรม',
           'ระบบยิง 3D + สัตว์ป่าไล่ล่า + 5 หัวใจ (โหมดเดี่ยวจบเมื่อหัวใจหมด · โหมดออนไลน์เติมหัวใจต่อจนหมดเวลา) · ผูก KAMPAI SDK (คะแนน/XP/Leaderboard)',
           'จูนความแรง sabotage + เวลาแมตช์ได้ที่ config.js (SAB_CHASE_PER_HIT / SAB_CHASE_MAX / SAB_DECAY_SEC / SAB_SPAWN_PER_HIT / ONLINE_DURATION)'
         ],
         'v3.0.0',
         'เพิ่มโหมดออนไลน์แข่ง + sabotage (ตอบถูกป่วนคู่แข่ง: เร่งไล่ล่า + เกิดสัตว์ดุ) — โหมดเดี่ยวคงเดิม (reuse kampai-match.js)'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format, features = EXCLUDED.features,
        version = EXCLUDED.version, notes = EXCLUDED.notes, updated_at = now();
END $$;
