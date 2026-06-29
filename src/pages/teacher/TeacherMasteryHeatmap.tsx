/**
 * TeacherMasteryHeatmap.tsx — แผนที่ตัวชี้วัดระดับห้องเรียน (#3)
 *
 * ครูเลือกห้อง + วิชา → เห็นสถานะตัวชี้วัดของทั้งห้อง (นับนักเรียนในแต่ละสถานะ)
 * จุดประสงค์: "ตัวชี้วัดไหนทั้งห้องยังไม่ผ่านเยอะ → ควรสอนซ้ำ / สั่งเกมฝึก"
 *
 * RPC: class_indicator_heatmap (migration 269) — is_teacher() เท่านั้น
 */
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Target, Users, GraduationCap, Gamepad2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RolePortalLayout } from '@/components/portal/RolePortalLayout';
import { TEACHER_MENU } from '@/pages/teacher/TeacherDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { curriculumService, type IndicatorHeatmapRow } from '@/services/curriculum.service';
import { paporService } from '@/services/papor.service';
import { CURRICULUM_SUBJECTS } from '@/lib/curriculumSubjects';

const MENU_WITH_MASTERY = [
    ...TEACHER_MENU,
    { id: 'mastery', label: 'แผนที่ตัวชี้วัด', icon: Target, path: '/teacher/mastery' },
];

const STATUS_BAR = [
    { key: 'not_started', label: 'ยังไม่เริ่ม', cls: 'bg-muted-foreground/30' },
    { key: 'practicing', label: 'กำลังฝึก', cls: 'bg-amber-400' },
    { key: 'passed', label: 'ผ่าน', cls: 'bg-emerald-500' },
    { key: 'mastered', label: 'เชี่ยวชาญ', cls: 'bg-violet-500' },
] as const;

const gradeFromClass = (classroom: string | null): string => (classroom ? classroom.split('/')[0].trim() : 'ป.1');

