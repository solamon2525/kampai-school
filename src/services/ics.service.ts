/**
 * ics.service.ts
 * Internal Control System forms — ปย.1 / ปย.2 / ปย.3 (content jsonb)
 */
import { supabase } from '@/integrations/supabase/client';

export type IcsFormType = 'ปย.1' | 'ปย.2' | 'ปย.3';
export type IcsStatus = 'ร่าง' | 'ส่ง' | 'อนุมัติ';

export type IcsForm = {
    id: string;
    form_type: IcsFormType;
    fiscal_year: number;
    title: string;
    status: IcsStatus;
    content: Record<string, unknown>;
    prepared_by: string | null;
    prepared_at: string;
    approved_at: string | null;
    created_at: string;
};

export const icsService = {
    list: async (fiscalYear?: number) => {
        let q = supabase
            .from('ics_forms' as never)
            .select('*')
            .order('prepared_at', { ascending: false });
        if (fiscalYear) q = q.eq('fiscal_year', fiscalYear);
        const { data, error } = await q;
        return { data: data as IcsForm[] | null, error };
    },

    get: async (id: string) => {
        const { data, error } = await supabase
            .from('ics_forms' as never)
            .select('*')
            .eq('id', id)
            .single();
        return { data: data as IcsForm | null, error };
    },

    create: async (form: {
        form_type: IcsFormType; fiscal_year: number; title: string;
        content?: Record<string, unknown>; prepared_by?: string | null;
    }) =>
        supabase
            .from('ics_forms' as never)
            .insert({ ...form, content: form.content ?? {} } as never)
            .select()
            .single(),

    update: async (id: string, patch: Partial<Omit<IcsForm, 'id' | 'created_at'>>) =>
        supabase
            .from('ics_forms' as never)
            .update(patch as never)
            .eq('id', id)
            .select()
            .single(),

    remove: async (id: string) =>
        supabase.from('ics_forms' as never).delete().eq('id', id),
};
