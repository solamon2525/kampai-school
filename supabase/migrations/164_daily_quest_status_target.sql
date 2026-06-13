-- 164_daily_quest_status_target.sql
-- get_daily_quest_status คืน target_points/target_xp (ค่าโบนัสเป้าหมายจาก config)
-- เพื่อให้ DailyQuestPanel โชว์ "รับ +N แต้ม" ตรงค่าจริงก่อนทำครบ (เดิม hardcode 50)

CREATE OR REPLACE FUNCTION public.get_daily_quest_status(p_student_code text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
  v_student_id uuid;
  v_today      date := (now() AT TIME ZONE 'Asia/Bangkok')::date;
  v_subjects   jsonb;
  v_required   int;
  v_completed  int;
  v_day        public.daily_quest_days%ROWTYPE;
  v_total_pts  int;
  v_target_pts int;
  v_target_xp  int;
BEGIN
  SELECT id INTO v_student_id FROM public.students
   WHERE student_code = p_student_code AND COALESCE(is_active, true) = true;
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'student_not_found' USING ERRCODE = 'P0001';
  END IF;

  SELECT
    jsonb_agg(jsonb_build_object(
      'key',   s.subject_key,
      'label', s.label_th,
      'icon',  s.icon,
      'done',  c.subject_key IS NOT NULL,
      'score', c.score
    ) ORDER BY s.sort_order),
    count(*),
    count(c.subject_key)
  INTO v_subjects, v_required, v_completed
  FROM public.daily_quest_subjects s
  LEFT JOIN public.daily_quest_completions c
    ON c.subject_key = s.subject_key
   AND c.student_id  = v_student_id
   AND c.challenge_date = v_today
  WHERE s.is_active = true;

  SELECT * INTO v_day FROM public.daily_quest_days
   WHERE student_id = v_student_id AND challenge_date = v_today;

  SELECT COALESCE(SUM(bonus_points), 0) INTO v_total_pts
   FROM public.daily_quest_days WHERE student_id = v_student_id;

  SELECT all_complete_points, all_complete_xp INTO v_target_pts, v_target_xp
   FROM public.daily_quest_config WHERE id = true;

  RETURN jsonb_build_object(
    'subjects',        COALESCE(v_subjects, '[]'::jsonb),
    'completed_count', COALESCE(v_completed, 0),
    'required_count',  COALESCE(v_required, 0),
    'all_complete',    COALESCE(v_day.all_complete, false),
    'bonus_points',    COALESCE(v_day.bonus_points, 0),
    'bonus_xp',        COALESCE(v_day.bonus_xp, 0),
    'streak_days',     COALESCE(v_day.streak_days, 0),
    'total_points',    v_total_pts,
    'target_points',   COALESCE(v_target_pts, 0),
    'target_xp',       COALESCE(v_target_xp, 0)
  );
END;
$function$;
