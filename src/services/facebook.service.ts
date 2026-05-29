/**
 * facebook.service.ts
 * Wraps Facebook Page feed integration (Migration 102 + edge function facebook-fetch).
 *
 * Public reads: facebook_posts (cache) + RPC get_facebook_feed_meta (non-secret config).
 * Admin reads/writes: facebook_feed_config (RLS gated).
 */
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type FacebookPost = Database['public']['Tables']['facebook_posts']['Row'];
export type FacebookFeedConfig = Database['public']['Tables']['facebook_feed_config']['Row'];
export type FacebookFeedConfigInsert = Database['public']['Tables']['facebook_feed_config']['Insert'];
export type FacebookFeedConfigUpdate = Database['public']['Tables']['facebook_feed_config']['Update'];

export type FacebookFeedStatus = 'ok' | 'token_expired' | 'rate_limited' | 'error';

export type FacebookFeedMeta = {
  page_name: string | null;
  page_url: string | null;
  enabled: boolean;
  posts_count: number;
  refresh_interval_hours: number;
  last_fetched_at: string | null;
  last_status: FacebookFeedStatus | null;
};

export type RefreshResult = {
  ok: boolean;
  status?: FacebookFeedStatus | 'unknown';
  fetched_count?: number;
  error?: string;
  code?: number | string;
  skipped?: string;
};

export const facebookService = {
  /** Public: read non-secret config meta (omits access_token). */
  async getMeta(): Promise<FacebookFeedMeta | null> {
    const { data, error } = await supabase.rpc('get_facebook_feed_meta');
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;
    return row as FacebookFeedMeta;
  },

  /** Public: read cached posts (RLS allows anon SELECT). */
  async getRecentPosts(limit: number): Promise<FacebookPost[]> {
    const { data, error } = await supabase
      .from('facebook_posts')
      .select('id,message,created_time,full_picture,permalink_url,attachments,fetched_at')
      .order('created_time', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as FacebookPost[];
  },

  /** Fire-and-forget refresh trigger (calls edge function). Admin-only at server side. */
  async triggerRefresh(): Promise<RefreshResult> {
    const { data, error } = await supabase.functions.invoke('facebook-fetch', {
      method: 'POST',
      body: {},
    });
    if (error) return { ok: false, status: 'error', error: error.message };
    return (data ?? { ok: false }) as RefreshResult;
  },

  // ---- Admin only (RLS will reject for non-admin) ----

  async getConfig(): Promise<FacebookFeedConfig | null> {
    const { data, error } = await supabase
      .from('facebook_feed_config')
      .select('*')
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as FacebookFeedConfig | null;
  },

  async saveConfig(payload: FacebookFeedConfigInsert): Promise<FacebookFeedConfig> {
    const existing = await facebookService.getConfig();
    if (existing) {
      const { data, error } = await supabase
        .from('facebook_feed_config')
        .update(payload as FacebookFeedConfigUpdate)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return data as FacebookFeedConfig;
    }
    const { data, error } = await supabase
      .from('facebook_feed_config')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as FacebookFeedConfig;
  },
};
