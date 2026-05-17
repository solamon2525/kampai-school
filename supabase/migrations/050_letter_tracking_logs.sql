-- ============================================================================
-- Migration 050: Letter Tracking Logs
-- ============================================================================
-- 1) letter_tracking_logs — บันทึก timeline ทุก status change
-- 2) Triggers บน incoming/outgoing/leave → auto-log
-- 3) RPC add_tracking_note สำหรับเพิ่ม note manually
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.letter_tracking_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type  TEXT NOT NULL CHECK (entity_type IN ('incoming','outgoing','order','meeting','leave')),
  entity_id    UUID NOT NULL,
  from_status  TEXT,
  to_status    TEXT NOT NULL,
  actor_id     UUID,
  actor_name   TEXT,
  note         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracking_entity
  ON public.letter_tracking_logs(entity_type, entity_id, created_at DESC);

ALTER TABLE public.letter_tracking_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_letter_tracking_logs"
  ON public.letter_tracking_logs FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "teacher_read_letter_tracking_logs"
  ON public.letter_tracking_logs FOR SELECT USING (public.is_teacher());

-- Trigger function: log status change
CREATE OR REPLACE FUNCTION public.log_letter_status_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_entity TEXT;
  v_old TEXT;
  v_new TEXT;
  v_actor_id UUID := auth.uid();
  v_actor_name TEXT;
BEGIN
  v_entity := TG_ARGV[0];
  IF TG_OP = 'INSERT' THEN v_old := NULL; v_new := NEW.status;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old := OLD.status; v_new := NEW.status;
    IF v_old IS NOT DISTINCT FROM v_new THEN RETURN NEW; END IF;
  END IF;

  IF v_actor_id IS NOT NULL THEN
    SELECT name INTO v_actor_name FROM public.staff
      WHERE id IN (SELECT staff_id FROM public.user_roles WHERE user_id = v_actor_id LIMIT 1)
      LIMIT 1;
  END IF;

  INSERT INTO public.letter_tracking_logs (entity_type, entity_id, from_status, to_status, actor_id, actor_name)
  VALUES (v_entity, NEW.id, v_old, v_new, v_actor_id, v_actor_name);
  RETURN NEW;
END $$;

CREATE TRIGGER trg_incoming_status_change
  AFTER INSERT OR UPDATE OF status ON public.incoming_letters
  FOR EACH ROW EXECUTE FUNCTION public.log_letter_status_change('incoming');

CREATE TRIGGER trg_outgoing_status_change
  AFTER INSERT OR UPDATE OF status ON public.outgoing_letters
  FOR EACH ROW EXECUTE FUNCTION public.log_letter_status_change('outgoing');

CREATE TRIGGER trg_leave_status_change
  AFTER INSERT OR UPDATE OF status ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.log_letter_status_change('leave');

-- RPC: เพิ่ม note manually
CREATE OR REPLACE FUNCTION public.add_tracking_note(
  p_entity_type TEXT, p_entity_id UUID, p_note TEXT
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id UUID;
  v_actor_name TEXT;
BEGIN
  IF NOT public.is_teacher() THEN
    RAISE EXCEPTION 'ไม่มีสิทธิ์เพิ่ม note';
  END IF;
  SELECT name INTO v_actor_name FROM public.staff
    WHERE id IN (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1)
    LIMIT 1;

  INSERT INTO public.letter_tracking_logs (entity_type, entity_id, from_status, to_status, actor_id, actor_name, note)
  VALUES (p_entity_type, p_entity_id, NULL, 'note', auth.uid(), v_actor_name, p_note)
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

GRANT EXECUTE ON FUNCTION public.add_tracking_note(TEXT, UUID, TEXT) TO authenticated;
