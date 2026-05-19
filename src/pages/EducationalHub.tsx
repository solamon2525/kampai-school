import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Sparkles } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { SEOHead } from '@/components/SEOHead';
import {
    educationalHubService,
    type EduHubCategory,
    type EduHubTeacherCard,
} from '@/services/educational-hub.service';
import { TeacherHubCard } from '@/components/educational-hub/TeacherHubCard';

const EducationalHub = () => {
    const [search, setSearch] = useState('');

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

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return teachers ?? [];
        return (teachers ?? []).filter(
            (t) =>
                t.name.toLowerCase().includes(q) ||
                (t.subject ?? '').toLowerCase().includes(q) ||
                (t.department ?? '').toLowerCase().includes(q),
        );
    }, [teachers, search]);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SEOHead
                title="คลังสื่อและเกมการศึกษา"
                description="รวมสื่อการสอน เกมการศึกษา ใบงาน และคลิปสอนของครูแต่ละท่าน"
            />
            <SiteHeader />

            <main className="flex-1">
                {/* Hero — compact: ลด py + รวม title+subtitle+search ใน row เดียวบน desktop */}
                <section className="bg-gradient-to-br from-primary/10 via-accent/5 to-background border-b border-border">
                    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <h1 className="text-lg sm:text-xl font-bold text-foreground leading-tight">
                                        คลังสื่อและเกมการศึกษา
                                    </h1>
                                    <p className="text-[11px] sm:text-xs text-muted-foreground">
                                        เลือกครูเพื่อเข้าชมคลังสื่อ · {teachers?.length ?? 0} ท่าน
                                    </p>
                                </div>
                            </div>
                            <div className="relative w-full sm:w-72 shrink-0">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="ค้นหาชื่อครู / วิชา / ฝ่าย..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 bg-background h-9"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Teacher grid — full-width container, 2/3/4/5 cols responsive */}
                <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
                    {loadingTeachers ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
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
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            {search ? 'ไม่พบครูที่ตรงกับการค้นหา' : 'ยังไม่มีครูในคลัง'}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                            {filtered.map((t) => (
                                <TeacherHubCard
                                    key={t.staff_id}
                                    teacher={t}
                                    categories={categories ?? []}
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
