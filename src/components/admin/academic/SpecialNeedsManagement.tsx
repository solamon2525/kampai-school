import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

interface SpecialNeed {
  id: string;
  student_id: string;
  need_type: string;
  description: string | null;
  support_plan: string | null;
  support_by: string | null;
  status: string;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  students?: { student_code: string; first_name: string; last_name: string; class_level: string; class_room: string } | null;
}

interface StudentOption { id: string; student_code: string; first_name: string; last_name: string; class_level: string; class_room: string; }

const NEED_TYPES = ['บกพร่องทางการเรียน','พิการ','ด้อยโอกาส','ปัญญาเจริญ','สุขภาพจิต','อื่นๆ'];
const STATUS_COLOR: Record<string, string> = {
  'ติดตาม': 'bg-yellow-100 text-yellow-800',
  'กำลังช่วยเหลือ': 'bg-blue-100 text-blue-800',
  'จบแล้ว': 'bg-green-100 text-green-800',
};
const NEED_COLOR: Record<string, string> = {
  'บกพร่องทางการเรียน': 'bg-orange-100 text-orange-800',
  'พิการ': 'bg-red-100 text-red-800',
  'ด้อยโอกาส': 'bg-gray-100 text-gray-700',
  'ปัญญาเจริญ': 'bg-purple-100 text-purple-800',
  'สุขภาพจิต': 'bg-pink-100 text-pink-800',
  'อื่นๆ': 'bg-gray-100 text-gray-600',
};

const emptyForm = {
  student_id: '', need_type: 'บกพร่องทางการเรียน', description: '',
  support_plan: '', support_by: '', status: 'ติดตาม',
  start_date: new Date().toISOString().slice(0, 10), end_date: '', notes: '',
};

