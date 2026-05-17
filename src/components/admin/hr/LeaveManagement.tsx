import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThaiDatePicker } from '@/components/shared/ThaiDatePicker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Pencil, Trash2, Search, CheckCircle, XCircle, PenLine } from 'lucide-react';
import { SignaturePadDialog } from '@/components/admin/docs-hub/SignaturePadDialog';
import { SignatureList } from '@/components/admin/docs-hub/SignatureList';

interface Staff { id: string; name: string; }
interface LeaveRequest {
  id: string;
  staff_id: string | null;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string | null;
  status: string;
  approved_by: string | null;
  notes: string | null;
  attachment_url: string | null;
  created_at: string;
  staff?: Staff;
}

const LEAVE_TYPES = ['ลาป่วย', 'ลากิจ', 'ลาพักร้อน', 'ลาคลอด', 'ลาบวช', 'ลาอื่นๆ'];
const STATUSES = ['รออนุมัติ', 'อนุมัติ', 'ไม่อนุมัติ'];

const statusVariant = (s: string) => {
  if (s === 'อนุมัติ') return 'default';
  if (s === 'ไม่อนุมัติ') return 'destructive';
  return 'secondary';
};

export default function LeaveManagement() {
  const [records, setRecords] = useState<LeaveRequest[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LeaveRequest | null>(null);
  const [form, setForm] = useState({
    staff_id: '',
    leave_type: 'ลาป่วย',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    days: 1,
    reason: '',
    status: 'รออนุมัติ',
    approved_by: '',
    notes: '',
    attachment_url: '',
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
      .from('leave_requests')
      .select('*, staff:staff_id(id, name)')
      .order('created_at', { ascending: false });
    if (error) toast.error('โหลดข้อมูลไม่สำเร็จ');
    else setRecords(data || []);
    setLoading(false);
  }

  function calcDays(start: string, end: string) {
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  }

  function openCreate() {
    setEditing(null);
    const today = new Date().toISOString().split('T')[0];
    setForm({ staff_id: '', leave_type: 'ลาป่วย', start_date: today, end_date: today, days: 1, reason: '', status: 'รออนุมัติ', approved_by: '', notes: '', attachment_url: '' });
    setDialogOpen(true);
  }

  function openEdit(r: LeaveRequest) {
    setEditing(r);
    setForm({
      staff_id: r.staff_id || '',
      leave_type: r.leave_type,
      start_date: r.start_date,
      end_date: r.end_date,
      days: r.days,
      reason: r.reason || '',
      status: r.status,
      approved_by: r.approved_by || '',
      notes: r.notes || '',
      attachment_url: r.attachment_url || '',
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.staff_id || !form.leave_type) {
      toast.error('กรุณาเลือกบุคลากรและประเภทการลา');
      return;
    }
    const payload = {
      staff_id: form.staff_id || null,
      leave_type: form.leave_type,
      start_date: form.start_date,
      end_date: form.end_date,
      days: calcDays(form.start_date, form.end_date),
      reason: form.reason || null,
      status: form.status,
      approved_by: form.approved_by || null,
      notes: form.notes || null,
      attachment_url: form.attachment_url || null,
    };
    if (editing) {
      const { error } = await supabase.from('leave_requests').update(payload).eq('id', editing.id);
      if (error) { toast.error('บันทึกไม่สำเร็จ'); return; }
      toast.success('แก้ไขสำเร็จ');
    } else {
      const { error } = await supabase.from('leave_requests').insert(payload);
      if (error) { toast.error('บันทึกไม่สำเร็จ'); return; }
      toast.success('เพิ่มข้อมูลสำเร็จ');
    }
    setDialogOpen(false);
    fetchRecords();
  }

  async function handleDelete(id: string) {
    if (!confirm('ยืนยันการลบ?')) return;
    const { error } = await supabase.from('leave_requests').delete().eq('id', id);
    if (error) toast.error('ลบไม่สำเร็จ');
    else { toast.success('ลบสำเร็จ'); fetchRecords(); }
  }

  const [signApproveTarget, setSignApproveTarget] = useState<LeaveRequest | null>(null);

  async function quickReject(id: string) {
    const { error } = await supabase.from('leave_requests').update({ status: 'ไม่อนุมัติ', approved_at: new Date().toISOString() }).eq('id', id);
    if (error) toast.error('อัพเดตไม่สำเร็จ');
    else { toast.success('ไม่อนุมัติ'); fetchRecords(); }
  }

  /** flip status → อนุมัติ หลัง e-Signature upload สำเร็จ */
  async function handleSignatureSuccess(req: LeaveRequest, signerName: string) {
    const { error } = await supabase
      .from('leave_requests')
      .update({ status: 'อนุมัติ', approved_by: signerName, approved_at: new Date().toISOString() })
      .eq('id', req.id);
    if (error) toast.error('อัพเดตสถานะไม่สำเร็จ: ' + error.message);
    else { toast.success('อนุมัติเรียบร้อยแล้ว'); fetchRecords(); }
  }

  const filtered = records.filter(r => {
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const staffName = (r.staff as any)?.name || '';
    const matchSearch = !search || staffName.toLowerCase().includes(search.toLowerCase()) || r.leave_type.includes(search);
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">การลา</h2>
          <p className="text-muted-foreground text-sm">บันทึกและติดตามการลาของบุคลากร</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />บันทึกการลา</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="ค้นหาชื่อบุคลากร..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="สถานะ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานะ</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>บุคลากร</TableHead>
              <TableHead>ประเภทการลา</TableHead>
              <TableHead>วันที่</TableHead>
              <TableHead>จำนวนวัน</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">กำลังโหลด...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">ไม่พบข้อมูล</TableCell></TableRow>
            ) : filtered.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{(r.staff as any)?.name || '-'}</TableCell>
                <TableCell>{r.leave_type}</TableCell>
                <TableCell className="text-sm">{r.start_date}{r.start_date !== r.end_date ? ` – ${r.end_date}` : ''}</TableCell>
                <TableCell>{r.days} วัน</TableCell>
                <TableCell><Badge variant={statusVariant(r.status) as any}>{r.status}</Badge></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {r.status === 'รออนุมัติ' && (
                      <>
                        <Button size="icon" variant="ghost" title="อนุมัติ (ลงนาม)" onClick={() => setSignApproveTarget(r)}><PenLine className="w-4 h-4 text-green-600" /></Button>
                        <Button size="icon" variant="ghost" title="ไม่อนุมัติ" onClick={() => quickReject(r.id)}><XCircle className="w-4 h-4 text-destructive" /></Button>
                      </>
                    )}
                    {r.status === 'อนุมัติ' && (
                      <Badge variant="outline" className="text-[10px]"><CheckCircle className="w-3 h-3 mr-0.5 text-green-600" /> ลงนาม</Badge>
                    )}
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
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'แก้ไขการลา' : 'บันทึกการลา'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>บุคลากร <span className="text-destructive">*</span></Label>
              <Select value={form.staff_id} onValueChange={v => setForm(f => ({ ...f, staff_id: v }))}>
                <SelectTrigger><SelectValue placeholder="เลือกบุคลากร" /></SelectTrigger>
                <SelectContent>
                  {staffList.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>ประเภทการลา</Label>
                <Select value={form.leave_type} onValueChange={v => setForm(f => ({ ...f, leave_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LEAVE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>สถานะ</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>วันที่เริ่ม</Label>
                <ThaiDatePicker value={form.start_date} onChange={v => setForm(f => ({ ...f, start_date: v }))} />
              </div>
              <div className="space-y-1">
                <Label>วันที่สิ้นสุด</Label>
                <ThaiDatePicker value={form.end_date} onChange={v => setForm(f => ({ ...f, end_date: v }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>เหตุผล</Label>
              <Textarea rows={2} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="เหตุผลในการลา..." />
            </div>
            <div className="space-y-1">
              <Label>ผู้อนุมัติ</Label>
              <Input value={form.approved_by} onChange={e => setForm(f => ({ ...f, approved_by: e.target.value }))} placeholder="ชื่อผู้อนุมัติ" />
            </div>
            <div className="space-y-1">
              <Label>URL ไฟล์แนบ</Label>
              <Input value={form.attachment_url} onChange={e => setForm(f => ({ ...f, attachment_url: e.target.value }))} placeholder="https://..." />
            </div>
            {editing ? (
              <div className="border-t border-border pt-3">
                <Label className="mb-2 block text-xs text-muted-foreground">ลายเซ็นผู้อนุมัติ</Label>
                <SignatureList entityType="leave_request" entityId={editing.id} />
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSave}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {signApproveTarget ? (
        <SignaturePadDialog
          open={!!signApproveTarget}
          onOpenChange={(v) => { if (!v) setSignApproveTarget(null); }}
          entityType="leave_request"
          entityId={signApproveTarget.id}
          role="approver"
          title="อนุมัติใบลา — ลงนามอิเล็กทรอนิกส์"
          description={`ลาประเภท ${signApproveTarget.leave_type} • ${signApproveTarget.days} วัน`}
          onSuccess={({ signerName }) => {
            const target = signApproveTarget;
            setSignApproveTarget(null);
            if (target) handleSignatureSuccess(target, signerName);
          }}
        />
      ) : null}
    </div>
  );
}
