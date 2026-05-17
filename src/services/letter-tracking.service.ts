/**
 * letter-tracking.service.ts
 * Timeline log สำหรับ saraban entities (incoming/outgoing/order/meeting/leave)
 * Trigger-driven — เขียนอัตโนมัติเมื่อ status เปลี่ยน (migration 050)
 */
import { supabase } from '@/integrations/supabase/client';

export type TrackingEntityType = 'incoming' | 'outgoing' | 'order' | 'meeting' | 'leave';

export type TrackingEntry = {
    id: string;
    entity_type: TrackingEntityType;
    entity_id: string;
    from_status: string | null;
    to_status: string;
    actor_id: string | null;
    actor_name: string | null;
    note: string | null;
    created_at: string;
};

export const letterTrackingService = {
    listTimeline: async (
        entityType: TrackingEntityType,
        entityId: string,
    ): Promise<{ data: TrackingEntry[] | null; error: Error | null }> => {
        const { data, error } = await supabase
            .from('letter_tracking_logs' as never)
            .select('*')
            .eq('entity_type', entityType)
            .eq('entity_id', entityId)
            .order('created_at', { ascending: false });
        return { data: data as TrackingEntry[] | null, error };
    },

    addNote: async (entityType: TrackingEntityType, entityId: string, note: string) => {
        const { data, error } = await supabase.rpc('add_tracking_note' as never, {
            p_entity_type: entityType,
            p_entity_id: entityId,
            p_note: note,
        });
        return { data, error };
    },
};
