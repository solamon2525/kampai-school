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

  getTeacherAccountStatus: () =>
    supabase
      .from('user_roles')
      .select('staff_id')
      .eq('role', 'teacher')
      .not('staff_id', 'is', null),

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
