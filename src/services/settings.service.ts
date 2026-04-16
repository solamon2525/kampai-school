/**
 * settings.service.ts
 * Supabase queries สำหรับ school_settings table
 */
import { supabase } from '@/integrations/supabase/client';

export const settingsService = {
  get: () =>
    supabase.from('school_settings').select('*').limit(1).single(),

  update: (id: string, data: Record<string, unknown>) =>
    supabase.from('school_settings').update(data as never).eq('id', id),
};
