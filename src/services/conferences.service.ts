/**
 * conferences.service.ts
 * Parent-teacher conference slot booking (Migration 092).
 */
import { supabase } from '@/integrations/supabase/client';

export type ConferenceSlot = {
  id: string;
  teacher_user_id: string;
  starts_at: string;
  duration_min: number;
  location: string | null;
  notes: string | null;
  is_published: boolean;
  is_cancelled: boolean;
  created_at: string;
};

export type ConferenceBooking = {
  id: string;
  slot_id: string;
  parent_user_id: string;
  student_id: string | null;
  topic: string | null;
  status: 'confirmed' | 'cancelled' | 'no_show' | 'completed';
  cancelled_reason: string | null;
  created_at: string;
};

export const conferencesService = {
  /** Teacher: list own slots (past + future). */
  async listMySlots(): Promise<ConferenceSlot[]> {
    const { data: userResp } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('conference_slots' as any)
      .select('*')
      .eq('teacher_user_id', userResp.user?.id ?? '')
      .order('starts_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as ConferenceSlot[];
  },

  /** Parent: list open slots (any teacher, future, not cancelled) + already-booked map. */
  async listOpenSlots(): Promise<ConferenceSlot[]> {
    const { data, error } = await supabase
      .from('conference_slots' as any)
      .select('*')
      .eq('is_published', true)
      .eq('is_cancelled', false)
      .gt('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as ConferenceSlot[];
  },

  async listBookedSlotIds(): Promise<Set<string>> {
    const { data } = await supabase
      .from('conference_bookings' as any)
      .select('slot_id')
      .eq('status', 'confirmed');
    return new Set(((data as any[]) ?? []).map((r) => r.slot_id));
  },

  async createSlot(s: { starts_at: string; duration_min: number; location?: string | null; notes?: string | null }): Promise<void> {
    const { data: userResp } = await supabase.auth.getUser();
    if (!userResp.user) throw new Error('Not authenticated');
    const { error } = await supabase.from('conference_slots' as any).insert({
      teacher_user_id: userResp.user.id,
      starts_at: s.starts_at,
      duration_min: s.duration_min,
      location: s.location ?? null,
      notes: s.notes ?? null,
    });
    if (error) throw error;
  },

  async cancelSlot(id: string): Promise<void> {
    const { error } = await supabase.from('conference_slots' as any).update({ is_cancelled: true }).eq('id', id);
    if (error) throw error;
  },

  async listMyBookings(): Promise<ConferenceBooking[]> {
    const { data, error } = await supabase
      .from('conference_bookings' as any)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as ConferenceBooking[];
  },

  async book(slotId: string, topic?: string, studentId?: string | null): Promise<void> {
    const { data: userResp } = await supabase.auth.getUser();
    if (!userResp.user) throw new Error('Not authenticated');
    const { error } = await supabase.from('conference_bookings' as any).insert({
      slot_id: slotId,
      parent_user_id: userResp.user.id,
      student_id: studentId ?? null,
      topic: topic ?? null,
    });
    if (error) throw error;

    // Best-effort push to teacher (DESIGN 14.29)
    try {
      const { data: slot } = await supabase
        .from('conference_slots' as any)
        .select('teacher_user_id, starts_at, location')
        .eq('id', slotId)
        .maybeSingle();
const slotRow = slot as { teacher_user_id?: string; starts_at?: string } | null;
      const teacherId = slotRow?.teacher_user_id;
      if (teacherId) {
        const when = slotRow?.starts_at
          ? new Date(slotRow.starts_at).toLocaleString('th-TH', {
              timeZone: 'Asia/Bangkok',
            })
          : '';
        await supabase.functions
          .invoke('send-push', {
            body: {
              user_ids: [teacherId],
              topic: 'conference',
              title: 'มีการจองประชุมผู้ปกครอง',
              body: topic ? `${topic}${when ? ` · ${when}` : ''}` : `นัดใหม่${when ? ` · ${when}` : ''}`,
              url: '/teacher/conferences',
              tag: `conference-book-${slotId}`,
            },
          })
          .catch(() => {});
      }
    } catch {
      // Non-fatal
    }
  },

  async cancelBooking(bookingId: string, reason?: string): Promise<void> {
    const { data: before } = await supabase
      .from('conference_bookings' as any)
      .select('id, slot_id, parent_user_id, topic')
      .eq('id', bookingId)
      .maybeSingle();

    const { error } = await supabase
      .from('conference_bookings' as any)
      .update({ status: 'cancelled', cancelled_reason: reason ?? null })
      .eq('id', bookingId);
    if (error) throw error;

    // Notify counterparty best-effort
    try {
      const booking = before as {
        slot_id?: string;
        parent_user_id?: string;
        topic?: string | null;
      } | null;
      if (!booking?.slot_id) return;
      const { data: userResp } = await supabase.auth.getUser();
      const { data: slot } = await supabase
        .from('conference_slots' as any)
        .select('teacher_user_id, starts_at')
        .eq('id', booking.slot_id)
        .maybeSingle();
      const teacherId = (slot as { teacher_user_id?: string } | null)?.teacher_user_id;
      const me = userResp.user?.id;
      const notifyId =
        me && teacherId && me === teacherId
          ? booking.parent_user_id
          : teacherId;
      if (!notifyId) return;
      await supabase.functions
        .invoke('send-push', {
          body: {
            user_ids: [notifyId],
            topic: 'conference',
            title: 'ยกเลิกนัดประชุมผู้ปกครอง',
            body: reason || booking.topic || 'มีการยกเลิกนัดแล้ว',
            url: me === teacherId ? '/parent/conferences' : '/teacher/conferences',
            tag: `conference-cancel-${bookingId}`,
          },
        })
        .catch(() => {});
    } catch {
      // Non-fatal
    }
  },
};
