import { motion } from 'framer-motion';
import { formatThaiDateMedium } from '@/lib/thaiDate';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { hashString, prefersReducedMotion, type ViewProps } from './types';

/**
 * PolaroidWallView — cork-board background + tilted polaroid cards
 *
 * - rotation deterministic จาก hash(id) range -4° ถึง +4°
 * - hover: scale 1.04 + straighten 0° + z-index up
 * - cards: white border 8px + drop shadow + cert image on top + caption ใต้
 */
export const PolaroidWallView = ({ records, showStaff, onSelect, onHoverRecord }: ViewProps) => {
    const reduce = prefersReducedMotion();
    return (
        <div
            className="relative rounded-2xl p-4 md:p-8 min-h-[500px]"
            style={{
                background: 'linear-gradient(135deg, #f5e6c8 0%, #e9d3a3 100%)',
                backgroundImage: `
                    radial-gradient(circle at 30% 20%, rgba(120, 80, 40, 0.08) 0, transparent 50%),
                    radial-gradient(circle at 70% 80%, rgba(140, 100, 50, 0.06) 0, transparent 50%),
                    linear-gradient(135deg, #f5e6c8 0%, #e9d3a3 100%)
                `,
                boxShadow: 'inset 0 0 40px rgba(120, 80, 40, 0.12)',
            }}
        >
            {/* Pin board grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-2 gap-y-6 md:gap-x-4 md:gap-y-10">
                {records.map((r, idx) => {
                    const h = hashString(r.id);
                    const rotate = ((h % 90) - 45) / 10; // -4.5° ถึง +4.4°
                    const xOffset = ((h >> 4) % 20) - 10; // -10px to +10px
                    return (
                        <motion.button
                            key={r.id}
                            type="button"
                            onClick={() => onSelect(idx)}
                            onMouseEnter={() => onHoverRecord?.(r)}
                            onMouseLeave={() => onHoverRecord?.(null)}
                            initial={reduce ? false : { opacity: 0, y: 20, rotate: rotate * 1.5 }}
                            whileInView={reduce ? undefined : { opacity: 1, y: 0, rotate }}
                            viewport={{ once: true, margin: '-30px' }}
                            transition={{ duration: 0.45, delay: Math.min(idx * 0.04, 0.5), ease: 'easeOut' }}
                            whileHover={reduce ? undefined : { rotate: 0, scale: 1.05, zIndex: 20, y: -4 }}
                            style={{ transform: `translateX(${xOffset}px)` }}
                            className="group relative block bg-white p-2 pb-8 rounded-sm shadow-[0_4px_12px_rgba(0,0,0,0.18)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.28)] transition-shadow text-left"
                        >
                            {/* Pin (decorative) */}
                            <span
                                aria-hidden
                                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-rose-500 shadow-md ring-2 ring-rose-300/50"
                            />

                            {/* Cert image */}
                            <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden">
                                {r.certificate_url ? (
                                    <img
                                        src={r.certificate_url}
                                        alt={r.course_name}
                                        loading="lazy"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                                        ไม่มีรูป
                                    </div>
                                )}
                            </div>

                            {/* Handwritten-style caption */}
                            <div className="absolute bottom-1 left-0 right-0 px-3 text-center">
                                {showStaff && r.staff && (
                                    <div className="flex items-center justify-center gap-1.5 mb-0.5">
                                        <PersonAvatar
                                            name={r.staff.name}
                                            photoUrl={r.staff.photo_url}
                                            size="xs"
                                        />
                                        <div className="text-[10px] font-bold text-slate-800 truncate max-w-[100px]">
                                            {r.staff.name}
                                        </div>
                                    </div>
                                )}
                                <div className="text-[9px] text-slate-600 font-medium tracking-tight line-clamp-1">
                                    {r.training_type} · {formatThaiDateMedium(r.start_date)}
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {records.length === 0 && (
                <div className="text-center py-12 text-slate-700 text-sm">
                    ยังไม่มีเกียรติบัตรในตัวกรองนี้
                </div>
            )}
        </div>
    );
};
