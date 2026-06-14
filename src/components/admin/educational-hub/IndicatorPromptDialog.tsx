/**
 * IndicatorPromptDialog.tsx — ตัวช่วยสร้าง Prompt เกมอิงตัวชี้วัดหลักสูตร
 *
 * ครู/แอดมินเลือกตัวชี้วัด (วิชา + ชั้น) ที่อยากให้เกมฝึก → กด "สร้าง + คัดลอก Prompt"
 * → ระบบดึง /GAME-PROMPT.md + แทรกบล็อก "ตัวชี้วัดเป้าหมาย" (รหัส + คำอธิบาย + ระหว่างทาง/ปลายทาง)
 * → คัดลอกไป clipboard ให้วางกับ AI ได้เลย + จำตัวชี้วัดที่เลือกไว้ (onApply) เพื่อ auto-map
 *   เข้าเกมหลังอัปโหลด (ใน GamesTab).
 *
 * RLS: อ่านตัวชี้วัด public.
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Copy, Check } from 'lucide-react';
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
import {
    CURRICULUM_SUBJECTS as SUBJECT_OPTIONS,
    GRADE_OPTIONS,
    subjectLabel,
} from '@/lib/curriculumSubjects';
import { IndicatorKindBadge } from '@/components/admin/curriculum/IndicatorKindBadge';

/** สร้างบล็อก markdown ตัวชี้วัดเป้าหมายต่อท้าย prompt */
const buildIndicatorBlock = (
    subjectKey: string,
    grade: string,
    chosen: CurriculumIndicator[],
): string => {
    const lines = chosen.map((c) => {
        const kind = c.indicator_kind ? ` [${c.indicator_kind}]` : '';
        return `- ${c.indicator_code}${kind}: ${c.description}`;
    });
    return [
        '',
        '---',
        '',
        '## 🎯 ตัวชี้วัดเป้าหมาย (ออกแบบ gameplay ให้ฝึกตัวชี้วัดเหล่านี้)',
        `วิชา ${subjectLabel(subjectKey)} · ${grade} · หลักสูตรแกนกลาง 2551`,
        '',
        ...lines,
        '',
        'ให้เนื้อหา/โจทย์/กลไกของเกมฝึกทักษะตามตัวชี้วัดข้างต้นโดยตรง',
        '("ระหว่างทาง" = ฝึกระหว่างเรียน, "ปลายทาง" = วัดผลรวบยอด)',
        '',
    ].join('\n');
};

export const IndicatorPromptDialog = ({
    onApply,
    onClose,
}: {
    /** ส่ง indicator_ids ที่เลือก กลับให้ GamesTab จำไว้ auto-map หลังอัปโหลด */
    onApply: (indicatorIds: string[]) => void;
    onClose: () => void;
}) => {
    const { toast } = useToast();
    const [subjectKey, setSubjectKey] = useState('thai');
    const [grade, setGrade] = useState('ป.1');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [copied, setCopied] = useState(false);
    const [busy, setBusy] = useState(false);

    const { data: indicators, isLoading } = useQuery({
        queryKey: ['curriculum-indicators', subjectKey, grade],
        queryFn: async () => {
            const { data, error } = await curriculumService.listIndicators(subjectKey, grade);
            if (error) throw error;
            return (data as unknown as CurriculumIndicator[]) ?? [];
        },
    });

    // เก็บ object ตัวชี้วัดที่เลือก (ข้ามวิชา/ชั้น) ไว้ build prompt
    const [chosen, setChosen] = useState<Map<string, CurriculumIndicator>>(new Map());

    const toggle = (ind: CurriculumIndicator) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(ind.id)) next.delete(ind.id);
            else next.add(ind.id);
            return next;
        });
        setChosen((prev) => {
            const next = new Map(prev);
            if (next.has(ind.id)) next.delete(ind.id);
            else next.set(ind.id, ind);
            return next;
        });
    };

    const chosenList = useMemo(() => [...chosen.values()], [chosen]);

    const handleGenerate = async () => {
        if (chosen.size === 0) {
            toast({ title: 'เลือกตัวชี้วัดอย่างน้อย 1 ตัว', variant: 'destructive' });
            return;
        }
        setBusy(true);
        try {
            const res = await fetch('/GAME-PROMPT.md');
            const base = await res.text();
            // จัดกลุ่มบล็อกตามวิชา+ชั้นของตัวที่เลือก (เผื่อเลือกข้าม)
            const groups = new Map<string, CurriculumIndicator[]>();
            chosenList.forEach((c) => {
                const k = `${c.subject_key}|${c.grade}`;
                const arr = groups.get(k) ?? [];
                arr.push(c);
                groups.set(k, arr);
            });
            const blocks = [...groups.entries()].map(([k, list]) => {
                const [sk, g] = k.split('|');
                return buildIndicatorBlock(sk, g, list);
            });
            const full = base + '\n' + blocks.join('\n');
            await navigator.clipboard.writeText(full);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            onApply([...selected]);
            toast({
                title: `คัดลอก Prompt + ${chosen.size} ตัวชี้วัดแล้ว`,
                description: 'วางให้ AI สร้างเกม → อัปโหลดเกม → ระบบจะผูกตัวชี้วัดให้อัตโนมัติ',
            });
        } catch {
            toast({ title: 'สร้าง Prompt ไม่สำเร็จ', variant: 'destructive' });
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle>🎯 สร้าง Prompt อิงตัวชี้วัดหลักสูตร</DialogTitle>
                <DialogDescription>
                    เลือกตัวชี้วัดที่อยากให้เกมฝึก → คัดลอก Prompt ไปวางให้ AI → อัปโหลดเกมที่ได้
                    ระบบจะผูกตัวชี้วัดเข้ากับเกมให้อัตโนมัติ เลือกข้ามชั้น/วิชาได้
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
                    เลือกแล้ว {chosen.size} ตัวชี้วัด
                </span>
            </div>

            <div className="mt-3 max-h-[45vh] overflow-y-auto rounded-md border border-border divide-y divide-border">
                {isLoading ? (
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
                                onCheckedChange={() => toggle(ind)}
                                className="mt-0.5"
                            />
                            <div className="min-w-0">
                                <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
                                    {ind.indicator_code}
                                    <IndicatorKindBadge kind={ind.indicator_kind} />
                                </p>
                                <p className="text-sm text-foreground">{ind.description}</p>
                            </div>
                        </label>
                    ))
                )}
            </div>

            <DialogFooter>
                <Button variant="ghost" onClick={onClose} disabled={busy}>ปิด</Button>
                <Button onClick={handleGenerate} disabled={busy || chosen.size === 0}>
                    {busy ? (
                        <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> กำลังสร้าง...</>
                    ) : copied ? (
                        <><Check className="h-4 w-4 mr-1" /> คัดลอกแล้ว</>
                    ) : (
                        <><Copy className="h-4 w-4 mr-1" /> สร้าง + คัดลอก Prompt</>
                    )}
                </Button>
            </DialogFooter>
        </>
    );
};
