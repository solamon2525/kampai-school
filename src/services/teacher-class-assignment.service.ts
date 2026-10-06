/**
 * teacher-class-assignment.service.ts
 * บริการจัดการการมอบหมายครูประจำชั้นและครูสอนควบชั้น (Multi-Grade Teaching)
 * - สอดคล้องกับตาราง teacher_class_assignments (Migration 575)
 * - รองรับ 1 ครู : หลายชั้นเรียน (สอนควบ)
 * - ดึงข้อมูลครูพร้อม photo_url ตาม DESIGN.md Rule 14.13
 */
import { supabase } from '@/integrations/supabase/client';

export interface TeacherClassAssignmentRow {
  id: string;
  academic_year: string;
  class_name: string;
  teacher_id: string;
  is_primary_homeroom: boolean;
  is_multi_grade: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  teacher?: {
    id: string;
    name: string;
    position: string;
    photo_url: string | null;
    phone?: string | null;
  } | null;
}

export interface AssignTeacherPayload {
  academic_year: string;
  class_name: string;
  teacher_id: string;
  is_primary_homeroom?: boolean;
  is_multi_grade?: boolean;
  notes?: string;
}

export const teacherClassAssignmentService = {
  /**
   * ดึงรายการมอบหมายครูประจำชั้นทั้งหมดในปีการศึกษาที่ระบุ
   * สำหรับแสดงผลในแผงควบคุมของ Admin
   */
  async listAssignments(academicYear: string = '2568'): Promise<TeacherClassAssignmentRow[]> {
    const { data, error } = await supabase
      .from('teacher_class_assignments' as any)
      .select(`
        id,
        academic_year,
        class_name,
        teacher_id,
        is_primary_homeroom,
        is_multi_grade,
        notes,
        created_at,
        updated_at,
        teacher:staff!teacher_class_assignments_teacher_id_fkey(
          id,
          name,
          position,
          photo_url,
          phone
        )
      `)
      .eq('academic_year', academicYear)
      .order('class_name', { ascending: true });

    if (error) {
      console.error('Error fetching teacher_class_assignments:', error);
      throw error;
    }
    return (data as unknown as TeacherClassAssignmentRow[]) || [];
  },

  /**
   * ดึงรายการชั้นเรียนที่ครูคนนั้นๆ รับผิดชอบ (เช่น ['ป.1', 'ป.2'])
   * สำหรับใช้กรอง Dropdown ชั้นเรียนใน Teacher Portal
   */
  async getTeacherAssignedClasses(staffId: string, academicYear: string = '2568'): Promise<{
    classes: string[];
    isMultiGrade: boolean;
    assignments: TeacherClassAssignmentRow[];
  }> {
    if (!staffId) {
      return { classes: [], isMultiGrade: false, assignments: [] };
    }

    const { data, error } = await supabase
      .from('teacher_class_assignments' as any)
      .select(`
        id,
        academic_year,
        class_name,
        teacher_id,
        is_primary_homeroom,
        is_multi_grade,
        notes,
        created_at,
        updated_at
      `)
      .eq('teacher_id', staffId)
      .eq('academic_year', academicYear)
      .order('class_name', { ascending: true });

    if (error) {
      console.error('Error fetching teacher assigned classes:', error);
      throw error;
    }

    const rows = (data as unknown as TeacherClassAssignmentRow[]) || [];
    const classes = rows.map((r) => r.class_name);
    const isMultiGrade = rows.some((r) => r.is_multi_grade) || classes.length > 1;

    return { classes, isMultiGrade, assignments: rows };
  },

  /**
   * ดึงข้อมูลครูประจำชั้นของห้องนั้นๆ (สำหรับแสดงผลและเซ็นชื่อในรายงาน ปพ. และสลิป)
   */
  async getClassHomeroomTeacher(className: string, academicYear: string = '2568'): Promise<{
    name: string;
    position: string;
    photo_url: string | null;
    isMultiGrade: boolean;
    notes: string | null;
  } | null> {
    const { data, error } = await supabase
      .from('teacher_class_assignments' as any)
      .select(`
        id,
        class_name,
        is_primary_homeroom,
        is_multi_grade,
        notes,
        teacher:staff!teacher_class_assignments_teacher_id_fkey(
          id,
          name,
          position,
          photo_url
        )
      `)
      .eq('academic_year', academicYear)
      .eq('class_name', className)
      .eq('is_primary_homeroom', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching class homeroom teacher:', error);
      return null;
    }

    if (!data || !(data as any).teacher) return null;
    const t = (data as any).teacher;
    return {
      name: t.name || 'ครูประจำชั้น',
      position: t.position || 'ครูประจำชั้น',
      photo_url: t.photo_url || null,
      isMultiGrade: Boolean((data as any).is_multi_grade),
      notes: (data as any).notes || null,
    };
  },

  /**
   * มอบหมายครูประจำชั้น (Admin Only)
   */
  async assignTeacher(payload: AssignTeacherPayload): Promise<void> {
    const { error } = await supabase
      .from('teacher_class_assignments' as any)
      .upsert(
        {
          academic_year: payload.academic_year,
          class_name: payload.class_name,
          teacher_id: payload.teacher_id,
          is_primary_homeroom: payload.is_primary_homeroom ?? true,
          is_multi_grade: payload.is_multi_grade ?? false,
          notes: payload.notes || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'academic_year,class_name,teacher_id' }
      );

    if (error) {
      console.error('Error assigning teacher:', error);
      throw error;
    }
  },

  /**
   * ลบการมอบหมายครูประจำชั้น (Admin Only)
   */
  async removeAssignment(assignmentId: string): Promise<void> {
    const { error } = await supabase
      .from('teacher_class_assignments' as any)
      .delete()
      .eq('id', assignmentId);

    if (error) {
      console.error('Error removing assignment:', error);
      throw error;
    }
  },
};
