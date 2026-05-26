import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isSameDay } from 'date-fns';
import { th } from 'date-fns/locale';
import { CalendarClock, Loader2, X, Check, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { conferencesService, type ConferenceSlot } from '@/services/conferences.service';
import { useActiveChild } from '@/hooks/useActiveChild';
import { supabase } from '@/integrations/supabase/client';

export const ConferenceBooking = () => {
  const { activeChild } = useActiveChild();
  const qc = useQueryClient();
  const [selectedSlot, setSelectedSlot] = useState<ConferenceSlot | null>(null);
  const [topic, setTopic] = useState('');

  const { data: openSlots = [] } = useQuery({
    queryKey: ['open-conference-slots'],
    queryFn: () => conferencesService.listOpenSlots(),
  });

  const { data: bookedIds = new Set<string>() } = useQuery({
    queryKey: ['booked-slot-ids'],
    queryFn: () => conferencesService.listBookedSlotIds(),
  });

  const { data: myBookings = [] } = useQuery({
    queryKey: ['my-conference-bookings'],
    queryFn: () => conferencesService.listMyBookings(),
  });

  const teacherIds = useMemo(
    () => Array.from(new Set(openSlots.map((s) => s.teacher_user_id))),
    [openSlots],
  );

  const { data: teacherMap = {} } = useQuery({
    queryKey: ['teacher-name-map', teacherIds.join(',')],
    enabled: teacherIds.length > 0,
    queryFn: async () => {
      const { data: roles } = await supabase
        .from('user_roles' as any)
        .select('user_id, staff_id')
        .in('user_id', teacherIds);
      const staffIds = ((roles as any[]) ?? []).map((r) => r.staff_id).filter(Boolean);
      if (!staffIds.length) return {};
      const { data: staff } = await supabase
        .from('staff')
        .select('id, name, photo_url, position')
        .in('id', staffIds);
      const staffById = new Map<string, any>((staff ?? []).map((s: any) => [s.id, s]));
      const map: Record<string, any> = {};
      for (const r of (roles as any[]) ?? []) {
        if (r.staff_id && staffById.has(r.staff_id)) map[r.user_id] = staffById.get(r.staff_id);
      }
      return map;
    },
  });

  const availableSlots = openSlots.filter((s) => !bookedIds.has(s.id));

  const book = useMutation({
    mutationFn: () =>
      conferencesService.book(selectedSlot!.id, topic || undefined, activeChild?.id ?? null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booked-slot-ids'] });
      qc.invalidateQueries({ queryKey: ['my-conference-bookings'] });
      setSelectedSlot(null);
      setTopic('');
      toast.success('จองสำเร็จ — ครูจะได้รับแจ้งเตือน');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => conferencesService.cancelBooking(id, 'ผู้ปกครองยกเลิก'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-conference-bookings'] });
      toast.success('ยกเลิกแล้ว');
    },
  });

  // Group slots by day
  const slotsByDay = useMemo(() => {
    const groups = new Map<string, ConferenceSlot[]>();
    for (const s of availableSlots) {
      const dayKey = format(new Date(s.starts_at), 'yyyy-MM-dd');
      if (!groups.has(dayKey)) groups.set(dayKey, []);
      groups.get(dayKey)!.push(s);
    }
    return Array.from(groups.entries()).sort();
  }, [availableSlots]);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarClock className="w-6 h-6 text-primary" />
          จองนัดครู
        </h1>
        {activeChild && (
          <p className="text-xs text-muted-foreground mt-0.5">
            จองสำหรับ {activeChild.name} · {activeChild.class}{activeChild.room ? `/${activeChild.room}` : ''}
          </p>
        )}
      </div>

      {/* My bookings */}
      {myBookings.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">การจองของฉัน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {myBookings.map((b) => {
              const slot = openSlots.find((s) => s.id === b.slot_id);
              return (
                <div key={b.id} className="flex items-center gap-2 p-3 rounded-lg border border-border bg-card">
                  <div className="flex-1 min-w-0">
                    {slot ? (
                      <>
                        <p className="text-sm font-medium">
                          {format(new Date(slot.starts_at), 'EEEE d MMM HH:mm', { locale: th })}
                          {' · '}
                          {teacherMap[slot.teacher_user_id]?.name ?? 'ครู'}
                        </p>
                        {b.topic && <p className="text-xs text-muted-foreground">เรื่อง: {b.topic}</p>}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">รายการเก่า</p>
                    )}
                  </div>
                  <Badge variant={
                    b.status === 'confirmed' ? 'default' :
                    b.status === 'cancelled' ? 'destructive' :
                    b.status === 'completed' ? 'secondary' : 'outline'
                  }>
                    {b.status === 'confirmed' ? 'ยืนยัน' : b.status === 'cancelled' ? 'ยกเลิก' : b.status === 'completed' ? 'เสร็จสิ้น' : 'ไม่มา'}
                  </Badge>
                  {b.status === 'confirmed' && (
                    <Button size="sm" variant="ghost" onClick={() => cancel.mutate(b.id)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Available slots */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Slot ว่างทั้งหมด</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!slotsByDay.length && (
            <p className="text-center text-sm text-muted-foreground py-8">
              ครูยังไม่ได้เปิด slot ว่าง — กลับมาเช็คใหม่หรือติดต่อครูประจำชั้นโดยตรง
            </p>
          )}
          {slotsByDay.map(([day, slots]) => (
            <div key={day}>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                {format(new Date(day), 'EEEE d MMM yyyy', { locale: th })}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                {slots.map((s) => {
                  const teacher = teacherMap[s.teacher_user_id];
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSlot(s)}
                      className="text-left p-2 rounded-md border border-border bg-card hover:border-primary hover:bg-primary/5 transition"
                    >
                      <div className="flex items-center gap-1 text-xs font-medium">
                        <Clock className="w-3 h-3" />
                        {format(new Date(s.starts_at), 'HH:mm')} ({s.duration_min}น)
                      </div>
                      {teacher && (
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{teacher.name}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={!!selectedSlot} onOpenChange={(v) => !v && setSelectedSlot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการจอง</DialogTitle>
          </DialogHeader>
          {selectedSlot && (
            <div className="space-y-3">
              <div className="p-3 bg-muted/40 rounded-md text-sm">
                <p className="font-medium">
                  {format(new Date(selectedSlot.starts_at), 'EEEE d MMM yyyy · HH:mm', { locale: th })}
                </p>
                <p className="text-xs text-muted-foreground">
                  ระยะเวลา {selectedSlot.duration_min} นาที
                  {selectedSlot.location && ` · ${selectedSlot.location}`}
                </p>
                {selectedSlot.notes && (
                  <p className="text-xs text-muted-foreground mt-1">หมายเหตุ: {selectedSlot.notes}</p>
                )}
                <p className="text-xs mt-2">
                  คุยกับ <strong>{teacherMap[selectedSlot.teacher_user_id]?.name ?? 'ครู'}</strong>
                </p>
              </div>
              <div>
                <Label>หัวข้อที่ต้องการคุย (ไม่บังคับ)</Label>
                <Textarea
                  rows={3}
                  placeholder="เช่น สอบถามเรื่องความก้าวหน้าด้านวิชาคณิตศาสตร์"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSlot(null)}>ยกเลิก</Button>
            <Button onClick={() => book.mutate()} disabled={book.isPending}>
              {book.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              ยืนยันจอง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
