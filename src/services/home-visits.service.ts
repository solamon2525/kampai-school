/**
 * home-visits.service.ts
 * บันทึกการเยี่ยมบ้านนักเรียน — visitors (array), findings, photo_urls (array)
 */
import { supabase } from '@/integrations/supabase/client';

export type HomeVisit = {
    id: string;
    student_id: string;
    visit_date: string;
    visitors: string[];
    findings: string | null;
    photo_urls: string[];
    created_at: string;
};

export const homeVisitsService = {
    listByStudent: async (studentId: string) => {
        const { data, error } = await supabase
            .from('student_home_visits' as never)
            .select('*')
            .eq('student_id', studentId)
            .order('visit_date', { ascending: false });
        return { data: data as HomeVisit[] | null, error };
    },

    create: async (row: Omit<HomeVisit, 'id' | 'created_at'>) =>
        supabase.from('student_home_visits' as never).insert(row as never).select().single(),

    update: async (id: string, patch: Partial<Omit<HomeVisit, 'id' | 'student_id' | 'created_at'>>) =>
        supabase.from('student_home_visits' as never).update(patch as never).eq('id', id),

    remove: async (id: string) =>
        supabase.from('student_home_visits' as never).delete().eq('id', id),

    uploadPhoto: async (studentId: string, file: File): Promise<{ url: string; error: Error | null }> => {
        const path = `home_visit/${studentId}/${crypto.randomUUID()}-${file.name}`;
        const { error } = await supabase.storage.from('student-docs').upload(path, file);
        if (error) return { url: '', error };
        const { data } = await supabase.storage.from('student-docs').createSignedUrl(path, 60 * 60 * 24 * 365);
        return { url: data?.signedUrl ?? path, error: null };
    },
};
