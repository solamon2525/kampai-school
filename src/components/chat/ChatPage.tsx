import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import { MessageCircle, Plus, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthProvider';
import { useActiveChild } from '@/hooks/useActiveChild';
import { chatService, type ChatThread } from '@/services/chat.service';
import { staffService } from '@/services/staff.service';
import { ChatWindow } from './ChatWindow';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

/**
 * ChatPage — used by both /parent/chat and /teacher/chat routes.
 * Detects role from useAuth and shows the correct "other party" list.
 */
export const ChatPage = () => {
  const { user, role } = useAuth();
  const { activeChild, children: kids } = useActiveChild();
  const qc = useQueryClient();
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');

  const { data: threads = [] } = useQuery({
    queryKey: ['chat-threads', user?.id],
    queryFn: () => chatService.listThreads(),
    enabled: !!user,
    refetchOnWindowFocus: true,
  });

  // For parent: list teachers to start a new conversation with
  const { data: staff = [] } = useQuery({
    queryKey: ['staff-with-userids'],
    enabled: role === 'parent' && newDialogOpen,
    queryFn: async () => {
      // Get teachers via user_roles join
      const { data: roleRows } = await supabase
        .from('user_roles' as any)
        .select('user_id, staff_id, role')
        .eq('role', 'teacher');
      const staffIds = ((roleRows as any[]) ?? []).map((r) => r.staff_id).filter(Boolean);
      if (!staffIds.length) return [];
      const { data: staffRows } = await supabase
        .from('staff')
        .select('id, name, position, photo_url')
        .in('id', staffIds);
      const idToUserId = new Map<string, string>();
      for (const r of (roleRows as any[]) ?? []) if (r.staff_id) idToUserId.set(r.staff_id, r.user_id);
      return (staffRows ?? []).map((s: any) => ({
        ...s,
        user_id: idToUserId.get(s.id),
      })).filter((s: any) => s.user_id);
    },
  });

  // Resolve thread metadata: who is the OTHER party?
  const { data: peerMap = {} } = useQuery({
    queryKey: ['chat-peers', threads.map((t) => t.id).join(',')],
    enabled: threads.length > 0,
    queryFn: async () => {
      const otherUserIds = threads.map((t) => (user?.id === t.parent_user_id ? t.teacher_user_id : t.parent_user_id));
      // Try to find their staff or student profile via user_roles
      const { data: rows } = await supabase
        .from('user_roles' as any)
        .select('user_id, role, staff_id, student_id')
        .in('user_id', otherUserIds);
      const map: Record<string, { name: string; photo?: string | null; role: string }> = {};

      // Load staff profiles
      const staffIds = ((rows as any[]) ?? []).map((r) => r.staff_id).filter(Boolean);
      const studentIds = ((rows as any[]) ?? []).map((r) => r.student_id).filter(Boolean);
      const [staffData, studentData] = await Promise.all([
        staffIds.length
          ? supabase.from('staff').select('id, name, photo_url').in('id', staffIds)
          : Promise.resolve({ data: [] } as any),
        studentIds.length
          ? supabase.from('students').select('id, name, photo_url, parent_name').in('id', studentIds)
          : Promise.resolve({ data: [] } as any),
      ]);
      const staffById = new Map<string, any>((staffData.data ?? []).map((s: any) => [s.id, s]));
      const studentById = new Map<string, any>((studentData.data ?? []).map((s: any) => [s.id, s]));

      for (const r of (rows as any[]) ?? []) {
        if (r.staff_id && staffById.has(r.staff_id)) {
          const s = staffById.get(r.staff_id);
          map[r.user_id] = { name: s.name, photo: s.photo_url, role: 'teacher' };
        } else if (r.student_id && studentById.has(r.student_id)) {
          const s = studentById.get(r.student_id);
          map[r.user_id] = { name: s.parent_name ?? `ผู้ปกครองของ ${s.name}`, photo: null, role: 'parent' };
        } else {
          map[r.user_id] = { name: 'ผู้ใช้', role: r.role };
        }
      }
      return map;
    },
  });

  const startThread = useMutation({
    mutationFn: async ({ teacherUserId }: { teacherUserId: string }) => {
      const thread = await chatService.openThread({
        parent_user_id: user!.id,
        teacher_user_id: teacherUserId,
        student_id: activeChild?.id ?? null,
        subject: newSubject || undefined,
      });
      return thread;
    },
    onSuccess: (thread) => {
      setActiveThreadId(thread.id);
      setNewDialogOpen(false);
      setNewSubject('');
      qc.invalidateQueries({ queryKey: ['chat-threads', user?.id] });
    },
  });

  const activeThread = threads.find((t) => t.id === activeThreadId);
  const activePeer = activeThread
    ? peerMap[user?.id === activeThread.parent_user_id ? activeThread.teacher_user_id : activeThread.parent_user_id]
    : null;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-primary" />
            ข้อความ
          </h1>
          {role === 'parent' && activeChild && (
            <p className="text-xs text-muted-foreground mt-0.5">
              คุยกับครูเกี่ยวกับ {activeChild.name}
            </p>
          )}
        </div>
        {role === 'parent' && (
          <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1.5" />
                เริ่มสนทนาใหม่
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>เลือกครูที่ต้องการคุย</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <Input placeholder="เรื่อง (ไม่บังคับ)" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
                <div className="max-h-[50vh] overflow-y-auto space-y-1">
                  {staff.map((s: any) => (
                    <button
                      key={s.id}
                      onClick={() => startThread.mutate({ teacherUserId: s.user_id })}
                      disabled={startThread.isPending}
                      className="w-full text-left p-2 rounded-md hover:bg-muted transition flex items-center gap-3"
                    >
                      {s.photo_url ? (
                        <img src={s.photo_url} alt="" className="w-9 h-9 rounded-full" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {s.name?.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.position}</p>
                      </div>
                    </button>
                  ))}
                </div>
                {!staff.length && (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    ยังไม่มีครูในระบบ
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 h-[calc(100vh-200px)]">
        {/* Thread list */}
        <Card className="overflow-hidden">
          <CardContent className="p-2 h-full overflow-y-auto">
            {!threads.length && (
              <p className="text-center text-sm text-muted-foreground py-12">
                ยังไม่มีบทสนทนา
              </p>
            )}
            {threads.map((t) => {
              const otherUserId = user?.id === t.parent_user_id ? t.teacher_user_id : t.parent_user_id;
              const peer = peerMap[otherUserId];
              const active = activeThreadId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveThreadId(t.id)}
                  className={cn(
                    'w-full text-left p-3 rounded-md flex items-start gap-3 transition mb-1',
                    active ? 'bg-primary/10' : 'hover:bg-muted',
                  )}
                >
                  {peer?.photo ? (
                    <img src={peer.photo} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {peer?.name?.charAt(0) ?? '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{peer?.name ?? 'ผู้ใช้'}</p>
                      {t.last_message_at && (
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">
                          {formatDistanceToNow(new Date(t.last_message_at), { locale: th, addSuffix: false })}
                        </span>
                      )}
                    </div>
                    {t.subject && <p className="text-[10px] text-muted-foreground truncate">เรื่อง: {t.subject}</p>}
                    <p className="text-xs text-muted-foreground truncate">
                      {t.last_message_preview ?? <span className="italic">เริ่มสนทนา</span>}
                    </p>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Chat window */}
        {activeThread ? (
          <ChatWindow
            threadId={activeThread.id}
            otherName={activePeer?.name}
            otherPhoto={activePeer?.photo}
          />
        ) : (
          <Card>
            <CardContent className="h-full flex items-center justify-center text-sm text-muted-foreground">
              เลือกบทสนทนาจากรายการด้านซ้าย
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
