import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    BookOpen,
    Search,
    FileText,
    ExternalLink,
    Eye,
    Layers,
    Sparkles,
    CheckCircle2,
    BookCheck,
    Languages,
    Calculator,
    BookA,
    Compass,
} from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import {
    mediaCatalogService,
    type PublicMediaItem,
} from '@/services/educational-hub.service';
import { guessPairedUrls } from '@/lib/edu-hub-worksheet-pairs';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface SubjectTabOption {
    id: string;
    label: string;
    icon: typeof BookOpen;
    isCore?: boolean;
    colorClass: string;
}

const SUBJECT_TABS: SubjectTabOption[] = [
    { id: 'all', label: 'ทั้งหมด', icon: Layers, colorClass: 'text-primary' },
    { id: 'ภาษาอังกฤษ', label: 'ภาษาอังกฤษ', icon: Languages, isCore: true, colorClass: 'text-blue-600' },
    { id: 'คณิตศาสตร์', label: 'คณิตศาสตร์', icon: Calculator, isCore: true, colorClass: 'text-amber-600' },
    { id: 'ภาษาไทย', label: 'ภาษาไทย', icon: BookA, isCore: true, colorClass: 'text-emerald-600' },
    { id: 'วิทยาศาสตร์', label: 'วิทยาศาสตร์', icon: Compass, colorClass: 'text-teal-600' },
    { id: 'สังคมศึกษา', label: 'สังคมศึกษา', icon: BookCheck, colorClass: 'text-orange-600' },
    { id: 'เทคโนโลยี', label: 'วิทยาการคำนวณ', icon: Sparkles, colorClass: 'text-purple-600' },
];

const GRADE_LEVELS = ['all', 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];

