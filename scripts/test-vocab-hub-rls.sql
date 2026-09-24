-- Run with the database verification connection. All writes are rolled back.
BEGIN;
DO $$
DECLARE
  actor record;
  affected integer;
  can_write boolean;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role::text = 'admin')
    OR NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role::text = 'teacher') THEN
    RAISE EXCEPTION 'Admin and teacher fixtures are required';
  END IF;
  FOR actor IN
    SELECT 'admin' AS label, user_id FROM public.user_roles WHERE role::text = 'admin'
    UNION ALL SELECT 'teacher', user_id FROM public.user_roles WHERE role::text = 'teacher'
    UNION ALL SELECT 'student-no-admin-role', '00000000-0000-4000-8000-000000000001'::uuid
    UNION ALL SELECT 'anonymous', NULL::uuid
  LOOP
    PERFORM set_config('request.jwt.claim.sub', COALESCE(actor.user_id::text, ''), true);
    IF actor.label = 'anonymous' THEN EXECUTE 'SET LOCAL ROLE anon';
    ELSE EXECUTE 'SET LOCAL ROLE authenticated'; END IF;
    SELECT count(*) INTO affected FROM public.school_settings
      WHERE key = 'vocab_hub_category_order' AND jsonb_array_length(value::jsonb) = 29;
    IF affected <> 1 THEN RAISE EXCEPTION '% cannot read valid category order', actor.label; END IF;
    UPDATE public.school_settings SET value = value WHERE key = 'vocab_hub_category_order';
    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected <> (CASE WHEN actor.label = 'admin' THEN 1 ELSE 0 END) THEN
      RAISE EXCEPTION 'Unexpected UPDATE permission: % (%)', actor.label, affected;
    END IF;
    can_write := false;
    BEGIN
      INSERT INTO public.school_settings(key, value) VALUES ('vocab_hub_category_order', '[]')
      ON CONFLICT (key) DO UPDATE SET value = public.school_settings.value;
      can_write := true;
    EXCEPTION WHEN insufficient_privilege THEN can_write := false;
    END;
    IF can_write <> (actor.label = 'admin') THEN RAISE EXCEPTION 'Unexpected UPSERT permission: %', actor.label; END IF;
    EXECUTE 'RESET ROLE';
  END LOOP;
END $$;
ROLLBACK;
