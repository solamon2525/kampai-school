/**
 * cctv.service.ts
 * กล้องวงจรปิดโรงเรียน (Tapo/Vigi → HLS relay) — ดูได้เฉพาะครู/แอดมิน
 * RLS: SELECT teacher/admin, write admin only (migration 120)
 */
import { supabase } from '@/integrations/supabase/client';

export type CctvCamera = {
  id: string;
  name: string;
  location_label: string | null;
  lat: number | null;
  lng: number | null;
  hls_url: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export const cctvService = {
  /** กล้องที่เปิดใช้งาน เรียงตาม sort_order — ครู/แอดมินเท่านั้น (RLS) */
  async listCameras(): Promise<CctvCamera[]> {
    const { data, error } = await supabase
      .from('cctv_cameras' as any)
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as CctvCamera[];
  },

  /** ทุกกล้อง (รวมที่ปิด) — สำหรับหน้าจัดการแอดมิน */
  async listAll(): Promise<CctvCamera[]> {
    const { data, error } = await supabase
      .from('cctv_cameras' as any)
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as CctvCamera[];
  },

  async createCamera(c: Omit<CctvCamera, 'id' | 'created_at'>): Promise<void> {
    const { error } = await supabase.from('cctv_cameras' as any).insert(c);
    if (error) throw error;
  },

  async updateCamera(id: string, patch: Partial<CctvCamera>): Promise<void> {
    const { error } = await supabase.from('cctv_cameras' as any).update(patch).eq('id', id);
    if (error) throw error;
  },

  async deleteCamera(id: string): Promise<void> {
    const { error } = await supabase.from('cctv_cameras' as any).delete().eq('id', id);
    if (error) throw error;
  },
};
