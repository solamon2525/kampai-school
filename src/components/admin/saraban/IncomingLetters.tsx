import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Pencil, Trash2, Paperclip, MailOpen } from 'lucide-react';

interface IncomingLetter {
    id: string;
    letter_number: string | null;
    received_date: string;
    subject: string;
    sender: string | null;
    priority: string;
    status: string;
    due_date: string | null;
    notes: string | null;
    attachment_url: string | null;
    created_at: string;
}

const PRIORITY_OPTIONS = ['ปกติ', 'ด่วน', 'ด่วนมาก', 'ด่วนที่สุด'];
const STATUS_OPTIONS = ['รอดำเนินการ', 'กำลังดำเนินการ', 'เสร็จแล้ว'];

const PRIORITY_COLOR: Record<string, string> = {
    'ปกติ': 'bg-secondary text-secondary-foreground',
    'ด่วน': 'bg-yellow-100 text-yellow-800',
    'ด่วนมาก': 'bg-orange-100 text-orange-800',
    'ด่วนที่สุด': 'bg-red-100 text-red-800',
};

const STATUS_COLOR: Record<string, string> = {
    'รอดำเนินการ': 'bg-blue-100 text-blue-800',
    'กำลังดำเนินการ': 'bg-yellow-100 text-yellow-800',
    'เสร็จแล้ว': 'bg-green-100 text-green-800',
};

const emptyForm = {
    received_date: new Date().toISOString().slice(0, 10),
    subject: '',
    sender: '',
    priority: 'ปกติ',
    status: 'รอดำเนินการ',
    due_date: '',
    notes: '',
    attachment_url: '',
};

