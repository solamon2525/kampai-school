import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type CategoryCardTone =
    | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'muted';

const TONE_RING: Record<CategoryCardTone, string> = {
    primary: 'before:bg-primary',
    success: 'before:bg-emerald-500',
    warning: 'before:bg-amber-500',
    danger:  'before:bg-destructive',
    info:    'before:bg-sky-500',
    accent:  'before:bg-orange-500',
    muted:   'before:bg-muted-foreground/40',
};

const TONE_ICON_BG: Record<CategoryCardTone, string> = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-500/10 text-emerald-600',
    warning: 'bg-amber-500/10 text-amber-600',
    danger:  'bg-destructive/10 text-destructive',
    info:    'bg-sky-500/10 text-sky-600',
    accent:  'bg-orange-500/10 text-orange-600',
    muted:   'bg-muted text-muted-foreground',
};

interface CategoryCardProps {
    label: string;
    description?: string | null;
    icon: LucideIcon;
    emoji?: string | null;
    tone?: CategoryCardTone;
    count?: number | string | null;
    badge?: string | null;
    onClick: () => void;
}

export const CategoryCard = ({
    label, description, icon: Icon, emoji, tone = 'primary', count, badge, onClick,
}: CategoryCardProps) => (
    <Card
        onClick={onClick}
        className={cn(
            'relative cursor-pointer overflow-hidden transition-all',
            'hover:-translate-y-0.5 hover:shadow-md',
            "before:absolute before:left-0 before:top-0 before:right-0 before:h-0.5 before:opacity-0",
            'before:transition-opacity hover:before:opacity-100',
            TONE_RING[tone],
        )}
    >
        <div className="p-4 flex items-start gap-3">
            <span
                className={cn(
                    'flex-shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-xl text-xl',
                    TONE_ICON_BG[tone],
                )}
                aria-hidden
            >
                {emoji ?? <Icon className="w-5 h-5" />}
            </span>
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-foreground leading-tight">
                        {label}
                    </p>
                    {badge ? (
                        <Badge variant="secondary" className="text-[10px]">{badge}</Badge>
                    ) : null}
                </div>
                {description ? (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {description}
                    </p>
                ) : null}
                {count !== undefined && count !== null ? (
                    <p className="mt-2 text-xs font-medium text-muted-foreground">
                        {count}
                    </p>
                ) : null}
            </div>
        </div>
    </Card>
);
