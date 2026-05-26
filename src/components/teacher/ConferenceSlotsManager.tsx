import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { CalendarClock, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { conferencesService } from '@/services/conferences.service';

export const ConferenceSlotsManager = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: '', time: '', duration: '15', location: 'ห้องครูประจำชั้น', notes: '' });

  const { data: slots = [] } = useQuery({
    queryKey: ['my-conference-slots'],
    queryFn: () => conferencesService.listMySlots(),
  });

  const { data: bookedIds = new Set<string>() } = useQuery({
    queryKey: ['booked-slot-ids'],
    queryFn: () => conferencesService.listBookedSlotIds(),
  });

  const create = useMutation({
    mutationFn: () =>
      conferencesService.createSlot({
        starts_at: new Date(`${form.date}T${form.time}`).toISOString(),
        duration_min: Number(form.duration),
        location: form.location || null,
        notes: form.notes || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-conference-slots'] });
      setOpen(false);
      setForm({ date: '', time: '', duration: '15', location: 'ห้องครูประจำชั้น', notes: '' });
      toast.success('เพิ่ม slot แล้ว — ผู้ปกครองจองได้');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => conferencesService.cancelSlot(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-conference-slots'] });
      toast.success('ยกเลิกแล้ว');
    },
  });

  const upcoming = slots.filter((s) => new Date(s.starts_at) > new Date() && !s.is_cancelled);
  const past = slots.filter((s) => new Date(s.starts_at) <= new Date() || s.is_cancelled);

  return (
    <div className="p-6 md:p-8 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <CalendarClock className="w-7 h-7 text-primary" />
            ตารางนัดผู้ปกครอง
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            เปิด slot ให้ผู้ปกครองจองนัด — แบบ Calendly
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-1.5" />
              เพิ่ม slot
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Slot นัดใหม่</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>วันที่</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <Label>เวลา</Label>
                  <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
                </div>
                <div>
                  <Label>ระยะเวลา (นาที)</Label>
                  <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
                </div>
                <div>
                  <Label>สถานที่</Label>
                  <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>หมายเหตุ (ไม่บังคับ)</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="เช่น โปรดเตรียมสมุดพก" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
              <Button onClick={() => create.mutate()} disabled={!form.date || !form.time || create.isPending}>
                {create.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                บันทึก
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Slot ที่จะถึง ({upcoming.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!upcoming.length && <p className="text-center text-sm text-muted-foreground py-6">ยังไม่มี slot ที่เปิด</p>}
          {upcoming.map((s) => {
            const booked = bookedIds.has(s.id);
            return (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {format(new Date(s.starts_at), 'EEEE d MMM yyyy · HH:mm', { locale: th })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.duration_min} นาที {s.location && `· ${s.location}`}
                    {s.notes && ` · ${s.notes}`}
                  </p>
                </div>
                {booked ? (
                  <Badge variant="default">มีผู้จอง</Badge>
                ) : (
                  <Badge variant="outline">ว่าง</Badge>
                )}
                <Button size="sm" variant="ghost" onClick={() => cancel.mutate(s.id)}>
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">ประวัติ ({past.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {past.slice(0, 10).map((s) => (
            <div key={s.id} className="flex items-center gap-2 p-2 rounded-md border border-border bg-card text-xs">
              <span className="text-muted-foreground">
                {format(new Date(s.starts_at), 'd MMM yyyy HH:mm', { locale: th })}
              </span>
              {s.is_cancelled && <Badge variant="destructive">ยกเลิก</Badge>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
