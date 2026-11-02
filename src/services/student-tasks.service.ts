/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * student-tasks.service.ts
 * บริการจัดการงานและภารกิจรายบุคคล (Individual Student Tasks & Missions)
 * รองรับ: ทำอยู่ / งานค้าง / สำเร็จแล้ว / ขาดไปกี่ครั้ง (Migration 580)
 */
import { supabase } from '@/integrations/supabase/client';
import { studentsService, type StudentMin } from '@/services/students.service';

export type TaskStatus = 'done' | 'doing' | 'pending' | 'missed';

export type TaskCategory = 'assignment' | 'remediation' | 'duty' | 'project' | 'other';

export const TASK_STATUS_META: Record<
  TaskStatus,
  { label: string; badgeCls: string; dotCls: string; icon: string }
> = {
  done: {
    label: 'สำเร็จแล้ว',
    badgeCls: 'bg-emerald-500/15 text-emerald-700 border-emerald-300',
    dotCls: 'bg-emerald-500',
    icon: 'CheckCircle2',
  },
  doing: {
    label: 'ทำอยู่',
    badgeCls: 'bg-amber-500/15 text-amber-700 border-amber-300',
    dotCls: 'bg-amber-500',
    icon: 'Clock',
  },
  pending: {
    label: 'งานค้าง',
    badgeCls: 'bg-orange-500/15 text-orange-700 border-orange-300',
    dotCls: 'bg-orange-500',
    icon: 'AlertTriangle',
  },
  missed: {
    label: 'ขาดส่ง/ขาดงาน',
    badgeCls: 'bg-rose-500/15 text-rose-700 border-rose-300',
    dotCls: 'bg-rose-500',
    icon: 'XCircle',
  },
};

export const TASK_CATEGORIES: Array<{ key: TaskCategory; label: string; emoji: string }> = [
  { key: 'assignment', label: 'การบ้าน/ใบงาน', emoji: '📝' },
  { key: 'remediation', label: 'ซ่อมเสริม/แก้คะแนน', emoji: '🎯' },
  { key: 'duty', label: 'เวร/ภารกิจห้องเรียน', emoji: '🧹' },
  { key: 'project', label: 'โครงงาน/ชิ้นงาน', emoji: '🔬' },
  { key: 'other', label: 'อื่นๆ/ทั่วไป', emoji: '📌' },
];

