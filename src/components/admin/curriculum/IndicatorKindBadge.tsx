/**
 * IndicatorKindBadge — ป้ายชนิดตัวชี้วัด ระหว่างทาง (formative) / ปลายทาง (summative)
 * mig 175 indicator_kind. ใช้ร่วมทุกที่ที่แสดงรายการตัวชี้วัด
 */
import { cn } from '@/lib/utils';

export const IndicatorKindBadge = ({
    kind,
    className,
}: {
    kind: 'ระหว่างทาง' | 'ปลายทาง' | null;
    className?: string;
}) => {
    if (!kind) return null;
    const isFinal = kind === 'ปลายทาง';
    return (
        <span
            className={cn(
                'inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-medium leading-none',
                isFinal
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted text-muted-foreground',
                className,
            )}
        >
            {kind}
        </span>
    );
};
