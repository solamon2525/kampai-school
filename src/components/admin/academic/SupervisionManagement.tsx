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
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface SupervisionRecord {
  id: string;
  staff_id: string;
  supervisor: string;
  visit_date: string;
  subject_observed: string | null;
  grade_observed: string | null;
  strengths: string | null;
  improvements: string | null;
  recommendations: string | null;
  followup_date: string | null;
  status: string;
  staff?: { name: string } | null;
}

interface StaffOption { id: string; name: string; }

const STATUS_COLOR: Record<string, string> = {
  'รอติดตาม': 'bg-yellow-100 text-yellow-800',
  'ติดตามแล้ว': 'bg-green-100 text-green-800',
};

const emptyForm = {
  staff_id: '', supervisor: '', visit_date: new Date().toISOString().slice(0, 10),
  subject_observed: '', grade_observed: '', strengths: '',
  improvements: '', recommendations: '', followup_date: '', status: 'รอติดตาม',
};

const formatDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

export const SupervisionManagement = () => {
  const [records, setRecords] = useState<SupervisionRecord[]>([]);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ทั้งหมด');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SupervisionRecord | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const { toast } = useToast();

  const fetchRecords = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('supervision_records')
      .select('*, staff(name)')
      .order('visit_date', { ascending: false });
    setRecords((data as SupervisionRecord[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchRecords(); }, []);
  useEffect(() => {
    supabase.from('staff').select('id, name').order('name').then(({ data }) => setStaffList((data as StaffOption[]) || []));
  }, []);

  const filtered = filterStatus === 'ทั้งหมด' ? records : records.filter(r => r.status === filterStatus);

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm }); setDialogOpen(true); };
  const openEdit = (r: SupervisionRecord) => {
    setEditing(r);
    setForm({
      staff_id: r.staff_id, supervisor: r.supervisor, visit_date: r.visit_date,
      subject_observed: r.subject_observed || '', grade_observed: r.grade_observed || '',
      strengths: r.strengths || '', improvements: r.improvements || '',
      recommendations: r.recommendations || '', followup_date: r.followup_date || '', status: r.status,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.staff_id || !form.supervisor) { toast({ title: 'กรุณาเลือกครูและผู้นิเทศ', variant: 'destructive' }); return; }
    const payload = {
      staff_id: form.staff_id, supervisor: form.supervisor, visit_date: form.visit_date,
      subject_observed: form.subject_observed || null, grade_observed: form.grade_observed || null,
      strengths: form.strengths || null, improvements: form.improvements || null,
      recommendations: form.recommendations || null, followup_date: form.followup_date || null, status: form.status,
    };
    const { error } = editing
      ? await supabase.from('supervision_records').update(payload).eq('id', editing.id)
      : await supabase.from('supervision_records').insert(payload);
    if (error) { toast({ title: 'เกิดข้อผิดพลาด', description: error.message, variant: 'destructive' }); return; }
    toast({ title: editing ? 'แก้ไขสำเร็จ' : 'บันทึกสำเร็จ' });
    setDialogOpen(false); fetchRecords();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ยืนยันการลบ?')) return;
    await supabase.from('supervision_records').delete().eq('id', id);
    toast({ title: 'ลบสำเร็จ' }); fetchRecords();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <Label className="text-xs">สถานะ</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{['ทั้งหมด','รอติดตาม','ติดตามแล้ว'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button onClick={openAdd} size="sm" className="ml-auto"><Plus className="w-4 h-4 mr-1" />บันทึกการนิเทศ</Button>
      </div>

      {loading ? <p className="text-center text-muted-foreground py-8">กำลังโหลด...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-3 py-2 font-medium text-xs w-28">วันที่นิเทศ</th>
                <th className="text-left px-3 py-2 font-medium text-xs">ครูที่ถูกนิเทศ</th>
                <th className="text-left px-3 py-2 font-medium text-xs w-28">ผู้นิเทศ</th>
                <th className="text-left px-3 py-2 font-medium text-xs w-24">วิชา/ชั้น</th>
                <th className="text-left px-3 py-2 font-medium text-xs w-28">วันติดตาม</th>
                <th className="text-center px-3 py-2 font-medium text-xs w-24">สถานะ</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">ไม่พบข้อมูล</td></tr>}
              {filtered.map(r => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2 text-xs">{formatDate(r.visit_date)}</td>
                  <td className="px-3 py-2 font-medium text-xs">{r.staff?.name || '-'}</td>
                  <td className="px-3 py-2 text-xs">{r.supervisor}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {[r.subject_observed, r.grade_observed].filter(Boolean).join(' / ') || '-'}
                  </td>
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
          <DialogHeader><DialogTitle>{editing ? 'แก้ไขบันทึกนิเทศ' : 'บันทึกการนิเทศชั้นเรียน'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div>
              <Label className="text-xs">ครูที่ถูกนิเทศ *</Label>
              <Select value={form.staff_id} onValueChange={v => setForm(f => ({ ...f, staff_id: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="เลือกครู" /></SelectTrigger>
                <SelectContent>{staffList.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">ผู้นิเทศ *</Label>
              <Input value={form.supervisor} onChange={e => setForm(f => ({ ...f, supervisor: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">วันที่นิเทศ</Label>
              <Input type="date" value={form.visit_date} onChange={e => setForm(f => ({ ...f, visit_date: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">วิชาที่สังเกต</Label>
              <Input value={form.subject_observed} onChange={e => setForm(f => ({ ...f, subject_observed: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">ชั้นที่สังเกต</Label>
              <Input value={form.grade_observed} onChange={e => setForm(f => ({ ...f, grade_observed: e.target.value }))} className="h-8 text-sm" placeholder="ป.3" />
            </div>
            <div>
              <Label className="text-xs">วันที่นัดติดตาม</Label>
              <Input type="date" value={form.followup_date} onChange={e => setForm(f => ({ ...f, followup_date: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">สถานะ</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{['รอติดตาม','ติดตามแล้ว'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs">จุดเด่น</Label>
              <Textarea value={form.strengths} onChange={e => setForm(f => ({ ...f, strengths: e.target.value }))} rows={2} className="text-sm" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">จุดที่ควรพัฒนา</Label>
              <Textarea value={form.improvements} onChange={e => setForm(f => ({ ...f, improvements: e.target.value }))} rows={2} className="text-sm" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">ข้อเสนอแนะ</Label>
              <Textarea value={form.recommendations} onChange={e => setForm(f => ({ ...f, recommendations: e.target.value }))} rows={2} className="text-sm" />
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
