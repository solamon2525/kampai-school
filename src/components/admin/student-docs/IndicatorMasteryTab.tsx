/**
 * IndicatorMasteryTab.tsx — ความก้าวหน้าตัวชี้วัดหลักสูตรรายนักเรียน (Student 360°)
 *
 * รวมหลักฐาน 2 ทาง (migration 170 v_student_indicator_mastery):
 *   • อัตโนมัติจากการเล่นเกม (student_indicator_events ผ่าน trigger mig 173)
 *   • ประเมินโดยครู (student_indicator_assessments — ระดับ 1-4) แก้ inline ในแท็บนี้
 * แสดงตัวชี้วัดทั้งหมดของวิชา+ชั้น (รวมที่ยังไม่เริ่ม) จัดกลุ่มตามสาระ.
 *
 * RLS: teacher/admin เท่านั้น (view security_invoker; assessment เขียนได้เฉพาะ teacher).
 */

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
    curriculumService,
    type CurriculumIndicator,
    type StudentIndicatorMastery,
    type IndicatorMasteryStatus,
} from '@/services/curriculum.service';

const SUBJECT_OPTIONS = [
    { key: 'thai', label: 'ภาษาไทย' },
    { key: 'math', label: 'คณิตศาสตร์' },
    { key: 'science', label: 'วิทยาศาสตร์' },
    { key: 'english', label: 'ภาษาอังกฤษ' },
];

const STATUS_META: Record<IndicatorMasteryStatus, { label: string; cls: string }> = {
    not_started: { label: 'ยังไม่เริ่ม', cls: 'bg-muted text-muted-foreground' },
    practicing:  { label: 'กำลังฝึก',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    passed:      { label: 'ผ่าน',       cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    mastered:    { label: 'เชี่ยวชาญ',  cls: 'bg-violet-50 text-violet-700 border-violet-200' },
};

/** ระดับประเมินครู (สอดคล้อง CHECK level 1-4 ใน migration 170) */
const ASSESS_LEVELS = [
    { value: 1, label: 'กำลังพัฒนา' },
    { value: 2, label: 'พอใช้' },
    { value: 3, label: 'ดี' },
    { value: 4, label: 'ดีเยี่ยม' },
];

const currentYear = (new Date().getFullYear() + 543).toString();

/** 'ป.5/2' → 'ป.5' */
const gradeFromClass = (classroom: string | null): string | null =>
    classroom ? classroom.split('/')[0].trim() || null : null;

export const IndicatorMasteryTab = ({
    studentId,
    classroom,
}: {
    studentId: string;
    classroom: string | null;
}) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const grade = gradeFromClass(classroom);
    const [subjectKey, setSubjectKey] = useState('thai');
    const [savingId, setSavingId] = useState<string | null>(null);

    const { data: indicators, isLoading: loadingInd } = useQuery({
        queryKey: ['curriculum-indicators', subjectKey, grade],
        enabled: !!grade,
        queryFn: async () => {
            const { data, error } = await curriculumService.listIndicators(subjectKey, grade!);
            if (error) throw error;
            return (data as unknown as CurriculumIndicator[]) ?? [];
        },
    });

    const { data: mastery, isLoading: loadingMastery } = useQuery({
        queryKey: ['indicator-mastery', studentId],
        queryFn: async () => {
            const { data, error } = await curriculumService.masteryByStudent(studentId);
            if (error) throw error;
            return (data as unknown as StudentIndicatorMastery[]) ?? [];
        },
    });

    const masteryMap = useMemo(() => {
        const m = new Map<string, StudentIndicatorMastery>();
        (mastery ?? []).forEach((r) => m.set(r.indicator_id, r));
        return m;
    }, [mastery]);

    // จัดกลุ่มตามสาระ (รักษาลำดับ sort_order)
    const groups = useMemo(() => {
        const map = new Map<string, { title: string; items: CurriculumIndicator[] }>();
        (indicators ?? []).forEach((ind) => {
            const key = ind.strand_no ?? '—';
            if (!map.has(key)) {
                map.set(key, {
                    title: ind.strand_no
                        ? `สาระที่ ${ind.strand_no}${ind.strand_title ? ` ${ind.strand_title}` : ''}`
                        : 'อื่น ๆ',
                    items: [],
                });
            }
            map.get(key)!.items.push(ind);
        });
        return [...map.values()];
    }, [indicators]);

    const assess = async (indicatorId: string, level: number) => {
        setSavingId(indicatorId);
        try {
            const { error } = await curriculumService.upsertAssessment({
                student_id: studentId,
                indicator_id: indicatorId,
                level,
                academic_year: currentYear,
            });
            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ['indicator-mastery', studentId] });
            toast({ title: 'บันทึกการประเมินแล้ว' });
        } catch (err) {
            toast({
                title: 'บันทึกไม่สำเร็จ',
                description: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด',
                variant: 'destructive',
            });
        } finally {
            setSavingId(null);
        }
    };

    if (!grade) {
        return (
            <p className="py-10 text-center text-sm text-muted-foreground">
                ไม่พบระดับชั้น (ป.1-6) ของนักเรียน — ตัวชี้วัดรองรับเฉพาะระดับประถม
            </p>
        );
    }

    const loading = loadingInd || loadingMastery;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Select value={subjectKey} onValueChange={setSubjectKey}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {SUBJECT_OPTIONS.map((s) => (
                            <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Badge variant="outline" className="text-xs">{grade}</Badge>
                <span className="ml-auto text-xs text-muted-foreground">ปีการศึกษา {currentYear}</span>
            </div>

            {loading ? (
                <div className="py-10 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 mx-auto animate-spin" />
                </div>
            ) : groups.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                    ยังไม่มีตัวชี้วัดของวิชานี้ในระบบ
                </p>
            ) : (
                <div className="space-y-5">
                    {groups.map((g) => (
                        <div key={g.title}>
                            <p className="text-sm font-semibold text-foreground mb-2">{g.title}</p>
                            <div className="rounded-md border border-border divide-y divide-border">
                                {g.items.map((ind) => {
                                    const st = masteryMap.get(ind.id);
                                    const status: IndicatorMasteryStatus = st?.status ?? 'not_started';
                                    const meta = STATUS_META[status];
                                    return (
                                        <div key={ind.id} className="px-3 py-2.5">
                                            <div className="flex items-start gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-medium text-primary">{ind.indicator_code}</p>
                                                    <p className="text-sm text-foreground">{ind.description}</p>
                                                </div>
                                                <Badge variant="outline" className={cn('shrink-0 text-[11px]', meta.cls)}>
                                                    {meta.label}
                                                </Badge>
                                            </div>
                                            <div className="mt-2 flex items-center gap-1 flex-wrap">
                                                {st && st.attempts > 0 && (
                                                    <span className="text-[11px] text-muted-foreground mr-1">
                                                        เล่นเกม {st.attempts} ครั้ง{st.any_passed ? ' · ผ่านแล้ว' : ''}
                                                    </span>
                                                )}
                                                <span className="text-[11px] text-muted-foreground mr-1">ประเมิน:</span>
                                                {ASSESS_LEVELS.map((lv) => (
                                                    <Button
                                                        key={lv.value}
                                                        size="sm"
                                                        variant={st?.assessed_level === lv.value ? 'default' : 'outline'}
                                                        className="h-6 px-2 text-[11px]"
                                                        disabled={savingId === ind.id}
                                                        onClick={() => assess(ind.id, lv.value)}
                                                    >
                                                        {lv.value} {lv.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
