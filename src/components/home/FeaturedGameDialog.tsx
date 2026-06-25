/**
 * FeaturedGameDialog.tsx — ป๊อปอัป "รายละเอียดเกม" จากโซนเกมแนะนำหน้าแรก
 *
 * เปิดจากการ์ดในโซน featured_games (HomeMainContent) — โชว์ปก/คำอธิบาย/วิชา/อันดับผู้เล่น
 * แล้วกด "เล่นเลย" ไป /play/:slug (หรือเปิดลิงก์นอก) — ดูรายละเอียดได้โดยไม่ต้องเข้าเมนูหลายชั้น
 */

import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Play, Eye, Gamepad2, ArrowRight } from 'lucide-react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { gamePlayService } from '@/services/game-play.service';
import { GameDemoPreview } from '@/components/educational-hub/GameDemoPreview';
import type { EduHubItem } from '@/services/educational-hub.service';

export const FeaturedGameDialog = ({
    game,
    open,
    onOpenChange,
}: {
    game: EduHubItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) => {
    const navigate = useNavigate();

    const { data: leaders } = useQuery({
        queryKey: ['game-leaderboard-card', game?.game_slug],
        queryFn: () => gamePlayService.getLeaderboard(game!.game_slug!, 5),
        enabled: open && !!game?.game_slug && !!game?.tracked_game,
        staleTime: 5 * 60 * 1000,
    });

    if (!game) return null;

    const handlePlay = () => {
        onOpenChange(false);
        if (game.game_slug) {
            navigate(`/play/${game.game_slug}`);
        } else if (game.external_url) {
            window.open(game.external_url, '_blank', 'noopener,noreferrer');
        }
    };

    const canPlay = !!game.game_slug || !!game.external_url;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="pr-8">{game.title}</DialogTitle>
                </DialogHeader>

                {/* ปก */}
                <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
                    {game.thumbnail_url && game.preview_video_url ? (
                        <GameDemoPreview cover={game.thumbnail_url} video={game.preview_video_url} title={game.title} />
                    ) : game.thumbnail_url ? (
                        <img src={game.thumbnail_url} alt={game.title} className="w-full h-full object-contain" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-muted to-secondary flex items-center justify-center text-4xl">🎮</div>
                    )}
                </div>

                {/* Badge วิชา/ระดับ/แท็ก */}
                <div className="flex flex-wrap items-center gap-1.5">
                    {game.subject && <Badge variant="outline">{game.subject}</Badge>}
                    {game.tracked_game && (
                        <Badge variant="secondary" className="gap-1">
                            <Gamepad2 className="h-3 w-3" /> เก็บคะแนน
                        </Badge>
                    )}
                    {game.grade_levels?.slice(0, 3).map((g) => (
                        <Badge key={g} variant="outline">{g}</Badge>
                    ))}
                    {game.tags?.slice(0, 4).map((t) => (
                        <Badge key={t} variant="secondary">#{t}</Badge>
                    ))}
                </div>

                {game.description && (
                    <p className="text-sm text-muted-foreground">{game.description}</p>
                )}

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" /> เล่นไปแล้ว {game.view_count.toLocaleString('th-TH')} ครั้ง
                </div>

                {/* อันดับผู้เล่น top-5 */}
                {game.tracked_game && game.game_slug && (leaders?.length ?? 0) > 0 && (
                    <div className="border-t border-border pt-3">
                        <p className="text-xs font-medium text-foreground mb-2">🏆 อันดับผู้เล่น</p>
                        <div className="flex items-end justify-around">
                            {leaders!.map((row, i) => (
                                <div
                                    key={row.student_id}
                                    className="flex flex-col items-center gap-0.5 min-w-0"
                                    title={`${i + 1}. ${row.display_name} — ${row.personal_best.toLocaleString('th-TH')} คะแนน`}
                                >
                                    <div className="relative">
                                        <PersonAvatar name={row.display_name} photoUrl={row.photo_url} size="sm" />
                                        <span className="absolute -top-1 -left-1 text-[8px] font-bold bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center leading-none shadow-sm">
                                            {i + 1}
                                        </span>
                                    </div>
                                    <span className="text-[9px] text-muted-foreground font-medium leading-none">
                                        {row.personal_best.toLocaleString('th-TH')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ปุ่ม */}
                <div className="flex items-center justify-between gap-2 pt-1">
                    <Link
                        to="/educational-hub"
                        className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                    >
                        ดูเกมทั้งหมด <ArrowRight className="h-3 w-3" />
                    </Link>
                    <Button onClick={handlePlay} disabled={!canPlay} className="gap-1">
                        <Play className="h-4 w-4 fill-current" /> เล่นเลย
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