export default function MediaExplorer() {
    const [selectedSubject, setSelectedSubject] = useState<string>('all');
    const [selectedGrade, setSelectedGrade] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const { data: mediaItems = [], isLoading, isError } = useQuery({
        queryKey: ['public-media-catalog', selectedSubject],
        queryFn: () => mediaCatalogService.getCuratedCatalog(selectedSubject),
        staleTime: 1000 * 60 * 5, // 5 mins
    });

    const filteredItems = useMemo(() => {
        let items = mediaItems;

        // Grade filter
        if (selectedGrade !== 'all') {
            items = items.filter((item) =>
                item.grade_levels && item.grade_levels.some((g) => g.includes(selectedGrade))
            );
        }

        // Search query
        const q = searchQuery.trim().toLowerCase();
        if (q) {
            items = items.filter(
                (item) =>
                    item.title.toLowerCase().includes(q) ||
                    (item.description && item.description.toLowerCase().includes(q)) ||
                    (item.subject && item.subject.toLowerCase().includes(q)) ||
                    (item.external_url && item.external_url.toLowerCase().includes(q))
            );
        }

        return items;
    }, [mediaItems, selectedGrade, searchQuery]);

    // Statistics counts
    const coreCount = useMemo(() => {
        return mediaItems.filter((i) =>
            i.subject === 'ภาษาอังกฤษ' || i.subject === 'คณิตศาสตร์' || i.subject === 'ภาษาไทย'
        ).length;
    }, [mediaItems]);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <SEOHead
                title="คลังสื่อการสอนออนไลน์ — โรงเรียนบ้านคำไผ่"
                description="ศูนย์รวมสื่อการสอนอินเตอร์แอ็กทีฟแบบบูรณาการ เน้น 3 สาระวิชาหลัก ภาษาอังกฤษ คณิตศาสตร์ และภาษาไทย พร้อมใบงานพิมพ์ A4 คู่ขนาน"
            />
            <SiteHeader />

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
                {/* Hero / Header Section */}
                <div className="relative overflow-hidden rounded-3xl bg-card border border-border p-6 sm:p-10 mb-8 shadow-sm">
                    <div className="relative z-10 max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-semibold mb-4">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span>คลังสื่อการเรียนรู้ยุคใหม่ · ใช้งานได้ฟรี ทุกอุปกรณ์</span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3 text-foreground">
                            คลังสื่อการสอนออนไลน์ <span className="text-primary">(Interactive Media)</span>
                        </h1>
                        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6">
                            ยกระดับการเรียนรู้ในชั้นเรียนด้วยสื่อการสอนอินเตอร์แอ็กทีฟ มุ่งเน้น 3 สาระวิชาหลัก{' '}
                            <span className="font-semibold text-foreground">ภาษาอังกฤษ · คณิตศาสตร์ · ภาษาไทย</span>{' '}
                            ผ่านเกณฑ์สัญญามาตรฐาน MEDIA.md พร้อมปุ่มสั่งพิมพ์ใบงาน A4 คู่ขนานทันที
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5 bg-background/80 px-3 py-1.5 rounded-xl border border-border">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>สื่อพร้อมใช้งานทั้งหมด {mediaItems.length > 0 ? mediaItems.length : '110+'} เรื่อง</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-background/80 px-3 py-1.5 rounded-xl border border-border">
                                <BookOpen className="w-4 h-4 text-primary" />
                                <span>3 สาระวิชาหลัก {coreCount > 0 ? `${coreCount} รายการ` : 'ครอบคลุมครบถ้วน'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="space-y-4 mb-8">
                    {/* Subject Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                        {SUBJECT_TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = selectedSubject === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setSelectedSubject(tab.id)}
                                    className={cn(
                                        'inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all shrink-0 border select-none',
                                        isActive
                                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                            : 'bg-card text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground'
                                    )}
                                >
                                    <Icon className={cn('w-4 h-4', isActive ? 'text-primary-foreground' : tab.colorClass)} />
                                    <span>{tab.label}</span>
                                    {tab.isCore && (
                                        <span className={cn(
                                            'text-[10px] px-1.5 py-0.5 rounded-md font-bold',
                                            isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary'
                                        )}>
                                            หลัก
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Secondary Filters: Grade Level & Search */}
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                        {/* Grade Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                            <span className="text-xs font-semibold text-muted-foreground mr-1 shrink-0">ระดับชั้น:</span>
                            {GRADE_LEVELS.map((grade) => {
                                const isActive = selectedGrade === grade;
                                return (
                                    <button
                                        key={grade}
                                        type="button"
                                        onClick={() => setSelectedGrade(grade)}
                                        className={cn(
                                            'px-3 py-1.5 rounded-xl text-xs font-medium transition-colors shrink-0 border',
                                            isActive
                                                ? 'bg-primary/15 text-primary border-primary/30 font-semibold'
                                                : 'bg-card text-muted-foreground border-border hover:bg-muted/40'
                                        )}
                                    >
                                        {grade === 'all' ? 'ทุกระดับชั้น' : grade}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Search Input */}
                        <div className="relative min-w-[240px] sm:w-72">
                            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input
                                type="text"
                                placeholder="ค้นหาชื่อสื่อ หรือคำสำคัญ..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 h-9 text-sm rounded-xl bg-card border-border"
                            />
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
                                <div className="aspect-video bg-muted/60" />
                                <div className="p-4 space-y-3">
                                    <div className="h-4 bg-muted/60 rounded w-3/4" />
                                    <div className="h-3 bg-muted/40 rounded w-1/2" />
                                    <div className="pt-2 flex gap-2">
                                        <div className="h-8 bg-muted/50 rounded flex-1" />
                                        <div className="h-8 bg-muted/50 rounded w-16" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : isError ? (
                    <div className="text-center py-16 bg-card rounded-2xl border border-border">
                        <BookOpen className="w-12 h-12 text-destructive mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-foreground">ไม่สามารถโหลดคลังสื่อได้</h3>
                        <p className="text-sm text-muted-foreground mt-1">โปรดลองรีเฟรชหน้าเว็บอีกครั้ง</p>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-16 bg-card rounded-2xl border border-border">
                        <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                        <h3 className="text-lg font-bold text-foreground">ไม่พบสื่อการสอนตามเงื่อนไข</h3>
                        <p className="text-sm text-muted-foreground mt-1">ลองเปลี่ยนระดับชั้นหรือคำค้นหา</p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-4 rounded-xl"
                            onClick={() => {
                                setSelectedSubject('all');
                                setSelectedGrade('all');
                                setSearchQuery('');
                            }}
                        >
                            ล้างตัวกรองทั้งหมด
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filteredItems.map((item) => {
                            const pairedWorksheets = item.external_url ? guessPairedUrls(item.external_url) : [];
                            const worksheetUrl = pairedWorksheets.length > 0 ? pairedWorksheets[0] : null;

                            return (
                                <article
                                    key={item.id}
                                    className="group rounded-2xl border border-border bg-card overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                                >
                                    {/* Cover Thumbnail (16:9 Aspect Ratio) */}
                                    <div className="relative aspect-video bg-muted/30 overflow-hidden">
                                        {item.thumbnail_url ? (
                                            <img
                                                src={item.thumbnail_url}
                                                alt={item.title}
                                                loading="lazy"
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                onError={(e) => {
                                                    // Fallback placeholder
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary">
                                                <BookOpen className="w-10 h-10 opacity-40" />
                                            </div>
                                        )}

                                        {/* Subject Tag */}
                                        {item.subject && (
                                            <div className="absolute top-2.5 left-2.5">
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-background/90 backdrop-blur-sm text-foreground text-[11px] font-semibold px-2 py-0.5 shadow-sm border border-border/50"
                                                >
                                                    {item.subject}
                                                </Badge>
                                            </div>
                                        )}

                                        {/* View count */}
                                        {item.view_count > 0 && (
                                            <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm text-muted-foreground text-[10px] px-2 py-0.5 rounded-md font-medium border border-border/40">
                                                <Eye className="w-3 h-3" />
                                                <span>{item.view_count}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Content */}
                                    <div className="p-4 flex-1 flex flex-col justify-between">
                                        <div>
                                            {/* Grade Levels */}
                                            {item.grade_levels && item.grade_levels.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-2">
                                                    {item.grade_levels.slice(0, 3).map((g) => (
                                                        <span
                                                            key={g}
                                                            className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                                                        >
                                                            {g}
                                                        </span>
                                                    ))}
                                                    {item.grade_levels.length > 3 && (
                                                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                                            +{item.grade_levels.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            <h2 className="font-bold text-sm sm:text-base leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                                                {item.title}
                                            </h2>

                                            {item.description && (
                                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Card Actions */}
                                        <div className="pt-4 mt-3 border-t border-border/60 flex items-center gap-2">
                                            <a
                                                href={item.external_url || '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1"
                                            >
                                                <Button
                                                    size="sm"
                                                    className="w-full text-xs font-semibold rounded-xl h-8 gap-1.5"
                                                >
                                                    <BookOpen className="w-3.5 h-3.5" />
                                                    <span>เปิดสื่อ</span>
                                                    <ExternalLink className="w-3 h-3 opacity-70" />
                                                </Button>
                                            </a>

                                            {worksheetUrl && (
                                                <a
                                                    href={worksheetUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title="พิมพ์ใบงานคู่ขนาน A4"
                                                >
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-xs rounded-xl h-8 px-2.5 border-border hover:bg-muted gap-1 text-muted-foreground hover:text-foreground"
                                                    >
                                                        <FileText className="w-3.5 h-3.5 text-primary" />
                                                        <span>ใบงาน</span>
                                                    </Button>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
