/**
 * RecommendedGames.tsx — แนะนำเกมถัดไปสำหรับนักเรียน (#1 Game Recommendation)
 *
 * ใช้ RPC recommend_games (migration 269) — 3-tier fallback:
 *   1. indicator_gap — เกมที่ฝึกตัวชี้วัดที่นักเรียนยังไม่ผ่าน (smart)
 *   2. subject_suggest — เกมในวิชาที่เรียน ที่ยังไม่เคยเล่น
 *   3. popular — เกมยอดนิยมที่ยังไม่เคยเล่น (pad)
 *
 * ฝังใน: Student Dashboard (#4) และ GameDashboard ("เกมแนะนำต่อไป")
 */
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Loader2, Sparkles, TrendingUp, Target } from 'lucide-react';
import { curriculumService, type GameRecommendationReason } from '@/services/curriculum.service';
import { GameCoverThumb } from '@/components/educational-hub/GameCoverThumb';
import { cn } from '@/lib/utils';

const REASON_META: Record<GameRecommendationReason, { label: string; icon: typeof Target; cls: string }> = {
    indicator_gap: { label: 'ฝึกตัวชี้วัด', icon: Target, cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    subject_suggest: { label: 'วิชาที่คุณเรียน', icon: Sparkles, cls: 'bg-sky-50 text-sky-700 border-sky-200' },
    popular: { label: 'เกมยอดนิยม', icon: TrendingUp, cls: 'bg-violet-50 text-violet-700 border-violet-200' },
};

export const RecommendedGames = ({
    studentCode,
    limit = 8,
    className,
}: {
    studentCode: string;
    limit?: number;
    className?: string;
}) => {
    const { data: recs, isLoading } = useQuery({
        queryKey: ['recommend-games', studentCode, limit],
        enabled: !!studentCode,
        queryFn: () => curriculumService.recommendGames(studentCode, limit),
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> กำลังหาเกมที่เหมาะกับคุณ…
            </div>
        );
    }

    if (!recs || recs.length === 0) {
        return (
            <div className="text-center py-8 text-sm text-muted-foreground">
                🎉 คุณเล่นเกมทุกตัวในคลังแล้ว — ลองเล่นซ้ำเพื่อทำคะแนนสูงขึ้นได้!
            </div>
        );
    }

    return (
        <div className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3', className)}>
            {recs.map((g) => {
                const meta = REASON_META[g.reason];
                const ReasonIcon = meta.icon;
                return (
                    <Link
                        key={g.item_id}
                        to={`/play/${g.slug}`}
                        className="group rounded-xl border bg-card overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all"
                    >
                        <div className="relative">
                            {g.thumbnail ? (
                                <GameCoverThumb src={g.thumbnail} alt={g.title} />
                            ) : (
                                <div className="aspect-video w-full flex items-center justify-center bg-muted text-muted-foreground">
                                    <Sparkles className="w-8 h-8" />
                                </div>
                            )}
                            <span className={cn('absolute top-1.5 left-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded border', meta.cls)}>
                                {meta.label}
                            </span>
                        </div>
                        <div className="p-2.5">
                            <p className="text-sm font-medium line-clamp-1">{g.title}</p>
                            {g.reason === 'indicator_gap' && g.indicator_desc && (
                                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 flex items-start gap-1">
                                    <ReasonIcon className="w-3 h-3 mt-0.5 shrink-0" />
                                    {g.indicator_desc}
                                </p>
                            )}
                        </div>
                    </Link>
                );
            })}
        </div>
    );
};
