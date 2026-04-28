import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, CalendarDays } from 'lucide-react';

interface AcademicEvent {
  id: string;
  title: string;
  event_type: string;
  start_date: string;
  end_date: string | null;
  semester: number | null;
  academic_year: string;
  description: string | null;
  is_all_day: boolean;
}

const EVENT_COLOR: Record<string, string> = {
  'สอบ': 'bg-red-100 text-red-800',
  'วันหยุด': 'bg-gray-100 text-gray-700',
  'ส่งเอกสาร': 'bg-yellow-100 text-yellow-800',
  'ประชุม': 'bg-blue-100 text-blue-800',
  'กิจกรรม': 'bg-emerald-100 text-emerald-800',
  'วันเรียน': 'bg-green-100 text-green-800',
  'วิชาการ': 'bg-slate-100 text-slate-800',
};

const emptyForm = {
  title: '', event_type: 'วิชาการ', start_date: '', end_date: '',
  semester: '1', academic_year: '2568', description: '', is_all_day: 'true',
};

const formatDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

export const AcademicCalendarManagement = () => {
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState('2568');
  const [filterSemester, setFilterSemester] = useState('ทั้งหมด');
  const [filterType, setFilterType] = useState('ทั้งหมด');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AcademicEvent | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const { toast } = useToast();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('academic_calendar').select('*').eq('academic_year', filterYear).order('start_date');
    if (filterSemester !== 'ทั้งหมด') q = q.eq('semester', Number(filterSemester));
    const { data } = await q;
    setEvents((data as AcademicEvent[]) || []);
    setLoading(false);
  }, [filterYear, filterSemester]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const filtered = filterType === 'ทั้งหมด' ? events : events.filter(e => e.event_type === filterType);

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm, academic_year: filterYear }); setDialogOpen(true); };
  const openEdit = (e: AcademicEvent) => {
    setEditing(e);
    setForm({
      title: e.title, event_type: e.event_type,
      start_date: e.start_date, end_date: e.end_date || '',
      semester: e.semester ? String(e.semester) : '1',
      academic_year: e.academic_year, description: e.description || '',
      is_all_day: String(e.is_all_day),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.start_date) { toast({ title: 'กรุณากรอกชื่อและวันที่', variant: 'destructive' }); return; }
    const payload = {
      title: form.title, event_type: form.event_type, start_date: form.start_date,
      end_date: form.end_date || null, semester: form.semester ? Number(form.semester) : null,
      academic_year: form.academic_year, description: form.description || null,
      is_all_day: form.is_all_day === 'true',
    };
    const { error } = editing
      ? await supabase.from('academic_calendar').update(payload).eq('id', editing.id)
      : await supabase.from('academic_calendar').insert(payload);
    if (error) { toast({ title: 'เกิดข้อผิดพลาด', description: error.message, variant: 'destructive' }); return; }
    toast({ title: editing ? 'แก้ไขสำเร็จ' : 'เพิ่มสำเร็จ' });
    setDialogOpen(false); fetchEvents();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ยืนยันการลบ?')) return;
    await supabase.from('academic_calendar').delete().eq('id', id);
    toast({ title: 'ลบสำเร็จ' }); fetchEvents();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <Label className="text-xs">ปีการศึกษา</Label>
          <Input value={filterYear} onChange={e => setFilterYear(e.target.value)} className="w-24 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">ภาคเรียน</Label>
          <Select value={filterSemester} onValueChange={setFilterSemester}>
            <SelectTrigger className="w-24 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{['ทั้งหมด','1','2'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">ประเภท</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['ทั้งหมด','วันเรียน','วันหยุด','สอบ','ส่งเอกสาร','ประชุม','กิจกรรม','วิชาการ'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={fetchEvents} size="sm" variant="outline">โหลด</Button>
        <Button onClick={openAdd} size="sm" className="ml-auto"><Plus className="w-4 h-4 mr-1" />เพิ่มกิจกรรม</Button>
      </div>

      {loading ? <p className="text-center text-muted-foreground py-8">กำลังโหลด...</p> : (
        <div className="space-y-2">
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">ไม่พบข้อมูล</p>}
          {filtered.map(e => (
            <div key={e.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex-shrink-0 w-10 text-center">
                <CalendarDays className="w-5 h-5 text-muted-foreground mx-auto" />
                <p className="text-[10px] text-muted-foreground mt-0.5">ภาค {e.semester || '-'}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{e.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(e.start_date)}{e.end_date && e.end_date !== e.start_date ? ` — ${formatDate(e.end_date)}` : ''}
                </p>
                {e.description && <p className="text-xs text-gray-500 truncate">{e.description}</p>}
              </div>
              <Badge className={`text-xs flex-shrink-0 ${EVENT_COLOR[e.event_type] || 'bg-gray-100'}`}>{e.event_type}</Badge>
              <div className="flex gap-1 flex-shrink-0">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(e)}><Pencil className="w-3.5 h-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => handleDelete(e.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'แก้ไขกิจกรรม' : 'เพิ่มกิจกรรมในปฏิทิน'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2">
              <Label className="text-xs">ชื่อกิจกรรม *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">ประเภท</Label>
              <Select value={form.event_type} onValueChange={v => setForm(f => ({ ...f, event_type: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{['วันเรียน','วันหยุด','สอบ','ส่งเอกสาร','ประชุม','กิจกรรม','วิชาการ'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">ภาคเรียน</Label>
              <Select value={form.semester} onValueChange={v => setForm(f => ({ ...f, semester: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="1">1</SelectItem><SelectItem value="2">2</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">วันที่เริ่ม *</Label>
              <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">วันที่สิ้นสุด</Label>
              <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">ปีการศึกษา</Label>
              <Input value={form.academic_year} onChange={e => setForm(f => ({ ...f, academic_year: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">ทั้งวัน</Label>
              <Select value={form.is_all_day} onValueChange={v => setForm(f => ({ ...f, is_all_day: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="true">ใช่</SelectItem><SelectItem value="false">ไม่ใช่</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs">รายละเอียด</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="text-sm" />
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
