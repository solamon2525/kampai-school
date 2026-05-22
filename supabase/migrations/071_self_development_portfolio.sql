-- ============================================================================
-- Migration 071: Self-Development Portfolio Support
-- Expand training_records & meetings with photos and owner staff_id, and
-- update RLS policies for shared-inspiration view mode.
-- ============================================================================

-- ─── 1. Expand training_records Table ───────────────────────────────────────
ALTER TABLE public.training_records
  ADD COLUMN IF NOT EXISTS activity_photos JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS certificate_gen_id UUID REFERENCES public.doc_template_generations(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.training_records.activity_photos IS 'อาร์เรย์ URL รูปภาพบรรยากาศการเข้าร่วมการอบรม';
COMMENT ON COLUMN public.training_records.certificate_gen_id IS 'คีย์เชื่อมโยงไปยังรหัสการออกเกียรติบัตรระบบโรงเรียน';

-- ─── 2. Expand meetings Table ──────────────────────────────────────────────
ALTER TABLE public.meetings
  ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.meetings.staff_id IS 'คีย์เชื่อมโยงครูผู้จดบันทึก/ผู้รับผิดชอบการประชุม';
COMMENT ON COLUMN public.meetings.photos IS 'อาร์เรย์ URL รูปภาพบรรยากาศตอนประชุม';

-- ─── 3. Recreate RLS Policies for Shared-Inspiration View Mode ─────────────

-- DROP existing narrow admin policies
DROP POLICY IF EXISTS "admin_manage_training_records" ON public.training_records;
DROP POLICY IF EXISTS "Auth manage training_records" ON public.training_records;

-- NEW policies for training_records
-- SELECT: All logged-in staff can see all records (Shared Inspiration Mode)
CREATE POLICY "authenticated_select_training_records"
  ON public.training_records FOR SELECT
  USING (auth.role() = 'authenticated');

-- INSERT: Admins, or Teachers setting their own staff_id
CREATE POLICY "staff_insert_training_records"
  ON public.training_records FOR INSERT
  WITH CHECK (
    public.is_admin() OR 
    (public.is_teacher() AND staff_id = (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1))
  );

-- UPDATE: Admins, or Teachers updating their own staff_id records
CREATE POLICY "staff_update_training_records"
  ON public.training_records FOR UPDATE
  USING (
    public.is_admin() OR 
    (public.is_teacher() AND staff_id = (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1))
  )
  WITH CHECK (
    public.is_admin() OR 
    (public.is_teacher() AND staff_id = (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1))
  );

-- DELETE: Admins, or Teachers deleting their own records
CREATE POLICY "staff_delete_training_records"
  ON public.training_records FOR DELETE
  USING (
    public.is_admin() OR 
    (public.is_teacher() AND staff_id = (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1))
  );


-- DROP existing narrow meetings policies
DROP POLICY IF EXISTS "admin_manage_meetings" ON public.meetings;
DROP POLICY IF EXISTS "Auth manage meetings" ON public.meetings;

-- NEW policies for meetings
-- SELECT: All logged-in staff can see all records
CREATE POLICY "authenticated_select_meetings"
  ON public.meetings FOR SELECT
  USING (auth.role() = 'authenticated');

-- INSERT: Admins, or Teachers setting their own staff_id
CREATE POLICY "staff_insert_meetings"
  ON public.meetings FOR INSERT
  WITH CHECK (
    public.is_admin() OR 
    (public.is_teacher() AND staff_id = (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1))
  );

-- UPDATE: Admins, or Teachers updating their own records
CREATE POLICY "staff_update_meetings"
  ON public.meetings FOR UPDATE
  USING (
    public.is_admin() OR 
    (public.is_teacher() AND staff_id = (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1))
  )
  WITH CHECK (
    public.is_admin() OR 
    (public.is_teacher() AND staff_id = (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1))
  );

-- DELETE: Admins, or Teachers deleting their own records
CREATE POLICY "staff_delete_meetings"
  ON public.meetings FOR DELETE
  USING (
    public.is_admin() OR 
    (public.is_teacher() AND staff_id = (SELECT staff_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1))
  );
