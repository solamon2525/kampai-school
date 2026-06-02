import { useEffect, useMemo, useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import 'yet-another-react-lightbox/plugins/captions.css';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { GraduationCap, Clock, Users, Banknote, FileDown, Sparkles } from 'lucide-react';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { HoursGauge } from './HoursGauge';
import { printTranscript } from './TrainingTranscriptPDF';
import { TrainingCharts } from './TrainingCharts';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import type { TrainingRecord } from '@/services/training.service';
import { ViewModeSwitcher } from './views/ViewModeSwitcher';
import { AsymGridView } from './views/AsymGridView';
import { BentoGridView } from './views/BentoGridView';
import { SpotlightView } from './views/SpotlightView';
import { PolaroidWallView } from './views/PolaroidWallView';
import { TimelineHorizontalView } from './views/TimelineHorizontalView';
import { CursorFollower } from './views/CursorFollower';
import { useConfettiOnHover } from './views/useConfettiOnHover';
import type { ViewMode } from './views/types';
import { cn } from '@/lib/utils';

interface Props {
    records: TrainingRecord[];
    loading: boolean;
}

const TRAINING_TYPES = ['อบรม', 'สัมมนา', 'ศึกษาดูงาน', 'ประชุมวิชาการ', 'รางวัล/เกียรติยศ'];
const CURRENT_YEAR_BE = new Date().getFullYear() + 543;
const ALL = '__all__';

const fmtBaht = (n: number) => Number(n).toLocaleString('th-TH');

export function TrainingShowcase({ records, loading }: Props) {
    const { settings } = useSchoolSettings();
    const [filterYear, setFilterYear] = useState<string>(String(CURRENT_YEAR_BE));
    const [filterType, setFilterType] = useState<string>(ALL);
    const [filterStaff, setFilterStaff] = useState<string>(ALL);
    const [lightboxIndex, setLightboxIndex] = useState<number>(-1);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [isDark, setIsDark] = useState<boolean>(
        () => typeof localStorage !== 'undefined' && localStorage.getItem('training-showcase-dark') === '1',
    );
    const [hoveredRecord, setHoveredRecord] = useState<TrainingRecord | null>(null);
    const triggerConfetti = useConfettiOnHover();

    useEffect(() => {
        try { localStorage.setItem('training-showcase-dark', isDark ? '1' : '0'); } catch {/* noop */}
    }, [isDark]);

    // Hover handler — trigger confetti for "featured" records (hours >= 16)
    const handleHover = (r: TrainingRecord | null) => {
        setHoveredRecord(r);
        if (r && Number(r.hours || 0) >= 16) {
            triggerConfetti(r.id);
        }
    };

    // ปีจาก start_date (พ.ศ.) — distinct + sort desc
    const yearOptions = useMemo(() => {
        const years = new Set<number>();
        records.forEach((r) => {
            if (r.start_date) {
                const y = new Date(r.start_date).getFullYear() + 543;
                years.add(y);
            }
        });
        return Array.from(years).sort((a, b) => b - a);
    }, [records]);

    // Staff distinct list สำหรับ filter (เรียงตามชื่อ)
    const staffOptions = useMemo(() => {
        const map = new Map<string, { id: string; name: string; photo_url: string | null; position: string | null }>();
        records.forEach((r) => {
            if (r.staff && r.staff.id && !map.has(r.staff.id)) {
                map.set(r.staff.id, {
                    id: r.staff.id,
                    name: r.staff.name,
                    photo_url: r.staff.photo_url,
                    position: r.staff.position,
                });
            }
        });
        return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'th'));
    }, [records]);

    // Filter passed records (status=ผ่านการอบรม เท่านั้น ใน showcase)
    const filtered = useMemo(() => {
        return records.filter((r) => {
            if (r.status !== 'ผ่านการอบรม') return false;
            if (!r.certificate_url) return false; // ต้องมีรูปเกียรติบัตร
            if (filterYear !== ALL) {
                const y = r.start_date ? new Date(r.start_date).getFullYear() + 543 : 0;
                if (String(y) !== filterYear) return false;
            }
            if (filterType !== ALL && r.training_type !== filterType) return false;
            if (filterStaff !== ALL && r.staff?.id !== filterStaff) return false;
            return true;
        });
    }, [records, filterYear, filterType, filterStaff]);

    // Stats (hero band)
    const stats = useMemo(() => {
        const totalHours = filtered.reduce((s, r) => s + Number(r.hours || 0), 0);
        const totalBudget = filtered.reduce((s, r) => s + Number(r.budget || 0), 0);
        const uniqueStaff = new Set(filtered.map((r) => r.staff?.id).filter(Boolean));
        return {
            totalHours,
            totalCount: filtered.length,
            uniqueStaff: uniqueStaff.size,
            totalBudget,
        };
    }, [filtered]);

    // Aggregates for charts — based on filtered records
    const chartData = useMemo(() => {
        const byYear: Record<string, number> = {};
        const byType: Record<string, number> = {};
        filtered.forEach((r) => {
            if (r.start_date) {
                const y = String(new Date(r.start_date).getFullYear() + 543);
                byYear[y] = (byYear[y] || 0) + 1;
            }
            byType[r.training_type] = (byType[r.training_type] || 0) + 1;
        });
        return { byYear, byType };
    }, [filtered]);

    // Top 10 by hours (within filter scope)
    const top10 = useMemo(() => {
        const acc = new Map<string, { staff: typeof staffOptions[0]; hours: number; records: TrainingRecord[] }>();
        filtered.forEach((r) => {
            if (!r.staff?.id) return;
            if (!acc.has(r.staff.id)) {
                acc.set(r.staff.id, {
                    staff: {
                        id: r.staff.id,
                        name: r.staff.name,
                        photo_url: r.staff.photo_url,
                        position: r.staff.position,
                    },
                    hours: 0,
                    records: [],
                });
            }
            const e = acc.get(r.staff.id)!;
            e.hours += Number(r.hours || 0);
            e.records.push(r);
        });
        return Array.from(acc.values()).sort((a, b) => b.hours - a.hours).slice(0, 10);
    }, [filtered]);

    // Lightbox slides
    const slides = useMemo(() => filtered.map((r) => ({
        src: r.certificate_url!,
        title: r.course_name,
        description: `${r.staff?.name ?? '—'} · ${r.training_type} · ${r.hours} ชม. · ${r.start_date}`,
    })), [filtered]);

    const handleExportPdf = (entry: typeof top10[0]) => {
        // ดึง records ของ staff ทั้งหมด (ไม่ filter year — ออกสรุป lifetime)
        const allMine = records.filter((r) => r.staff?.id === entry.staff.id);
        printTranscript(
            {
                id: entry.staff.id,
                name: entry.staff.name,
                position: entry.staff.position,
                photo_url: entry.staff.photo_url,
            },
            allMine,
            {
                name: settings?.school_name ?? 'โรงเรียน',
                logo_url: settings?.school_logo_url ?? null,
                academic_year: settings?.academic_year ?? String(CURRENT_YEAR_BE),
            },
        );
    };

    return (
        <div className="space-y-6">
            {/* HERO BAND — editorial */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-violet-900 text-white p-6 md:p-10 shadow-xl ring-1 ring-violet-500/20">
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                        backgroundSize: '20px 20px',
                    }}
                />
                <div className="relative">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-violet-300 mb-2">
                        <Sparkles className="w-3.5 h-3.5" /> Faculty Development
                    </div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                        พัฒนาบุคลากร
                    </h1>
                    <p className="text-sm md:text-base text-violet-200/90 mt-1 font-medium">
                        บันทึกการอบรม · {filterYear === ALL ? 'ทุกปี' : `ปีการศึกษา ${filterYear}`}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6 md:mt-8">
                        <KpiBox icon={<Clock className="w-4 h-4" />} label="ชั่วโมงรวม" value={fmtBaht(stats.totalHours)} suffix="ชม." />
                        <KpiBox icon={<GraduationCap className="w-4 h-4" />} label="รายการอบรม" value={fmtBaht(stats.totalCount)} suffix="รายการ" />
                        <KpiBox icon={<Users className="w-4 h-4" />} label="ครูที่อบรม" value={fmtBaht(stats.uniqueStaff)} suffix="คน" />
                        <KpiBox icon={<Banknote className="w-4 h-4" />} label="งบประมาณ" value={`฿${fmtBaht(stats.totalBudget)}`} />
                    </div>
                </div>
            </div>

            {/* Charts */}
            <TrainingCharts byYear={chartData.byYear} byType={chartData.byType} />

            {/* Filter chips */}
            <Card>
                <CardContent className="p-3 flex flex-wrap items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ตัวกรอง</span>
                    <Select value={filterYear} onValueChange={setFilterYear}>
                        <SelectTrigger className="w-36"><SelectValue placeholder="ปี" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>ทุกปี</SelectItem>
                            {yearOptions.map((y) => (
                                <SelectItem key={y} value={String(y)}>ปีการศึกษา {y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-36"><SelectValue placeholder="ประเภท" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>ทุกประเภท</SelectItem>
                            {TRAINING_TYPES.map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filterStaff} onValueChange={setFilterStaff}>
                        <SelectTrigger className="w-48"><SelectValue placeholder="ครู" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>ทุกคน</SelectItem>
                            {staffOptions.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Top 10 hours */}
            {top10.length > 0 && (
                <Card>
                    <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-4 h-4 text-violet-600" />
                            <h2 className="font-bold text-base">Top 10 ครูชั่วโมงอบรมสูงสุด</h2>
                            <span className="text-xs text-muted-foreground">
                                · เป้า ก.ค.ศ. 20 ชม./ปี
                            </span>
                        </div>
                        <div className="space-y-2">
                            {top10.map((entry, idx) => (
                                <div
                                    key={entry.staff.id}
                                    className="flex items-center gap-3 p-2.5 rounded-lg border bg-card hover:bg-muted/40 transition"
                                >
                                    <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0 ${
                                        idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                        idx === 1 ? 'bg-gray-200 text-gray-700' :
                                        idx === 2 ? 'bg-amber-100 text-amber-800' :
                                        'bg-muted text-muted-foreground'
                                    }`}>
                                        {idx + 1}
                                    </div>
                                    <PersonAvatar name={entry.staff.name} photoUrl={entry.staff.photo_url} size="sm" />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate text-sm">{entry.staff.name}</div>
                                        {entry.staff.position && (
                                            <div className="text-[10px] text-muted-foreground truncate">{entry.staff.position}</div>
                                        )}
                                    </div>
                                    <HoursGauge hours={entry.hours} target={20} size="md" />
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleExportPdf(entry)}
                                        className="gap-1.5 hidden sm:flex"
                                    >
                                        <FileDown className="w-3.5 h-3.5" /> PDF
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleExportPdf(entry)}
                                        className="sm:hidden"
                                        aria-label="พิมพ์ PDF"
                                    >
                                        <FileDown className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* View Switcher + Cert Display */}
            <div className={cn(isDark && 'dark')}>
                <div className={cn(isDark && 'dark bg-slate-950 text-slate-100 -mx-4 px-4 py-4 rounded-2xl')}>
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                        <h2 className="font-bold text-lg flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                            เกียรติบัตร ({filtered.length})
                        </h2>
                        <ViewModeSwitcher
                            value={viewMode}
                            onChange={setViewMode}
                            isDark={isDark}
                            onToggleDark={() => setIsDark((v) => !v)}
                        />
                    </div>

                    {loading ? (
                        <div className="text-center py-12 text-sm text-muted-foreground">กำลังโหลด...</div>
                    ) : filtered.length === 0 ? (
                        <Card>
                            <CardContent className="text-center py-12 text-sm text-muted-foreground">
                                ไม่มีเกียรติบัตรในตัวกรองนี้
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {viewMode === 'grid' && (
                                <AsymGridView records={filtered} showStaff onSelect={setLightboxIndex} onHoverRecord={handleHover} />
                            )}
                            {viewMode === 'bento' && (
                                <BentoGridView
                                    records={filtered}
                                    showStaff
                                    onSelect={setLightboxIndex}
                                    onHoverRecord={handleHover}
                                    stats={{ totalHours: stats.totalHours, totalCount: stats.totalCount, uniqueStaff: stats.uniqueStaff }}
                                />
                            )}
                            {viewMode === 'spotlight' && (
                                <SpotlightView records={filtered} showStaff onSelect={setLightboxIndex} onHoverRecord={handleHover} />
                            )}
                            {viewMode === 'polaroid' && (
                                <PolaroidWallView records={filtered} showStaff onSelect={setLightboxIndex} onHoverRecord={handleHover} />
                            )}
                            {viewMode === 'timeline' && (
                                <TimelineHorizontalView records={filtered} showStaff onSelect={setLightboxIndex} onHoverRecord={handleHover} />
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Cursor follower (admin only, lg+) */}
            <CursorFollower record={hoveredRecord} />

            {/* Lightbox */}
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
