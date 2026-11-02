/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * assignments.service.ts
 * Homework portal (Migration 091).
 */
import { supabase } from '@/integrations/supabase/client';
import { studentsService, type StudentMin } from '@/services/students.service';

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

export type StudentSubmissionItem = {
  assignment_id: string;
  assignment_title: string;
  subject: string | null;
  due_date: string;
  max_score: number | null;
  attachment_url: string | null;
  is_submitted: boolean;
  is_overdue: boolean;
  submission_id: string | null;
  submitted_at: string | null;
  score: number | null;
  teacher_comment: string | null;
  graded_at: string | null;
  body: string | null;
};

export type StudentClassSummary = {
  student_id: string;
  student_code: string | null;
  name: string;
  class: string;
  room: string | null;
  class_number: number | null;
  photo_url: string | null;
  total_assignments: number;
  submitted_count: number;
  graded_count: number;
  overdue_count: number;
  upcoming_count: number;
  total_score: number;
  max_possible_score: number;
  submission_rate: number;
  items: StudentSubmissionItem[];
};

export type ClassSubmissionOverview = {
  class_name: string;
  room: string | null;
  assignments: Assignment[];
  students: StudentClassSummary[];
  total_students: number;
  total_assignments: number;
  total_expected_submissions: number;
  total_actual_submissions: number;
  total_overdue: number;
  overall_rate: number;
};

