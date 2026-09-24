-- 459: แผนการสอนบูรณาการ ป.4 ส่วนตัว
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.integrated_plan_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  grade text NOT NULL DEFAULT 'ป.4' CHECK (grade = 'ป.4'),
  subject_key text NOT NULL CHECK (subject_key IN ('thai','math','science','social','health','arts','career','english')),
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 180),
  essential_concept text NOT NULL DEFAULT '',
  keywords text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','taught')),
  note text,
  sort_order integer NOT NULL DEFAULT 0,
  is_custom boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX integrated_plan_topics_owner_idx ON public.integrated_plan_topics(owner_staff_id, grade, subject_key, sort_order);
CREATE UNIQUE INDEX integrated_plan_topics_seed_unique_idx
  ON public.integrated_plan_topics(owner_staff_id, subject_key, title)
  WHERE is_custom = false;

CREATE TABLE public.integrated_plan_topic_indicators (
  topic_id uuid NOT NULL REFERENCES public.integrated_plan_topics(id) ON DELETE CASCADE,
  indicator_id uuid NOT NULL REFERENCES public.curriculum_indicators(id) ON DELETE CASCADE,
  PRIMARY KEY (topic_id, indicator_id)
);

CREATE TABLE public.integrated_plan_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 180),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.integrated_plan_unit_topics (
  unit_id uuid NOT NULL REFERENCES public.integrated_plan_units(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.integrated_plan_topics(id) ON DELETE CASCADE,
  PRIMARY KEY (unit_id, topic_id)
);

CREATE TABLE public.integrated_plan_pin_settings (
  owner_staff_id uuid PRIMARY KEY REFERENCES public.staff(id) ON DELETE CASCADE,
  pin_hash text NOT NULL,
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.integrated_plan_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrated_plan_topic_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrated_plan_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrated_plan_unit_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrated_plan_pin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY integrated_topics_owner ON public.integrated_plan_topics FOR ALL
  USING (public.is_admin() OR owner_staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid()))
  WITH CHECK (public.is_admin() OR owner_staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid()));
CREATE POLICY integrated_topic_indicators_owner ON public.integrated_plan_topic_indicators FOR ALL
  USING (EXISTS (SELECT 1 FROM public.integrated_plan_topics t WHERE t.id = topic_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.integrated_plan_topics t WHERE t.id = topic_id));
CREATE POLICY integrated_units_owner ON public.integrated_plan_units FOR ALL
  USING (public.is_admin() OR owner_staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid()))
  WITH CHECK (public.is_admin() OR owner_staff_id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid()));
CREATE POLICY integrated_unit_topics_owner ON public.integrated_plan_unit_topics FOR ALL
  USING (EXISTS (SELECT 1 FROM public.integrated_plan_units u WHERE u.id = unit_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.integrated_plan_units u WHERE u.id = unit_id));

-- PIN hash ไม่เปิด SELECT ให้ client; จัดการผ่าน RPC เท่านั้น

CREATE OR REPLACE FUNCTION public.initialize_integrated_plan()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_staff uuid; v_count integer;
BEGIN
  SELECT staff_id INTO v_staff FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
  IF v_staff IS NULL AND NOT public.is_admin() THEN RAISE EXCEPTION 'staff account required'; END IF;
  IF v_staff IS NULL THEN RAISE EXCEPTION 'admin must be linked to staff'; END IF;
  IF EXISTS (SELECT 1 FROM public.integrated_plan_topics WHERE owner_staff_id = v_staff) THEN RETURN 0; END IF;

  WITH grouped AS (
    SELECT subject_key, COALESCE(standard_code, indicator_code) AS group_code,
      COALESCE(NULLIF(strand_title,''), 'หัวข้อการเรียนรู้') AS strand_title,
      string_agg(description, ' · ' ORDER BY sort_order) AS concept,
      min(sort_order) AS first_order
    FROM public.curriculum_indicators
    WHERE grade = 'ป.4' AND is_active = true
    GROUP BY subject_key, COALESCE(standard_code, indicator_code), COALESCE(NULLIF(strand_title,''), 'หัวข้อการเรียนรู้')
  ), inserted AS (
    INSERT INTO public.integrated_plan_topics(owner_staff_id, subject_key, title, essential_concept, keywords, sort_order)
    SELECT v_staff, subject_key, strand_title || ' (' || group_code || ')', concept,
      ARRAY[subject_key, strand_title, group_code], row_number() OVER (PARTITION BY subject_key ORDER BY first_order)::integer
    FROM grouped RETURNING id, subject_key, title
  )
  INSERT INTO public.integrated_plan_topic_indicators(topic_id, indicator_id)
  SELECT t.id, i.id FROM inserted t JOIN public.curriculum_indicators i
    ON i.subject_key = t.subject_key AND i.grade = 'ป.4'
    AND t.title LIKE '%(' || COALESCE(i.standard_code, i.indicator_code) || ')';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END $$;

