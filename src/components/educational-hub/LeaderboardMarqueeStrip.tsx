import { useState } from 'react';
import { cn } from '@/lib/utils';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import type { LeaderboardRow } from '@/services/game-play.service';

interface Props {
    leaders: LeaderboardRow[];
    className?: string;
}

const MARQUEE_SPEED_S = 28;
/** ช่องอันดับคงที่ — รูปใหญ่ขึ้น ทุกการ์ดเท่ากัน */
const SLOT_H = 'h-8';

/** แถบสไลด์อันดับ 1–10 บนการ์ดเกม — วนซ้ายอัตโนมัติ หยุดเมื่อชี้ */
export const LeaderboardMarqueeStrip = ({ leaders, className }: Props) => {
    const [paused, setPaused] = useState(false);

    if (leaders.length === 0) {
        return <div className={cn(SLOT_H, 'shrink-0', className)} aria-hidden />;
    }

    const chips = leaders.map((row, i) => (
        <div
            key={row.student_id}
            className="shrink-0 flex items-center gap-1 rounded border border-border bg-muted/80 pl-0.5 pr-1 h-7"
            title={`${i + 1}. ${row.display_name} — ${row.personal_best.toLocaleString('th-TH')} คะแนน`}
        >
            <span className="text-[8px] font-bold text-primary leading-none w-3.5 text-center shrink-0">
                {i + 1}
            </span>
            <PersonAvatar
                name={row.display_name}
                photoUrl={row.photo_url}
                size="xs"
            />
            <span className="text-[8px] text-foreground font-medium leading-none tabular-nums">
                {row.personal_best.toLocaleString('th-TH')}
            </span>
        </div>
    ));

    // ช่องว่างปลายลูป — อันดับสุดท้ายกับอันดับ 1 ไม่ชิด (แต่ละ segment ต้องเหมือนกันเพื่อ animation -50%)
    const renderSegment = (suffix: string) => [
        ...chips,
        <div key={`loop-seam-${suffix}`} className="shrink-0 w-8" aria-hidden />,
    ];
    const doubled = chips.length > 1 ? [...renderSegment('a'), ...renderSegment('b')] : chips;

    return (
        <div
            className={cn(SLOT_H, 'overflow-hidden rounded bg-muted/30 shrink-0', className)}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
        >
            <div
                className={cn(
                    'flex w-max items-center gap-1.5 px-0.5 h-full',
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
