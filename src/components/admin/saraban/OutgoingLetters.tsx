import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Pencil, Trash2, Paperclip, SendHorizontal, PenLine } from 'lucide-react';
import { TrackingTimeline } from '@/components/admin/docs-hub/TrackingTimeline';
import { SignaturePadDialog } from '@/components/admin/docs-hub/SignaturePadDialog';
import { SignatureList } from '@/components/admin/docs-hub/SignatureList';

interface OutgoingLetter {
    id: string;
    letter_number: string | null;
    sent_date: string;
    subject: string;
    recipient: string | null;
    priority: string;
    status: string;
    attachment_url: string | null;
    created_at: string;
}

const PRIORITY_OPTIONS = ['ปกติ', 'ด่วน', 'ด่วนมาก', 'ด่วนที่สุด'];
const STATUS_OPTIONS = ['ร่าง', 'รอลงนาม', 'ส่งแล้ว'];

const PRIORITY_COLOR: Record<string, string> = {
    'ปกติ': 'bg-secondary text-secondary-foreground',
    'ด่วน': 'bg-yellow-100 text-yellow-800',
    'ด่วนมาก': 'bg-orange-100 text-orange-800',
    'ด่วนที่สุด': 'bg-red-100 text-red-800',
};

const STATUS_COLOR: Record<string, string> = {
    'ร่าง': 'bg-secondary text-secondary-foreground',
    'รอลงนาม': 'bg-yellow-100 text-yellow-800',
    'ส่งแล้ว': 'bg-green-100 text-green-800',
};

const emptyForm = {
    sent_date: new Date().toISOString().slice(0, 10),
    subject: '',
    recipient: '',
    priority: 'ปกติ',
    status: 'ร่าง',
    attachment_url: '',
};

