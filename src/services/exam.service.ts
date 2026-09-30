/**
 * exam.service.ts
 * Supabase service layer สำหรับระบบจัดการข้อสอบ (Exam System)
 * รองรับคลังข้อสอบ (exam_questions), ชุดข้อสอบ (exam_sets), และผลสอบ (exam_submissions)
 */
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type ExamQuestionRow = Tables<'exam_questions'>;
export type ExamSetRow = Tables<'exam_sets'>;
export type ExamSubmissionRow = Tables<'exam_submissions'>;

export type QuestionType = 'mcq' | 'truefalse' | 'fillin' | 'matching';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type BloomLevel = 'auto' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6' | 'mixed';

export interface MatchingPair {
  left: string;
  right: string;
}

export interface QuestionData {
  id?: string;
  question_text: string;
  question_type: QuestionType;
  options?: string[]; // for mcq
  answer: number | boolean | string | number[]; // 0-3 for mcq, boolean for tf, string for fillin, index mapping for matching
  pairs?: MatchingPair[]; // for matching
  explanation?: string;
  difficulty?: QuestionDifficulty;
  bloom_level?: BloomLevel;
  subject?: string;
  grade?: string;
  topic?: string;
}

export interface QuestionFilter {
  subject?: string;
  grade?: string;
  question_type?: QuestionType;
  search?: string;
}

export interface ExamSetFilter {
  subject?: string;
  grade?: string;
  is_active?: boolean;
}

export const examService = {
  // ── Questions ──────────────────────────────────────────────────────────
  async listQuestions(filters?: QuestionFilter) {
    let query = supabase
      .from('exam_questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.subject) {
      query = query.eq('subject', filters.subject);
    }
    if (filters?.grade) {
      query = query.eq('grade', filters.grade);
    }
    if (filters?.question_type) {
      query = query.eq('question_type', filters.question_type);
    }
    if (filters?.search) {
      query = query.ilike('question_text', `%${filters.search}%`);
    }

    // Support fetching up to 2000 items if no limit specified
    query = query.range(0, 1999);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as ExamQuestionRow[];
  },

  async getQuestionCountsBySubject(grade?: string): Promise<Record<string, number>> {
    // 1. Primary: Use RPC get_exam_question_counts for instant server-side aggregation
    try {
      const { data, error } = await (supabase.rpc as any)('get_exam_question_counts', {
        p_grade: grade && grade !== 'all' ? grade : null,
      });

      if (!error && Array.isArray(data)) {
        const counts: Record<string, number> = {};
        data.forEach((row: { subject: string; count: number | string }) => {
          if (row.subject) {
            counts[row.subject] = Number(row.count) || 0;
          }
        });
        return counts;
      }
    } catch {
      // Fallback below if RPC is unavailable
    }

    // 2. Fallback: Fast head count query without data payload
    const subjects = [
      'คณิตศาสตร์', 'ภาษาไทย', 'วิทยาศาสตร์', 'ภาษาอังกฤษ',
      'สังคมศึกษา', 'ประวัติศาสตร์', 'สุขศึกษา', 'ศิลปะ',
      'การงานอาชีพ', 'ต้านทุจริต'
    ];
    const counts: Record<string, number> = {};
    await Promise.all(
      subjects.map(async (subj) => {
        let q = supabase
          .from('exam_questions')
          .select('*', { count: 'exact', head: true })
          .eq('subject', subj);
        if (grade && grade !== 'all') {
          q = q.eq('grade', grade);
        }
        const { count } = await q;
        counts[subj] = count || 0;
      })
    );
    return counts;
  },

  async getQuestion(id: string) {
    const { data, error } = await supabase
      .from('exam_questions')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as ExamQuestionRow;
  },

  async createQuestion(data: TablesInsert<'exam_questions'>) {
    const { data: created, error } = await supabase
      .from('exam_questions')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return created as ExamQuestionRow;
  },

  async createQuestionsBulk(items: TablesInsert<'exam_questions'>[]) {
    if (!items.length) return [];
    const { data, error } = await supabase
      .from('exam_questions')
      .insert(items)
      .select();
    if (error) throw error;
    return (data || []) as ExamQuestionRow[];
  },

  async updateQuestion(id: string, data: TablesUpdate<'exam_questions'>) {
    const { data: updated, error } = await supabase
      .from('exam_questions')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return updated as ExamQuestionRow;
  },

  async deleteQuestion(id: string) {
    const { error } = await supabase
      .from('exam_questions')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async deleteQuestionsBulk(ids: string[]) {
    if (!ids.length) return;
    const { error } = await supabase
      .from('exam_questions')
      .delete()
      .in('id', ids);
    if (error) throw error;
  },

  // ── Exam Sets ──────────────────────────────────────────────────────────
  async listExamSets(filters?: ExamSetFilter) {
    let query = supabase
      .from('exam_sets')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.subject) {
      query = query.eq('subject', filters.subject);
    }
    if (filters?.grade) {
      query = query.eq('grade', filters.grade);
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as ExamSetRow[];
  },

  async getExamSet(id: string) {
    const { data, error } = await supabase
      .from('exam_sets')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as ExamSetRow;
  },

  async getExamSetByPin(pin: string) {
    const cleanPin = pin.trim().toUpperCase();
    const { data, error } = await supabase
      .from('exam_sets')
      .select('*')
      .ilike('pin_code', cleanPin)
      .eq('is_active', true)
      .maybeSingle();
    if (error) throw error;
    return data as ExamSetRow | null;
  },

  async createExamSet(data: TablesInsert<'exam_sets'>) {
    const { data: created, error } = await supabase
      .from('exam_sets')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return created as ExamSetRow;
  },

  async updateExamSet(id: string, data: TablesUpdate<'exam_sets'>) {
    const { data: updated, error } = await supabase
      .from('exam_sets')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return updated as ExamSetRow;
  },

  async deleteExamSet(id: string) {
    const { error } = await supabase
      .from('exam_sets')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // ── Submissions ────────────────────────────────────────────────────────
  async submitExam(data: TablesInsert<'exam_submissions'>) {
    const { data: submission, error } = await supabase
      .from('exam_submissions')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return submission as ExamSubmissionRow;
  },

  async listSubmissions(examSetId?: string) {
    let query = supabase
      .from('exam_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (examSetId) {
      query = query.eq('exam_set_id', examSetId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as ExamSubmissionRow[];
  },

  async listSubmissionsByStudent(studentId: string) {
    const { data, error } = await supabase
      .from('exam_submissions')
      .select('*, exam_sets(title, subject, grade)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async deleteSubmission(id: string) {
    const { error } = await supabase
      .from('exam_submissions')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
