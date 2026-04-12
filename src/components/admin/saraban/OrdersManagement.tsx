import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, FileText } from 'lucide-react';

interface OrderAnnouncement {
  id: string;
  doc_type: string;
  doc_number: string;
  doc_date: string;
  subject: string;
  content: string | null;
  attachment_url: string | null;
  created_at: string;
}

const DOC_TYPES = ['คำสั่ง', 'ประกาศ', 'บันทึกข้อความ'];

const docTypeBadgeVariant = (type: string) => {
  switch (type) {
    case 'คำสั่ง': return 'destructive';
    case 'ประกาศ': return 'default';
    case 'บันทึกข้อความ': return 'secondary';
    default: return 'outline';
  }
};

export default function OrdersManagement() {
  const [records, setRecords] = useState<OrderAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<OrderAnnouncement | null>(null);
  const [form, setForm] = useState({
    doc_type: 'คำสั่ง',
    doc_number: '',
    doc_date: new Date().toISOString().split('T')[0],
    subject: '',
    content: '',
    attachment_url: '',
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  async function fetchRecords() {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders_announcements')
      .select('*')
      .order('doc_date', { ascending: false });
    if (error) toast.error('โหลดข้อมูลไม่สำเร็จ');
    else setRecords(data || []);
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setForm({
      doc_type: 'คำสั่ง',
      doc_number: '',
      doc_date: new Date().toISOString().split('T')[0],
      subject: '',
      content: '',
      attachment_url: '',
    });
    setDialogOpen(true);
  }

  function openEdit(r: OrderAnnouncement) {
    setEditing(r);
    setForm({
      doc_type: r.doc_type,
      doc_number: r.doc_number,
      doc_date: r.doc_date,
      subject: r.subject,
      content: r.content || '',
      attachment_url: r.attachment_url || '',
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.doc_number || !form.subject) {
      toast.error('กรุณากรอกเลขที่และเรื่อง');
      return;
    }
    const payload = {
      doc_type: form.doc_type,
      doc_number: form.doc_number,
      doc_date: form.doc_date,
      subject: form.subject,
      content: form.content || null,
      attachment_url: form.attachment_url || null,
    };
    if (editing) {
      const { error } = await supabase.from('orders_announcements').update(payload).eq('id', editing.id);
      if (error) { toast.error('บันทึกไม่สำเร็จ'); return; }
      toast.success('แก้ไขสำเร็จ');
    } else {
      const { error } = await supabase.from('orders_announcements').insert(payload);
      if (error) { toast.error('บันทึกไม่สำเร็จ'); return; }
      toast.success('เพิ่มข้อมูลสำเร็จ');
    }
    setDialogOpen(false);
    fetchRecords();
  }

  async function handleDelete(id: string) {
    if (!confirm('ยืนยันการลบ?')) return;
    const { error } = await supabase.from('orders_announcements').delete().eq('id', id);
    if (error) toast.error('ลบไม่สำเร็จ');
    else { toast.success('ลบสำเร็จ'); fetchRecords(); }
  }

  const filtered = records.filter(r => {
    const matchType = filterType === 'all' || r.doc_type === filterType;
    const matchSearch = !search ||
      r.subject.toLowerCase().includes(search.toLowerCase()) ||
      r.doc_number.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">คำสั่ง / ประกาศ / บันทึกข้อความ</h2>
          <p className="text-muted-foreground text-sm">จัดการเอกสารคำสั่ง ประกาศ และบันทึกข้อความ</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> เพิ่มเอกสาร
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาเรื่อง หรือเลขที่..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="ประเภทเอกสาร" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกประเภท</SelectItem>
            {DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ประเภท</TableHead>
              <TableHead>เลขที่</TableHead>
              <TableHead>วันที่</TableHead>
              <TableHead>เรื่อง</TableHead>
              <TableHead>ไฟล์แนบ</TableHead>
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
                <TableCell>
                  <Badge variant={docTypeBadgeVariant(r.doc_type) as any}>{r.doc_type}</Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">{r.doc_number}</TableCell>
                <TableCell>{r.doc_date}</TableCell>
                <TableCell className="max-w-[300px] truncate">{r.subject}</TableCell>
                <TableCell>
                  {r.attachment_url ? (
                    <a href={r.attachment_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-sm">
                      <FileText className="w-3 h-3" /> ดูไฟล์
                    </a>
                  ) : '-'}
                </TableCell>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'แก้ไขเอกสาร' : 'เพิ่มเอกสาร'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>ประเภทเอกสาร</Label>
                <Select value={form.doc_type} onValueChange={v => setForm(f => ({ ...f, doc_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>เลขที่เอกสาร</Label>
                <Input value={form.doc_number} onChange={e => setForm(f => ({ ...f, doc_number: e.target.value }))} placeholder="เช่น 001/2568" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>วันที่</Label>
              <Input type="date" value={form.doc_date} onChange={e => setForm(f => ({ ...f, doc_date: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>เรื่อง</Label>
              <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="เรื่องของเอกสาร" />
            </div>
            <div className="space-y-1">
              <Label>เนื้อหา (ถ้ามี)</Label>
              <Textarea rows={4} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="รายละเอียดเนื้อหา..." />
            </div>
            <div className="space-y-1">
              <Label>URL ไฟล์แนบ (ถ้ามี)</Label>
              <Input value={form.attachment_url} onChange={e => setForm(f => ({ ...f, attachment_url: e.target.value }))} placeholder="https://..." />
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
