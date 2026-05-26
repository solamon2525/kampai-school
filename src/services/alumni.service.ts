/**
 * alumni.service.ts
 * Alumni profiles + events + RSVP (Migration 095).
 */
import { supabase } from '@/integrations/supabase/client';

export type AlumniProfile = {
  id: string;
  full_name: string;
  nickname: string | null;
  graduation_year: number;
  graduation_class: string | null;
  current_school: string | null;
  current_career: string | null;
  current_workplace: string | null;
  photo_url: string | null;
  bio: string | null;
  contact_email_public: string | null;
  contact_phone_public: string | null;
  is_verified: boolean;
  is_featured: boolean;
  submitted_at: string;
};

export type AlumniEvent = {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  event_date: string;
  location: string | null;
  is_published: boolean;
  attendee_count: number;
};

export const alumniService = {
  async listVerified(): Promise<AlumniProfile[]> {
    const { data, error } = await supabase
      .from('alumni_profiles' as any)
      .select('*')
      .eq('is_verified', true)
      .order('is_featured', { ascending: false })
      .order('graduation_year', { ascending: false });
    if (error) throw error;
    return (data ?? []) as AlumniProfile[];
  },

  async listAll(): Promise<AlumniProfile[]> {
    const { data, error } = await supabase
      .from('alumni_profiles' as any)
      .select('*')
      .order('submitted_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as AlumniProfile[];
  },

  async submit(p: Omit<AlumniProfile, 'id' | 'is_verified' | 'is_featured' | 'submitted_at'>): Promise<void> {
    const { data: userResp } = await supabase.auth.getUser();
    const { error } = await supabase.from('alumni_profiles' as any).insert({
      ...p,
      user_id: userResp.user?.id ?? null,
    });
    if (error) throw error;
  },

  async verify(id: string, featured = false): Promise<void> {
    const { data: userResp } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('alumni_profiles' as any)
      .update({
        is_verified: true,
        is_featured: featured,
        verified_at: new Date().toISOString(),
        verified_by: userResp.user?.id ?? null,
      })
      .eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('alumni_profiles' as any).delete().eq('id', id);
    if (error) throw error;
  },

  async listEvents(): Promise<AlumniEvent[]> {
    const { data, error } = await supabase
      .from('alumni_events' as any)
      .select('*')
      .eq('is_published', true)
      .order('event_date', { ascending: true });
    if (error) throw error;
    return (data ?? []) as AlumniEvent[];
  },

  async createEvent(e: Omit<AlumniEvent, 'id' | 'attendee_count'>): Promise<void> {
    const { data: userResp } = await supabase.auth.getUser();
    const { error } = await supabase.from('alumni_events' as any).insert({
      ...e,
      created_by: userResp.user?.id ?? null,
    });
    if (error) throw error;
  },

  async rsvp(eventId: string, guest_name: string, guest_phone?: string, party_size = 1, notes?: string): Promise<void> {
    const { error } = await supabase.from('alumni_event_attendees' as any).insert({
      event_id: eventId,
      guest_name,
      guest_phone: guest_phone ?? null,
      party_size,
      notes: notes ?? null,
    });
    if (error) throw error;
  },
};
