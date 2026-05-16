import { useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { formatThaiDateMedium } from '@/lib/thaiDate';
import { cn } from '@/lib/utils';
import { prefersReducedMotion, type ViewProps } from './types';

/**
 * TimelineHorizontalView — group records by ปี พ.ศ. + horizontal scroll-snap-x
 *
 * - แต่ละกลุ่มปีเป็น snap section
 * - sticky year marker บน scroll container
 * - dot indicators ด้านล่าง
 * - ปุ่ม ◀ ▶ scroll navigation
 */
export const TimelineHorizontalView = ({ records, showStaff, onSelect, onHoverRecord }: ViewProps) => {
    const reduce = prefersReducedMotion();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Group by ปีพ.ศ. (จาก start_date)
    const groups = useMemo(() => {
        const map = new Map<number, { records: typeof records; originalIdx: number[] }>();
        records.forEach((r, idx) => {
            if (!r.start_date) return;
            const yearBe = new Date(r.start_date).getFullYear() + 543;
            if (!map.has(yearBe)) map.set(yearBe, { records: [], originalIdx: [] });
            const g = map.get(yearBe)!;
            g.records.push(r);
            g.originalIdx.push(idx);
        });
        return Array.from(map.entries())
            .sort(([a], [b]) => b - a) // ใหม่ → เก่า
            .map(([year, data]) => ({ year, ...data }));
    }, [records]);

    const scrollBy = (dir: 1 | -1) => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: reduce ? 'auto' : 'smooth' });
    };

    if (groups.length === 0) {
        return <div className="text-center py-12 text-muted-foreground text-sm">ไม่มีเกียรติบัตร</div>;
    }

    return (
        <div className="relative">
            {/* Controls */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    เลื่อนซ้าย-ขวาเพื่อดูแต่ละปี · {groups.length} ปี · {records.length} รายการ
                </div>
                <div className="flex gap-1.5">
                    <Button size="icon" variant="outline" onClick={() => scrollBy(-1)} aria-label="ก่อนหน้า" className="h-8 w-8">
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => scrollBy(1)} aria-label="ถัดไป" className="h-8 w-8">
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Scroll container */}
            <div
                ref={scrollRef}
                className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 -mx-2 px-2"
                style={{ scrollbarWidth: 'thin' }}
            >
                {groups.map((g, gIdx) => (
                    <section
                        key={g.year}
                        className="flex-shrink-0 snap-start w-full md:w-[90%] lg:w-[80%]"
                    >
                        {/* Year header */}
                        <div className="flex items-end gap-3 mb-3 border-b-2 border-violet-300/50 pb-2">
                            <motion.div
                                initial={reduce ? false : { opacity: 0, x: -10 }}
                                whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4 }}
                                className="flex items-baseline gap-2"
                            >
                                <span className="text-4xl md:text-5xl font-extrabold text-violet-600 tabular-nums leading-none">
                                    {g.year}
                                </span>
                                <span className="text-sm md:text-base text-muted-foreground font-semibold">พ.ศ.</span>
                            </motion.div>
                            <Badge variant="outline" className="ml-auto text-[10px] border-violet-300 bg-violet-50 text-violet-900">
                                {g.records.length} รายการ
                            </Badge>
                        </div>

                        {/* Cert grid for this year */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {g.records.map((r, i) => {
                                const originalIdx = g.originalIdx[i];
                                return (
                                    <motion.button
                                        key={r.id}
                                        type="button"
                                        onClick={() => onSelect(originalIdx)}
                                        onMouseEnter={() => onHoverRecord?.(r)}
                                        onMouseLeave={() => onHoverRecord?.(null)}
                                        initial={reduce ? false : { opacity: 0, y: 16 }}
                                        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: '-30px' }}
                                        transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
                                        className="group relative rounded-lg overflow-hidden border-2 border-violet-200/60 bg-card hover:border-violet-400 hover:shadow-lg transition-all text-left"
                                    >
                                        <div className="aspect-[4/3] bg-muted overflow-hidden">
                                            {r.certificate_url ? (
                                                <img
                                                    src={r.certificate_url}
                                                    alt={r.course_name}
                                                    loading="lazy"
                                                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                                                />
                                            ) : null}
                                        </div>
                                        <div className="p-2 space-y-1">
                                            <div className="text-[11px] font-bold line-clamp-2 leading-snug">
                                                {r.course_name}
                                            </div>
                                            <div className="flex items-center gap-1 flex-wrap">
                                                {showStaff && r.staff && (
                                                    <>
                                                        <PersonAvatar name={r.staff.name} photoUrl={r.staff.photo_url} size="xs" />
                                                        <span className="text-[9px] font-medium text-foreground truncate max-w-[100px]">
                                                            {r.staff.name}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                            <div className="text-[9px] text-muted-foreground">
                                                {r.hours} ชม. · {formatThaiDateMedium(r.start_date)}
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </section>
                ))}
            </div>

            {/* Dot indicators */}
            <div className="flex justify-center gap-1.5 mt-3">
                {groups.map((g, i) => (
                    <span
                        key={g.year}
                        className={cn('h-1.5 rounded-full transition-all', i === 0 ? 'w-6 bg-violet-500' : 'w-1.5 bg-muted')}
                        aria-hidden
                    />
                ))}
            </div>
        </div>
    );
};
