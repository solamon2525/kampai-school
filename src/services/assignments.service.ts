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

  /**
   * Graded submissions + assignment attachment — match pack worksheet URLs on parent worksheets.
   */
  async listGradedWithAssignment(studentId: string): Promise<
    Array<
      AssignmentSubmission & {
        assignments: Pick<Assignment, 'id' | 'title' | 'attachment_url' | 'max_score'> | null;
      }
    >
  > {
    const { data, error } = await supabase
      .from('assignment_submissions' as any)
      .select('*, assignments:assignment_id(id, title, attachment_url, max_score)')
      .eq('student_id', studentId)
      .not('graded_at', 'is', null)
      .order('graded_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Array<
      AssignmentSubmission & {
        assignments: Pick<Assignment, 'id' | 'title' | 'attachment_url' | 'max_score'> | null;
      }
    >;
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

    // Best-effort push to assignment creator (teacher)
    try {
      const { data: asg } = await supabase
        .from('assignments' as any)
        .select('title, created_by')
        .eq('id', input.assignment_id)
        .maybeSingle();
      const row = asg as { title?: string; created_by?: string | null } | null;
      if (row?.created_by) {
        await supabase.functions
          .invoke('send-push', {
            body: {
              user_ids: [row.created_by],
              topic: 'homework',
              title: 'มีงานส่งใหม่',
              body: row.title || 'ผู้ปกครองส่งงานแล้ว',
              url: '/teacher/assignments',
              tag: `homework-submit-${input.assignment_id}-${input.student_id}`,
            },
          })
          .catch(() => {});
      }
    } catch {
      // Non-fatal
    }
  },

  /** Upload student work photo/PDF for parent homework submit. */
  async uploadAttachment(file: File): Promise<string> {
    const { data: userResp } = await supabase.auth.getUser();
    if (!userResp.user) throw new Error('Not authenticated');
    const cleanName = file.name.replace(/[^\w.\-]+/g, '_');
    const path = `${userResp.user.id}/${Date.now()}_${crypto.randomUUID().slice(0, 8)}_${cleanName}`;
    const { error: upErr } = await supabase.storage.from('assignment-attachments').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    });
    if (upErr) throw upErr;
    const { data: signed, error: signErr } = await supabase.storage
      .from('assignment-attachments')
      .createSignedUrl(path, 60 * 60 * 24 * 14);
    if (signErr || !signed?.signedUrl) throw signErr ?? new Error('ไม่สามารถสร้างลิงก์ไฟล์ได้');
    return signed.signedUrl;
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

  /** Teacher cadence: submissions awaiting grade across own assignments. */
  async countPendingGrading(): Promise<{ pending: number; firstAssignmentId: string | null }> {
    const mine = await assignmentsService.listMine();
    const active = mine.filter((a) => !a.is_archived);
    if (!active.length) return { pending: 0, firstAssignmentId: null };
    const ids = active.map((a) => a.id);
    const { data, error } = await supabase
      .from('assignment_submissions' as any)
      .select('id, assignment_id')
      .in('assignment_id', ids)
      .is('graded_at', null);
    if (error) throw error;
    const rows = (data ?? []) as { id: string; assignment_id: string }[];
    return {
      pending: rows.length,
      firstAssignmentId: rows[0]?.assignment_id ?? null,
    };
  },
};
