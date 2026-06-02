import { useMemo } from 'react';
import { CertCard } from '../CertCard';
import { cn } from '@/lib/utils';
import { type ViewProps } from './types';

/**
 * VerticalTimelineView — เส้นเวลาแนวตั้ง จัดกลุ่มตามปี พ.ศ. (ใหม่→เก่า)
 * - เส้นกลางแนวตั้ง + จุด marker ต่อใบ
 * - desktop: การ์ดสลับซ้าย-ขวา · mobile: เรียงเดี่ยวด้านขวาของเส้น
 */
export const VerticalTimelineView = ({ records, showStaff, onSelect, onHoverRecord }: ViewProps) => {
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
            .sort(([a], [b]) => b - a)
            .map(([year, data]) => ({ year, ...data }));
    }, [records]);

    if (groups.length === 0) {
        return <div className="text-center py-12 text-muted-foreground text-sm">ไม่มีเกียรติบัตร</div>;
    }

    return (
        <div className="relative">
            {/* center line */}
            <div className="absolute top-0 bottom-0 left-4 md:left-1/2 w-0.5 bg-violet-200 md:-translate-x-1/2" aria-hidden />

            <div className="space-y-8">
                {groups.map((g) => (
                    <div key={g.year}>
                        {/* year marker */}
                        <div className="relative mb-5 flex md:justify-center">
                            <span className="ml-9 md:ml-0 z-10 px-3 py-1 rounded-full bg-violet-600 text-white text-sm font-bold tabular-nums shadow">
                                {g.year} <span className="text-violet-200 text-xs font-medium">พ.ศ.</span>
                            </span>
                        </div>

                        <div className="space-y-6">
                            {g.records.map((r, i) => {
                                const originalIdx = g.originalIdx[i];
                                const left = i % 2 === 0;
                                return (
                                    <div key={r.id} className="relative md:flex md:items-start">
                                        {/* dot */}
                                        <span className="absolute left-4 md:left-1/2 top-4 w-3 h-3 rounded-full bg-violet-500 ring-4 ring-violet-100 -translate-x-1/2 z-10" aria-hidden />
                                        <div
                                            className={cn(
                                                'pl-10 md:pl-0 md:w-1/2',
                                                left ? 'md:pr-10' : 'md:ml-auto md:pl-10',
                                            )}
                                        >
                                            <div className="max-w-sm">
                                                <CertCard
                                                    record={r}
                                                    showStaff={showStaff}
                                                    onClick={() => onSelect(originalIdx)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
