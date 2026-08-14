import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
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
import { lessonPacksService } from '@/services/lesson-packs.service';
import { CategoryChipStrip } from '@/components/educational-hub/CategoryChipStrip';
import { CategorySection } from '@/components/educational-hub/CategorySection';
import { GamesCategorySection } from '@/components/educational-hub/GamesCategorySection';
import { GamificationHub } from '@/components/games/GamificationHub';
import {
    SectionToolbar,
    EMPTY_FILTER,
    type FilterState,
    type SortMode,
} from '@/components/educational-hub/SectionToolbar';
import { LessonPacksSection } from '@/components/educational-hub/LessonPacksSection';
import { resolveGameMediaHubLink } from '@/lib/edu-hub-game-media-pairs';
import { resolvePairedLink } from '@/lib/edu-hub-worksheet-pairs';
import { useViewMode } from '@/hooks/useViewMode';
import { useFavorites } from '@/hooks/useFavorites';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthProvider';

// UUID v4 shape (used to disambiguate :identifier between staff_id vs username)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAGE_SIZE = 24;
const LESSON_PACKS_CATEGORY: EduHubCategory = {
    id: 'lesson-packs',
    category_key: 'lesson-packs',
    name: 'ชุดเรียนพร้อมสอน',
    description: 'สื่อ ใบงาน และเกมที่จัดเป็นชุดพร้อมใช้ในชั้นเรียน',
    icon_name: 'Package',
    color_class: 'text-primary',
    sort_order: -1,
    is_active: true,
    created_at: '',
    updated_at: '',
};

