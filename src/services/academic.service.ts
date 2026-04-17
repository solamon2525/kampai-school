import { supabase } from '@/integrations/supabase/client';

// ─── ตารางสอน ────────────────────────────────────────────
export const classScheduleService = {
  getAll: (academicYear: string, semester: number) =>
    supabase
      .from('class_schedules')
      .select('*, staff(name)')
      .eq('academic_year', academicYear)
      .eq('semester', semester)
      .order('day_of_week')
      .order('period'),

  insert: (data: Record<string, unknown>) =>
    supabase.from('class_schedules').insert(data),

  update: (id: string, data: Record<string, unknown>) =>
    supabase.from('class_schedules').update(data).eq('id', id),

  delete: (id: string) =>
    supabase.from('class_schedules').delete().eq('id', id),
};

// ─── แผนการจัดการเรียนรู้ ──────────────────────────────
export const lessonPlanService = {
  getAll: (academicYear: string, semester: number) =>
    supabase
      .from('lesson_plans')
      .select('*, staff(name)')
      .eq('academic_year', academicYear)
      .eq('semester', semester)
      .order('grade')
      .order('week_number'),

  insert: (data: Record<string, unknown>) =>
    supabase.from('lesson_plans').insert(data),

  update: (id: string, data: Record<string, unknown>) =>
    supabase.from('lesson_plans').update(data).eq('id', id),

  delete: (id: string) =>
    supabase.from('lesson_plans').delete().eq('id', id),
};

// ─── ทะเบียนสื่อการสอน ────────────────────────────────
export const teachingMaterialService = {
  getAll: () =>
    supabase
      .from('teaching_materials')
      .select('*')
      .order('title'),

  insert: (data: Record<string, unknown>) =>
    supabase.from('teaching_materials').insert(data),

  update: (id: string, data: Record<string, unknown>) =>
    supabase.from('teaching_materials').update(data).eq('id', id),

  delete: (id: string) =>
    supabase.from('teaching_materials').delete().eq('id', id),
};

// ─── ปฏิทินวิชาการ ────────────────────────────────────
export const academicCalendarService = {
  getAll: (academicYear: string) =>
    supabase
      .from('academic_calendar')
      .select('*')
      .eq('academic_year', academicYear)
      .order('start_date'),

  insert: (data: Record<string, unknown>) =>
    supabase.from('academic_calendar').insert(data),

  update: (id: string, data: Record<string, unknown>) =>
    supabase.from('academic_calendar').update(data).eq('id', id),

  delete: (id: string) =>
    supabase.from('academic_calendar').delete().eq('id', id),
};

// ─── นักเรียนที่ต้องการความช่วยเหลือพิเศษ ────────────
export const specialNeedsService = {
  getAll: () =>
    supabase
      .from('student_special_needs')
      .select('*, students(student_code, first_name, last_name, class_level, class_room, photo_url)')
      .order('created_at', { ascending: false }),

  insert: (data: Record<string, unknown>) =>
    supabase.from('student_special_needs').insert(data),

  update: (id: string, data: Record<string, unknown>) =>
    supabase.from('student_special_needs').update(data).eq('id', id),

  delete: (id: string) =>
    supabase.from('student_special_needs').delete().eq('id', id),
};

// ─── บันทึกการแนะแนว ──────────────────────────────────
export const counselingService = {
  getAll: () =>
    supabase
      .from('counseling_records')
      .select('*, students(student_code, first_name, last_name, class_level, class_room)')
      .order('session_date', { ascending: false }),

  insert: (data: Record<string, unknown>) =>
    supabase.from('counseling_records').insert(data),

  update: (id: string, data: Record<string, unknown>) =>
    supabase.from('counseling_records').update(data).eq('id', id),

  delete: (id: string) =>
    supabase.from('counseling_records').delete().eq('id', id),
};

// ─── บันทึกการนิเทศ ───────────────────────────────────
export const supervisionService = {
  getAll: () =>
    supabase
      .from('supervision_records')
      .select('*, staff(name)')
      .order('visit_date', { ascending: false }),

  insert: (data: Record<string, unknown>) =>
    supabase.from('supervision_records').insert(data),

  update: (id: string, data: Record<string, unknown>) =>
    supabase.from('supervision_records').update(data).eq('id', id),

  delete: (id: string) =>
    supabase.from('supervision_records').delete().eq('id', id),
};
