import { useEffect, useState } from 'react';
import { counselingService } from '@/services/academic.service';
import { studentsService } from '@/services/students.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

interface CounselingRecord {
  id: string;
  student_id: string;
  counselor: string;
  session_date: string;
  topic: string;
  concern_type: string;
  content: string | null;
  action_taken: string | null;
  followup_date: string | null;
  status: string;
  created_at: string;
  students?: { student_code: string; first_name: string; last_name: string; class_level: string; class_room: string } | null;
}

interface StudentOption { id: string; student_code: string; first_name: string; last_name: string; class_level: string; class_room: string; }

const CONCERN_TYPES = ['การเรียน','พฤติกรรม','ครอบครัว','อาชีพ','อื่นๆ'];

const CONCERN_COLOR: Record<string, string> = {
  'การเรียน': 'bg-blue-100 text-blue-800',
  'พฤติกรรม': 'bg-orange-100 text-orange-800',
  'ครอบครัว': 'bg-amber-100 text-amber-800',
  'อาชีพ': 'bg-emerald-100 text-emerald-800',
  'อื่นๆ': 'bg-muted text-muted-foreground',
};

const STATUS_COLOR: Record<string, string> = {
  'ติดตาม': 'bg-yellow-100 text-yellow-800',
  'เสร็จสิ้น': 'bg-green-100 text-green-800',
};

const emptyForm = {
  student_id: '', counselor: '', session_date: new Date().toISOString().slice(0, 10),
  topic: '', concern_type: 'การเรียน', content: '', action_taken: '',
  followup_date: '', status: 'ติดตาม',
};

const formatDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

