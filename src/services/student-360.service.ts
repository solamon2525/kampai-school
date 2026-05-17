/**
 * student-360.service.ts
 * Aggregator — รวมข้อมูลนักเรียนคนเดียวจากทุก source สำหรับ Student 360° Hub
 * ไม่ duplicate data — ทุกฟิลด์มาจาก source-of-truth table
 */
import { supabase } from '@/integrations/supabase/client';

export type Student360Profile = {
    id: string;
    student_code: string | null;
    name: string;
    first_name: string | null;
    last_name: string | null;
    nickname: string | null;
    photo_url: string | null;
    classroom: string | null;
    class_number: number | null;
    gender: string | null;
    birth_date: string | null;
    national_id: string | null;
    blood_type: string | null;
    religion: string | null;
    father_name: string | null;
    mother_name: string | null;
    guardian_name: string | null;
    parent_phone: string | null;
    current_address: string | null;
};

export type Student360Summary = {
    scores_count: number;
    avg_score: number | null;
    conduct_total: number | null;
    attendance_present_pct: number | null;
    home_visits_count: number;
    sdq_current_total: number | null;
    sdq_current_interpretation: string | null;
    documents_general_count: number;
    waste_total_amount: number | null;
    savings_total_amount: number | null;
};

export const student360Service = {
    getProfile: async (studentId: string): Promise<{ data: Student360Profile | null; error: Error | null }> => {
        const { data, error } = await supabase
            .from('students')
            .select('id, student_code, name, first_name, last_name, nickname, photo_url, class, class_number, gender, birth_date, national_id, blood_type, religion, father_name, mother_name, guardian_name, parent_phone, current_house_no, current_moo, current_tambon, current_amphoe, current_province')
            .eq('id', studentId)
            .maybeSingle();
        if (error || !data) return { data: null, error };
        const row = data as Record<string, unknown>;
        const addrParts = [
            row.current_house_no ? `${row.current_house_no}` : null,
            row.current_moo ? `หมู่ ${row.current_moo}` : null,
            row.current_tambon ? `ต.${row.current_tambon}` : null,
            row.current_amphoe ? `อ.${row.current_amphoe}` : null,
            row.current_province ? `จ.${row.current_province}` : null,
        ].filter(Boolean);
        return {
            data: {
                id: row.id as string,
                student_code: (row.student_code as string) ?? null,
                name: (row.name as string) ?? '',
                first_name: (row.first_name as string) ?? null,
                last_name: (row.last_name as string) ?? null,
                nickname: (row.nickname as string) ?? null,
                photo_url: (row.photo_url as string) ?? null,
                classroom: (row.class as string) ?? null,
                class_number: (row.class_number as number) ?? null,
                gender: (row.gender as string) ?? null,
                birth_date: (row.birth_date as string) ?? null,
                national_id: (row.national_id as string) ?? null,
                blood_type: (row.blood_type as string) ?? null,
                religion: (row.religion as string) ?? null,
                father_name: (row.father_name as string) ?? null,
                mother_name: (row.mother_name as string) ?? null,
                guardian_name: (row.guardian_name as string) ?? null,
                parent_phone: (row.parent_phone as string) ?? null,
                current_address: addrParts.join(' ') || null,
            },
            error: null,
        };
    },

    /** สำหรับ landing — list ของ students พร้อม basic profile */
    listStudents: async (params: { search?: string; classroom?: string }) => {
        let q = supabase
            .from('students')
            .select('id, student_code, name, first_name, last_name, photo_url, class, class_number, is_active')
            .eq('is_active', true)
            .order('class', { ascending: true })
            .order('class_number', { ascending: true });
        if (params.classroom) q = q.eq('class', params.classroom);
        if (params.search) {
            const s = params.search.trim();
            q = q.or(`name.ilike.%${s}%,first_name.ilike.%${s}%,last_name.ilike.%${s}%,student_code.ilike.%${s}%`);
        }
        const { data, error } = await q;
        return { data, error };
    },

    /** เก็บ list ห้องเรียนที่ unique สำหรับ filter */
    listClassrooms: async () => {
        const { data, error } = await supabase
            .from('students')
            .select('class')
            .eq('is_active', true);
        if (error || !data) return { data: null, error };
        const set = new Set<string>();
        (data as { class: string | null }[]).forEach((r) => { if (r.class) set.add(r.class); });
        return { data: Array.from(set).sort(), error: null };
    },
};
