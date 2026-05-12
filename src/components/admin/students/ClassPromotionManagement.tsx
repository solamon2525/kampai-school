import { useState, useMemo } from 'react';
import { studentsService } from '@/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, ArrowUpCircle, GraduationCap, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '../shared/ConfirmDialog';

interface Student {
    id: string;
    name: string;
    student_code: string | null;
    class: string;
    class_number: number | null;
    is_active: boolean;
}

const NEXT_CLASS: Record<string, string | null> = {
    'อ.1': 'อ.2', 'อ.2': 'อ.3', 'อ.3': 'ป.1',
    'ป.1': 'ป.2', 'ป.2': 'ป.3', 'ป.3': 'ป.4',
    'ป.4': 'ป.5', 'ป.5': 'ป.6', 'ป.6': null, // null = จบการศึกษา
    'ม.1': 'ม.2', 'ม.2': 'ม.3', 'ม.3': null,
    'ม.4': 'ม.5', 'ม.5': 'ม.6', 'ม.6': null,
};

export const ClassPromotionManagement = () => {
    const [fromYear, setFromYear] = useState(String(new Date().getFullYear() + 543));
    const [students, setStudents] = useState<Student[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [excluded, setExcluded] = useState<Set<string>>(new Set()); // IDs ที่ซ้ำชั้น (ไม่เลื่อน)
    const [isProcessing, setIsProcessing] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const { toast } = useToast();

    const toYear = String(Number(fromYear) + 1);

    const loadStudents = async () => {
        const { data, error } = await studentsService.getAll();
        if (error) {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: error.message });
            return;
        }
        const active = ((data || []) as Student[]).filter(s => s.is_active);
        setStudents(active);
        setExcluded(new Set());
        setLoaded(true);
    };

    // จัดกลุ่มตามชั้น
    const groupedByClass = useMemo(() => {
        const map = new Map<string, Student[]>();
        for (const s of students) {
            if (!map.has(s.class)) map.set(s.class, []);
            map.get(s.class)!.push(s);
        }
        // Sort within each class by class_number
        for (const [, arr] of map) {
            arr.sort((a, b) => (a.class_number ?? 9999) - (b.class_number ?? 9999));
        }
        // Sort classes by CLASS_OPTIONS order
        const CLASS_ORDER = [
            'อ.1', 'อ.2', 'อ.3',
            'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6',
            'ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6',
        ];
        return Array.from(map.entries()).sort(([a], [b]) => {
            const ai = CLASS_ORDER.indexOf(a);
            const bi = CLASS_ORDER.indexOf(b);
            return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
        });
    }, [students]);

    const toggleStudent = (id: string) => {
        setExcluded(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleClass = (classStudents: Student[]) => {
        const ids = classStudents.map(s => s.id);
        const allChecked = ids.every(id => !excluded.has(id));
        setExcluded(prev => {
            const next = new Set(prev);
            if (allChecked) {
                // uncheck all → add to excluded
                ids.forEach(id => next.add(id));
            } else {
                // check all → remove from excluded
                ids.forEach(id => next.delete(id));
            }
            return next;
        });
    };

    // Summary counts
    const summary = useMemo(() => {
        let promoting = 0;
        let repeating = 0;
        let graduating = 0;
        for (const s of students) {
            if (excluded.has(s.id)) {
                repeating++;
            } else {
                const next = NEXT_CLASS[s.class];
                if (next === undefined) {
                    // ชั้นที่ไม่รู้จัก — ข้าม
                } else if (next === null) {
                    graduating++;
                } else {
                    promoting++;
                }
            }
        }
        return { promoting, repeating, graduating };
    }, [students, excluded]);

    const handleConfirmPromotion = async () => {
        setIsProcessing(true);
        setShowConfirm(false);
        let successCount = 0;
        let errorCount = 0;

        for (const s of students) {
            if (excluded.has(s.id)) continue; // ซ้ำชั้น — ไม่แตะ

            const next = NEXT_CLASS[s.class];
            if (next === undefined) continue; // ชั้นที่ไม่รู้จัก

            if (next === null) {
                // จบการศึกษา
                const { error } = await studentsService.update(s.id, { is_active: false, class: 'จบการศึกษา' });
                if (error) errorCount++;
                else successCount++;
            } else {
                // เลื่อนชั้น
                const { error } = await studentsService.update(s.id, { class: next });
                if (error) errorCount++;
                else successCount++;
            }
        }

        setIsProcessing(false);
        if (errorCount > 0) {
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาดบางส่วน',
                description: `สำเร็จ ${successCount} คน, ล้มเหลว ${errorCount} คน`,
            });
        } else {
            toast({
                title: 'เลื่อนชั้นสำเร็จ',
                description: `ดำเนินการแล้ว ${successCount} คน (${summary.graduating} คนจบการศึกษา)`,
            });
        }
        // Reload
        await loadStudents();
    };

    return (
        <div className="space-y-6">
            {/* Step 1: เลือกปีการศึกษา */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ArrowUpCircle className="w-5 h-5" />
                        เลื่อนชั้นนักเรียน
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="space-y-2">
                            <Label>ปีการศึกษาปัจจุบัน (พ.ศ.)</Label>
                            <Input
                                className="w-32"
                                value={fromYear}
                                onChange={e => setFromYear(e.target.value)}
                                placeholder="เช่น 2567"
                            />
                        </div>
                        <div className="flex items-center gap-2 pb-1">
                            <ArrowRight className="w-5 h-5 text-muted-foreground" />
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">ปีที่จะเลื่อนเข้า</p>
                                <p className="text-lg font-bold text-primary">{toYear}</p>
                            </div>
                        </div>
                        <Button onClick={loadStudents} className="gap-2">
                            <RefreshCw className="w-4 h-4" />
                            ดูรายชื่อ
                        </Button>
                    </div>
                    {loaded && (
                        <p className="text-sm text-muted-foreground mt-3">
                            โหลดข้อมูลนักเรียนที่กำลังศึกษา {students.length} คน จาก {groupedByClass.length} ชั้นเรียน
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Step 2: ตารางเลื่อนชั้น */}
            {loaded && (
                <>
                    <div className="space-y-4">
                        {groupedByClass.map(([cls, classStudents]) => {
                            const nextCls = NEXT_CLASS[cls];
                            const headerLabel = nextCls === undefined
                                ? cls
                                : nextCls === null
                                    ? `${cls} → จบการศึกษา`
                                    : `${cls} → ${nextCls}`;
                            const isGraduating = nextCls === null;
                            const allChecked = classStudents.every(s => !excluded.has(s.id));
                            const someChecked = classStudents.some(s => !excluded.has(s.id));

                            return (
                                <Card key={cls}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                {isGraduating && <GraduationCap className="w-4 h-4 text-amber-500" />}
                                                {headerLabel}
                                                <Badge variant="outline">{classStudents.length} คน</Badge>
                                            </CardTitle>
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id={`select-all-${cls}`}
                                                    checked={allChecked}
                                                    onCheckedChange={() => toggleClass(classStudents)}
                                                />
                                                <Label htmlFor={`select-all-${cls}`} className="text-xs cursor-pointer">
                                                    {allChecked ? 'ยกเลิกทั้งหมด' : someChecked ? 'เลือกทั้งหมด' : 'เลือกทั้งหมด'}
                                                </Label>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b">
                                                        <th className="text-left py-2 px-2 w-10">เลือก</th>
                                                        <th className="text-left py-2 px-2">เลขที่</th>
                                                        <th className="text-left py-2 px-2">รหัส</th>
                                                        <th className="text-left py-2 px-2">ชื่อ-นามสกุล</th>
                                                        <th className="text-left py-2 px-2">การดำเนินการ</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {classStudents.map(s => {
                                                        const isChecked = !excluded.has(s.id);
                                                        const action = isChecked
                                                            ? (nextCls === null ? 'จบการศึกษา' : nextCls ? `เลื่อนเป็น ${nextCls}` : '—')
                                                            : 'ซ้ำชั้น';
                                                        return (
                                                            <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                                                                <td className="py-2 px-2">
                                                                    <Checkbox
                                                                        checked={isChecked}
                                                                        onCheckedChange={() => toggleStudent(s.id)}
                                                                    />
                                                                </td>
                                                                <td className="py-2 px-2 text-muted-foreground">
                                                                    {s.class_number ?? '—'}
                                                                </td>
                                                                <td className="py-2 px-2 font-mono text-xs text-muted-foreground">
                                                                    {s.student_code || '—'}
                                                                </td>
                                                                <td className="py-2 px-2 font-medium">{s.name}</td>
                                                                <td className="py-2 px-2">
                                                                    <Badge
                                                                        variant={
                                                                            !isChecked
                                                                                ? 'outline'
                                                                                : nextCls === null
                                                                                    ? 'secondary'
                                                                                    : 'default'
                                                                        }
                                                                        className="text-xs"
                                                                    >
                                                                        {action}
                                                                    </Badge>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Step 3: สรุปและยืนยัน */}
                    <Card className="border-primary/30">
                        <CardHeader>
                            <CardTitle className="text-base">สรุปการเลื่อนชั้น</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="text-center p-4 bg-primary/10 rounded-lg">
                                    <p className="text-2xl font-bold text-primary">{summary.promoting}</p>
                                    <p className="text-sm text-muted-foreground mt-1">คนเลื่อนชั้น</p>
                                </div>
                                <div className="text-center p-4 bg-muted rounded-lg">
                                    <p className="text-2xl font-bold text-muted-foreground">{summary.repeating}</p>
                                    <p className="text-sm text-muted-foreground mt-1">คนซ้ำชั้น</p>
                                </div>
                                <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                                    <p className="text-2xl font-bold text-amber-600">{summary.graduating}</p>
                                    <p className="text-sm text-muted-foreground mt-1">คนจบการศึกษา</p>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    onClick={() => setShowConfirm(true)}
                                    disabled={isProcessing || (summary.promoting + summary.graduating === 0)}
                                    className="gap-2"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            กำลังดำเนินการ...
                                        </>
                                    ) : (
                                        <>
                                            <ArrowUpCircle className="w-4 h-4" />
                                            ยืนยันเลื่อนชั้น
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            <ConfirmDialog
                open={showConfirm}
                onOpenChange={setShowConfirm}
                onConfirm={handleConfirmPromotion}
                variant="default"
                title="ยืนยันการเลื่อนชั้น"
                description={`เลื่อนชั้น ${summary.promoting} คน, จบการศึกษา ${summary.graduating} คน, ซ้ำชั้น ${summary.repeating} คน — การดำเนินการนี้จะแก้ไขข้อมูลในฐานข้อมูลทันที`}
                confirmText="ยืนยันเลื่อนชั้น"
            />
        </div>
    );
};
