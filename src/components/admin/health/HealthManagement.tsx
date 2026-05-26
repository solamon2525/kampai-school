import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Heart, Plus, Trash2, Syringe, Activity, AlertTriangle, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { healthService } from '@/services/health.service';
import { studentsService } from '@/services/students.service';

const COMMON_VACCINES = [
  'BCG', 'HBV', 'DTP-HB-Hib', 'OPV', 'IPV', 'MMR', 'JE', 'HPV', 'COVID-19', 'Influenza',
];

export const HealthManagement = () => {
  const qc = useQueryClient();
  const [activeStudent, setActiveStudent] = useState<string | null>(null);

  const { data: students = [] } = useQuery({
    queryKey: ['students-active-mini'],
    queryFn: async () => {
      const r = await studentsService.getActive();
      return r.data ?? [];
    },
  });

  const student = students.find((s: any) => s.id === activeStudent) as any;

  const { data: record } = useQuery({
    queryKey: ['health-record', activeStudent],
    enabled: !!activeStudent,
    queryFn: () => healthService.getRecord(activeStudent!),
  });

  const { data: vaccinations = [] } = useQuery({
    queryKey: ['vaccinations', activeStudent],
    enabled: !!activeStudent,
    queryFn: () => healthService.listVaccinations(activeStudent!),
  });

  const { data: growth = [] } = useQuery({
    queryKey: ['growth', activeStudent],
    enabled: !!activeStudent,
    queryFn: () => healthService.listGrowth(activeStudent!),
  });

  const [recordForm, setRecordForm] = useState<any>({});
  const [vaccForm, setVaccForm] = useState({ vaccine_name: '', dose_number: '', given_date: '', next_dose_date: '' });
  const [growthForm, setGrowthForm] = useState({ measured_at: format(new Date(), 'yyyy-MM-dd'), weight_kg: '', height_cm: '' });

  const saveRecord = useMutation({
    mutationFn: () =>
      healthService.upsertRecord({
        student_id: activeStudent!,
        ...recordForm,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['health-record', activeStudent] });
      toast.success('บันทึกแล้ว');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addVacc = useMutation({
    mutationFn: () =>
      healthService.addVaccination({
        student_id: activeStudent!,
        vaccine_name: vaccForm.vaccine_name,
        dose_number: vaccForm.dose_number ? Number(vaccForm.dose_number) : null,
        given_date: vaccForm.given_date,
        given_by: null,
        next_dose_date: vaccForm.next_dose_date || null,
        notes: null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vaccinations', activeStudent] });
      setVaccForm({ vaccine_name: '', dose_number: '', given_date: '', next_dose_date: '' });
      toast.success('บันทึกวัคซีนแล้ว');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delVacc = useMutation({
    mutationFn: (id: string) => healthService.deleteVaccination(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vaccinations', activeStudent] }),
  });

  const addGrowth = useMutation({
    mutationFn: () =>
      healthService.addGrowth({
        student_id: activeStudent!,
        measured_at: growthForm.measured_at,
        weight_kg: growthForm.weight_kg ? Number(growthForm.weight_kg) : null,
        height_cm: growthForm.height_cm ? Number(growthForm.height_cm) : null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['growth', activeStudent] });
      setGrowthForm({ measured_at: format(new Date(), 'yyyy-MM-dd'), weight_kg: '', height_cm: '' });
      toast.success('บันทึกแล้ว');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delGrowth = useMutation({
    mutationFn: (id: string) => healthService.deleteGrowth(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['growth', activeStudent] }),
  });

  return (
    <div className="p-6 md:p-8 space-y-5 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Heart className="w-7 h-7 text-rose-500" />
          ข้อมูลสุขภาพนักเรียน
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          น้ำหนัก/ส่วนสูง, วัคซีน, การแพ้, ผู้ติดต่อฉุกเฉิน — ใช้ใน DMC export และเหตุฉุกเฉิน
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* Student list */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">นักเรียน ({students.length} คน)</CardTitle>
          </CardHeader>
          <CardContent className="p-2 max-h-[70vh] overflow-y-auto space-y-1">
            {students.map((s: any) => (
              <button
                key={s.id}
                onClick={() => {
                  setActiveStudent(s.id);
                  setRecordForm({});
                }}
                className={`w-full text-left p-2 rounded-md transition flex items-center gap-2 ${
                  activeStudent === s.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                }`}
              >
                <PersonAvatar name={s.name} photoUrl={s.photo_url} size="xs" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {[s.class, s.room].filter(Boolean).join('/')}
                  </p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Detail panel */}
        <div className="space-y-4">
          {!activeStudent ? (
            <Card>
              <CardContent className="p-12 text-center text-sm text-muted-foreground">
                เลือกนักเรียนเพื่อดู/บันทึกข้อมูลสุขภาพ
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <PersonAvatar name={student?.name ?? ''} photoUrl={student?.photo_url} size="md" />
                    <div>
                      <CardTitle className="text-base">{student?.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {[student?.class, student?.room].filter(Boolean).join('/')} {student?.student_code ? `· ${student.student_code}` : ''}
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Tabs defaultValue="profile">
                <TabsList>
                  <TabsTrigger value="profile">
                    <Heart className="w-3.5 h-3.5 mr-1.5" />
                    โปรไฟล์
                  </TabsTrigger>
                  <TabsTrigger value="vacc">
                    <Syringe className="w-3.5 h-3.5 mr-1.5" />
                    วัคซีน ({vaccinations.length})
                  </TabsTrigger>
                  <TabsTrigger value="growth">
                    <Activity className="w-3.5 h-3.5 mr-1.5" />
                    น้ำหนัก/ส่วนสูง ({growth.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-3 space-y-3">
                  <Card>
                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>กรุ๊ปเลือด</Label>
                        <Select
                          value={recordForm.blood_type ?? record?.blood_type ?? ''}
                          onValueChange={(v) => setRecordForm({ ...recordForm, blood_type: v })}
                        >
                          <SelectTrigger><SelectValue placeholder="เลือก..." /></SelectTrigger>
                          <SelectContent>
                            {['A', 'B', 'AB', 'O', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bt) => (
                              <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label>สถานะฟัน</Label>
                        <Input
                          placeholder="เช่น ฟันผุ 2 ซี่, สุขภาพช่องปากดี"
                          value={recordForm.dental_status ?? record?.dental_status ?? ''}
                          onChange={(e) => setRecordForm({ ...recordForm, dental_status: e.target.value })}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label>สายตา ซ้าย/ขวา</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="20/20"
                            value={recordForm.vision_left ?? record?.vision_left ?? ''}
                            onChange={(e) => setRecordForm({ ...recordForm, vision_left: e.target.value })}
                          />
                          <Input
                            placeholder="20/20"
                            value={recordForm.vision_right ?? record?.vision_right ?? ''}
                            onChange={(e) => setRecordForm({ ...recordForm, vision_right: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          อาการแพ้ (คั่นด้วย ,)
                        </Label>
                        <Input
                          placeholder="ถั่ว, นม, ฝุ่น"
                          value={(recordForm.allergies ?? record?.allergies ?? []).join(', ')}
                          onChange={(e) =>
                            setRecordForm({
                              ...recordForm,
                              allergies: e.target.value.split(',').map((x) => x.trim()).filter(Boolean),
                            })
                          }
                        />
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <Label>ยาประจำตัว</Label>
                        <Textarea
                          rows={2}
                          placeholder="เช่น Salbutamol สำหรับโรคหอบ"
                          value={recordForm.medications ?? record?.medications ?? ''}
                          onChange={(e) => setRecordForm({ ...recordForm, medications: e.target.value })}
                        />
                      </div>

                      <div className="space-y-1.5 md:col-span-2 pt-2 border-t border-border">
                        <Label className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          ผู้ติดต่อฉุกเฉิน
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <Input
                            placeholder="ชื่อ"
                            value={recordForm.emergency_contact_name ?? record?.emergency_contact_name ?? ''}
                            onChange={(e) => setRecordForm({ ...recordForm, emergency_contact_name: e.target.value })}
                          />
                          <Input
                            placeholder="เบอร์โทร"
                            value={recordForm.emergency_contact_phone ?? record?.emergency_contact_phone ?? ''}
                            onChange={(e) => setRecordForm({ ...recordForm, emergency_contact_phone: e.target.value })}
                          />
                          <Input
                            placeholder="ความสัมพันธ์"
                            value={recordForm.emergency_contact_relation ?? record?.emergency_contact_relation ?? ''}
                            onChange={(e) => setRecordForm({ ...recordForm, emergency_contact_relation: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <Button onClick={() => saveRecord.mutate()} disabled={saveRecord.isPending}>
                          บันทึกโปรไฟล์สุขภาพ
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="vacc" className="mt-3 space-y-3">
                  <Card>
                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-2">
                      <Select value={vaccForm.vaccine_name} onValueChange={(v) => setVaccForm({ ...vaccForm, vaccine_name: v })}>
                        <SelectTrigger><SelectValue placeholder="วัคซีน..." /></SelectTrigger>
                        <SelectContent>
                          {COMMON_VACCINES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input placeholder="ครั้งที่" type="number" value={vaccForm.dose_number} onChange={(e) => setVaccForm({ ...vaccForm, dose_number: e.target.value })} />
                      <Input type="date" value={vaccForm.given_date} onChange={(e) => setVaccForm({ ...vaccForm, given_date: e.target.value })} />
                      <Input type="date" placeholder="ครั้งถัดไป" value={vaccForm.next_dose_date} onChange={(e) => setVaccForm({ ...vaccForm, next_dose_date: e.target.value })} />
                      <Button
                        className="md:col-span-4"
                        size="sm"
                        onClick={() => addVacc.mutate()}
                        disabled={!vaccForm.vaccine_name || !vaccForm.given_date || addVacc.isPending}
                      >
                        <Plus className="w-4 h-4 mr-1.5" />
                        เพิ่มประวัติวัคซีน
                      </Button>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-2 space-y-1">
                      {!vaccinations.length && (
                        <p className="text-center text-sm text-muted-foreground py-8">ยังไม่มีบันทึกวัคซีน</p>
                      )}
                      {vaccinations.map((v) => (
                        <div key={v.id} className="flex items-center gap-2 p-2 rounded-md border border-border bg-card text-sm">
                          <Badge variant="outline">{v.vaccine_name}</Badge>
                          {v.dose_number && <span className="text-xs text-muted-foreground">ครั้งที่ {v.dose_number}</span>}
                          <span className="flex-1 text-xs text-muted-foreground">
                            {format(new Date(v.given_date), 'd MMM yyyy')}
                            {v.next_dose_date && ` · ครั้งถัดไป ${format(new Date(v.next_dose_date), 'd MMM yyyy')}`}
                          </span>
                          <Button size="sm" variant="ghost" onClick={() => delVacc.mutate(v.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="growth" className="mt-3 space-y-3">
                  <Card>
                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-2">
                      <Input type="date" value={growthForm.measured_at} onChange={(e) => setGrowthForm({ ...growthForm, measured_at: e.target.value })} />
                      <Input placeholder="น้ำหนัก kg" type="number" step="0.1" value={growthForm.weight_kg} onChange={(e) => setGrowthForm({ ...growthForm, weight_kg: e.target.value })} />
                      <Input placeholder="ส่วนสูง cm" type="number" step="0.1" value={growthForm.height_cm} onChange={(e) => setGrowthForm({ ...growthForm, height_cm: e.target.value })} />
                      <Button size="sm" onClick={() => addGrowth.mutate()} disabled={!growthForm.measured_at || addGrowth.isPending}>
                        <Plus className="w-4 h-4 mr-1.5" />
                        บันทึก
                      </Button>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-2 space-y-1">
                      {!growth.length && (
                        <p className="text-center text-sm text-muted-foreground py-8">ยังไม่มีบันทึกน้ำหนัก/ส่วนสูง</p>
                      )}
                      {growth.map((g) => (
                        <div key={g.id} className="flex items-center gap-3 p-2 rounded-md border border-border bg-card text-sm">
                          <span className="text-xs w-24">{format(new Date(g.measured_at), 'd MMM yyyy')}</span>
                          <span className="font-medium">{g.weight_kg ?? '-'} kg</span>
                          <span className="text-muted-foreground">/</span>
                          <span className="font-medium">{g.height_cm ?? '-'} cm</span>
                          {g.bmi && <Badge variant="outline">BMI {g.bmi}</Badge>}
                          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => delGrowth.mutate(g.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
