import { useState } from 'react';
import { cn } from '@/lib/utils';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import type { LeaderboardRow } from '@/services/game-play.service';

interface Props {
    leaders: LeaderboardRow[];
    className?: string;
}

const MARQUEE_SPEED_S = 28;
const STRIP_H = 'h-5';

/** แถบสไลด์อันดับ 1–10 บนการ์ดเกม — วนซ้ายอัตโนมัติ หยุดเมื่อชี้ */
export const LeaderboardMarqueeStrip = ({ leaders, className }: Props) => {
    const [paused, setPaused] = useState(false);

    if (leaders.length === 0) return null;

    const chips = leaders.map((row, i) => (
        <div
            key={row.student_id}
            className="shrink-0 flex items-center gap-0.5 rounded border border-border bg-muted/80 px-0.5 h-4"
            title={`${i + 1}. ${row.display_name} — ${row.personal_best.toLocaleString('th-TH')} คะแนน`}
        >
            <span className="text-[7px] font-bold text-primary leading-none w-3 text-center shrink-0">
                {i + 1}
            </span>
            <PersonAvatar
                name={row.display_name}
                photoUrl={row.photo_url}
                size="xs"
                className="h-3.5 w-3.5 text-[7px]"
            />
            <span className="text-[7px] text-foreground font-medium leading-none pr-0.5 tabular-nums">
                {row.personal_best.toLocaleString('th-TH')}
            </span>
        </div>
    ));

    const doubled = chips.length > 1 ? [...chips, ...chips] : chips;

    return (
        <div
            className={cn(STRIP_H, 'overflow-hidden rounded bg-muted/30', className)}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
        >
            <div
                className={cn(
                    'flex w-max items-center gap-1 px-0.5 h-full',
                    chips.length > 1 && 'news-ticker-track',
                )}
                style={
                    chips.length > 1
                        ? {
                              animationDuration: `${MARQUEE_SPEED_S}s`,
                              animationPlayState: paused ? 'paused' : 'running',
                          }
                        : undefined
                }
            >
                {doubled}
            </div>
        </div>
    );
};
