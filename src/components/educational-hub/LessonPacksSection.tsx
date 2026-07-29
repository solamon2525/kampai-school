/**
 * LessonPacksSection — published lesson packs strip for hub / teacher pages
 */
import { Package, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { lessonPacksService } from '@/services/lesson-packs.service';
import { LessonPackCard } from '@/components/educational-hub/LessonPackCard';

type Props = {
    limit?: number;
    showAssignLink?: boolean;
    title?: string;
    subtitle?: string;
};

export function LessonPacksSection({
    limit = 12,
    showAssignLink = false,
    title = 'ชุดเรียนพร้อมสอน',
    subtitle = 'เปิดชุดเดียว: สื่อ → พิมพ์ใบงาน → เกมเสริม',
}: Props) {
    const { data: packs, isLoading } = useQuery({
        queryKey: ['lesson-packs', 'published', { limit }],
        queryFn: async () => {
            const all = await lessonPacksService.listPublishedWithItems();
            return all.slice(0, limit);
        },
    });

    if (isLoading) {
        return (
            <section className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังโหลดชุดเรียน…
                </div>
            </section>
        );
    }

    if (!packs?.length) return null;

    return (
        <section className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
                <Package className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">{title}</h2>
                <span className="text-xs text-muted-foreground">{packs.length} ชุด</span>
            </div>
            {subtitle && <p className="text-xs text-muted-foreground -mt-1">{subtitle}</p>}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {packs.map((pack) => (
                    <LessonPackCard key={pack.id} pack={pack} ritual showAssignLink={showAssignLink} />
                ))}
            </div>
        </section>
    );
}
