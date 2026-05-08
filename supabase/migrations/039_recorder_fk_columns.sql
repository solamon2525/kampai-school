-- Migration 039: Recorder FK columns for waste-bank, attendance, conduct
-- เพิ่ม FK ผู้บันทึก (ครู/ผอ.) ลง 3 ตารางที่บันทึก ด้วย ON DELETE SET NULL
-- เก็บ recorded_by TEXT เดิมไว้เป็น cached display name + backward compat

ALTER TABLE public.waste_transactions
  ADD COLUMN IF NOT EXISTS recorded_by_staff_id         UUID REFERENCES public.staff(id)          ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recorded_by_administrator_id UUID REFERENCES public.administrators(id) ON DELETE SET NULL;

ALTER TABLE public.attendance_records
  ADD COLUMN IF NOT EXISTS recorded_by_staff_id         UUID REFERENCES public.staff(id)          ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recorded_by_administrator_id UUID REFERENCES public.administrators(id) ON DELETE SET NULL;

ALTER TABLE public.conduct_scores
  ADD COLUMN IF NOT EXISTS recorded_by_staff_id         UUID REFERENCES public.staff(id)          ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recorded_by_administrator_id UUID REFERENCES public.administrators(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_waste_recorded_staff
  ON public.waste_transactions(recorded_by_staff_id);
CREATE INDEX IF NOT EXISTS idx_attendance_recorded_staff
  ON public.attendance_records(recorded_by_staff_id);
CREATE INDEX IF NOT EXISTS idx_conduct_recorded_staff
  ON public.conduct_scores(recorded_by_staff_id);
