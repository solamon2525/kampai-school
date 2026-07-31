/**
 * supplies.service.ts — พัสดุ / วัสดุพื้นฐาน (Migration 452)
 */
import { supabase } from '@/integrations/supabase/client';

export type SupplyItem = {
  id: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  min_stock: number;
  location: string | null;
  note: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SupplyRequestStatus = 'รออนุมัติ' | 'อนุมัติ' | 'จ่ายแล้ว' | 'ไม่อนุมัติ' | 'ยกเลิก';

export type SupplyRequest = {
  id: string;
  item_id: string;
  staff_id: string;
  quantity: number;
  purpose: string | null;
  status: SupplyRequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  item?: Pick<SupplyItem, 'id' | 'name' | 'unit' | 'stock' | 'category'> | null;
  staff?: { id: string; name: string; photo_url: string | null } | null;
};

const ITEM_SELECT = '*';
const REQ_SELECT =
  '*, item:item_id(id, name, unit, stock, category), staff:staff_id(id, name, photo_url)';

export const suppliesService = {
  listItems: async (activeOnly = true) => {
    let q = supabase.from('supply_items' as never).select(ITEM_SELECT).order('name');
    if (activeOnly) q = q.eq('is_active', true);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as SupplyItem[];
  },

  upsertItem: async (
    item: Partial<SupplyItem> & { name: string; category: string; unit: string; stock: number },
  ) => {
    const payload = { ...item, updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from('supply_items' as never)
      .upsert(payload as never)
      .select()
      .single();
    if (error) throw error;
    return data as SupplyItem;
  },

  setActive: async (id: string, is_active: boolean) => {
    const { error } = await supabase
      .from('supply_items' as never)
      .update({ is_active, updated_at: new Date().toISOString() } as never)
      .eq('id', id);
    if (error) throw error;
  },

  listRequests: async (opts?: { status?: SupplyRequestStatus; staffId?: string }) => {
    let q = supabase
      .from('supply_requests' as never)
      .select(REQ_SELECT)
      .order('created_at', { ascending: false });
    if (opts?.status) q = q.eq('status', opts.status);
    if (opts?.staffId) q = q.eq('staff_id', opts.staffId);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as SupplyRequest[];
  },

  countPending: async () => {
    const { count, error } = await supabase
      .from('supply_requests' as never)
      .select('*', { count: 'exact', head: true })
      .eq('status', 'รออนุมัติ');
    if (error) throw error;
    return count ?? 0;
  },

  createRequest: async (input: {
    item_id: string;
    staff_id: string;
    quantity: number;
    purpose?: string;
  }) => {
    const { data, error } = await supabase
      .from('supply_requests' as never)
      .insert({
        item_id: input.item_id,
        staff_id: input.staff_id,
        quantity: input.quantity,
        purpose: input.purpose ?? null,
        status: 'รออนุมัติ',
      } as never)
      .select(REQ_SELECT)
      .single();
    if (error) throw error;
    return data as SupplyRequest;
  },

  cancelMine: async (id: string) => {
    const { error } = await supabase
      .from('supply_requests' as never)
      .update({ status: 'ยกเลิก' } as never)
      .eq('id', id)
      .eq('status', 'รออนุมัติ');
    if (error) throw error;
  },

  approve: async (id: string, review_note?: string) => {
    const { data, error } = await supabase.rpc('approve_supply_request' as never, {
      p_request_id: id,
      p_review_note: review_note ?? null,
    } as never);
    if (error) throw error;
    return data as SupplyRequest;
  },

  reject: async (id: string, review_note?: string) => {
    const { data, error } = await supabase.rpc('reject_supply_request' as never, {
      p_request_id: id,
      p_review_note: review_note ?? null,
    } as never);
    if (error) throw error;
    return data as SupplyRequest;
  },

  lowStockItems: async () => {
    const items = await suppliesService.listItems(true);
    return items.filter((i) => Number(i.stock) <= Number(i.min_stock));
  },
};
