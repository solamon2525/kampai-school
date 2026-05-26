import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { LogOut, Plus, Trash2, UserCheck, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { dismissalService, type PickupPerson } from '@/services/dismissal.service';
import { studentsService } from '@/services/students.service';

export const DismissalManagement = () => {
  const qc = useQueryClient();
  const [activeStudent, setActiveStudent] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [pickupOpen, setPickupOpen] = useState<{ studentId: string; studentName: string } | null>(null);
  const [newPersonOpen, setNewPersonOpen] = useState(false);
  const [personForm, setPersonForm] = useState({ name: '', relation: 'ผู้ปกครอง', phone: '', national_id_last4: '', is_primary: false });

  const { data: students = [] } = useQuery({
    queryKey: ['students-active-mini'],
    queryFn: async () => (await studentsService.getActive()).data ?? [],
  });

  const { data: persons = [] } = useQuery({
    queryKey: ['pickup-persons', activeStudent],
    enabled: !!activeStudent,
    queryFn: () => dismissalService.listPickupPersons(activeStudent!),
  });

  const { data: recentLog = [] } = useQuery({
    queryKey: ['pickup-log-recent'],
    queryFn: () => dismissalService.listRecentLog(undefined, 50),
    refetchInterval: 30_000,
  });

  const filteredStudents = students.filter((s: any) =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.student_code?.includes(search),
  );

  const addPerson = useMutation({
    mutationFn: () =>
      dismissalService.addPickupPerson({
        student_id: activeStudent!,
        name: personForm.name,
        relation: personForm.relation,
        phone: personForm.phone || null,
        national_id_last4: personForm.national_id_last4 || null,
        photo_url: null,
        is_primary: personForm.is_primary,
        notes: null,
      } as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pickup-persons', activeStudent] });
      setNewPersonOpen(false);
      setPersonForm({ name: '', relation: 'ผู้ปกครอง', phone: '', national_id_last4: '', is_primary: false });
      toast.success('เพิ่มผู้รับแล้ว');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const recordPickup = useMutation({
    mutationFn: (person: PickupPerson) =>
      dismissalService.recordPickup({
        student_id: pickupOpen!.studentId,
        pickup_person_id: person.id,
        pickup_person_name_snapshot: person.name,
        pickup_person_relation_snapshot: person.relation,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pickup-log-recent'] });
      setPickupOpen(null);
      toast.success('บันทึกการรับเรียบร้อย — แจ้งผู้ปกครองแล้ว');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => dismissalService.deactivatePickupPerson(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pickup-persons', activeStudent] }),
  });

  const studentMap = new Map(students.map((s: any) => [s.id, s]));

  return (
    <div className="p-6 md:p-8 space-y-5 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <LogOut className="w-7 h-7 text-orange-500" />
          ระบบรับ-ส่งนักเรียน
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          จัดการผู้รับที่อนุญาต + บันทึกการมารับ → แจ้งผู้ปกครองอัตโนมัติ (Push + LINE)
        </p>
      </div>

      <Tabs defaultValue="pickup">
        <TabsList>
          <TabsTrigger value="pickup">บันทึกการรับ</TabsTrigger>
          <TabsTrigger value="manage">จัดการผู้รับ</TabsTrigger>
          <TabsTrigger value="log">ประวัติ ({recentLog.length})</TabsTrigger>
        </TabsList>

        {/* Quick pickup mode */}
        <TabsContent value="pickup" className="mt-3 space-y-3">
          <Card>
            <CardContent className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาชื่อนักเรียน หรือรหัส"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {filteredStudents.slice(0, 50).map((s: any) => (
                  <button
                    key={s.id}
                    onClick={() => setPickupOpen({ studentId: s.id, studentName: s.name })}
                    className="text-left p-3 rounded-lg border border-border bg-card hover:border-primary hover:bg-primary/5 transition flex items-center gap-3"
                  >
                    <PersonAvatar name={s.name} photoUrl={s.photo_url} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {[s.class, s.room].filter(Boolean).join('/')}
                      </p>
                    </div>
                    <UserCheck className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manage authorized persons */}
        <TabsContent value="manage" className="mt-3">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
            <Card>
              <CardContent className="p-2 max-h-[60vh] overflow-y-auto space-y-1">
                {students.map((s: any) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveStudent(s.id)}
                    className={`w-full text-left p-2 rounded-md flex items-center gap-2 ${
                      activeStudent === s.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                    }`}
                  >
                    <PersonAvatar name={s.name} photoUrl={s.photo_url} size="xs" />
                    <span className="text-xs truncate">{s.name}</span>
                  </button>
                ))}
              </CardContent>
            </Card>

            {!activeStudent ? (
              <Card>
                <CardContent className="p-12 text-center text-sm text-muted-foreground">
                  เลือกนักเรียนเพื่อจัดการผู้รับ
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-sm">ผู้รับที่อนุญาต ({persons.length} คน)</CardTitle>
                    <Button size="sm" onClick={() => setNewPersonOpen(true)}>
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      เพิ่ม
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {!persons.length && (
                      <p className="text-center text-sm text-muted-foreground py-6">
                        ยังไม่มีผู้รับ — เพิ่มผู้ปกครอง, ญาติ, หรือผู้ที่ได้รับมอบหมาย
                      </p>
                    )}
                    {persons.map((p) => (
                      <div key={p.id} className="flex items-center gap-3 p-2 rounded-md border border-border bg-card">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {p.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium">{p.name}</p>
                            {p.is_primary && <Badge variant="default" className="text-[9px]">หลัก</Badge>}
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {p.relation}
                            {p.phone && ` · ${p.phone}`}
                            {p.national_id_last4 && ` · ปชช.…${p.national_id_last4}`}
                          </p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => remove.mutate(p.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* New person dialog */}
          <Dialog open={newPersonOpen} onOpenChange={setNewPersonOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>เพิ่มผู้รับที่อนุญาต</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>ชื่อ</Label>
                  <Input value={personForm.name} onChange={(e) => setPersonForm({ ...personForm, name: e.target.value })} placeholder="นายสมชาย พิทักษ์" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>ความสัมพันธ์</Label>
                    <Input value={personForm.relation} onChange={(e) => setPersonForm({ ...personForm, relation: e.target.value })} placeholder="บิดา / มารดา / ปู่ / ป้า" />
                  </div>
                  <div>
                    <Label>เบอร์โทร</Label>
                    <Input value={personForm.phone} onChange={(e) => setPersonForm({ ...personForm, phone: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>เลขปชช. 4 หลักท้าย (สำหรับยืนยันตัว)</Label>
                  <Input maxLength={4} value={personForm.national_id_last4} onChange={(e) => setPersonForm({ ...personForm, national_id_last4: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewPersonOpen(false)}>ยกเลิก</Button>
                <Button onClick={() => addPerson.mutate()} disabled={!personForm.name || addPerson.isPending}>
                  {addPerson.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  เพิ่ม
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="log" className="mt-3 space-y-1">
          {!recentLog.length && (
            <p className="text-center text-sm text-muted-foreground py-12">ยังไม่มีประวัติ</p>
          )}
          {recentLog.map((l) => {
            const student: any = studentMap.get(l.student_id);
            return (
              <div key={l.id} className="flex items-center gap-2 p-2 rounded-md border border-border bg-card text-sm">
                <PersonAvatar name={student?.name ?? '?'} photoUrl={student?.photo_url} size="xs" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{student?.name}</span>
                    {' '}
                    <span className="text-muted-foreground">รับโดย</span>
                    {' '}
                    <span className="font-medium">{l.pickup_person_name_snapshot}</span>
                    {l.pickup_person_relation_snapshot && (
                      <span className="text-muted-foreground"> ({l.pickup_person_relation_snapshot})</span>
                    )}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {format(new Date(l.recorded_at), 'd MMM HH:mm', { locale: th })}
                </span>
              </div>
            );
          })}
        </TabsContent>
      </Tabs>

      {/* Pickup confirmation dialog (select who picks up) */}
      <Dialog open={!!pickupOpen} onOpenChange={(v) => !v && setPickupOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>บันทึกการรับ — {pickupOpen?.studentName}</DialogTitle>
          </DialogHeader>
          <PickupSelector studentId={pickupOpen?.studentId} onSelect={(p) => recordPickup.mutate(p)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

const PickupSelector = ({ studentId, onSelect }: { studentId?: string; onSelect: (p: PickupPerson) => void }) => {
  const { data: persons = [], isLoading } = useQuery({
    queryKey: ['pickup-persons', studentId],
    enabled: !!studentId,
    queryFn: () => dismissalService.listPickupPersons(studentId!),
  });

  if (isLoading) return <div className="py-4 text-center"><Loader2 className="w-5 h-5 animate-spin" /></div>;

  if (!persons.length) {
    return (
      <p className="text-sm text-amber-600 py-4 text-center">
        ยังไม่ได้ลงทะเบียนผู้รับสำหรับนักเรียนคนนี้ — ไปแท็บ "จัดการผู้รับ" ก่อน
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground mb-2">ใครเป็นผู้มารับ?</p>
      {persons.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect(p)}
          className="w-full text-left p-3 rounded-lg border border-border bg-card hover:border-primary hover:bg-primary/5 transition flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-medium">
            {p.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{p.name}</p>
              {p.is_primary && <Badge variant="default" className="text-[9px]">หลัก</Badge>}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {p.relation}
              {p.phone && ` · ${p.phone}`}
            </p>
          </div>
          <UserCheck className="w-4 h-4 text-primary" />
        </button>
      ))}
    </div>
  );
};
