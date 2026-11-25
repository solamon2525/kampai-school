import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
    Wallet, Plus, Minus, Trash2, Check, RotateCcw, ArrowLeft, Star,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
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
    savingsErrorMessage,
    savingsSummaryService,
    conductService,
    CONDUCT_CATEGORIES,
    termService,
} from '@/services';
import type {
    WasteCategory,
    WasteStudentSummary,
} from '@/services/waste-bank.service';
import type { SavingsStudentSummary } from '@/services/savings.service';

const QUICK_AMOUNTS = [5, 10, 20, 50, 100] as const;
const CONDUCT_QUICK_SCORES = [1, 2, 3, 5, 10] as const;
const CONDUCT_CATEGORY_OPTIONS = Object.values(CONDUCT_CATEGORIES).filter((c) => c.key !== 'reward');
const CONDUCT_PRESETS = [
    {
        label: 'จิตอาสา +2',
        type: 'add' as const,
        category: 'publicMind',
        score: 2,
        reason: 'ช่วยงานจิตอาสา / บำเพ็ญประโยชน์',
    },
    {
        label: 'เวรประจำวัน +2',
        type: 'add' as const,
        category: 'responsibility',
        score: 2,
        reason: 'ปฏิบัติหน้าที่เวรประจำวันเรียบร้อย',
    },
    {
        label: 'ช่วยเหลือเพื่อน/ครู +2',
        type: 'add' as const,
        category: 'kindness',
        score: 2,
        reason: 'มีน้ำใจช่วยเหลือคุณครูและเพื่อน',
    },
    {
        label: 'เข้าแถวสาย -1',
        type: 'deduct' as const,
        category: 'discipline',
        score: 1,
        reason: 'มาสาย / เข้าแถวเคารพธงชาติสาย',
    },
    {
        label: 'ไม่ส่งงาน -2',
        type: 'deduct' as const,
        category: 'responsibility',
        score: 2,
        reason: 'ไม่ส่งงานตามกำหนด',
    },
] as const;

