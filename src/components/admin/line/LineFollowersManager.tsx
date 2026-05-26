import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Link2, Send, MessageCircle, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { lineService, type LineLink } from '@/services/line.service';
import { supabase } from '@/integrations/supabase/client';

export const LineFollowersManager = () => {
  const qc = useQueryClient();
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [activeLink, setActiveLink] = useState<LineLink | null>(null);
  const [userIdInput, setUserIdInput] = useState('');
  const [testText, setTestText] = useState('ทดสอบส่งข้อความจากระบบ Kampai 🟢');

  const { data: links = [], isLoading } = useQuery<LineLink[]>({
    queryKey: ['line-all-links'],
    queryFn: () => lineService.listAll(),
  });

  // Look up user emails for display (admin can read user_roles)
  const userIds = useMemo(() => links.map((l) => l.user_id).filter(Boolean) as string[], [links]);
  const { data: userMap = {} } = useQuery({
    queryKey: ['user-roles-emails', userIds.sort().join(',')],
    enabled: userIds.length > 0,
    queryFn: async () => {
      // Fetch via user_roles join — we don't have direct auth.users access from client
      const { data } = await supabase
        .from('user_roles' as any)
        .select('user_id, role')
        .in('user_id', userIds);
      const m: Record<string, string> = {};
      for (const r of (data as any[]) ?? []) m[r.user_id] = r.role;
      return m;
    },
  });

  const linkMutation = useMutation({
    mutationFn: ({ linkId, userId }: { linkId: string; userId: string }) =>
      lineService.linkFollower(linkId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['line-all-links'] });
      toast.success('ผูกบัญชีสำเร็จ');
      setLinkDialogOpen(false);
      setActiveLink(null);
      setUserIdInput('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const testSendMutation = useMutation({
    mutationFn: (lineUserId: string) =>
      lineService.send({ line_user_ids: [lineUserId], text: testText }),
    onSuccess: (r) => {
      toast.success(`ส่งเรียบร้อย — sent ${r.sent}/${r.total}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const linked = links.filter((l) => l.user_id && l.is_followed);
  const unlinked = links.filter((l) => !l.user_id && l.is_followed);
  const unfollowed = links.filter((l) => !l.is_followed);

  const Row = ({ link }: { link: LineLink }) => (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/40 transition">
      {link.picture_url ? (
        <img src={link.picture_url} alt="" className="w-10 h-10 rounded-full border border-border flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <MessageCircle className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{link.display_name || 'LINE User'}</p>
        <p className="text-[11px] text-muted-foreground truncate">
          {link.line_user_id}
          {link.user_id && userMap[link.user_id] && ` · ${userMap[link.user_id]}`}
        </p>
        <p className="text-[10px] text-muted-foreground">
          followed: {format(new Date(link.followed_at), 'd MMM yyyy', { locale: th })}
          {link.linked_at && ` · linked: ${format(new Date(link.linked_at), 'd MMM yyyy', { locale: th })}`}
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        {!link.user_id ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setActiveLink(link);
              setLinkDialogOpen(true);
            }}
          >
            <Link2 className="w-3.5 h-3.5 mr-1" />
            ผูก
          </Button>
        ) : (
          <Badge variant="outline" className="text-[10px]">
            <Check className="w-3 h-3 mr-0.5" />
            ผูกแล้ว
          </Badge>
        )}
        <Button
          size="sm"
          variant="ghost"
          disabled={testSendMutation.isPending}
          onClick={() => testSendMutation.mutate(link.line_user_id)}
        >
          <Send className="w-3.5 h-3.5 mr-1" />
          ทดสอบ
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-8 space-y-5 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <MessageCircle className="w-7 h-7 text-[#06C755]" />
          LINE Official Account
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          ผู้ติดตาม LINE OA ของโรงเรียน — ผูกบัญชีกับ Kampai เพื่อให้ระบบส่งแจ้งเตือนผ่าน LINE
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">ข้อความทดสอบ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea rows={2} value={testText} onChange={(e) => setTestText(e.target.value)} />
          <p className="text-[11px] text-muted-foreground">
            ใช้กับปุ่ม "ทดสอบ" ในแต่ละแถว — ส่งไปยังผู้ใช้ LINE คนนั้นเพื่อตรวจสอบการเชื่อมต่อ
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="unlinked">
        <TabsList>
          <TabsTrigger value="unlinked">รอผูก ({unlinked.length})</TabsTrigger>
          <TabsTrigger value="linked">ผูกแล้ว ({linked.length})</TabsTrigger>
          <TabsTrigger value="unfollowed">เลิกติดตาม ({unfollowed.length})</TabsTrigger>
        </TabsList>

        {isLoading && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" />
            กำลังโหลด...
          </div>
        )}

        <TabsContent value="unlinked" className="space-y-2 mt-3">
          {!isLoading && !unlinked.length && (
            <p className="text-center text-sm text-muted-foreground py-12">
              ยังไม่มีผู้ใช้ LINE ที่รอผูกบัญชี
            </p>
          )}
          {unlinked.map((l) => (
            <Row key={l.id} link={l} />
          ))}
        </TabsContent>

        <TabsContent value="linked" className="space-y-2 mt-3">
          {!isLoading && !linked.length && (
            <p className="text-center text-sm text-muted-foreground py-12">
              ยังไม่มีบัญชีที่ผูก LINE
            </p>
          )}
          {linked.map((l) => (
            <Row key={l.id} link={l} />
          ))}
        </TabsContent>

        <TabsContent value="unfollowed" className="space-y-2 mt-3">
          {!isLoading && !unfollowed.length && (
            <p className="text-center text-sm text-muted-foreground py-12">
              ไม่มีผู้ที่เลิกติดตาม
            </p>
          )}
          {unfollowed.map((l) => (
            <Row key={l.id} link={l} />
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ผูก LINE follower กับบัญชี Kampai</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {activeLink && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                {activeLink.picture_url && (
                  <img src={activeLink.picture_url} className="w-10 h-10 rounded-full" alt="" />
                )}
                <div>
                  <p className="text-sm font-medium">{activeLink.display_name}</p>
                  <p className="text-[10px] text-muted-foreground">{activeLink.line_user_id}</p>
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">User UUID ของ Kampai</label>
              <Input
                placeholder="เช่น 12345678-1234-1234-1234-123456789abc"
                value={userIdInput}
                onChange={(e) => setUserIdInput(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                หา UUID ได้จากหน้า "ตั้งค่า → ผู้ใช้และสิทธิ์" — copy ช่อง user_id ของบัญชีผู้ปกครอง
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              <X className="w-4 h-4 mr-1.5" />
              ยกเลิก
            </Button>
            <Button
              disabled={!userIdInput || !activeLink || linkMutation.isPending}
              onClick={() => activeLink && linkMutation.mutate({ linkId: activeLink.id, userId: userIdInput })}
            >
              <Link2 className="w-4 h-4 mr-1.5" />
              ผูก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