export const SpecialNeedsManagement = () => {
  const [records, setRecords] = useState<SpecialNeed[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ทั้งหมด');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SpecialNeed | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const { toast } = useToast();

  const fetchRecords = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('student_special_needs')
      .select('*, students(student_code, first_name, last_name, class_level, class_room)')
      .order('created_at', { ascending: false });
    setRecords((data as SpecialNeed[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchRecords(); }, []);
  useEffect(() => {
    supabase.from('students').select('id, student_code, first_name, last_name, class_level, class_room').order('first_name')
      .then(({ data }) => setStudents((data as StudentOption[]) || []));
  }, []);

  const filteredStudents = studentSearch
    ? students.filter(s => `${s.first_name} ${s.last_name}`.includes(studentSearch) || s.student_code.includes(studentSearch))
    : students;

  const filtered = records.filter(r => {
    if (filterStatus !== 'ทั้งหมด' && r.status !== filterStatus) return false;
    if (search) {
      const name = r.students ? `${r.students.first_name} ${r.students.last_name}` : '';
      if (!name.includes(search)) return false;
    }
    return true;
  });

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm }); setStudentSearch(''); setDialogOpen(true); };
  const openEdit = (r: SpecialNeed) => {
    setEditing(r);
    setForm({
      student_id: r.student_id, need_type: r.need_type, description: r.description || '',
      support_plan: r.support_plan || '', support_by: r.support_by || '', status: r.status,
      start_date: r.start_date, end_date: r.end_date || '', notes: r.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.student_id || !form.need_type) { toast({ title: 'กรุณาเลือกนักเรียนและประเภท', variant: 'destructive' }); return; }
    const payload = {
      student_id: form.student_id, need_type: form.need_type,
      description: form.description || null, support_plan: form.support_plan || null,
      support_by: form.support_by || null, status: form.status,
      start_date: form.start_date, end_date: form.end_date || null, notes: form.notes || null,
    };
    const { error } = editing
      ? await supabase.from('student_special_needs').update(payload).eq('id', editing.id)
      : await supabase.from('student_special_needs').insert(payload);
    if (error) { toast({ title: 'เกิดข้อผิดพลาด', description: error.message, variant: 'destructive' }); return; }
    toast({ title: editing ? 'แก้ไขสำเร็จ' : 'เพิ่มสำเร็จ' });
    setDialogOpen(false); fetchRecords();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ยืนยันการลบ?')) return;
    await supabase.from('student_special_needs').delete().eq('id', id);
    toast({ title: 'ลบสำเร็จ' }); fetchRecords();
  };

  const selectedStudent = students.find(s => s.id === form.student_id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="ค้นหาชื่อนักเรียน..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">สถานะ</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{['ทั้งหมด','ติดตาม','กำลังช่วยเหลือ','จบแล้ว'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button onClick={openAdd} size="sm" className="ml-auto"><Plus className="w-4 h-4 mr-1" />เพิ่มข้อมูล</Button>
      </div>

      {loading ? <p className="text-center text-muted-foreground py-8">กำลังโหลด...</p> : (
        <div className="space-y-2">
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">ไม่พบข้อมูล</p>}
          {filtered.map(r => (
            <div key={r.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">
                    {r.students ? `${r.students.first_name} ${r.students.last_name}` : '-'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {r.students ? `${r.students.class_level}/${r.students.class_room}` : ''}
                  </span>
                  <Badge className={`text-xs ${NEED_COLOR[r.need_type] || ''}`}>{r.need_type}</Badge>
                  <Badge className={`text-xs ${STATUS_COLOR[r.status]}`}>{r.status}</Badge>
                </div>
                {r.description && <p className="text-xs text-gray-600 mt-1 truncate">{r.description}</p>}
                {r.support_by && <p className="text-xs text-muted-foreground">ผู้ดูแล: {r.support_by}</p>}
                <p className="text-xs text-muted-foreground">เริ่ม: {r.start_date}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="w-3.5 h-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => handleDelete(r.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'แก้ไขข้อมูล' : 'เพิ่มนักเรียนที่ต้องการความช่วยเหลือ'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">ค้นหานักเรียน</Label>
              <Input placeholder="พิมพ์ชื่อ/รหัส..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className="h-8 text-sm mb-1" />
              {selectedStudent && (
                <div className="text-xs bg-blue-50 border border-blue-200 rounded p-2 mb-1">
                  เลือก: {selectedStudent.first_name} {selectedStudent.last_name} ({selectedStudent.class_level}/{selectedStudent.class_room})
                </div>
              )}
              {studentSearch && (
                <div className="max-h-32 overflow-y-auto border rounded text-xs">
                  {filteredStudents.slice(0, 10).map(s => (
                    <button key={s.id} onClick={() => { setForm(f => ({ ...f, student_id: s.id })); setStudentSearch(''); }}
                      className="w-full text-left px-2 py-1 hover:bg-blue-50 border-b last:border-0">
                      {s.first_name} {s.last_name} — {s.class_level}/{s.class_room} ({s.student_code})
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">ประเภทความต้องการ *</Label>
                <Select value={form.need_type} onValueChange={v => setForm(f => ({ ...f, need_type: v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{NEED_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">สถานะ</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{['ติดตาม','กำลังช่วยเหลือ','จบแล้ว'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">วันที่เริ่ม</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">วันที่สิ้นสุด</Label>
                <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">ผู้ดูแล/ผู้รับผิดชอบ</Label>
                <Input value={form.support_by} onChange={e => setForm(f => ({ ...f, support_by: e.target.value }))} className="h-8 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs">รายละเอียดความต้องการ</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="text-sm" />
            </div>
            <div>
              <Label className="text-xs">แผนการช่วยเหลือ</Label>
              <Textarea value={form.support_plan} onChange={e => setForm(f => ({ ...f, support_plan: e.target.value }))} rows={2} className="text-sm" />
            </div>
            <div>
              <Label className="text-xs">หมายเหตุ</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={1} className="text-sm" />
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
