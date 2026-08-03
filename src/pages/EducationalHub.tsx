import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import {
    educationalHubService,
    type EduHubCategory,
    type EduHubTeacherCard,
} from '@/services/educational-hub.service';
import { TeacherHubCard, type CardVariant } from '@/components/educational-hub/TeacherHubCard';
import { HubToolbar } from '@/components/educational-hub/HubToolbar';
import { LessonPacksSection } from '@/components/educational-hub/LessonPacksSection';
import { useHubLayoutWithDefault } from '@/hooks/useHubLayoutWithDefault';
import type { HubColumns } from '@/hooks/useHubViewMode';
import { cn } from '@/lib/utils';

// Pre-defined Tailwind grid classes (JIT requires literal strings to detect)
const GRID_CLASS_BY_COLS: Record<HubColumns, string> = {
    3: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4',
    4: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4',
    5: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4',
    6: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4',
};

const EducationalHub = () => {
    const [search, setSearch] = useState('');
    const { viewMode, columns, sort, setViewMode, setColumns, setSort, readonly } = useHubLayoutWithDefault();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const { data: teachers, isLoading: loadingTeachers } = useQuery({
        queryKey: ['edu-hub', 'teachers'],
        queryFn: async () => {
            const { data, error } = await educationalHubService.listTeacherCards();
            if (error) throw error;
            return (data ?? []) as EduHubTeacherCard[];
        },
    });

    const { data: categories } = useQuery({
        queryKey: ['edu-hub', 'categories'],
        queryFn: async () => {
            const { data, error } = await educationalHubService.listCategories();
            if (error) throw error;
            return (data ?? []) as EduHubCategory[];
        },
    });

    // Apply search + sort
    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        let arr = teachers ?? [];
        if (q) {
            arr = arr.filter(
                (t) =>
                    t.name.toLowerCase().includes(q) ||
                    (t.subject ?? '').toLowerCase().includes(q) ||
                    (t.department ?? '').toLowerCase().includes(q),
            );
        }
        // Sort modes
        if (sort === 'popular') {
            arr = [...arr].sort((a, b) => b.total_items - a.total_items);
        } else if (sort === 'alpha') {
            arr = [...arr].sort((a, b) => a.name.localeCompare(b.name, 'th'));
        } else if (sort === 'newest') {
            arr = [...arr].sort((a, b) => {
                // nulls go last
                if (!a.last_item_at && !b.last_item_at) return 0;
                if (!a.last_item_at) return 1;
                if (!b.last_item_at) return -1;
                return b.last_item_at.localeCompare(a.last_item_at);
            });
        }
        // 'default' = keep server order (order_position asc)
        return arr;
    }, [teachers, search, sort]);

    // Pick grid class for current layout
    const gridClass = useMemo(() => {
        if (viewMode === 'list' || viewMode === 'compact') {
            return viewMode === 'compact' ? 'grid grid-cols-1 gap-1.5' : 'grid grid-cols-1 gap-3';
        }
        return GRID_CLASS_BY_COLS[columns];
    }, [viewMode, columns]);

    // Variant per card
    const variantFor = (idx: number): CardVariant => {
        if (viewMode === 'list') return 'list';
        if (viewMode === 'compact') return 'compact';
        if (viewMode === 'featured' && idx === 0) return 'featured';
        return 'grid';
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEOHead
                title="คลังสื่อและเกมการศึกษา"
                description="รวมสื่อการสอน เกมการศึกษา ใบงาน และคลิปสอนของครูแต่ละท่าน"
            />
            <SiteHeader />

            <main className="flex-1">
                {/* Hero — compact (title + count only; search moved to toolbar) */}
                <section className="bg-gradient-to-br from-primary/10 via-accent/5 to-background border-b border-border">
                    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                                <Sparkles className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-lg sm:text-xl font-bold text-foreground leading-tight">
                                    คลังสื่อและเกมการศึกษา
                                </h1>
                                <p className="text-[11px] sm:text-xs text-muted-foreground">
                                    เลือกครูเพื่อเข้าชมคลังสื่อ — ปรับมุมมอง/จัดเรียงได้ที่แถบเครื่องมือด้านล่าง
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Toolbar + content */}
                <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 space-y-3">
                    <LessonPacksSection variant="summary" />

                    <HubToolbar
                        search={search}
                        onSearchChange={setSearch}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        columns={columns}
                        onColumnsChange={setColumns}
                        sort={sort}
                        onSortChange={setSort}
                        totalCount={teachers?.length ?? 0}
                        visibleCount={visible.length}
                        readonly={readonly}
                    />

                    {loadingTeachers ? (
                        <div className={GRID_CLASS_BY_COLS[columns]}>
                            {Array.from({ length: 10 }).map((_, i) => (
                                <div key={i} className="rounded-xl border border-border bg-card overflow-hidden animate-pulse">
                                    <div className="aspect-[4/5] bg-muted" />
                                    <div className="p-3 space-y-2">
                                        <div className="h-3 bg-muted rounded" />
                                        <div className="h-3 bg-muted rounded w-2/3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : visible.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            {search ? 'ไม่พบครูที่ตรงกับการค้นหา' : 'ยังไม่มีครูในคลัง'}
                        </div>
                    ) : (
                        <div className={cn(gridClass)}>
                            {visible.map((t, idx) => (
                                <TeacherHubCard
                                    key={t.staff_id}
                                    teacher={t}
                                    categories={categories ?? []}
                                    variant={variantFor(idx)}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default EducationalHub;
