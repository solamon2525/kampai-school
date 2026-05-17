-- ============================================================================
-- Migration 060: Student Meal Budget + Phase 4G cleanup
-- ============================================================================
-- - student_meal_budget table (อุดหนุนอาหาร/นม รายเด็ก ต่อภาคเรียน)
-- - Cleanup student_documents rows ใน category ที่ซ้ำกับ source of truth
-- - Update doc_category_meta.students label เป็น "ภาพรวมนักเรียน 360°"
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.student_meal_budget (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  academic_year   INTEGER NOT NULL,
  period          TEXT NOT NULL CHECK (period IN ('ภาคเรียน 1','ภาคเรียน 2','รวมปี')),
  meal_subsidy    NUMERIC(10,2) DEFAULT 0,
  milk_subsidy    NUMERIC(10,2) DEFAULT 0,
  notes           TEXT,
  recorded_by     UUID,
  recorded_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, academic_year, period)
);

CREATE INDEX IF NOT EXISTS idx_meal_budget_student ON public.student_meal_budget(student_id, academic_year);

ALTER TABLE public.student_meal_budget ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_manage_meal_budget"
  ON public.student_meal_budget FOR ALL
  USING (public.is_teacher()) WITH CHECK (public.is_teacher());

-- Cleanup: ลบ rows ที่ซ้ำกับ source of truth (registry=students, transcript=score_records, support=counseling/special_needs)
DELETE FROM public.student_documents
WHERE category_key IN ('registry','transcript','support');

-- Update Hub category label
UPDATE public.doc_category_meta
SET label = 'ภาพรวมนักเรียน 360°',
    description = 'โปรไฟล์ + คะแนน + เช็คชื่อ + เยี่ยมบ้าน + SDQ + ไฟล์แนบ'
WHERE key = 'students';
