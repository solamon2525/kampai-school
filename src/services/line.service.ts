/**
 * line.service.ts
 * Wraps LINE OA integration (Migration 085 + edge functions line-webhook / line-send).
 */
import { supabase } from '@/integrations/supabase/client';

export type LineLink = {
  id: string;
  user_id: string | null;
  line_user_id: string;
  display_name: string | null;
  picture_url: string | null;
  language: string | null;
  is_followed: boolean;
  linked_at: string | null;
  followed_at: string;
  unfollowed_at: string | null;
};

export const lineService = {
  /** Current user's LINE link (RLS restricts to own row). */
  async getMyLink(): Promise<LineLink | null> {
    const { data: userResp } = await supabase.auth.getUser();
    if (!userResp.user) return null;
    const { data, error } = await supabase
      .from('line_user_links' as any)
      .select('*')
      .eq('user_id', userResp.user.id)
      .eq('is_followed', true)
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as LineLink | null;
  },

  /** Unlink (sets user_id = null, keeps follow record). Admin can also do this; users can do their own. */
  async unlinkMine(): Promise<void> {
    const { data: userResp } = await supabase.auth.getUser();
    if (!userResp.user) return;
    const { error } = await supabase
      .from('line_user_links' as any)
      .update({ user_id: null, linked_at: null })
      .eq('user_id', userResp.user.id);
    if (error) throw error;
  },

  /** Admin: list LINE followers (linked + unlinked). */
  async listAll(): Promise<LineLink[]> {
    const { data, error } = await supabase
      .from('line_user_links' as any)
      .select('*')
      .order('followed_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as LineLink[];
  },

  /** Admin: link a LINE follower to a Kampai user. */
  async linkFollower(linkId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('line_user_links' as any)
      .update({ user_id: userId, linked_at: new Date().toISOString() })
      .eq('id', linkId);
    if (error) throw error;
  },

  /** Admin/teacher: send a LINE text message to user_ids or raw line_user_ids. */
  async send(payload: {
    user_ids?: string[];
    line_user_ids?: string[];
    text: string;
    url?: string;
  }): Promise<{ sent: number; failed: number; total: number; note?: string }> {
    const { data, error } = await supabase.functions.invoke('line-send', { body: payload });
    if (error) throw new Error(error.message);
    return data as any;
  },
};
