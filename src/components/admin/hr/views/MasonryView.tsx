import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { formatThaiDateMedium } from '@/lib/thaiDate';
import { prefersReducedMotion, type ViewProps } from './types';

/**
 * MasonryView — คอลัมน์สูงไม่เท่ากันแบบ Pinterest (CSS columns)
 * รูปใช้ความสูงตามธรรมชาติ (ไม่ครอป) → ได้ลุค masonry จริง + ไม่มีปัญหารูปล้น
 */
export const MasonryView = ({ records, showStaff, onSelect, onHoverRecord }: ViewProps) => {
    const reduce = prefersReducedMotion();
    return (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4">
            {records.map((r, idx) => (
                <motion.button
                    key={r.id}
                    type="button"
                    onClick={() => onSelect(idx)}
                    onMouseEnter={() => onHoverRecord?.(r)}
                    onMouseLeave={() => onHoverRecord?.(null)}
                    initial={reduce ? false : { opacity: 0, y: 16 }}
                    whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{ duration: 0.3, delay: Math.min(idx * 0.02, 0.4) }}
                    className="group mb-3 md:mb-4 w-full break-inside-avoid block text-left rounded-xl overflow-hidden border border-border bg-card hover:border-violet-400 hover:shadow-lg transition-all"
                >
                    {r.certificate_url ? (
                        <img
                            src={r.certificate_url}
                            alt={r.course_name}
                            loading="lazy"
                            className="w-full h-auto block group-hover:scale-[1.02] transition-transform"
                        />
                    ) : (
                        <div className="w-full aspect-[4/3] bg-muted flex items-center justify-center text-xs text-muted-foreground">
                            ไม่มีรูปเกียรติบัตร
                        </div>
                    )}
                    <div className="p-2.5 space-y-1.5">
                        <div className="font-bold text-xs leading-snug line-clamp-2 text-foreground">{r.course_name}</div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="outline" className="text-[10px] h-5">{r.training_type}</Badge>
                            {r.hours > 0 && <span className="text-[10px] text-muted-foreground font-medium">{r.hours} ชม.</span>}
                            <span className="text-[10px] text-muted-foreground">{formatThaiDateMedium(r.start_date)}</span>
                        </div>
                        {showStaff && r.staff && (
                            <div className="flex items-center gap-1.5 pt-0.5">
                                <PersonAvatar name={r.staff.name} photoUrl={r.staff.photo_url} size="xs" />
                                <span className="text-[10px] font-medium text-foreground truncate">{r.staff.name}</span>
                            </div>
                        )}
                    </div>
                </motion.button>
            ))}
        </div>
    );
};
