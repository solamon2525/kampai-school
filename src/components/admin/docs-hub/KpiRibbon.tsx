import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type KpiTile = {
    key: string;
    label: string;
    value: number | string;
    icon: LucideIcon;
    tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
    hint?: string;
    onClick?: () => void;
};

const TONE_CLASS: Record<NonNullable<KpiTile['tone']>, string> = {
    primary: 'text-primary bg-primary/10',
    success: 'text-emerald-600 bg-emerald-500/10',
    warning: 'text-amber-600 bg-amber-500/10',
    danger:  'text-destructive bg-destructive/10',
    info:    'text-sky-600 bg-sky-500/10',
    muted:   'text-muted-foreground bg-muted',
};

interface KpiRibbonProps {
    tiles: KpiTile[];
    loading?: boolean;
    className?: string;
}

export const KpiRibbon = ({ tiles, loading, className }: KpiRibbonProps) => (
    <div
        className={cn(
            'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3',
            className,
        )}
    >
        {tiles.map((t) => {
            const Icon = t.icon;
            const tone = TONE_CLASS[t.tone ?? 'primary'];
            return (
                <Card
                    key={t.key}
                    className={cn(
                        'transition-shadow',
                        t.onClick && 'cursor-pointer hover:shadow-md',
                    )}
                    onClick={t.onClick}
                >
                    <CardContent className="p-4 flex items-center gap-3">
                        <span
                            className={cn(
                                'flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl',
                                tone,
                            )}
                        >
                            <Icon className="w-5 h-5" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-2xl font-bold leading-none">
                                {loading ? '–' : t.value}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                                {t.label}
                            </p>
                            {t.hint ? (
                                <p className="text-[11px] text-muted-foreground/70 truncate">
                                    {t.hint}
                                </p>
                            ) : null}
                        </div>
                    </CardContent>
                </Card>
            );
        })}
    </div>
);
