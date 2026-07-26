/**
 * lesson-packs.service.ts
 * ชุดคาบพร้อมใช้: ลำดับสื่อ → ใบงาน → เฉลยโปรเจคเตอร์
 */
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type LessonPackAccess = 'private' | 'link';

export type LessonPackStep = {
  type: 'media' | 'worksheet' | 'note';
  label: string;
  hint?: string;
  url?: string;
  worksheet_key?: string;
};

export type LessonPack = {
  id: string;
  owner_staff_id: string;
  pack_key: string;
  title: string;
  subject: string;
  grade_label: string;
  steps: LessonPackStep[];
  access: LessonPackAccess;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function parseSteps(raw: Json | LessonPackStep[] | null | undefined): LessonPackStep[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as LessonPackStep[];
  return [];
}

function mapRow(row: Record<string, unknown>): LessonPack {
  return {
    id: String(row.id),
    owner_staff_id: String(row.owner_staff_id),
    pack_key: String(row.pack_key),
    title: String(row.title),
    subject: String(row.subject ?? ''),
    grade_label: String(row.grade_label ?? ''),
    steps: parseSteps(row.steps as Json),
    access: (row.access as LessonPackAccess) ?? 'link',
    sort_order: Number(row.sort_order ?? 0),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

const SELECT =
  'id,owner_staff_id,pack_key,title,subject,grade_label,steps,access,sort_order,created_at,updated_at';

export const lessonPacksService = {
  async listMine(staffId: string) {
    const { data, error } = await supabase
      .from('lesson_packs' as any)
      .select(SELECT)
      .eq('owner_staff_id', staffId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) return { data: [] as LessonPack[], error };
    return { data: ((data ?? []) as Record<string, unknown>[]).map(mapRow), error: null };
  },

  async listRecent(limit = 40) {
    const { data, error } = await supabase
      .from('lesson_packs' as any)
      .select(SELECT)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return { data: [] as LessonPack[], error };
    return { data: ((data ?? []) as Record<string, unknown>[]).map(mapRow), error: null };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('lesson_packs' as any)
      .select(SELECT)
      .eq('id', id)
      .maybeSingle();
    if (error) return { data: null as LessonPack | null, error };
    return { data: data ? mapRow(data as Record<string, unknown>) : null, error: null };
  },

  async remove(id: string) {
    return supabase.from('lesson_packs' as any).delete().eq('id', id);
  },
};
