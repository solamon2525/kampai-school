import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatThaiDateMedium } from '@/lib/thaiDate';
import type { TrainingRecord } from '@/services/training.service';

interface Props {
    record: TrainingRecord;
    big?: boolean;
    onClick?: () => void;
    showStaff?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
    'อบรม': 'border-violet-300 bg-violet-50/40',
    'สัมมนา': 'border-blue-300 bg-blue-50/40',
    'ศึกษาดูงาน': 'border-emerald-300 bg-emerald-50/40',
    'ประชุมวิชาการ': 'border-amber-300 bg-amber-50/40',
    'รางวัล/เกียรติยศ': 'border-rose-300 bg-rose-50/40',
};

/**
 * CertCard — เกียรติบัตรการ์ดเดียวสำหรับ editorial grid
 *
 * - cert image aspect 4/3 (หรือ 16/10 ถ้า big)
 * - overlay gradient ล่าง + PersonAvatar + ชื่อครู (ถ้า showStaff)
 * - ใต้รูป: course_name + Badge ประเภท + ชม. + วันที่
 */
export const CertCard = ({ record, big, onClick, showStaff = true }: Props) => {
    const colorRing = TYPE_COLORS[record.training_type] || 'border-border';
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'group text-left rounded-2xl border-2 overflow-hidden bg-card transition-all',
                'hover:shadow-xl hover:-translate-y-0.5 hover:ring-2 hover:ring-violet-400',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400',
                colorRing,
                big && 'lg:col-span-2 lg:row-span-2',
            )}
        >
            <div className={cn('relative overflow-hidden bg-muted', big ? 'aspect-[16/10]' : 'aspect-[4/3]')}>
                {record.certificate_url ? (
                    <img
                        src={record.certificate_url}
                        alt={record.course_name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        ไม่มีรูปเกียรติบัตร
                    </div>
                )}
                {/* Bottom gradient overlay with staff info */}
                {showStaff && record.staff && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 flex items-center gap-2">
                        <PersonAvatar
                            name={record.staff.name}
                            photoUrl={record.staff.photo_url}
                            size="sm"
                            className="ring-2 ring-white/40"
                        />
                        <div className="min-w-0 flex-1">
                            <div className={cn('font-bold text-white truncate', big ? 'text-base' : 'text-sm')}>
                                {record.staff.name}
                            </div>
                            {record.staff.position && (
                                <div className="text-[10px] text-white/80 truncate">{record.staff.position}</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <div className="p-3 space-y-2">
                <h3 className={cn('font-bold leading-snug line-clamp-2', big ? 'text-base' : 'text-sm')}>
                    {record.course_name}
                </h3>
                <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[10px] h-5">{record.training_type}</Badge>
                    {record.hours > 0 && (
                        <>
                            <span className="text-[10px] text-muted-foreground font-medium">
                                {record.hours} ชม.
                            </span>
                            <span className="text-[10px] text-muted-foreground">·</span>
                        </>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                        {formatThaiDateMedium(record.start_date)}
                    </span>
                </div>
                {record.provider && (
                    <p className="text-[10px] text-muted-foreground line-clamp-1">
                        โดย {record.provider}
                    </p>
                )}
            </div>
        </button>
    );
};
