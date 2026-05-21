import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import {
    ArrowLeft, User, Trophy, Star, ClipboardCheck, Heart, Home,
    ExternalLink, Utensils, Wallet, FileText, Calendar, Gamepad2,
} from 'lucide-react';
import { student360Service, type Student360Profile } from '@/services/student-360.service';
import { attendanceService, type AttendanceStatus } from '@/services/attendance.service';
import { wasteSummaryService, type WasteStudentSummary } from '@/services/waste-bank.service';
import { savingsSummaryService, type SavingsStudentSummary } from '@/services/savings.service';
import { specialNeedsService, counselingService } from '@/services/academic.service';
import { formatThaiDateFull } from '@/lib/thaiDate';
import { cn } from '@/lib/utils';
import { HomeVisitTab } from './HomeVisitForm';
import { SdqTab } from './SdqForm';
import { MealBudgetTab } from './MealBudgetForm';
import { GeneralDocsTab } from './GeneralDocsTab';
import { GamesSummary } from './GamesSummary';
import { KampaiHeroDashboard } from '../conduct/KampaiHeroDashboard';

type TabKey =
    | 'profile' | 'scores' | 'conduct' | 'attendance' | 'support'
    | 'home_visit' | 'sdq' | 'meal' | 'banks' | 'docs' | 'games';

interface TabDef { key: TabKey; label: string; icon: typeof User }

const TABS: TabDef[] = [
    { key: 'profile',    label: 'โปรไฟล์',     icon: User },
    { key: 'scores',     label: 'คะแนน',       icon: Trophy },
    { key: 'conduct',    label: 'Kampai Hero', icon: Star },
    { key: 'attendance', label: 'เช็คชื่อ',     icon: Calendar },
    { key: 'support',    label: 'ดูแลพิเศษ',   icon: Heart },
    { key: 'home_visit', label: 'เยี่ยมบ้าน',  icon: Home },
    { key: 'sdq',        label: 'SDQ',         icon: ClipboardCheck },
    { key: 'meal',       label: 'อาหาร/นม',    icon: Utensils },
    { key: 'banks',      label: 'ธนาคาร',      icon: Wallet },
    { key: 'games',      label: 'เกมการศึกษา', icon: Gamepad2 },
    { key: 'docs',       label: 'ไฟล์แนบ',     icon: FileText },
];

interface Student360DetailProps {
    studentId: string;
    onBack: () => void;
}

export const Student360Detail = ({ studentId, onBack }: Student360DetailProps) => {
    const [profile, setProfile] = useState<Student360Profile | null>(null);
    const [tab, setTab] = useState<TabKey>('profile');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let canceled = false;
        (async () => {
            setLoading(true);
            const res = await student360Service.getProfile(studentId);
            if (!canceled) {
                setProfile(res.data);
                setLoading(false);
            }
        })();
        return () => { canceled = true; };
    }, [studentId]);

    const fullName = profile
        ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || profile.name
        : '';

    if (loading) {
        return <p className="text-center py-12 text-muted-foreground">กำลังโหลด…</p>;
    }
    if (!profile) {
        return (
            <div className="p-6 text-center">
                <p className="text-sm text-muted-foreground">ไม่พบนักเรียน</p>
                <Button variant="outline" className="mt-3" onClick={onBack}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> กลับ
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start gap-3">
                <Button size="icon" variant="ghost" onClick={onBack}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <PersonAvatar name={fullName} photoUrl={profile.photo_url} size="lg" />
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-primary uppercase">นักเรียน 360°</p>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">{fullName}</h1>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {profile.student_code ? (
                            <Badge variant="outline" className="text-[10px] font-mono">{profile.student_code}</Badge>
                        ) : null}
                        {profile.classroom ? (
                            <Badge variant="secondary" className="text-[10px]">{profile.classroom} เลขที่ {profile.class_number ?? '–'}</Badge>
                        ) : null}
                        {profile.nickname ? <span className="text-xs text-muted-foreground">({profile.nickname})</span> : null}
                    </div>
                </div>
            </div>

            {/* Tab nav */}
            <nav className="flex gap-1 overflow-x-auto border-b border-border pb-px -mx-2 px-2">
                {TABS.map((t) => {
                    const Icon = t.icon;
                    const active = t.key === tab;
                    return (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap',
                                'border-b-2 transition',
                                active
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <Icon className="w-3.5 h-3.5" /> {t.label}
                        </button>
                    );
                })}
            </nav>

            {/* Tab content */}
            <div className="pt-2">
                {tab === 'profile' && <ProfileTab profile={profile} />}
                {tab === 'scores' && <ExternalLinkTab path="/admin/dashboard/scores" label="คะแนนเก็บ" hint="ระบบเก็บคะแนนรายวิชา — ไปจัดการที่หน้า ScoresManagement" />}
                {tab === 'conduct' && <KampaiHeroDashboard studentId={studentId} />}
                {tab === 'attendance' && <AttendanceSummary studentId={studentId} />}
                {tab === 'support' && <SupportSummary studentId={studentId} />}
                {tab === 'home_visit' && <HomeVisitTab studentId={studentId} />}
                {tab === 'sdq' && <SdqTab studentId={studentId} />}
                {tab === 'meal' && <MealBudgetTab studentId={studentId} />}
                {tab === 'banks' && <BanksSummary studentId={studentId} />}
                {tab === 'games' && <GamesSummary studentId={studentId} />}
                {tab === 'docs' && <GeneralDocsTab studentId={studentId} />}
            </div>
        </div>
    );
};

