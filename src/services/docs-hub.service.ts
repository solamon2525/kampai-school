/**
 * docs-hub.service.ts
 * Docs Hub Landing — รวม category meta, KPI, urgent documents
 * Tables/Views: doc_category_meta, v_docs_hub_kpi, v_urgent_documents
 */
import { supabase } from '@/integrations/supabase/client';

export type DocCategoryMeta = {
    key: string;
    label: string;
    emoji: string | null;
    icon_name: string;
    route: string;
    color_class: string;
    description: string | null;
    sort_order: number;
    is_active: boolean;
};

export type HubKpi = {
    active_this_month: number;
    pending_count: number;
    urgent_count: number;
    upcoming_meetings: number;
    training_this_month: number;
    outgoing_this_month: number;
};

export type UrgentDocEntityType = 'incoming' | 'outgoing' | 'leave';

export type RecentDocEntityType =
    | 'incoming' | 'outgoing' | 'order' | 'leave' | 'training'
    | 'budget' | 'sar' | 'ics' | 'project' | 'template';

export type RecentDoc = {
    entity_type: RecentDocEntityType;
    entity_id: string;
    title: string;
    status: string | null;
    event_at: string;
    staff_id: string | null;
};

export type CalendarItem = {
    source: 'meeting' | 'training' | 'leave' | 'project';
    source_id: string;
    title: string;
    start_date: string;
    end_date: string;
    location: string | null;
};

export type UrgentDoc = {
    entity_type: UrgentDocEntityType;
    entity_id: string;
    title: string;
    subtitle: string | null;
    badge: string | null;
    status: string | null;
    doc_date: string | null;
    due_date: string | null;
    staff_id: string | null;
    created_at: string;
    /** populated via separate join — only present for leave entries */
    staff?: {
        id: string;
        name: string;
        photo_url: string | null;
    } | null;
};

export const docsHubService = {
    /** หมวดเอกสารทั้งหมด เรียงตาม sort_order */
    listCategories: async (): Promise<{ data: DocCategoryMeta[] | null; error: Error | null }> => {
        const { data, error } = await supabase
            .from('doc_category_meta' as never)
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });
        return { data: data as DocCategoryMeta[] | null, error };
    },

    /** KPI สำหรับ ribbon บน Hub landing */
    getKpi: async (): Promise<{ data: HubKpi | null; error: Error | null }> => {
        const { data, error } = await supabase
            .from('v_docs_hub_kpi' as never)
            .select('*')
            .single();
        return { data: data as HubKpi | null, error };
    },

    /** urgent items list — รวม join staff สำหรับ leave (photo_url required ตาม DESIGN.md Rule 14.13) */
    listUrgentDocuments: async (limit = 12): Promise<{ data: UrgentDoc[] | null; error: Error | null }> => {
        const { data, error } = await supabase
            .from('v_urgent_documents' as never)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error || !data) return { data: null, error };

        const rows = data as UrgentDoc[];

        // ดึง staff_id ที่ปรากฏใน rows (เฉพาะ leave) แล้ว fetch photo_url พร้อม name
        const staffIds = Array.from(
            new Set(rows.filter((r) => r.staff_id).map((r) => r.staff_id!))
        );
        if (staffIds.length === 0) return { data: rows, error: null };

        const { data: staff, error: staffErr } = await supabase
            .from('staff')
            .select('id, name, photo_url')
            .in('id', staffIds);
        if (staffErr) return { data: rows, error: null };

        const staffMap = new Map<string, { id: string; name: string; photo_url: string | null }>();
        (staff ?? []).forEach((s) => staffMap.set(s.id, s));

        return {
            data: rows.map((r) => ({
                ...r,
                staff: r.staff_id ? staffMap.get(r.staff_id) ?? null : null,
            })),
            error: null,
        };
    },
};

// Phase 5: aggregation across all modules
export const docsHubAggregateService = {
    listRecentDocuments: async (limit = 20) => {
        const { data, error } = await supabase
            .from('v_recent_documents_unified' as never)
            .select('*')
            .order('event_at', { ascending: false })
            .limit(limit);
        return { data: data as RecentDoc[] | null, error };
    },

    listCalendar: async (startIso: string, endIso: string) => {
        const { data, error } = await supabase
            .from('v_aggregated_calendar' as never)
            .select('*')
            .gte('end_date', startIso)
            .lte('start_date', endIso)
            .order('start_date', { ascending: true });
        return { data: data as CalendarItem[] | null, error };
    },
};
