import { useEffect, useState, useCallback } from 'react';
import { lessonPlanService } from '@/services/academic.service';
import { staffService } from '@/services/staff.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search, FileText, Target } from 'lucide-react';
import { LessonPlanIndicatorsDialog } from './LessonPlanIndicatorsDialog';

interface LessonPlan {
  id: string;
  staff_id: string | null;
  subject: string;
  grade: string;
  unit_title: string;
  week_number: number | null;
  objectives: string | null;
  activities: string | null;
  materials: string | null;
  evaluation: string | null;
  duration_hours: number;
  semester: number;
  academic_year: string;
  status: string;
  file_url: string | null;
  staff?: { name: string } | null;
}

interface StaffOption { id: string; name: string; }

const GRADES = ['อ.1','อ.2','อ.3','ป.1','ป.2','ป.3','ป.4','ป.5','ป.6'];
const STATUS_COLOR: Record<string, string> = {
  'ร่าง': 'bg-muted text-muted-foreground',
  'อนุมัติ': 'bg-yellow-100 text-yellow-800',
  'ใช้งาน': 'bg-green-100 text-green-800',
};

const emptyForm = {
  staff_id: '', subject: '', grade: 'ป.1', unit_title: '', week_number: '',
  objectives: '', activities: '', materials: '', evaluation: '',
  duration_hours: '1', semester: '1', academic_year: '2568', status: 'ร่าง', file_url: '',
};

