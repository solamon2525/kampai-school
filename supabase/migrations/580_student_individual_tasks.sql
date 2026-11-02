-- ===============================================================
-- Migration 580: Student Individual Tasks & Missions
-- ===============================================================
-- ระบบบันทึกงานและภารกิจรายบุคคล (เลือกนักเรียน, ทำอยู่/งานค้าง/เสร็จแล้ว, ขาดไปกี่ครั้ง)

CREATE TABLE IF NOT EXISTS public.student_individual_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title text NOT NULL,                                           -- ชื่องาน/ภารกิจ
  description text,                                              -- รายละเอียดงาน
  category text NOT NULL DEFAULT 'assignment',                   -- 'assignment' (การบ้าน/ใบงาน), 'remediation' (ซ่อมเสริม), 'duty' (เวร/ภารกิจ), 'project' (โครงงาน), 'other' (อื่นๆ)
  status text NOT NULL DEFAULT 'doing',                          -- 'done' (เสร็จแล้ว), 'doing' (ทำอยู่), 'pending' (งานค้าง), 'missed' (ขาดส่ง/ขาดงาน)
  due_date date,                                                 -- วันครบกำหนด
  missed_count integer NOT NULL DEFAULT 0,                       -- ขาดไปกี่ครั้ง
  notes text,                                                    -- บันทึกเพิ่มเติม/ความเห็นครู
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,  -- ครูผู้บันทึก
  completed_at timestamptz,                                      -- วันที่งานสำเร็จ
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_indiv_tasks_student ON public.student_individual_tasks(student_id, status);
CREATE INDEX IF NOT EXISTS idx_student_indiv_tasks_due_date ON public.student_individual_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_student_indiv_tasks_created_by ON public.student_individual_tasks(created_by);

-- Enable RLS
ALTER TABLE public.student_individual_tasks ENABLE ROW LEVEL SECURITY;

-- Staff (admin and teacher) can do all CRUD operations
DROP POLICY IF EXISTS "staff_manage_individual_tasks" ON public.student_individual_tasks;
CREATE POLICY "staff_manage_individual_tasks" ON public.student_individual_tasks
  FOR ALL USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- Parents can read their own children's tasks
DROP POLICY IF EXISTS "parent_read_individual_tasks" ON public.student_individual_tasks;
CREATE POLICY "parent_read_individual_tasks" ON public.student_individual_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.parent_student_links psl
      WHERE psl.user_id = auth.uid() AND psl.student_id = student_individual_tasks.student_id
    )
  );

COMMENT ON TABLE public.student_individual_tasks IS 'Individual tasks, missions, and duty tracking per student';
