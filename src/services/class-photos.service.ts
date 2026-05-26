/**
 * class-photos.service.ts
 * Group class photos with face tagging (Migration 096).
 */
import { supabase } from '@/integrations/supabase/client';

export type ClassPhoto = {
  id: string;
  title: string | null;
  class: string;
  room: string | null;
  photo_url: string;
  taken_at: string | null;
  caption: string | null;
  created_at: string;
};

export type PhotoTag = {
  id: string;
  photo_id: string;
  student_id: string;
  x_pct: number;
  y_pct: number;
  radius_pct: number;
};

export const classPhotosService = {
  async listByClass(className?: string): Promise<ClassPhoto[]> {
    let q = supabase
      .from('class_photos' as any)
      .select('*')
      .order('taken_at', { ascending: false })
      .order('created_at', { ascending: false });
    if (className) q = q.eq('class', className);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as ClassPhoto[];
  },

  async create(p: Omit<ClassPhoto, 'id' | 'created_at'>): Promise<ClassPhoto> {
    const { data: userResp } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('class_photos' as any)
      .insert({ ...p, uploaded_by: userResp.user?.id ?? null })
      .select('*')
      .single();
    if (error) throw error;
    return data as ClassPhoto;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('class_photos' as any).delete().eq('id', id);
    if (error) throw error;
  },

  async listTags(photoId: string): Promise<PhotoTag[]> {
    const { data, error } = await supabase
      .from('class_photo_tags' as any)
      .select('*')
      .eq('photo_id', photoId);
    if (error) throw error;
    return (data ?? []) as PhotoTag[];
  },

  async tagStudent(input: { photo_id: string; student_id: string; x_pct: number; y_pct: number; radius_pct?: number }): Promise<void> {
    const { data: userResp } = await supabase.auth.getUser();
    const { error } = await supabase.from('class_photo_tags' as any).upsert(
      { ...input, radius_pct: input.radius_pct ?? 4, tagged_by: userResp.user?.id ?? null },
      { onConflict: 'photo_id,student_id' },
    );
    if (error) throw error;
  },

  async removeTag(id: string): Promise<void> {
    const { error } = await supabase.from('class_photo_tags' as any).delete().eq('id', id);
    if (error) throw error;
  },
};
