/**
 * dismissal.service.ts
 * Pickup tracking (Migration 093). Staff scans student QR + selects
 * pickup person → log entry + push to parent.
 */
import { supabase } from '@/integrations/supabase/client';

export type PickupPerson = {
  id: string;
  student_id: string;
  name: string;
  relation: string;
  phone: string | null;
  national_id_last4: string | null;
  photo_url: string | null;
  is_primary: boolean;
  is_active: boolean;
  notes: string | null;
};

export type PickupLog = {
  id: string;
  student_id: string;
  pickup_person_id: string | null;
  pickup_person_name_snapshot: string;
  pickup_person_relation_snapshot: string | null;
  action: 'pickup' | 'self_dismiss' | 'bus_board' | 'bus_arrive_home' | 'left_school';
  recorded_at: string;
  notes: string | null;
};

export const dismissalService = {
  async listPickupPersons(studentId: string): Promise<PickupPerson[]> {
    const { data, error } = await supabase
      .from('pickup_persons' as any)
      .select('*')
      .eq('student_id', studentId)
      .eq('is_active', true)
      .order('is_primary', { ascending: false });
    if (error) throw error;
    return (data ?? []) as PickupPerson[];
  },

  async addPickupPerson(p: Omit<PickupPerson, 'id' | 'is_active'>): Promise<void> {
    const { error } = await supabase.from('pickup_persons' as any).insert(p);
    if (error) throw error;
  },

  async deactivatePickupPerson(id: string): Promise<void> {
    const { error } = await supabase
      .from('pickup_persons' as any)
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw error;
  },

  async recordPickup(args: {
    student_id: string;
    pickup_person_id?: string | null;
    pickup_person_name_snapshot: string;
    pickup_person_relation_snapshot?: string | null;
    action?: PickupLog['action'];
    notes?: string;
  }): Promise<PickupLog> {
    const { data: userResp } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('pickup_log' as any)
      .insert({
        ...args,
        action: args.action ?? 'pickup',
        recorded_by: userResp.user?.id,
      })
      .select('*')
      .single();
    if (error) throw error;

    // Best-effort: notify parents (push + LINE in parallel)
    try {
      const { data: studentResp } = await supabase
        .from('students')
        .select('name')
        .eq('id', args.student_id)
        .maybeSingle();
      const studentName = (studentResp as any)?.name ?? 'นักเรียน';
      const { data: parentRows } = await supabase.rpc('parents_of_student' as any, { p_student_id: args.student_id });
      const parentIds = ((parentRows as any[]) ?? []).map((r) => r.user_id);
      if (parentIds.length) {
        const title = 'แจ้งเตือนการรับ-ส่ง';
        const body = `${studentName} ถูกรับโดย ${args.pickup_person_name_snapshot}${args.pickup_person_relation_snapshot ? ` (${args.pickup_person_relation_snapshot})` : ''} เรียบร้อยแล้ว`;
        await Promise.all([
          supabase.functions.invoke('send-push', {
            body: { user_ids: parentIds, topic: 'dismissal', title, body, url: '/parent', tag: `pickup-${args.student_id}-${Date.now()}` },
          }).catch(() => {}),
          supabase.functions.invoke('line-send', {
            body: { user_ids: parentIds, text: `[โรงเรียนคำไผ่] ${title}\n${body}` },
          }).catch(() => {}),
        ]);
      }
    } catch {
      // Non-fatal
    }
    return data as PickupLog;
  },

  async listRecentLog(studentId?: string, limit = 50): Promise<PickupLog[]> {
    let q = supabase
      .from('pickup_log' as any)
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(limit);
    if (studentId) q = q.eq('student_id', studentId);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as PickupLog[];
  },
};
