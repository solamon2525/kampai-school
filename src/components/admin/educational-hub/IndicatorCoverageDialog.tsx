/**
 * IndicatorCoverageDialog.tsx — ความครอบคลุมตัวชี้วัด → เกม (มุมแอดมิน)
 *
 * เลือกวิชา + ชั้น → ตารางตัวชี้วัดทุกตัว แต่ละแถวโชว์เกมที่ผูก (หรือ "ยังไม่มีเกม")
 * ช่วยให้แอดมินเห็นว่าตัวชี้วัดไหนมีเกมฝึกแล้ว / ตัวไหนยังขาด เพื่อวางแผนสร้างเกมเพิ่ม.
 *
 * RLS: อ่านตัวชี้วัด public; indicator_games อ่านได้ (mig 170).
 */

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { curriculumService } from '@/services/curriculum.service';
import {
    CURRICULUM_SUBJECTS as SUBJECT_OPTIONS,
    GRADE_OPTIONS,
} from '@/lib/curriculumSubjects';
import { IndicatorKindBadge } from '@/components/admin/curriculum/IndicatorKindBadge';

export const IndicatorCoverageDialog = ({ onClose }: { onClose: () => void }) => {
    const [subjectKey, setSubjectKey] = useState('thai');
    const [grade, setGrade] = useState('ป.1');

    const { data: rows, isLoading } = useQuery({
        queryKey: ['indicator-coverage', subjectKey, grade],
        queryFn: () => curriculumService.gamesByIndicator(subjectKey, grade),
    });

    const stats = useMemo(() => {
        const total = (rows ?? []).length;
        const covered = (rows ?? []).filter((r) => r.games.length > 0).length;
        return { total, covered, pct: total ? Math.round((covered / total) * 100) : 0 };
    }, [rows]);

    return (
        <>
            <DialogHeader>
                <DialogTitle>📊 ความครอบคลุมตัวชี้วัด → เกม</DialogTitle>
                <DialogDescription>
                    ดูว่าตัวชี้วัดไหนมีเกมฝึกแล้ว / ตัวไหนยังขาด เพื่อวางแผนสร้างเกมเพิ่ม
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
                    มีเกมแล้ว {stats.covered}/{stats.total} ({stats.pct}%)
                </span>
            </div>

            <div className="mt-3 max-h-[55vh] overflow-y-auto rounded-md border border-border divide-y divide-border">
                {isLoading ? (
                    <div className="py-10 text-center text-muted-foreground">
                        <Loader2 className="h-5 w-5 mx-auto animate-spin" />
                    </div>
                ) : (rows ?? []).length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                        ยังไม่มีตัวชี้วัดของวิชานี้ในระดับชั้นนี้
                    </p>
                ) : (
                    (rows ?? []).map((r) => (
                        <div key={r.id} className="px-3 py-2.5">
                            <div className="flex items-start gap-2">
                                <div className="min-w-0 flex-1">
                                    <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
                                        {r.indicator_code}
                                        <IndicatorKindBadge kind={r.indicator_kind} />
                                    </p>
                                    <p className="text-sm text-foreground">{r.description}</p>
                                </div>
                                {r.games.length > 0 ? (
                                    <Badge className="shrink-0 text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200">
                                        🎯 {r.games.length} เกม
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="shrink-0 text-[10px] text-muted-foreground">
                                        ยังไม่มีเกม
                                    </Badge>
                                )}
                            </div>
                            {r.games.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                    {r.games.map((g) => (
                                        <span
                                            key={g.id}
                                            className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                                        >
                                            {g.title}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <DialogFooter>
                <Button variant="ghost" onClick={onClose}>ปิด</Button>
            </DialogFooter>
        </>
    );
};
