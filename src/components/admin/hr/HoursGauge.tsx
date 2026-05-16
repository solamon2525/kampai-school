import { cn } from '@/lib/utils';

interface Props {
    hours: number;
    target?: number;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

/**
 * HoursGauge — circular SVG progress ring แสดงชั่วโมงอบรม/เป้าหมาย ก.ค.ศ. 20 ชม./ปี
 *
 * สี:
 *   < 50%  → rose (ห่างเป้า)
 *   < 100% → amber (ใกล้เป้า)
 *   ≥ 100% → emerald (ผ่านเป้า)
 */
export const HoursGauge = ({ hours, target = 20, size = 'md', className }: Props) => {
    const pct = Math.min(100, Math.max(0, (hours / target) * 100));
    const passed = hours >= target;
    const ring = (() => {
        if (pct >= 100) return { stroke: '#10b981', text: 'text-emerald-700', bg: 'bg-emerald-50' };
        if (pct >= 50) return { stroke: '#f59e0b', text: 'text-amber-700', bg: 'bg-amber-50' };
        return { stroke: '#f43f5e', text: 'text-rose-700', bg: 'bg-rose-50' };
    })();

    const dim = { sm: 36, md: 48, lg: 72 }[size];
    const stroke = { sm: 4, md: 5, lg: 7 }[size];
    const r = (dim - stroke) / 2;
    const c = 2 * Math.PI * r;
    const offset = c * (1 - pct / 100);

    return (
        <div className={cn('inline-flex items-center justify-center', className)}>
            <div className="relative" style={{ width: dim, height: dim }}>
                <svg width={dim} height={dim} className="-rotate-90">
                    <circle
                        cx={dim / 2}
                        cy={dim / 2}
                        r={r}
                        fill="transparent"
                        strokeWidth={stroke}
                        stroke="hsl(var(--muted))"
                    />
                    <circle
                        cx={dim / 2}
                        cy={dim / 2}
                        r={r}
                        fill="transparent"
                        strokeWidth={stroke}
                        stroke={ring.stroke}
                        strokeLinecap="round"
                        strokeDasharray={c}
                        strokeDashoffset={offset}
                        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                    />
                </svg>
                <div className={cn('absolute inset-0 flex flex-col items-center justify-center', ring.text)}>
                    <span className={cn(
                        'font-bold tabular-nums leading-none',
                        size === 'sm' ? 'text-[10px]' : size === 'md' ? 'text-xs' : 'text-base',
                    )}>
                        {hours}
                    </span>
                    {size === 'lg' && (
                        <span className="text-[9px] opacity-70 leading-none mt-0.5">/{target}</span>
                    )}
                </div>
            </div>
            {size !== 'sm' && (
                <span className={cn('ml-2 text-xs font-semibold', ring.text)}>
                    {passed ? '✓ ผ่านเป้า' : `${hours}/${target} ชม.`}
                </span>
            )}
        </div>
    );
};
