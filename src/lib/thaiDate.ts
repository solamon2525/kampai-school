/**
 * thaiDate.ts — รูปแบบวันที่ภาษาไทย (พ.ศ.)
 *
 * Format options:
 *   - full:   "11 พฤษภาคม 2569" (วัน เดือนเต็ม ปี พ.ศ.)
 *   - medium: "11 พ.ค. 2569" (วัน เดือนย่อ ปี พ.ศ.)
 *   - short:  "11/05/2569" (วัน/เดือน/ปี พ.ศ. — เลขล้วน)
 *   - withDow: "วันอาทิตย์ที่ 11 พฤษภาคม 2569" (ราชการ)
 */

const THAI_MONTHS_FULL = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const THAI_MONTHS_SHORT = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

const THAI_DOW = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

const parse = (iso: string): Date | null => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d;
};

/** "11 พฤษภาคม 2569" */
export const formatThaiDateFull = (iso: string | null | undefined): string => {
    if (!iso) return '—';
    const d = parse(iso);
    if (!d) return iso;
    return `${d.getDate()} ${THAI_MONTHS_FULL[d.getMonth()]} ${d.getFullYear() + 543}`;
};

/** "11 พ.ค. 2569" */
export const formatThaiDateMedium = (iso: string | null | undefined): string => {
    if (!iso) return '—';
    const d = parse(iso);
    if (!d) return iso;
    return `${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear() + 543}`;
};

/** "11/05/2569" */
export const formatThaiDateShort = (iso: string | null | undefined): string => {
    if (!iso) return '—';
    const d = parse(iso);
    if (!d) return iso;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear() + 543}`;
};

/** "วันอาทิตย์ที่ 11 พฤษภาคม 2569" — รูปแบบราชการ */
export const formatThaiDateWithDow = (iso: string | null | undefined): string => {
    if (!iso) return '—';
    const d = parse(iso);
    if (!d) return iso;
    return `วัน${THAI_DOW[d.getDay()]}ที่ ${d.getDate()} ${THAI_MONTHS_FULL[d.getMonth()]} ${d.getFullYear() + 543}`;
};

/** ช่วงวันที่ "11 - 13 พฤษภาคม 2569" หรือคนละเดือน "29 พ.ค. - 2 มิ.ย. 2569" */
export const formatThaiDateRange = (
    startIso: string | null | undefined,
    endIso: string | null | undefined,
): string => {
    if (!startIso) return '—';
    if (!endIso || endIso === startIso) return formatThaiDateFull(startIso);
    const s = parse(startIso);
    const e = parse(endIso);
    if (!s || !e) return formatThaiDateFull(startIso);
    const sYear = s.getFullYear() + 543;
    const eYear = e.getFullYear() + 543;
    if (sYear !== eYear) {
        // คนละปี → แสดงเต็มทั้ง 2 ฝั่ง
        return `${formatThaiDateFull(startIso)} - ${formatThaiDateFull(endIso)}`;
    }
    if (s.getMonth() !== e.getMonth()) {
        // คนละเดือนเดียวกัน → ย่อเดือน
        return `${s.getDate()} ${THAI_MONTHS_SHORT[s.getMonth()]} - ${e.getDate()} ${THAI_MONTHS_SHORT[e.getMonth()]} ${eYear}`;
    }
    // เดือนเดียวกัน → "11 - 13 พฤษภาคม 2569"
    return `${s.getDate()} - ${e.getDate()} ${THAI_MONTHS_FULL[s.getMonth()]} ${eYear}`;
};
