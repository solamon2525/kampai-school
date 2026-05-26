/**
 * assignments.service.ts
 * Homework portal (Migration 091).
 */
import { supabase } from '@/integrations/supabase/client';

export type Assignment = {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  class: string;
  room: string | null;
  due_date: string;
  max_score: number | null;
  attachment_url: string | null;
  created_by: string | null;
  created_at: string;
  is_archived: boolean;
};

export type AssignmentSubmission = {
  id: string;
  assignment_id: string;
  student_id: string;
  submitted_by: string | null;
  body: string | null;
  attachment_url: string | null;
  submitted_at: string;
  score: number | null;
  teacher_comment: string | null;
  graded_at: string | null;
};

export const assignmentsService = {
  /** Teacher: list assignments they created. */
  async listMine(): Promise<Assignment[]> {
    const { data: userResp } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('assignments' as any)
      .select('*')
      .eq('created_by', userResp.user?.id ?? '')
      .order('due_date', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Assignment[];
  },

  /** Admin/teacher: all assignments (filterable by class). */
  async listByClass(className?: string): Promise<Assignment[]> {
    let q = supabase
      .from('assignments' as any)
      .select('*')
      .eq('is_archived', false)
      .order('due_date', { ascending: false });
    if (className) q = q.eq('class', className);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Assignment[];
  },

  async create(a: Omit<Assignment, 'id' | 'created_at' | 'created_by' | 'is_archived'>): Promise<Assignment> {
    const { data: userResp } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('assignments' as any)
      .insert({ ...a, created_by: userResp.user?.id })
      .select('*')
      .single();
    if (error) throw error;
    return data as Assignment;
  },

  async archive(id: string): Promise<void> {
    const { error } = await supabase.from('assignments' as any).update({ is_archived: true }).eq('id', id);
    if (error) throw error;
  },

  /** Submissions for a given assignment (teacher view). */
  async listSubmissions(assignmentId: string): Promise<AssignmentSubmission[]> {
    const { data, error } = await supabase
      .from('assignment_submissions' as any)
      .select('*')
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as AssignmentSubmission[];
  },

  /** Submissions for a student (parent view, RLS filters). */
  async listForStudent(studentId: string): Promise<AssignmentSubmission[]> {
    const { data, error } = await supabase
      .from('assignment_submissions' as any)
      .select('*')
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as AssignmentSubmission[];
  },

  async submit(input: { assignment_id: string; student_id: string; body?: string; attachment_url?: string | null }): Promise<void> {
    const { data: userResp } = await supabase.auth.getUser();
    if (!userResp.user) throw new Error('Not authenticated');
    const { error } = await supabase.from('assignment_submissions' as any).upsert(
      {
        assignment_id: input.assignment_id,
        student_id: input.student_id,
        submitted_by: userResp.user.id,
        body: input.body ?? null,
        attachment_url: input.attachment_url ?? null,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'assignment_id,student_id' },
    );
    if (error) throw error;
  },

  async grade(submissionId: string, score: number, comment?: string): Promise<void> {
    const { data: userResp } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('assignment_submissions' as any)
      .update({
        score,
        teacher_comment: comment ?? null,
        graded_by: userResp.user?.id,
        graded_at: new Date().toISOString(),
      })
      .eq('id', submissionId);
    if (error) throw error;
  },
};