export const OutgoingLetters = () => {
    const [letters, setLetters] = useState<OutgoingLetter[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ทั้งหมด');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<OutgoingLetter | null>(null);
    const [form, setForm] = useState({ ...emptyForm });
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    const fetchLetters = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('outgoing_letters' as any)
            .select('*')
            .order('sent_date', { ascending: false });
        if (error) toast({ title: 'โหลดข้อมูลล้มเหลว', variant: 'destructive' });
        else setLetters((data as OutgoingLetter[]) || []);
        setLoading(false);
    };

    useEffect(() => { fetchLetters(); }, []);

    const openCreate = async () => {
        const { data } = await supabase.rpc('next_outgoing_number' as any);
        setEditing(null);
        setForm({ ...emptyForm, sent_date: new Date().toISOString().slice(0, 10) });
        (window as any).__nextOutgoingNumber = data;
        setDialogOpen(true);
    };

    const openEdit = (letter: OutgoingLetter) => {
        setEditing(letter);
        setForm({
            sent_date: letter.sent_date,
            subject: letter.subject,
            recipient: letter.recipient || '',
            priority: letter.priority,
            status: letter.status,
            attachment_url: letter.attachment_url || '',
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.subject.trim() || !form.sent_date) {
            toast({ title: 'กรุณากรอกข้อมูลให้ครบ', variant: 'destructive' });
            return;
        }
        setSaving(true);
        const payload: any = {
            ...form,
            recipient: form.recipient || null,
            attachment_url: form.attachment_url || null,
        };
        if (editing) {
            const { error } = await supabase.from('outgoing_letters' as any).update(payload).eq('id', editing.id);
            if (error) toast({ title: 'บันทึกล้มเหลว', description: error.message, variant: 'destructive' });
            else { toast({ title: 'บันทึกสำเร็จ' }); setDialogOpen(false); fetchLetters(); }
        } else {
            const autoNum = (window as any).__nextOutgoingNumber;
            const { error } = await supabase.from('outgoing_letters' as any).insert({ ...payload, letter_number: autoNum });
            if (error) toast({ title: 'เพิ่มล้มเหลว', description: error.message, variant: 'destructive' });
            else { toast({ title: 'เพิ่มหนังสือส่งสำเร็จ' }); setDialogOpen(false); fetchLetters(); }
        }
        setSaving(false);
    };

    const [signTarget, setSignTarget] = useState<OutgoingLetter | null>(null);

    const handleSignSuccess = async (target: OutgoingLetter) => {
        const { error } = await supabase
            .from('outgoing_letters' as any)
            .update({ status: 'ส่งแล้ว' })
            .eq('id', target.id);
        if (error) toast({ title: 'อัพเดตสถานะล้มเหลว', description: error.message, variant: 'destructive' });
        else { toast({ title: 'ลงนามและส่งแล้ว' }); fetchLetters(); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบหนังสือนี้?')) return;
        await supabase.from('outgoing_letters' as any).delete().eq('id', id);
        setLetters(prev => prev.filter(l => l.id !== id));
    };

    const filtered = letters.filter(l => {
        const matchSearch = !search || l.subject.toLowerCase().includes(search.toLowerCase()) || l.recipient?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'ทั้งหมด' || l.status === statusFilter;
        return matchSearch && matchStatus;
    });

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-1 flex items-center gap-2">
                        <SendHorizontal className="w-7 h-7 text-primary" />
                        หนังสือส่ง
                    </h1>
                    <p className="text-muted-foreground">ทะเบียนส่งหนังสือราชการ</p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    ออกหนังสือใหม่
                </Button>
            </div>

            <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="ค้นหาเรื่อง หรือผู้รับ..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
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
                    <CardTitle className="text-base">หนังสือส่งทั้งหมด ({filtered.length} ฉบับ)</CardTitle>
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
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">เลขที่</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">วันที่</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">เรื่อง</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">ถึง</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">ความสำคัญ</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">สถานะ</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filtered.map(l => (
                                        <tr key={l.id} className="hover:bg-secondary/30 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{l.letter_number || '-'}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">{new Date(l.sent_date).toLocaleDateString('th-TH')}</td>
                                            <td className="px-4 py-3">
                                                <p className="font-medium line-clamp-1">{l.subject}</p>
                                                {l.attachment_url && <Paperclip className="w-3 h-3 text-muted-foreground inline mt-0.5" />}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">{l.recipient || '-'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLOR[l.priority] || ''}`}>{l.priority}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[l.status] || ''}`}>{l.status}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1">
                                                    {l.status === 'รอลงนาม' && (
                                                        <Button variant="ghost" size="icon" className="w-7 h-7 text-primary" title="ลงนาม" onClick={() => setSignTarget(l)}>
                                                            <PenLine className="w-3.5 h-3.5" />
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(l)}><Pencil className="w-3.5 h-3.5" /></Button>
                                                    <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive" onClick={() => handleDelete(l.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'แก้ไขหนังสือส่ง' : 'ออกหนังสือส่งใหม่'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div>
                            <Label className="mb-1.5 block">วันที่ส่ง *</Label>
                            <Input type="date" value={form.sent_date} onChange={e => setForm(f => ({ ...f, sent_date: e.target.value }))} />
                        </div>
                        <div>
                            <Label className="mb-1.5 block">เรื่อง *</Label>
                            <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="เรื่องของหนังสือ" />
                        </div>
                        <div>
                            <Label className="mb-1.5 block">ถึง (ผู้รับ/หน่วยงาน)</Label>
                            <Input value={form.recipient} onChange={e => setForm(f => ({ ...f, recipient: e.target.value }))} placeholder="ชื่อผู้รับ หรือหน่วยงาน" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="mb-1.5 block">ความสำคัญ</Label>
                                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{PRIORITY_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="mb-1.5 block">สถานะ</Label>
                                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label className="mb-1.5 block">URL ไฟล์แนบ</Label>
                            <Input value={form.attachment_url} onChange={e => setForm(f => ({ ...f, attachment_url: e.target.value }))} placeholder="https://..." />
                        </div>
                        {editing ? (
                            <div className="border-t border-border pt-4 space-y-4">
                                <div>
                                    <Label className="mb-2 block text-xs text-muted-foreground">ลายเซ็น</Label>
                                    <SignatureList entityType="outgoing_letter" entityId={editing.id} />
                                </div>
                                <TrackingTimeline entityType="outgoing" entityId={editing.id} />
                            </div>
                        ) : null}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
                        <Button onClick={handleSave} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {signTarget ? (
                <SignaturePadDialog
                    open={!!signTarget}
                    onOpenChange={(v) => { if (!v) setSignTarget(null); }}
                    entityType="outgoing_letter"
                    entityId={signTarget.id}
                    role="signer"
                    title="ลงนามหนังสือส่ง"
                    description={`เรื่อง: ${signTarget.subject}`}
                    onSuccess={() => {
                        const target = signTarget;
                        setSignTarget(null);
                        if (target) handleSignSuccess(target);
                    }}
                />
            ) : null}
        </div>
    );
};
