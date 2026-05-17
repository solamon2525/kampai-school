import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatThaiDateFull } from '@/lib/thaiDate';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, X, FileText } from 'lucide-react';

interface Meeting {
  id: string;
  title: string;
  meeting_date: string;
  meeting_time: string | null;
  location: string | null;
  attendees: string[] | null;
  agendas: string[] | null;
  decisions: string | null;
  minutes_url: string | null;
  created_at: string;
}

export default function MeetingsManagement() {
  const [records, setRecords] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Meeting | null>(null);
  const [form, setForm] = useState({
    title: '',
    meeting_date: new Date().toISOString().split('T')[0],
    meeting_time: '',
    location: '',
    decisions: '',
    minutes_url: '',
  });
  const [attendees, setAttendees] = useState<string[]>(['']);
  const [agendas, setAgendas] = useState<string[]>(['']);

  useEffect(() => {
    fetchRecords();
  }, []);

  async function fetchRecords() {
    setLoading(true);
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .order('meeting_date', { ascending: false });
    if (error) toast.error('โหลดข้อมูลไม่สำเร็จ');
    else setRecords(data || []);
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setForm({ title: '', meeting_date: new Date().toISOString().split('T')[0], meeting_time: '', location: '', decisions: '', minutes_url: '' });
    setAttendees(['']);
    setAgendas(['']);
    setDialogOpen(true);
  }

  function openEdit(r: Meeting) {
    setEditing(r);
    setForm({
      title: r.title,
      meeting_date: r.meeting_date,
      meeting_time: r.meeting_time || '',
      location: r.location || '',
      decisions: r.decisions || '',
      minutes_url: r.minutes_url || '',
    });
    setAttendees(r.attendees?.length ? r.attendees : ['']);
    setAgendas(r.agendas?.length ? r.agendas : ['']);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.title || !form.meeting_date) {
      toast.error('กรุณากรอกชื่อการประชุมและวันที่');
      return;
    }
    const cleanAttendees = attendees.filter(a => a.trim());
    const cleanAgendas = agendas.filter(a => a.trim());
    const payload = {
      title: form.title,
      meeting_date: form.meeting_date,
      meeting_time: form.meeting_time || null,
      location: form.location || null,
      attendees: cleanAttendees.length ? cleanAttendees : null,
      agendas: cleanAgendas.length ? cleanAgendas : null,
      decisions: form.decisions || null,
      minutes_url: form.minutes_url || null,
    };
    if (editing) {
      const { error } = await supabase.from('meetings').update(payload).eq('id', editing.id);
      if (error) { toast.error('บันทึกไม่สำเร็จ'); return; }
      toast.success('แก้ไขสำเร็จ');
    } else {
      const { error } = await supabase.from('meetings').insert(payload);
      if (error) { toast.error('บันทึกไม่สำเร็จ'); return; }
      toast.success('เพิ่มข้อมูลสำเร็จ');
    }
    setDialogOpen(false);
    fetchRecords();
  }

  async function handleDelete(id: string) {
    if (!confirm('ยืนยันการลบ?')) return;
    const { error } = await supabase.from('meetings').delete().eq('id', id);
    if (error) toast.error('ลบไม่สำเร็จ');
    else { toast.success('ลบสำเร็จ'); fetchRecords(); }
  }

  function updateListItem(list: string[], setList: (v: string[]) => void, idx: number, val: string) {
    const next = [...list];
    next[idx] = val;
    setList(next);
  }

  function addListItem(list: string[], setList: (v: string[]) => void) {
    setList([...list, '']);
  }

  function removeListItem(list: string[], setList: (v: string[]) => void, idx: number) {
    setList(list.filter((_, i) => i !== idx));
  }

  const filtered = records.filter(r =>
    !search ||
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    (r.location || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">การประชุม</h2>
          <p className="text-muted-foreground text-sm">จัดการข้อมูลการประชุม ระเบียบวาระ และมติที่ประชุม</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> เพิ่มการประชุม
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="ค้นหาชื่อการประชุม หรือสถานที่..."
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อการประชุม</TableHead>
              <TableHead>วันที่</TableHead>
              <TableHead>เวลา</TableHead>
              <TableHead>สถานที่</TableHead>
              <TableHead>ผู้เข้าร่วม</TableHead>
              <TableHead>รายงาน</TableHead>
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
                <TableCell className="font-medium max-w-[200px] truncate">{r.title}</TableCell>
                <TableCell className="whitespace-nowrap">{formatThaiDateFull(r.meeting_date)}</TableCell>
                <TableCell>{r.meeting_time || '-'}</TableCell>
                <TableCell>{r.location || '-'}</TableCell>
                <TableCell>
                  {r.attendees?.length ? (
                    <Badge variant="outline">{r.attendees.length} คน</Badge>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  {r.minutes_url ? (
                    <a href={r.minutes_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-sm">
                      <FileText className="w-3 h-3" /> ดูรายงาน
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'แก้ไขการประชุม' : 'เพิ่มการประชุม'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>ชื่อการประชุม <span className="text-destructive">*</span></Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="ชื่อการประชุม" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>วันที่ประชุม <span className="text-destructive">*</span></Label>
                <Input type="date" value={form.meeting_date} onChange={e => setForm(f => ({ ...f, meeting_date: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>เวลา</Label>
                <Input type="time" value={form.meeting_time} onChange={e => setForm(f => ({ ...f, meeting_time: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>สถานที่</Label>
              <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="ห้องประชุม / สถานที่" />
            </div>

            {/* Attendees */}
            <div className="space-y-2">
              <Label>ผู้เข้าร่วมประชุม</Label>
              {attendees.map((a, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    value={a}
                    onChange={e => updateListItem(attendees, setAttendees, idx, e.target.value)}
                    placeholder={`ชื่อผู้เข้าร่วม ${idx + 1}`}
                  />
                  {attendees.length > 1 && (
                    <Button size="icon" variant="ghost" onClick={() => removeListItem(attendees, setAttendees, idx)}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addListItem(attendees, setAttendees)}>
                <Plus className="w-3 h-3 mr-1" /> เพิ่มผู้เข้าร่วม
              </Button>
            </div>

            {/* Agendas */}
            <div className="space-y-2">
              <Label>ระเบียบวาระการประชุม</Label>
              {agendas.map((a, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <span className="text-sm text-muted-foreground w-6">{idx + 1}.</span>
                  <Input
                    value={a}
                    onChange={e => updateListItem(agendas, setAgendas, idx, e.target.value)}
                    placeholder={`วาระที่ ${idx + 1}`}
                  />
                  {agendas.length > 1 && (
                    <Button size="icon" variant="ghost" onClick={() => removeListItem(agendas, setAgendas, idx)}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addListItem(agendas, setAgendas)}>
                <Plus className="w-3 h-3 mr-1" /> เพิ่มวาระ
              </Button>
            </div>

            <div className="space-y-1">
              <Label>มติที่ประชุม</Label>
              <Textarea rows={3} value={form.decisions} onChange={e => setForm(f => ({ ...f, decisions: e.target.value }))} placeholder="สรุปมติที่ประชุม..." />
            </div>
            <div className="space-y-1">
              <Label>URL รายงานการประชุม</Label>
              <Input value={form.minutes_url} onChange={e => setForm(f => ({ ...f, minutes_url: e.target.value }))} placeholder="https://..." />
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
