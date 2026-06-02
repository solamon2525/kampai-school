import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { formatThaiDateMedium } from '@/lib/thaiDate';
import { type ViewProps } from './types';

/**
 * CoverflowView — คารูเซล 3D การ์ดกลางใหญ่ ข้าง ๆ เอียง rotateY
 * - กดการ์ดข้าง = เลื่อนมากลาง · กดการ์ดกลาง = เปิดดูเต็ม (onSelect)
 * - ปุ่ม ◀ ▶ + caption ใต้เวที
 */
export const CoverflowView = ({ records, showStaff, onSelect, onHoverRecord }: ViewProps) => {
    const [active, setActive] = useState(0);

    useEffect(() => {
        if (active >= records.length) setActive(0);
    }, [records.length, active]);

    if (records.length === 0) {
        return <div className="text-center py-12 text-muted-foreground text-sm">ไม่มีเกียรติบัตร</div>;
    }

    const n = records.length;
    const cur = records[Math.min(active, n - 1)];
    const prev = () => setActive((a) => (a - 1 + n) % n);
    const next = () => setActive((a) => (a + 1) % n);

    return (
        <div className="space-y-4">
            <div
                className="relative h-[280px] md:h-[420px] flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-violet-950 ring-1 ring-violet-500/30"
                style={{ perspective: '1200px' }}
                onMouseEnter={() => onHoverRecord?.(cur)}
                onMouseLeave={() => onHoverRecord?.(null)}
            >
                {records.map((r, i) => {
                    let offset = i - active;
                    if (offset > n / 2) offset -= n;
                    if (offset < -n / 2) offset += n;
                    const abs = Math.abs(offset);
                    if (abs > 2) return null;
                    const isCenter = offset === 0;
                    return (
                        <button
                            key={r.id}
                            type="button"
                            onClick={() => (isCenter ? onSelect(i) : setActive(i))}
                            aria-label={r.course_name}
                            className={isCenter ? 'absolute cursor-zoom-in transition-all duration-500 ease-out will-change-transform' : 'absolute transition-all duration-500 ease-out will-change-transform'}
                            style={{
                                transform: `translateX(${offset * 42}%) translateZ(${isCenter ? 0 : -180}px) rotateY(${offset * -32}deg) scale(${isCenter ? 1 : 0.9})`,
                                zIndex: 100 - abs,
                                opacity: abs > 2 ? 0 : 1,
                                width: 'min(72%, 480px)',
                            }}
                        >
                            <div className="rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/20 bg-white">
                                {r.certificate_url ? (
                                    <img
                                        src={r.certificate_url}
                                        alt={r.course_name}
                                        loading="lazy"
                                        className="w-full max-h-[220px] md:max-h-[360px] object-contain bg-white"
                                    />
                                ) : (
                                    <div className="w-full aspect-[4/3] flex items-center justify-center text-xs text-slate-400">ไม่มีรูป</div>
                                )}
                            </div>
                        </button>
                    );
                })}

                <button
                    type="button"
                    onClick={prev}
                    aria-label="ก่อนหน้า"
                    className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-[200] h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur text-white flex items-center justify-center transition"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                    type="button"
                    onClick={next}
                    aria-label="ถัดไป"
                    className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-[200] h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur text-white flex items-center justify-center transition"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
                <span className="absolute top-2 right-3 z-[200] text-[10px] font-mono text-white/70 bg-black/30 backdrop-blur px-2 py-1 rounded">
                    {active + 1}/{n}
                </span>
            </div>

            {/* Caption */}
            <div className="text-center max-w-2xl mx-auto">
                <div className="flex items-center justify-center gap-2 flex-wrap mb-1">
                    <Badge variant="outline" className="text-[10px]">{cur.training_type}</Badge>
                    {cur.hours > 0 && <span className="text-[11px] text-muted-foreground font-medium">{cur.hours} ชม.</span>}
                    <span className="text-[11px] text-muted-foreground">{formatThaiDateMedium(cur.start_date)}</span>
                </div>
                <h3 className="text-sm md:text-base font-bold leading-snug line-clamp-2 text-foreground">{cur.course_name}</h3>
                {showStaff && cur.staff && (
                    <div className="flex items-center justify-center gap-2 mt-2">
                        <PersonAvatar name={cur.staff.name} photoUrl={cur.staff.photo_url} size="sm" />
                        <span className="text-xs font-medium text-foreground">{cur.staff.name}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
