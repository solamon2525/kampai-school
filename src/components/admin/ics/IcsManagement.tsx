import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, ShieldCheck, FileText } from 'lucide-react';
import {
    icsService, type IcsForm, type IcsFormType, type IcsStatus,
} from '@/services/ics.service';
import { currentFiscalYearBE } from '@/services/budget.service';

const FORM_TYPES: IcsFormType[] = ['ปย.1', 'ปย.2', 'ปย.3'];
const STATUSES: IcsStatus[] = ['ร่าง', 'ส่ง', 'อนุมัติ'];

const FORM_HINT: Record<IcsFormType, string> = {
    'ปย.1': 'แบบประเมินองค์ประกอบของการควบคุมภายใน',
    'ปย.2': 'แบบประเมินผลการควบคุมภายใน + แผนบริหารความเสี่ยง',
    'ปย.3': 'แบบติดตามรายงานผลการดำเนินงาน (รายไตรมาส)',
};

const STATUS_BADGE: Record<IcsStatus, 'secondary' | 'default'> = {
    'ร่าง': 'secondary', 'ส่ง': 'default', 'อนุมัติ': 'default',
};

const IcsManagement = () => {
    const [year, setYear] = useState<number>(currentFiscalYearBE());
    const [forms, setForms] = useState<IcsForm[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<IcsForm | null>(null);
    const [form, setForm] = useState<{
        form_type: IcsFormType; title: string; status: IcsStatus;
        prepared_by: string; content_json: string;
    }>({
        form_type: 'ปย.1', title: '', status: 'ร่าง',
        prepared_by: '', content_json: '{}',
    });

    const reload = async () => {
        setLoading(true);
        const res = await icsService.list(year);
        if (res.data) setForms(res.data);
        setLoading(false);
    };

    useEffect(() => { reload(); /* eslint-disable-next-line */ }, [year]);

    const openCreate = () => {
        setEditing(null);
        setForm({
            form_type: 'ปย.1',
            title: 'แบบ ปย.1 ปีงบประมาณ ' + year,
            status: 'ร่าง',
            prepared_by: '',
            content_json: JSON.stringify({ sections: [] }, null, 2),
        });
        setDialogOpen(true);
    };

    const openEdit = (f: IcsForm) => {
        setEditing(f);
        setForm({
            form_type: f.form_type,
            title: f.title,
            status: f.status,
            prepared_by: f.prepared_by ?? '',
            content_json: JSON.stringify(f.content ?? {}, null, 2),
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        let content: Record<string, unknown> = {};
        try { content = JSON.parse(form.content_json || '{}'); }
        catch { toast({ title: 'เนื้อหา JSON ไม่ถูกต้อง', variant: 'destructive' }); return; }

        if (!form.title.trim()) { toast({ title: 'กรุณาระบุชื่อ', variant: 'destructive' }); return; }

        if (editing) {
            const res = await icsService.update(editing.id, {
                form_type: form.form_type, title: form.title, status: form.status,
                content, prepared_by: form.prepared_by || null,
                approved_at: form.status === 'อนุมัติ' ? new Date().toISOString() : editing.approved_at,
            });
            if (res.error) { toast({ title: 'บันทึกล้มเหลว', description: res.error.message, variant: 'destructive' }); return; }
        } else {
            const res = await icsService.create({
                form_type: form.form_type, fiscal_year: year, title: form.title,
                content, prepared_by: form.prepared_by || null,
            });
            if (res.error) { toast({ title: 'สร้างล้มเหลว', description: res.error.message, variant: 'destructive' }); return; }
        }
        toast({ title: 'บันทึกแล้ว' });
        setDialogOpen(false);
        reload();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ยืนยันการลบฟอร์ม?')) return;
        await icsService.remove(id);
        toast({ title: 'ลบแล้ว' });
        reload();
    };

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
            <div className="flex items-end justify-between gap-3 flex-wrap">
                <div>
                    <p className="text-xs font-semibold text-primary uppercase">ระบบควบคุมภายใน (ICS)</p>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mt-1 flex items-center gap-2">
                        <ShieldCheck className="w-8 h-8 text-primary" /> ปย.1 ปย.2 ปย.3
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">ปีงบประมาณ {year}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Label className="text-xs">ปีงบประมาณ</Label>
                    <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {[year - 1, year, year + 1].map((y) => (
                                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={openCreate}>
                        <Plus className="w-4 h-4 mr-1" /> สร้างฟอร์ม ICS
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {FORM_TYPES.map((type) => {
                    const list = forms.filter((f) => f.form_type === type);
                    return (
                        <Card key={type}>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center justify-between">
                                    <span>{type}</span>
                                    <Badge variant="outline" className="text-[10px]">{list.length}</Badge>
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">{FORM_HINT[type]}</p>
                            </CardHeader>
                            <CardContent>
                                {list.length === 0 ? (
                                    <p className="text-xs text-muted-foreground py-2">ยังไม่มี</p>
                                ) : (
                                    <ul className="space-y-1.5">
                                        {list.map((f) => (
                                            <li key={f.id} className="text-sm flex items-center gap-2">
                                                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                                                <button
                                                    onClick={() => openEdit(f)}
                                                    className="flex-1 text-left hover:underline truncate"
                                                >
                                                    {f.title}
                                                </button>
                                                <Badge variant={STATUS_BADGE[f.status]} className="text-[10px]">{f.status}</Badge>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">ฟอร์ม ICS ทั้งหมด ปี {year}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <p className="text-center py-12 text-muted-foreground">กำลังโหลด…</p>
                    ) : forms.length === 0 ? (
                        <p className="text-center py-12 text-muted-foreground">ยังไม่มีฟอร์ม — กด "สร้างฟอร์ม ICS"</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ประเภท</TableHead>
                                        <TableHead>ชื่อ</TableHead>
                                        <TableHead>ผู้จัดทำ</TableHead>
                                        <TableHead>สถานะ</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {forms.map((f) => (
                                        <TableRow key={f.id}>
                                            <TableCell><Badge variant="secondary">{f.form_type}</Badge></TableCell>
                                            <TableCell className="font-medium">{f.title}</TableCell>
                                            <TableCell className="text-muted-foreground text-xs">{f.prepared_by ?? '–'}</TableCell>
                                            <TableCell>
                                                <Badge variant={STATUS_BADGE[f.status]} className="text-[10px]">{f.status}</Badge>
                                            </TableCell>
                                            <TableCell className="flex gap-1">
                                                <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => openEdit(f)}>
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="w-7 h-7 text-destructive"
                                                    onClick={() => handleDelete(f.id)}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'แก้ไขฟอร์ม' : 'สร้างฟอร์ม ICS'} — ปี {year}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <Label className="mb-1 block text-xs">ประเภท *</Label>
                                <Select value={form.form_type} onValueChange={(v) => setForm({ ...form, form_type: v as IcsFormType })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {FORM_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <p className="text-[10px] text-muted-foreground mt-1">{FORM_HINT[form.form_type]}</p>
                            </div>
                            <div className="col-span-2">
                                <Label className="mb-1 block text-xs">ชื่อฟอร์ม *</Label>
                                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label className="mb-1 block text-xs">ผู้จัดทำ</Label>
                                <Input value={form.prepared_by} onChange={(e) => setForm({ ...form, prepared_by: e.target.value })} />
                            </div>
                            <div>
                                <Label className="mb-1 block text-xs">สถานะ</Label>
                                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as IcsStatus })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label className="mb-1 block text-xs">เนื้อหา (JSON)</Label>
                            <Textarea
                                rows={12}
                                className="font-mono text-xs"
                                value={form.content_json}
                                onChange={(e) => setForm({ ...form, content_json: e.target.value })}
                            />
                            <p className="text-[10px] text-muted-foreground mt-1">
                                เก็บเป็น jsonb — โครงสร้าง schema ของ ปย.1/2/3 ปรับได้อิสระ
                            </p>
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
};

export default IcsManagement;
export { IcsManagement };
