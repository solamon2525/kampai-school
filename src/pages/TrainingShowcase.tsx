import { useEffect, useMemo, useRef, useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import 'yet-another-react-lightbox/plugins/captions.css';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    GraduationCap, Clock, Users, Banknote, Sparkles, Award,
} from 'lucide-react';
import { trainingPublicService, type TrainingPublicRow, type TrainingPublicAggregate, type TrainingRecord } from '@/services/training.service';
import { TrainingCharts } from '@/components/admin/hr/TrainingCharts';
import { formatThaiDateMedium } from '@/lib/thaiDate';
import { cn } from '@/lib/utils';
import { ViewModeSwitcher } from '@/components/admin/hr/views/ViewModeSwitcher';
import { AsymGridView } from '@/components/admin/hr/views/AsymGridView';
import { BentoGridView } from '@/components/admin/hr/views/BentoGridView';
import { SpotlightView } from '@/components/admin/hr/views/SpotlightView';
import { PolaroidWallView } from '@/components/admin/hr/views/PolaroidWallView';
import { TimelineHorizontalView } from '@/components/admin/hr/views/TimelineHorizontalView';
import { ListView } from '@/components/admin/hr/views/ListView';
import { MasonryView } from '@/components/admin/hr/views/MasonryView';
import { VerticalTimelineView } from '@/components/admin/hr/views/VerticalTimelineView';
import { CoverflowView } from '@/components/admin/hr/views/CoverflowView';
import type { ViewMode } from '@/components/admin/hr/views/types';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';

const TRAINING_TYPES = ['อบรม', 'สัมมนา', 'ศึกษาดูงาน', 'ประชุมวิชาการ', 'รางวัล/เกียรติยศ'];
const ALL = '__all__';

const fmtNum = (n: number) => Number(n).toLocaleString('th-TH');


const TYPE_RING: Record<string, string> = {
    'อบรม': 'border-violet-300',
    'สัมมนา': 'border-blue-300',
    'ศึกษาดูงาน': 'border-emerald-300',
    'ประชุมวิชาการ': 'border-amber-300',
    'รางวัล/เกียรติยศ': 'border-rose-300',
};

/** Adapter: TrainingPublicRow → TrainingRecord shape (staff=null for anonymized) */
const toRecord = (r: TrainingPublicRow): TrainingRecord => ({
    id: r.id,
    staff_id: null,
    course_name: r.course_name,
    provider: r.provider,
    training_type: r.training_type,
    start_date: r.start_date,
    end_date: r.end_date,
    hours: r.hours,
    location: null,
    budget: 0,
    certificate_url: r.certificate_url,
    status: 'ผ่านการอบรม',
    notes: null,
    created_at: r.created_at,
    staff: null,
});

