import { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { prefersReducedMotion } from './types';
import type { TrainingRecord } from '@/services/training.service';

interface Props {
    record: TrainingRecord | null;
}

/**
 * CursorFollower — รูปครู floating ตาม cursor บน lg+ เท่านั้น
 *
 * - track window mousemove → useSpring smooth follow
 * - hidden ตอน record=null (ไม่ hover cert)
 * - hidden ทั้งหมดบน touch device (lg+ class)
 * - disable ถ้า prefers-reduced-motion
 */
export const CursorFollower = ({ record }: Props) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const sx = useSpring(x, { stiffness: 350, damping: 30, mass: 0.5 });
    const sy = useSpring(y, { stiffness: 350, damping: 30, mass: 0.5 });

    useEffect(() => {
        if (prefersReducedMotion()) return;
        const onMove = (e: MouseEvent) => {
            x.set(e.clientX + 14);
            y.set(e.clientY + 14);
        };
        window.addEventListener('mousemove', onMove, { passive: true });
        return () => window.removeEventListener('mousemove', onMove);
    }, [x, y]);

    if (!record?.staff || prefersReducedMotion()) return null;

    return (
        <motion.div
            className="pointer-events-none fixed top-0 left-0 z-50 hidden lg:flex items-center gap-2 bg-card/95 backdrop-blur-md ring-2 ring-violet-400 shadow-xl rounded-full pl-1 pr-3 py-1"
            style={{ x: sx, y: sy }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            aria-hidden
        >
            <PersonAvatar
                name={record.staff.name}
                photoUrl={record.staff.photo_url}
                size="sm"
                className="ring-2 ring-violet-400 flex-shrink-0"
            />
            <div className="min-w-0">
                <div className="text-xs font-bold text-foreground leading-tight truncate max-w-[160px]">
                    {record.staff.name}
                </div>
                <div className="text-[10px] text-muted-foreground leading-tight">
                    {record.hours} ชม. · {record.training_type}
                </div>
            </div>
        </motion.div>
    );
};
