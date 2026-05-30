import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    QrCode, Recycle, ArrowDownToLine, ArrowUpFromLine,
    Wallet, Plus, Trash2, Check, RotateCcw, ArrowLeft,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StudentQRScanner } from '@/components/shared/StudentQRScanner';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import {
    RecorderSelect, EMPTY_RECORDER, type RecorderValue,
} from '@/components/admin/shared/RecorderSelect';
import {
    studentsService,
    wasteTransactionsService,
    wasteCategoriesService,
    wasteSummaryService,
    savingsTransactionsService,
    savingsSummaryService,
    termService,
} from '@/services';
import type {
    WasteCategory,
    WasteStudentSummary,
} from '@/services/waste-bank.service';
import type { SavingsStudentSummary } from '@/services/savings.service';

type Mode = 'scanning' | 'picking' | 'form-waste' | 'form-deposit' | 'form-withdraw' | 'done';

interface ScannedStudent {
    id: string;
    name: string;
    class: string;
    class_number: number | null;
    student_code: string | null;
    photo_url: string | null;
}

const fmtBaht = (n: number | null | undefined) => {
    if (n == null) return '0.00 ฿';
    return `${Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿`;
};

export default function ScanRecorder() {
    const { toast } = useToast();
    const [mode, setMode] = useState<Mode>('scanning');
    const [student, setStudent] = useState<ScannedStudent | null>(null);
    const [wasteSummary, setWasteSummary] = useState<WasteStudentSummary | null>(null);
    const [savingsSummary, setSavingsSummary] = useState<SavingsStudentSummary | null>(null);
    const [categories, setCategories] = useState<WasteCategory[]>([]);
    const [recorder, setRecorder] = useState<RecorderValue>(EMPTY_RECORDER);
    const [quickRepeat, setQuickRepeat] = useState(true);
    const [saving, setSaving] = useState(false);

    // Waste form state
    const [wasteRows, setWasteRows] = useState<{ category_id: string; quantity: string }[]>([
        { category_id: '', quantity: '' },
    ]);
    const [wasteNotes, setWasteNotes] = useState('');

    // Savings form state
    const [amount, setAmount] = useState('');
    const [savingsNotes, setSavingsNotes] = useState('');

    // โหลด categories ครั้งเดียว
    useEffect(() => {
        (async () => {
            const { data } = await wasteCategoriesService.getActive();
            setCategories((data || []) as WasteCategory[]);
        })();
    }, []);

    // เมื่อสแกนเสร็จ → fetch summary ของ student
    useEffect(() => {
        if (!student) return;
        (async () => {
            const [w, s] = await Promise.all([
                wasteSummaryService.getForStudent(student.id),
                savingsSummaryService.getForStudent(student.id),
            ]);
            if (w.data) setWasteSummary(w.data as unknown as WasteStudentSummary);
            if (s.data) setSavingsSummary(s.data as unknown as SavingsStudentSummary);
        })();
    }, [student]);

    const handleScanned = async (studentId: string) => {
        const { data, error } = await studentsService.getById(studentId);
        if (error || !data) {
            toast({ title: 'ไม่พบนักเรียน', variant: 'destructive' });
            return;
        }
        setStudent({
            id: data.id,
            name: data.name,
            class: data.class,
            class_number: data.class_number,
            student_code: data.student_code,
            photo_url: data.photo_url,
        });
        setMode('picking');
    };

    const resetAll = () => {
        setStudent(null);
        setWasteSummary(null);
        setSavingsSummary(null);
        setWasteRows([{ category_id: '', quantity: '' }]);
        setWasteNotes('');
        setAmount('');
        setSavingsNotes('');
        setMode('scanning');
    };

    const handleSubmitWaste = async () => {
        if (!student) return;
        const valid = wasteRows
            .map((r) => {
                const cat = categories.find((c) => c.id === r.category_id);
                const qty = parseInt(r.quantity, 10);
                if (!cat || isNaN(qty) || qty <= 0) return null;
                return { cat, qty };
            })
            .filter((x): x is { cat: WasteCategory; qty: number } => x !== null);
        if (valid.length === 0) {
            toast({ title: 'กรอกประเภทและจำนวนอย่างน้อย 1 แถว', variant: 'destructive' });
            return;
        }
        if (!recorder.staffId && !recorder.administratorId) {
            toast({ title: 'เลือกผู้บันทึก', variant: 'destructive' });
            return;
        }
        setSaving(true);
        const payload = valid.map(({ cat, qty }) => ({
            student_name: student.name,
            student_class: student.class,
            student_id: student.id,
            category_id: cat.id,
            quantity: qty,
            points_earned: qty * cat.points_per_item,
            transaction_date: new Date().toISOString().split('T')[0],
            notes: wasteNotes.trim() || null,
            recorded_by: recorder.name || null,
            recorded_by_staff_id: recorder.staffId,
            recorded_by_administrator_id: recorder.administratorId,
        }));
        const { error } = await wasteTransactionsService.insertMany(payload);
        setSaving(false);
        if (error) {
            toast({ title: 'บันทึกไม่สำเร็จ', description: error.message, variant: 'destructive' });
            return;
        }
        const total = payload.reduce((s, p) => s + p.points_earned, 0);
        toast({ title: 'บันทึกขยะสำเร็จ', description: `${student.name} — ${valid.length} ประเภท · +${total} แต้ม` });
        if (quickRepeat) resetAll();
        else { setStudent(null); setMode('done'); }
    };

    const handleSubmitSavings = async (type: 'deposit' | 'withdraw') => {
        if (!student) return;
        const amt = parseInt(amount, 10);
        if (!Number.isInteger(amt) || amt <= 0) {
            toast({ title: 'กรุณากรอกจำนวนเต็ม (ไม่มีทศนิยม)', variant: 'destructive' });
            return;
        }
        if (!recorder.staffId && !recorder.administratorId) {
            toast({ title: 'เลือกผู้บันทึก', variant: 'destructive' });
            return;
        }
        const currentBalance = Number(savingsSummary?.current_balance ?? 0);
        if (type === 'withdraw' && amt > currentBalance) {
            toast({
                title: 'ถอนไม่ได้',
                description: `ยอดคงเหลือเพียง ${fmtBaht(currentBalance)}`,
                variant: 'destructive',
            });
            return;
        }
        setSaving(true);
        const balance_after = type === 'deposit' ? currentBalance + amt : currentBalance - amt;
        const term = await termService.getActive();
        const { error } = await savingsTransactionsService.insert({
            student_id: student.id,
            student_name: student.name,
            student_class: student.class,
            transaction_type: type,
            amount: amt,
            balance_after,
            transaction_date: new Date().toISOString().split('T')[0],
            notes: savingsNotes.trim() || null,
            recorded_by: recorder.name,
            recorded_by_staff_id: recorder.staffId,
            recorded_by_administrator_id: recorder.administratorId,
            academic_year: term?.year ?? null,
            semester: term?.sem ?? null,
        });
        setSaving(false);
        if (error) {
            toast({ title: 'บันทึกไม่สำเร็จ', description: error.message, variant: 'destructive' });
            return;
        }
        toast({
            title: type === 'deposit' ? 'ฝากเงินสำเร็จ' : 'ถอนเงินสำเร็จ',
            description: `${student.name} — ${fmtBaht(amt)} (คงเหลือ ${fmtBaht(balance_after)})`,
        });
        if (quickRepeat) resetAll();
        else { setStudent(null); setMode('done'); }
    };

    const addWasteRow = () => setWasteRows((r) => [...r, { category_id: '', quantity: '' }]);
    const updateWasteRow = (i: number, key: 'category_id' | 'quantity', value: string) =>
        setWasteRows((r) => r.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)));
    const removeWasteRow = (i: number) =>
        setWasteRows((r) => (r.length === 1 ? r : r.filter((_, idx) => idx !== i)));

    const wasteTotal = useMemo(() => {
        return wasteRows.reduce((sum, r) => {
            const cat = categories.find((c) => c.id === r.category_id);
            const qty = parseInt(r.quantity, 10);
            if (!cat || isNaN(qty) || qty <= 0) return sum;
            return sum + qty * cat.points_per_item;
        }, 0);
    }, [wasteRows, categories]);

    return (
        <div className="container max-w-2xl mx-auto p-4 md:p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-amber-600" />
                    สแกนรับเข้าระบบ
                </h1>
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={quickRepeat}
                        onChange={(e) => setQuickRepeat(e.target.checked)}
                        className="rounded border-input"
                    />
                    <span><span className="font-semibold">โหมดต่อเนื่อง</span> — บันทึกเสร็จเปิดสแกนต่อ</span>
                </label>
            </div>
            <p className="text-xs text-muted-foreground hidden lg:block">
                💡 กด <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px] font-mono">Ctrl+Shift+S</kbd> เปิดหน้านี้จากทุกที่
            </p>

            {/* Student preview header — sticky หลัง scan */}
            {student && (
                <Card className="sticky top-2 z-10 border-emerald-200 bg-emerald-50/80 backdrop-blur">
                    <CardContent className="p-3 flex items-center gap-3">
                        <PersonAvatar name={student.name} photoUrl={student.photo_url} size="md" className="ring-2 ring-emerald-400" />
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-emerald-900 truncate">{student.name}</div>
                            <div className="text-xs text-emerald-800/80">
                                ชั้น {student.class}
                                {student.class_number ? ` · เลขที่ ${student.class_number}` : ''}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {wasteSummary && (
                                    <Badge variant="outline" className="text-[10px] border-emerald-300 bg-white">
                                        ขยะ {wasteSummary.available_points ?? 0} แต้ม
                                    </Badge>
                                )}
                                {savingsSummary && (
                                    <Badge variant="outline" className="text-[10px] border-amber-300 bg-white">
                                        เงินคงเหลือ {fmtBaht(savingsSummary.current_balance)}
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={resetAll} aria-label="สแกนใหม่">
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Recorder — แสดงเฉพาะตอน picking หรือ form */}
            {(mode === 'picking' || mode.startsWith('form-')) && (
                <Card>
                    <CardContent className="p-3">
                        <RecorderSelect label="ผู้บันทึก" value={recorder} onChange={setRecorder} required />
                    </CardContent>
                </Card>
            )}

            {/* Mode: picking — เลือกระบบ */}
            {mode === 'picking' && (
                <div className="grid grid-cols-1 gap-3">
                    <button
                        onClick={() => setMode('form-waste')}
                        className="rounded-xl border-2 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 p-4 flex items-center gap-3 text-left active:scale-[0.98] transition"
                    >
                        <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                            <Recycle className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <div className="font-bold text-emerald-900">ฝากขยะ</div>
                            <div className="text-xs text-emerald-800/80">บันทึกประเภท+จำนวน → ได้แต้ม</div>
                        </div>
                    </button>
                    <button
                        onClick={() => setMode('form-deposit')}
                        className="rounded-xl border-2 border-amber-300 bg-amber-50 hover:bg-amber-100 p-4 flex items-center gap-3 text-left active:scale-[0.98] transition"
                    >
                        <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center flex-shrink-0">
                            <ArrowDownToLine className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <div className="font-bold text-amber-900">ฝากเงิน</div>
                            <div className="text-xs text-amber-800/80">เพิ่มยอดเงินสะสม</div>
                        </div>
                    </button>
                    <button
                        onClick={() => setMode('form-withdraw')}
                        className="rounded-xl border-2 border-rose-300 bg-rose-50 hover:bg-rose-100 p-4 flex items-center gap-3 text-left active:scale-[0.98] transition"
                    >
                        <div className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center flex-shrink-0">
                            <ArrowUpFromLine className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <div className="font-bold text-rose-900">ถอนเงิน</div>
                            <div className="text-xs text-rose-800/80">คงเหลือ {fmtBaht(savingsSummary?.current_balance)}</div>
                        </div>
                    </button>
                </div>
            )}

            {/* Mode: form-waste */}
            {mode === 'form-waste' && (
                <Card>
                    <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold flex items-center gap-2 text-emerald-900">
                                <Recycle className="w-5 h-5" /> ฝากขยะ
                            </h2>
                            <Button variant="ghost" size="sm" onClick={() => setMode('picking')} className="gap-1">
                                <ArrowLeft className="w-3.5 h-3.5" /> เปลี่ยน
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {wasteRows.map((row, i) => (
                                <div key={i} className="flex gap-2">
                                    <Select value={row.category_id} onValueChange={(v) => updateWasteRow(i, 'category_id', v)}>
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="ประเภทขยะ" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((c) => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    {c.name} ({c.points_per_item} แต้ม/ชิ้น)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        type="number"
                                        min="1"
                                        placeholder="จำนวน"
                                        value={row.quantity}
                                        onChange={(e) => updateWasteRow(i, 'quantity', e.target.value)}
                                        className="w-24"
                                    />
                                    {wasteRows.length > 1 && (
                                        <Button variant="ghost" size="icon" onClick={() => removeWasteRow(i)}>
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={addWasteRow} className="w-full gap-1">
                                <Plus className="w-4 h-4" /> เพิ่มประเภท
                            </Button>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">หมายเหตุ (ไม่บังคับ)</Label>
                            <Input value={wasteNotes} onChange={(e) => setWasteNotes(e.target.value)} />
                        </div>
                        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-md p-2">
                            <span className="text-xs font-semibold text-emerald-900">แต้มที่จะได้</span>
                            <span className="text-lg font-bold text-emerald-700">+{wasteTotal}</span>
                        </div>
                        <Button onClick={handleSubmitWaste} disabled={saving || wasteTotal === 0} className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2">
                            <Check className="w-4 h-4" /> {saving ? 'กำลังบันทึก...' : 'บันทึกฝากขยะ'}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Mode: form-deposit / form-withdraw */}
            {(mode === 'form-deposit' || mode === 'form-withdraw') && (
                <Card>
                    <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className={`font-bold flex items-center gap-2 ${mode === 'form-deposit' ? 'text-amber-900' : 'text-rose-900'}`}>
                                {mode === 'form-deposit' ? (
                                    <><ArrowDownToLine className="w-5 h-5" /> ฝากเงิน</>
                                ) : (
                                    <><ArrowUpFromLine className="w-5 h-5" /> ถอนเงิน</>
                                )}
                            </h2>
                            <Button variant="ghost" size="sm" onClick={() => setMode('picking')} className="gap-1">
                                <ArrowLeft className="w-3.5 h-3.5" /> เปลี่ยน
                            </Button>
                        </div>
                        {mode === 'form-withdraw' && (
                            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-md p-2 text-sm">
                                <Wallet className="w-4 h-4 text-rose-700" />
                                <span className="text-rose-900">ยอดคงเหลือ:</span>
                                <span className="font-bold text-rose-700">{fmtBaht(savingsSummary?.current_balance)}</span>
                            </div>
                        )}
                        <div className="space-y-1">
                            <Label className="text-xs">จำนวนเงิน (บาท)</Label>
                            <Input
                                type="number"
                                inputMode="numeric"
                                min="1"
                                step="1"
                                placeholder="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                onWheel={(e) => e.currentTarget.blur()}
                                className="text-lg font-bold"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">หมายเหตุ (ไม่บังคับ)</Label>
                            <Input value={savingsNotes} onChange={(e) => setSavingsNotes(e.target.value)} />
                        </div>
                        <Button
                            onClick={() => handleSubmitSavings(mode === 'form-deposit' ? 'deposit' : 'withdraw')}
                            disabled={saving}
                            className={`w-full gap-2 ${mode === 'form-deposit' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                        >
                            <Check className="w-4 h-4" />
                            {saving ? 'กำลังบันทึก...' : mode === 'form-deposit' ? 'บันทึกฝากเงิน' : 'บันทึกถอนเงิน'}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Mode: done — ปุ่มสแกนคนถัดไป */}
            {mode === 'done' && (
                <Card>
                    <CardContent className="p-6 text-center space-y-3">
                        <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
                            <Check className="w-8 h-8 text-emerald-700" />
                        </div>
                        <div className="font-bold">บันทึกสำเร็จ</div>
                        <Button onClick={resetAll} className="w-full gap-2 bg-amber-600 hover:bg-amber-700">
                            <QrCode className="w-4 h-4" /> สแกนคนถัดไป
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Scanner Dialog — open ตอน mode=='scanning' */}
            <StudentQRScanner
                open={mode === 'scanning'}
                onClose={() => {
                    // ถ้าปิดโดยไม่สแกน → แสดง done state
                    if (mode === 'scanning' && !student) setMode('done');
                }}
                onScanned={handleScanned}
            />
        </div>
    );
}
