/**
 * MyLearning.tsx — Student Self-Dashboard (#4) — หน้า /my
 *
 * นักเรียนเข้าด้วย "พิมพ์รหัสนักเรียน" (เหมือน PlayGame) — ไม่มี role student ในระบบ auth
 * หลังกรอกรหัส: เก็บใน localStorage ('kampai_my_student_code') เพื่อกลับมาดูใหม่ได้
 *
 * ส่วนประกอบ:
 *   1. หัวการ์ด: ชื่อ + PersonAvatar + เลเวล/XP + เหรียญนับ
 *   2. แนะนำเกมสำหรับคุณ (#1 — RecommendedGames)
 *   2b. แนะนำสื่อสำหรับคุณ (recommend_media · migration 429)
 *   3. แผนที่ตัวชี้วัดของฉัน (เลือกวิชา → ตัวชี้วัดทั้งหมดในระดับชั้นตัวเอง + สถานะ)
 *
 * RPC: my_mastery (migration 269) — SECURITY DEFINER (anon-callable)
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowLeft, BookOpen, Loader2, LogOut, Gamepad2, Star, Award, Sparkles, Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { useToast } from '@/hooks/use-toast';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
    curriculumService,
    type MasteryBundle,
    type MasteryRow,
    type IndicatorMasteryStatus,
} from '@/services/curriculum.service';
import { levelFromXp } from '@/services/game-play.service';
import { CURRICULUM_SUBJECTS } from '@/lib/curriculumSubjects';
import { RecommendedGames } from '@/components/student/RecommendedGames';
import { RecommendedMedia } from '@/components/student/RecommendedMedia';

const STORAGE_KEY = 'kampai_my_student_code';

const STATUS_META: Record<IndicatorMasteryStatus, { label: string; cls: string; dot: string }> = {
    not_started: { label: 'ยังไม่เริ่ม', cls: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground/40' },
    practicing: { label: 'กำลังฝึก', cls: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-500' },
    passed: { label: 'ผ่าน', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' },
    mastered: { label: 'เชี่ยวชาญ', cls: 'bg-violet-50 text-violet-700 border border-violet-200', dot: 'bg-violet-500' },
};

export default function MyLearning() {
    const [studentCode, setStudentCode] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));

    const handleLogout = () => {
        localStorage.removeItem(STORAGE_KEY);
        setStudentCode(null);
    };

    if (!studentCode) {
        return <LookupView onResolved={(code) => {
            localStorage.setItem(STORAGE_KEY, code);
            setStudentCode(code);
        }} />;
    }
    return <DashboardView studentCode={studentCode} onLogout={handleLogout} />;
}

// ════════════════════════════════════════════════════════════════════════════
// Lookup — กรอกรหัสนักเรียน
// ════════════════════════════════════════════════════════════════════════════
const LookupView = ({ onResolved }: { onResolved: (code: string) => void }) => {
    const { toast } = useToast();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        const trimmed = code.trim();
        if (!trimmed) return;
        setLoading(true);
        try {
            // ทดสอบ resolve — ถ้ารหัสไม่ถูกต้อง RPC จะ throw 'student_not_found'
            await curriculumService.myMasteryByCode(trimmed);
            onResolved(trimmed);
        } catch (err) {
            toast({
                title: 'ไม่พบรหัสนักเรียน',
                description: 'กรุณาตรวจสอบรหัสนักเรียนอีกครั้ง',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
            <Card className="w-full max-w-md">
                <CardContent className="p-8 space-y-6">
                    <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-4 h-4 mr-1.5" /> กลับหน้าแรก
                    </Link>
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                            <Gamepad2 className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold">การเรียนรู้ของฉัน</h1>
                        <p className="text-sm text-muted-foreground">
                            กรอกรหัสนักเรียนเพื่อดูความก้าวหน้าของคุณ
                        </p>
                    </div>
                    <div className="space-y-3">
                        <Input
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && submit()}
                            placeholder="เช่น 67001"
                            className="text-center text-lg tracking-wider"
                            autoFocus
                            disabled={loading}
                        />
                        <Button onClick={submit} disabled={loading || !code.trim()} className="w-full">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                            เข้าสู่หน้าของฉัน
                        </Button>
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                        💡 รหัสเดียวกับที่ใช้เล่นเกม — ถ้าจำไม่ได้ให้ถามคุณครู
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

// ════════════════════════════════════════════════════════════════════════════
// Dashboard — หลังกรอกรหัสแล้ว
// ════════════════════════════════════════════════════════════════════════════
const DashboardView = ({ studentCode, onLogout }: { studentCode: string; onLogout: () => void }) => {
    const [subjectKey, setSubjectKey] = useState('thai');

    const { data: bundle, isLoading } = useQuery({
        queryKey: ['my-mastery', studentCode],
        queryFn: () => curriculumService.myMasteryByCode(studentCode),
    });

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-secondary">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!bundle) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-secondary text-muted-foreground">
                ไม่พบข้อมูล
            </div>
        );
    }

    const { student, stats, mastery } = bundle as MasteryBundle;
    const level = levelFromXp(stats.total_xp);
    const subjectMastery = mastery.filter((m) => m.subject_key === subjectKey);
    const totalIndicators = subjectMastery.length;
    const passedCount = subjectMastery.filter((m) => m.status === 'passed' || m.status === 'mastered').length;

    return (
        <div className="min-h-screen bg-secondary">
            {/* Top bar */}
            <header className="bg-gradient-to-r from-slate-700 to-slate-600 text-white">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-sm hover:opacity-80">
                        <ArrowLeft className="w-4 h-4" /> หน้าแรก
                    </Link>
                    <h1 className="font-bold">การเรียนรู้ของฉัน</h1>
                    <Button variant="ghost" size="sm" onClick={onLogout} className="text-white hover:bg-white/10">
                        <LogOut className="w-4 h-4" />
                    </Button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
                {/* 1. หัวการ์ด — ข้อมูล + เลเวล */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <PersonAvatar name={student.name} photoUrl={student.photo_url} className="w-20 h-20 text-2xl" />
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold">{student.name}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {student.class}{student.room ? `/${student.room}` : ''} • เลเวล {level.level}
                                </p>
                                <div className="mt-2">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-muted-foreground">XP {stats.total_xp.toLocaleString()}</span>
                                        {!level.isMaxLevel && (
                                            <span className="text-muted-foreground">อีก {level.xpToNext} XP อัปเลเวล</span>
                                        )}
                                    </div>
                                    <Progress value={level.progress * 100} className="h-2" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3 sm:flex sm:flex-col">
                                <StatBadge icon={Star} label="เกมที่เล่น" value={stats.games_played} color="text-sky-600" />
                                <StatBadge icon={Award} label="เหรียญ" value={stats.medals_count} color="text-amber-600" />
                                <StatBadge icon={Gamepad2} label="ครั้งที่เล่น" value={stats.plays_count} color="text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. แนะนำเกมสำหรับคุณ (#1) */}
                <section className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-bold">แนะนำเกมสำหรับคุณ</h3>
                    </div>
                    <RecommendedGames studentCode={studentCode} limit={8} />
                </section>

                {/* 2b. แนะนำสื่อสำหรับคุณ */}
                <section className="space-y-3">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-bold">แนะนำสื่อสำหรับคุณ</h3>
                    </div>
                    <RecommendedMedia studentCode={studentCode} limit={8} />
                </section>

                {/* 3. แผนที่ตัวชี้วัดของฉัน */}
                <Card>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <h3 className="text-lg font-bold">แผนที่ตัวชี้วัดของฉัน</h3>
                            <div className="flex items-center gap-3">
                                {totalIndicators > 0 && (
                                    <span className="text-sm text-muted-foreground">
                                        ผ่าน {passedCount}/{totalIndicators}
                                    </span>
                                )}
                                <Select value={subjectKey} onValueChange={setSubjectKey}>
                                    <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {CURRICULUM_SUBJECTS.map((s) => (
                                            <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {subjectMastery.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">
                                ยังไม่มีตัวชี้วัดสำหรับวิชานี้ในระดับชั้นของคุณ
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {groupByStrand(subjectMastery).map(({ strand, rows }) => (
                                    <div key={strand} className="space-y-1.5">
                                        {strand && (
                                            <p className="text-xs font-medium text-muted-foreground pt-2">{strand}</p>
                                        )}
                                        {rows.map((row) => (
                                            <IndicatorRow key={row.indicator_id} row={row} />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

const StatBadge = ({ icon: Icon, label, value, color }: { icon: typeof Star; label: string; value: number; color: string }) => (
    <div className="flex items-center gap-2">
        <Icon className={cn('w-5 h-5', color)} />
        <div>
            <p className="text-lg font-bold leading-none">{value}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
        </div>
    </div>
);

const IndicatorRow = ({ row }: { row: MasteryRow }) => {
    const meta = STATUS_META[row.status];
    return (
        <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-secondary/50">
            <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', meta.dot)} />
            <div className="flex-1 min-w-0">
                <p className="text-sm">{row.description}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[11px] text-muted-foreground">{row.indicator_code}</span>
                    {row.best_score != null && (
                        <span className="text-[11px] text-muted-foreground">• คะแนนสูงสุด {row.best_score}</span>
                    )}
                    {row.assessed_level != null && (
                        <span className="text-[11px] text-muted-foreground">• ครูประเมิน ระดับ {row.assessed_level}</span>
                    )}
                </div>
            </div>
            <Badge variant="secondary" className={cn('shrink-0', meta.cls)}>{meta.label}</Badge>
        </div>
    );
};

const groupByStrand = (rows: MasteryRow[]) => {
    const map = new Map<string, MasteryRow[]>();
    rows.forEach((r) => {
        const key = r.strand_title ?? '';
        const arr = map.get(key) ?? [];
        arr.push(r);
        map.set(key, arr);
    });
    return Array.from(map, ([strand, rs]) => ({ strand, rows: rs }));
};
