-- 386_multiply_race_dashboard_photo_url.sql
-- เพิ่ม photo_url ให้ dashboard multiply-race เพื่อใช้ PersonAvatar คู่ชื่อนักเรียน

DROP FUNCTION IF EXISTS public.get_multiply_race_class_overview(text);

CREATE OR REPLACE FUNCTION public.get_multiply_race_class_overview(
  p_class_filter text DEFAULT NULL
)
RETURNS TABLE (
  student_id uuid,
  student_code text,
  display_name text,
  photo_url text,
  class_label text,
  total_correct int,
  total_wrong int,
  badge_bronze int,
  badge_silver int,
  badge_gold int,
  weakest_table int,
  last_played_at timestamptz,
  daily_played_today boolean,
  daily_score_today int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := public.bkk_today();
BEGIN
  RETURN QUERY
    SELECT
      s.id AS student_id,
      s.student_code,
      s.name AS display_name,
      s.photo_url,
      s."class" AS class_label,
      COALESCE(SUM(m.correct_count), 0)::int AS total_correct,
      COALESCE(SUM(m.wrong_count), 0)::int AS total_wrong,
      COUNT(*) FILTER (WHERE m.badge_level >= 1)::int AS badge_bronze,
      COUNT(*) FILTER (WHERE m.badge_level >= 2)::int AS badge_silver,
      COUNT(*) FILTER (WHERE m.badge_level >= 3)::int AS badge_gold,
      (SELECT m2.table_num FROM public.multiply_race_mastery m2
        WHERE m2.student_id = s.id AND m2.wrong_count > 0
        ORDER BY m2.wrong_count DESC LIMIT 1) AS weakest_table,
      MAX(m.last_practiced_at) AS last_played_at,
      EXISTS(SELECT 1 FROM public.daily_challenge_scores d
        WHERE d.student_id = s.id AND d.game_slug = 'multiply-race' AND d.challenge_date = v_today) AS daily_played_today,
      COALESCE((SELECT d.score FROM public.daily_challenge_scores d
        WHERE d.student_id = s.id AND d.game_slug = 'multiply-race' AND d.challenge_date = v_today), 0) AS daily_score_today
    FROM public.students s
    LEFT JOIN public.multiply_race_mastery m ON m.student_id = s.id
    WHERE COALESCE(s.is_active, true) = true
      AND (p_class_filter IS NULL OR s."class" = p_class_filter)
    GROUP BY s.id, s.student_code, s.name, s.photo_url, s."class"
    HAVING COALESCE(SUM(m.correct_count + m.wrong_count), 0) > 0
        OR EXISTS(SELECT 1 FROM public.daily_challenge_scores d
              WHERE d.student_id = s.id AND d.game_slug = 'multiply-race' AND d.challenge_date = v_today)
    ORDER BY badge_gold DESC, badge_silver DESC, badge_bronze DESC, total_correct DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_multiply_race_class_overview(text) TO authenticated;

-- game_docs sync: รอบนี้แก้ lifecycle/daily URL/versus mastery/dashboard avatar
DO $docs$
DECLARE
  v_staff_id UUID;
  v_url TEXT := '/games/math/multiply-race.html';
BEGIN
  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE NOTICE 'staff multiply-race owner not found — skip game_docs'; RETURN; END IF;

  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         'ตอบคำถามสูตรคูณ (quiz) — เดี่ยว + ออนไลน์ + 2 คนจอเดียว',
         ARRAY[
           'แข่งเร็ว/ไม่จำกัด/ฝึกแม่/ชาเลนจ์วันนี้',
           'Daily Challenge ใช้ seed รายวันและกันเล่นซ้ำจาก wrapper data',
           'Adaptive per-table mastery + ตราเก่งแม่สูตรคูณ',
           'โหมดออนไลน์ผ่าน KampaiMatch',
           'โหมด 2 คน split-screen บน PC (P1 ลูกศร / P2 WASD) + จอยแพด',
           'บันทึก mastery จาก local versus ทั้ง P1/P2',
           'จอจบรองรับ KAMPAI result slot'
         ],
         'v1.1.1',
         'แก้ daily URL autostart ให้รอ wrapper data, เพิ่ม KAMPAI.beginRound/result slot, sync mastery จาก local versus และเพิ่ม photo_url dashboard สำหรับ PersonAvatar'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
END $docs$;
