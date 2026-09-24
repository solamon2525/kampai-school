-- 460: pgcrypto is installed in schema extensions on hosted Supabase.
-- Keep the SECURITY DEFINER search_path narrow and qualify crypto functions explicitly.
CREATE OR REPLACE FUNCTION public.set_integrated_plan_pin(p_pin text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_staff uuid;
BEGIN
  IF p_pin !~ '^\d{6}$' THEN RAISE EXCEPTION 'PIN must contain 6 digits'; END IF;
  SELECT staff_id INTO v_staff FROM public.user_roles WHERE user_id=auth.uid() LIMIT 1;
  IF v_staff IS NULL THEN RAISE EXCEPTION 'staff account required'; END IF;
  INSERT INTO public.integrated_plan_pin_settings(owner_staff_id,pin_hash,failed_attempts,locked_until)
  VALUES(v_staff, extensions.crypt(p_pin, extensions.gen_salt('bf')),0,NULL)
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
  v_ok := v_row.pin_hash = extensions.crypt(p_pin, v_row.pin_hash);
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

GRANT EXECUTE ON FUNCTION public.set_integrated_plan_pin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_integrated_plan_pin(text) TO authenticated;
