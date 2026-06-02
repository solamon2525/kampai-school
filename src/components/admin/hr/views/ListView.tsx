import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { formatThaiDateMedium } from '@/lib/thaiDate';
import { cn } from '@/lib/utils';
import { prefersReducedMotion, type ViewProps } from './types';

/**
 * ListView — แถวแนวตั้งแน่น (thumbnail + ชื่อ + ประเภท + วันที่ + ชม.)
 * เหมาะเวลามีหลายใบ อ่านเร็ว มือถือดี
 */
const TYPE_COLORS: Record<string, string> = {
    'อบรม': 'border-violet-300 text-violet-700 bg-violet-50',
    'สัมมนา': 'border-blue-300 text-blue-700 bg-blue-50',
    'ศึกษาดูงาน': 'border-emerald-300 text-emerald-700 bg-emerald-50',
    'ประชุมวิชาการ': 'border-amber-300 text-amber-700 bg-amber-50',
    'รางวัล/เกียรติยศ': 'border-rose-300 text-rose-700 bg-rose-50',
};

export const ListView = ({ records, showStaff, onSelect, onHoverRecord }: ViewProps) => {
    const reduce = prefersReducedMotion();
    return (
        <div className="flex flex-col gap-2">
            {records.map((r, idx) => (
                <motion.button
                    key={r.id}
                    type="button"
                    onClick={() => onSelect(idx)}
                    onMouseEnter={() => onHoverRecord?.(r)}
                    onMouseLeave={() => onHoverRecord?.(null)}
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-20px' }}
                    transition={{ duration: 0.25, delay: Math.min(idx * 0.015, 0.3) }}
                    className="group flex items-center gap-3 rounded-xl border border-border bg-card p-2 pr-3 text-left hover:border-violet-400 hover:shadow-md transition-all"
                >
                    <div className="h-16 w-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                        {r.certificate_url ? (
                            <img
                                src={r.certificate_url}
                                alt={r.course_name}
                                loading="lazy"
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                            />
                        ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm leading-snug line-clamp-2 text-foreground">
                            {r.course_name}
                        </div>
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={cn('text-[10px] h-5', TYPE_COLORS[r.training_type] || 'border-border')}>
                                {r.training_type}
                            </Badge>
                            {r.hours > 0 && (
                                <span className="text-[10px] text-muted-foreground font-medium">{r.hours} ชม.</span>
                            )}
                            <span className="text-[10px] text-muted-foreground">{formatThaiDateMedium(r.start_date)}</span>
                            {r.provider && (
                                <span className="text-[10px] text-muted-foreground truncate hidden sm:inline">· {r.provider}</span>
                            )}
                        </div>
                    </div>
                    {showStaff && r.staff && (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            <PersonAvatar name={r.staff.name} photoUrl={r.staff.photo_url} size="sm" />
                            <span className="hidden md:inline text-xs font-medium text-foreground truncate max-w-[120px]">
                                {r.staff.name}
                            </span>
                        </div>
                    )}
                </motion.button>
            ))}
        </div>
    );
};
