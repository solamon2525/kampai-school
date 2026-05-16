import { useCallback, useEffect, useRef } from 'react';
import { prefersReducedMotion } from './types';

/**
 * useConfettiOnHover — Lazy-import canvas-confetti + debounce ต่อ id
 *
 * Trigger เฉพาะตอน hover cert ที่ "featured" (high hours / big tile)
 * — ไม่ trigger ซ้ำใน session เดียวกัน
 * — Origin ใช้ตำแหน่ง cursor ปัจจุบัน (track global mousemove)
 *
 * Usage:
 *   const trigger = useConfettiOnHover();
 *   onMouseEnter={() => trigger(record.id)}
 */
export function useConfettiOnHover() {
    const firedRef = useRef<Set<string>>(new Set());
    const cursorRef = useRef({ x: 0.5, y: 0.5 });

    useEffect(() => {
        if (prefersReducedMotion()) return;
        const onMove = (e: MouseEvent) => {
            cursorRef.current = {
                x: e.clientX / window.innerWidth,
                y: e.clientY / window.innerHeight,
            };
        };
        window.addEventListener('mousemove', onMove, { passive: true });
        return () => window.removeEventListener('mousemove', onMove);
    }, []);

    return useCallback(async (id: string) => {
        if (prefersReducedMotion()) return;
        if (firedRef.current.has(id)) return;
        firedRef.current.add(id);
        setTimeout(() => firedRef.current.delete(id), 5000);

        try {
            const { default: confetti } = await import('canvas-confetti');
            confetti({
                particleCount: 28,
                spread: 60,
                startVelocity: 25,
                scalar: 0.7,
                ticks: 100,
                origin: cursorRef.current,
                colors: ['#a78bfa', '#7c3aed', '#fbbf24', '#f59e0b', '#ec4899'],
                disableForReducedMotion: true,
            });
        } catch {
            // silent fail
        }
    }, []);
}
