/**
 * teacher-class-assignment.service.ts
 * บริการจัดการการมอบหมายครูประจำชั้นและครูสอนควบชั้น (Multi-Grade Teaching)
 * - สอดคล้องกับตาราง teacher_class_assignments (Migration 575 & 576)
 * - รองรับ 1 ครู : หลายชั้นเรียน (สอนควบ ป.1-2, ป.3-4, ป.5-6)
 * - บังคับ 1 ห้องเรียนมีครูประจำชั้นหลักเพียง 1 ท่านต่อปีการศึกษา (No Duplicate Rows)
 * - คำนวณและปรับสถานะ is_multi_grade อัตโนมัติ (Auto-Sync)
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

export interface AssignMultiGradePayload {
  academic_year: string;
  teacher_id: string;
  class_names: string[];
  notes?: string;
}

export const teacherClassAssignmentService = {
  /**
   * ดึงรายการมอบหมายครูประจำชั้นทั้งหมดในปีการศึกษาที่ระบุ
   * สำหรับแสดงผลในแผงควบคุมของ Admin
   */
  async listAssignments(academicYear: string = '2569'): Promise<TeacherClassAssignmentRow[]> {
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

    const rows = (data as unknown as TeacherClassAssignmentRow[]) || [];
    // Clean trimmed teacher names
    return rows.map((r) => ({
      ...r,
      teacher: r.teacher
        ? {
            ...r.teacher,
            name: (r.teacher.name || '').trim(),
          }
        : null,
    }));
  },

  /**
   * ดึงรายการชั้นเรียนที่ครูคนนั้นๆ รับผิดชอบ (เช่น ['ป.1', 'ป.2'])
   * สำหรับใช้กรอง Dropdown ชั้นเรียนใน Teacher Portal
   */
  async getTeacherAssignedClasses(staffId: string, academicYear: string = '2569'): Promise<{
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
    // De-duplicate unique class names
    const classes = Array.from(new Set(rows.map((r) => r.class_name)));
    const isMultiGrade = rows.some((r) => r.is_multi_grade) || classes.length > 1;

    return { classes, isMultiGrade, assignments: rows };
  },

  /**
   * ดึงข้อมูลครูประจำชั้นของห้องนั้นๆ (สำหรับแสดงผลและเซ็นชื่อในรายงาน ปพ. และสลิป)
   * ใช้ limit(1) เพื่อป้องกันกรณีข้อมูลซ้ำซ้อนในฐานข้อมูล
   */
  async getClassHomeroomTeacher(className: string, academicYear: string = '2569'): Promise<{
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
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching class homeroom teacher:', error);
      return null;
    }

    if (!data || !(data as any).teacher) return null;
    const t = (data as any).teacher;
    return {
      name: (t.name || 'ครูประจำชั้น').trim(),
      position: t.position || 'ครูประจำชั้น',
      photo_url: t.photo_url || null,
      isMultiGrade: Boolean((data as any).is_multi_grade),
      notes: (data as any).notes || null,
    };
  },

  /**
   * มอบหมายครูประจำชั้น 1 ห้องเรียน (Admin Only)
   * - เคลียร์ครูคนเดิมของห้องนี้ออกก่อนเสมอ เพื่อป้องกันแถวซ้ำซ้อน
   * - รัน Auto-Sync Multi-Grade เพื่อปรับสถานะสอนควบและหมายเหตุให้ถูกต้อง
   */
  async assignTeacher(payload: AssignTeacherPayload): Promise<void> {
    const isPrimary = payload.is_primary_homeroom ?? true;

    // 1. ถ้าเป็นการแต่งตั้งครูประจำชั้นหลัก ให้ลบครูคนอื่นที่เคยเป็นประจำชั้นห้องนี้ออกก่อน
    if (isPrimary) {
      const { error: delError } = await supabase
        .from('teacher_class_assignments' as any)
        .delete()
        .eq('academic_year', payload.academic_year)
        .eq('class_name', payload.class_name)
        .eq('is_primary_homeroom', true)
        .neq('teacher_id', payload.teacher_id);

      if (delError) {
        console.warn('Warning removing previous homeroom teacher:', delError);
      }
    }

    // 2. บันทึกหรืออัปเดตข้อมูลการมอบหมาย
    const { error } = await supabase
      .from('teacher_class_assignments' as any)
      .upsert(
        {
          academic_year: payload.academic_year,
          class_name: payload.class_name,
          teacher_id: payload.teacher_id,
          is_primary_homeroom: isPrimary,
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

    // 3. ปรับสถานะ Multi-Grade ให้ตรงกับความจริงของปีการศึกษานั้นๆ
    await this.syncMultiGradeFlags(payload.academic_year);
  },

  /**
   * มอบหมายครูสอนควบหลายห้องพร้อมกันในคลิกเดียว (Admin Only)
   * เช่น มอบหมายครูเอกวิทย์ ดูแล ป.3 และ ป.4
   */
  async assignMultiGrade(payload: AssignMultiGradePayload): Promise<void> {
    const { academic_year, teacher_id, class_names, notes } = payload;
    if (!class_names || class_names.length === 0) return;

    for (const className of class_names) {
      // ปลดครูคนเดิมออก
      await supabase
        .from('teacher_class_assignments' as any)
        .delete()
        .eq('academic_year', academic_year)
        .eq('class_name', className)
        .eq('is_primary_homeroom', true)
        .neq('teacher_id', teacher_id);

      // มอบหมายครูคนใหม่
      await supabase
        .from('teacher_class_assignments' as any)
        .upsert(
          {
            academic_year,
            class_name: className,
            teacher_id,
            is_primary_homeroom: true,
            is_multi_grade: class_names.length > 1,
            notes: notes || (class_names.length > 1 ? `สอนควบชั้น ${class_names.join(' และ ')}` : `ครูประจำชั้น ${className}`),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'academic_year,class_name,teacher_id' }
        );
    }

    await this.syncMultiGradeFlags(academic_year);
  },

  /**
   * ปรับสถานะ is_multi_grade และหมายเหตุอัตโนมัติทั่วทั้งปีการศึกษา
   * - ครูที่มี $\ge 2$ ห้อง $\rightarrow$ is_multi_grade = true
   * - ครูที่มี $1$ ห้อง $\rightarrow$ is_multi_grade = false
   */
  async syncMultiGradeFlags(academicYear: string = '2569'): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('teacher_class_assignments' as any)
        .select('id, teacher_id, class_name, is_multi_grade, notes')
        .eq('academic_year', academicYear);

      if (error || !data) return;

      const rows = data as Array<{
        id: string;
        teacher_id: string;
        class_name: string;
        is_multi_grade: boolean;
        notes: string | null;
      }>;

      // จัดกลุ่มตามรหัสครู
      const teacherMap: Record<string, typeof rows> = {};
      rows.forEach((r) => {
        if (!teacherMap[r.teacher_id]) teacherMap[r.teacher_id] = [];
        teacherMap[r.teacher_id].push(r);
      });

      // วนลูปอัปเดตสถานะให้สอดคล้องกับความจริง
      for (const [, teacherRows] of Object.entries(teacherMap)) {
        const classes = teacherRows.map((r) => r.class_name).sort();
        const shouldBeMulti = classes.length > 1;
        const autoNote = shouldBeMulti
          ? `สอนควบชั้น ${classes.join(' และ ')}`
          : `ครูประจำชั้น ${classes[0]}`;

        for (const row of teacherRows) {
          const needsUpdateMulti = row.is_multi_grade !== shouldBeMulti;
          const isGenericNote =
            !row.notes ||
            row.notes.startsWith('สอนควบชั้น') ||
            row.notes.startsWith('ครูประจำชั้น');

          if (needsUpdateMulti || isGenericNote) {
            await supabase
              .from('teacher_class_assignments' as any)
              .update({
                is_multi_grade: shouldBeMulti,
                notes: isGenericNote ? autoNote : row.notes,
                updated_at: new Date().toISOString(),
              })
              .eq('id', row.id);
          }
        }
      }
    } catch (e) {
      console.warn('Error syncing multi-grade flags:', e);
    }
  },

  /**
   * ลบการมอบหมายครูประจำชั้น (Admin Only)
   */
  async removeAssignment(assignmentId: string, academicYear: string = '2569'): Promise<void> {
    const { error } = await supabase
      .from('teacher_class_assignments' as any)
      .delete()
      .eq('id', assignmentId);

    if (error) {
      console.error('Error removing assignment:', error);
      throw error;
    }

    await this.syncMultiGradeFlags(academicYear);
  },

  /**
   * 1-Click Preset: จัดโครงสร้างมาตรฐาน 3 คู่ (ป.1-2, ป.3-4, ป.5-6)
   */
  async applyStandardPreset(academicYear: string = '2569'): Promise<void> {
    // ดึงครูที่เกี่ยวข้อง
    const { data: staffList } = await supabase
      .from('staff')
      .select('id, name')
      .in('name', ['นางสาวธัญพิชชา วังผือ', 'นายเอกวิทย์ พละลี', 'นางสาวมะลิวัลย์ จรุงพันธ์']);

    if (!staffList || staffList.length === 0) return;

    const findStaffId = (keyword: string) =>
      staffList.find((s) => s.name.includes(keyword))?.id;

    const tThanyapitcha = findStaffId('ธัญพิชชา');
    const tEkawit = findStaffId('เอกวิทย์');
    const tMaliwan = findStaffId('มะลิวัลย์');

    if (tThanyapitcha) {
      await this.assignMultiGrade({
        academic_year: academicYear,
        teacher_id: tThanyapitcha,
        class_names: ['ป.1', 'ป.2'],
      });
    }
    if (tEkawit) {
      await this.assignMultiGrade({
        academic_year: academicYear,
        teacher_id: tEkawit,
        class_names: ['ป.3', 'ป.4'],
      });
    }
    if (tMaliwan) {
      await this.assignMultiGrade({
        academic_year: academicYear,
        teacher_id: tMaliwan,
        class_names: ['ป.5', 'ป.6'],
      });
    }

    await this.syncMultiGradeFlags(academicYear);
  },
};
