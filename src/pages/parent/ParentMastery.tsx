/**
 * ParentMastery.tsx — ความก้าวหน้าตัวชี้วัดของบุตร (#2)
 *
 * ผู้ปกครองเห็นแผนที่ตัวชี้วัดของลูก (เลือกวิชา) — ผ่าน/กำลังฝึก/ยังไม่เริ่ม
 * + หลักฐาน (ผ่านจากเกม = best_score, ครูประเมิน = assessed_level)
 *
 * RPC: child_mastery (migration 269) — SECURITY DEFINER + ตรวจ is_my_student ฝั่ง server
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Target } from 'lucide-react';
import { RolePortalLayout } from '@/components/portal/RolePortalLayout';
import { PARENT_MENU } from '@/pages/parent/ParentDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { ChildSwitcher } from '@/components/parent/ChildSwitcher';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useActiveChild } from '@/hooks/useActiveChild';
import { cn } from '@/lib/utils';
import {
    curriculumService,
    type MasteryBundle,
    type MasteryRow,
    type IndicatorMasteryStatus,
} from '@/services/curriculum.service';
import { levelFromXp } from '@/services/game-play.service';
import { CURRICULUM_SUBJECTS } from '@/lib/curriculumSubjects';

const STATUS_META: Record<IndicatorMasteryStatus, { label: string; cls: string; dot: string }> = {
    not_started: { label: 'ยังไม่เริ่ม', cls: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground/40' },
    practicing: { label: 'กำลังฝึก', cls: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-500' },
    passed: { label: 'ผ่าน', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' },
    mastered: { label: 'เชี่ยวชาญ', cls: 'bg-violet-50 text-violet-700 border border-violet-200', dot: 'bg-violet-500' },
};

// เพิ่มเมนู "ความก้าวหน้า" ให้ parent menu (PARENT_MENU มาจาก ParentDashboard)
const MENU_WITH_MASTERY = [
    ...PARENT_MENU,
    { id: 'mastery', label: 'ความก้าวหน้า', icon: Target, path: '/parent/mastery' },
];

export default function ParentMastery() {
    const { activeChild, children: kids } = useActiveChild();
    const [subjectKey, setSubjectKey] = useState('thai');

    const { data: bundle, isLoading } = useQuery({
        queryKey: ['child-mastery', activeChild?.id],
        enabled: !!activeChild,
        queryFn: () => curriculumService.childMastery(activeChild!.id),
    });

    return (
        <RolePortalLayout title="Portal ผู้ปกครอง" subtitle="ผู้ปกครอง" menu={MENU_WITH_MASTERY} accent="parent">
            <div className="p-6 lg:p-8 space-y-6">
                {/* หัวการ์ด */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">ความก้าวหน้าการเรียนรู้</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            ดูตัวชี้วัดที่ลูกผ่านและกำลังฝึก ตามหลักสูตรแกนกลาง
                        </p>
                    </div>
                    {kids.length > 0 && <ChildSwitcher />}
                </div>

                {isLoading && (
                    <div className="flex items-center justify-center py-16 text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" /> กำลังโหลด…
                    </div>
                )}

                {!isLoading && !bundle && !activeChild && (
                    <Card>
                        <CardContent className="p-6">
                            <p className="text-sm text-amber-600">
                                บัญชีของคุณยังไม่ได้เชื่อมกับนักเรียน กรุณาติดต่อผู้ดูแลระบบ
                            </p>
                        </CardContent>
                    </Card>
                )}

                {bundle && <MasteryDetail bundle={bundle as MasteryBundle} subjectKey={subjectKey} onSubject={setSubjectKey} />}
            </div>
        </RolePortalLayout>
    );
}

const MasteryDetail = ({
    bundle, subjectKey, onSubject,
}: {
    bundle: MasteryBundle;
    subjectKey: string;
    onSubject: (k: string) => void;
}) => {
    const { student, stats, mastery } = bundle;
    const level = levelFromXp(stats.total_xp);
    const subjectMastery = mastery.filter((m) => m.subject_key === subjectKey);
    const total = subjectMastery.length;
    const passed = subjectMastery.filter((m) => m.status === 'passed' || m.status === 'mastered').length;
    const pct = total > 0 ? Math.round((passed / total) * 100) : 0;

    // นับรวมทุกวิชา
    const allPassed = mastery.filter((m) => m.status === 'passed' || m.status === 'mastered').length;

    return (
        <>
            {/* สรุปรวม + เลเวล */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <PersonAvatar name={student.name} photoUrl={student.photo_url} className="w-16 h-16 text-xl" />
                        <div className="flex-1">
                            <h2 className="text-xl font-bold">{student.name}</h2>
                            <p className="text-sm text-muted-foreground">
                                {student.class}{student.room ? `/${student.room}` : ''} • เลเวล {level.level} • XP {stats.total_xp.toLocaleString()}
                            </p>
                            <div className="mt-2 grid grid-cols-3 gap-2 max-w-md">
                                <SummaryStat label="เกมที่เล่น" value={stats.games_played} />
                                <SummaryStat label="เหรียญ" value={stats.medals_count} />
                                <SummaryStat label="ผ่านตัวชี้วัด" value={allPassed} />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* เลือกวิชา + แผนที่ตัวชี้วัด */}
            <Card>
                <CardContent className="p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h3 className="font-bold">ตัวชี้วัด {student.grade ? `(${student.grade})` : ''}</h3>
                            {total > 0 && (
                                <p className="text-sm text-muted-foreground">
                                    ผ่าน {passed} จาก {total} ตัวชี้วัด ({pct}%)
                                </p>
                            )}
                        </div>
                        <Select value={subjectKey} onValueChange={onSubject}>
                            <SelectTrigger className="w-full sm:w-[220px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {CURRICULUM_SUBJECTS.map((s) => (
                                    <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {total > 0 && <Progress value={pct} className="h-2" />}

                    {subjectMastery.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                            ยังไม่มีตัวชี้วัดสำหรับวิชานี้ในระดับชั้นของบุตร
                        </p>
                    ) : (
                        <div className="space-y-1.5">
                            {subjectMastery.map((row) => (
                                <ParentIndicatorRow key={row.indicator_id} row={row} />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
};

const SummaryStat = ({ label, value }: { label: string; value: number }) => (
    <div className="rounded-lg bg-secondary p-2 text-center">
        <p className="text-lg font-bold leading-none">{value}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
);

const ParentIndicatorRow = ({ row }: { row: MasteryRow }) => {
    const meta = STATUS_META[row.status];
    return (
        <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-secondary/50">
            <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', meta.dot)} />
            <div className="flex-1 min-w-0">
                <p className="text-sm">{row.description}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[11px] text-muted-foreground">{row.indicator_code}</span>
                    {row.best_score != null && (
                        <span className="text-[11px] text-emerald-600">• ผ่านจากเกม (คะแนน {row.best_score})</span>
                    )}
                    {row.assessed_level != null && (
                        <span className="text-[11px] text-sky-600">• ครูประเมิน ระดับ {row.assessed_level}</span>
                    )}
                </div>
            </div>
            <Badge variant="secondary" className={cn('shrink-0', meta.cls)}>{meta.label}</Badge>
        </div>
    );
};