const ProfileTab = ({ profile }: { profile: Student360Profile }) => {
    const navigate = useNavigate();
    const rows: { label: string; value: string | null }[] = [
        { label: 'รหัสนักเรียน', value: profile.student_code },
        { label: 'ชื่อ-สกุล', value: `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || profile.name },
        { label: 'ชื่อเล่น', value: profile.nickname },
        { label: 'เพศ', value: profile.gender },
        { label: 'วันเกิด', value: profile.birth_date ? formatThaiDateFull(profile.birth_date) : null },
        { label: 'เลขประจำตัวประชาชน', value: profile.national_id },
        { label: 'หมู่เลือด', value: profile.blood_type },
        { label: 'ศาสนา', value: profile.religion },
        { label: 'ห้อง', value: profile.classroom },
        { label: 'เลขที่', value: profile.class_number ? String(profile.class_number) : null },
        { label: 'บิดา', value: profile.father_name },
        { label: 'มารดา', value: profile.mother_name },
        { label: 'ผู้ปกครอง', value: profile.guardian_name },
        { label: 'โทร ผู้ปกครอง', value: profile.parent_phone },
        { label: 'ที่อยู่ปัจจุบัน', value: profile.current_address },
    ];

    return (
        <Card>
            <CardContent className="p-4 space-y-3">
                <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => navigate('/admin/dashboard/students')}>
                        <ExternalLink className="w-3.5 h-3.5 mr-1" /> แก้ที่ StudentsManagement
                    </Button>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    {rows.filter((r) => r.value).map((r) => (
                        <div key={r.label} className="flex items-baseline gap-2 border-b border-border py-1.5">
                            <dt className="text-xs text-muted-foreground w-32 flex-shrink-0">{r.label}</dt>
                            <dd className="font-medium text-foreground">{r.value}</dd>
                        </div>
                    ))}
                </dl>
                <p className="text-[11px] text-muted-foreground pt-2 border-t border-border">
                    ข้อมูลนี้ดึงจากตาราง <code className="text-primary">students</code> (source of truth) — แก้ไขจะ sync ทุกที่
                </p>
            </CardContent>
        </Card>
    );
};

const ExternalLinkTab = ({ path, label, hint }: { path: string; label: string; hint: string }) => {
    const navigate = useNavigate();
    return (
        <Card>
            <CardContent className="p-6 text-center space-y-3">
                <p className="text-sm text-muted-foreground">{hint}</p>
                <Button onClick={() => navigate(path)}>
                    <ExternalLink className="w-4 h-4 mr-1" /> เปิด {label}
                </Button>
            </CardContent>
        </Card>
    );
};

const AttendanceSummary = ({ studentId }: { studentId: string }) => {
    const [summary, setSummary] = useState<{ present: number; absent: number; late: number; leave: number; total: number } | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        let canceled = false;
        (async () => {
            const today = new Date();
            const yearAgo = new Date();
            yearAgo.setFullYear(today.getFullYear() - 1);
            const startISO = yearAgo.toISOString().slice(0, 10);
            const endISO = today.toISOString().slice(0, 10);

            const { data } = await attendanceService.getByStudentDateRange(studentId, startISO, endISO);
            const rows = (data ?? []) as { status: AttendanceStatus }[];
            const s = { present: 0, absent: 0, late: 0, leave: 0, total: rows.length };
            for (const r of rows) {
                if (r.status === 'present') s.present++;
                else if (r.status === 'absent') s.absent++;
                else if (r.status === 'late') s.late++;
                else if (r.status === 'leave') s.leave++;
            }
            if (!canceled) setSummary(s);
        })();
        return () => { canceled = true; };
    }, [studentId]);

    if (!summary) return <p className="text-center py-4 text-sm text-muted-foreground">กำลังโหลด…</p>;
    const pct = summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0;

    return (
        <Card>
            <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-5 gap-2">
                    <SummaryTile label="ทั้งหมด" value={summary.total} tone="muted" />
                    <SummaryTile label="มา" value={summary.present} tone="success" />
                    <SummaryTile label="สาย" value={summary.late} tone="warning" />
                    <SummaryTile label="ขาด" value={summary.absent} tone="danger" />
                    <SummaryTile label="ลา" value={summary.leave} tone="info" />
                </div>
                <p className="text-sm text-center">
                    เปอร์เซ็นต์การมาเรียน (12 เดือนล่าสุด) <span className="text-2xl font-bold text-primary">{pct}%</span>
                </p>
                <div className="flex justify-center">
                    <Button variant="outline" size="sm" onClick={() => navigate('/admin/dashboard/attendance')}>
                        <ExternalLink className="w-3.5 h-3.5 mr-1" /> บันทึกการเช็คชื่อ
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

const SupportSummary = ({ studentId }: { studentId: string }) => {
    const [specialCount, setSpecialCount] = useState<number>(0);
    const [counselingCount, setCounselingCount] = useState<number>(0);
    const navigate = useNavigate();

    useEffect(() => {
        let canceled = false;
        (async () => {
            const [sn, cr] = await Promise.all([
                specialNeedsService.countByStudent(studentId),
                counselingService.countByStudent(studentId),
            ]);
            if (!canceled) {
                setSpecialCount(sn.count ?? 0);
                setCounselingCount(cr.count ?? 0);
            }
        })();
        return () => { canceled = true; };
    }, [studentId]);

    return (
        <Card>
            <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <SummaryTile label="แผนการดูแลพิเศษ" value={specialCount} tone="primary" />
                    <SummaryTile label="บันทึกให้คำปรึกษา" value={counselingCount} tone="info" />
                </div>
                <div className="flex justify-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => navigate('/admin/dashboard/academic')}>
                        <ExternalLink className="w-3.5 h-3.5 mr-1" /> ฝ่ายวิชาการ (special needs / counseling)
                    </Button>
                </div>
                <p className="text-[11px] text-muted-foreground text-center">
                    ข้อมูลจาก <code>student_special_needs</code> + <code>counseling_records</code>
                </p>
            </CardContent>
        </Card>
    );
};

const BanksSummary = ({ studentId }: { studentId: string }) => {
    const [waste, setWaste] = useState<WasteStudentSummary | null>(null);
    const [savings, setSavings] = useState<SavingsStudentSummary | null>(null);
    const [loaded, setLoaded] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        let canceled = false;
        (async () => {
            const [w, s] = await Promise.all([
                wasteSummaryService.getForStudent(studentId),
                savingsSummaryService.getForStudent(studentId),
            ]);
            if (!canceled) {
                setWaste((w.data as WasteStudentSummary | null) ?? null);
                setSavings((s.data as SavingsStudentSummary | null) ?? null);
                setLoaded(true);
            }
        })();
        return () => { canceled = true; };
    }, [studentId]);

    const fmt = (n: number | null | undefined) =>
        new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(Number(n ?? 0));

    if (!loaded) return <p className="text-center py-4 text-sm text-muted-foreground">กำลังโหลด…</p>;

    return (
        <Card>
            <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <SummaryTile
                        label="ขยะ (รายการ)"
                        value={fmt(waste?.total_transactions)}
                        tone="primary"
                        hint={`สะสม ${fmt(waste?.total_points_earned)} คะแนน · คงเหลือ ${fmt(waste?.available_points)}`}
                    />
                    <SummaryTile
                        label="ออมทรัพย์ (ครั้ง)"
                        value={fmt(savings?.total_transactions)}
                        tone="success"
                        hint={`ฝาก ${fmt(savings?.deposit_count)} · ถอน ${fmt(savings?.withdraw_count)} · คงเหลือ ${fmt(savings?.current_balance)} บาท`}
                    />
                </div>
                <div className="flex justify-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => navigate('/admin/dashboard/waste-bank')}>
                        <ExternalLink className="w-3.5 h-3.5 mr-1" /> ธนาคารขยะ
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate('/admin/dashboard/savings-bank')}>
                        <ExternalLink className="w-3.5 h-3.5 mr-1" /> ธนาคารพอเพียง
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

const SummaryTile = ({ label, value, tone, hint }: {
    label: string; value: number | string; tone: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted'; hint?: string;
}) => {
    const cls = {
        primary: 'bg-primary/10 text-primary',
        success: 'bg-emerald-500/10 text-emerald-600',
        warning: 'bg-amber-500/10 text-amber-600',
        danger:  'bg-destructive/10 text-destructive',
        info:    'bg-sky-500/10 text-sky-600',
        muted:   'bg-muted text-muted-foreground',
    }[tone];
    return (
        <div className={cn('rounded-md p-3 text-center', cls)}>
            <p className="text-[11px] opacity-80">{label}</p>
            <p className="text-2xl font-bold leading-none mt-1">{value}</p>
            {hint ? <p className="text-[10px] mt-1 opacity-80">{hint}</p> : null}
        </div>
    );
};
