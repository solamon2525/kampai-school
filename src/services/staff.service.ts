/**
 * staff.service.ts
 * Supabase queries สำหรับ staff และ administrators tables
 */
import { supabase } from '@/integrations/supabase/client';

export const staffService = {
  getAll: () =>
    supabase.from('staff').select('*').order('order_position', { ascending: true }),

  getTeachers: () =>
    supabase
      .from('staff')
      .select('id, name, position, subject, photo_url, order_position, email, phone, department')
      .eq('staff_type', 'teaching')
      .order('order_position', { ascending: true }),

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
