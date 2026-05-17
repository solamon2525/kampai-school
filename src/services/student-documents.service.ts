/**
 * student-documents.service.ts
 * Student docs sub-hub: ทะเบียน, ปพ., SDQ, อาหาร, เยี่ยมบ้าน, ดูแลช่วยเหลือ
 */
import { supabase } from '@/integrations/supabase/client';

/**
 * Categories ที่ student_documents เก็บไว้จริง — ลบ registry/transcript/support
 * ออกแล้วเพราะมีตารางต้นทาง (students/score_records/counseling+special_needs)
 * เก็บเฉพาะหมวดที่ student_documents เป็น attachment ของ feature ใหม่ + general
 */
export type StudentDocCategoryKey =
    | 'home_visit' | 'health' | 'meal' | 'general';

export const STUDENT_DOC_CATEGORIES: {
    key: StudentDocCategoryKey; label: string; emoji: string; description: string;
}[] = [
    { key: 'home_visit',  label: 'เยี่ยมบ้าน',     emoji: '🏠', description: 'บันทึกการเยี่ยมบ้าน' },
    { key: 'health',      label: 'สุขภาพ / SDQ',   emoji: '🏥', description: 'SDQ + คัดกรอง' },
    { key: 'meal',        label: 'อาหาร/นม',       emoji: '🍱', description: 'อุดหนุนรายเด็ก' },
    { key: 'general',     label: 'เอกสารทั่วไป',   emoji: '📎', description: 'สำเนาบัตร/ทะเบียน/ใบเกิด' },
];

export type StudentDocument = {
    id: string;
    student_id: string;
    category_key: StudentDocCategoryKey | string;
    doc_date: string;
    title: string | null;
    file_url: string | null;
    notes: string | null;
    created_at: string;
};

export const studentDocumentsService = {
    listByStudent: async (studentId: string, category?: StudentDocCategoryKey) => {
        let q = supabase
            .from('student_documents' as never)
            .select('*')
            .eq('student_id', studentId)
            .order('doc_date', { ascending: false });
        if (category) q = q.eq('category_key', category);
        const { data, error } = await q;
        return { data: data as StudentDocument[] | null, error };
    },

    listByCategory: async (category: StudentDocCategoryKey) => {
        const { data, error } = await supabase
            .from('student_documents' as never)
            .select('*, student:student_id(id, first_name, last_name, photo_url, classroom)')
            .eq('category_key', category)
            .order('doc_date', { ascending: false })
            .limit(200);
        return { data, error };
    },

    countsByCategory: async (): Promise<{ data: Record<string, number> | null; error: Error | null }> => {
        const { data, error } = await supabase
            .from('student_documents' as never)
            .select('category_key');
        if (error || !data) return { data: null, error };
        const counts: Record<string, number> = {};
        (data as { category_key: string }[]).forEach((r) => {
            counts[r.category_key] = (counts[r.category_key] ?? 0) + 1;
        });
        return { data: counts, error: null };
    },

    create: async (doc: Omit<StudentDocument, 'id' | 'created_at'>) => {
        const { data: user } = await supabase.auth.getUser();
        return supabase.from('student_documents' as never)
            .insert({ ...doc, recorded_by: user.user?.id ?? null } as never)
            .select().single();
    },

    upload: async (studentId: string, category: StudentDocCategoryKey, file: File): Promise<{ url: string; error: Error | null }> => {
        const path = `${category}/${studentId}/${crypto.randomUUID()}-${file.name}`;
        const { error } = await supabase.storage.from('student-docs').upload(path, file);
        if (error) return { url: '', error };
        const { data } = await supabase.storage.from('student-docs').createSignedUrl(path, 60 * 60 * 24 * 30);
        return { url: data?.signedUrl ?? path, error: null };
    },

    remove: async (id: string) => supabase.from('student_documents' as never).delete().eq('id', id),
};
