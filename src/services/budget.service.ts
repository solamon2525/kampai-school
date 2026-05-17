/**
 * budget.service.ts
 * Budget categories + transactions + summary view
 */
import { supabase } from '@/integrations/supabase/client';

export type BudgetCategory = {
    id: string;
    fiscal_year: number;
    code: string | null;
    name: string;
    allocated: number;
    description: string | null;
    created_at: string;
};

export type BudgetTxnType = 'เบิกจ่าย' | 'ผูกพัน' | 'โอน' | 'คืน';

export type BudgetTransaction = {
    id: string;
    category_id: string;
    txn_type: BudgetTxnType;
    amount: number;
    txn_date: string;
    doc_ref: string | null;
    vendor: string | null;
    note: string | null;
    posted_by: string | null;
    created_at: string;
};

export type BudgetSummary = {
    category_id: string;
    fiscal_year: number;
    code: string | null;
    name: string;
    allocated: number;
    paid: number;
    committed: number;
    refunded: number;
    remaining: number;
};

export const currentFiscalYearBE = (): number => {
    const now = new Date();
    const month = now.getMonth() + 1;
    // ปีงบประมาณไทยเริ่ม 1 ต.ค. → +543 และถ้า ≥ ต.ค. ให้บวก 1
    return now.getFullYear() + 543 + (month >= 10 ? 1 : 0);
};

export const budgetService = {
    listCategories: async (fiscalYear: number) => {
        const { data, error } = await supabase
            .from('budget_categories' as never)
            .select('*')
            .eq('fiscal_year', fiscalYear)
            .order('code', { ascending: true });
        return { data: data as BudgetCategory[] | null, error };
    },

    upsertCategory: async (cat: Partial<BudgetCategory> & { name: string; fiscal_year: number; allocated: number }) =>
        supabase.from('budget_categories' as never).upsert(cat as never).select().single(),

    deleteCategory: async (id: string) =>
        supabase.from('budget_categories' as never).delete().eq('id', id),

    listTransactions: async (categoryId?: string, fiscalYear?: number) => {
        let q = supabase
            .from('budget_transactions' as never)
            .select('*, category:category_id(name, fiscal_year, code)')
            .order('txn_date', { ascending: false });
        if (categoryId) q = q.eq('category_id', categoryId);
        const { data, error } = await q;
        if (error) return { data: null, error };
        let rows = (data ?? []) as Array<BudgetTransaction & { category?: { name: string; fiscal_year: number; code: string | null } }>;
        if (fiscalYear) rows = rows.filter((r) => r.category?.fiscal_year === fiscalYear);
        return { data: rows, error: null };
    },

    createTransaction: async (txn: Omit<BudgetTransaction, 'id' | 'created_at' | 'posted_by'>) => {
        const { data: user } = await supabase.auth.getUser();
        return supabase.from('budget_transactions' as never).insert({
            ...txn, posted_by: user.user?.id ?? null,
        } as never).select().single();
    },

    deleteTransaction: async (id: string) =>
        supabase.from('budget_transactions' as never).delete().eq('id', id),

    getSummary: async (fiscalYear: number) => {
        const { data, error } = await supabase
            .from('v_budget_summary' as never)
            .select('*')
            .eq('fiscal_year', fiscalYear)
            .order('code', { ascending: true });
        return { data: data as BudgetSummary[] | null, error };
    },
};
