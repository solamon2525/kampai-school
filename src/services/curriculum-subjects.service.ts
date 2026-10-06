/**
 * curriculum-subjects.service.ts
 * บริการจัดการโครงสร้างรายวิชาประจำชั้นเรียน (ป.1 - ป.6) และการเชื่อมโยงนักเรียนเข้าสู่ระบบเกรด
 */
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type ObecGradeSubjectRow = Database['public']['Tables']['obec_grade_subjects']['Row'];
export type ObecGradeSubjectInsert = Database['public']['Tables']['obec_grade_subjects']['Insert'];
export type ObecGradeSubjectUpdate = Database['public']['Tables']['obec_grade_subjects']['Update'];

export interface SubjectFilter {
  academicYear?: string;
  gradeLevel?: string;
}

export const curriculumSubjectsService = {
  /**
   * ดึงรายการวิชาของชั้นเรียนและปีการศึกษาที่ระบุ
   */
  async listSubjects(gradeLevel: string, academicYear: string): Promise<ObecGradeSubjectRow[]> {
    const { data, error } = await supabase
      .from('obec_grade_subjects')
      .select('*')
      .eq('grade_level', gradeLevel)
      .eq('academic_year', academicYear)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('[curriculumSubjectsService] listSubjects error:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * สร้างรายวิชาใหม่ในชั้นเรียน
   */
  async createSubject(subject: ObecGradeSubjectInsert): Promise<ObecGradeSubjectRow> {
    const { data, error } = await supabase
      .from('obec_grade_subjects')
      .insert(subject)
      .select()
      .single();

    if (error) {
      console.error('[curriculumSubjectsService] createSubject error:', error);
      throw error;
    }

    return data;
  },

  /**
   * อัปเดตข้อมูลรายวิชา
   */
  async updateSubject(id: string, updates: ObecGradeSubjectUpdate): Promise<ObecGradeSubjectRow> {
    const { data, error } = await supabase
      .from('obec_grade_subjects')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[curriculumSubjectsService] updateSubject error:', error);
      throw error;
    }

    return data;
  },

  /**
   * ลบรายวิชา
   */
  async deleteSubject(id: string): Promise<void> {
    const { error } = await supabase
      .from('obec_grade_subjects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[curriculumSubjectsService] deleteSubject error:', error);
      throw error;
    }
  },

  /**
   * ดึงรายชื่อนักเรียนปัจจุบันเข้าสู่ระบบเกรดและสมุดรายงาน ปพ.5/ปพ.6 ผ่าน RPC
   */
  async enrollClassStudents(academicYear: string, gradeLevel: string): Promise<{
    success: boolean;
    academic_year: string;
    grade_level: string;
    enrolled_count: number;
  }> {
    const { data, error } = await supabase.rpc('enroll_class_students_to_gradebook', {
      p_academic_year: academicYear,
      p_grade_level: gradeLevel,
    });

    if (error) {
      console.error('[curriculumSubjectsService] enrollClassStudents error:', error);
      throw error;
    }

    return (data as unknown) as {
      success: boolean;
      academic_year: string;
      grade_level: string;
      enrolled_count: number;
    };
  },

  /**
   * Alias สำหรับ enrollClassStudents (รองรับการเรียกจาก PaporGradebookGrid และ diagnostics)
   */
  async enrollStudentsFromClass(academicYear: string, gradeLevel: string) {
    return this.enrollClassStudents(academicYear, gradeLevel);
  },

  /**
   * ดึงรายชื่อนักเรียนทั้งหมดที่อยู่ในชั้นเรียน (จากตาราง students)
   */
  async listStudentsInClass(gradeLevel: string) {
    const { data, error } = await supabase
      .from('students')
      .select('id, name, student_code, class, class_number, photo_url, is_active')
      .eq('class', gradeLevel)
      .eq('is_active', true)
      .order('class_number', { ascending: true })
      .order('student_code', { ascending: true });

    if (error) {
      console.error('[curriculumSubjectsService] listStudentsInClass error:', error);
      throw error;
    }

    return data || [];
  },
};
