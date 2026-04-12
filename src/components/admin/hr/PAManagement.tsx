import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, FileText } from 'lucide-react';

interface Staff { id: string; name: string; }
interface PAAssessment {
  id: string;
  staff_id: string | null;
  academic_year: string;
  semester: number;
  id_plan_url: string | null;
  observation_count: number;
  observation_target: number;
  training_hours: number;
  training_target: number;
  self_rating: number | null;
  director_rating: number | null;
  status: string;
  notes: string | null;
  created_at: string;
  staff?: Staff;
}

const STATUSES = ['กำลังดำเนินการ', 'ส่งแล้ว', 'ผ่าน', 'ไม่ผ่าน'];
const CURRENT_YEAR = '2568';

const statusVariant = (s: string) => {
  if (s === 'ผ่าน') return 'default';
  if (s === 'ไม่ผ่าน') return 'destructive';
  if (s === 'ส่งแล้ว') return 'outline';
  return 'secondary';
};

export default function PAManagement() {
  const [records, setRecords] = useState<PAAssessment[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState(CURRENT_YEAR);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PAAssessment | null>(null);
  const [form, setForm] = useState({
    staff_id: '',
    academic_year: CURRENT_YEAR,
    semester: 1,
    id_plan_url: '',
    observation_count: 0,
    observation_target: 2,
    training_hours: 0,
    training_target: 20,
    self_rating: '',
    director_rating: '',
    status: 'กำลังดำเนินการ',
    notes: '',
  });

  useEffect(() => {
    fetchRecords();
    fetchStaff();
  }, []);

  async function fetchStaff() {
    const { data } = await supabase.from('staff').select('id, name').order('name');
    setStaffList(data || []);
  }

  async function fetchRecords() {
    setLoading(true);
    const { data, error } = await supabase
      .from('pa_assessments')
      .select('*, staff:staff_id(id, name)')
      .order('academic_year', { ascending: false });
    if (error) toast.error('โหลดข้อมูลไม่สำเร็จ');
    else setRecords(data || []);
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setForm({ staff_id: '', academic_year: CURRENT_YEAR, semester: 1, id_plan_url: '', observation_count: 0, observation_target: 2, training_hours: 0, training_target: 20, self_rating: '', director_rating: '', status: 'กำลังดำเนินการ', notes: '' });
    setDialogOpen(true);
  }

  function openEdit(r: PAAssessment) {
    setEditing(r);
    setForm({
      staff_id: r.staff_id || '',
      academic_year: r.academic_year,
      semester: r.semester,
      id_plan_url: r.id_plan_url || '',
      observation_count: r.observation_count,
      observation_target: r.observation_target,
      training_hours: r.training_hours,
      training_target: r.training_target,
      self_rating: r.self_rating?.toString() || '',
      director_rating: r.director_rating?.toString() || '',
      status: r.status,
      notes: r.notes || '',
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.staff_id) { toast.error('กรุณาเลือกบุคลากร'); return; }
    const payload = {
      staff_id: form.staff_id || null,
      academic_year: form.academic_year,
      semester: Number(form.semester),
      id_plan_url: form.id_plan_url || null,
      observation_count: Number(form.observation_count),
      observation_target: Number(form.observation_target),
      training_hours: Number(form.training_hours),
      training_target: Number(form.training_target),
      self_rating: form.self_rating ? Number(form.self_rating) : null,
      director_rating: form.director_rating ? Number(form.director_rating) : null,
      status: form.status,
      notes: form.notes || null,
    };
    if (editing) {
      const { error } = await supabase.from('pa_assessments').update(payload).eq('id', editing.id);
      if (error) { toast.error('บันทึกไม่สำเร็จ'); return; }
      toast.success('แก้ไขสำเร็จ');
    } else {
      const { error } = await supabase.from('pa_assessments').insert(payload);
      if (error) { toast.error('บันทึกไม่สำเร็จ'); return; }
      toast.success('เพิ่มข้อมูลสำเร็จ');
    }
    setDialogOpen(false);
    fetchRecords();
  }

  async function handleDelete(id: string) {
    if (!confirm('ยืนยันการลบ?')) return;
    const { error } = await supabase.from('pa_assessments').delete().eq('id', id);
    if (error) toast.error('ลบไม่สำเร็จ');
    else { toast.success('ลบสำเร็จ'); fetchRecords(); }
  }

  const years = [...new Set(records.map(r => r.academic_year))].sort((a, b) => b.localeCompare(a));
  if (!years.includes(CURRENT_YEAR)) years.unshift(CURRENT_YEAR);

  const filtered = records.filter(r => {
    const matchYear = filterYear === 'all' || r.academic_year === filterYear;
    const staffName = (r.staff as any)?.name || '';
    const matchSearch = !search || staffName.toLowerCase().includes(search.toLowerCase());
    return matchYear && matchSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">PA Assessment</h2>
          <p className="text-muted-foreground text-sm">ติดตาม ID Plan, การสังเกตการสอน และชั่วโมงพัฒนาตนเอง</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />เพิ่ม PA</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="ค้นหาชื่อบุคลากร..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="ปีการศึกษา" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกปี</SelectItem>
            {years.map(y => <SelectItem key={y} value={y}>ปี {y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>บุคลากร</TableHead>
              <TableHead>ปี/เทอม</TableHead>
              <TableHead>ID Plan</TableHead>
              <TableHead>การสังเกตสอน</TableHead>
              <TableHead>ชม.พัฒนาตน</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">กำลังโหลด...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">ไม่พบข้อมูล</TableCell></TableRow>
            ) : filtered.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{(r.staff as any)?.name || '-'}</TableCell>
                <TableCell className="text-sm">{r.academic_year}/เทอม {r.semester}</TableCell>
                <TableCell>
                  {r.id_plan_url ? (
                    <a href={r.id_plan_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
                      <FileText className="w-3 h-3" />ดูไฟล์
                    </a>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <Progress value={(r.observation_count / r.observation_target) * 100} className="h-2 w-16" />
                    <span className="text-xs text-muted-foreground">{r.observation_count}/{r.observation_target}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <Progress value={(r.training_hours / r.training_target) * 100} className="h-2 w-16" />
                    <span className="text-xs text-muted-foreground">{r.training_hours}/{r.training_target}</span>
                  </div>
                </TableCell>
                <TableCell><Badge variant={statusVariant(r.status) as any}>{r.status}</Badge></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'แก้ไข PA' : 'เพิ่ม PA Assessment'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>บุคลากร <span className="text-destructive">*</span></Label>
              <Select value={form.staff_id} onValueChange={v => setForm(f => ({ ...f, staff_id: v }))}>
                <SelectTrigger><SelectValue placeholder="เลือกบุคลากร" /></SelectTrigger>
                <SelectContent>{staffList.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>ปีการศึกษา</Label>
                <Input value={form.academic_year} onChange={e => setForm(f => ({ ...f, academic_year: e.target.value }))} placeholder="2568" />
              </div>
              <div className="space-y-1">
                <Label>ภาคเรียน</Label>
                <Select value={String(form.semester)} onValueChange={v => setForm(f => ({ ...f, semester: Number(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">ภาคเรียนที่ 1</SelectItem>
                    <SelectItem value="2">ภาคเรียนที่ 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>URL ไฟล์ ID Plan</Label>
              <Input value={form.id_plan_url} onChange={e => setForm(f => ({ ...f, id_plan_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>ครั้งที่สังเกตสอน (จริง)</Label>
                <Input type="number" min={0} value={form.observation_count} onChange={e => setForm(f => ({ ...f, observation_count: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label>เป้าหมายการสังเกตสอน</Label>
                <Input type="number" min={1} value={form.observation_target} onChange={e => setForm(f => ({ ...f, observation_target: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>ชม.พัฒนาตนเอง (จริง)</Label>
                <Input type="number" min={0} value={form.training_hours} onChange={e => setForm(f => ({ ...f, training_hours: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label>เป้าหมายชั่วโมง</Label>
                <Input type="number" min={1} value={form.training_target} onChange={e => setForm(f => ({ ...f, training_target: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>คะแนนประเมินตนเอง</Label>
                <Input type="number" min={0} max={5} step={0.1} value={form.self_rating} onChange={e => setForm(f => ({ ...f, self_rating: e.target.value }))} placeholder="0–5" />
              </div>
              <div className="space-y-1">
                <Label>คะแนนจากผู้บริหาร</Label>
                <Input type="number" min={0} max={5} step={0.1} value={form.director_rating} onChange={e => setForm(f => ({ ...f, director_rating: e.target.value }))} placeholder="0–5" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>สถานะ</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>หมายเหตุ</Label>
              <Textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSave}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