export const CounselingManagement = () => {
  const [records, setRecords] = useState<CounselingRecord[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [filterType, setFilterType] = useState('ทั้งหมด');
  const [filterStatus, setFilterStatus] = useState('ทั้งหมด');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CounselingRecord | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const { toast } = useToast();

  const fetchRecords = async () => {
    setLoading(true);
    const { data } = await counselingService.getAll();
    setRecords((data as CounselingRecord[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchRecords(); }, []);
  useEffect(() => {
    studentsService.getAcademicOptions().then(({ data }) => setStudents((data as StudentOption[]) || []));
  }, []);

  const filteredStudents = studentSearch
    ? students.filter(s => `${s.first_name} ${s.last_name}`.includes(studentSearch) || s.student_code.includes(studentSearch))
    : students;

  const filtered = records.filter(r => {
    if (filterType !== 'ทั้งหมด' && r.concern_type !== filterType) return false;
    if (filterStatus !== 'ทั้งหมด' && r.status !== filterStatus) return false;
    if (search) {
      const name = r.students ? `${r.students.first_name} ${r.students.last_name}` : '';
      if (!name.includes(search) && !r.topic.includes(search)) return false;
    }
    return true;
  });

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm }); setStudentSearch(''); setDialogOpen(true); };
  const openEdit = (r: CounselingRecord) => {
    setEditing(r);
    setForm({
      student_id: r.student_id, counselor: r.counselor, session_date: r.session_date,
      topic: r.topic, concern_type: r.concern_type, content: r.content || '',
      action_taken: r.action_taken || '', followup_date: r.followup_date || '', status: r.status,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.student_id || !form.topic || !form.counselor) {
      toast({ title: 'กรุณากรอกข้อมูลที่จำเป็น', variant: 'destructive' }); return;
    }
    const payload = {
      student_id: form.student_id, counselor: form.counselor, session_date: form.session_date,
      topic: form.topic, concern_type: form.concern_type, content: form.content || null,
      action_taken: form.action_taken || null, followup_date: form.followup_date || null, status: form.status,
    };
    const { error } = editing
      ? await counselingService.update(editing.id, payload)
      : await counselingService.insert(payload);
    if (error) { toast({ title: 'เกิดข้อผิดพลาด', description: error.message, variant: 'destructive' }); return; }
    toast({ title: editing ? 'แก้ไขสำเร็จ' : 'บันทึกสำเร็จ' });
    setDialogOpen(false); fetchRecords();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ยืนยันการลบ?')) return;
    await counselingService.delete(id);
    toast({ title: 'ลบสำเร็จ' }); fetchRecords();
  };

  const selectedStudent = students.find(s => s.id === form.student_id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="ค้นหาชื่อ/หัวข้อ..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">ประเภทปัญหา</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-28 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{['ทั้งหมด',...CONCERN_TYPES].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">สถานะ</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-28 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{['ทั้งหมด','ติดตาม','เสร็จสิ้น'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button onClick={openAdd} size="sm" className="ml-auto"><Plus className="w-4 h-4 mr-1" />บันทึกการแนะแนว</Button>
      </div>

      {loading ? <p className="text-center text-muted-foreground py-8">กำลังโหลด...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-3 py-2 font-medium text-xs w-28">วันที่</th>
                <th className="text-left px-3 py-2 font-medium text-xs">นักเรียน</th>
                <th className="text-left px-3 py-2 font-medium text-xs">หัวข้อ</th>
                <th className="text-left px-3 py-2 font-medium text-xs w-24">ประเภท</th>
                <th className="text-left px-3 py-2 font-medium text-xs w-24">ครูแนะแนว</th>
                <th className="text-left px-3 py-2 font-medium text-xs w-24">วันติดตาม</th>
                <th className="text-center px-3 py-2 font-medium text-xs w-20">สถานะ</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">ไม่พบข้อมูล</td></tr>}
              {filtered.map(r => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2 text-xs">{formatDate(r.session_date)}</td>
                  <td className="px-3 py-2">
                    <p className="font-medium text-xs">{r.students ? `${r.students.first_name} ${r.students.last_name}` : '-'}</p>
                    <p className="text-[10px] text-muted-foreground">{r.students ? `${r.students.class_level}/${r.students.class_room}` : ''}</p>
                  </td>
                  <td className="px-3 py-2 text-xs">{r.topic}</td>
                  <td className="px-3 py-2">
                    <Badge className={`text-xs ${CONCERN_COLOR[r.concern_type] || ''}`}>{r.concern_type}</Badge>
                  </td>
                  <td className="px-3 py-2 text-xs">{r.counselor}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{r.followup_date ? formatDate(r.followup_date) : '-'}</td>
                  <td className="px-3 py-2 text-center">
                    <Badge className={`text-xs ${STATUS_COLOR[r.status]}`}>{r.status}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 justify-end">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(r)}><Pencil className="w-3 h-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={() => handleDelete(r.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'แก้ไขบันทึก' : 'บันทึกการแนะแนว'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">ค้นหานักเรียน *</Label>
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
                      {s.first_name} {s.last_name} — {s.class_level}/{s.class_room}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">ครูแนะแนว *</Label>
                <Input value={form.counselor} onChange={e => setForm(f => ({ ...f, counselor: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">วันที่</Label>
                <Input type="date" value={form.session_date} onChange={e => setForm(f => ({ ...f, session_date: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">หัวข้อ *</Label>
                <Input value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">ประเภทปัญหา</Label>
                <Select value={form.concern_type} onValueChange={v => setForm(f => ({ ...f, concern_type: v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{CONCERN_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">สถานะ</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{['ติดตาม','เสร็จสิ้น'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">วันที่นัดติดตาม</Label>
                <Input type="date" value={form.followup_date} onChange={e => setForm(f => ({ ...f, followup_date: e.target.value }))} className="h-8 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs">เนื้อหาการให้คำปรึกษา</Label>
              <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={2} className="text-sm" />
            </div>
            <div>
              <Label className="text-xs">การดำเนินการ/แนวทางแก้ไข</Label>
              <Textarea value={form.action_taken} onChange={e => setForm(f => ({ ...f, action_taken: e.target.value }))} rows={2} className="text-sm" />
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
