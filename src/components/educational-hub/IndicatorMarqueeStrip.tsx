import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { GameCardIndicator } from '@/services/curriculum.service';

interface Props {
    indicators: GameCardIndicator[];
    className?: string;
}

const MARQUEE_SPEED_S = 22;
const MAX_VISIBLE = 6;
const STRIP_H = 'h-5';

/** แถบสไลด์ตัวชี้วัดบนการ์ดเกม — วนซ้ายอัตโนมัติ หยุดเมื่อชี้ (สูงสุด 6 ตัว) */
export const IndicatorMarqueeStrip = ({ indicators, className }: Props) => {
    const [paused, setPaused] = useState(false);
    const visible = indicators.slice(0, MAX_VISIBLE);
    const fullTitle = indicators
        .map((i) => `${i.indicator_code}${i.grade === 'ป.4' ? ' (ป.4)' : ''}`)
        .join(' · ');

    if (indicators.length === 0) {
        return (
            <div
                className={cn(
                    STRIP_H,
                    'flex items-center justify-center rounded border border-dashed border-border bg-muted/50',
                    className,
                )}
                title="ยังไม่ผูกตัวชี้วัดหลักสูตร"
            >
                <span className="text-[9px] text-muted-foreground font-medium tracking-wide">
                    ทดสอบ
                </span>
            </div>
        );
    }

    const chips = visible.map((ind) => (
        <Badge
            key={ind.indicator_code}
            variant="outline"
            className={cn(
                'shrink-0 text-[8px] px-1 py-0 h-4 font-semibold leading-none',
                'bg-muted text-foreground border-border',
                ind.grade === 'ป.4' && 'border-primary/35',
            )}
            title={`${ind.indicator_code} — ${ind.description}`}
        >
            {ind.indicator_code}
        </Badge>
    ));

    const doubled = [...chips, ...chips];

    return (
        <div
            className={cn(STRIP_H, 'overflow-hidden rounded bg-muted/60', className)}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
            title={
                indicators.length > MAX_VISIBLE
                    ? `${fullTitle} (+${indicators.length - MAX_VISIBLE} อื่น)`
                    : fullTitle
            }
        >
            <div
                className="news-ticker-track flex w-max items-center gap-1 px-0.5 h-full"
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
