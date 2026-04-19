import { useRef } from 'react';
import { useInView, useReducedMotion, type Variants } from 'framer-motion';

/* ────────────────────────────────────────────────────────────────── *
 * Preset animation variants for Framer Motion.
 * All variants automatically collapse to "no animation" when the user
 * has prefers-reduced-motion set (handled by useScrollReveal hook).
 * ────────────────────────────────────────────────────────────────── */

export const fadeInVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } },
};

export const slideUpVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export const slideLeftVariants: Variants = {
    hidden: { opacity: 0, x: 24 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export const slideRightVariants: Variants = {
    hidden: { opacity: 0, x: -24 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export const scaleInVariants: Variants = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
};

/** Container — orchestrates children with staggered entrance */
export const staggerContainerVariants: Variants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
        },
    },
};

/** Child variant used inside staggerContainerVariants */
export const staggerItemVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

/** Empty variants for prefers-reduced-motion users */
const noMotionVariants: Variants = {
    hidden: { opacity: 1 },
    visible: { opacity: 1 },
};

interface UseScrollRevealOptions {
    /** Only fire once when entering view (default: true) */
    once?: boolean;
    /** How much of the element must be visible to trigger (0..1). Default 0.2 */
    amount?: number;
    /** Variants to use. Default: slideUpVariants */
    variants?: Variants;
}

/**
 * Scroll-triggered reveal hook built on Framer Motion's useInView.
 *
 * Usage:
 * ```tsx
 * const { ref, animate, variants } = useScrollReveal();
 * return (
 *   <motion.div ref={ref} initial="hidden" animate={animate} variants={variants}>
 *     …content…
 *   </motion.div>
 * );
 * ```
 *
 * Respects `prefers-reduced-motion` automatically.
 */
export function useScrollReveal(options: UseScrollRevealOptions = {}) {
    const { once = true, amount = 0.2, variants = slideUpVariants } = options;
    const prefersReducedMotion = useReducedMotion();
    const ref = useRef<HTMLElement | null>(null);
    const isInView = useInView(ref as any, { once, amount });

    return {
        ref,
        isInView,
        /** Use with motion.X `animate` prop */
        animate: isInView ? 'visible' : 'hidden',
        variants: prefersReducedMotion ? noMotionVariants : variants,
    };
}
