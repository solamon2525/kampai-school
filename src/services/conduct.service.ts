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
  students?: { name: string; class: string; photo_url?: string | null } | null;
};

export type ConductInsert = {
  student_id: string;
  type: ConductType;
  score: number;
  category: string;
  reason: string;
  recorded_by?: string | null;
  recorded_by_staff_id?: string | null;
  recorded_by_administrator_id?: string | null;
  academic_year: string;
  semester: string;
};

export const conductService = {
  /** ดึงประวัติคะแนนความดีทั้งหมด (พร้อม join ชื่อ+รูปนักเรียน) */
  getAll: (semester?: string, academicYear?: string) => {
    let q = supabase
      .from('conduct_scores')
      .select('*, students(name, class, photo_url)')
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

  /** ดึงเฉพาะคะแนน "บวก" สำหรับหน้าสาธารณะ (hall of fame) — รวม photo_url */
  getPublicPositive: (semester?: string, academicYear?: string) => {
    let q = supabase
      .from('conduct_scores')
      .select('*, students(name, class, photo_url)')
      .eq('type', 'add')
      .order('created_at', { ascending: false });
    if (semester) q = q.eq('semester', semester);
    if (academicYear) q = q.eq('academic_year', academicYear);
    return q;
  },

  /** บันทึกคะแนนความดี */
  insert: (record: ConductInsert) =>
    supabase.from('conduct_scores').insert(record as never),

  /** บันทึกคะแนนความดีหลายคนพร้อมกัน (batch insert) */
  insertBulk: (records: ConductInsert[]) =>
    supabase.from('conduct_scores').insert(records as never[]),

  /** ลบประวัติคะแนน */
  delete: (id: string) =>
    supabase.from('conduct_scores').delete().eq('id', id),
};
