import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { Plus, Pencil, Trash2, Target } from 'lucide-react';
import {
    actionPlanService,
    type ActionPlanProject, type ActionPlanStatus,
} from '@/services/action-plan.service';
import { currentFiscalYearBE } from '@/services/budget.service';
import { supabase } from '@/integrations/supabase/client';
import { KpiRibbon, type KpiTile } from '@/components/admin/docs-hub/KpiRibbon';
import { formatThaiDateRange } from '@/lib/thaiDate';

const STATUSES: ActionPlanStatus[] = ['ยังไม่เริ่ม', 'กำลังดำเนินการ', 'เสร็จสิ้น', 'ยกเลิก'];

const STATUS_BADGE: Record<ActionPlanStatus, 'secondary' | 'default' | 'outline' | 'destructive'> = {
    'ยังไม่เริ่ม': 'outline',
    'กำลังดำเนินการ': 'secondary',
    'เสร็จสิ้น': 'default',
    'ยกเลิก': 'destructive',
};

const fmtMoney = (n: number) =>
    new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(n);

type StaffOption = { id: string; name: string };

const ActionPlanManagement = () => {
    const [year, setYear] = useState(currentFiscalYearBE());
    const [projects, setProjects] = useState<ActionPlanProject[]>([]);
    const [staffList, setStaffList] = useState<StaffOption[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<ActionPlanProject | null>(null);
    const [form, setForm] = useState({
        code: '', name: '', strategy: '', responsible_staff_id: '',
        budget: 0, start_date: '', end_date: '',
        kpi: '', status: 'ยังไม่เริ่ม' as ActionPlanStatus, notes: '',
    });

    const reload = async () => {
        setLoading(true);
        const res = await actionPlanService.listProjects(year);
        if (res.data) setProjects(res.data);
        setLoading(false);
    };
    useEffect(() => { reload(); /* eslint-disable-next-line */ }, [year]);

    useEffect(() => {
        supabase.from('staff').select('id, name').order('name').then(({ data }) => {
            if (data) setStaffList(data as StaffOption[]);
        });
    }, []);

    const stats = useMemo(() => {
        const total = projects.length;
        const done = projects.filter((p) => p.status === 'เสร็จสิ้น').length;
        const inProgress = projects.filter((p) => p.status === 'กำลังดำเนินการ').length;
        const notStarted = projects.filter((p) => p.status === 'ยังไม่เริ่ม').length;
        const budget = projects.reduce((s, p) => s + Number(p.budget ?? 0), 0);
        return { total, done, inProgress, notStarted, budget };
    }, [projects]);

    const tiles: KpiTile[] = [
        { key: 'total', label: 'โครงการทั้งหมด', value: stats.total, icon: Target, tone: 'primary' },
        { key: 'done', label: 'เสร็จแล้ว', value: stats.done, icon: Target, tone: 'success' },
        { key: 'inprog', label: 'กำลังดำเนินการ', value: stats.inProgress, icon: Target, tone: 'warning' },
        { key: 'budget', label: 'งบประมาณรวม', value: `฿${fmtMoney(stats.budget)}`, icon: Target, tone: 'info' },
    ];

    const openCreate = () => {
        setEditing(null);
        setForm({
            code: '', name: '', strategy: '', responsible_staff_id: '',
            budget: 0, start_date: '', end_date: '',
            kpi: '', status: 'ยังไม่เริ่ม', notes: '',
        });
        setDialogOpen(true);
    };

    const openEdit = (p: ActionPlanProject) => {
        setEditing(p);
        setForm({
            code: p.code ?? '',
            name: p.name,
            strategy: p.strategy ?? '',
            responsible_staff_id: p.responsible_staff_id ?? '',
            budget: Number(p.budget ?? 0),
            start_date: p.start_date ?? '',
            end_date: p.end_date ?? '',
            kpi: p.kpi ?? '',
            status: p.status,
            notes: p.notes ?? '',
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) { toast({ title: 'กรุณาระบุชื่อโครงการ', variant: 'destructive' }); return; }
        const payload = {
            fiscal_year: year,
            code: form.code.trim() || null,
            name: form.name.trim(),
            strategy: form.strategy.trim() || null,
            responsible_staff_id: form.responsible_staff_id || null,
            budget: Number(form.budget) || 0,
            start_date: form.start_date || null,
            end_date: form.end_date || null,
            kpi: form.kpi.trim() || null,
            status: form.status,
            notes: form.notes.trim() || null,
        };
        const res = editing
            ? await actionPlanService.updateProject(editing.id, payload)
            : await actionPlanService.createProject(payload);
        if (res.error) { toast({ title: 'บันทึกล้มเหลว', description: res.error.message, variant: 'destructive' }); return; }
        toast({ title: 'บันทึกเรียบร้อย' });
        setDialogOpen(false);
        reload();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ยืนยันการลบโครงการ?')) return;
        await actionPlanService.deleteProject(id);
        toast({ title: 'ลบแล้ว' });
        reload();
    };

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
            <div className="flex items-end justify-between gap-3 flex-wrap">
                <div>
                    <p className="text-xs font-semibold text-primary uppercase">แผนปฏิบัติการประจำปี</p>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mt-1 flex items-center gap-2">
                        <Target className="w-8 h-8 text-primary" /> โครงการ {year}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <Label className="text-xs">ปี</Label>
                    <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {[year - 1, year, year + 1].map((y) => (
                                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={openCreate}>
                        <Plus className="w-4 h-4 mr-1" /> โครงการใหม่
                    </Button>
                </div>
            </div>

            <KpiRibbon tiles={tiles} loading={loading} />

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">โครงการทั้งหมด ปี {year}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <p className="text-center py-12 text-muted-foreground">กำลังโหลด…</p>
                    ) : projects.length === 0 ? (
                        <p className="text-center py-12 text-muted-foreground">ยังไม่มีโครงการ</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>รหัส</TableHead>
                                        <TableHead>ชื่อโครงการ</TableHead>
                                        <TableHead>ผู้รับผิดชอบ</TableHead>
                                        <TableHead>ระยะเวลา</TableHead>
                                        <TableHead className="text-right">งบ (บาท)</TableHead>
                                        <TableHead>สถานะ</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {projects.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-mono text-xs text-muted-foreground">{p.code ?? '–'}</TableCell>
                                            <TableCell>
                                                <p className="font-medium">{p.name}</p>
                                                {p.strategy ? <p className="text-[11px] text-muted-foreground">กลยุทธ์: {p.strategy}</p> : null}
                                            </TableCell>
                                            <TableCell>
                                                {p.staff ? (
                                                    <div className="flex items-center gap-2">
                                                        <PersonAvatar name={p.staff.name} photoUrl={p.staff.photo_url} size="xs" />
                                                        <span className="text-sm">{p.staff.name}</span>
                                                    </div>
                                                ) : <span className="text-muted-foreground text-xs">–</span>}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {p.start_date ? formatThaiDateRange(p.start_date, p.end_date) : '–'}
                                            </TableCell>
                                            <TableCell className="text-right">{fmtMoney(Number(p.budget))}</TableCell>
                                            <TableCell>
                                                <Badge variant={STATUS_BADGE[p.status]} className="text-[10px]">{p.status}</Badge>
                                            </TableCell>
                                            <TableCell className="flex gap-1">
                                                <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => openEdit(p)}>
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="w-7 h-7 text-destructive"
                                                    onClick={() => handleDelete(p.id)}>
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
                        <DialogTitle>{editing ? 'แก้ไขโครงการ' : 'โครงการใหม่'} — ปี {year}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <Label className="mb-1 block text-xs">รหัส</Label>
                                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="P-01" />
                            </div>
                            <div className="col-span-2">
                                <Label className="mb-1 block text-xs">ชื่อโครงการ *</Label>
                                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <Label className="mb-1 block text-xs">กลยุทธ์</Label>
                            <Input value={form.strategy} onChange={(e) => setForm({ ...form, strategy: e.target.value })} placeholder="กลยุทธ์ที่..." />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label className="mb-1 block text-xs">ผู้รับผิดชอบ</Label>
                                <Select value={form.responsible_staff_id} onValueChange={(v) => setForm({ ...form, responsible_staff_id: v })}>
                                    <SelectTrigger><SelectValue placeholder="เลือก..." /></SelectTrigger>
                                    <SelectContent>
                                        {staffList.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="mb-1 block text-xs">งบประมาณ (บาท)</Label>
                                <Input type="number" min={0} value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label className="mb-1 block text-xs">เริ่ม</Label>
                                <ThaiDatePicker value={form.start_date} onChange={v => setForm({ ...form, start_date: v })} />
                            </div>
                            <div>
                                <Label className="mb-1 block text-xs">สิ้นสุด</Label>
                                <ThaiDatePicker value={form.end_date} onChange={v => setForm({ ...form, end_date: v })} />
                            </div>
                        </div>
                        <div>
                            <Label className="mb-1 block text-xs">KPI / ตัวชี้วัด</Label>
                            <Input value={form.kpi} onChange={(e) => setForm({ ...form, kpi: e.target.value })} />
                        </div>
                        <div>
                            <Label className="mb-1 block text-xs">สถานะ</Label>
                            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ActionPlanStatus })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="mb-1 block text-xs">หมายเหตุ</Label>
                            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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

export default ActionPlanManagement;
export { ActionPlanManagement };
