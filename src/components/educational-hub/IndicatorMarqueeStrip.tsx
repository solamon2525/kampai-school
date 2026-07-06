import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { GameCardIndicator } from '@/services/curriculum.service';

interface Props {
    indicators: GameCardIndicator[];
    className?: string;
}

const MARQUEE_SPEED_S = 22;

/** แถบสไลด์ตัวชี้วัดบนการ์ดเกม — วนซ้ายอัตโนมัติ หยุดเมื่อชี้ */
export const IndicatorMarqueeStrip = ({ indicators, className }: Props) => {
    const [paused, setPaused] = useState(false);

    if (indicators.length === 0) {
        return (
            <div
                className={cn(
                    'h-6 flex items-center justify-center rounded-md border border-dashed border-border/80 bg-muted/30',
                    className,
                )}
                title="ยังไม่ผูกตัวชี้วัดหลักสูตร"
            >
                <span className="text-[10px] text-muted-foreground/70 font-medium tracking-wide">
                    ทดสอบ
                </span>
            </div>
        );
    }

    const chips = indicators.map((ind) => (
        <Badge
            key={ind.indicator_code}
            variant="outline"
            className={cn(
                'shrink-0 text-[9px] px-1.5 py-0 h-5 font-semibold border-primary/25 bg-primary/5',
                ind.grade === 'ป.4' && 'border-primary/40',
            )}
            title={`${ind.indicator_code} — ${ind.description}`}
        >
            {ind.indicator_code}
        </Badge>
    ));

    const doubled = [...chips, ...chips];

    return (
        <div
            className={cn('overflow-hidden h-6 rounded-md bg-muted/20', className)}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
            title={indicators.map((i) => i.indicator_code).join(' · ')}
        >
            <div
                className="news-ticker-track flex w-max items-center gap-1.5 px-1 h-full"
                style={{
                    animationDuration: `${MARQUEE_SPEED_S}s`,
                    animationPlayState: paused ? 'paused' : 'running',
                }}
            >
                {doubled}
            </div>
        </div>
    );
};
