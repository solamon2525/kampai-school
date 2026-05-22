/**
 * meetings.service.ts
 * Supabase queries สำหรับ meetings + staff details
 */
import { supabase } from '@/integrations/supabase/client';

export type MeetingRecord = {
    id: string;
    title: string;
    meeting_date: string;
    meeting_time: string | null;
    location: string | null;
    attendees: string[] | null;
    agendas: string[] | null;
    decisions: string | null;
    minutes_url: string | null;
    staff_id: string | null;
    photos: string[] | null;
    created_at: string;
    staff?: {
        id: string;
        name: string;
        photo_url: string | null;
        position: string | null;
    } | null;
};

export const meetingsService = {
    /** ดึงทุกระเบียบวาระประชุมพร้อมรายละเอียดบุคลากร (เรียงตามวันที่ล่าสุด) */
    getAll: () =>
        supabase
            .from('meetings')
            .select('*, staff:staff_id(id, name, photo_url, position)')
            .order('meeting_date', { ascending: false }),

    /** ดึงรายการประชุมเฉพาะของครูที่บันทึก */
    getByStaff: (staffId: string) =>
        supabase
            .from('meetings')
            .select('*, staff:staff_id(id, name, photo_url, position)')
            .eq('staff_id', staffId)
            .order('meeting_date', { ascending: false }),

    /** เพิ่มบันทึกการประชุมใหม่ */
    insert: (data: Omit<MeetingRecord, 'id' | 'created_at' | 'staff'>) =>
        supabase.from('meetings').insert(data as never),

    /** อัปเดตบันทึกการประชุม */
    update: (id: string, data: Partial<Omit<MeetingRecord, 'id' | 'created_at' | 'staff'>>) =>
        supabase.from('meetings').update(data as never).eq('id', id),

    /** ลบบันทึกการประชุม */
    delete: (id: string) =>
        supabase.from('meetings').delete().eq('id', id),
};
