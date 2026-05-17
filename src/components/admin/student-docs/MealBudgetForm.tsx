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
import { Plus, Pencil, Trash2, Utensils } from 'lucide-react';
import { mealBudgetService, type MealBudgetRow, type MealPeriod } from '@/services/meal-budget.service';
import { currentAcademicYearBE } from '@/services/sar.service';

const PERIODS: MealPeriod[] = ['ภาคเรียน 1', 'ภาคเรียน 2', 'รวมปี'];

const fmt = (n: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(n);

interface MealBudgetTabProps { studentId: string }

export const MealBudgetTab = ({ studentId }: MealBudgetTabProps) => {
    const [items, setItems] = useState<MealBudgetRow[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<MealBudgetRow | null>(null);
    const [form, setForm] = useState({
        academic_year: currentAcademicYearBE(),
        period: 'ภาคเรียน 1' as MealPeriod,
        meal_subsidy: 0,
        milk_subsidy: 0,
        notes: '',
    });

    const reload = async () => {
        setLoading(true);
        const res = await mealBudgetService.listByStudent(studentId);
        if (res.data) setItems(res.data);
        setLoading(false);
    };
    useEffect(() => { reload(); /* eslint-disable-next-line */ }, [studentId]);

    const totals = useMemo(() => {
        const t = { meal: 0, milk: 0 };
        for (const r of items) {
            t.meal += Number(r.meal_subsidy);
            t.milk += Number(r.milk_subsidy);
        }
        return t;
    }, [items]);

    const openCreate = () => {
        setEditing(null);
        setForm({
            academic_year: currentAcademicYearBE(),
            period: 'ภาคเรียน 1', meal_subsidy: 0, milk_subsidy: 0, notes: '',
        });
        setDialogOpen(true);
    };

    const openEdit = (r: MealBudgetRow) => {
        setEditing(r);
        setForm({
            academic_year: r.academic_year, period: r.period,
            meal_subsidy: Number(r.meal_subsidy), milk_subsidy: Number(r.milk_subsidy),
            notes: r.notes ?? '',
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        const res = await mealBudgetService.upsert({
            student_id: studentId,
            academic_year: form.academic_year,
            period: form.period,
            meal_subsidy: form.meal_subsidy,
            milk_subsidy: form.milk_subsidy,
            notes: form.notes || null,
        });
        if (res.error) { toast({ title: 'บันทึกล้มเหลว', description: res.error.message, variant: 'destructive' }); return; }
        toast({ title: 'บันทึกเรียบร้อย' });
        setDialogOpen(false);
        reload();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ลบบันทึกอุดหนุนนี้?')) return;
        await mealBudgetService.remove(id);
        toast({ title: 'ลบแล้ว' });
        reload();
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="font-semibold text-sm flex items-center gap-1.5">
                    <Utensils className="w-4 h-4 text-primary" /> อุดหนุนอาหารกลางวัน / นม
                </h3>
                <Button size="sm" onClick={openCreate}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> เพิ่มงวด
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <Card>
                    <CardContent className="p-3">
                        <p className="text-xs text-muted-foreground">อาหารกลางวัน รวม</p>
                        <p className="text-xl font-bold">฿{fmt(totals.meal)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-3">
                        <p className="text-xs text-muted-foreground">นม รวม</p>
                        <p className="text-xl font-bold">฿{fmt(totals.milk)}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">ประวัติงวด</CardTitle></CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">กำลังโหลด…</p>
                    ) : items.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">ยังไม่มีบันทึก</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ปี</TableHead>
                                    <TableHead>งวด</TableHead>
                                    <TableHead className="text-right">อาหาร</TableHead>
                                    <TableHead className="text-right">นม</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((r) => (
                                    <TableRow key={r.id}>
                                        <TableCell><Badge variant="outline" className="text-[10px]">{r.academic_year}</Badge></TableCell>
                                        <TableCell>{r.period}</TableCell>
                                        <TableCell className="text-right">฿{fmt(Number(r.meal_subsidy))}</TableCell>
                                        <TableCell className="text-right">฿{fmt(Number(r.milk_subsidy))}</TableCell>
                                        <TableCell className="flex gap-1">
                                            <Button size="icon" variant="ghost" className="w-6 h-6" onClick={() => openEdit(r)}>
                                                <Pencil className="w-3 h-3" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="w-6 h-6 text-destructive" onClick={() => handleDelete(r.id)}>
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editing ? 'แก้ไข' : 'เพิ่ม'}งวดอุดหนุน</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label className="mb-1 block text-xs">ปีการศึกษา *</Label>
                                <Input type="number" value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: Number(e.target.value) })} />
                            </div>
                            <div>
                                <Label className="mb-1 block text-xs">งวด *</Label>
                                <Select value={form.period} onValueChange={(v) => setForm({ ...form, period: v as MealPeriod })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {PERIODS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label className="mb-1 block text-xs">อาหารกลางวัน (บาท)</Label>
                                <Input type="number" min={0} value={form.meal_subsidy} onChange={(e) => setForm({ ...form, meal_subsidy: Number(e.target.value) })} />
                            </div>
                            <div>
                                <Label className="mb-1 block text-xs">นม (บาท)</Label>
                                <Input type="number" min={0} value={form.milk_subsidy} onChange={(e) => setForm({ ...form, milk_subsidy: Number(e.target.value) })} />
                            </div>
                        </div>
                        <div>
                            <Label className="mb-1 block text-xs">หมายเหตุ</Label>
                            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
