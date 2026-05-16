import type { TrainingRecord } from '@/services/training.service';

export type ViewMode = 'grid' | 'bento' | 'spotlight' | 'polaroid' | 'timeline';

export interface ViewProps {
    records: TrainingRecord[];
    showStaff: boolean;
    onSelect: (idx: number) => void;
    /** stats สำหรับ Bento mode (admin-only — public ผ่าน aggregate prop) */
    stats?: { totalHours: number; totalCount: number; uniqueStaff: number };
    /** hook callback ตอน hover (admin only — สำหรับ cursor follower) */
    onHoverRecord?: (record: TrainingRecord | null) => void;
}

/** เช็ค prefers-reduced-motion */
export const prefersReducedMotion = (): boolean => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/** Deterministic small "random" จาก string (สำหรับ Polaroid rotation) */
export const hashString = (s: string): number => {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = ((h << 5) - h) + s.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
};
