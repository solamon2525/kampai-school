/**
 * LessonPackCard — ชุดเรียน (สื่อ → ใบงาน → เกม) เป็นหน่วยสอนเดียว
 * ใช้ในคลังสาธารณะ / หน้าครู / ใบงานบ้าน parent
 */
import { BookOpen, FileText, Gamepad2, ClipboardList, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LessonPack } from '@/services/lesson-packs.service';

export type PackFeedback = {
    score: number | null;
    maxScore: number | null;
    comment: string | null;
};

export type LessonPackCardProps = {
    pack: LessonPack;
    /** Numbered classroom ritual CTAs (สื่อ → พิมพ์ → เกม) */
    ritual?: boolean;
    /** Teacher: deep-link create assignment with worksheet attached */
    showAssignLink?: boolean;
    /** Parent: link to homework portal with worksheet hint + local practiced toggle */
    childId?: string | null;
    practiced?: boolean;
    onTogglePracticed?: () => void;
    /** Graded homework feedback matched by worksheet attachment URL */
    feedback?: PackFeedback | null;
    className?: string;
};

function packRoles(pack: LessonPack) {
    const media = pack.items?.find((i) => i.role === 'media');
    const worksheet = pack.items?.find((i) => i.role === 'worksheet');
    const game = pack.items?.find((i) => i.role === 'game');
    return { media, worksheet, game };
}

export function LessonPackCard({
    pack,
    ritual = true,
    showAssignLink = false,
    childId,
    practiced,
    onTogglePracticed,
    feedback,
    className,
}: LessonPackCardProps) {
    const { media, worksheet, game } = packRoles(pack);
    const mediaUrl = media?.item?.external_url ?? null;
    const wsUrl = worksheet?.item?.external_url ?? null;
    const gameUrl = game?.item?.external_url ?? null;

    const assignHref =
        showAssignLink && wsUrl
            ? `/teacher/assignments?attach=${encodeURIComponent(wsUrl)}&title=${encodeURIComponent(pack.title)}&subject=${encodeURIComponent(pack.subject ?? '')}`
            : null;

    const practiceHref = wsUrl
        ? `/parent/assignments?worksheet=${encodeURIComponent(wsUrl)}&pack=${encodeURIComponent(pack.title)}`
        : '/parent/assignments';

    return (
        <Card className={cn('overflow-hidden', className)}>
            <CardContent className="p-0">
                {pack.thumbnail_url ? (
                    <img
                        src={pack.thumbnail_url}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="aspect-video w-full object-cover bg-muted"
                    />
                ) : (
                    <div className="flex aspect-video items-center justify-center bg-muted">
                        <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                )}
                <div className="space-y-2 p-3">
                    <p className="font-semibold line-clamp-2">{pack.title}</p>
                    {pack.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{pack.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1">
                        {pack.subject && (
                            <Badge variant="outline" className="text-[10px]">
                                {pack.subject}
                            </Badge>
                        )}
                        {pack.grade_levels?.slice(0, 3).map((g) => (
                            <Badge key={g} variant="secondary" className="text-[10px]">
                                {g}
                            </Badge>
                        ))}
                        {feedback && (
                            <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">
                                ครูให้คะแนนแล้ว
                                {feedback.score != null
                                    ? ` · ${feedback.score}${feedback.maxScore != null ? `/${feedback.maxScore}` : ''}`
                                    : ''}
                            </Badge>
                        )}
                    </div>

                    {feedback?.comment && (
                        <p className="text-xs text-muted-foreground line-clamp-2 border-l-2 border-primary/40 pl-2">
                            “{feedback.comment}”
                        </p>
                    )}

                    {ritual && (
                        <p className="text-[10px] text-muted-foreground pt-0.5">
                            ลำดับสอน: สื่อ → พิมพ์ใบงาน → เกมเสริม
                        </p>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                        {mediaUrl && (
                            <Button size="sm" variant="outline" className="h-8 text-xs" asChild>
                                <a href={mediaUrl} target="_blank" rel="noopener noreferrer">
                                    <BookOpen className="mr-1 h-3.5 w-3.5" />
                                    {ritual ? '1. เปิดสื่อ' : 'เปิดสื่อ'}
                                </a>
                            </Button>
                        )}
                        {wsUrl && (
                            <Button size="sm" className="h-8 text-xs" asChild>
                                <a href={wsUrl} target="_blank" rel="noopener noreferrer">
                                    <FileText className="mr-1 h-3.5 w-3.5" />
                                    {ritual ? '2. พิมพ์ใบงาน' : 'เปิดใบงาน'}
                                </a>
                            </Button>
                        )}
                        {gameUrl && (
                            <Button size="sm" variant="secondary" className="h-8 text-xs" asChild>
                                <a href={gameUrl} target="_blank" rel="noopener noreferrer">
                                    <Gamepad2 className="mr-1 h-3.5 w-3.5" />
                                    {ritual ? '3. เล่นเกม' : 'เล่นเกม'}
                                </a>
                            </Button>
                        )}
                    </div>

                    {(assignHref || childId) && (
                        <div className="flex flex-wrap gap-2 pt-1 border-t border-border mt-1">
                            {assignHref && (
                                <Button size="sm" variant="ghost" className="h-8 text-xs px-2" asChild>
                                    <Link to={assignHref}>
                                        <ClipboardList className="mr-1 h-3.5 w-3.5" />
                                        มอบหมายงาน
                                    </Link>
                                </Button>
                            )}
                            {childId && (
                                <>
                                    <Button
                                        size="sm"
                                        variant={practiced ? 'secondary' : 'ghost'}
                                        className="h-8 text-xs px-2"
                                        type="button"
                                        onClick={onTogglePracticed}
                                    >
                                        <Check className={cn('mr-1 h-3.5 w-3.5', practiced && 'text-primary')} />
                                        {practiced ? 'ฝึกแล้ว' : 'บันทึกว่าฝึกแล้ว'}
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-8 text-xs px-2" asChild>
                                        <Link to={practiceHref}>
                                            ส่งงาน / ดูความเห็นครู
                                        </Link>
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
