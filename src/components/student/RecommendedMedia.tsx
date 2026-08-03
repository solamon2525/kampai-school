/**
 * RecommendedMedia.tsx — แนะนำสื่อการสอนถัดไปบน /my
 * RPC recommend_media (migration 429) — 3-tier เหมือนเกม แต่เปิด external_url / YouTube
 */
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Loader2, Sparkles, Target, TrendingUp } from 'lucide-react';
import {
    curriculumService,
    mediaRecommendationHref,
    type GameRecommendationReason,
} from '@/services/curriculum.service';
import { GameCoverThumb } from '@/components/educational-hub/GameCoverThumb';
import { cn } from '@/lib/utils';

const REASON_META: Record<GameRecommendationReason, { label: string; icon: typeof Target; cls: string }> = {
    indicator_gap: { label: 'ฝึกตัวชี้วัด', icon: Target, cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    subject_suggest: { label: 'วิชาที่คุณเรียน', icon: Sparkles, cls: 'bg-sky-50 text-sky-700 border-sky-200' },
    popular: { label: 'สื่อยอดนิยม', icon: TrendingUp, cls: 'bg-violet-50 text-violet-700 border-violet-200' },
};

export const RecommendedMedia = ({
    studentCode,
    limit = 8,
    className,
}: {
    studentCode: string;
    limit?: number;
    className?: string;
}) => {
    const { data: recs, isLoading } = useQuery({
        queryKey: ['recommend-media', studentCode, limit],
        enabled: !!studentCode,
        queryFn: () => curriculumService.recommendMedia(studentCode, limit),
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> กำลังหาสื่อที่เหมาะกับคุณ…
            </div>
        );
    }

    if (!recs || recs.length === 0) {
        return (
            <div className="py-8 text-center text-sm text-muted-foreground">
                ยังไม่มีสื่อแนะนำในตอนนี้ — ลองเลือกวิชาอื่นในแผนที่ตัวชี้วัด หรือเปิดคลังสื่อได้
            </div>
        );
    }

    return (
        <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4', className)}>
            {recs.map((m) => {
                const meta = REASON_META[m.reason] ?? REASON_META.popular;
                const ReasonIcon = meta.icon;
                const href = mediaRecommendationHref(m);
                const inner = (
                    <>
                        <div className="relative">
                            {m.thumbnail ? (
                                <GameCoverThumb src={m.thumbnail} alt={m.title} />
                            ) : (
                                <div className="flex aspect-video w-full items-center justify-center bg-muted text-muted-foreground">
                                    <BookOpen className="h-8 w-8" />
                                </div>
                            )}
                            <span className={cn('absolute left-1.5 top-1.5 rounded border px-1.5 py-0.5 text-[10px] font-medium', meta.cls)}>
                                {meta.label}
                            </span>
                        </div>
                        <div className="p-2.5">
                            <p className="line-clamp-1 text-sm font-medium">{m.title}</p>
                            {m.reason === 'indicator_gap' && m.indicator_desc && (
                                <p className="mt-1 flex items-start gap-1 text-[11px] text-muted-foreground line-clamp-2">
                                    <ReasonIcon className="mt-0.5 h-3 w-3 shrink-0" />
                                    {m.indicator_desc}
                                </p>
                            )}
                        </div>
                    </>
                );

                const cardClass =
                    'group overflow-hidden rounded-xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md';

                if (!href) {
                    return (
                        <div key={m.item_id} className={cn(cardClass, 'opacity-70')}>
                            {inner}
                        </div>
                    );
                }

                const isExternal = /^https?:\/\//i.test(href);
                return (
                    <a
                        key={m.item_id}
                        href={href}
                        target={isExternal ? '_blank' : undefined}
                        rel={isExternal ? 'noopener noreferrer' : undefined}
                        className={cardClass}
                    >
                        {inner}
                    </a>
                );
            })}
        </div>
    );
};