export default function TrainingShowcasePublic() {
    const [certs, setCerts] = useState<TrainingPublicRow[]>([]);
    const [aggregate, setAggregate] = useState<TrainingPublicAggregate | null>(null);
    const [loading, setLoading] = useState(true);
    const [filterYear, setFilterYear] = useState<string>(ALL);
    const [filterType, setFilterType] = useState<string>(ALL);
    const [lightboxIndex, setLightboxIndex] = useState<number>(-1);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const { settings } = useSchoolSettings();
    const userTouchedView = useRef(false);
    const [isDark, setIsDark] = useState<boolean>(
        () => typeof localStorage !== 'undefined' && localStorage.getItem('training-showcase-dark') === '1',
    );

    useEffect(() => {
        try { localStorage.setItem('training-showcase-dark', isDark ? '1' : '0'); } catch {/* noop */}
    }, [isDark]);

    // วิวเริ่มต้นที่แอดมินตั้งไว้ (soft-lock) — ใช้เป็นค่าเริ่มต้นจนกว่าผู้ใช้จะกดสลับเอง
    useEffect(() => {
        const v = settings.cert_default_view;
        if (!userTouchedView.current && v && v !== 'auto') setViewMode(v as ViewMode);
    }, [settings.cert_default_view]);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const [c, a] = await Promise.all([
                trainingPublicService.getCerts(),
                trainingPublicService.getAggregate(),
            ]);
            if (c.data) setCerts(c.data as unknown as TrainingPublicRow[]);
            if (a.data) setAggregate(a.data);
            setLoading(false);
        })();
    }, []);

    const yearOptions = useMemo(() => {
        const years = new Set<number>();
        certs.forEach((r) => years.add(r.academic_year_be));
        return Array.from(years).sort((a, b) => b - a);
    }, [certs]);

    const filtered = useMemo(() => {
        return certs.filter((r) => {
            if (filterYear !== ALL && String(r.academic_year_be) !== filterYear) return false;
            if (filterType !== ALL && r.training_type !== filterType) return false;
            return true;
        });
    }, [certs, filterYear, filterType]);

    const slides = useMemo(() => filtered.map((r) => ({
        src: r.certificate_url,
        title: r.course_name,
        description: `${r.training_type} · ${r.hours} ชม. · ปี ${r.academic_year_be}${r.provider ? ` · โดย ${r.provider}` : ''}`,
    })), [filtered]);

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <SEOHead
                title="พัฒนาบุคลากร — โรงเรียนคำไผ่"
                description="สรุปการอบรม สัมมนา และศึกษาดูงานของบุคลากรโรงเรียนคำไผ่"
            />
            <SiteHeader />
            <div className="max-w-7xl mx-auto w-full bg-background flex-grow flex flex-col">
                {/* HERO BAND */}
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-violet-900 text-white py-10 md:py-14 px-4 md:px-8">
                    <div
                        className="absolute inset-0 opacity-[0.04]"
                        style={{
                            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                            backgroundSize: '20px 20px',
                        }}
                    />
                    <div className="relative max-w-5xl mx-auto">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-violet-300 mb-2">
                            <Sparkles className="w-3.5 h-3.5" /> Faculty Development
                        </div>
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                            พัฒนาบุคลากร
                        </h1>
                        <p className="text-sm md:text-base text-violet-200/90 mt-2 font-medium max-w-2xl">
                            ภาพรวมการอบรม สัมมนา และศึกษาดูงานของบุคลากร — เพื่อความโปร่งใสและความเชื่อมั่นต่อชุมชน
                        </p>

                        {aggregate && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-7 md:mt-10">
                                <KpiBox icon={<Clock className="w-4 h-4" />} label="ชั่วโมงรวม" value={fmtNum(aggregate.total_hours)} suffix="ชม." />
                                <KpiBox icon={<GraduationCap className="w-4 h-4" />} label="รายการอบรม" value={fmtNum(aggregate.total_count)} suffix="รายการ" />
                                <KpiBox icon={<Users className="w-4 h-4" />} label="บุคลากร" value={fmtNum(aggregate.total_staff)} suffix="คน" />
                                <KpiBox icon={<Banknote className="w-4 h-4" />} label="งบประมาณรวม" value={`฿${fmtNum(aggregate.total_budget)}`} />
                            </div>
                        )}

                        {/* Breakdown by type */}
                        {aggregate?.by_type && Object.keys(aggregate.by_type).length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-6">
                                {Object.entries(aggregate.by_type).map(([t, c]) => (
                                    <Badge key={t} variant="secondary" className="bg-white/10 text-violet-100 border-violet-400/30 hover:bg-white/15">
                                        {t}: {c} รายการ
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Filter + Grid */}
                <div className="px-4 md:px-8 py-6 md:py-10 space-y-6">
                    {aggregate && (
                        <TrainingCharts byYear={aggregate.by_year} byType={aggregate.by_type} />
                    )}

                    <Card>
                        <CardContent className="p-3 flex flex-wrap items-center gap-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ตัวกรอง</span>
                            <Select value={filterYear} onValueChange={setFilterYear}>
                                <SelectTrigger className="w-40"><SelectValue placeholder="ปี" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ALL}>ทุกปี</SelectItem>
                                    {yearOptions.map((y) => (
                                        <SelectItem key={y} value={String(y)}>ปีการศึกษา {y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger className="w-40"><SelectValue placeholder="ประเภท" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ALL}>ทุกประเภท</SelectItem>
                                    {TRAINING_TYPES.map((t) => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <span className="text-xs text-muted-foreground ml-auto">
                                {filtered.length} เกียรติบัตร
                            </span>
                        </CardContent>
                    </Card>

                    <div className={cn(isDark && 'dark bg-slate-950 text-slate-100 -mx-2 px-2 py-4 rounded-2xl')}>
                        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                            <h2 className="font-bold text-lg md:text-xl flex items-center gap-2">
                                <Award className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                                เกียรติบัตร
                            </h2>
                            <ViewModeSwitcher
                                value={viewMode}
                                onChange={(v) => { userTouchedView.current = true; setViewMode(v); }}
                                isDark={isDark}
                                onToggleDark={() => setIsDark((v) => !v)}
                            />
                        </div>
                        {loading ? (
                            <div className="text-center py-12 text-sm text-muted-foreground">กำลังโหลด...</div>
                        ) : filtered.length === 0 ? (
                            <Card>
                                <CardContent className="text-center py-12 text-sm text-muted-foreground">
                                    ยังไม่มีข้อมูลในตัวกรองนี้
                                </CardContent>
                            </Card>
                        ) : (() => {
                            const adapted = filtered.map(toRecord);
                            const aggStats = {
                                totalHours: aggregate?.total_hours ?? 0,
                                totalCount: aggregate?.total_count ?? 0,
                                uniqueStaff: aggregate?.total_staff ?? 0,
                            };
                            const onSelect = setLightboxIndex;
                            switch (viewMode) {
                                case 'bento':
                                    return <BentoGridView records={adapted} showStaff={false} onSelect={onSelect} stats={aggStats} />;
                                case 'masonry':
                                    return <MasonryView records={adapted} showStaff={false} onSelect={onSelect} />;
                                case 'list':
                                    return <ListView records={adapted} showStaff={false} onSelect={onSelect} />;
                                case 'spotlight':
                                    return <SpotlightView records={adapted} showStaff={false} onSelect={onSelect} />;
                                case 'coverflow':
                                    return <CoverflowView records={adapted} showStaff={false} onSelect={onSelect} />;
                                case 'polaroid':
                                    return <PolaroidWallView records={adapted} showStaff={false} onSelect={onSelect} />;
                                case 'timeline':
                                    return <TimelineHorizontalView records={adapted} showStaff={false} onSelect={onSelect} />;
                                case 'vtimeline':
                                    return <VerticalTimelineView records={adapted} showStaff={false} onSelect={onSelect} />;
                                default:
                                    return <AsymGridView records={adapted} showStaff={false} onSelect={onSelect} />;
                            }
                        })()}
                        <p className="text-[10px] text-muted-foreground/80 text-center mt-6 italic">
                            * เพื่อความเป็นส่วนตัวของบุคลากร หน้านี้ไม่แสดงข้อมูลส่วนตัวรายบุคคล
                        </p>
                    </div>
                </div>
            </div>
            <Footer />

            <Lightbox
                open={lightboxIndex >= 0}
                close={() => setLightboxIndex(-1)}
                index={lightboxIndex < 0 ? 0 : lightboxIndex}
                slides={slides}
                plugins={[Zoom, Captions]}
                zoom={{ maxZoomPixelRatio: 4, scrollToZoom: true }}
                captions={{ descriptionTextAlign: 'center' }}
            />
        </div>
    );
}

function KpiBox({ icon, label, value, suffix }: { icon: React.ReactNode; label: string; value: string; suffix?: string }) {
    return (
        <div className="rounded-xl bg-white/5 border border-white/10 backdrop-blur p-3 md:p-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-violet-200/80 font-semibold mb-1">
                {icon}
                <span>{label}</span>
            </div>
            <div className="font-extrabold text-2xl md:text-3xl tabular-nums text-white leading-none">
                {value}
            </div>
            {suffix && (
                <div className="text-[10px] text-violet-200/70 mt-1 font-medium">{suffix}</div>
            )}
        </div>
    );
}