export const LessonPlanManagement = () => {
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState('2568');
  const [filterSemester, setFilterSemester] = useState('1');
  const [filterGrade, setFilterGrade] = useState('ทั้งหมด');
  const [filterStatus, setFilterStatus] = useState('ทั้งหมด');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LessonPlan | null>(null);
  const [indicatorPlan, setIndicatorPlan] = useState<LessonPlan | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const { toast } = useToast();

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    const { data } = await lessonPlanService.getAll(filterYear, Number(filterSemester));
    setPlans((data as LessonPlan[]) || []);
    setLoading(false);
  }, [filterYear, filterSemester]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);
  useEffect(() => {
    staffService.getNameOptions().then(({ data }) => setStaffList((data as StaffOption[]) || []));
  }, []);

  const filtered = plans.filter(p => {
    if (filterGrade !== 'ทั้งหมด' && p.grade !== filterGrade) return false;
    if (filterStatus !== 'ทั้งหมด' && p.status !== filterStatus) return false;
    if (search && !p.unit_title.toLowerCase().includes(search.toLowerCase()) && !p.subject.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm, semester: filterSemester, academic_year: filterYear }); setDialogOpen(true); };
  const openEdit = (p: LessonPlan) => {
    setEditing(p);
    setForm({
      staff_id: p.staff_id || '', subject: p.subject, grade: p.grade, unit_title: p.unit_title,
      week_number: p.week_number ? String(p.week_number) : '',
      objectives: p.objectives || '', activities: p.activities || '',
      materials: p.materials || '', evaluation: p.evaluation || '',
      duration_hours: String(p.duration_hours), semester: String(p.semester),
      academic_year: p.academic_year, status: p.status, file_url: p.file_url || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.subject || !form.unit_title) { toast({ title: 'กรุณากรอกวิชาและหน่วยการเรียนรู้', variant: 'destructive' }); return; }
    const payload = {
      staff_id: form.staff_id || null, subject: form.subject, grade: form.grade,
      unit_title: form.unit_title, week_number: form.week_number ? Number(form.week_number) : null,
      objectives: form.objectives || null, activities: form.activities || null,
      materials: form.materials || null, evaluation: form.evaluation || null,
      duration_hours: Number(form.duration_hours), semester: Number(form.semester),
      academic_year: form.academic_year, status: form.status, file_url: form.file_url || null,
    };
    const { error } = editing
      ? await lessonPlanService.update(editing.id, payload)
      : await lessonPlanService.insert(payload);
    if (error) { toast({ title: 'เกิดข้อผิดพลาด', description: error.message, variant: 'destructive' }); return; }
    toast({ title: editing ? 'แก้ไขสำเร็จ' : 'เพิ่มสำเร็จ' });
    setDialogOpen(false); fetchPlans();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ยืนยันการลบ?')) return;
    await lessonPlanService.delete(id);
    toast({ title: 'ลบสำเร็จ' }); fetchPlans();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="ค้นหาหน่วย/วิชา..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
        </div>
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
          <Label className="text-xs">ชั้น</Label>
          <Select value={filterGrade} onValueChange={setFilterGrade}>
            <SelectTrigger className="w-28 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ทั้งหมด">ทั้งหมด</SelectItem>
              {GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">สถานะ</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-28 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['ทั้งหมด','ร่าง','อนุมัติ','ใช้งาน'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openAdd} size="sm" className="ml-auto"><Plus className="w-4 h-4 mr-1" />เพิ่มแผนการสอน</Button>
      </div>

      {loading ? <p className="text-center text-muted-foreground py-8">กำลังโหลด...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-3 py-2 font-medium text-xs">หน่วยการเรียนรู้</th>
                <th className="text-left px-3 py-2 font-medium text-xs w-24">วิชา</th>
                <th className="text-left px-3 py-2 font-medium text-xs w-16">ชั้น</th>
                <th className="text-left px-3 py-2 font-medium text-xs w-24">ครู</th>
                <th className="text-center px-3 py-2 font-medium text-xs w-16">สัปดาห์ที่</th>
                <th className="text-center px-3 py-2 font-medium text-xs w-20">ชั่วโมง</th>
                <th className="text-center px-3 py-2 font-medium text-xs w-20">สถานะ</th>
                <th className="text-center px-3 py-2 font-medium text-xs w-20">ไฟล์</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">ไม่พบข้อมูล</td></tr>
              )}
              {filtered.map(p => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">{p.unit_title}</td>
                  <td className="px-3 py-2 text-xs">{p.subject}</td>
                  <td className="px-3 py-2 text-xs">{p.grade}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{p.staff?.name || '-'}</td>
                  <td className="px-3 py-2 text-xs text-center">{p.week_number || '-'}</td>
                  <td className="px-3 py-2 text-xs text-center">{p.duration_hours} ชม.</td>
                  <td className="px-3 py-2 text-center">
                    <Badge className={`text-xs ${STATUS_COLOR[p.status]}`}>{p.status}</Badge>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {p.file_url ? <a href={p.file_url} target="_blank" rel="noreferrer"><FileText className="w-4 h-4 text-blue-600 mx-auto" /></a> : '-'}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 justify-end">
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-emerald-600" title="ตัวชี้วัดที่เกี่ยวข้อง" onClick={() => setIndicatorPlan(p)}><Target className="w-3 h-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(p)}><Pencil className="w-3 h-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={() => handleDelete(p.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'แก้ไขแผนการสอน' : 'เพิ่มแผนการสอน'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2">
              <Label className="text-xs">หน่วยการเรียนรู้ *</Label>
              <Input value={form.unit_title} onChange={e => setForm(f => ({ ...f, unit_title: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">วิชา *</Label>
              <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">ชั้น</Label>
              <Select value={form.grade} onValueChange={v => setForm(f => ({ ...f, grade: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">ครูผู้สอน</Label>
              <Select value={form.staff_id} onValueChange={v => setForm(f => ({ ...f, staff_id: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="เลือกครู" /></SelectTrigger>
                <SelectContent>{staffList.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">สัปดาห์ที่</Label>
              <Input type="number" value={form.week_number} onChange={e => setForm(f => ({ ...f, week_number: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">จำนวนชั่วโมง</Label>
              <Input type="number" step="0.5" value={form.duration_hours} onChange={e => setForm(f => ({ ...f, duration_hours: e.target.value }))} className="h-8 text-sm" />
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
            <div>
              <Label className="text-xs">สถานะ</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{['ร่าง','อนุมัติ','ใช้งาน'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs">จุดประสงค์การเรียนรู้</Label>
              <Textarea value={form.objectives} onChange={e => setForm(f => ({ ...f, objectives: e.target.value }))} rows={2} className="text-sm" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">กิจกรรมการเรียนรู้</Label>
              <Textarea value={form.activities} onChange={e => setForm(f => ({ ...f, activities: e.target.value }))} rows={2} className="text-sm" />
            </div>
            <div>
              <Label className="text-xs">สื่อการสอน</Label>
              <Textarea value={form.materials} onChange={e => setForm(f => ({ ...f, materials: e.target.value }))} rows={2} className="text-sm" />
            </div>
            <div>
              <Label className="text-xs">การวัดและประเมินผล</Label>
              <Textarea value={form.evaluation} onChange={e => setForm(f => ({ ...f, evaluation: e.target.value }))} rows={2} className="text-sm" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">URL ไฟล์แผนการสอน</Label>
              <Input value={form.file_url} onChange={e => setForm(f => ({ ...f, file_url: e.target.value }))} className="h-8 text-sm" placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSubmit}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!indicatorPlan} onOpenChange={(open) => !open && setIndicatorPlan(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {indicatorPlan && (
            <LessonPlanIndicatorsDialog
              plan={{ id: indicatorPlan.id, subject: indicatorPlan.subject, grade: indicatorPlan.grade }}
              onClose={() => setIndicatorPlan(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
