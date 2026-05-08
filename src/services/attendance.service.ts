/**
 * attendance.service.ts
 * Supabase queries สำหรับ attendance_records table
 */
import { supabase } from '@/integrations/supabase/client';

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
  upsertBulk: (records: AttendanceUpsert[]) =>
    supabase
      .from('attendance_records')
      .upsert(records as never[], { onConflict: 'student_id,attendance_date' }),

  /** ลบรายการเช็คชื่อ */
  delete: (id: string) =>
    supabase.from('attendance_records').delete().eq('id', id),
};
