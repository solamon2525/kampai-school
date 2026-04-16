/**
 * scores.service.ts
 * Supabase queries สำหรับ score_records table
 */
import { supabase } from '@/integrations/supabase/client';

export type ScoreRecord = {
  id: string;
  student_id: string;
  subject: string;
  score_type: string;
  score: number;
  max_score: number;
  semester: string;
  academic_year: string;
  recorded_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ScoreUpsert = {
  id?: string;
  student_id: string;
  subject: string;
  score_type: string;
  score: number;
  max_score: number;
  semester: string;
  academic_year: string;
  recorded_by?: string | null;
  notes?: string | null;
  updated_at?: string;
};

export const scoresService = {
  /** ดึงคะแนนของนักเรียนหลายคนตามวิชา/ประเภท/ภาคเรียน */
  getByStudentIds: (
    studentIds: string[],
    subject: string,
    scoreType: string,
    semester: string,
    academicYear: string,
  ) =>
    supabase
      .from('score_records')
      .select('*')
      .eq('subject', subject)
      .eq('score_type', scoreType)
      .eq('semester', semester)
      .eq('academic_year', academicYear)
      .in('student_id', studentIds),

  /** ดึงคะแนนทั้งหมดของนักเรียนคนหนึ่ง */
  getByStudentId: (studentId: string, semester?: string, academicYear?: string) => {
    let q = supabase.from('score_records').select('*').eq('student_id', studentId);
    if (semester) q = q.eq('semester', semester);
    if (academicYear) q = q.eq('academic_year', academicYear);
    return q.order('subject');
  },

  /** ดึงสรุปคะแนนทุกวิชา ทุกนักเรียนในห้อง (ภาคเรียน/ปีที่กำหนด) */
  getByAcademicPeriod: (semester: string, academicYear: string) =>
    supabase
      .from('score_records')
      .select('student_id, subject, score_type, score, max_score')
      .eq('semester', semester)
      .eq('academic_year', academicYear),

  /** upsert คะแนน (onConflict: student_id, subject, score_type, semester, academic_year) */
  upsert: (records: ScoreUpsert[]) =>
    supabase
      .from('score_records')
      .upsert(records as never[], { onConflict: 'student_id,subject,score_type,semester,academic_year' }),

  /** ลบคะแนน */
  delete: (id: string) =>
    supabase.from('score_records').delete().eq('id', id),
};
