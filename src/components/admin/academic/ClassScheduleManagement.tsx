import { useEffect, useState, useCallback } from 'react';
import { classScheduleService } from '@/services/academic.service';
import { staffService } from '@/services/staff.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface ClassSchedule {
  id: string;
  staff_id: string | null;
  grade: string;
  room: string | null;
  subject: string;
  day_of_week: number;
  period: number;
  start_time: string | null;
  end_time: string | null;
  semester: number;
  academic_year: string;
  staff?: { name: string } | null;
}

interface StaffOption { id: string; name: string; }

const DAYS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'];
const GRADES = ['อ.1','อ.2','อ.3','ป.1','ป.2','ป.3','ป.4','ป.5','ป.6'];
const DAY_COLORS = ['bg-red-50 border-red-200','bg-orange-50 border-orange-200','bg-green-50 border-green-200','bg-blue-50 border-blue-200','bg-emerald-50 border-emerald-200'];

const emptyForm = {
  staff_id: '', grade: 'ป.1', room: '', subject: '',
  day_of_week: '1', period: '1', start_time: '', end_time: '',
  semester: '1', academic_year: '2568',
};

export const ClassScheduleManagement = () => {
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState('2568');
  const [filterSemester, setFilterSemester] = useState('1');
  const [filterGrade, setFilterGrade] = useState('ทั้งหมด');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ClassSchedule | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const { toast } = useToast();

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    const { data } = await classScheduleService.getAll(filterYear, Number(filterSemester));
    setSchedules((data as ClassSchedule[]) || []);
    setLoading(false);
  }, [filterYear, filterSemester]);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  useEffect(() => {
    staffService.getNameOptions().then(({ data }) => {
      setStaffList((data as StaffOption[]) || []);
    });
  }, []);

  const filtered = filterGrade === 'ทั้งหมด' ? schedules : schedules.filter(s => s.grade === filterGrade);

  // Build grid: day_of_week (1-5) x period (1-8)
  const grid: Record<string, ClassSchedule[]> = {};
  for (let d = 1; d <= 5; d++) {
    for (let p = 1; p <= 8; p++) {
      grid[`${d}-${p}`] = filtered.filter(s => s.day_of_week === d && s.period === p);
    }
  }

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm, semester: filterSemester, academic_year: filterYear }); setDialogOpen(true); };
  const openEdit = (s: ClassSchedule) => {
    setEditing(s);
    setForm({
      staff_id: s.staff_id || '', grade: s.grade, room: s.room || '', subject: s.subject,
      day_of_week: String(s.day_of_week), period: String(s.period),
      start_time: s.start_time || '', end_time: s.end_time || '',
      semester: String(s.semester), academic_year: s.academic_year,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.subject || !form.grade) { toast({ title: 'กรุณากรอกวิชาและชั้นเรียน', variant: 'destructive' }); return; }
    const payload = {
      staff_id: form.staff_id || null, grade: form.grade, room: form.room || null,
      subject: form.subject, day_of_week: Number(form.day_of_week), period: Number(form.period),
      start_time: form.start_time || null, end_time: form.end_time || null,
      semester: Number(form.semester), academic_year: form.academic_year,
    };
    const { error } = editing
      ? await classScheduleService.update(editing.id, payload)
      : await classScheduleService.insert(payload);
    if (error) { toast({ title: 'เกิดข้อผิดพลาด', description: error.message, variant: 'destructive' }); return; }
    toast({ title: editing ? 'แก้ไขสำเร็จ' : 'เพิ่มสำเร็จ' });
    setDialogOpen(false); fetchSchedules();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ยืนยันการลบ?')) return;
    await classScheduleService.delete(id);
    toast({ title: 'ลบสำเร็จ' }); fetchSchedules();
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <Label className="text-xs">ปีการศึกษา</Label>
          <Input value={filterYear} onChange={e => setFilterYear(e.target.value)} className="w-24 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">ภาคเรียน</Label>
          <Select value={filterSemester} onValueChange={setFilterSemester}>
            <SelectTrigger className="w-20 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="1">1</SelectItem><SelectItem value="2">2</SelectItem></SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">ชั้นเรียน</Label>
          <Select value={filterGrade} onValueChange={setFilterGrade}>
            <SelectTrigger className="w-28 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ทั้งหมด">ทั้งหมด</SelectItem>
              {GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={fetchSchedules} size="sm" variant="outline">โหลด</Button>
        <Button onClick={openAdd} size="sm" className="ml-auto"><Plus className="w-4 h-4 mr-1" />เพิ่มคาบ</Button>
      </div>

      {/* Grid */}
      {loading ? <p className="text-center text-muted-foreground py-8">กำลังโหลด...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs min-w-[700px]">
            <thead>
              <tr>
                <th className="border border-gray-200 bg-gray-50 px-2 py-1.5 text-center w-14">คาบ</th>
                {DAYS.map((d, i) => (
                  <th key={d} className={`border border-gray-200 px-2 py-1.5 text-center ${DAY_COLORS[i]}`}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }, (_, pi) => pi + 1).map(p => (
                <tr key={p}>
                  <td className="border border-gray-200 bg-gray-50 text-center font-medium py-1">{p}</td>
                  {Array.from({ length: 5 }, (_, di) => di + 1).map(d => {
                    const cells = grid[`${d}-${p}`];
                    return (
                      <td key={d} className="border border-gray-200 p-1 align-top min-h-[60px]">
                        {cells.map(s => (
                          <div key={s.id} className="bg-blue-50 border border-blue-200 rounded p-1 mb-1 group relative">
                            <p className="font-semibold text-blue-800 truncate">{s.subject}</p>
                            <p className="text-blue-600 truncate">{s.grade}{s.room ? ` (${s.room})` : ''}</p>
                            {s.staff?.name && <p className="text-gray-500 truncate">{s.staff.name}</p>}
                            <div className="absolute top-0.5 right-0.5 hidden group-hover:flex gap-0.5">
                              <button onClick={() => openEdit(s)} className="p-0.5 hover:bg-blue-200 rounded"><Pencil className="w-3 h-3" /></button>
                              <button onClick={() => handleDelete(s.id)} className="p-0.5 hover:bg-red-200 rounded"><Trash2 className="w-3 h-3 text-red-500" /></button>
                            </div>
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'แก้ไขคาบเรียน' : 'เพิ่มคาบเรียน'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div>
              <Label className="text-xs">ครูผู้สอน</Label>
              <Select value={form.staff_id} onValueChange={v => setForm(f => ({ ...f, staff_id: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="เลือกครู" /></SelectTrigger>
                <SelectContent>{staffList.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">ชั้นเรียน *</Label>
              <Select value={form.grade} onValueChange={v => setForm(f => ({ ...f, grade: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">วิชา *</Label>
              <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="h-8 text-sm" placeholder="ภาษาไทย, คณิตศาสตร์..." />
            </div>
            <div>
              <Label className="text-xs">ห้อง</Label>
              <Input value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} className="h-8 text-sm" placeholder="ห้อง 101" />
            </div>
            <div>
              <Label className="text-xs">วัน</Label>
              <Select value={form.day_of_week} onValueChange={v => setForm(f => ({ ...f, day_of_week: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{DAYS.map((d, i) => <SelectItem key={i+1} value={String(i+1)}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">คาบที่</Label>
              <Select value={form.period} onValueChange={v => setForm(f => ({ ...f, period: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{Array.from({length:8},(_,i)=><SelectItem key={i+1} value={String(i+1)}>คาบ {i+1}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">เวลาเริ่ม</Label>
              <Input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">เวลาสิ้นสุด</Label>
              <Input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">ภาคเรียน</Label>
              <Select value={form.semester} onValueChange={v => setForm(f => ({ ...f, semester: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="1">1</SelectItem><SelectItem value="2">2</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">ปีการศึกษา</Label>
              <Input value={form.academic_year} onChange={e => setForm(f => ({ ...f, academic_year: e.target.value }))} className="h-8 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSubmit}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
