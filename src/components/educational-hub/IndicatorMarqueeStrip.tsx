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
/** สูง 2 แถวคงที่ — แถวล่างเว้นว่างเสมอ ไม่ดึง leaderboard ขึ้น */
const SLOT_H = 'h-[3.125rem]';
const ROW_H = 'h-6';

/** แถบสไลด์ตัวชี้วัดบนการ์ดเกม — วนซ้ายอัตโนมัติ หยุดเมื่อชี้ (สูงสุด 6 ตัว) */
export const IndicatorMarqueeStrip = ({ indicators, className }: Props) => {
    const [paused, setPaused] = useState(false);
    const visible = indicators.slice(0, MAX_VISIBLE);
    const fullTitle = indicators
        .map((i) => `${i.indicator_code}${i.grade === 'ป.4' ? ' (ป.4)' : ''}`)
        .join(' · ');

    const row1 =
        indicators.length === 0 ? (
            <div
                className={cn(
                    ROW_H,
                    'flex items-center justify-center rounded border border-dashed border-border bg-muted/50',
                )}
                title="ยังไม่ผูกตัวชี้วัดหลักสูตร"
            >
                <span className="text-[10px] text-muted-foreground font-medium tracking-wide">
                    ทดสอบ
                </span>
            </div>
        ) : (
            <div
                className={cn(ROW_H, 'overflow-hidden rounded bg-muted/60')}
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
                    className="news-ticker-track flex w-max items-center gap-2.5 px-1 h-full"
                    style={{
                        animationDuration: `${MARQUEE_SPEED_S}s`,
                        animationPlayState: paused ? 'paused' : 'running',
                    }}
                >
                    {[...visible, ...visible].map((ind, idx) => (
                        <Badge
                            key={`${ind.indicator_code}-${idx}`}
                            variant="outline"
                            className={cn(
                                'shrink-0 text-[10px] px-2 py-0 h-5 font-semibold leading-none',
                                'bg-muted text-foreground border-border',
                                ind.grade === 'ป.4' && 'border-primary/35',
                            )}
                            title={`${ind.indicator_code} — ${ind.description}`}
                        >
                            {ind.indicator_code}
                        </Badge>
                    ))}
                </div>
            </div>
        );

    return (
        <div className={cn(SLOT_H, 'flex flex-col gap-0.5 shrink-0', className)}>
            {row1}
            <div className={cn(ROW_H, 'shrink-0')} aria-hidden />
        </div>
    );
};
