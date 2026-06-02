import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import 'yet-another-react-lightbox/plugins/captions.css';
import { ArrowLeft, Award, Clock, GraduationCap, BookOpenCheck, Phone, Mail, Sparkles } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
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
import { staffService } from '@/services/staff.service';
import {
    trainingPublicService,
    type TrainingPerStaffRow,
    type TrainingRecord,
} from '@/services/training.service';
import { formatThaiDateMedium } from '@/lib/thaiDate';
import { cn } from '@/lib/utils';

interface ExtraInfoItem { label: string; value: string }

interface StaffPublic {
    id: string;
    name: string;
    position: string;
    department: string | null;
    subject: string | null;
    photo_url: string | null;
    email: string | null;
    phone: string | null;
    staff_type: string;
    academic_rank: string | null;
    degree: string | null;
    major: string | null;
    education: string | null;
    experience: string | null;
    extra_info: ExtraInfoItem[] | null;
}

const fmtNum = (n: number) => Number(n).toLocaleString('th-TH');

/** Adapter: TrainingPerStaffRow → TrainingRecord (staff=null since hero attributes the page) */
const toRecord = (r: TrainingPerStaffRow): TrainingRecord => ({
    id: r.id,
    staff_id: r.staff_id,
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

export default function StaffDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [staff, setStaff] = useState<StaffPublic | null>(null);
    const [records, setRecords] = useState<TrainingPerStaffRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [lightboxIndex, setLightboxIndex] = useState<number>(-1);
    const [viewMode, setViewMode] = useState<ViewMode>('spotlight');
    const { settings } = useSchoolSettings();
    const userTouchedView = useRef(false);

    // วิวเริ่มต้นที่แอดมินตั้งไว้ (soft-lock) — ใช้จนกว่าผู้ใช้จะกดสลับเอง
    useEffect(() => {
        const v = settings.cert_default_view;
        if (!userTouchedView.current && v && v !== 'auto') setViewMode(v as ViewMode);
    }, [settings.cert_default_view]);

    useEffect(() => {
        if (!id) return;
        let cancel = false;
        (async () => {
            setLoading(true);
            // Step 1: resolve identifier (UUID or username) → staff record
            const s = await staffService.getByIdentifier(id);
            if (cancel) return;
            if (!s.data) {
                setStaff(null);
                setRecords([]);
                setLoading(false);
                return;
            }
            const resolved = s.data as unknown as StaffPublic;
            setStaff(resolved);
            // Step 2: fetch training using resolved staff.id (always UUID)
            const t = await trainingPublicService.getByStaff(resolved.id);
            if (cancel) return;
            if (t.data) setRecords(t.data as unknown as TrainingPerStaffRow[]);
            setLoading(false);
        })();
        return () => { cancel = true; };
    }, [id]);

    const stats = useMemo(() => {
        const totalHours = records.reduce((sum, r) => sum + (Number(r.hours) || 0), 0);
        const uniqueTypes = new Set(records.map((r) => r.training_type)).size;
        return { totalHours, totalCount: records.length, uniqueTypes };
    }, [records]);

    const adapted = useMemo(() => records.map(toRecord), [records]);

    const slides = useMemo(
        () => records.map((r) => ({
            src: r.certificate_url,
            title: r.course_name,
            description: `${r.training_type} · ${r.hours} ชม. · ${formatThaiDateMedium(r.start_date)}${r.provider ? ` · โดย ${r.provider}` : ''}`,
        })),
        [records],
    );

    const extras = Array.isArray(staff?.extra_info)
        ? staff.extra_info.filter((it) => it && (it.label || it.value))
        : [];

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <SEOHead
                title={staff ? `${staff.name} | บุคลากร — โรงเรียนคำไผ่` : 'บุคลากร'}
                description={staff ? `ประวัติและเกียรติบัตรการอบรมของ ${staff.name}` : ''}
            />
            <SiteHeader />

            <div className="max-w-7xl mx-auto w-full flex-grow flex flex-col px-4 py-3 md:py-5">
                {/* Back link */}
                <Link
                    to="/staff"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 w-fit"
                >
                    <ArrowLeft className="w-4 h-4" />
                    ทั้งหมด
                </Link>

                {loading ? (
                    <div className="text-center py-24 text-sm text-muted-foreground">กำลังโหลด...</div>
                ) : !staff ? (
                    <div className="text-center py-24">
                        <p className="text-lg text-muted-foreground mb-3">ไม่พบบุคลากร</p>
                        <Link to="/staff" className="text-sm underline">กลับไปยังรายชื่อทั้งหมด</Link>
                    </div>
                ) : (
                    <>
                        {/* HERO */}
                        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-violet-950 text-white px-5 md:px-8 py-4 md:py-5 mb-3">
                            <div
                                className="absolute inset-0 opacity-[0.05] pointer-events-none"
                                style={{
                                    backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                                    backgroundSize: '24px 24px',
                                }}
                            />
                            <div className="relative flex flex-col md:flex-row items-center md:items-start gap-3 md:gap-5">
                                <PersonAvatar
                                    name={staff.name}
                                    photoUrl={staff.photo_url}
                                    size="lg"
                                    className="h-20 w-20 md:h-24 md:w-24 text-2xl md:text-3xl ring-4 ring-amber-400/60 shadow-2xl shrink-0"
                                />
                                <div className="flex-1 min-w-0 text-center md:text-left">
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300 mb-1 justify-center md:justify-start">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        {staff.staff_type === 'teaching' ? 'ครูผู้สอน' : 'บุคลากรสนับสนุน'}
                                    </div>
                                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
                                        {staff.name}
                                    </h1>
                                    <p className="text-sm md:text-base text-violet-200/90 mt-1 font-medium">
                                        {staff.position}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start">
                                        {staff.subject && (
                                            <Badge variant="secondary" className="bg-white/10 text-amber-100 border-amber-400/30 hover:bg-white/15">
                                                {staff.subject}
                                            </Badge>
                                        )}
                                        {staff.department && (
                                            <Badge variant="secondary" className="bg-white/10 text-violet-100 border-violet-400/30 hover:bg-white/15">
                                                {staff.department}
                                            </Badge>
                                        )}
                                        {staff.academic_rank && (
                                            <Badge variant="secondary" className="bg-white/10 text-emerald-100 border-emerald-400/30 hover:bg-white/15">
                                                {staff.academic_rank}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Contact */}
                                    {(staff.phone || staff.email) && (
                                        <div className="flex flex-wrap gap-2 mt-2.5 justify-center md:justify-start">
                                            {staff.phone && (
                                                <a
                                                    href={`tel:${staff.phone}`}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400/90 hover:bg-amber-400 text-slate-900 text-xs font-semibold transition-colors"
                                                >
                                                    <Phone className="w-3.5 h-3.5" /> {staff.phone}
                                                </a>
                                            )}
                                            {staff.email && (
                                                <a
                                                    href={`mailto:${staff.email}`}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
                                                >
                                                    <Mail className="w-3.5 h-3.5" /> อีเมล
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* PROFILE INFO */}
                        {(staff.degree || staff.major || staff.education || staff.experience || extras.length > 0) && (
                            <Card className="mb-3">
                                <CardContent className="px-4 py-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2">
                                    {(staff.degree || staff.major) && (
                                        <ProfileRow label="วุฒิ / วิชาเอก" value={[staff.degree, staff.major].filter(Boolean).join(' · ')} />
                                    )}
                                    {staff.education && <ProfileRow label="การศึกษา" value={staff.education} />}
                                    {staff.experience && <ProfileRow label="ประสบการณ์" value={staff.experience} />}
                                    {extras.map((it, i) => (
                                        <ProfileRow key={i} label={it.label || '—'} value={it.value || '—'} />
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* STATS */}
                        <div className="grid grid-cols-3 gap-3 mb-3">
                            <StatTile
                                icon={<Award className="w-4 h-4" />}
                                label="เกียรติบัตร"
                                value={fmtNum(stats.totalCount)}
                                suffix="ใบ"
                                accent="from-amber-50 to-amber-100 border-amber-200 text-amber-900"
                            />
                            <StatTile
                                icon={<Clock className="w-4 h-4" />}
                                label="ชั่วโมงรวม"
                                value={fmtNum(stats.totalHours)}
                                suffix="ชม."
                                accent="from-violet-50 to-violet-100 border-violet-200 text-violet-900"
                            />
                            <StatTile
                                icon={<BookOpenCheck className="w-4 h-4" />}
                                label="ประเภท"
                                value={fmtNum(stats.uniqueTypes)}
                                suffix="ประเภท"
                                accent="from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-900"
                            />
                        </div>

                        {/* CERTIFICATE SHOWCASE */}
                        <section>
                            <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                                <h2 className="font-bold text-lg md:text-xl flex items-center gap-2">
                                    <GraduationCap className="w-5 h-5 text-violet-600" />
                                    เกียรติบัตรการอบรม
                                </h2>
                                {records.length > 0 && (
                                    <ViewModeSwitcher
                                        value={viewMode}
                                        onChange={(v) => { userTouchedView.current = true; setViewMode(v); }}
                                    />
                                )}
                            </div>

                            {records.length === 0 ? (
                                <Card>
                                    <CardContent className="text-center py-12 text-sm text-muted-foreground">
                                        <Award className="w-10 h-10 mx-auto mb-2 opacity-40" />
                                        ยังไม่มีเกียรติบัตรที่เผยแพร่
                                    </CardContent>
                                </Card>
                            ) : (() => {
                                const onSelect = setLightboxIndex;
                                const aggStats = { totalHours: stats.totalHours, totalCount: stats.totalCount, uniqueStaff: 1 };
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
                        </section>
                    </>
                )}
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

function ProfileRow({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">{label}</p>
            <p className="text-sm text-foreground leading-relaxed">{value}</p>
        </div>
    );
}

function StatTile({
    icon, label, value, suffix, accent,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    suffix?: string;
    accent: string;
}) {
    return (
        <div className={cn(
            'rounded-xl border bg-gradient-to-br px-3 py-2',
            accent,
        )}>
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold opacity-80 mb-0.5">
                {icon}
                <span>{label}</span>
            </div>
            <div className="font-extrabold text-lg md:text-xl tabular-nums leading-none">
                {value}
            </div>
            {suffix && (
                <div className="text-[10px] opacity-70 mt-1 font-medium">{suffix}</div>
            )}
        </div>
    );
}
