import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Send, Loader2, Clock, Paperclip, X, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthProvider';
import { chatService, type ChatMessage } from '@/services/chat.service';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat-messages', threadId],
    queryFn: () => chatService.listMessages(threadId),
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (threadId) void chatService.markRead(threadId);
  }, [threadId, messages.length]);

  useEffect(() => {
    const channel = chatService.subscribeToThread(threadId, (msg) => {
      qc.setQueryData<ChatMessage[]>(['chat-messages', threadId], (prev) => {
        if (!prev) return [msg];
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (msg.sender_user_id !== user?.id) {
        void chatService.markRead(threadId);
      }
    });
    return () => {
      void channel.unsubscribe();
    };
  }, [threadId, qc, user?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  useEffect(() => {
    if (!pendingFile || !pendingFile.type.startsWith('image/')) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  const clearAttachment = () => {
    setPendingFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSend = async () => {
    const text = draft.trim();
    if ((!text && !pendingFile) || sending) return;
    setSending(true);
    try {
      let attachment_url: string | undefined;
      let attachment_type: string | undefined;
      if (pendingFile) {
        const up = await chatService.uploadAttachment(pendingFile);
        attachment_url = up.url;
        attachment_type = up.type;
      }
      await chatService.sendMessage(threadId, text, { attachment_url, attachment_type });
      setDraft('');
      clearAttachment();
      qc.invalidateQueries({ queryKey: ['chat-messages', threadId] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'ส่งข้อความไม่สำเร็จ');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={cn('flex flex-col h-full bg-card border border-border rounded-xl overflow-hidden', className)}>
      {otherName && (
        <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-muted/30">
          {otherPhoto ? (
            <img src={otherPhoto} alt="" className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
              {otherName.charAt(0)}
            </div>
          )}
          <div>
            <p className="text-sm font-medium">{otherName}</p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              ตอบกลับช่วงเวลาทำการ 08:00–17:00 · แนบรูป/PDF ได้
            </p>
          </div>
        </div>
      )}

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
                  'max-w-[75%] rounded-2xl px-3.5 py-2 shadow-sm space-y-2',
                  mine ? 'bg-primary text-primary-foreground' : 'bg-card border border-border',
                )}
              >
                {m.attachment_url && (
                  m.attachment_type === 'image' ? (
                    <a href={m.attachment_url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={m.attachment_url}
                        alt=""
                        className="max-h-48 rounded-lg object-cover"
                      />
                    </a>
                  ) : (
                    <a
                      href={m.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'inline-flex items-center gap-1.5 text-xs underline-offset-2 hover:underline',
                        mine ? 'text-primary-foreground' : 'text-primary',
                      )}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      เปิดไฟล์แนบ
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )
                )}
                {m.body && <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>}
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

      {(pendingFile || previewUrl) && (
        <div className="px-3 pt-2 flex items-center gap-2 border-t border-border bg-muted/20">
          {previewUrl ? (
            <img src={previewUrl} alt="" className="h-12 w-12 rounded object-cover" />
          ) : (
            <FileText className="h-5 w-5 text-muted-foreground" />
          )}
          <span className="text-xs truncate flex-1">{pendingFile?.name}</span>
          <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={clearAttachment}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <div className="border-t border-border p-3 flex gap-2 bg-card items-end">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf,audio/*,video/mp4,video/webm"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            if (f && f.size > 10 * 1024 * 1024) {
              toast.error('ไฟล์ต้องไม่เกิน 10 MB');
              e.target.value = '';
              return;
            }
            setPendingFile(f);
          }}
        />
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={sending}
          aria-label="แนบไฟล์"
        >
          <Paperclip className="w-4 h-4" />
        </Button>
        <Textarea
          rows={1}
          placeholder="พิมพ์ข้อความ..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          className="min-h-0 resize-none max-h-32"
        />
        <Button onClick={() => void handleSend()} disabled={(!draft.trim() && !pendingFile) || sending} size="icon">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
};