CREATE OR REPLACE FUNCTION public.integrated_plan_pin_status()
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'has_pin', EXISTS(SELECT 1 FROM public.integrated_plan_pin_settings p JOIN public.user_roles r ON r.staff_id=p.owner_staff_id WHERE r.user_id=auth.uid()),
    'locked_until', (SELECT p.locked_until FROM public.integrated_plan_pin_settings p JOIN public.user_roles r ON r.staff_id=p.owner_staff_id WHERE r.user_id=auth.uid() LIMIT 1)
  );
$$;

CREATE OR REPLACE FUNCTION public.set_integrated_plan_pin(p_pin text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_staff uuid;
BEGIN
  IF p_pin !~ '^\d{6}$' THEN RAISE EXCEPTION 'PIN must contain 6 digits'; END IF;
  SELECT staff_id INTO v_staff FROM public.user_roles WHERE user_id=auth.uid() LIMIT 1;
  IF v_staff IS NULL THEN RAISE EXCEPTION 'staff account required'; END IF;
  INSERT INTO public.integrated_plan_pin_settings(owner_staff_id,pin_hash,failed_attempts,locked_until)
  VALUES(v_staff, crypt(p_pin, gen_salt('bf')),0,NULL)
  ON CONFLICT(owner_staff_id) DO UPDATE SET pin_hash=EXCLUDED.pin_hash,failed_attempts=0,locked_until=NULL,updated_at=now();
END $$;

CREATE OR REPLACE FUNCTION public.verify_integrated_plan_pin(p_pin text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_staff uuid; v_row public.integrated_plan_pin_settings; v_ok boolean;
BEGIN
  SELECT staff_id INTO v_staff FROM public.user_roles WHERE user_id=auth.uid() LIMIT 1;
  IF v_staff IS NULL THEN RETURN jsonb_build_object('ok',false,'reason','staff_required'); END IF;
  SELECT * INTO v_row FROM public.integrated_plan_pin_settings WHERE owner_staff_id=v_staff FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'reason','not_set'); END IF;
  IF v_row.locked_until IS NOT NULL AND v_row.locked_until > now() THEN
    RETURN jsonb_build_object('ok',false,'reason','locked','locked_until',v_row.locked_until);
  END IF;
  v_ok := v_row.pin_hash = crypt(p_pin, v_row.pin_hash);
  IF v_ok THEN
    UPDATE public.integrated_plan_pin_settings SET failed_attempts=0,locked_until=NULL,updated_at=now() WHERE owner_staff_id=v_staff;
    RETURN jsonb_build_object('ok',true);
  END IF;
  UPDATE public.integrated_plan_pin_settings SET
    failed_attempts=CASE WHEN failed_attempts >= 4 THEN 0 ELSE failed_attempts+1 END,
    locked_until=CASE WHEN failed_attempts >= 4 THEN now()+interval '15 minutes' ELSE NULL END,
    updated_at=now() WHERE owner_staff_id=v_staff;
  RETURN jsonb_build_object('ok',false,'reason',CASE WHEN v_row.failed_attempts >= 4 THEN 'locked' ELSE 'invalid' END);
END $$;

GRANT EXECUTE ON FUNCTION public.initialize_integrated_plan() TO authenticated;
GRANT EXECUTE ON FUNCTION public.integrated_plan_pin_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_integrated_plan_pin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_integrated_plan_pin(text) TO authenticated;
