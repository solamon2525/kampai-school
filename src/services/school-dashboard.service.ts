/**
 * school-dashboard.service.ts
 * Flexible store of school metadata: codes, system credentials, network info, etc.
 * Admin-only via RLS.
 *
 * Note: table is not in generated types yet — we cast `as any` on .from() like
 * other recently-added tables (see useNotifications.ts pattern).
 */
import { supabase } from '@/integrations/supabase/client';

// ─── Types ───────────────────────────────────────────────────────────────────

export type DashboardEntryCategory =
  | 'codes'
  | 'systems'
  | 'network'
  | 'contacts'
  | 'other';

export const DASHBOARD_CATEGORY_OPTIONS: Array<{
  value: DashboardEntryCategory;
  label: string;
  icon: string;
}> = [
  { value: 'codes', label: 'รหัสโรงเรียน', icon: '🆔' },
  { value: 'systems', label: 'บัญชีระบบราชการ', icon: '🔐' },
  { value: 'network', label: 'เครือข่าย/อินเทอร์เน็ต', icon: '🌐' },
  { value: 'contacts', label: 'ผู้ติดต่อ/หน่วยงาน', icon: '📞' },
  { value: 'other', label: 'อื่น ๆ', icon: '📌' },
];

export type DashboardExtraFieldType = 'text' | 'password' | 'url' | 'ip' | 'note';

export type DashboardExtraField = {
  label: string;
  value: string;
  type?: DashboardExtraFieldType;
};

export type SchoolDashboardEntry = {
  id: string;
  category: DashboardEntryCategory;
  title: string;
  description: string | null;
  url: string | null;
  username: string | null;
  password: string | null;
  extra_fields: DashboardExtraField[];
  tags: string[];
  is_sensitive: boolean;
  order_position: number;
  created_at: string;
  updated_at: string;
};

export type SchoolDashboardEntryInput = Omit<
  SchoolDashboardEntry,
  'id' | 'created_at' | 'updated_at'
>;

// ─── Service ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tbl = () => supabase.from('school_dashboard_entries' as any);

export const schoolDashboardService = {
  list: async (): Promise<{ data: SchoolDashboardEntry[] | null; error: Error | null }> => {
    const { data, error } = await tbl()
      .select('*')
      .order('category', { ascending: true })
      .order('order_position', { ascending: true })
      .order('created_at', { ascending: true });
    return {
      data: data ? (data as unknown as SchoolDashboardEntry[]) : null,
      error: error as Error | null,
    };
  },

  listByCategory: async (
    category: DashboardEntryCategory,
  ): Promise<{ data: SchoolDashboardEntry[] | null; error: Error | null }> => {
    const { data, error } = await tbl()
      .select('*')
      .eq('category', category)
      .order('order_position', { ascending: true })
      .order('created_at', { ascending: true });
    return {
      data: data ? (data as unknown as SchoolDashboardEntry[]) : null,
      error: error as Error | null,
    };
  },

  getById: async (id: string) => {
    const { data, error } = await tbl().select('*').eq('id', id).maybeSingle();
    return {
      data: data ? (data as unknown as SchoolDashboardEntry) : null,
      error: error as Error | null,
    };
  },

  insert: async (data: SchoolDashboardEntryInput) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error } = await tbl().insert(data as any).select().single();
    return {
      data: row ? (row as unknown as SchoolDashboardEntry) : null,
      error: error as Error | null,
    };
  },

  update: async (id: string, data: Partial<SchoolDashboardEntryInput>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error } = await tbl().update(data as any).eq('id', id).select().single();
    return {
      data: row ? (row as unknown as SchoolDashboardEntry) : null,
      error: error as Error | null,
    };
  },

  delete: async (id: string) => {
    const { error } = await tbl().delete().eq('id', id);
    return { error: error as Error | null };
  },

  reorder: async (id: string, order_position: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await tbl().update({ order_position } as any).eq('id', id);
    return { error: error as Error | null };
  },
};
