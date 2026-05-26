/**
 * emergency.service.ts
 * One-click admin broadcast fanning out to Web Push + LINE OA + DB audit.
 */
import { supabase } from '@/integrations/supabase/client';

export type Severity = 'info' | 'warning' | 'critical';
export type Audience = 'all_parents' | 'all_staff' | 'all_users' | 'class_specific';

export interface EmergencyPayload {
  severity: Severity;
  title: string;
  body: string;
  url?: string;
  target_audience: Audience;
  target_class?: string;
}

export const SEVERITY_LABEL: Record<Severity, string> = {
  info: 'แจ้งให้ทราบ',
  warning: 'แจ้งเตือน',
  critical: 'ฉุกเฉิน',
};

export const SEVERITY_PREFIX: Record<Severity, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  critical: '🚨',
};

export const emergencyService = {
  /**
   * Resolve target user_ids based on audience selector.
   * Returns ALL relevant parents (or staff) from user_roles.
   */
  async resolveTargets(audience: Audience, targetClass?: string): Promise<string[]> {
    let q = supabase.from('user_roles' as any).select('user_id, role');

    if (audience === 'all_parents') q = q.eq('role', 'parent');
    else if (audience === 'all_staff') q = q.in('role', ['admin', 'teacher']);
    else if (audience === 'all_users') q = q.in('role', ['admin', 'teacher', 'parent']);
    else if (audience === 'class_specific') {
      // Parents whose linked student is in the target class
      if (!targetClass) return [];
      const { data: rows } = await supabase
        .from('parent_student_links' as any)
        .select('user_id, students!inner(class)')
        .eq('students.class', targetClass);
      return Array.from(new Set((rows as any[] ?? []).map((r) => r.user_id))).filter(Boolean);
    }

    const { data, error } = await q;
    if (error) throw error;
    return Array.from(new Set(((data as any[]) ?? []).map((r) => r.user_id))).filter(Boolean);
  },

  async send(payload: EmergencyPayload): Promise<{ alertId: string; pushSent: number; lineSent: number; totalTargets: number }> {
    const userIds = await this.resolveTargets(payload.target_audience, payload.target_class);
    if (!userIds.length) {
      throw new Error('ไม่พบผู้รับ — ตรวจสอบกลุ่มเป้าหมาย');
    }

    const prefix = SEVERITY_PREFIX[payload.severity];
    const formattedTitle = `${prefix} ${payload.title}`;
    const formattedBody = payload.body;

    // Fan out to BOTH channels in parallel
    const [pushResult, lineResult] = await Promise.all([
      supabase.functions
        .invoke('send-push', {
          body: {
            user_ids: userIds,
            topic: 'emergency',
            title: formattedTitle,
            body: formattedBody,
            url: payload.url ?? '/',
            tag: `emergency-${Date.now()}`,
          },
        })
        .then((r) => (r.data as any)?.sent ?? 0)
        .catch(() => 0),
      supabase.functions
        .invoke('line-send', {
          body: {
            user_ids: userIds,
            text: `${formattedTitle}\n\n${formattedBody}`,
            url: payload.url,
          },
        })
        .then((r) => (r.data as any)?.sent ?? 0)
        .catch(() => 0),
    ]);

    const { data: userResp } = await supabase.auth.getUser();
    const { data: insertResult, error } = await supabase
      .from('emergency_alerts' as any)
      .insert({
        severity: payload.severity,
        title: payload.title,
        body: payload.body,
        url: payload.url,
        target_audience: payload.target_audience,
        target_class: payload.target_class,
        sent_by: userResp.user?.id,
        push_sent_count: pushResult,
        line_sent_count: lineResult,
        total_targets: userIds.length,
      })
      .select('id')
      .single();
    if (error) throw error;

    return {
      alertId: (insertResult as any).id,
      pushSent: pushResult,
      lineSent: lineResult,
      totalTargets: userIds.length,
    };
  },

  async listRecent(limit = 20) {
    const { data, error } = await supabase
      .from('emergency_alerts' as any)
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },
};
