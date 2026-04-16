/**
 * conduct.service.ts
 * Supabase queries สำหรับ conduct_scores table
 */
import { supabase } from '@/integrations/supabase/client';

export type ConductType = 'add' | 'deduct';

export type ConductRecord = {
  id: string;
  student_id: string;
  type: ConductType;
  score: number;
  category: string;
  reason: string;
  recorded_by: string | null;
  academic_year: string;
  semester: string;
  created_at: string;
  students?: { name: string; class: string } | null;
};

export type ConductInsert = {
  student_id: string;
  type: ConductType;
  score: number;
  category: string;
  reason: string;
  recorded_by?: string | null;
  academic_year: string;
  semester: string;
};

export const conductService = {
  /** ดึงประวัติคะแนนความดีทั้งหมด (พร้อม join ชื่อนักเรียน) */
  getAll: (semester?: string, academicYear?: string) => {
    let q = supabase
      .from('conduct_scores')
      .select('*, students(name, class)')
      .order('created_at', { ascending: false });
    if (semester) q = q.eq('semester', semester);
    if (academicYear) q = q.eq('academic_year', academicYear);
    return q;
  },

  /** ดึงคะแนนของนักเรียนคนเดียว */
  getByStudentId: (studentId: string) =>
    supabase
      .from('conduct_scores')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false }),

  /** บันทึกคะแนนความดี */
  insert: (record: ConductInsert) =>
    supabase.from('conduct_scores').insert(record as never),

  /** ลบประวัติคะแนน */
  delete: (id: string) =>
    supabase.from('conduct_scores').delete().eq('id', id),
};
