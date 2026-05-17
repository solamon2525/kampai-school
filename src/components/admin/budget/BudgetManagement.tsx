import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, Wallet, TrendingDown, TrendingUp, ReceiptText, Trash2 } from 'lucide-react';
import {
    budgetService, currentFiscalYearBE,
    type BudgetSummary, type BudgetTxnType,
} from '@/services/budget.service';
import { KpiRibbon, type KpiTile } from '@/components/admin/docs-hub/KpiRibbon';

const TXN_TYPES: BudgetTxnType[] = ['เบิกจ่าย', 'ผูกพัน', 'โอน', 'คืน'];

const fmtMoney = (n: number) =>
    new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(n);

const BudgetManagement = () => {
    const [year, setYear] = useState<number>(currentFiscalYearBE());
    const [summary, setSummary] = useState<BudgetSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // Category dialog
    const [catDialogOpen, setCatDialogOpen] = useState(false);
    const [catForm, setCatForm] = useState({ name: '', code: '', allocated: 0, description: '' });

    // Transaction dialog
    const [txnDialogOpen, setTxnDialogOpen] = useState(false);
    const [txnForm, setTxnForm] = useState<{
        category_id: string; txn_type: BudgetTxnType; amount: number;
        txn_date: string; doc_ref: string; vendor: string; note: string;
    }>({
        category_id: '', txn_type: 'เบิกจ่าย', amount: 0,
        txn_date: new Date().toISOString().slice(0, 10),
        doc_ref: '', vendor: '', note: '',
    });

    const reload = async () => {
        setLoading(true);
        const sumRes = await budgetService.getSummary(year);
        if (sumRes.data) setSummary(sumRes.data);
        setLoading(false);
    };
    useEffect(() => { reload(); /* eslint-disable-next-line */ }, [year]);

    const totals = useMemo(() => {
        const t = { allocated: 0, paid: 0, committed: 0, remaining: 0 };
        for (const r of summary) {
            t.allocated += Number(r.allocated);
            t.paid += Number(r.paid);
            t.committed += Number(r.committed);
            t.remaining += Number(r.remaining);
        }
        return t;
    }, [summary]);

    const tiles: KpiTile[] = [
        { key: 'allocated', label: 'งบทั้งปี', value: fmtMoney(totals.allocated), icon: Wallet, tone: 'primary' },
        { key: 'paid', label: 'เบิกจ่ายแล้ว', value: fmtMoney(totals.paid), icon: TrendingDown, tone: 'success' },
        { key: 'committed', label: 'ผูกพัน', value: fmtMoney(totals.committed), icon: ReceiptText, tone: 'warning' },
        { key: 'remaining', label: 'คงเหลือ', value: fmtMoney(totals.remaining), icon: TrendingUp, tone: 'info' },
    ];

    const handleAddCategory = async () => {
        if (!catForm.name.trim()) { toast({ title: 'กรอกชื่อหมวด', variant: 'destructive' }); return; }
        const res = await budgetService.upsertCategory({
            name: catForm.name.trim(),
            code: catForm.code.trim() || null,
            allocated: Number(catForm.allocated) || 0,
            description: catForm.description.trim() || null,
            fiscal_year: year,
        });
        if (res.error) toast({ title: 'บันทึกล้มเหลว', description: res.error.message, variant: 'destructive' });
        else {
            toast({ title: 'เพิ่มหมวดงบแล้ว' });
            setCatDialogOpen(false);
            setCatForm({ name: '', code: '', allocated: 0, description: '' });
            reload();
        }
    };

    const handleAddTxn = async () => {
        if (!txnForm.category_id || !txnForm.amount) {
            toast({ title: 'เลือกหมวด + ระบุยอด', variant: 'destructive' });
            return;
        }
        const res = await budgetService.createTransaction({
            category_id: txnForm.category_id,
            txn_type: txnForm.txn_type,
            amount: Number(txnForm.amount),
            txn_date: txnForm.txn_date,
            doc_ref: txnForm.doc_ref || null,
            vendor: txnForm.vendor || null,
            note: txnForm.note || null,
        });
        if (res.error) toast({ title: 'บันทึกล้มเหลว', description: res.error.message, variant: 'destructive' });
        else {
            toast({ title: 'บันทึก txn เรียบร้อย' });
            setTxnDialogOpen(false);
            setTxnForm({ ...txnForm, amount: 0, doc_ref: '', vendor: '', note: '' });
            reload();
        }
    };

    const handleDeleteCategory = async (id: string, name: string) => {
        if (!confirm(`ลบหมวด "${name}" และทุก transaction ของมัน?`)) return;
        const res = await budgetService.deleteCategory(id);
        if (res.error) toast({ title: 'ลบล้มเหลว', description: res.error.message, variant: 'destructive' });
        else { toast({ title: 'ลบแล้ว' }); reload(); }
    };

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
            <div className="flex items-end justify-between gap-3 flex-wrap">
                <div>
                    <p className="text-xs font-semibold text-primary uppercase">การเงิน / งบประมาณ</p>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mt-1">งบประมาณโรงเรียน</h1>
                    <p className="text-sm text-muted-foreground mt-1">เบิกจ่าย ผูกพัน คงเหลือ — ปีงบประมาณ {year}</p>
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
                    <Button variant="outline" onClick={() => setCatDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-1" /> เพิ่มหมวด
                    </Button>
                    <Button onClick={() => setTxnDialogOpen(true)} disabled={summary.length === 0}>
                        <Plus className="w-4 h-4 mr-1" /> บันทึกรายการ
                    </Button>
                </div>
            </div>

            <KpiRibbon tiles={tiles} loading={loading} />

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">หมวดงบประมาณ ปี {year}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <p className="text-center py-12 text-muted-foreground">กำลังโหลด…</p>
                    ) : summary.length === 0 ? (
                        <p className="text-center py-12 text-muted-foreground">ยังไม่มีหมวดงบในปีนี้ — กด "เพิ่มหมวด" เพื่อเริ่ม</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>รหัส</TableHead>
                                        <TableHead>หมวด</TableHead>
                                        <TableHead className="text-right">งบจัดสรร</TableHead>
                                        <TableHead className="text-right">เบิกจ่าย</TableHead>
                                        <TableHead className="text-right">ผูกพัน</TableHead>
                                        <TableHead className="text-right">คงเหลือ</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {summary.map((row) => {
                                        const pct = row.allocated > 0
                                            ? Math.round((Number(row.paid) + Number(row.committed)) / Number(row.allocated) * 100)
                                            : 0;
                                        return (
                                            <TableRow key={row.category_id}>
                                                <TableCell className="font-mono text-xs text-muted-foreground">{row.code ?? '–'}</TableCell>
                                                <TableCell>
                                                    <p className="font-medium">{row.name}</p>
                                                    <div className="mt-1 h-1.5 bg-muted rounded overflow-hidden max-w-[180px]">
                                                        <div className="h-full bg-primary" style={{ width: `${Math.min(100, pct)}%` }} />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">{fmtMoney(Number(row.allocated))}</TableCell>
                                                <TableCell className="text-right text-emerald-600">{fmtMoney(Number(row.paid))}</TableCell>
                                                <TableCell className="text-right text-amber-600">{fmtMoney(Number(row.committed))}</TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    <Badge variant={Number(row.remaining) < 0 ? 'destructive' : 'secondary'}>
                                                        {fmtMoney(Number(row.remaining))}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Button size="icon" variant="ghost" className="w-7 h-7 text-destructive"
                                                        onClick={() => handleDeleteCategory(row.category_id, row.name)}>
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Category Dialog */}
            <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>เพิ่มหมวดงบ — ปี {year}</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-1">
                                <Label className="mb-1 block text-xs">รหัส</Label>
                                <Input value={catForm.code} onChange={(e) => setCatForm({ ...catForm, code: e.target.value })} placeholder="เช่น 1.1" />
                            </div>
                            <div className="col-span-2">
                                <Label className="mb-1 block text-xs">ชื่อหมวด *</Label>
                                <Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} placeholder="เช่น งบลงทุน ค่าครุภัณฑ์" />
                            </div>
                        </div>
                        <div>
                            <Label className="mb-1 block text-xs">งบจัดสรร (บาท) *</Label>
                            <Input type="number" min={0} value={catForm.allocated}
                                onChange={(e) => setCatForm({ ...catForm, allocated: Number(e.target.value) })}
                                placeholder="0" />
                        </div>
                        <div>
                            <Label className="mb-1 block text-xs">คำอธิบาย</Label>
                            <Input value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} placeholder="หมายเหตุ" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCatDialogOpen(false)}>ยกเลิก</Button>
                        <Button onClick={handleAddCategory}>บันทึก</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Transaction Dialog */}
            <Dialog open={txnDialogOpen} onOpenChange={setTxnDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>บันทึกรายการเงิน</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label className="mb-1 block text-xs">หมวด *</Label>
                            <Select value={txnForm.category_id} onValueChange={(v) => setTxnForm({ ...txnForm, category_id: v })}>
                                <SelectTrigger><SelectValue placeholder="เลือกหมวด" /></SelectTrigger>
                                <SelectContent>
                                    {summary.map((c) => (
                                        <SelectItem key={c.category_id} value={c.category_id}>
                                            {c.code ? `${c.code} — ` : ''}{c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label className="mb-1 block text-xs">ประเภท</Label>
                                <Select value={txnForm.txn_type} onValueChange={(v) => setTxnForm({ ...txnForm, txn_type: v as BudgetTxnType })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {TXN_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="mb-1 block text-xs">วันที่</Label>
                                <Input type="date" value={txnForm.txn_date} onChange={(e) => setTxnForm({ ...txnForm, txn_date: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <Label className="mb-1 block text-xs">ยอด (บาท) *</Label>
                            <Input type="number" min={0} value={txnForm.amount} onChange={(e) => setTxnForm({ ...txnForm, amount: Number(e.target.value) })} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label className="mb-1 block text-xs">เลขที่เอกสาร</Label>
                                <Input value={txnForm.doc_ref} onChange={(e) => setTxnForm({ ...txnForm, doc_ref: e.target.value })} />
                            </div>
                            <div>
                                <Label className="mb-1 block text-xs">ผู้รับ/บริษัท</Label>
                                <Input value={txnForm.vendor} onChange={(e) => setTxnForm({ ...txnForm, vendor: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <Label className="mb-1 block text-xs">หมายเหตุ</Label>
                            <Input value={txnForm.note} onChange={(e) => setTxnForm({ ...txnForm, note: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTxnDialogOpen(false)}>ยกเลิก</Button>
                        <Button onClick={handleAddTxn}>บันทึก</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default BudgetManagement;
export { BudgetManagement };
