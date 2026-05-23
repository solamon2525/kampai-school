import { useState } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
    formatThaiDateFull,
    formatThaiDateMedium,
    formatThaiDateShort,
    formatThaiDateWithDow,
    formatThaiDateCustom,
} from '@/lib/thaiDate';

interface Props {
    /** ISO date string ("YYYY-MM-DD") — ค.ศ. */
    value: string;
    onChange: (iso: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    /** ปีเริ่ม (ค.ศ.) — default = ปัจจุบัน − 20 */
    fromYear?: number;
    /** ปีสุดท้าย (ค.ศ.) — default = ปัจจุบัน + 2 */
    toYear?: number;
    /** อนุญาตให้ clear ค่า (กากบาท) */
    clearable?: boolean;
    /** Format type */
    dateFormat?: 'full' | 'custom' | 'medium' | 'short' | 'withDow';
}

const THAI_MONTHS_FULL = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

/** Convert local Date → ISO YYYY-MM-DD (ไม่ใช้ toISOString เพราะ timezone) */
const toIsoDate = (d: Date): string => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const parseIso = (iso: string): Date | undefined => {
    if (!iso) return undefined;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return undefined;
    return d;
};

/**
 * ThaiDatePicker — date picker ที่แสดง พ.ศ. ใน UI แต่ store ISO ค.ศ. ใน state
 *
 * - Trigger ปุ่มแสดงวันที่ภาษาไทยเต็มรูปแบบ "11 พฤษภาคม 2569"
 * - คลิก → popover Calendar (react-day-picker) พร้อม dropdown ปี-เดือน
 * - ปีในดรอปดาวน์แสดง พ.ศ. (year + 543) แต่ภายในยังเป็น ค.ศ.
 * - onChange คืน ISO ค.ศ. (เก็บใน DB ตามเดิม)
 */
export const ThaiDatePicker = ({
    value,
    onChange,
    placeholder = 'เลือกวันที่',
    disabled,
    className,
    fromYear,
    toYear,
    clearable = true,
    dateFormat = 'full',
}: Props) => {
    const [open, setOpen] = useState(false);
    const selected = parseIso(value);
    const now = new Date();
    const from = fromYear ?? now.getFullYear() - 20;
    const to = toYear ?? now.getFullYear() + 2;

    const displayDate = () => {
        if (!selected) return placeholder;
        if (dateFormat === 'custom') return formatThaiDateCustom(value);
        if (dateFormat === 'medium') return formatThaiDateMedium(value);
        if (dateFormat === 'short') return formatThaiDateShort(value);
        if (dateFormat === 'withDow') return formatThaiDateWithDow(value);
        return formatThaiDateFull(value);
    };

    return (
        <Popover open={open} onOpenChange={(v) => !disabled && setOpen(v)}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        'w-full justify-start text-left font-normal',
                        !selected && 'text-muted-foreground',
                        className,
                    )}
                >
                    <CalendarIcon className="mr-2 w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 truncate">
                        {displayDate()}
                    </span>
                    {clearable && selected && (
                        <span
                            role="button"
                            tabIndex={0}
                            aria-label="ล้างวันที่"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange('');
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onChange('');
                                }
                            }}
                            className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selected}
                    onSelect={(d) => {
                        if (d) {
                            onChange(toIsoDate(d));
                            setOpen(false);
                        }
                    }}
                    captionLayout="dropdown-buttons"
                    fromYear={from}
                    toYear={to}
                    defaultMonth={selected ?? new Date()}
                    formatters={{
                        formatCaption: (d) => `${THAI_MONTHS_FULL[d.getMonth()]} ${d.getFullYear() + 543}`,
                        formatYearCaption: (d) => String(d.getFullYear() + 543),
                        formatMonthCaption: (d) => THAI_MONTHS_FULL[d.getMonth()],
                        formatWeekdayName: (d) => ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'][d.getDay()],
                    }}
                    classNames={{
                        caption_dropdowns: 'flex gap-1.5 [&_select]:bg-card [&_select]:border [&_select]:rounded [&_select]:px-2 [&_select]:py-1 [&_select]:text-sm [&_select]:font-medium',
                        caption_label: 'sr-only',
                    }}
                />
            </PopoverContent>
        </Popover>
    );
};
