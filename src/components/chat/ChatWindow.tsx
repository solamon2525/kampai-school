import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Send, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthProvider';
import { chatService, type ChatMessage } from '@/services/chat.service';
import { cn } from '@/lib/utils';

interface ChatWindowProps {
  threadId: string;
  /** Display name of other party (shown in header) */
  otherName?: string;
  otherPhoto?: string | null;
  className?: string;
}

export const ChatWindow = ({ threadId, otherName, otherPhoto, className }: ChatWindowProps) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat-messages', threadId],
    queryFn: () => chatService.listMessages(threadId),
    refetchOnWindowFocus: true,
  });

  // Mark as read when opening + when new messages arrive while visible
  useEffect(() => {
    if (threadId) void chatService.markRead(threadId);
  }, [threadId, messages.length]);

  // Realtime subscription
  useEffect(() => {
    const channel = chatService.subscribeToThread(threadId, (msg) => {
      qc.setQueryData<ChatMessage[]>(['chat-messages', threadId], (prev) => {
        if (!prev) return [msg];
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Mark immediately if not from us
      if (msg.sender_user_id !== user?.id) {
        void chatService.markRead(threadId);
      }
    });
    return () => {
      void channel.unsubscribe();
    };
  }, [threadId, qc, user?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await chatService.sendMessage(threadId, text);
      setDraft('');
      qc.invalidateQueries({ queryKey: ['chat-messages', threadId] });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={cn('flex flex-col h-full bg-card border border-border rounded-xl overflow-hidden', className)}>
      {/* Header */}
      {otherName && (
        <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-muted/30">
          {otherPhoto ? (
            <img src={otherPhoto} alt="" className="w-9 h-9 rounded-full" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
              {otherName.charAt(0)}
            </div>
          )}
          <div>
            <p className="text-sm font-medium">{otherName}</p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              ตอบกลับช่วงเวลาทำการ 08:00–17:00
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-background">
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoading && !messages.length && (
          <p className="text-center text-sm text-muted-foreground py-12">
            ยังไม่มีข้อความ — เริ่มสนทนาได้เลย
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_user_id === user?.id;
          return (
            <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl px-3.5 py-2 shadow-sm',
                  mine ? 'bg-primary text-primary-foreground' : 'bg-card border border-border',
                )}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                <p className={cn(
                  'text-[10px] mt-1 flex items-center gap-1',
                  mine ? 'text-primary-foreground/70' : 'text-muted-foreground',
                )}>
                  {format(new Date(m.created_at), 'HH:mm', { locale: th })}
                  {mine && m.read_at && <span>· อ่านแล้ว</span>}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <div className="border-t border-border p-3 flex gap-2 bg-card">
        <Textarea
          rows={1}
          placeholder="พิมพ์ข้อความ..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          className="min-h-0 resize-none max-h-32"
        />
        <Button onClick={handleSend} disabled={!draft.trim() || sending} size="icon">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
};
