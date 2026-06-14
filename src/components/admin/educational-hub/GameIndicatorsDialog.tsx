/**
 * GameIndicatorsDialog.tsx — ผูกเกม ↔ ตัวชี้วัดหลักสูตร (migration 170 indicator_games)
 *
 * ครู/แอดมินเลือกตัวชี้วัด (แยกวิชา + ชั้น) ที่เกมนี้ฝึก → เมื่อนักเรียนเล่น เกมจะสร้าง
 * หลักฐานความก้าวหน้าให้อัตโนมัติผ่าน trigger (migration 173).
 * เลือกข้ามชั้น/วิชาได้ — เก็บสะสมใน selected (set เดียวต่อเกม), บันทึกทับทั้งชุด.
 *
 * RLS: indicator_games เขียนได้เฉพาะ teacher/admin (mig 170). อ่านตัวชี้วัด public.
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
import type { EduHubItem } from '@/services/educational-hub.service';
import {
    CURRICULUM_SUBJECTS as SUBJECT_OPTIONS,
    GRADE_OPTIONS,
    subjectKeyFromFolder,
} from '@/lib/curriculumSubjects';
import { IndicatorKindBadge } from '@/components/admin/curriculum/IndicatorKindBadge';

export const GameIndicatorsDialog = ({
    item,
    onClose,
}: {
    item: EduHubItem;
    onClose: () => void;
}) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const defaultSubject = subjectKeyFromFolder(item.subject);
    const defaultGrade = (item.grade_levels ?? []).find((g) => GRADE_OPTIONS.includes(g)) ?? 'ป.1';

    const [subjectKey, setSubjectKey] = useState(defaultSubject);
    const [grade, setGrade] = useState(defaultGrade);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);

    // ตัวชี้วัดที่ผูกอยู่เดิม → init selected
    const { data: existing, isLoading: loadingExisting } = useQuery({
        queryKey: ['game-indicators', item.id],
        queryFn: () => curriculumService.listGameIndicatorIds(item.id),
    });
    useEffect(() => {
        if (existing) setSelected(new Set(existing));
    }, [existing]);

    // ตัวชี้วัดของวิชา + ชั้นที่เลือกอยู่
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
            const { error } = await curriculumService.setGameIndicators(item.id, [...selected]);
            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ['game-indicators', item.id] });
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
                <DialogTitle>ตัวชี้วัดหลักสูตร — {item.title}</DialogTitle>
                <DialogDescription>
                    เลือกตัวชี้วัดที่เกมนี้ฝึก — เมื่อนักเรียนเล่น ระบบจะบันทึกหลักฐานความก้าวหน้า
                    ให้อัตโนมัติ เลือกข้ามชั้น/วิชาได้ (สะสมรวมกัน)
                </DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-2">
                <Select value={subjectKey} onValueChange={setSubjectKey}>
                    <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
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
                                <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
                                    {ind.indicator_code}
                                    <IndicatorKindBadge kind={ind.indicator_kind} />
                                </p>
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
