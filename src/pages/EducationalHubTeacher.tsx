import { useEffect, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, IdCard } from 'lucide-react';
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

const EducationalHubTeacher = () => {
    const { staffId } = useParams<{ staffId: string }>();
    const [searchParams] = useSearchParams();
    const deepLinkCat = searchParams.get('cat');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [staffId]);

    const { data: cards, isLoading: loadingCards } = useQuery({
        queryKey: ['edu-hub', 'teachers'],
        queryFn: async () => {
            const { data, error } = await educationalHubService.listTeacherCards();
            if (error) throw error;
            return (data ?? []) as EduHubTeacherCard[];
        },
    });

    const { data: items, isLoading: loadingItems } = useQuery({
        queryKey: ['edu-hub', 'items', staffId, { publishedOnly: true }],
        enabled: !!staffId,
        queryFn: async () => {
            const { data, error } = await educationalHubService.listItemsByTeacher(staffId!, { publishedOnly: true });
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

    const teacher = useMemo(
        () => (cards ?? []).find((c) => c.staff_id === staffId),
        [cards, staffId],
    );

    const itemsByCategory = useMemo(() => {
        const m = new Map<string, EduHubItem[]>();
        (items ?? []).forEach((it) => {
            const arr = m.get(it.category_id) ?? [];
            arr.push(it);
            m.set(it.category_id, arr);
        });
        return m;
    }, [items]);

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
                        <div className="container mx-auto px-4 py-10 sm:py-14 max-w-6xl">
                            <Button
                                asChild
                                variant={teacher.banner_url ? 'secondary' : 'ghost'}
                                size="sm"
                                className="mb-4"
                            >
                                <Link to="/educational-hub">
                                    <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                                    ครูทั้งหมด
                                </Link>
                            </Button>

                            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                                <div className="rounded-full bg-background p-1.5 shadow-lg">
                                    <PersonAvatar
                                        name={teacher.name}
                                        photoUrl={teacher.photo_url}
                                        size="lg"
                                        className="!h-20 !w-20 !text-xl"
                                    />
                                </div>

                                <div className="flex-1 min-w-0 space-y-2">
                                    <div>
                                        <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                                            {teacher.name}
                                        </h1>
                                        <p className={teacher.banner_url ? 'text-white/80 text-sm' : 'text-muted-foreground text-sm'}>
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
                                        <p className={`text-sm max-w-2xl ${teacher.banner_url ? 'text-white/90' : 'text-muted-foreground'}`}>
                                            {teacher.hub_bio}
                                        </p>
                                    )}

                                    <div className="flex flex-wrap gap-2 pt-2">
                                        <Button asChild size="sm" variant={teacher.banner_url ? 'secondary' : 'outline'}>
                                            <Link to={`/staff/${teacher.staff_id}`}>
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
                    </div>
                </section>

                {/* Sticky category nav */}
                <CategoryChipStrip
                    categories={categories ?? []}
                    counts={teacher.counts_by_category ?? {}}
                />

                {/* Category sections */}
                <div className="container mx-auto px-4 py-10 max-w-6xl space-y-10">
                    {loadingItems ? (
                        <div className="text-center text-muted-foreground py-20">กำลังโหลดรายการ...</div>
                    ) : !categories || categories.length === 0 ? (
                        <div className="text-center text-muted-foreground py-20">
                            ยังไม่มีหมวดหมู่
                        </div>
                    ) : (
                        categories.map((cat) => (
                            <CategorySection
                                key={cat.id}
                                category={cat}
                                items={itemsByCategory.get(cat.id) ?? []}
                            />
                        ))
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default EducationalHubTeacher;
