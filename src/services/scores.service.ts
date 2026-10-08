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

  /** ดึงคะแนนพร้อมข้อมูลนักเรียนสำหรับหน้าจัดการคะแนน */
  getScoresWithStudents: async (
    semester: string,
    academicYear: string,
    options?: { subject?: string; scoreType?: string }
  ) => {
    let q = supabase
      .from('score_records')
      .select('*, students(name, class, class_number)')
      .eq('semester', semester)
      .eq('academic_year', academicYear)
      .order('subject')
      .order('score_type');

    if (options?.subject) q = q.eq('subject', options.subject);
    if (options?.scoreType) q = q.eq('score_type', options.scoreType);

    return await q;
  },

  /** ดึงคะแนนทั้งหมดพร้อมรูปโปรไฟล์นักเรียนสำหรับสรุปรายห้อง */
  getAllScoresWithStudentProfiles: async (semester: string, academicYear: string) => {
    return await supabase
      .from('score_records')
      .select('*, students(id, name, class, class_number, photo_url)')
      .eq('semester', semester)
      .eq('academic_year', academicYear)
      .order('subject');
  },

  /**
   * Completeness helper: students missing a score row for subject/type/term.
   */
  missingForClass: async (
    studentIds: string[],
    subject: string,
    scoreType: string,
    semester: string,
    academicYear: string,
  ): Promise<string[]> => {
    if (!studentIds.length) return [];
    const { data, error } = await scoresService.getByStudentIds(
      studentIds,
      subject,
      scoreType,
      semester,
      academicYear,
    );
    if (error) throw error;
    const have = new Set(((data ?? []) as ScoreRecord[]).map((r) => r.student_id));
    return studentIds.filter((id) => !have.has(id));
  },

  /**
   * บันทึกคะแนนกลางภาคของนักเรียน 1 คนจากหน้า ปพ.6
   */
  saveMidtermScoresForStudent: async (
    studentId: string,
    academicYear: string,
    semester: string,
    scores: Array<{ subject: string; score: number; maxScore?: number; notes?: string }>,
    recordedBy: string = 'ผู้ดูแลระบบ (ระบบ ปพ.6)'
  ): Promise<void> => {
    if (!scores.length) return;
    const records: ScoreUpsert[] = scores.map((s) => ({
      student_id: studentId,
      subject: s.subject,
      score_type: 'กลางภาค',
      score: s.score,
      max_score: s.maxScore ?? 50,
      semester,
      academic_year: academicYear,
      recorded_by: recordedBy,
      notes: s.notes || 'บันทึกคะแนนผ่านระบบ ปพ.6',
      updated_at: new Date().toISOString(),
    }));

    const { error } = await scoresService.upsert(records);
    if (error) throw error;
  },

  /**
   * เติมคะแนนเฉพาะวิชาที่ยังว่างอยู่ให้กับเพื่อนร่วมชั้นทุกคน (Safe Batch Fill)
   * จะไม่แตะต้องหรือเขียนทับวิชาที่เพื่อนคนอื่นมีคะแนนอยู่แล้วเด็ดขาด
   */
  batchFillEmptySubjectsForClass: async (
    className: string,
    academicYear: string,
    semester: string,
    templateScores: Array<{ subject: string; score: number; maxScore?: number }>,
    recordedBy: string = 'ผู้ดูแลระบบ (ระบบ ปพ.6 เติมทั้งห้อง)'
  ): Promise<{ insertedCount: number; studentCount: number }> => {
    if (!templateScores.length) return { insertedCount: 0, studentCount: 0 };

    // 1. ดึงนักเรียนทั้งหมดในห้อง
    const { data: students, error: stErr } = await supabase
      .from('students')
      .select('id, name')
      .eq('class', className)
      .eq('is_active', true);

    if (stErr) throw stErr;
    if (!students || students.length === 0) return { insertedCount: 0, studentCount: 0 };

    const studentIds = students.map((s) => s.id);

    // 2. ดึงคะแนนที่มีอยู่แล้วของวิชาเหล่านี้ในเทอมและปีนั้น
    const subjectsToFill = templateScores.map((t) => t.subject);
    const { data: existingRecords, error: scErr } = await supabase
      .from('score_records')
      .select('student_id, subject')
      .eq('academic_year', academicYear)
      .eq('semester', semester)
      .eq('score_type', 'กลางภาค')
      .in('subject', subjectsToFill)
      .in('student_id', studentIds);

    if (scErr) throw scErr;

    const existingSet = new Set(
      (existingRecords ?? []).map((r) => `${r.student_id}::${r.subject}`)
    );

    // 3. กรองเฉพาะรายการที่นักเรียนคนนั้น "ยังไม่มีคะแนน"
    const newRecords: ScoreUpsert[] = [];
    const affectedStudents = new Set<string>();

    for (const student of students) {
      for (const t of templateScores) {
        const key = `${student.id}::${t.subject}`;
        if (!existingSet.has(key)) {
          newRecords.push({
            student_id: student.id,
            subject: t.subject,
            score_type: 'กลางภาค',
            score: t.score,
            max_score: t.maxScore ?? 50,
            semester,
            academic_year: academicYear,
            recorded_by: recordedBy,
            notes: 'เติมคะแนนวิชาที่ว่างให้ทั้งห้องผ่านระบบ ปพ.6',
            updated_at: new Date().toISOString(),
          });
          affectedStudents.add(student.id);
        }
      }
    }

    if (newRecords.length > 0) {
      const { error: insErr } = await scoresService.upsert(newRecords);
      if (insErr) throw insErr;
    }

    return {
      insertedCount: newRecords.length,
      studentCount: affectedStudents.size,
    };
  },
};
