/**
 * LessonPlanIndicatorsDialog.tsx — ผูกแผนการสอน ↔ ตัวชี้วัดหลักสูตร (mig 170 indicator_lesson_plans)
 *
 * ครู/แอดมินเลือกตัวชี้วัดที่แผนการสอนนี้ครอบคลุม (ระบุ "ตัวชี้วัดที่เกี่ยวข้อง" ตามแบบแผนการสอนไทย).
 * ทำงานกับแผนที่บันทึกแล้ว (มี id). subject ของแผนเป็นข้อความไทย → map เป็น subject_key,
 * เลือกข้ามชั้น/วิชาได้ (สะสมรวมกัน) เผื่อ subject ไม่ match. บันทึกทับทั้งชุด.
 *
 * RLS: indicator_lesson_plans เขียนได้เฉพาะ teacher/admin (mig 170). อ่านตัวชี้วัด public.
 */

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { curriculumService, type CurriculumIndicator } from '@/services/curriculum.service';

/** วิชาที่มีตัวชี้วัดในระบบ (seed ปัจจุบัน = ภาษาไทย ป.1-6) */
const SUBJECT_OPTIONS = [
    { key: 'thai', label: 'ภาษาไทย' },
    { key: 'math', label: 'คณิตศาสตร์' },
    { key: 'science', label: 'วิทยาศาสตร์' },
    { key: 'english', label: 'ภาษาอังกฤษ' },
];

const GRADE_OPTIONS = ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];

/** ข้อความวิชาไทย → subject_key หลักสูตร */
const subjectKeyFromLabel = (s: string | null): string => {
    const t = s ?? '';
    if (t.includes('คณิต')) return 'math';
    if (t.includes('วิทย')) return 'science';
    if (t.includes('อังกฤษ') || t.includes('ต่างประเทศ')) return 'english';
    return 'thai';
};

export const LessonPlanIndicatorsDialog = ({
    plan,
    onClose,
}: {
    plan: { id: string; subject: string; grade: string };
    onClose: () => void;
}) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const defaultGrade = GRADE_OPTIONS.includes(plan.grade) ? plan.grade : 'ป.1';
    const [subjectKey, setSubjectKey] = useState(subjectKeyFromLabel(plan.subject));
    const [grade, setGrade] = useState(defaultGrade);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);

    const { data: existing, isLoading: loadingExisting } = useQuery({
        queryKey: ['lesson-plan-indicators', plan.id],
        queryFn: () => curriculumService.listLessonPlanIndicatorIds(plan.id),
    });
    useEffect(() => {
        if (existing) setSelected(new Set(existing));
    }, [existing]);

    const { data: indicators, isLoading: loadingIndicators } = useQuery({
        queryKey: ['curriculum-indicators', subjectKey, grade],
        queryFn: async () => {
            const { data, error } = await curriculumService.listIndicators(subjectKey, grade);
            if (error) throw error;
            return (data as unknown as CurriculumIndicator[]) ?? [];
        },
    });

    const toggle = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await curriculumService.setLessonPlanIndicators(plan.id, [...selected]);
            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ['lesson-plan-indicators', plan.id] });
            toast({ title: `ผูกตัวชี้วัดสำเร็จ (${selected.size} ตัวชี้วัด)` });
            onClose();
        } catch (err) {
            toast({
                title: 'บันทึกไม่สำเร็จ',
                description: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle>ตัวชี้วัดที่เกี่ยวข้อง — {plan.subject} {plan.grade}</DialogTitle>
                <DialogDescription>
                    เลือกตัวชี้วัดหลักสูตรแกนกลาง 2551 ที่แผนการสอนนี้ครอบคลุม เลือกข้ามชั้น/วิชาได้ (สะสมรวมกัน)
                </DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-2">
                <Select value={subjectKey} onValueChange={setSubjectKey}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {SUBJECT_OPTIONS.map((s) => (
                            <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={grade} onValueChange={setGrade}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {GRADE_OPTIONS.map((g) => (
                            <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <span className="ml-auto text-xs text-muted-foreground">
                    เลือกแล้ว {selected.size} ตัวชี้วัด
                </span>
            </div>

            <div className="mt-3 max-h-[50vh] overflow-y-auto rounded-md border border-border divide-y divide-border">
                {loadingIndicators || loadingExisting ? (
                    <div className="py-10 text-center text-muted-foreground">
                        <Loader2 className="h-5 w-5 mx-auto animate-spin" />
                    </div>
                ) : (indicators ?? []).length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                        ยังไม่มีตัวชี้วัดของวิชานี้ในระดับชั้นนี้
                    </p>
                ) : (
                    (indicators ?? []).map((ind) => (
                        <label
                            key={ind.id}
                            className="flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50"
                        >
                            <Checkbox
                                checked={selected.has(ind.id)}
                                onCheckedChange={() => toggle(ind.id)}
                                className="mt-0.5"
                            />
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-primary">{ind.indicator_code}</p>
                                <p className="text-sm text-foreground">{ind.description}</p>
                                {ind.strand_title && (
                                    <p className="text-[11px] text-muted-foreground">
                                        สาระที่ {ind.strand_no} {ind.strand_title}
                                    </p>
                                )}
                            </div>
                        </label>
                    ))
                )}
            </div>

            <DialogFooter>
                <Button variant="ghost" onClick={onClose} disabled={saving}>ยกเลิก</Button>
                <Button onClick={handleSave} disabled={saving || loadingExisting}>
                    {saving ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> บันทึก...</> : 'บันทึก'}
                </Button>
            </DialogFooter>
        </>
    );
};
