/**
 * attendance.service.ts
 * Supabase queries สำหรับ attendance_records table
 *
 * Offline-first: upsertBulkResilient() ใช้ IndexedDB queue เมื่อ offline
 * และ flushOfflineQueue() เคลียร์ queue เมื่อ online กลับมา (Rule 14.34).
 */
import { supabase } from '@/integrations/supabase/client';
import { offlineQueue, isOnline } from '@/lib/offline-queue';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave';

export type AttendanceRecord = {
  id: string;
  student_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  notes: string | null;
  recorded_by: string | null;
};

export type AttendanceUpsert = {
  student_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  notes?: string | null;
  recorded_by?: string | null;
  recorded_by_staff_id?: string | null;
  recorded_by_administrator_id?: string | null;
};

export const attendanceService = {
  /** ดึง attendance ของนักเรียนในชั้น ณ วันที่กำหนด */
  getByDateAndStudentIds: (date: string, studentIds: string[]) =>
    supabase
      .from('attendance_records')
      .select('*')
      .eq('attendance_date', date)
      .in('student_id', studentIds),

  /**
   * Completeness helper for ปพ./ปฏิบัติ: student IDs with no attendance row that day.
   */
  missingForClass: async (
    date: string,
    studentIds: string[],
  ): Promise<string[]> => {
    if (!studentIds.length) return [];
    const { data, error } = await attendanceService.getByDateAndStudentIds(date, studentIds);
    if (error) throw error;
    const present = new Set(((data ?? []) as AttendanceRecord[]).map((r) => r.student_id));
    return studentIds.filter((id) => !present.has(id));
  },

  /** ดึงสรุป attendance ของนักเรียนคนเดียวในช่วงวันที่ */
  getByStudentDateRange: (studentId: string, startDate: string, endDate: string) =>
    supabase
      .from('attendance_records')
      .select('attendance_date, status')
      .eq('student_id', studentId)
      .gte('attendance_date', startDate)
      .lte('attendance_date', endDate)
      .order('attendance_date', { ascending: false }),

  /** ดึง attendance หลายนักเรียนในช่วงวันที่ (ใช้ใน report) */
  getByStudentIdsDateRange: (studentIds: string[], startDate: string, endDate: string) =>
    supabase
      .from('attendance_records')
      .select('student_id, status, attendance_date')
      .in('student_id', studentIds)
      .gte('attendance_date', startDate)
      .lte('attendance_date', endDate),

  /** บันทึกเช็คชื่อแบบ bulk (upsert) */
  upsertBulk: async (records: AttendanceUpsert[]) => {
    const result = await supabase
      .from('attendance_records')
      .upsert(records as never[], { onConflict: 'student_id,attendance_date' });
    // Fire-and-forget push for newly-marked absent students. Failures don't
    // block the save — the user already saw their attendance write succeed.
    if (!result.error) {
      const absentIds = records.filter((r) => r.status === 'absent').map((r) => r.student_id);
      if (absentIds.length) {
        void attendanceService.notifyAbsenceParents(absentIds, records[0]?.attendance_date);
      }
    }
    return result;
  },

  /** ลบรายการเช็คชื่อ */
  delete: (id: string) =>
    supabase.from('attendance_records').delete().eq('id', id),

  /**
   * Offline-aware bulk upsert.
   * Returns { queued: true } if offline (records saved to IndexedDB queue),
   * otherwise returns Supabase response. Caller treats both as "saved".
   */
  async upsertBulkResilient(records: AttendanceUpsert[]) {
    if (!isOnline()) {
      await offlineQueue.enqueue(
        records.map((r) => ({
          student_id: r.student_id,
          attendance_date: r.attendance_date,
          status: r.status,
          notes: r.notes ?? null,
        })),
      );
      return { error: null, data: null, queued: true as const, queueSize: await offlineQueue.count() };
    }
    const result = await attendanceService.upsertBulk(records);
    return { ...result, queued: false as const };
  },

  /**
   * Drain the offline queue. Idempotent — call on app boot + on 'online' event.
   * Returns { flushed, remaining }.
   */
  async flushOfflineQueue(): Promise<{ flushed: number; remaining: number }> {
    if (!isOnline()) return { flushed: 0, remaining: await offlineQueue.count() };
    const items = await offlineQueue.list();
    let flushed = 0;
    for (const item of items) {
      if (!item.id) continue;
      const r = await attendanceService.upsertBulk(item.records as AttendanceUpsert[]);
      if (r.error) {
        await offlineQueue.bumpAttempts(item.id);
        // Don't keep retrying forever — drop after 5 failures
        if ((item.attempts ?? 0) + 1 >= 5) await offlineQueue.remove(item.id);
      } else {
        await offlineQueue.remove(item.id);
        flushed++;
      }
    }
    return { flushed, remaining: await offlineQueue.count() };
  },

  /** Count of pending offline writes (for UI indicator). */
  pendingOfflineCount: () => offlineQueue.count(),

  /**
   * Look up parent user_ids for given students, then invoke send-push.
   * Best-effort: any error is logged but never thrown.
   */
  async notifyAbsenceParents(studentIds: string[], attendanceDate?: string) {
    try {
      // Resolve student names for the push body
      const { data: students } = await supabase
        .from('students')
        .select('id, name, class')
        .in('id', studentIds);

      const parentMap = new Map<string, { user_ids: string[]; name: string; cls?: string }>();
      for (const sid of studentIds) {
        const s = students?.find((x: any) => x.id === sid);
        const { data: rows } = await supabase.rpc('parents_of_student' as any, { p_student_id: sid });
        const userIds = (rows as any[] | null)?.map((r) => r.user_id) ?? [];
        if (userIds.length) {
          parentMap.set(sid, { user_ids: userIds, name: s?.name ?? '', cls: s?.class ?? undefined });
        }
      }

      // Group by parent (each parent gets ONE push covering their children)
      const byParent = new Map<string, string[]>();
      for (const [, info] of parentMap) {
        for (const uid of info.user_ids) {
          if (!byParent.has(uid)) byParent.set(uid, []);
          byParent.get(uid)!.push(info.name);
        }
      }

      await Promise.all(
        Array.from(byParent.entries()).flatMap(([userId, names]) => {
          const childNames = Array.from(new Set(names)).join(', ');
          const body = `${childNames} ขาดเรียน${attendanceDate ? ` วันที่ ${attendanceDate}` : ''} — กรุณาตรวจสอบ`;
          const url = '/parent/attendance';
          // Fan out to BOTH Web Push and LINE OA — each parent may have one,
          // the other, or both linked. Failures are caught individually.
          return [
            supabase.functions
              .invoke('send-push', {
                body: {
                  user_ids: [userId],
                  topic: 'absence',
                  title: 'แจ้งเตือนการเข้าเรียน',
                  body,
                  url,
                  tag: `absence-${attendanceDate ?? 'today'}`,
                },
              })
              .catch(() => {}),
            supabase.functions
              .invoke('line-send', {
                body: {
                  user_ids: [userId],
                  text: `[โรงเรียนคำไผ่] แจ้งเตือนการเข้าเรียน\n🔴 ${body}`,
                  url: typeof window !== 'undefined' ? `${window.location.origin}${url}` : url,
                },
              })
              .catch(() => {}),
          ];
        }),
      );
    } catch (e) {
      console.warn('notifyAbsenceParents failed (non-fatal):', e);
    }
  },
};