const EducationalHubTeacher = () => {
    const navigate = useNavigate();
    const { session, staffId: signedInStaffId } = useAuth();
    const secretTapRef = useRef({ count: 0, startedAt: 0 });
    // Page is mounted from 2 routes:
    //   /educational-hub/:staffId  (legacy long URL — UUID)
    //   /h/:identifier             (short URL — username OR UUID for fallback)
    const params = useParams<{ staffId?: string; identifier?: string }>();
    const rawId = params.staffId ?? params.identifier ?? '';
    const [searchParams, setSearchParams] = useSearchParams();
    const deepLinkCat = searchParams.get('cat');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [rawId]);

    // รหัสนักเรียนจาก localStorage (PlayGame เก็บไว้ตอน login เกม) → ใช้ highlight อันดับ + HonorWall
    const hubStudentCode = useMemo(() => localStorage.getItem('kampai_student_code'), []);

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

    const handleSecretAvatarTap = () => {
        const now = Date.now();
        const state = secretTapRef.current;
        if (now - state.startedAt > 2500) {
            state.count = 0;
            state.startedAt = now;
        }
        state.count += 1;
        if (state.count < 5) return;
        state.count = 0;
        if (!session) {
            navigate(`/admin?redirect=${encodeURIComponent('/teacher/integrated-plan')}`);
            return;
        }
        if (signedInStaffId === resolvedStaffId) navigate('/teacher/integrated-plan');
    };

    const { data: categories } = useQuery({
        queryKey: ['edu-hub', 'categories'],
        queryFn: async () => {
            const { data, error } = await educationalHubService.listCategories();
            if (error) throw error;
            return (data ?? []) as EduHubCategory[];
        },
    });

    const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER);
    const [sort, setSort] = useState<SortMode>('newest');
    const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
    const deferredSearch = useDeferredValue(filter.search);

    const { data: packCount = 0, isLoading: loadingPackCount } = useQuery({
        queryKey: ['lesson-packs', 'published-count', resolvedStaffId],
        queryFn: () => lessonPacksService.countPublished(resolvedStaffId),
        enabled: !!resolvedStaffId,
        staleTime: 5 * 60 * 1000,
    });

    const categoryChoices = useMemo(
        () => packCount > 0
            ? [LESSON_PACKS_CATEGORY, ...(categories ?? [])]
            : (categories ?? []),
        [categories, packCount],
    );

    const activeCategoryKey = useMemo(() => {
        if (deepLinkCat && categoryChoices.some((category) => category.category_key === deepLinkCat)) {
            return deepLinkCat;
        }
        return categoryChoices.find((category) => {
            if (category.category_key === 'lesson-packs') return packCount > 0;
            return (teacher?.counts_by_category?.[category.id] ?? 0) > 0;
        })?.category_key ?? categoryChoices[0]?.category_key ?? null;
    }, [categoryChoices, deepLinkCat, packCount, teacher?.counts_by_category]);

    const activeCategory = useMemo(
        () => (categories ?? []).find((category) => category.category_key === activeCategoryKey) ?? null,
        [activeCategoryKey, categories],
    );

    useEffect(() => {
        setVisibleLimit(PAGE_SIZE);
    }, [
        activeCategoryKey,
        deferredSearch,
        filter.subjects,
        filter.grades,
        filter.tags,
        filter.types,
        sort,
    ]);

    const { data: itemPage, isLoading: loadingItems, isFetching: fetchingItems } = useQuery({
        queryKey: [
            'edu-hub', 'items-page', resolvedStaffId, activeCategory?.id, visibleLimit,
            deferredSearch, filter.subjects, filter.grades, filter.tags, filter.types, sort,
        ],
        enabled: !!resolvedStaffId && !!activeCategory && !loadingPackCount,
        queryFn: async () => {
            const result = await educationalHubService.listItemsByTeacherPage(resolvedStaffId!, {
                categoryId: activeCategory!.id,
                limit: visibleLimit,
                search: deferredSearch,
                subjects: filter.subjects,
                grades: filter.grades,
                tags: filter.tags,
                types: filter.types,
                sort,
            });
            if (result.error) throw result.error;
            return result;
        },
        staleTime: 60 * 1000,
    });

    const allItems = useMemo(() => itemPage?.data ?? [], [itemPage?.data]);
    const totalItems = itemPage?.count ?? 0;

    const { data: publishedUrls = [] } = useQuery({
        queryKey: ['edu-hub', 'published-item-urls', resolvedStaffId],
        queryFn: () => educationalHubService.listPublishedItemUrlsByTeacher(resolvedStaffId!),
        enabled: !!resolvedStaffId,
        staleTime: 5 * 60 * 1000,
    });

    const categoryCounts = useMemo(
        () => ({ ...(teacher?.counts_by_category ?? {}), 'lesson-packs': packCount }),
        [packCount, teacher?.counts_by_category],
    );

    const handleCategorySelect = (categoryKey: string) => {
        const next = new URLSearchParams(searchParams);
        next.set('cat', categoryKey);
        setSearchParams(next, { replace: true });
    };

    // ─── Toolbar state: view mode, favorites ────────────────────────────
    const { mode: viewMode, setMode: setViewMode } = useViewMode();
    const { favorites, toggle: toggleFav, isFavorite } = useFavorites();

    // Admin edit mode — adds drag handles on section headers + item cards
    const { isAdmin, isTeacher } = useUserRole();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
    const [orderedCategories, setOrderedCategories] = useState<EduHubCategory[]>([]);

    // Sync local order with server data (categories from useQuery)
    useEffect(() => {
        if (categories) setOrderedCategories(categories);
    }, [categories]);

    const displayedCategoryChoices = useMemo(() => {
        const displayedCategories = orderedCategories.length > 0 ? orderedCategories : (categories ?? []);
        return packCount > 0
            ? [LESSON_PACKS_CATEGORY, ...displayedCategories]
            : displayedCategories;
    }, [categories, orderedCategories, packCount]);

    const reorderCategories = async (activeId: string, overId: string) => {
        if (activeId === overId || activeId === LESSON_PACKS_CATEGORY.id || overId === LESSON_PACKS_CATEGORY.id) return;
        const oldIdx = orderedCategories.findIndex((c) => c.id === activeId);
        const newIdx = orderedCategories.findIndex((c) => c.id === overId);
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

    const handleCategoryDragEnd = (e: DragEndEvent) => {
        if (!e.over) return;
        void reorderCategories(String(e.active.id), String(e.over.id));
    };

    const publishedUrlSet = useMemo(() => new Set(publishedUrls), [publishedUrls]);

    const pairedByItemId = useMemo(() => {
        const map = new Map<string, NonNullable<ReturnType<typeof resolvePairedLink>>>();
        for (const it of allItems) {
            const worksheetOrMediaPair = resolvePairedLink(it.external_url, publishedUrlSet);
            const lookBefore = it.tracked_game
                ? resolveGameMediaHubLink(it.game_slug)
                : null;
            const pair = worksheetOrMediaPair ?? lookBefore;
            if (pair) map.set(it.id, pair);
        }
        return map;
    }, [allItems, publishedUrlSet]);

    const visibleCategories = useMemo(
        () => activeCategory ? [activeCategory] : [],
        [activeCategory],
    );

    const itemsByCategory = useMemo(() => {
        const m = new Map<string, EduHubItem[]>();
        allItems.forEach((it) => {
            const arr = m.get(it.category_id) ?? [];
            arr.push(it);
            m.set(it.category_id, arr);
        });
        return m;
    }, [allItems]);

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

            <main className="flex-1 flex flex-col">
              <div className="max-w-7xl mx-auto w-full flex-grow flex flex-col">
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
                        <div className="grid gap-3 px-4 py-3 sm:py-5 lg:grid-cols-[minmax(0,2fr)_minmax(28rem,3fr)] lg:items-center lg:gap-6">
                          <div className="min-w-0">
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
                                <button
                                    type="button"
                                    aria-label="รูปประจำตัวครู"
                                    onClick={handleSecretAvatarTap}
                                    className="rounded-full bg-background p-1 shadow-lg shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                >
                                    <PersonAvatar
                                        name={teacher.name}
                                        photoUrl={teacher.photo_url}
                                        size="lg"
                                        className="!h-12 !w-12 !text-base"
                                    />
                                </button>

                                <div className="flex-1 min-w-0 space-y-1">
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
                            </div>
                          </div>

                          <div className="min-w-0">
                            <GamificationHub
                                studentCode={hubStudentCode}
                                panelTargetId="gamification-hub-panels"
                            />
                          </div>
                        </div>
                    </div>
                </section>

                {/* Sticky category nav */}
                <CategoryChipStrip
                    categories={displayedCategoryChoices}
                    counts={categoryCounts}
                    activeKey={activeCategoryKey}
                    onSelect={handleCategorySelect}
                    editable={isAdmin}
                    onReorder={(activeId, overId) => void reorderCategories(activeId, overId)}
                />

                {/* พาเนลรายละเอียดของการ์ดนักเรียนใน Hero — แสดงตรงนี้เพื่อไม่ดันความสูง Hero */}
                <section
                    id="gamification-hub-panels"
                    className="empty:hidden px-4 pt-5 max-w-5xl mx-auto w-full"
                />

                {/* Category sections */}
                <div className="px-4 py-5 space-y-4">
                    {activeCategoryKey === 'lesson-packs' ? (
                        <LessonPacksSection
                            ownerStaffId={resolvedStaffId}
                            totalCount={packCount}
                            showAssignLink={isAdmin || isTeacher}
                            limit={PAGE_SIZE}
                        />
                    ) : loadingItems ? (
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
                                        pairedByItemId={pairedByItemId}
                                    />
                                </section>
                            )}

                            {isAdmin && (
                                <p className="text-[10px] text-muted-foreground -mb-4 italic">
                                    💡 โหมด admin: ลาก grip บนหัวหมวดเพื่อจัดลำดับหมวด · หมวดเกม: กด 📌 ปักหมุด + ลากเรียงเกมที่ปักไว้ (มีผลทุกเครื่อง)
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
                                        {visibleCategories.length === 0 && deepLinkCat ? (
                                            <div className="text-center text-muted-foreground py-16 text-sm">
                                                ไม่พบหมวด “{deepLinkCat}” — เลือกหมวดอื่นจากแถบด้านบน
                                            </div>
                                        ) : null}
                                        {visibleCategories.map((cat) =>
                                            cat.category_key === 'games' ? (
                                                <GamesCategorySection
                                                    key={cat.id}
                                                    category={cat}
                                                    items={itemsByCategory.get(cat.id) ?? []}
                                                    viewMode={viewMode}
                                                    isFavorite={isFavorite}
                                                    onToggleFavorite={toggleFav}
                                                    editable={isAdmin && allItems.length >= totalItems}
                                                    pairedByItemId={pairedByItemId}
                                                />
                                            ) : (
                                                <CategorySection
                                                    key={cat.id}
                                                    category={cat}
                                                    items={itemsByCategory.get(cat.id) ?? []}
                                                    viewMode={viewMode}
                                                    isFavorite={isFavorite}
                                                    onToggleFavorite={toggleFav}
                                                    editable={isAdmin && allItems.length >= totalItems}
                                                    pairedByItemId={pairedByItemId}
                                                />
                                            ),
                                        )}
                                    </div>
                                </SortableContext>
                            </DndContext>
                            {allItems.length < totalItems ? (
                                <div className="flex justify-center pt-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        disabled={fetchingItems}
                                        onClick={() => setVisibleLimit((current) => current + PAGE_SIZE)}
                                    >
                                        {fetchingItems ? 'กำลังโหลด…' : `ดูเพิ่มอีก ${Math.min(PAGE_SIZE, totalItems - allItems.length)} รายการ`}
                                    </Button>
                                </div>
                            ) : null}
                        </>
                    )}
                </div>
              </div>
            </main>

            <Footer />
        </div>
    );
};

export default EducationalHubTeacher;
