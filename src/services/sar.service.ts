/**
 * sar.service.ts
 * SAR (Self-Assessment Report) — 3 มาตรฐาน + indicators + assessments + evidence
 */
import { supabase } from '@/integrations/supabase/client';

export type SarStandard = {
    id: string; code: string; name: string;
    description: string | null; sort_order: number;
};

export type SarIndicator = {
    id: string; standard_id: string; code: string | null;
    name: string; sort_order: number;
};

export type SarAssessment = {
    id: string;
    academic_year: number;
    indicator_id: string;
    level: number | null;
    evidence_summary: string | null;
    assessor_name: string | null;
    updated_at: string;
};

export type SarEvidenceFile = {
    id: string;
    assessment_id: string;
    file_url: string;
    file_name: string | null;
    uploaded_at: string;
};

export const currentAcademicYearBE = (): number => {
    const now = new Date();
    const m = now.getMonth() + 1;
    return now.getFullYear() + 543 + (m >= 5 ? 0 : -1);
};

export const sarService = {
    listStandards: async () => {
        const { data, error } = await supabase
            .from('sar_standards' as never)
            .select('*')
            .order('sort_order', { ascending: true });
        return { data: data as SarStandard[] | null, error };
    },

    listIndicators: async () => {
        const { data, error } = await supabase
            .from('sar_indicators' as never)
            .select('*')
            .order('sort_order', { ascending: true });
        return { data: data as SarIndicator[] | null, error };
    },

    listAssessments: async (year: number) => {
        const { data, error } = await supabase
            .from('sar_assessments' as never)
            .select('*')
            .eq('academic_year', year);
        return { data: data as SarAssessment[] | null, error };
    },

    upsertAssessment: async (a: {
        academic_year: number; indicator_id: string;
        level: number | null; evidence_summary?: string | null; assessor_name?: string | null;
    }) =>
        supabase
            .from('sar_assessments' as never)
            .upsert(
                { ...a, updated_at: new Date().toISOString() } as never,
                { onConflict: 'academic_year,indicator_id' } as never,
            )
            .select()
            .single(),

    listEvidence: async (assessmentId: string) => {
        const { data, error } = await supabase
            .from('sar_evidence_files' as never)
            .select('*')
            .eq('assessment_id', assessmentId)
            .order('uploaded_at', { ascending: false });
        return { data: data as SarEvidenceFile[] | null, error };
    },

    uploadEvidence: async (assessmentId: string, file: File) => {
        const path = `${assessmentId}/${crypto.randomUUID()}-${file.name}`;
        const { error: upErr } = await supabase.storage
            .from('sar-evidence')
            .upload(path, file, { contentType: file.type });
        if (upErr) return { data: null, error: upErr };
        const { data: signed } = await supabase.storage
            .from('sar-evidence')
            .createSignedUrl(path, 60 * 60 * 24 * 7);
        const url = signed?.signedUrl ?? path;
        const { data, error } = await supabase
            .from('sar_evidence_files' as never)
            .insert({ assessment_id: assessmentId, file_url: url, file_name: file.name } as never)
            .select()
            .single();
        return { data: data as SarEvidenceFile | null, error };
    },

    deleteEvidence: async (id: string) =>
        supabase.from('sar_evidence_files' as never).delete().eq('id', id),
};
