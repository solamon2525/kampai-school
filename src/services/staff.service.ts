/**
 * staff.service.ts
 * Supabase queries สำหรับ staff และ administrators tables
 */
import { supabase } from '@/integrations/supabase/client';

// UUID v4 shape — discriminate UUID vs username in route params (cf. EducationalHubTeacher)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STAFF_DETAIL_FIELDS =
  'id, name, position, subject, photo_url, email, phone, department, staff_type, academic_rank, degree, major, education, experience, extra_info, username';

export const staffService = {
  getAll: () =>
    supabase.from('staff').select('*').order('order_position', { ascending: true }),

  /** Lightweight name options สำหรับ dropdown — ใช้ใน academic cluster (lesson plan / supervision / class schedule) */
  getNameOptions: () =>
    supabase.from('staff').select('id, name').order('name'),

  getTeachers: () =>
    supabase
      .from('staff')
      .select('id, name, position, subject, photo_url, order_position, email, phone, department, username')
      .eq('staff_type', 'teaching')
      .order('order_position', { ascending: true }),

  /** ดึงครูคนเดียว (public-safe fields) สำหรับหน้า /staff/:id */
  getById: (id: string) =>
    supabase.from('staff').select(STAFF_DETAIL_FIELDS).eq('id', id).maybeSingle(),

  /**
   * Resolve identifier (UUID or username) → staff record.
   * Used by /staff/:id route to accept both shapes (short URL + backward-compat UUID).
   */
  getByIdentifier: (id: string) => {
    if (UUID_RE.test(id)) {
      return supabase.from('staff').select(STAFF_DETAIL_FIELDS).eq('id', id).maybeSingle();
    }
    return supabase
      .from('staff')
      .select(STAFF_DETAIL_FIELDS)
      .eq('username', id.toLowerCase())
      .maybeSingle();
  },

  /** Set username (admin or teacher self-edit). Pass null to clear. */
  updateUsername: (staffId: string, username: string | null) =>
    supabase.from('staff').update({ username } as never).eq('id', staffId),

  getAllPersonnel: async () => {
    const [staffRes, adminsRes] = await Promise.all([
      supabase
        .from('staff')
        .select('id, name, position, subject, photo_url, order_position, email, phone, department, staff_type')
        .in('staff_type', ['teaching', 'support'])
        .order('order_position', { ascending: true }),
      supabase
        .from('administrators')
        .select('id, name, position, photo_url, order_position')
        .order('order_position', { ascending: true }),
    ]);

    if (staffRes.error) return { data: null, error: staffRes.error };
    if (adminsRes.error) return { data: null, error: adminsRes.error };

    const admins = (adminsRes.data || []).map((a: any) => ({
      ...a,
      subject: null,
      email: null,
      phone: null,
      department: null,
      staff_type: 'admin' as const,
      source: 'administrators' as const,
    }));
    const staff = (staffRes.data || []).map((s: any) => ({
      ...s,
      source: 'staff' as const,
    }));

    return { data: [...admins, ...staff], error: null };
  },

  getTeacherAccountStatus: () =>
    supabase
      .from('user_roles')
      .select('staff_id, administrator_id, role')
      .or('staff_id.not.is.null,administrator_id.not.is.null'),

  /** ตัวเลือกผู้บันทึก: ครู (staff_type=teaching) + ผอ. (administrators) — ไม่รวม support */
  getRecorderOptions: async () => {
    const [teachers, admins] = await Promise.all([
      supabase
        .from('staff')
        .select('id, name, position, order_position, photo_url')
        .eq('staff_type', 'teaching')
        .order('order_position', { ascending: true }),
      supabase
        .from('administrators')
        .select('id, name, position, order_position, photo_url')
        .order('order_position', { ascending: true }),
    ]);
    if (teachers.error) return { data: null, error: teachers.error };
    if (admins.error) return { data: null, error: admins.error };

    const adminOptions = (admins.data ?? []).map((a: any) => ({
      id: a.id as string,
      name: a.name as string,
      position: (a.position ?? null) as string | null,
      order_position: (a.order_position ?? 0) as number,
      photo_url: (a.photo_url ?? null) as string | null,
      source: 'administrator' as const,
    }));
    const teacherOptions = (teachers.data ?? []).map((t: any) => ({
      id: t.id as string,
      name: t.name as string,
      position: (t.position ?? null) as string | null,
      order_position: (t.order_position ?? 0) as number,
      photo_url: (t.photo_url ?? null) as string | null,
      source: 'staff' as const,
    }));
    return { data: [...adminOptions, ...teacherOptions], error: null };
  },

  insert: (data: Record<string, unknown>) =>
    supabase.from('staff').insert(data as never),

  update: (id: string, data: Record<string, unknown>) =>
    supabase.from('staff').update(data as never).eq('id', id),

  delete: (id: string) =>
    supabase.from('staff').delete().eq('id', id),
};

export const administratorsService = {
  getAll: () =>
    supabase.from('administrators').select('*').order('order_position', { ascending: true }),

  insert: (data: Record<string, unknown>) =>
    supabase.from('administrators').insert(data as never),

  update: (id: string, data: Record<string, unknown>) =>
    supabase.from('administrators').update(data as never).eq('id', id),

  delete: (id: string) =>
    supabase.from('administrators').delete().eq('id', id),
};