export const IncomingLetters = () => {
    const [letters, setLetters] = useState<IncomingLetter[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ทั้งหมด');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<IncomingLetter | null>(null);
    const [form, setForm] = useState({ ...emptyForm });
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    const fetchLetters = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('incoming_letters' as any)
            .select('*')
            .order('received_date', { ascending: false });
        if (error) toast({ title: 'โหลดข้อมูลล้มเหลว', variant: 'destructive' });
        else setLetters((data as IncomingLetter[]) || []);
        setLoading(false);
    };

    useEffect(() => { fetchLetters(); }, []);

    const openCreate = async () => {
        // Get auto-number
        const { data } = await supabase.rpc('next_incoming_number' as any);
        setEditing(null);
        setForm({ ...emptyForm, received_date: new Date().toISOString().slice(0, 10) });
        setDialogOpen(true);
        if (data) setForm(f => ({ ...f }));
        // store number for save
        (window as any).__nextIncomingNumber = data;
    };

    const openEdit = (letter: IncomingLetter) => {
        setEditing(letter);
        setForm({
            received_date: letter.received_date,
            subject: letter.subject,
            sender: letter.sender || '',
            priority: letter.priority,
            status: letter.status,
            due_date: letter.due_date || '',
            notes: letter.notes || '',
            attachment_url: letter.attachment_url || '',
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.subject.trim() || !form.received_date) {
            toast({ title: 'กรุณากรอกข้อมูลให้ครบ', variant: 'destructive' });
            return;
        }
        setSaving(true);
        const payload: any = {
            ...form,
            sender: form.sender || null,
            due_date: form.due_date || null,
            notes: form.notes || null,
            attachment_url: form.attachment_url || null,
        };

        if (editing) {
            const { error } = await supabase.from('incoming_letters' as any).update(payload).eq('id', editing.id);
            if (error) { toast({ title: 'บันทึกล้มเหลว', description: error.message, variant: 'destructive' }); }
            else { toast({ title: 'บันทึกสำเร็จ' }); setDialogOpen(false); fetchLetters(); }
        } else {
            const autoNum = (window as any).__nextIncomingNumber;
            const { error } = await supabase.from('incoming_letters' as any).insert({ ...payload, letter_number: autoNum });
            if (error) { toast({ title: 'เพิ่มล้มเหลว', description: error.message, variant: 'destructive' }); }
            else { toast({ title: 'เพิ่มหนังสือรับสำเร็จ' }); setDialogOpen(false); fetchLetters(); }
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบหนังสือนี้?')) return;
        await supabase.from('incoming_letters' as any).delete().eq('id', id);
        setLetters(prev => prev.filter(l => l.id !== id));
    };

    const filtered = letters.filter(l => {
        const matchSearch = !search || l.subject.toLowerCase().includes(search.toLowerCase()) || l.sender?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'ทั้งหมด' || l.status === statusFilter;
        return matchSearch && matchStatus;
    });

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-1 flex items-center gap-2">
                        <MailOpen className="w-7 h-7 text-primary" />
                        หนังสือรับ
                    </h1>
                    <p className="text-muted-foreground">ทะเบียนรับหนังสือราชการ</p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    รับหนังสือใหม่
                </Button>
            </div>

            {/* Search + Filter */}
            <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="ค้นหาเรื่อง หรือผู้ส่ง..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ทั้งหมด">สถานะทั้งหมด</SelectItem>
                        {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">หนังสือรับทั้งหมด ({filtered.length} ฉบับ)</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <p className="text-center py-12 text-muted-foreground">กำลังโหลด...</p>
                    ) : filtered.length === 0 ? (
                        <p className="text-center py-12 text-muted-foreground">ไม่พบข้อมูล</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-secondary/50">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">เลขทะเบียน</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">วันที่รับ</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">เรื่อง</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">จาก</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">ความสำคัญ</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">สถานะ</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">ครบกำหนด</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filtered.map(l => (
                                        <tr key={l.id} className="hover:bg-secondary/30 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{l.letter_number || '-'}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">{new Date(l.received_date).toLocaleDateString('th-TH')}</td>
                                            <td className="px-4 py-3">
                                                <p className="font-medium line-clamp-1">{l.subject}</p>
                                                {l.attachment_url && <Paperclip className="w-3 h-3 text-muted-foreground inline mt-0.5" />}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">{l.sender || '-'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLOR[l.priority] || ''}`}>
                                                    {l.priority}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[l.status] || ''}`}>
                                                    {l.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground text-xs">
                                                {l.due_date ? new Date(l.due_date).toLocaleDateString('th-TH') : '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(l)}>
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive" onClick={() => handleDelete(l.id)}>
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'แก้ไขหนังสือรับ' : 'รับหนังสือใหม่'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="mb-1.5 block">วันที่รับ *</Label>
                                <Input type="date" value={form.received_date} onChange={e => setForm(f => ({ ...f, received_date: e.target.value }))} />
                            </div>
                            <div>
                                <Label className="mb-1.5 block">ครบกำหนด</Label>
                                <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                            </div>
                        </div>
                        <div>
                            <Label className="mb-1.5 block">เรื่อง *</Label>
                            <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="เรื่องของหนังสือ" />
                        </div>
                        <div>
                            <Label className="mb-1.5 block">จาก (ผู้ส่ง/หน่วยงาน)</Label>
                            <Input value={form.sender} onChange={e => setForm(f => ({ ...f, sender: e.target.value }))} placeholder="ชื่อผู้ส่ง หรือหน่วยงาน" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="mb-1.5 block">ความสำคัญ</Label>
                                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {PRIORITY_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="mb-1.5 block">สถานะ</Label>
                                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label className="mb-1.5 block">หมายเหตุ</Label>
                            <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="หมายเหตุเพิ่มเติม" />
                        </div>
                        <div>
                            <Label className="mb-1.5 block">URL ไฟล์แนบ</Label>
                            <Input value={form.attachment_url} onChange={e => setForm(f => ({ ...f, attachment_url: e.target.value }))} placeholder="https://..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
                        <Button onClick={handleSave} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
