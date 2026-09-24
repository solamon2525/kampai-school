/**
 * worksheet-sets.service.ts
 * CRUD สำหรับชุดใบงานที่ครูบันทึก (seed + config) — ใช้เปิดซ้ำด้วย ?set=
 */
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type WorksheetSetAccess = 'private' | 'link';

export type WorksheetSet = {
  id: string;
  owner_staff_id: string;
  worksheet_key: string;
  title: string;
  seed: number;
  config: Json;
  access: WorksheetSetAccess;
  created_at: string;
  updated_at: string;
};

export type WorksheetSetInsert = {
  owner_staff_id: string;
  worksheet_key: string;
  title: string;
  seed: number;
  config?: Json;
  access?: WorksheetSetAccess;
};

/** Map worksheet_key → public HTML path for “เปิดใบงาน/เฉลย” shortcuts */
export const WORKSHEET_KEY_PATHS: Record<string, string> = {
  'rect-area': '/games/math/rect-area-worksheet.html',
  'math/decimal': '/games/math/decimal-worksheet.html',
  'math/angle': '/games/math/angle-worksheet.html',
  'math/fraction-pieces': '/games/math/fraction-pieces-worksheet.html',
};

export function worksheetOpenUrl(set: Pick<WorksheetSet, 'id' | 'worksheet_key' | 'seed'>): string {
  const known = WORKSHEET_KEY_PATHS[set.worksheet_key];
  const path = known
    || (set.worksheet_key.includes('/')
      ? `/games/${set.worksheet_key}-worksheet.html`
      : `/games/math/${set.worksheet_key}-worksheet.html`);
  const url = new URL(path, window.location.origin);
  url.searchParams.set('set', set.id);
  url.searchParams.set('seed', String(set.seed));
  return url.pathname + url.search;
}

export const worksheetSetsService = {
  async listMine(staffId: string, worksheetKey?: string) {
    let q = supabase
      .from('worksheet_sets' as any)
      .select('id,owner_staff_id,worksheet_key,title,seed,config,access,created_at,updated_at')
      .eq('owner_staff_id', staffId)
      .order('created_at', { ascending: false });
    if (worksheetKey) q = q.eq('worksheet_key', worksheetKey);
    return q;
  },

  async listRecent(limit = 30) {
    return supabase
      .from('worksheet_sets' as any)
      .select('id,owner_staff_id,worksheet_key,title,seed,config,access,created_at,updated_at')
      .order('created_at', { ascending: false })
      .limit(limit);
  },

  async getById(id: string) {
    return supabase
      .from('worksheet_sets' as any)
      .select('id,owner_staff_id,worksheet_key,title,seed,config,access,created_at,updated_at')
      .eq('id', id)
      .maybeSingle();
  },

  async create(row: WorksheetSetInsert) {
    return supabase
      .from('worksheet_sets' as any)
      .insert({
        ...row,
        config: row.config ?? {},
        access: row.access ?? 'link',
      })
      .select()
      .single();
  },

  async remove(id: string) {
    return supabase.from('worksheet_sets' as any).delete().eq('id', id);
  },

  /** Count saved sets by worksheet_key (DB-wide or scoped to owner). */
  async countByKey(ownerStaffId?: string | null) {
    let q = supabase
      .from('worksheet_sets' as any)
      .select('worksheet_key');
    if (ownerStaffId) q = q.eq('owner_staff_id', ownerStaffId);
    const { data, error } = await q;
    if (error) return { data: null as Record<string, number> | null, error, total: 0 };
    const counts: Record<string, number> = {};
    for (const row of (data ?? []) as { worksheet_key: string }[]) {
      const key = row.worksheet_key || '(unknown)';
      counts[key] = (counts[key] ?? 0) + 1;
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return { data: counts, error: null, total };
  },
};