export type StudentIndividualTask = {
  id: string;
  student_id: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  status: TaskStatus;
  due_date: string | null;
  missed_count: number;
  notes: string | null;
  created_by: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateTaskInput = {
  student_id: string;
  title: string;
  description?: string | null;
  category?: TaskCategory;
  status?: TaskStatus;
  due_date?: string | null;
  missed_count?: number;
  notes?: string | null;
};

export type StudentTasksSummary = {
  student_id: string;
  student_name: string;
  student_code: string | null;
  class: string;
  room: string | null;
  class_number: number | null;
  photo_url: string | null;
  total_tasks: number;
  done_count: number;
  doing_count: number;
  pending_count: number;
  missed_count: number; // total missed count (accumulated)
  tasks: StudentIndividualTask[];
};

export const studentTasksService = {
  /**
   * ดึงรายการภารกิจทั้งหมดของนักเรียน 1 คน
   */
  async listByStudent(studentId: string): Promise<StudentIndividualTask[]> {
    const { data, error } = await supabase
      .from('student_individual_tasks' as any)
      .select('*')
      .eq('student_id', studentId)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as StudentIndividualTask[];
  },

  /**
   * เพิ่มภารกิจใหม่ให้นักเรียน
   */
  async create(input: CreateTaskInput): Promise<StudentIndividualTask> {
    const { data: userResp } = await supabase.auth.getUser();
    const payload = {
      student_id: input.student_id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      category: input.category || 'assignment',
      status: input.status || 'doing',
      due_date: input.due_date || null,
      missed_count: Math.max(0, input.missed_count || 0),
      notes: input.notes?.trim() || null,
      created_by: userResp.user?.id || null,
      completed_at: input.status === 'done' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('student_individual_tasks' as any)
      .insert(payload)
      .select('*')
      .single();
    if (error) throw error;
    return data as StudentIndividualTask;
  },

  /**
   * มอบหมายภารกิจแบบกลุ่มให้นักเรียนหลายคนพร้อมกัน
   */
  async batchCreate(
    studentIds: string[],
    taskData: Omit<CreateTaskInput, 'student_id'>,
  ): Promise<void> {
    if (!studentIds.length) return;
    const { data: userResp } = await supabase.auth.getUser();
    const now = new Date().toISOString();
    const rows = studentIds.map((sid) => ({
      student_id: sid,
      title: taskData.title.trim(),
      description: taskData.description?.trim() || null,
      category: taskData.category || 'assignment',
      status: taskData.status || 'doing',
      due_date: taskData.due_date || null,
      missed_count: Math.max(0, taskData.missed_count || 0),
      notes: taskData.notes?.trim() || null,
      created_by: userResp.user?.id || null,
      completed_at: taskData.status === 'done' ? now : null,
      updated_at: now,
    }));

    const { error } = await supabase
      .from('student_individual_tasks' as any)
      .insert(rows);
    if (error) throw error;
  },

  /**
   * อัปเดตข้อมูลภารกิจ
   */
  async update(id: string, updates: Partial<CreateTaskInput>): Promise<void> {
    const payload: any = {
      updated_at: new Date().toISOString(),
    };
    if (updates.title !== undefined) payload.title = updates.title.trim();
    if (updates.description !== undefined) payload.description = updates.description?.trim() || null;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.due_date !== undefined) payload.due_date = updates.due_date || null;
    if (updates.notes !== undefined) payload.notes = updates.notes?.trim() || null;
    if (updates.missed_count !== undefined) payload.missed_count = Math.max(0, updates.missed_count);
    if (updates.status !== undefined) {
      payload.status = updates.status;
      if (updates.status === 'done') {
        payload.completed_at = new Date().toISOString();
      } else {
        payload.completed_at = null;
      }
    }

    const { error } = await supabase
      .from('student_individual_tasks' as any)
      .update(payload)
      .eq('id', id);
    if (error) throw error;
  },

  /**
   * ปรับสถานะ 1-Click
   */
  async updateStatus(id: string, status: TaskStatus): Promise<void> {
    const payload: any = {
      status,
      completed_at: status === 'done' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('student_individual_tasks' as any)
      .update(payload)
      .eq('id', id);
    if (error) throw error;
  },

  /**
   * ปรับตัวเลขจำนวนครั้งที่ขาด ("ขาดไปกี่ครั้ง")
   */
  async incrementMissedCount(id: string, delta: number): Promise<number> {
    // 1. ดึงค่านับปัจจุบัน
    const { data: curr, error: fetchErr } = await supabase
      .from('student_individual_tasks' as any)
      .select('missed_count, status')
      .eq('id', id)
      .single();
    if (fetchErr) throw fetchErr;

    const currentCount = Number(curr?.missed_count) || 0;
    const nextCount = Math.max(0, currentCount + delta);

    const payload: any = {
      missed_count: nextCount,
      updated_at: new Date().toISOString(),
    };

    // หากเพิ่มจำนวนขาด และสถานะยังเป็น doing ให้อัปเกรดเป็น missed อัตโนมัติถ้าต้องการ
    if (nextCount > 0 && curr?.status === 'doing' && delta > 0) {
      payload.status = 'missed';
    }

    const { error: updErr } = await supabase
      .from('student_individual_tasks' as any)
      .update(payload)
      .eq('id', id);
    if (updErr) throw updErr;

    return nextCount;
  },

  /**
   * ลบภารกิจ
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('student_individual_tasks' as any)
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  /**
   * สรุปสถานะภารกิจของนักเรียน 1 คน
   */
  async getStudentSummary(studentId: string): Promise<StudentTasksSummary | null> {
    const [stData, tasks] = await Promise.all([
      supabase
        .from('students')
        .select('id, name, class, room, class_number, photo_url, student_code')
        .eq('id', studentId)
        .maybeSingle(),
      this.listByStudent(studentId),
    ]);

    if (!stData.data) return null;
    const st = stData.data;

    let done = 0;
    let doing = 0;
    let pending = 0;
    let missed = 0;

    tasks.forEach((t) => {
      if (t.status === 'done') done++;
      else if (t.status === 'doing') doing++;
      else if (t.status === 'pending') pending++;
      else if (t.status === 'missed') pending++; // นับเป็นค้างด้วย
      missed += t.missed_count || 0;
    });

    return {
      student_id: st.id,
      student_name: st.name,
      student_code: st.student_code,
      class: st.class,
      room: st.room ?? null,
      class_number: st.class_number,
      photo_url: st.photo_url,
      total_tasks: tasks.length,
      done_count: done,
      doing_count: doing,
      pending_count: pending,
      missed_count: missed,
      tasks,
    };
  },

  /**
   * สรุปภารกิจทั้งห้องเรียน (Class Overview)
   */
  async getClassTasksOverview(className: string, room?: string | null): Promise<StudentTasksSummary[]> {
    const stResp = await studentsService.getByClass(className);
    const rawStudents: StudentMin[] = stResp.data ?? [];
    const studentsList = room
      ? rawStudents.filter((s) => !s.room || s.room === room)
      : rawStudents;

    if (!studentsList.length) return [];

    const studentIds = studentsList.map((s) => s.id);
    const { data: taskData, error: taskErr } = await supabase
      .from('student_individual_tasks' as any)
      .select('*')
      .in('student_id', studentIds)
      .order('created_at', { ascending: false });
    if (taskErr) throw taskErr;

    const allTasks = (taskData ?? []) as StudentIndividualTask[];
    const tasksByStudent = new Map<string, StudentIndividualTask[]>();
    allTasks.forEach((t) => {
      const arr = tasksByStudent.get(t.student_id) ?? [];
      arr.push(t);
      tasksByStudent.set(t.student_id, arr);
    });

    return studentsList.map((st) => {
      const tasks = tasksByStudent.get(st.id) ?? [];
      let done = 0;
      let doing = 0;
      let pending = 0;
      let missed = 0;

      tasks.forEach((t) => {
        if (t.status === 'done') done++;
        else if (t.status === 'doing') doing++;
        else if (t.status === 'pending') pending++;
        else if (t.status === 'missed') pending++;
        missed += t.missed_count || 0;
      });

      return {
        student_id: st.id,
        student_name: st.name,
        student_code: st.student_code,
        class: st.class,
        room: st.room ?? null,
        class_number: st.class_number,
        photo_url: st.photo_url,
        total_tasks: tasks.length,
        done_count: done,
        doing_count: doing,
        pending_count: pending,
        missed_count: missed,
        tasks,
      };
    });
  },
};
