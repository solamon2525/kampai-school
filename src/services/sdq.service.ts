/**
 * sdq.service.ts
 * SDQ (Strengths and Difficulties Questionnaire) — Thai version, 25 items
 * Storage: student_sdq_responses (scores jsonb)
 */
import { supabase } from '@/integrations/supabase/client';

export type SdqResponse = {
    id: string;
    student_id: string;
    academic_year: number;
    scores: Record<string, number>;       // q1..q25 → 0|1|2
    total_score: number | null;
    interpretation: string | null;
    assessor_name: string | null;
    assessed_at: string;
};

export const sdqService = {
    listByStudent: async (studentId: string) => {
        const { data, error } = await supabase
            .from('student_sdq_responses' as never)
            .select('*')
            .eq('student_id', studentId)
            .order('academic_year', { ascending: false });
        return { data: data as SdqResponse[] | null, error };
    },

    getCurrent: async (studentId: string, year: number) => {
        const { data, error } = await supabase
            .from('student_sdq_responses' as never)
            .select('*')
            .eq('student_id', studentId)
            .eq('academic_year', year)
            .maybeSingle();
        return { data: data as SdqResponse | null, error };
    },

    upsert: async (row: {
        student_id: string; academic_year: number;
        scores: Record<string, number>; total_score: number;
        interpretation: string; assessor_name?: string | null;
    }) =>
        supabase
            .from('student_sdq_responses' as never)
            .upsert(
                { ...row, assessed_at: new Date().toISOString() } as never,
                { onConflict: 'student_id,academic_year' } as never,
            )
            .select()
            .single(),

    remove: async (id: string) =>
        supabase.from('student_sdq_responses' as never).delete().eq('id', id),
};
