/**
 * students.service.ts
 * Supabase queries สำหรับ students table
 * ใช้แทนการเรียก supabase.from('students') โดยตรงใน components
 */
import { supabase } from '@/integrations/supabase/client';

// ─── Type ───────────────────────────────────────────────────────────────────
export type StudentRow = {
  id: string;
  student_code: string | null;
  name: string;
  class: string;
  class_number: number | null;
  gender: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  is_active: boolean | null;
  photo_url: string | null;
  room: string | null;
  // profile fields
  title: string | null;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  national_id: string | null;
  birth_date: string | null;
  religion: string | null;
  nationality: string | null;
  blood_type: string | null;
  // address
  current_address: string | null;
  current_district: string | null;
  current_subdistrict: string | null;
  current_province: string | null;
  current_postal_code: string | null;
  registered_address: string | null;
  registered_district: string | null;
  registered_subdistrict: string | null;
  registered_province: string | null;
  registered_postal_code: string | null;
  // family
  father_name: string | null;
  father_phone: string | null;
  father_occupation: string | null;
  mother_name: string | null;
  mother_phone: string | null;
  mother_occupation: string | null;
  guardian_name: string | null;
  guardian_relation: string | null;
  guardian_phone: string | null;
};

export type StudentMin = Pick<StudentRow, 'id' | 'name' | 'class' | 'class_number' | 'photo_url' | 'student_code' | 'gender' | 'room'>;

// ─── Service ─────────────────────────────────────────────────────────────────
export const studentsService = {
  /** ดึงนักเรียนทุกคน (เรียงตามชั้น/เลขที่) */
  getAll: () =>
    supabase.from('students').select('*').order('class').order('class_number'),

  /** ดึงเฉพาะนักเรียนที่ active */
  getActive: () =>
    supabase.from('students').select('*').eq('is_active', true).order('class').order('class_number'),

  /** Lightweight options สำหรับ dropdown ใน academic cluster (special needs / counseling) — ใช้ class_level/class_room schema */
  getAcademicOptions: () =>
    supabase
      .from('students')
      .select('id, student_code, first_name, last_name, class_level, class_room')
      .order('first_name'),

  /** ดึงนักเรียนในชั้นเรียนที่กำหนด (active เท่านั้น) — ใช้ใน checkin / scores / conduct / waste */
  getByClass: (className: string) =>
    supabase
      .from('students')
      .select('id, student_code, name, class, room, class_number, gender, photo_url, parent_name, parent_phone, is_active')
      .eq('class', className)
      .eq('is_active', true)
      .order('class_number'),

  /** ดึงนักเรียนทีละคน */
  getById: (id: string) =>
    supabase.from('students').select('*').eq('id', id).single(),

  /** เพิ่มนักเรียนใหม่ */
  insert: (data: Partial<StudentRow>) =>
    supabase.from('students').insert(data as never),

  /** แก้ไขข้อมูลนักเรียน */
  update: (id: string, data: Partial<StudentRow>) =>
    supabase.from('students').update(data as never).eq('id', id),

  /** ลบนักเรียน */
  delete: (id: string) =>
    supabase.from('students').delete().eq('id', id),

  /** อัปโหลดรูปไปยัง storage และคืน publicUrl */
  uploadPhoto: async (file: File): Promise<string | null> => {
    const path = `students/${Date.now()}_${file.name.replace(/\s/g, '_')}`;
    const { error } = await supabase.storage.from('school-images').upload(path, file, { upsert: true });
    if (error) return null;
    const { data: { publicUrl } } = supabase.storage.from('school-images').getPublicUrl(path);
    return publicUrl;
  },
};
