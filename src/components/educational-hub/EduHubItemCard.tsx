import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    FileText, ExternalLink, Play, Type, Download, Eye, Star, PlayCircle, Maximize2,
    GripVertical, Gamepad2, Pin, Loader2,
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
    educationalHubService,
    formatFileSize,
    youtubeThumbnail,
    type EduHubItem,
} from '@/services/educational-hub.service';
import { gamePlayService } from '@/services/game-play.service';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { GameDemoPreview } from './GameDemoPreview';
import { GameCoverThumb } from './GameCoverThumb';
import type { ViewMode } from '@/hooks/useViewMode';

interface Props {
    item: EduHubItem;
    viewMode?: ViewMode;
    isFavorite?: boolean;
    /** If provided, renders a ⭐ button (toggle on click) */
    onToggleFavorite?: () => void;
    /** Admin-only — shows a drag handle and registers with parent SortableContext */
    editable?: boolean;
    /** ปักหมุดคลังเกม (global) */
    libraryPinned?: boolean;
    showLibraryPinControl?: boolean;
    onToggleLibraryPin?: () => void;
    libraryPinLoading?: boolean;
}

export const EduHubItemCard = ({
    item: originalItem,
    viewMode = 'grid',
    isFavorite = false,
    onToggleFavorite,
    editable = false,
    libraryPinned = false,
    showLibraryPinControl = false,
    onToggleLibraryPin,
    libraryPinLoading = false,
}: Props) => {
    // Redefine item with backward compatibility mapping
    const item = originalItem.game_slug === 'multiply-rally' || originalItem.external_url?.includes('/multiply-rally/')
        ? {
            ...originalItem,
            game_slug: originalItem.game_slug === 'multiply-rally' ? 'math-rally' : originalItem.game_slug,
            external_url: originalItem.external_url?.replace('/multiply-rally/', '/math-rally/') || null,
            thumbnail_url: originalItem.thumbnail_url?.replace('/multiply-rally/', '/math-rally/') || null,
          }
        : originalItem;
    const [openDialog, setOpenDialog] = useState(false);
    const [embedOpen, setEmbedOpen] = useState(false);
    const navigate = useNavigate();

    // Sortable — always called (hook ordering), no-op when not editable
    const sortable = useSortable({ id: item.id, disabled: !editable });
    const sortableStyle: React.CSSProperties = {
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
        opacity: sortable.isDragging ? 0.5 : 1,
    };

    // Leaderboard strip — only for tracked games in non-compact views
    const isCompact = viewMode === 'compact';
    const { data: leaders } = useQuery({
        queryKey: ['game-leaderboard-card', item.game_slug],
        queryFn: () => gamePlayService.getLeaderboard(item.game_slug!, 5),
        enabled: !isCompact && !!item.game_slug && item.tracked_game,
        staleTime: 5 * 60 * 1000,
    });

    const trackView = () => {
        void Promise.resolve(educationalHubService.incrementView(item.id)).catch(() => {});
    };
    const trackDownload = () => {
        void Promise.resolve(educationalHubService.incrementDownload(item.id)).catch(() => {});
    };

    const handleClick = () => {
        if (item.game_slug === 'english-quest') {
            trackView();
            navigate('/english-quest');
            return;
        }
        if (item.tracked_game && item.game_slug) {
            trackView();
            navigate(`/play/${item.game_slug}`);
            return;
        }
        if (item.item_type === 'file' && item.file_url) {
            trackDownload();
            window.open(item.file_url, '_blank', 'noopener,noreferrer');
        } else if (item.item_type === 'link' && item.external_url) {
            trackView();
            // For external links, default click opens in new tab.
            // "เล่นในหน้านี้" button (below) lets users embed without leaving.
            window.open(item.external_url, '_blank', 'noopener,noreferrer');
        } else if (item.item_type === 'youtube' || item.item_type === 'text') {
            trackView();
            setOpenDialog(true);
        }
    };

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleFavorite?.();
    };

    const handleLibraryPinClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleLibraryPin?.();
    };

    const handleEmbedClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        trackView();
        setEmbedOpen(true);
    };

    // ─── COMPACT view: single-row list item ────────────────────────────
    if (isCompact) {
        return (
            <>
                <Card
                    ref={sortable.setNodeRef}
                    style={sortableStyle}
                    onClick={handleClick}
                    className="group cursor-pointer flex items-center gap-3 p-2.5 hover:shadow-sm transition-all hover:bg-accent/30"
                >
                    {editable && (
                        <button
                            type="button"
                            {...sortable.attributes}
                            {...sortable.listeners}
                            onClick={(e) => e.stopPropagation()}
                            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none shrink-0"
                            aria-label="ลากเพื่อจัดลำดับ"
                        >
                            <GripVertical className="h-4 w-4" />
                        </button>
                    )}
                    <CompactThumb item={item} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <TypeIcon item={item} />
                            <h4 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                {item.title}
                            </h4>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                            {item.subject && <span>{item.subject}</span>}
                            {item.subject && <span>·</span>}
                            <span className="inline-flex items-center gap-0.5">
                                <Eye className="h-3 w-3" />{item.view_count}
                            </span>
                        </div>
                    </div>
                    <CardActions
                        item={item}
                        isFavorite={isFavorite}
                        onToggleFavorite={onToggleFavorite ? handleFavoriteClick : undefined}
                        onEmbed={item.item_type === 'link' ? handleEmbedClick : undefined}
                        libraryPinned={libraryPinned}
                        showLibraryPinControl={showLibraryPinControl}
                        onToggleLibraryPin={onToggleLibraryPin ? handleLibraryPinClick : undefined}
                        libraryPinLoading={libraryPinLoading}
                        compact
                    />
                </Card>
                <DetailDialog item={item} open={openDialog} onOpenChange={setOpenDialog} />
                <EmbedDialog item={item} open={embedOpen} onOpenChange={setEmbedOpen} />
            </>
        );
    }

    // ─── GRID + SPOTLIGHT view: card layout ────────────────────────────
    const isSpotlight = viewMode === 'spotlight';

    return (
        <>
            <Card
                ref={sortable.setNodeRef}
                style={sortableStyle}
                onClick={handleClick}
                className={cn(
                    'group cursor-pointer overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 relative flex flex-col h-full',
                    isSpotlight && 'shadow-sm',
                    sortable.isDragging && 'ring-2 ring-primary',
                )}
            >
                {/* Drag handle overlay (top-left, admin only) */}
                {editable && (
                    <button
                        type="button"
                        {...sortable.attributes}
                        {...sortable.listeners}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-2 left-2 z-10 h-7 w-7 rounded-full bg-background/90 backdrop-blur flex items-center justify-center shadow-sm hover:bg-background hover:scale-110 transition-transform cursor-grab active:cursor-grabbing touch-none"
                        aria-label="ลากเพื่อจัดลำดับ"
                        title="ลากเพื่อจัดลำดับ"
                    >
                        <GripVertical className="h-3.5 w-3.5 text-foreground" />
                    </button>
                )}

                {/* Favorite + Embed action overlay (top-right) */}
                <div className="absolute top-2 right-2 z-10 flex gap-1">
                    {item.item_type === 'link' && item.external_url && (
                        <button
                            type="button"
                            onClick={handleEmbedClick}
                            className="h-7 w-7 rounded-full bg-background/90 backdrop-blur flex items-center justify-center shadow-sm hover:bg-background hover:scale-110 transition-transform"
                            aria-label="เล่นในหน้านี้"
                            title="เล่นในหน้านี้"
                        >
                            <Maximize2 className="h-3.5 w-3.5 text-foreground" />
                        </button>
                    )}
                    {showLibraryPinControl && onToggleLibraryPin && (
                        <button
                            type="button"
                            onClick={handleLibraryPinClick}
                            disabled={libraryPinLoading}
                            className="h-7 w-7 rounded-full bg-background/90 backdrop-blur flex items-center justify-center shadow-sm hover:bg-background hover:scale-110 transition-transform disabled:opacity-60"
                            aria-label={libraryPinned ? 'ปลดหมุดคลัง' : 'ปักหมุดคลัง'}
                            aria-pressed={libraryPinned}
                            title={libraryPinned ? 'ปักหมุดคลัง (มีผลทุกเครื่อง)' : 'ปักหมุดคลัง (มีผลทุกเครื่อง)'}
                        >
                            {libraryPinLoading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                            ) : (
                                <Pin
                                    className={cn(
                                        'h-3.5 w-3.5 transition-colors',
                                        libraryPinned ? 'fill-primary text-primary' : 'text-muted-foreground',
                                    )}
                                />
                            )}
                        </button>
                    )}
                    {onToggleFavorite && (
                        <button
                            type="button"
                            onClick={handleFavoriteClick}
                            className="h-7 w-7 rounded-full bg-background/90 backdrop-blur flex items-center justify-center shadow-sm hover:bg-background hover:scale-110 transition-transform"
                            aria-label={isFavorite ? 'ลบจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
                            aria-pressed={isFavorite}
                            title={isFavorite ? 'รายการโปรด' : 'เพิ่มในรายการโปรด'}
                        >
                            <Star
                                className={cn(
                                    'h-3.5 w-3.5 transition-colors',
                                    isFavorite ? 'fill-amber-400 text-amber-500' : 'text-muted-foreground',
                                )}
                            />
                        </button>
                    )}
                </div>

                {/* Media preview */}
                <ItemThumbnail item={item} />

                {/* Body */}
                <div className={cn('p-3 space-y-1 flex-1 flex flex-col', isSpotlight && 'p-4 space-y-2')}>
                    <div className="flex items-start justify-between gap-2">
                        <h4 className={cn(
                            'font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors',
                            isSpotlight ? 'text-base' : 'text-sm',
                        )}>
                            {item.title}
                        </h4>
                        <TypeIcon item={item} />
                    </div>
                    {item.description && (
                        <p className={cn(
                            'text-muted-foreground',
                            isSpotlight ? 'text-sm line-clamp-3' : 'text-xs line-clamp-2',
                        )}>
                            {item.description}
                        </p>
                    )}

                    {/* Meta row */}
                    <div className="flex items-center justify-between pt-2 text-[10px] text-muted-foreground gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {item.subject && <Badge variant="outline" className="text-[10px]">{item.subject}</Badge>}
                            {item.tracked_game && (
                                <Badge variant="secondary" className="gap-1 text-[10px]">
                                    <Gamepad2 className="h-3 w-3" />
                                    เก็บคะแนน
                                </Badge>
                            )}
                            {libraryPinned && (
                                <Badge variant="outline" className="gap-1 text-[10px] border-primary/40 text-primary">
                                    <Pin className="h-3 w-3" />
                                    ปักหมุด
                                </Badge>
                            )}
                            {item.grade_levels?.slice(0, 2).map((g) => (
                                <Badge key={g} variant="outline" className="text-[10px]">{g}</Badge>
                            ))}
                            {item.tags?.slice(0, isSpotlight ? 4 : 2).map((t) => (
                                <Badge key={t} variant="secondary" className="text-[10px]">#{t}</Badge>
                            ))}
                        </div>
                        <ActionStat item={item} />
                    </div>

                    {/* Leaderboard strip — top-5 players; pin ล่างสุด (mt-auto) + กันแถวไว้เสมอ → ทุกการ์ดอยู่แนวเดียวกัน */}
                    {item.tracked_game && item.game_slug && (
                        <div className="mt-auto pt-2 border-t border-border min-h-[2.75rem] flex items-center">
                            {(leaders?.length ?? 0) > 0 ? (
                                <div className="flex items-end justify-around w-full">
                                    {leaders!.map((row, i) => (
                                        <div
                                            key={row.student_id}
                                            className="flex flex-col items-center gap-0.5 min-w-0"
                                            title={`${i + 1}. ${row.display_name} — ${row.personal_best.toLocaleString('th-TH')} คะแนน`}
                                        >
                                            <div className="relative">
                                                <PersonAvatar name={row.display_name} photoUrl={row.photo_url} size="xs" />
                                                <span className="absolute -top-1 -left-1 text-[8px] font-bold bg-primary text-primary-foreground rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none shadow-sm">
                                                    {i + 1}
                                                </span>
                                            </div>
                                            <span className="text-[8px] text-muted-foreground font-medium leading-none">
                                                {row.personal_best.toLocaleString('th-TH')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <span className="w-full text-center text-[10px] text-muted-foreground/60">
                                    ยังไม่มีผู้เล่น — เป็นคนแรกเลย!
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </Card>

            <DetailDialog item={item} open={openDialog} onOpenChange={setOpenDialog} />
            <EmbedDialog item={item} open={embedOpen} onOpenChange={setEmbedOpen} />
        </>
    );
};

// ─── Sub-components ─────────────────────────────────────────────────────────

const CardActions = ({
    item,
    isFavorite,
    onToggleFavorite,
    onEmbed,
    libraryPinned = false,
    showLibraryPinControl = false,
    onToggleLibraryPin,
    libraryPinLoading = false,
    compact,
}: {
    item: EduHubItem;
    isFavorite: boolean;
    onToggleFavorite?: (e: React.MouseEvent) => void;
    onEmbed?: (e: React.MouseEvent) => void;
    libraryPinned?: boolean;
    showLibraryPinControl?: boolean;
    onToggleLibraryPin?: (e: React.MouseEvent) => void;
    libraryPinLoading?: boolean;
    compact?: boolean;
}) => (
    <div className="flex items-center gap-1 shrink-0">
        {item.item_type === 'link' && onEmbed && (
            <Button
                size="icon"
                variant="ghost"
                onClick={onEmbed}
                className={compact ? 'h-7 w-7' : 'h-8 w-8'}
                title="เล่นในหน้านี้"
            >
                <PlayCircle className="h-4 w-4" />
            </Button>
        )}
        {showLibraryPinControl && onToggleLibraryPin && (
            <Button
                size="icon"
                variant="ghost"
                onClick={onToggleLibraryPin}
                disabled={libraryPinLoading}
                className={compact ? 'h-7 w-7' : 'h-8 w-8'}
                title={libraryPinned ? 'ปลดหมุดคลัง' : 'ปักหมุดคลัง'}
                aria-pressed={libraryPinned}
            >
                {libraryPinLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Pin
                        className={cn(
                            'h-4 w-4',
                            libraryPinned ? 'fill-primary text-primary' : 'text-muted-foreground',
                        )}
                    />
                )}
            </Button>
        )}
        {onToggleFavorite && (
            <Button
                size="icon"
                variant="ghost"
                onClick={onToggleFavorite}
                className={compact ? 'h-7 w-7' : 'h-8 w-8'}
                title={isFavorite ? 'รายการโปรด' : 'เพิ่มในรายการโปรด'}
                aria-pressed={isFavorite}
            >
                <Star
                    className={cn(
                        'h-4 w-4',
                        isFavorite ? 'fill-amber-400 text-amber-500' : 'text-muted-foreground',
                    )}
                />
            </Button>
        )}
    </div>
);

const CompactThumb = ({ item }: { item: EduHubItem }) => {
    if (item.thumbnail_url) {
        return (
            <img
                src={item.thumbnail_url}
                alt=""
                loading="lazy"
                className="h-10 w-14 object-contain bg-muted rounded shrink-0"
            />
        );
    }
    if (item.item_type === 'youtube' && item.youtube_id) {
        return (
            <img
                src={youtubeThumbnail(item.youtube_id, 'hq')}
                alt=""
                loading="lazy"
                className="h-10 w-14 object-cover rounded shrink-0"
            />
        );
    }
    return <div className="h-10 w-14 bg-muted rounded shrink-0" />;
};

const ItemThumbnail = ({ item }: { item: EduHubItem }) => {
    if (item.thumbnail_url) {
        // กริดวิดีโอ: มีรูปปก + คลิปเดโม → โชว์ปก 2 วิ แล้วเล่นเดโมอัตโนมัติ (เฉพาะการ์ดในจอ)
        if (item.preview_video_url) {
            return (
                <GameDemoPreview
                    cover={item.thumbnail_url}
                    video={item.preview_video_url}
                    title={item.title}
                />
            );
        }
        return (
            <GameCoverThumb src={item.thumbnail_url!} alt={item.title} />
        );
    }

    if (item.item_type === 'youtube' && item.youtube_id) {
        return (
            <div className="aspect-video w-full overflow-hidden bg-black relative">
                <img
                    src={youtubeThumbnail(item.youtube_id, 'hq')}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                        <Play className="h-5 w-5 text-white fill-white ml-0.5" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'aspect-video w-full flex items-center justify-center',
                item.item_type === 'file' && 'bg-primary/5',
                item.item_type === 'link' && 'bg-accent/10',
                item.item_type === 'text' && 'bg-muted/40',
            )}
        >
            {item.item_type === 'file' && <FileText className="h-12 w-12 text-primary/60" />}
            {item.item_type === 'link' && <ExternalLink className="h-12 w-12 text-accent-foreground/60" />}
            {item.item_type === 'text' && <Type className="h-12 w-12 text-muted-foreground/60" />}
        </div>
    );
};

const TypeIcon = ({ item }: { item: EduHubItem }) => {
    const cls = 'h-3.5 w-3.5 flex-shrink-0 text-muted-foreground';
    if (item.item_type === 'file') return <FileText className={cls} />;
    if (item.item_type === 'link') return <ExternalLink className={cls} />;
    if (item.item_type === 'youtube') return <Play className={cls} />;
    return <Type className={cls} />;
};

const ActionStat = ({ item }: { item: EduHubItem }) => {
    if (item.item_type === 'file') {
        return (
            <span className="inline-flex items-center gap-1 shrink-0">
                <Download className="h-3 w-3" />
                {item.file_size ? formatFileSize(item.file_size) : 'ดาวน์โหลด'}
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 shrink-0">
            <Eye className="h-3 w-3" />
            {item.view_count}
        </span>
    );
};

const DetailDialog = ({
    item, open, onOpenChange,
}: { item: EduHubItem; open: boolean; onOpenChange: (v: boolean) => void }) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle>{item.title}</DialogTitle>
            </DialogHeader>
            {item.item_type === 'youtube' && item.youtube_id && (
                <div className="aspect-video w-full overflow-hidden rounded-md bg-black">
                    <iframe
                        src={`https://www.youtube.com/embed/${item.youtube_id}?rel=0`}
                        title={item.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                    />
                </div>
            )}
            {item.item_type === 'text' && item.body_html && (
                <div
                    className="prose prose-sm max-w-none text-foreground"
                    // body_html stored by teachers/admins — same trust level as news.content_html
                    dangerouslySetInnerHTML={{ __html: item.body_html }}
                />
            )}
            {item.description && item.item_type !== 'text' && (
                <p className="text-sm text-muted-foreground">{item.description}</p>
            )}
        </DialogContent>
    </Dialog>
);

const EmbedDialog = ({
    item, open, onOpenChange,
}: { item: EduHubItem; open: boolean; onOpenChange: (v: boolean) => void }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const navHandler = (e: MessageEvent) => {
            const d = e.data as { type?: string; to?: string } | undefined;
            if (d?.type === 'navigate' && typeof d.to === 'string' && d.to.startsWith('/')) {
                onOpenChange(false);
                navigate(d.to);
            }
        };
        window.addEventListener('message', navHandler);
        return () => window.removeEventListener('message', navHandler);
    }, [navigate, onOpenChange]);

    const handleIframeLoad = useCallback(() => {
        if (item.tracked_game) return;
        iframeRef.current?.contentWindow?.postMessage({
            type: 'init',
            hubUrl: window.location.pathname,
            media: true,
        }, '*');
    }, [item.tracked_game]);

    if (!item.external_url) return null;
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 flex flex-col gap-0">
                <DialogHeader className="px-4 py-3 border-b border-border">
                    <DialogTitle className="text-base flex items-center justify-between gap-3 pr-8">
                        <span className="truncate">{item.title}</span>
                        <a
                            href={item.external_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-normal text-primary hover:underline inline-flex items-center gap-1 shrink-0"
                        >
                            <ExternalLink className="h-3 w-3" /> เปิดเต็มจอ
                        </a>
                    </DialogTitle>
                </DialogHeader>
                <iframe
                    ref={iframeRef}
                    src={item.external_url}
                    title={item.title}
                    className="flex-1 w-full border-0"
                    sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-modals allow-forms"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; pointer-lock"
                    allowFullScreen
                    onLoad={handleIframeLoad}
                />
            </DialogContent>
        </Dialog>
    );
};
