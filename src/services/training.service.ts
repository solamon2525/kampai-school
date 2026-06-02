/**
 * training.service.ts
 * Supabase queries สำหรับ training_records + public view
 */
import { supabase } from '@/integrations/supabase/client';

export type TrainingType = 'อบรม' | 'สัมมนา' | 'ศึกษาดูงาน' | 'ประชุมวิชาการ' | 'รางวัล/เกียรติยศ';
export type TrainingStatus = 'สมัครแล้ว' | 'กำลังอบรม' | 'ผ่านการอบรม' | 'ไม่ผ่าน';

export type TrainingRecord = {
    id: string;
    staff_id: string | null;
    course_name: string;
    provider: string | null;
    training_type: string;
    start_date: string;
    end_date: string | null;
    hours: number;
    location: string | null;
    budget: number;
    certificate_url: string | null;
    status: string;
    notes: string | null;
    created_at: string;
    activity_photos: string[] | null;
    certificate_gen_id: string | null;
    staff?: {
        id: string;
        name: string;
        photo_url: string | null;
        position: string | null;
    } | null;
};

export type TrainingPublicRow = {
    id: string;
    course_name: string;
    provider: string | null;
    training_type: string;
    start_date: string;
    end_date: string | null;
    hours: number;
    certificate_url: string;
    academic_year_be: number;
    created_at: string;
};

/** เหมือน TrainingPublicRow แต่มี staff_id เพื่อ filter รายคน */
export type TrainingPerStaffRow = TrainingPublicRow & {
    staff_id: string;
};

export type TrainingPublicAggregate = {
    total_hours: number;
    total_count: number;
    total_staff: number;
    total_budget: number;
    by_type: Record<string, number> | null;
    by_year: Record<string, number> | null;
};

export const trainingService = {
    /** ดึงทุกระเบียนพร้อม join staff (admin only ตาม RLS) */
    getAll: () =>
        supabase
            .from('training_records')
            .select('*, staff:staff_id(id, name, photo_url, position)')
            .order('start_date', { ascending: false }),

    getByStaff: (staffId: string) =>
        supabase
            .from('training_records')
            .select('*')
            .eq('staff_id', staffId)
            .order('start_date', { ascending: false }),

    insert: (data: Omit<TrainingRecord, 'id' | 'created_at' | 'staff'>) =>
        supabase.from('training_records').insert(data as never),

    update: (id: string, data: Partial<Omit<TrainingRecord, 'id' | 'created_at' | 'staff'>>) =>
        supabase.from('training_records').update(data as never).eq('id', id),

    delete: (id: string) =>
        supabase.from('training_records').delete().eq('id', id),
};

export const trainingPublicService = {
    /** ดึงระเบียน public-safe (filter status='ผ่านการอบรม' + cert image) — ผ่าน VIEW */
    getCerts: () =>
        supabase
            // VIEW ใหม่ — generated types ยังไม่รู้จัก, ใช้ as never เพื่อ bypass (จะ regenerate ใน migration round ถัดไป)
            .from('training_public_view' as never)
            .select('*')
            .order('start_date', { ascending: false }),

    /** Aggregate stats สำหรับ hero band — ไม่ระบุตัวบุคคล */
    getAggregate: async (): Promise<{ data: TrainingPublicAggregate | null; error: Error | null }> => {
        const { data, error } = await supabase.rpc('get_training_public_aggregate' as never);
        if (error) return { data: null, error };
        return { data: data as unknown as TrainingPublicAggregate, error: null };
    },

    /** ดึงเกียรติบัตรของครูคนเดียว (public) — ผ่าน VIEW training_per_staff_view */
    getByStaff: (staffId: string) =>
        supabase
            .from('training_per_staff_view' as never)
            .select('*')
            .eq('staff_id', staffId)
            .order('start_date', { ascending: false }),
};