type Mode = 'scanning' | 'picking' | 'form-waste' | 'form-deposit' | 'form-withdraw' | 'form-conduct' | 'done';

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
    const queryClient = useQueryClient();
    const [mode, setMode] = useState<Mode>('scanning');
    const [student, setStudent] = useState<ScannedStudent | null>(null);
    const [wasteSummary, setWasteSummary] = useState<WasteStudentSummary | null>(null);
    const [savingsSummary, setSavingsSummary] = useState<SavingsStudentSummary | null>(null);
    const [conductSummary, setConductSummary] = useState<{ total: number; available: number } | null>(null);
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

    // Conduct form state
    const [conductType, setConductType] = useState<'add' | 'deduct'>('add');
    const [conductCategory, setConductCategory] = useState('publicMind');
    const [conductScore, setConductScore] = useState('2');
    const [conductReason, setConductReason] = useState('');

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
            const [w, s, c] = await Promise.all([
                wasteSummaryService.getForStudent(student.id),
                savingsSummaryService.getForStudent(student.id),
                conductService.getAccumulatedScore(student.id).catch(() => null),
            ]);
            if (w.data) setWasteSummary(w.data as unknown as WasteStudentSummary);
            if (s.data) setSavingsSummary(s.data as unknown as SavingsStudentSummary);
            if (c) setConductSummary(c);
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
        setConductSummary(null);
        setConductType('add');
        setConductCategory('publicMind');
        setConductScore('2');
        setConductReason('');
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
        if (!student || saving) return;
        const amt = Number(amount);
        if (!Number.isInteger(amt) || amt <= 0 || amt >= 100000000) {
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
        try {
        const term = await termService.getActive();
        const { data: saved, error } = await savingsTransactionsService.insert({
            student_id: student.id,
            student_name: student.name,
            student_class: student.class,
            transaction_type: type,
            amount: amt,
            transaction_date: new Date().toISOString().split('T')[0],
            notes: savingsNotes.trim() || null,
            recorded_by: recorder.name,
            recorded_by_staff_id: recorder.staffId,
            recorded_by_administrator_id: recorder.administratorId,
            academic_year: term?.year ?? null,
            semester: term?.sem ?? null,
        });
        if (error) throw error;
        if (!saved?.[0]) throw new Error('ไม่ได้รับการยืนยันจากระบบ กรุณาตรวจสอบประวัติก่อนบันทึกซ้ำ');
        const balance_after = Number(saved[0].balance_after);
        toast({
            title: type === 'deposit' ? 'ฝากเงินสำเร็จ' : 'ถอนเงินสำเร็จ',
            description: `${student.name} — ${fmtBaht(amt)} (คงเหลือ ${fmtBaht(balance_after)})`,
        });
        if (quickRepeat) resetAll();
        else { setStudent(null); setMode('done'); }
        } catch (error) {
            toast({ title: 'บันทึกไม่สำเร็จ', description: savingsErrorMessage(error), variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitConduct = async () => {
        if (!student || saving) return;
        const pts = Number(conductScore);
        if (!Number.isInteger(pts) || pts <= 0 || pts > 100) {
            toast({ title: 'กรอกคะแนนเป็นจำนวนเต็ม 1–100', variant: 'destructive' });
            return;
        }
        if (!conductReason.trim()) {
            toast({ title: 'กรุณาระบุเหตุผล', variant: 'destructive' });
            return;
        }
        if (!recorder.staffId && !recorder.administratorId) {
            toast({ title: 'เลือกผู้บันทึก', variant: 'destructive' });
            return;
        }
        setSaving(true);
        try {
            const term = await termService.getActive();
            const fallbackYear = String(new Date().getFullYear() + 543);
            const { error } = await conductService.insert({
                student_id: student.id,
                type: conductType,
                score: pts,
                category: conductCategory,
                reason: conductReason.trim(),
                recorded_by: recorder.name || null,
                recorded_by_staff_id: recorder.staffId,
                recorded_by_administrator_id: recorder.administratorId,
                academic_year: term?.year ?? fallbackYear,
                semester: term?.sem ?? '2',
            });
            if (error) throw error;
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['conduct-scores'] }),
                queryClient.invalidateQueries({ queryKey: ['public-top-heroes'] }),
                queryClient.invalidateQueries({ queryKey: ['hall-of-fame-heroes'] }),
                queryClient.invalidateQueries({ queryKey: ['top-heroes'] }),
            ]);
            toast({
                title: conductType === 'add' ? 'บันทึกคะแนนความดีสำเร็จ' : 'บันทึกหักคะแนนความประพฤติสำเร็จ',
                description: `${student.name} (${conductType === 'add' ? '+' : '-'}${pts} คะแนน) — ${conductReason.trim()}`,
            });
            if (quickRepeat) resetAll();
            else { setStudent(null); setMode('done'); }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : 'เกิดข้อผิดพลาด');
            toast({ title: 'บันทึกไม่สำเร็จ', description: msg, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
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
                                {conductSummary && (
                                    <Badge variant="outline" className={cn('text-[10px] border-sky-300 bg-card text-sky-900')}>
                                        ความดี {conductSummary.total} (แลกได้ {conductSummary.available})
                                    </Badge>
                                )}
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
                    <button
                        type="button"
                        onClick={() => setMode('form-conduct')}
                        className={cn(
                            'rounded-xl border-2 border-sky-300 bg-sky-50 hover:bg-sky-100 p-4 flex items-center gap-3 text-left active:scale-[0.98] transition',
                        )}
                    >
                        <div className={cn('w-12 h-12 rounded-full bg-sky-600 text-primary-foreground flex items-center justify-center flex-shrink-0')}>
                            <Star className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className={cn('font-bold text-sky-900')}>ความดี / ความประพฤติ</div>
                            <div className={cn('text-xs text-sky-800/80')}>
                                {conductSummary
                                    ? `สะสม ${conductSummary.total} คะแนน · พร้อมแลก ${conductSummary.available} คะแนน`
                                    : 'บันทึกเพิ่ม/หักคะแนนความประพฤติ'}
                            </div>
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
                            <div className="flex flex-wrap gap-1.5">
                                {QUICK_AMOUNTS.map((v) => (
                                    <button
                                        key={v}
                                        type="button"
                                        onClick={() => setAmount(String(v))}
                                        className={cn(
                                            'px-2.5 py-1 rounded-md border text-sm font-bold tabular-nums transition-colors',
                                            amount === String(v)
                                                ? 'border-amber-500 bg-amber-100 text-amber-900'
                                                : 'border-input text-foreground hover:bg-amber-50 hover:border-amber-400',
                                        )}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
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

            {/* Mode: form-conduct */}
            {mode === 'form-conduct' && (
                <Card>
                    <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <h2 className={cn('font-bold flex items-center gap-2 text-sky-900')}>
                                <Star className="w-5 h-5 text-sky-600" />
                                ความดี / ความประพฤติ
                            </h2>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setMode('picking')}
                                className={cn('gap-1')}
                            >
                                <ArrowLeft className="w-3.5 h-3.5" /> เปลี่ยน
                            </Button>
                        </div>

                        {conductSummary && (
                            <div className={cn('flex items-center justify-between bg-sky-50 border border-sky-200 rounded-md px-3 py-2 text-xs')}>
                                <span className={cn('font-medium text-sky-900')}>คะแนนความดีปัจจุบัน</span>
                                <span className={cn('font-bold text-sky-900 tabular-nums')}>
                                    สะสม {conductSummary.total} · พร้อมแลก {conductSummary.available}
                                </span>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                type="button"
                                variant={conductType === 'add' ? 'default' : 'outline'}
                                onClick={() => {
                                    setConductType('add');
                                    setConductCategory('publicMind');
                                }}
                                disabled={saving}
                                className={cn(
                                    'gap-1.5 font-bold',
                                    conductType === 'add'
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-primary-foreground'
                                        : 'border-border text-foreground',
                                )}
                            >
                                <Plus className="w-4 h-4" /> บวกความดี
                            </Button>
                            <Button
                                type="button"
                                variant={conductType === 'deduct' ? 'default' : 'outline'}
                                onClick={() => {
                                    setConductType('deduct');
                                    setConductCategory('discipline');
                                }}
                                disabled={saving}
                                className={cn(
                                    'gap-1.5 font-bold',
                                    conductType === 'deduct'
                                        ? 'bg-rose-600 hover:bg-rose-700 text-primary-foreground'
                                        : 'border-border text-foreground',
                                )}
                            >
                                <Minus className="w-4 h-4" /> หักคะแนน
                            </Button>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">ทางลัดด่วน (แตะเพื่อกรอกอัตโนมัติ)</Label>
                            <div className="flex flex-wrap gap-1.5">
                                {CONDUCT_PRESETS.map((preset) => {
                                    const activePreset =
                                        conductType === preset.type &&
                                        conductCategory === preset.category &&
                                        conductScore === String(preset.score) &&
                                        conductReason === preset.reason;
                                    return (
                                        <button
                                            key={preset.label}
                                            type="button"
                                            disabled={saving}
                                            onClick={() => {
                                                setConductType(preset.type);
                                                setConductCategory(preset.category);
                                                setConductScore(String(preset.score));
                                                setConductReason(preset.reason);
                                            }}
                                            className={cn(
                                                'px-2.5 py-1 rounded-full border text-xs font-semibold transition-colors',
                                                activePreset
                                                    ? preset.type === 'add'
                                                        ? 'bg-emerald-600 text-primary-foreground border-emerald-600'
                                                        : 'bg-rose-600 text-primary-foreground border-rose-600'
                                                    : preset.type === 'add'
                                                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                                                        : 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100',
                                            )}
                                        >
                                            {preset.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs">หมวดหมู่</Label>
                            <Select value={conductCategory} onValueChange={setConductCategory} disabled={saving}>
                                <SelectTrigger>
                                    <SelectValue placeholder="เลือกหมวดหมู่" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CONDUCT_CATEGORY_OPTIONS.map((c) => (
                                        <SelectItem key={c.key} value={c.key}>
                                            {c.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs">เหตุผล *</Label>
                            <Input
                                value={conductReason}
                                onChange={(e) => setConductReason(e.target.value)}
                                placeholder="ระบุเหตุผลความดีหรือพฤติกรรม..."
                                disabled={saving}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs">จำนวนคะแนน</Label>
                            <div className="flex flex-wrap gap-1.5">
                                {CONDUCT_QUICK_SCORES.map((v) => {
                                    const activeScore = conductScore === String(v);
                                    return (
                                        <button
                                            key={v}
                                            type="button"
                                            disabled={saving}
                                            onClick={() => setConductScore(String(v))}
                                            className={cn(
                                                'px-3 py-1.5 rounded-md border text-sm font-bold tabular-nums transition-colors',
                                                activeScore
                                                    ? conductType === 'add'
                                                        ? 'border-emerald-600 bg-emerald-100 text-emerald-900'
                                                        : 'border-rose-600 bg-rose-100 text-rose-900'
                                                    : 'border-border bg-card text-foreground hover:bg-muted',
                                            )}
                                        >
                                            {conductType === 'add' ? `+${v}` : `-${v}`}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    disabled={saving}
                                    onClick={() =>
                                        setConductScore((prev) => {
                                            const cur = parseInt(prev, 10);
                                            if (isNaN(cur) || cur <= 1) return '1';
                                            if (cur > 100) return '100';
                                            return String(cur - 1);
                                        })
                                    }
                                >
                                    <Minus className="w-4 h-4" />
                                </Button>
                                <Input
                                    type="number"
                                    inputMode="numeric"
                                    min={1}
                                    max={100}
                                    step={1}
                                    value={conductScore}
                                    onChange={(e) => setConductScore(e.target.value)}
                                    onBlur={() => {
                                        const val = parseInt(conductScore, 10);
                                        if (isNaN(val) || val < 1) setConductScore('1');
                                        else if (val > 100) setConductScore('100');
                                        else setConductScore(String(val));
                                    }}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    disabled={saving}
                                    className={cn('w-20 text-center text-lg font-bold tabular-nums')}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    disabled={saving}
                                    onClick={() =>
                                        setConductScore((prev) => {
                                            const cur = parseInt(prev, 10);
                                            if (isNaN(cur) || cur < 1) return '1';
                                            if (cur >= 100) return '100';
                                            return String(cur + 1);
                                        })
                                    }
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                                <span className={cn('text-xs text-muted-foreground')}>คะแนน (1–100)</span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            onClick={handleSubmitConduct}
                            disabled={saving || !conductReason.trim()}
                            className={cn(
                                'w-full gap-2 font-bold',
                                conductType === 'add'
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-primary-foreground'
                                    : 'bg-rose-600 hover:bg-rose-700 text-primary-foreground',
                            )}
                        >
                            <Check className="w-4 h-4" />
                            {saving
                                ? 'กำลังบันทึก...'
                                : conductType === 'add'
                                    ? `บันทึกความดี (+${Math.max(1, Math.min(100, parseInt(conductScore, 10) || 1))})`
                                    : `บันทึกหักคะแนน (-${Math.max(1, Math.min(100, parseInt(conductScore, 10) || 1))})`}
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
