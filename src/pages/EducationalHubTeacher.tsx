import { useEffect, useMemo, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, IdCard, Star } from 'lucide-react';
import {
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { SEOHead } from '@/components/SEOHead';
import {
    educationalHubService,
    type EduHubCategory,
    type EduHubItem,
    type EduHubTeacherCard,
} from '@/services/educational-hub.service';
import { CategoryChipStrip } from '@/components/educational-hub/CategoryChipStrip';
import { CategorySection } from '@/components/educational-hub/CategorySection';
import {
    SectionToolbar,
    EMPTY_FILTER,
    type FilterState,
    type SortMode,
} from '@/components/educational-hub/SectionToolbar';
import { useViewMode } from '@/hooks/useViewMode';
import { useFavorites } from '@/hooks/useFavorites';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';

// UUID v4 shape (used to disambiguate :identifier between staff_id vs username)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EducationalHubTeacher = () => {
    // Page is mounted from 2 routes:
    //   /educational-hub/:staffId  (legacy long URL — UUID)
    //   /h/:identifier             (short URL — username OR UUID for fallback)
    const params = useParams<{ staffId?: string; identifier?: string }>();
    const rawId = params.staffId ?? params.identifier ?? '';
    const [searchParams] = useSearchParams();
    const deepLinkCat = searchParams.get('cat');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [rawId]);

    const { data: cards, isLoading: loadingCards } = useQuery({
        queryKey: ['edu-hub', 'teachers'],
        queryFn: async () => {
            const { data, error } = await educationalHubService.listTeacherCards();
            if (error) throw error;
            return (data ?? []) as EduHubTeacherCard[];
        },
    });

    // Resolve rawId → teacher record (by UUID or by username)
    const teacher = useMemo<EduHubTeacherCard | null>(() => {
        if (!cards || !rawId) return null;
        if (UUID_RE.test(rawId)) {
            return cards.find((c) => c.staff_id === rawId) ?? null;
        }
        return cards.find((c) => c.username === rawId.toLowerCase()) ?? null;
    }, [cards, rawId]);

    const resolvedStaffId = teacher?.staff_id ?? null;

    const { data: items, isLoading: loadingItems } = useQuery({
        queryKey: ['edu-hub', 'items', resolvedStaffId, { publishedOnly: true }],
        enabled: !!resolvedStaffId,
        queryFn: async () => {
            const { data, error } = await educationalHubService.listItemsByTeacher(resolvedStaffId!, { publishedOnly: true });
            if (error) throw error;
            return (data ?? []) as EduHubItem[];
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

    // ─── Toolbar state: filters, sort, view mode, favorites ─────────────
    const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER);
    const [sort, setSort] = useState<SortMode>('default');
    const { mode: viewMode, setMode: setViewMode } = useViewMode();
    const { favorites, toggle: toggleFav, isFavorite } = useFavorites();

    // Admin edit mode — adds drag handles on section headers + item cards
    const { isAdmin } = useUserRole();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
    const [orderedCategories, setOrderedCategories] = useState<EduHubCategory[]>([]);

    // Sync local order with server data (categories from useQuery)
    useEffect(() => {
        if (categories) setOrderedCategories(categories);
    }, [categories]);

    const handleCategoryDragEnd = async (e: DragEndEvent) => {
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        const oldIdx = orderedCategories.findIndex((c) => c.id === active.id);
        const newIdx = orderedCategories.findIndex((c) => c.id === over.id);
        if (oldIdx < 0 || newIdx < 0) return;
        const next = arrayMove(orderedCategories, oldIdx, newIdx);
        setOrderedCategories(next);
        const updates = next.map((c, i) => ({ id: c.id, sort_order: (i + 1) * 10 }));
        const { error } = await educationalHubService.bulkUpdateSortOrderCategories(updates);
        if (error) {
            setOrderedCategories(categories ?? []);
            toast({ title: 'จัดลำดับล้มเหลว', description: error.message, variant: 'destructive' });
            return;
        }
        await queryClient.invalidateQueries({ queryKey: ['edu-hub', 'categories'] });
        await queryClient.invalidateQueries({ queryKey: ['edu-hub', 'categories', 'admin'] });
        toast({ title: 'บันทึกลำดับใหม่' });
    };

    const allItems = useMemo(() => items ?? [], [items]);

    // Apply filters + sort to the full item list (parent-side filtering keeps
    // category grouping logic untouched downstream)
    const visibleItems = useMemo(() => {
        const q = filter.search.trim().toLowerCase();
        let arr = allItems.filter((it) => {
            if (q) {
                const hay = `${it.title} ${it.description ?? ''}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            if (filter.subjects.length && (!it.subject || !filter.subjects.includes(it.subject))) return false;
            if (filter.grades.length && !it.grade_levels?.some((g) => filter.grades.includes(g))) return false;
            if (filter.tags.length && !it.tags?.some((t) => filter.tags.includes(t))) return false;
            if (filter.types.length && !filter.types.includes(it.item_type)) return false;
            return true;
        });

        // Sort modes (default = keep ordering from service: sort_order asc, created_at desc)
        if (sort === 'newest') {
            arr = [...arr].sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
        } else if (sort === 'popular') {
            arr = [...arr].sort((a, b) => b.view_count - a.view_count);
        } else if (sort === 'alpha') {
            arr = [...arr].sort((a, b) => a.title.localeCompare(b.title, 'th'));
        }
        return arr;
    }, [allItems, filter, sort]);

    const itemsByCategory = useMemo(() => {
        const m = new Map<string, EduHubItem[]>();
        visibleItems.forEach((it) => {
            const arr = m.get(it.category_id) ?? [];
            arr.push(it);
            m.set(it.category_id, arr);
        });
        return m;
    }, [visibleItems]);

    // Favorites = subset of ALL items (so user can find favorites even if filtered out)
    const favoriteItems = useMemo(
        () => allItems.filter((it) => favorites.has(it.id)),
        [allItems, favorites],
    );

    // Deep-link: scroll to ?cat=key after items render
    useEffect(() => {
        if (!deepLinkCat || loadingItems) return;
        const t = setTimeout(() => {
            const el = document.getElementById(`cat-${deepLinkCat}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
        return () => clearTimeout(t);
    }, [deepLinkCat, loadingItems]);

    const chartData = useMemo(() =>
        (categories ?? [])
            .map(c => ({ name: c.name, count: teacher?.counts_by_category?.[c.id] ?? 0 }))
            .filter(d => d.count > 0)
            .sort((a, b) => b.count - a.count),
        [categories, teacher?.counts_by_category],
    );

    if (loadingCards) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-muted-foreground">กำลังโหลด...</div>
            </div>
        );
    }

    if (!teacher) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <SiteHeader />
                <main className="flex-1 flex items-center justify-center px-4 py-16">
                    <div className="text-center space-y-4 max-w-md">
                        <h1 className="text-2xl font-bold text-foreground">ไม่พบหน้าครูที่ค้นหา</h1>
                        <p className="text-muted-foreground text-sm">
                            ครูยังไม่ได้เปิดคลังสื่อ หรือลิงก์ไม่ถูกต้อง
                        </p>
                        <Button asChild>
                            <Link to="/educational-hub">
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                กลับไปยังหน้าคลังหลัก
                            </Link>
                        </Button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEOHead
                title={`คลังสื่อ — ${teacher.name}`}
                description={teacher.hub_bio || `สื่อการสอน เกม ใบงาน และทรัพยากรของ${teacher.name}`}
                image={teacher.photo_url || undefined}
            />
            <SiteHeader />

            <main className="flex-1">
                {/* Hero */}
                <section
                    className="relative border-b border-border"
                    style={
                        teacher.banner_url
                            ? {
                                backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.75)), url(${teacher.banner_url})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                              }
                            : undefined
                    }
                >
                    <div
                        className={
                            teacher.banner_url
                                ? 'text-white'
                                : 'bg-gradient-to-br from-primary/10 via-accent/5 to-background text-foreground'
                        }
                    >
                        <div className="container mx-auto px-4 py-3 sm:py-5 max-w-6xl">
                            <Button
                                asChild
                                variant={teacher.banner_url ? 'secondary' : 'ghost'}
                                size="sm"
                                className="mb-2"
                            >
                                <Link to="/educational-hub">
                                    <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                                    ครูทั้งหมด
                                </Link>
                            </Button>

                            <div className="flex flex-row items-center gap-3">
                                <div className="rounded-full bg-background p-1 shadow-lg shrink-0">
                                    <PersonAvatar
                                        name={teacher.name}
                                        photoUrl={teacher.photo_url}
                                        size="lg"
                                        className="!h-12 !w-12 !text-base"
                                    />
                                </div>

                                <div className="flex-1 min-w-0 space-y-1 max-w-sm">
                                    <div>
                                        <h1 className="text-base sm:text-lg font-bold leading-tight">
                                            {teacher.name}
                                        </h1>
                                        <p className={teacher.banner_url ? 'text-white/80 text-xs' : 'text-muted-foreground text-xs'}>
                                            {teacher.position}
                                            {teacher.department && ` · ${teacher.department}`}
                                        </p>
                                    </div>

                                    {teacher.subject && (
                                        <Badge
                                            variant={teacher.banner_url ? 'secondary' : 'outline'}
                                            className="text-xs"
                                        >
                                            {teacher.subject}
                                        </Badge>
                                    )}

                                    {teacher.hub_bio && (
                                        <p className={`text-xs max-w-2xl hidden sm:block ${teacher.banner_url ? 'text-white/90' : 'text-muted-foreground'}`}>
                                            {teacher.hub_bio}
                                        </p>
                                    )}

                                    <div className="flex flex-wrap gap-2 pt-1">
                                        <Button asChild size="sm" variant={teacher.banner_url ? 'secondary' : 'outline'}>
                                            <Link to={`/staff/${teacher.username ?? teacher.staff_id}`}>
                                                <IdCard className="h-4 w-4 mr-1" />
                                                ดูข้อมูลครู
                                            </Link>
                                        </Button>
                                        {teacher.external_url && (
                                            <Button asChild size="sm" variant={teacher.banner_url ? 'default' : 'default'}>
                                                <a href={teacher.external_url} target="_blank" rel="noreferrer">
                                                    <ExternalLink className="h-4 w-4 mr-1" />
                                                    เว็บส่วนตัวครู
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Content breakdown bar chart — desktop only */}
                                {chartData.length > 0 && (
                                    <div className="hidden sm:flex flex-col justify-center shrink-0 w-56 h-32 ml-auto">
                                        <p className={`text-[10px] font-medium mb-1 ${teacher.banner_url ? 'text-white/70' : 'text-muted-foreground'}`}>
                                            เนื้อหาทั้งหมด
                                        </p>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                layout="vertical"
                                                data={chartData}
                                                margin={{ top: 0, right: 4, bottom: 0, left: 0 }}
                                            >
                                                <XAxis type="number" hide />
                                                <YAxis
                                                    type="category"
                                                    dataKey="name"
                                                    width={72}
                                                    tick={{ fontSize: 10, fill: teacher.banner_url ? 'rgba(255,255,255,0.75)' : 'hsl(var(--muted-foreground))' }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'hsl(var(--card))',
                                                        border: '1px solid hsl(var(--border))',
                                                        borderRadius: '0.5rem',
                                                        fontSize: 11,
                                                        fontFamily: 'inherit',
                                                    }}
                                                    formatter={(v: number) => [`${v} รายการ`, '']}
                                                />
                                                <Bar
                                                    dataKey="count"
                                                    fill="hsl(var(--primary))"
                                                    radius={[0, 4, 4, 0]}
                                                    label={{
                                                        position: 'insideRight',
                                                        fontSize: 10,
                                                        fontWeight: 600,
                                                        fill: 'white',
                                                    }}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Sticky category nav */}
                <CategoryChipStrip
                    categories={categories ?? []}
                    counts={teacher.counts_by_category ?? {}}
                />

                {/* Category sections */}
                <div className="container mx-auto px-4 py-10 max-w-6xl space-y-6">
                    {loadingItems ? (
                        <div className="text-center text-muted-foreground py-20">กำลังโหลดรายการ...</div>
                    ) : !categories || categories.length === 0 ? (
                        <div className="text-center text-muted-foreground py-20">
                            ยังไม่มีหมวดหมู่
                        </div>
                    ) : (
                        <>
                            {/* Toolbar — applies filters across all sections */}
                            <SectionToolbar
                                filter={filter}
                                onFilterChange={setFilter}
                                sort={sort}
                                onSortChange={setSort}
                                viewMode={viewMode}
                                onViewModeChange={setViewMode}
                                allItems={allItems}
                            />

                            {/* ⭐ Favorites pinned above */}
                            {favoriteItems.length > 0 && (
                                <section className="space-y-4">
                                    <header className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                                            <Star className="h-5 w-5 text-amber-600 fill-amber-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h2 className="text-lg sm:text-xl font-bold text-foreground">รายการโปรด</h2>
                                            <p className="text-xs text-muted-foreground">เก็บไว้บนเครื่องนี้ — เล่นซ้ำได้ง่ายๆ</p>
                                        </div>
                                        <span className="text-xs text-muted-foreground font-medium">{favoriteItems.length} รายการ</span>
                                    </header>
                                    <CategorySection
                                        category={null}
                                        items={favoriteItems}
                                        viewMode={viewMode}
                                        isFavorite={isFavorite}
                                        onToggleFavorite={toggleFav}
                                        hideHeader
                                    />
                                </section>
                            )}

                            {isAdmin && (
                                <p className="text-[10px] text-muted-foreground -mb-4 italic">
                                    💡 โหมด admin: ลากที่ grip ⋮⋮ บน section header เพื่อจัดลำดับหมวด หรือบนการ์ดเกมเพื่อจัดลำดับเกม
                                </p>
                            )}
                            <DndContext
                                sensors={dndSensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleCategoryDragEnd}
                            >
                                <SortableContext
                                    items={orderedCategories.map((c) => c.id)}
                                    strategy={verticalListSortingStrategy}
                                    disabled={!isAdmin}
                                >
                                    <div className="space-y-10">
                                        {orderedCategories.map((cat) => (
                                            <CategorySection
                                                key={cat.id}
                                                category={cat}
                                                items={itemsByCategory.get(cat.id) ?? []}
                                                viewMode={viewMode}
                                                isFavorite={isFavorite}
                                                onToggleFavorite={toggleFav}
                                                editable={isAdmin}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default EducationalHubTeacher;
