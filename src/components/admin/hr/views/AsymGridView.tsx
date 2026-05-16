import { motion } from 'framer-motion';
import { CertCard } from '../CertCard';
import { prefersReducedMotion, type ViewProps } from './types';

export const AsymGridView = ({ records, showStaff, onSelect, onHoverRecord }: ViewProps) => {
    const reduce = prefersReducedMotion();
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 [grid-auto-flow:dense]">
            {records.map((r, idx) => (
                <motion.div
                    key={r.id}
                    initial={reduce ? false : { opacity: 0, y: 20 }}
                    whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.35, delay: Math.min(idx * 0.03, 0.45) }}
                    onMouseEnter={() => onHoverRecord?.(r)}
                    onMouseLeave={() => onHoverRecord?.(null)}
                    className={idx % 7 === 0 ? 'lg:col-span-2 lg:row-span-2' : ''}
                >
                    <CertCard
                        record={r}
                        big={idx % 7 === 0}
                        showStaff={showStaff}
                        onClick={() => onSelect(idx)}
                    />
                </motion.div>
            ))}
        </div>
    );
};
