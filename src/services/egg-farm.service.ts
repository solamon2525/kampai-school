/**
 * egg-farm.service.ts — ระบบฟาร์มไก่ไข่โรงเรียน (Migration 594)
 */
import { supabase } from '@/integrations/supabase/client';

export type EggCollectionPeriod = 'เช้า' | 'บ่าย' | 'ทั้งวัน';
export type EggSaleUnitType = 'ฟอง' | 'แผง';
export type EggPaymentMethod = 'เงินสด' | 'โอนเงิน' | 'ค้างชำระ';

export interface RecorderInfo {
  id: string;
  name: string;
  photo_url: string | null;
}

export interface EggSettings {
  id: string;
  price_per_egg: number;
  price_per_tray: number;
  eggs_per_tray: number;
  flock_size: number;
  updated_by_staff_id: string | null;
  updated_by_administrator_id: string | null;
  updated_by_name: string | null;
  updated_at: string;
}

export interface UpdateEggSettingsInput {
  price_per_egg: number;
  price_per_tray: number;
  eggs_per_tray: number;
  flock_size: number;
  updated_by_staff_id?: string | null;
  updated_by_administrator_id?: string | null;
  updated_by_name?: string | null;
}

export interface EggCollection {
  id: string;
  collected_date: string;
  period: EggCollectionPeriod;
  good_eggs: number;
  cracked_eggs: number;
  spoiled_eggs: number;
  total_eggs: number;
  note: string | null;
  recorder_staff_id: string | null;
  recorder_administrator_id: string | null;
  recorder_name: string;
  created_at: string;
  updated_at: string;
  staff?: RecorderInfo | null;
  administrator?: RecorderInfo | null;
}

export interface CreateEggCollectionInput {
  collected_date: string;
  period: EggCollectionPeriod;
  good_eggs: number;
  cracked_eggs: number;
  spoiled_eggs: number;
  note?: string | null;
  recorder_staff_id?: string | null;
  recorder_administrator_id?: string | null;
  recorder_name: string;
}

export interface EggSale {
  id: string;
  sale_date: string;
  unit_type: EggSaleUnitType;
  quantity: number;
  eggs_count: number;
  unit_price: number;
  total_amount: number;
  buyer_name: string | null;
  payment_method: EggPaymentMethod;
  note: string | null;
  recorder_staff_id: string | null;
  recorder_administrator_id: string | null;
  recorder_name: string;
  created_at: string;
  updated_at: string;
  staff?: RecorderInfo | null;
  administrator?: RecorderInfo | null;
}

export interface CreateEggSaleInput {
  sale_date: string;
  unit_type: EggSaleUnitType;
  quantity: number;
  eggs_count: number;
  unit_price: number;
  total_amount: number;
  buyer_name?: string | null;
  payment_method: EggPaymentMethod;
  note?: string | null;
  recorder_staff_id?: string | null;
  recorder_administrator_id?: string | null;
  recorder_name: string;
}

const COLLECTION_SELECT =
  '*, staff:recorder_staff_id(id, name, photo_url), administrator:recorder_administrator_id(id, name, photo_url)';

const SALE_SELECT =
  '*, staff:recorder_staff_id(id, name, photo_url), administrator:recorder_administrator_id(id, name, photo_url)';

const DEFAULT_SETTINGS: EggSettings = {
  id: 'default',
  price_per_egg: 5,
  price_per_tray: 150,
  eggs_per_tray: 30,
  flock_size: 0,
  updated_by_staff_id: null,
  updated_by_administrator_id: null,
  updated_by_name: null,
  updated_at: new Date().toISOString(),
};

export const eggFarmService = {
  getSettings: async (): Promise<EggSettings> => {
    const { data, error } = await supabase
      .from('egg_settings' as never)
      .select('*')
      .eq('id', 'default')
      .maybeSingle();
    if (error) throw error;
    if (!data) return DEFAULT_SETTINGS;
    const row = data as Record<string, unknown>;
    return {
      ...(row as unknown as EggSettings),
      price_per_egg: Number(row.price_per_egg ?? 5),
      price_per_tray: Number(row.price_per_tray ?? 150),
      eggs_per_tray: Number(row.eggs_per_tray ?? 30),
      flock_size: Number(row.flock_size ?? 0),
    };
  },

  updateSettings: async (input: UpdateEggSettingsInput): Promise<EggSettings> => {
    const payload = {
      id: 'default',
      ...input,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('egg_settings' as never)
      .upsert(payload as never)
      .select('*')
      .single();
    if (error) throw error;
    return data as unknown as EggSettings;
  },

  listCollections: async (opts?: { from?: string; to?: string }): Promise<EggCollection[]> => {
    let q = supabase
      .from('egg_collections' as never)
      .select(COLLECTION_SELECT)
      .order('collected_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (opts?.from) q = q.gte('collected_date', opts.from);
    if (opts?.to) q = q.lte('collected_date', opts.to);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as unknown as EggCollection[];
  },

  createCollection: async (input: CreateEggCollectionInput): Promise<EggCollection> => {
    const { data, error } = await supabase
      .from('egg_collections' as never)
      .insert(input as never)
      .select(COLLECTION_SELECT)
      .single();
    if (error) throw error;
    return data as unknown as EggCollection;
  },

  updateCollection: async (
    id: string,
    input: Partial<CreateEggCollectionInput>,
  ): Promise<EggCollection> => {
    const { data, error } = await supabase
      .from('egg_collections' as never)
      .update({ ...input, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select(COLLECTION_SELECT)
      .single();
    if (error) throw error;
    return data as unknown as EggCollection;
  },

  deleteCollection: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('egg_collections' as never)
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  listSales: async (opts?: { from?: string; to?: string }): Promise<EggSale[]> => {
    let q = supabase
      .from('egg_sales' as never)
      .select(SALE_SELECT)
      .order('sale_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (opts?.from) q = q.gte('sale_date', opts.from);
    if (opts?.to) q = q.lte('sale_date', opts.to);
    const { data, error } = await q;
    if (error) throw error;
    return ((data ?? []) as unknown as EggSale[]).map((s) => ({
      ...s,
      unit_price: Number(s.unit_price),
      total_amount: Number(s.total_amount),
    }));
  },

  createSale: async (input: CreateEggSaleInput): Promise<EggSale> => {
    const { data, error } = await supabase
      .from('egg_sales' as never)
      .insert(input as never)
      .select(SALE_SELECT)
      .single();
    if (error) throw error;
    return data as unknown as EggSale;
  },

  updateSale: async (id: string, input: Partial<CreateEggSaleInput>): Promise<EggSale> => {
    const { data, error } = await supabase
      .from('egg_sales' as never)
      .update({ ...input, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select(SALE_SELECT)
      .single();
    if (error) throw error;
    return data as unknown as EggSale;
  },

  deleteSale: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('egg_sales' as never)
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
