/**
 * LessonPacksSection — owner-scoped lesson packs for the public hub.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2, Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { lessonPacksService } from '@/services/lesson-packs.service';
import { LessonPackCard } from '@/components/educational-hub/LessonPackCard';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { Button } from '@/components/ui/button';

type Props = {
    limit?: number;
    ownerStaffId?: string | null;
    totalCount?: number;
    showAssignLink?: boolean;
    title?: string;
    subtitle?: string;
    variant?: 'grid' | 'summary';
};

export function LessonPacksSection({ variant = 'grid', ...props }: Props) {
    return variant === 'summary'
        ? <LessonPacksSummary />
        : <LessonPacksGrid {...props} />;
}

function LessonPacksSummary() {
    const { data: summary, isLoading } = useQuery({
        queryKey: ['lesson-packs', 'published-summary'],
        queryFn: () => lessonPacksService.getPublishedSummary(),
        staleTime: 5 * 60 * 1000,
    });

    if (isLoading) {
        return <div className="h-16 rounded-lg border border-border bg-card animate-pulse" />;
    }
    if (!summary?.count || !summary.owner) return null;

    const ownerHref = `/h/${summary.owner.username ?? summary.owner.id}?cat=lesson-packs`;

    return (
        <section className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-[180px] flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h2 className="text-sm font-bold text-foreground">ชุดเรียนพร้อมสอน</h2>
                    <span className="text-xs text-muted-foreground">{summary.count} ชุด</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <PersonAvatar
                        name={summary.owner.name}
                        photoUrl={summary.owner.photo_url}
                        className="h-5 w-5"
                    />
                    <span className="truncate">ผู้สร้าง {summary.owner.name}</span>
                </div>
            </div>
            <Button asChild size="sm" variant="outline" className="h-8">
                <Link to={ownerHref}>
                    เปิดคลังชุดเรียน
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
            </Button>
        </section>
    );
}

function LessonPacksGrid({
    limit = 24,
    ownerStaffId,
    totalCount,
    showAssignLink = false,
    title = 'ชุดเรียนพร้อมสอน',
    subtitle = 'เปิดชุดเดียว: สื่อ → พิมพ์ใบงาน → เกมเสริม',
}: Omit<Props, 'variant'>) {
    const [visibleLimit, setVisibleLimit] = useState(limit);

    useEffect(() => {
        setVisibleLimit(limit);
    }, [limit, ownerStaffId]);

    const { data: packs, isLoading, isFetching } = useQuery({
        queryKey: ['lesson-packs', 'published', { ownerStaffId, limit: visibleLimit }],
        queryFn: () => lessonPacksService.listPublishedWithItems({
            ownerStaffId,
            limit: visibleLimit,
        }),
        enabled: !!ownerStaffId,
        staleTime: 5 * 60 * 1000,
    });

    if (isLoading) {
        return (
            <section className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังโหลดชุดเรียน…
                </div>
            </section>
        );
    }
    if (!packs?.length) return null;

    const knownTotal = totalCount ?? packs.length;
    const hasMore = packs.length < knownTotal;

    return (
        <section id="cat-lesson-packs" className="scroll-mt-24 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">{title}</h2>
                <span className="text-xs text-muted-foreground">{knownTotal} ชุด</span>
            </div>
            {subtitle ? <p className="-mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {packs.map((pack) => (
                    <LessonPackCard key={pack.id} pack={pack} ritual showAssignLink={showAssignLink} />
                ))}
            </div>
            {hasMore ? (
                <div className="flex justify-center pt-1">
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isFetching}
                        onClick={() => setVisibleLimit((current) => current + limit)}
                    >
                        {isFetching ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                        ดูเพิ่มอีก {Math.min(limit, knownTotal - packs.length)} ชุด
                    </Button>
                </div>
            ) : null}
        </section>
    );
}