export default function TeacherMasteryHeatmap() {
    const [classroom, setClassroom] = useState<string>('');
    const [subjectKey, setSubjectKey] = useState('thai');

    const { data: classes } = useQuery({
        queryKey: ['active-classes'],
        queryFn: () => paporService.listClasses(),
    });

    // auto-select first class
    const effectiveClass = classroom || classes?.[0] || '';
    const grade = gradeFromClass(effectiveClass);

    const { data: heatmap, isLoading } = useQuery({
        queryKey: ['class-heatmap', effectiveClass, subjectKey, grade],
        enabled: !!effectiveClass,
        queryFn: () => curriculumService.classHeatmap(effectiveClass, subjectKey, grade),
    });

    return (
        <RolePortalLayout title="Portal ครู" subtitle="ครู/บุคลากร" menu={MENU_WITH_MASTERY} accent="teacher">
            <div className="p-6 lg:p-8 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">แผนที่ตัวชี้วัดห้องเรียน</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        ดูว่าตัวชี้วัดไหนทั้งห้องยังไม่ผ่านเยอะ — ช่วยชี้นำว่าควรสอนซ้ำหรือสั่งเกมฝึก
                    </p>
                </div>

                {/* ตัวเลือก */}
                <Card>
                    <CardContent className="p-4 flex flex-col sm:flex-row gap-3 sm:items-end">
                        <div className="space-y-1.5 flex-1">
                            <label className="text-xs text-muted-foreground">ห้องเรียน</label>
                            <Select value={effectiveClass} onValueChange={setClassroom}>
                                <SelectTrigger><SelectValue placeholder="เลือกห้อง" /></SelectTrigger>
                                <SelectContent>
                                    {(classes ?? []).map((c) => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5 flex-1">
                            <label className="text-xs text-muted-foreground">วิชา</label>
                            <Select value={subjectKey} onValueChange={setSubjectKey}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {CURRICULUM_SUBJECTS.map((s) => (
                                        <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {isLoading && (
                    <div className="flex items-center justify-center py-16 text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" /> กำลังโหลด…
                    </div>
                )}

                {heatmap && heatmap.rows.length === 0 && (
                    <Card>
                        <CardContent className="p-6 text-center text-sm text-muted-foreground">
                            ยังไม่มีตัวชี้วัดสำหรับ {subjectLabel(subjectKey)} ในระดับ {grade}
                        </CardContent>
                    </Card>
                )}

                {heatmap && heatmap.rows.length > 0 && (
                    <ClassHeatmapView rows={heatmap.rows} totalStudents={heatmap.total_students} subjectKey={subjectKey} />
                )}
            </div>
        </RolePortalLayout>
    );
}

const ClassHeatmapView = ({
    rows, totalStudents, subjectKey,
}: {
    rows: IndicatorHeatmapRow[];
    totalStudents: number;
    subjectKey: string;
}) => {
    const summary = useMemo(() => {
        const avgPassedPct = rows.length > 0
            ? Math.round(rows.reduce((sum, r) => sum + (r.passed + r.mastered) / Math.max(r.total, 1), 0) / rows.length * 100)
            : 0;
        // ตัวชี้วัดที่ "ทั้งห้องยังไม่ผ่านเยอะ" (< 30% ผ่าน)
        const weakIndicators = rows.filter((r) => (r.passed + r.mastered) / Math.max(r.total, 1) < 0.3);
        return { avgPassedPct, weakIndicators };
    }, [rows]);

    return (
        <>
            {/* สรุป */}
            <div className="grid grid-cols-3 gap-3">
                <StatCard icon={Users} label="นักเรียนในห้อง" value={totalStudents} />
                <StatCard icon={Target} label="ตัวชี้วัดทั้งหมด" value={rows.length} />
                <StatCard icon={GraduationCap} label="ผ่านเฉลี่ย" value={`${summary.avgPassedPct}%`} />
            </div>

            {summary.weakIndicators.length > 0 && (
                <Card className="border-amber-200 bg-amber-50/50">
                    <CardContent className="p-4">
                        <p className="text-sm font-medium text-amber-800">
                            ⚠️ ตัวชี้วัดที่ทั้งห้องยังผ่านน้อย ({summary.weakIndicators.length} ตัว) — ควรสอนซ้ำหรือสั่งเกมฝึก
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Legend */}
            <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
                {STATUS_BAR.map((s) => (
                    <span key={s.key} className="flex items-center gap-1.5">
                        <span className={cn('w-3 h-3 rounded', s.cls)} /> {s.label}
                    </span>
                ))}
            </div>

            {/* Heatmap rows */}
            <Card>
                <CardContent className="p-2 sm:p-4 space-y-1">
                    {rows.map((r) => (
                        <HeatmapRow key={r.indicator_id} row={r} subjectKey={subjectKey} />
                    ))}
                </CardContent>
            </Card>
        </>
    );
};

const HeatmapRow = ({ row, subjectKey }: { row: IndicatorHeatmapRow; subjectKey: string }) => {
    const total = Math.max(row.total, 1);
    const segs = STATUS_BAR.map((s) => {
        const count = row[s.key as keyof IndicatorHeatmapRow] as number;
        return { ...s, count, pct: (count / total) * 100 };
    });
    const weak = (row.passed + row.mastered) / total < 0.3;

    return (
        <div className="p-2.5 rounded-lg hover:bg-secondary/50">
            <div className="flex items-start justify-between gap-3 mb-1.5">
                <div className="flex-1 min-w-0">
                    <p className="text-sm">{row.description}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                        {row.indicator_code}
                        {row.strand_title ? ` • ${row.strand_title}` : ''}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={weak ? 'destructive' : 'secondary'} className="text-[10px]">
                        {row.passed + row.mastered}/{row.total}
                    </Badge>
                    <Link
                        to={`/educational-hub`}
                        title="ดูเกมที่ช่วยฝึกตัวชี้วัดนี้"
                        className="text-muted-foreground hover:text-primary"
                    >
                        <Gamepad2 className="w-4 h-4" />
                    </Link>
                </div>
            </div>
            {/* Stacked progress bar */}
            <div className="flex h-2.5 rounded-full overflow-hidden bg-muted">
                {segs.map((s) => s.pct > 0 && (
                    <div
                        key={s.key}
                        className={s.cls}
                        style={{ width: `${s.pct}%` }}
                        title={`${s.label}: ${s.count}`}
                    />
                ))}
            </div>
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number | string }) => (
    <Card>
        <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
                <p className="text-xl font-bold leading-none">{value}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{label}</p>
            </div>
        </CardContent>
    </Card>
);

const subjectLabel = (key: string): string =>
    CURRICULUM_SUBJECTS.find((s) => s.key === key)?.label ?? key;
