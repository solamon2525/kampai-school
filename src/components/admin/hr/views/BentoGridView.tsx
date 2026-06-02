import { motion } from 'framer-motion';
import { Clock, GraduationCap, Users, Sparkles } from 'lucide-react';
import { CertCard } from '../CertCard';
import { cn } from '@/lib/utils';
import { prefersReducedMotion, type ViewProps } from './types';

/**
 * BentoGridView — 6-col grid + mixed-size slot pattern + stat tiles แทรกระหว่าง cert
 *
 * Slot pattern (12-col base, ทุก 6 cert จะมี 1 stat tile):
 *   ใบ 0 (big landscape) col-span-4 row-span-2
 *   ใบ 1 (square)        col-span-2 row-span-2
 *   ใบ 2 (1×1)           col-span-2 row-span-1
 *   stat tile            col-span-2 row-span-1
 *   ใบ 3 (square)        col-span-3 row-span-2
 *   ใบ 4 (tall)          col-span-3 row-span-2
 *   ใบ 5 (wide thin)     col-span-6 row-span-1
 */
const SLOT_CLASSES = [
    'col-span-2 lg:col-span-4 lg:row-span-2', // 0 big landscape
    'col-span-2 lg:col-span-2 lg:row-span-2', // 1 square
    'col-span-1 lg:col-span-2 lg:row-span-1', // 2
    'col-span-1 lg:col-span-2 lg:row-span-1', // 3 stat
    'col-span-2 lg:col-span-3 lg:row-span-2', // 4 square
    'col-span-2 lg:col-span-3 lg:row-span-2', // 5 tall
    'col-span-2 lg:col-span-6 lg:row-span-1', // 6 wide
];

const STAT_TILES = (stats?: ViewProps['stats']) => [
    { icon: Clock, label: 'ชั่วโมงรวม', value: stats?.totalHours ?? 0, suffix: 'ชม.', bg: 'from-violet-500 to-violet-700' },
    { icon: GraduationCap, label: 'รายการ', value: stats?.totalCount ?? 0, suffix: '', bg: 'from-fuchsia-500 to-violet-700' },
    { icon: Users, label: 'บุคลากร', value: stats?.uniqueStaff ?? 0, suffix: 'คน', bg: 'from-indigo-500 to-violet-700' },
];

export const BentoGridView = ({ records, showStaff, onSelect, stats, onHoverRecord }: ViewProps) => {
    const reduce = prefersReducedMotion();
    const tiles = STAT_TILES(stats);

    // เรียง: 7 cells ต่อกลุ่ม — 6 cert + 1 stat ใน slot[3]
    const items: ({ type: 'cert'; record: typeof records[0]; originalIdx: number } | { type: 'stat'; tileIdx: number })[] = [];
    let certIdx = 0;
    let statIdx = 0;
    while (certIdx < records.length) {
        // ใน 7 slots — slot 3 = stat tile (ทุก 6 certs)
        for (let i = 0; i < 7 && certIdx < records.length; i++) {
            if (i === 3 && tiles.length > 0) {
                items.push({ type: 'stat', tileIdx: statIdx % tiles.length });
                statIdx++;
            } else {
                items.push({ type: 'cert', record: records[certIdx], originalIdx: certIdx });
                certIdx++;
            }
        }
    }

    return (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4 auto-rows-[120px] md:auto-rows-[140px] [grid-auto-flow:dense]">
            {items.map((item, i) => {
                const slotClass = SLOT_CLASSES[i % SLOT_CLASSES.length];
                const motionProps = {
                    initial: reduce ? false : ({ opacity: 0, y: 16 } as const),
                    whileInView: reduce ? undefined : ({ opacity: 1, y: 0 } as const),
                    viewport: { once: true, margin: '-30px' },
                    transition: { duration: 0.35, delay: Math.min(i * 0.025, 0.4) },
                };

                if (item.type === 'stat') {
                    const tile = tiles[item.tileIdx];
                    const Icon = tile.icon;
                    return (
                        <motion.div
                            key={`stat-${i}`}
                            {...motionProps}
                            className={cn(
                                'rounded-2xl overflow-hidden text-white p-4 flex flex-col justify-between relative',
                                'bg-gradient-to-br shadow-lg ring-1 ring-white/10',
                                tile.bg,
                                slotClass,
                            )}
                        >
                            <div className="absolute top-2 right-2 opacity-20">
                                <Sparkles className="w-8 h-8" />
                            </div>
                            <Icon className="w-5 h-5 opacity-90" />
                            <div>
                                <div className="text-3xl md:text-4xl font-extrabold tabular-nums leading-none">
                                    {Number(tile.value).toLocaleString('th-TH')}
                                </div>
                                <div className="text-[10px] uppercase tracking-wider opacity-80 mt-1.5 font-semibold">
                                    {tile.suffix && <span className="mr-1">{tile.suffix}</span>}
                                    {tile.label}
                                </div>
                            </div>
                        </motion.div>
                    );
                }

                // cert
                const r = item.record;
                const isBig = i % SLOT_CLASSES.length === 0 || i % SLOT_CLASSES.length === 4;
                return (
                    <motion.div
                        key={r.id}
                        {...motionProps}
                        onMouseEnter={() => onHoverRecord?.(r)}
                        onMouseLeave={() => onHoverRecord?.(null)}
                        data-bento-featured={isBig ? 'true' : 'false'}
                        className={cn(slotClass, 'h-full')}
                    >
                        <div className="h-full">
                            <CertCard
                                record={r}
                                big={isBig}
                                fill
                                showStaff={showStaff}
                                onClick={() => onSelect(item.originalIdx)}
                            />
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};
