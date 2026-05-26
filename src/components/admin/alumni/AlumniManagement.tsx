import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { GraduationCap, Check, X, Star, Plus, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { alumniService } from '@/services/alumni.service';

export const AlumniManagement = () => {
  const qc = useQueryClient();
  const [newEventOpen, setNewEventOpen] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', description: '', event_date: '', event_time: '', location: '' });

  const { data: profiles = [] } = useQuery({
    queryKey: ['admin-alumni'],
    queryFn: () => alumniService.listAll(),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['admin-alumni-events'],
    queryFn: () => alumniService.listEvents(),
  });

  const verify = useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) => alumniService.verify(id, featured),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-alumni'] });
      toast.success('ยืนยันแล้ว');
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => alumniService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-alumni'] });
      toast.success('ลบแล้ว');
    },
  });

  const createEvent = useMutation({
    mutationFn: () =>
      alumniService.createEvent({
        title: eventForm.title,
        description: eventForm.description || null,
        cover_image_url: null,
        event_date: new Date(`${eventForm.event_date}T${eventForm.event_time}`).toISOString(),
        location: eventForm.location || null,
        is_published: true,
      } as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-alumni-events'] });
      setNewEventOpen(false);
      setEventForm({ title: '', description: '', event_date: '', event_time: '', location: '' });
      toast.success('สร้างกิจกรรมแล้ว');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pending = profiles.filter((p) => !p.is_verified);
  const verified = profiles.filter((p) => p.is_verified);

  return (
    <div className="p-6 md:p-8 space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-amber-600" />
            ศิษย์เก่า
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            ตรวจสอบและยืนยันโปรไฟล์ + จัดการกิจกรรมรวมรุ่น
          </p>
        </div>
        <Dialog open={newEventOpen} onOpenChange={setNewEventOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-1.5" />
              สร้างกิจกรรม
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>กิจกรรมศิษย์เก่าใหม่</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>ชื่องาน</Label><Input value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} /></div>
              <div><Label>คำอธิบาย</Label><Textarea rows={3} value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>วันที่</Label><Input type="date" value={eventForm.event_date} onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })} /></div>
                <div><Label>เวลา</Label><Input type="time" value={eventForm.event_time} onChange={(e) => setEventForm({ ...eventForm, event_time: e.target.value })} /></div>
                <div className="col-span-2"><Label>สถานที่</Label><Input value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewEventOpen(false)}>ยกเลิก</Button>
              <Button onClick={() => createEvent.mutate()} disabled={!eventForm.title || !eventForm.event_date || createEvent.isPending}>
                {createEvent.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                สร้าง
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            รอตรวจ
            {pending.length > 0 && <Badge variant="destructive" className="ml-2 text-[10px] h-4 px-1.5">{pending.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="verified">ยืนยันแล้ว ({verified.length})</TabsTrigger>
          <TabsTrigger value="events">กิจกรรม ({events.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-3 space-y-3">
          {!pending.length && <p className="text-center text-sm text-muted-foreground py-8">ไม่มีโปรไฟล์รอตรวจ</p>}
          {pending.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4 flex items-start gap-3">
                <PersonAvatar name={p.full_name} photoUrl={p.photo_url} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold">{p.full_name} {p.nickname && <span className="text-sm font-normal text-muted-foreground">({p.nickname})</span>}</p>
                  <p className="text-xs text-muted-foreground">รุ่น {p.graduation_year}{p.graduation_class && ` · ${p.graduation_class}`}</p>
                  {p.current_career && <p className="text-xs">{p.current_career} @ {p.current_workplace}</p>}
                  {p.bio && <p className="text-xs mt-1 line-clamp-2">{p.bio}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    ส่งเมื่อ {format(new Date(p.submitted_at), 'd MMM yyyy', { locale: th })}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => verify.mutate({ id: p.id, featured: true })}>
                    <Star className="w-3.5 h-3.5 mr-1" />
                    เด่น
                  </Button>
                  <Button size="sm" onClick={() => verify.mutate({ id: p.id, featured: false })}>
                    <Check className="w-3.5 h-3.5 mr-1" />
                    ยืนยัน
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove.mutate(p.id)}>
                    <X className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="verified" className="mt-3 space-y-2">
          {verified.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <PersonAvatar name={p.full_name} photoUrl={p.photo_url} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{p.full_name}</p>
                    {p.is_featured && <Badge variant="default" className="text-[10px]">เด่น</Badge>}
                  </div>
                  <p className="text-[11px] text-muted-foreground">รุ่น {p.graduation_year} · {p.current_career}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => remove.mutate(p.id)}>
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="events" className="mt-3 space-y-2">
          {events.map((e) => (
            <Card key={e.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-sm">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(e.event_date), 'EEEE d MMM yyyy HH:mm', { locale: th })}
                      {e.location && ` · ${e.location}`}
                    </p>
                    <p className="text-xs text-muted-foreground">ตอบรับ {e.attendee_count} คน</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};
