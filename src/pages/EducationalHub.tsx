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
                {/* Hero */}
                <section className="bg-gradient-to-br from-primary/10 via-accent/5 to-background border-b border-border">
                    <div className="container mx-auto px-4 py-10 sm:py-14 max-w-6xl">
                        <div className="flex flex-col items-center text-center gap-3">
                            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
                                <Sparkles className="h-3.5 w-3.5" />
                                คลังสื่อและเกมการศึกษา
                            </span>
                            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                                เลือกครูที่ต้องการเข้าชมคลังสื่อ
                            </h1>
                            <p className="text-sm text-muted-foreground max-w-2xl">
                                รวมสื่อการสอน เกม ใบงาน คลิปวิดีโอ และทรัพยากรการเรียนรู้ของครูทุกท่าน — เลือกครูที่ต้องการเพื่อเข้าสู่คลังของท่าน
                            </p>
                            <div className="relative w-full max-w-md mt-3">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="ค้นหาชื่อครู / วิชา / ฝ่าย..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 bg-background"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Teacher grid */}
                <section className="container mx-auto px-4 py-10 max-w-6xl">
                    {loadingTeachers ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="rounded-lg border border-border bg-card p-4 animate-pulse h-56" />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            {search ? 'ไม่พบครูที่ตรงกับการค้นหา' : 'ยังไม่มีครูในคลัง'}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
