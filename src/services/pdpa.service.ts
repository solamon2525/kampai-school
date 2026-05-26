/**
 * pdpa.service.ts
 * Consent tracking + data access logs + erasure requests (Migration 087).
 */
import { supabase } from '@/integrations/supabase/client';

export type ConsentScope =
  | 'photo_public'
  | 'photo_news'
  | 'line_msg'
  | 'push_notify'
  | 'data_sharing_moe'
  | 'data_sharing_thirdparty';

export type Consent = {
  id: string;
  user_id: string | null;
  student_id: string | null;
  scope: ConsentScope;
  granted: boolean;
  granted_at: string;
  revoked_at: string | null;
};

export type DataAccessLog = {
  id: string;
  actor_user_id: string | null;
  actor_role: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  subject_user_id: string | null;
  subject_student_id: string | null;
  details: any;
  created_at: string;
};

export type ErasureRequest = {
  id: string;
  requester_user_id: string;
  target_student_id: string | null;
  scope: 'photos' | 'attendance' | 'scores' | 'all';
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  review_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
};

export const SCOPE_LABELS: Record<ConsentScope, string> = {
  photo_public: 'อนุญาตเผยแพร่รูปภาพในเว็บไซต์โรงเรียน',
  photo_news: 'อนุญาตใช้รูปในข่าวสารและประชาสัมพันธ์',
  line_msg: 'อนุญาตรับข้อความผ่าน LINE OA',
  push_notify: 'อนุญาตรับ Push Notification',
  data_sharing_moe: 'อนุญาตแบ่งปันข้อมูลกับ สพฐ./MOE (DMC)',
  data_sharing_thirdparty: 'อนุญาตแบ่งปันข้อมูลกับ partner องค์กรอื่น',
};

export const pdpaService = {
  async myConsents(): Promise<Consent[]> {
    const { data, error } = await supabase
      .from('pdpa_consents' as any)
      .select('*')
      .order('granted_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Consent[];
  },

  async setConsent(scope: ConsentScope, granted: boolean, studentId?: string | null): Promise<void> {
    const { data: userResp } = await supabase.auth.getUser();
    if (!userResp.user) throw new Error('Not authenticated');
    const { error } = await supabase.from('pdpa_consents' as any).insert({
      user_id: userResp.user.id,
      student_id: studentId ?? null,
      scope,
      granted,
      revoked_at: granted ? null : new Date().toISOString(),
      source: 'parent_portal',
    });
    if (error) throw error;
  },

  async listAccessLogs(opts?: { studentId?: string; limit?: number }): Promise<DataAccessLog[]> {
    let q = supabase
      .from('data_access_logs' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(opts?.limit ?? 100);
    if (opts?.studentId) q = q.eq('subject_student_id', opts.studentId);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as DataAccessLog[];
  },

  async submitErasure(payload: {
    scope: 'photos' | 'attendance' | 'scores' | 'all';
    reason?: string;
    target_student_id?: string;
  }): Promise<void> {
    const { data: userResp } = await supabase.auth.getUser();
    if (!userResp.user) throw new Error('Not authenticated');
    const { error } = await supabase.from('pdpa_erasure_requests' as any).insert({
      requester_user_id: userResp.user.id,
      target_student_id: payload.target_student_id ?? null,
      scope: payload.scope,
      reason: payload.reason ?? null,
    });
    if (error) throw error;
  },

  async listErasureRequests(): Promise<ErasureRequest[]> {
    const { data, error } = await supabase
      .from('pdpa_erasure_requests' as any)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as ErasureRequest[];
  },

  async reviewErasure(id: string, status: 'approved' | 'rejected' | 'completed', notes?: string): Promise<void> {
    const { data: userResp } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('pdpa_erasure_requests' as any)
      .update({
        status,
        review_notes: notes ?? null,
        reviewed_by: userResp.user?.id ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;
  },
};
