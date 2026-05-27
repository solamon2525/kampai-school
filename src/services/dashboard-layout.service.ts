/**
 * dashboard-layout.service.ts
 * Per-user widget layout persistence (Migration 097).
 */
import { supabase } from '@/integrations/supabase/client';

export type WidgetConfig = { id: string; hidden?: boolean };

export const dashboardLayoutService = {
  async getMine(): Promise<WidgetConfig[]> {
    const { data: userResp } = await supabase.auth.getUser();
    if (!userResp.user) return [];
    const { data, error } = await supabase
      .from('user_dashboard_layout' as any)
      .select('widgets')
      .eq('user_id', userResp.user.id)
      .maybeSingle();
    if (error) throw error;
    return ((data as any)?.widgets ?? []) as WidgetConfig[];
  },

  async saveMine(widgets: WidgetConfig[]): Promise<void> {
    const { data: userResp } = await supabase.auth.getUser();
    if (!userResp.user) throw new Error('Not authenticated');
    const { error } = await supabase.from('user_dashboard_layout' as any).upsert(
      { user_id: userResp.user.id, widgets, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );
    if (error) throw error;
  },
};
