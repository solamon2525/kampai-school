import { useState } from 'react';
import { FileText, ExternalLink, Play, Type, Download, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
    educationalHubService,
    formatFileSize,
    youtubeThumbnail,
    type EduHubItem,
} from '@/services/educational-hub.service';

interface Props {
    item: EduHubItem;
}

export const EduHubItemCard = ({ item }: Props) => {
    const [openDialog, setOpenDialog] = useState(false);

    const trackView = () => {
        void Promise.resolve(educationalHubService.incrementView(item.id)).catch(() => {});
    };
    const trackDownload = () => {
        void Promise.resolve(educationalHubService.incrementDownload(item.id)).catch(() => {});
    };

    const handleClick = () => {
        if (item.item_type === 'file' && item.file_url) {
            trackDownload();
            window.open(item.file_url, '_blank', 'noopener,noreferrer');
        } else if (item.item_type === 'link' && item.external_url) {
            trackView();
            window.open(item.external_url, '_blank', 'noopener,noreferrer');
        } else if (item.item_type === 'youtube' || item.item_type === 'text') {
            trackView();
            setOpenDialog(true);
        }
    };

    return (
        <>
            <Card
                onClick={handleClick}
                className="group cursor-pointer overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5"
            >
                {/* Media preview */}
                <ItemThumbnail item={item} />

                {/* Body */}
                <div className="p-3 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                            {item.title}
                        </h4>
                        <TypeIcon item={item} />
                    </div>
                    {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                    )}

                    {/* Meta row */}
                    <div className="flex items-center justify-between pt-2 text-[10px] text-muted-foreground">
                        <div className="flex items-center gap-2 flex-wrap">
                            {item.subject && <Badge variant="outline" className="text-[10px]">{item.subject}</Badge>}
                            {item.grade_levels?.slice(0, 2).map((g) => (
                                <Badge key={g} variant="outline" className="text-[10px]">{g}</Badge>
                            ))}
                        </div>
                        <ActionStat item={item} />
                    </div>
                </div>
            </Card>

            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
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
        </>
    );
};

// ──────────────────────────────────────────────────────────────────────────
const ItemThumbnail = ({ item }: { item: EduHubItem }) => {
    if (item.thumbnail_url) {
        return (
            <div className="aspect-video w-full overflow-hidden bg-muted">
                <img
                    src={item.thumbnail_url}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
            </div>
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
            <span className="inline-flex items-center gap-1">
                <Download className="h-3 w-3" />
                {item.file_size ? formatFileSize(item.file_size) : 'ดาวน์โหลด'}
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {item.view_count}
        </span>
    );
};
