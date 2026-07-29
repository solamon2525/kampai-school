/**
 * chat.service.ts
 * Realtime Chat between parent and teacher (Migration 089).
 */
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type ChatThread = {
  id: string;
  parent_user_id: string;
  teacher_user_id: string;
  student_id: string | null;
  subject: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  thread_id: string;
  sender_user_id: string;
  body: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  read_at: string | null;
  created_at: string;
};

export const chatService = {
  /** Threads visible to current user (parent or teacher). */
  async listThreads(): Promise<ChatThread[]> {
    const { data, error } = await supabase
      .from('chat_threads' as any)
      .select('*')
      .order('last_message_at', { ascending: false, nullsFirst: false });
    if (error) throw error;
    return (data ?? []) as ChatThread[];
  },

  /** Find or create a thread (idempotent). */
  async openThread(opts: {
    parent_user_id: string;
    teacher_user_id: string;
    student_id?: string | null;
    subject?: string;
  }): Promise<ChatThread> {
    // Try to find existing thread first
    const { data: existing } = await supabase
      .from('chat_threads' as any)
      .select('*')
      .eq('parent_user_id', opts.parent_user_id)
      .eq('teacher_user_id', opts.teacher_user_id)
      .eq('student_id', opts.student_id ?? null as any)
      .maybeSingle();
    if (existing) return existing as ChatThread;

    const { data, error } = await supabase
      .from('chat_threads' as any)
      .insert({
        parent_user_id: opts.parent_user_id,
        teacher_user_id: opts.teacher_user_id,
        student_id: opts.student_id ?? null,
        subject: opts.subject ?? null,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as ChatThread;
  },

  async listMessages(threadId: string, limit = 100): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages' as any)
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as ChatMessage[];
  },

  async sendMessage(
    threadId: string,
    body: string,
    opts?: { attachment_url?: string | null; attachment_type?: string | null },
  ): Promise<void> {
    const { data: userResp } = await supabase.auth.getUser();
    if (!userResp.user) throw new Error('Not authenticated');
    const text = body.trim();
    const attachment_url = opts?.attachment_url ?? null;
    const attachment_type = opts?.attachment_type ?? null;
    if (!text && !attachment_url) throw new Error('พิมพ์ข้อความหรือแนบไฟล์อย่างน้อยอย่างใดอย่างหนึ่ง');
    const { error } = await supabase
      .from('chat_messages' as any)
      .insert({
        thread_id: threadId,
        sender_user_id: userResp.user.id,
        body: text || null,
        attachment_url,
        attachment_type,
      });
    if (error) throw error;
  },

  /**
   * Upload an attachment to private bucket chat-attachments (path = {userId}/...).
   * Returns a signed URL (1 week) suitable for message.attachment_url.
   */
  async uploadAttachment(file: File): Promise<{ url: string; type: string; path: string }> {
    const { data: userResp } = await supabase.auth.getUser();
    if (!userResp.user) throw new Error('Not authenticated');
    const cleanName = file.name.replace(/[^\w.\-]+/g, '_');
    const path = `${userResp.user.id}/${Date.now()}_${crypto.randomUUID().slice(0, 8)}_${cleanName}`;
    const { error: upErr } = await supabase.storage.from('chat-attachments').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    });
    if (upErr) throw upErr;
    const { data: signed, error: signErr } = await supabase.storage
      .from('chat-attachments')
      .createSignedUrl(path, 60 * 60 * 24 * 7);
    if (signErr || !signed?.signedUrl) throw signErr ?? new Error('ไม่สามารถสร้างลิงก์ไฟล์ได้');
    const type = file.type.startsWith('image/')
      ? 'image'
      : file.type === 'application/pdf'
        ? 'pdf'
        : file.type.startsWith('audio/')
          ? 'audio'
          : file.type.startsWith('video/')
            ? 'video'
            : 'file';
    return { url: signed.signedUrl, type, path };
  },

  /** Mark unread messages (from other party) as read in this thread. */
  async markRead(threadId: string): Promise<void> {
    const { data: userResp } = await supabase.auth.getUser();
    if (!userResp.user) return;
    await supabase
      .from('chat_messages' as any)
      .update({ read_at: new Date().toISOString() })
      .eq('thread_id', threadId)
      .neq('sender_user_id', userResp.user.id)
      .is('read_at', null);
  },

  /** Subscribe to new messages in a thread. Caller must call channel.unsubscribe(). */
  subscribeToThread(threadId: string, onMessage: (msg: ChatMessage) => void): RealtimeChannel {
    return supabase
      .channel(`chat-${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => onMessage(payload.new as ChatMessage),
      )
      .subscribe();
  },

  /** Unread message count across all threads for current user. */
  async unreadCount(): Promise<number> {
    const { data: userResp } = await supabase.auth.getUser();
    if (!userResp.user) return 0;
    const { count } = await supabase
      .from('chat_messages' as any)
      .select('id', { count: 'exact', head: true })
      .neq('sender_user_id', userResp.user.id)
      .is('read_at', null);
    return count ?? 0;
  },
};