export type TeacherMiniOverview = {
  active_assignments_count: number;
  classes: string[];
  total_overdue: number;
  total_submitted: number;
  total_expected: number;
  overall_rate: number;
  pending_grade_count: number;
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
    const cleanName = file.name.replace(/[^\w.-]+/g, '_');
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

  /** Phase 16 ops: homework loop activity in last N days */
  opsSummary: async (
    sinceDays = 30,
  ): Promise<{ sinceDays: number; assignments: number; submissions: number; withAttachment: number }> => {
    const since = new Date();
    since.setDate(since.getDate() - sinceDays);
    const sinceIso = since.toISOString();

    const [assignRes, subRes, attachRes] = await Promise.all([
      supabase
        .from('assignments' as any)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sinceIso)
        .eq('is_archived', false),
      supabase
        .from('assignment_submissions' as any)
        .select('*', { count: 'exact', head: true })
        .gte('submitted_at', sinceIso),
      supabase
        .from('assignment_submissions' as any)
        .select('*', { count: 'exact', head: true })
        .gte('submitted_at', sinceIso)
        .not('attachment_url', 'is', null),
    ]);
    if (assignRes.error) throw assignRes.error;
    if (subRes.error) throw subRes.error;
    if (attachRes.error) throw attachRes.error;

    return {
      sinceDays,
      assignments: assignRes.count ?? 0,
      submissions: subRes.count ?? 0,
      withAttachment: attachRes.count ?? 0,
    };
  },

  // ════════════════════════════════════════════════════════════════════════════
  // Teacher Direct Recording & Quick Tracking (Phase: Online History & Mini Tracker)
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * ครูบันทึกการส่งงานของนักเรียนโดยตรง (Upsert ลงใน assignment_submissions)
   */
  async recordStudentSubmission(input: {
    assignment_id: string;
    student_id: string;
    score?: number | null;
    teacher_comment?: string | null;
    body?: string | null;
    attachment_url?: string | null;
  }): Promise<void> {
    const { data: userResp } = await supabase.auth.getUser();
    const now = new Date().toISOString();
    const payload: any = {
      assignment_id: input.assignment_id,
      student_id: input.student_id,
      submitted_by: userResp.user?.id ?? null,
      body: input.body ?? 'บันทึกโดยครูในชั้นเรียน',
      attachment_url: input.attachment_url ?? null,
      submitted_at: now,
    };
    if (input.score !== undefined) {
      payload.score = input.score;
      payload.graded_at = input.score != null ? now : null;
      payload.graded_by = input.score != null ? userResp.user?.id ?? null : null;
    }
    if (input.teacher_comment !== undefined) {
      payload.teacher_comment = input.teacher_comment;
    }

    const { error } = await supabase
      .from('assignment_submissions' as any)
      .upsert(payload, { onConflict: 'assignment_id,student_id' });
    if (error) throw error;
  },

  /**
   * ยกเลิกรายการส่งงาน (ลบ record ออก)
   */
  async removeStudentSubmission(assignment_id: string, student_id: string): Promise<void> {
    const { error } = await supabase
      .from('assignment_submissions' as any)
      .delete()
      .eq('assignment_id', assignment_id)
      .eq('student_id', student_id);
    if (error) throw error;
  },

  /**
   * 1-Click Toggle ส่งแล้ว ↔ ยังไม่ส่ง
   */
  async toggleStudentSubmission(
    assignment_id: string,
    student_id: string,
    currentSubmitted: boolean,
    defaultScore?: number | null,
  ): Promise<boolean> {
    if (currentSubmitted) {
      await this.removeStudentSubmission(assignment_id, student_id);
      return false;
    } else {
      await this.recordStudentSubmission({
        assignment_id,
        student_id,
        score: defaultScore ?? null,
        body: 'ส่งงานในชั้นเรียน',
      });
      return true;
    }
  },

  /**
   * บันทึกการส่งงานเป็นกลุ่ม (Batch Record)
   */
  async batchRecordSubmissions(
    assignment_id: string,
    records: Array<{ student_id: string; score?: number | null; comment?: string | null }>,
  ): Promise<void> {
    const { data: userResp } = await supabase.auth.getUser();
    const now = new Date().toISOString();
    const rows = records.map((r) => ({
      assignment_id,
      student_id: r.student_id,
      submitted_by: userResp.user?.id ?? null,
      body: 'บันทึกโดยครูในชั้นเรียน',
      submitted_at: now,
      score: r.score ?? null,
      teacher_comment: r.comment ?? null,
      graded_at: r.score != null ? now : null,
      graded_by: r.score != null ? userResp.user?.id ?? null : null,
    }));
    const { error } = await supabase
      .from('assignment_submissions' as any)
      .upsert(rows, { onConflict: 'assignment_id,student_id' });
    if (error) throw error;
  },

  /**
   * สรุปภาพรวมการส่งงานของทั้งห้องเรียน (Class Overview)
   * ดึงนักเรียนในห้อง + ชิ้นงานที่มอบหมาย + ประมวลผลสถานะงานค้างและส่งแล้ว
   */
  async getClassSubmissionSummary(className: string, room?: string | null): Promise<ClassSubmissionOverview> {
    // 1. ดึงชิ้นงานทั้งหมดของชั้นเรียนนี้
    const assignments = await this.listByClass(className);
    const activeAssignments = room
      ? assignments.filter((a) => !a.room || a.room === room)
      : assignments;

    // 2. ดึงนักเรียนในห้อง
    const stResp = await studentsService.getByClass(className);
    const rawStudents: StudentMin[] = stResp.data ?? [];
    const studentsList = room
      ? rawStudents.filter((s) => !s.room || s.room === room)
      : rawStudents;

    if (!studentsList.length || !activeAssignments.length) {
      return {
        class_name: className,
        room: room ?? null,
        assignments: activeAssignments,
        students: [],
        total_students: studentsList.length,
        total_assignments: activeAssignments.length,
        total_expected_submissions: studentsList.length * activeAssignments.length,
        total_actual_submissions: 0,
        total_overdue: 0,
        overall_rate: 0,
      };
    }

    // 3. ดึง Submissions ทั้งหมดสำหรับชิ้นงานเหล่านี้
    const assignmentIds = activeAssignments.map((a) => a.id);
    const { data: subData, error: subErr } = await supabase
      .from('assignment_submissions' as any)
      .select('*')
      .in('assignment_id', assignmentIds);
    if (subErr) throw subErr;

    const subList = (subData ?? []) as AssignmentSubmission[];
    // Map: `${assignment_id}:${student_id}` -> submission
    const subMap = new Map<string, AssignmentSubmission>();
    subList.forEach((s) => subMap.set(`${s.assignment_id}:${s.student_id}`, s));

    const todayStr = new Date().toISOString().split('T')[0];

    // 4. ประกอบข้อมูลรายนักเรียน
    let totalActualSubmissions = 0;
    let totalOverdue = 0;

    const studentSummaries: StudentClassSummary[] = studentsList.map((st) => {
      let submittedCount = 0;
      let gradedCount = 0;
      let overdueCount = 0;
      let upcomingCount = 0;
      let totalScore = 0;
      let maxPossible = 0;

      const items: StudentSubmissionItem[] = activeAssignments.map((a) => {
        const sub = subMap.get(`${a.id}:${st.id}`);
        const isSubmitted = !!sub;
        const isOverdue = !isSubmitted && a.due_date < todayStr;
        const isUpcoming = !isSubmitted && a.due_date >= todayStr;

        if (isSubmitted) {
          submittedCount++;
          if (sub.score != null) {
            gradedCount++;
            totalScore += Number(sub.score);
          }
        }
        if (isOverdue) overdueCount++;
        if (isUpcoming) upcomingCount++;
        if (a.max_score != null) {
          maxPossible += Number(a.max_score);
        }

        return {
          assignment_id: a.id,
          assignment_title: a.title,
          subject: a.subject,
          due_date: a.due_date,
          max_score: a.max_score,
          attachment_url: a.attachment_url,
          is_submitted: isSubmitted,
          is_overdue: isOverdue,
          submission_id: sub?.id ?? null,
          submitted_at: sub?.submitted_at ?? null,
          score: sub?.score != null ? Number(sub.score) : null,
          teacher_comment: sub?.teacher_comment ?? null,
          graded_at: sub?.graded_at ?? null,
          body: sub?.body ?? null,
        };
      });

      totalActualSubmissions += submittedCount;
      totalOverdue += overdueCount;

      const rate = activeAssignments.length > 0
        ? Math.round((submittedCount / activeAssignments.length) * 100)
        : 0;

      return {
        student_id: st.id,
        student_code: st.student_code,
        name: st.name,
        class: st.class,
        room: st.room ?? null,
        class_number: st.class_number,
        photo_url: st.photo_url,
        total_assignments: activeAssignments.length,
        submitted_count: submittedCount,
        graded_count: gradedCount,
        overdue_count: overdueCount,
        upcoming_count: upcomingCount,
        total_score: totalScore,
        max_possible_score: maxPossible,
        submission_rate: rate,
        items,
      };
    });

    const totalExpected = studentsList.length * activeAssignments.length;
    const overallRate = totalExpected > 0 ? Math.round((totalActualSubmissions / totalExpected) * 100) : 0;

    return {
      class_name: className,
      room: room ?? null,
      assignments: activeAssignments,
      students: studentSummaries,
      total_students: studentsList.length,
      total_assignments: activeAssignments.length,
      total_expected_submissions: totalExpected,
      total_actual_submissions: totalActualSubmissions,
      total_overdue: totalOverdue,
      overall_rate: overallRate,
    };
  },

  /**
   * ดึงประวัติการส่งงานทั้งหมดของนักเรียน 1 คน
   */
  async getStudentAssignmentHistory(studentId: string): Promise<{
    student: StudentMin | null;
    items: StudentSubmissionItem[];
    submitted_count: number;
    overdue_count: number;
    upcoming_count: number;
    total_assignments: number;
    total_score: number;
    max_possible_score: number;
  }> {
    // 1. ดึงข้อมูลนักเรียน
    const { data: stData } = await supabase
      .from('students')
      .select('id, name, class, room, class_number, photo_url, student_code, gender')
      .eq('id', studentId)
      .maybeSingle();

    if (!stData) {
      return {
        student: null,
        items: [],
        submitted_count: 0,
        overdue_count: 0,
        upcoming_count: 0,
        total_assignments: 0,
        total_score: 0,
        max_possible_score: 0,
      };
    }

    const student = stData as StudentMin;

    // 2. ดึงชิ้นงานทั้งหมดสำหรับชั้นนี้
    const assignments = await this.listByClass(student.class);
    const activeAssignments = student.room
      ? assignments.filter((a) => !a.room || a.room === student.room)
      : assignments;

    if (!activeAssignments.length) {
      return {
        student,
        items: [],
        submitted_count: 0,
        overdue_count: 0,
        upcoming_count: 0,
        total_assignments: 0,
        total_score: 0,
        max_possible_score: 0,
      };
    }

    // 3. ดึง Submissions ของนักเรียนคนนี้
    const { data: subData } = await supabase
      .from('assignment_submissions' as any)
      .select('*')
      .eq('student_id', studentId)
      .in('assignment_id', activeAssignments.map((a) => a.id));

    const subList = (subData ?? []) as AssignmentSubmission[];
    const subMap = new Map<string, AssignmentSubmission>(subList.map((s) => [s.assignment_id, s]));

    const todayStr = new Date().toISOString().split('T')[0];
    let submittedCount = 0;
    let overdueCount = 0;
    let upcomingCount = 0;
    let totalScore = 0;
    let maxPossible = 0;

    const items: StudentSubmissionItem[] = activeAssignments.map((a) => {
      const sub = subMap.get(a.id);
      const isSubmitted = !!sub;
      const isOverdue = !isSubmitted && a.due_date < todayStr;
      const isUpcoming = !isSubmitted && a.due_date >= todayStr;

      if (isSubmitted) {
        submittedCount++;
        if (sub.score != null) totalScore += Number(sub.score);
      }
      if (isOverdue) overdueCount++;
      if (isUpcoming) upcomingCount++;
      if (a.max_score != null) maxPossible += Number(a.max_score);

      return {
        assignment_id: a.id,
        assignment_title: a.title,
        subject: a.subject,
        due_date: a.due_date,
        max_score: a.max_score,
        attachment_url: a.attachment_url,
        is_submitted: isSubmitted,
        is_overdue: isOverdue,
        submission_id: sub?.id ?? null,
        submitted_at: sub?.submitted_at ?? null,
        score: sub?.score != null ? Number(sub.score) : null,
        teacher_comment: sub?.teacher_comment ?? null,
        graded_at: sub?.graded_at ?? null,
        body: sub?.body ?? null,
      };
    });

    return {
      student,
      items,
      submitted_count: submittedCount,
      overdue_count: overdueCount,
      upcoming_count: upcomingCount,
      total_assignments: activeAssignments.length,
      total_score: totalScore,
      max_possible_score: maxPossible,
    };
  },

  /**
   * สรุปตัวเลขด่วนสำหรับวิดเจ็ตแบบย่อส่วน (Teacher Mini Overview)
   */
  async getTeacherMiniOverview(): Promise<TeacherMiniOverview> {
    const mine = await this.listMine();
    const active = mine.filter((a) => !a.is_archived);
    const classes = Array.from(new Set(active.map((a) => a.class))).filter(Boolean);

    if (!active.length) {
      return {
        active_assignments_count: 0,
        classes: [],
        total_overdue: 0,
        total_submitted: 0,
        total_expected: 0,
        overall_rate: 0,
        pending_grade_count: 0,
      };
    }

    const assignmentIds = active.map((a) => a.id);
    const [subRes, pendingGrade] = await Promise.all([
      supabase
        .from('assignment_submissions' as any)
        .select('id, assignment_id, score, graded_at')
        .in('assignment_id', assignmentIds),
      this.countPendingGrading(),
    ]);

    const subs = (subRes.data ?? []) as { id: string; assignment_id: string; score: number | null; graded_at: string | null }[];
    const totalSubmitted = subs.length;

    // Estimate overdue
    const todayStr = new Date().toISOString().split('T')[0];
    const overdueAssignments = active.filter((a) => a.due_date < todayStr);

    return {
      active_assignments_count: active.length,
      classes,
      total_overdue: overdueAssignments.length,
      total_submitted: totalSubmitted,
      total_expected: active.length * 20, // baseline estimate
      overall_rate: totalSubmitted > 0 ? Math.min(100, Math.round((totalSubmitted / Math.max(1, active.length * 20)) * 100)) : 0,
      pending_grade_count: pendingGrade.pending,
    };
  },
};
