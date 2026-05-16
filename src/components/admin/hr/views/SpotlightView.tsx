import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { cn } from '@/lib/utils';
import { formatThaiDateMedium } from '@/lib/thaiDate';
import { prefersReducedMotion, type ViewProps } from './types';

const AUTO_ROTATE_MS = 6000;

export const SpotlightView = ({ records, showStaff, onSelect, onHoverRecord }: ViewProps) => {
    const reduce = prefersReducedMotion();
    const [idx, setIdx] = useState(0);
    const [paused, setPaused] = useState(false);
    const stripRef = useRef<HTMLDivElement>(null);

    // Clamp index if records shrink
    useEffect(() => {
        if (idx >= records.length) setIdx(0);
    }, [records.length, idx]);

    // Auto-rotate
    useEffect(() => {
        if (reduce || paused || records.length <= 1) return;
        const t = setInterval(() => {
            setIdx((i) => (i + 1) % records.length);
        }, AUTO_ROTATE_MS);
        return () => clearInterval(t);
    }, [paused, records.length, reduce]);

    // Scroll thumb into view
    useEffect(() => {
        const el = stripRef.current?.querySelector<HTMLElement>(`[data-thumb="${idx}"]`);
        if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
    }, [idx, reduce]);

    if (records.length === 0) {
        return <div className="text-center py-12 text-muted-foreground text-sm">ไม่มีเกียรติบัตร</div>;
    }

    const current = records[idx];
    const prev = () => setIdx((i) => (i - 1 + records.length) % records.length);
    const next = () => setIdx((i) => (i + 1) % records.length);

    return (
        <div className="space-y-4">
            {/* Stage */}
            <div
                className="relative rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-violet-950 overflow-hidden ring-1 ring-violet-500/30 aspect-[16/9] md:aspect-[21/9]"
                onMouseEnter={() => { setPaused(true); onHoverRecord?.(current); }}
                onMouseLeave={() => { setPaused(false); onHoverRecord?.(null); }}
            >
                <div
                    className="absolute inset-0 opacity-[0.04] pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                        backgroundSize: '24px 24px',
                    }}
                />

                <AnimatePresence mode="wait" initial={false}>
                    <motion.button
                        key={current.id}
                        type="button"
                        onClick={() => onSelect(idx)}
                        initial={reduce ? false : { opacity: 0, scale: 0.96 }}
                        animate={reduce ? undefined : { opacity: 1, scale: 1 }}
                        exit={reduce ? undefined : { opacity: 0, scale: 1.02 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="absolute inset-0 flex items-center justify-center p-6 md:p-10 cursor-zoom-in group/spot"
                    >
                        {current.certificate_url ? (
                            <img
                                src={current.certificate_url}
                                alt={current.course_name}
                                className="max-h-full max-w-full object-contain shadow-2xl rounded-md ring-1 ring-white/10 group-hover/spot:scale-[1.01] transition-transform"
                            />
                        ) : (
                            <div className="text-white/60 text-sm">ไม่มีรูป</div>
                        )}
                    </motion.button>
                </AnimatePresence>

                {/* Caption */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 md:p-6 text-white pointer-events-none">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <Badge variant="outline" className="border-violet-400/40 bg-violet-500/20 text-violet-100 text-[10px]">
                                {current.training_type}
                            </Badge>
                            <span className="text-[11px] text-white/70 font-medium tabular-nums">
                                {current.hours} ชม. · {formatThaiDateMedium(current.start_date)}
                            </span>
                        </div>
                        <h3 className="text-lg md:text-2xl font-extrabold leading-tight line-clamp-2">
                            {current.course_name}
                        </h3>
                        {showStaff && current.staff && (
                            <div className="flex items-center gap-2 mt-2.5">
                                <PersonAvatar
                                    name={current.staff.name}
                                    photoUrl={current.staff.photo_url}
                                    size="sm"
                                    className="ring-2 ring-white/30"
                                />
                                <div>
                                    <div className="text-sm font-semibold">{current.staff.name}</div>
                                    {current.staff.position && (
                                        <div className="text-[10px] text-white/70">{current.staff.position}</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Nav arrows */}
                <button
                    type="button"
                    onClick={prev}
                    aria-label="ก่อนหน้า"
                    className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur text-white flex items-center justify-center transition"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                    type="button"
                    onClick={next}
                    aria-label="ถัดไป"
                    className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur text-white flex items-center justify-center transition"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>

                {/* Controls top-right */}
                <div className="absolute top-2 right-2 md:top-3 md:right-3 flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-white/70 bg-black/30 backdrop-blur px-2 py-1 rounded">
                        {idx + 1}/{records.length}
                    </span>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setPaused((p) => !p)}
                        className="h-7 w-7 text-white hover:bg-white/10"
                        aria-label={paused ? 'เล่นต่อ' : 'หยุด'}
                    >
                        {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onSelect(idx)}
                        className="h-7 w-7 text-white hover:bg-white/10"
                        aria-label="ดูเต็มจอ"
                    >
                        <Maximize2 className="w-3.5 h-3.5" />
                    </Button>
                </div>

                {/* Progress bar */}
                {!reduce && !paused && records.length > 1 && (
                    <motion.div
                        key={`prog-${idx}`}
                        className="absolute bottom-0 left-0 h-0.5 bg-violet-400"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: AUTO_ROTATE_MS / 1000, ease: 'linear' }}
                    />
                )}
            </div>

            {/* Thumb strip */}
            <div
                ref={stripRef}
                className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-2 -mx-2 px-2"
                style={{ scrollbarWidth: 'thin' }}
            >
                {records.map((r, i) => (
                    <button
                        key={r.id}
                        type="button"
                        data-thumb={i}
                        onClick={() => setIdx(i)}
                        className={cn(
                            'flex-shrink-0 snap-start rounded-md overflow-hidden ring-2 transition-all',
                            i === idx
                                ? 'ring-violet-500 scale-100 shadow-lg'
                                : 'ring-transparent opacity-60 hover:opacity-100',
                        )}
                        aria-label={`เลือก ${r.course_name}`}
                    >
                        <div className="w-20 h-14 md:w-28 md:h-20 bg-muted">
                            {r.certificate_url ? (
                                <img
                                    src={r.certificate_url}
                                    alt={r.course_name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            ) : null}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};
