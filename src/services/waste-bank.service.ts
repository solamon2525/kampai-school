/**
 * waste-bank.service.ts
 * Supabase queries สำหรับ waste_categories, waste_transactions, waste_student_summary
 */
import { supabase } from '@/integrations/supabase/client';

// ─── Types ───────────────────────────────────────────────────────────────────
export type WasteCategory = {
  id: string;
  name: string;
  price_per_kg: number;
  icon: string | null;
  color: string | null;
  is_active: boolean | null;
  order_position: number | null;
};

export type WasteTransaction = {
  id: string;
  student_name: string;
  student_class: string;
  student_id: string | null;
  category_id: string | null;
  weight_kg: number;
  amount: number;
  transaction_date: string;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
  waste_categories?: { name: string; icon: string | null; color: string | null } | null;
  students?: { photo_url: string | null } | null;
};

export type WasteStudentSummary = {
  student_name: string | null;
  student_class: string | null;
  student_id: string | null;
  photo_url: string | null;
  student_code: string | null;
  total_transactions: number | null;
  total_weight: number | null;
  total_amount: number | null;
  last_transaction_date: string | null;
};

// ─── Categories ──────────────────────────────────────────────────────────────
export const wasteCategoriesService = {
  getActive: () =>
    supabase
      .from('waste_categories')
      .select('*')
      .eq('is_active', true)
      .order('order_position', { ascending: true }),

  insert: (data: Omit<WasteCategory, 'id'>) =>
    supabase.from('waste_categories').insert({ ...data, is_active: true, order_position: 99 } as never),

  update: (id: string, data: Partial<WasteCategory>) =>
    supabase.from('waste_categories').update(data as never).eq('id', id),

  /** soft delete */
  deactivate: (id: string) =>
    supabase.from('waste_categories').update({ is_active: false } as never).eq('id', id),
};

// ─── Transactions ─────────────────────────────────────────────────────────────
export const wasteTransactionsService = {
  getRecent: (limit = 50) =>
    supabase
      .from('waste_transactions')
      .select('*, waste_categories(name, icon, color), students(photo_url)')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit),

  insert: (data: Omit<WasteTransaction, 'id' | 'created_at' | 'waste_categories' | 'students'>) =>
    supabase.from('waste_transactions').insert(data as never),

  delete: (id: string) =>
    supabase.from('waste_transactions').delete().eq('id', id),
};

// ─── Summary VIEW ─────────────────────────────────────────────────────────────
export const wasteSummaryService = {
  getAll: () =>
    supabase
      .from('waste_student_summary')
      .select('student_name, student_class, student_id, photo_url, student_code, total_transactions, total_weight, total_amount, last_transaction_date'),
};
