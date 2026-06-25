import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface Props {
    cover: string;
    video: string;
    title: string;
    /** หน่วงรูปปกกี่ ms ก่อนเล่นเดโม (default 2000) */
    delayMs?: number;
}

/**
 * การ์ดกริดวิดีโอ: โชว์รูปปกก่อน → เข้าจอครบ delayMs → เล่นคลิปเดโม (มิวต์ วน) ทับปกแบบ fade.
 * - auto-play เฉพาะการ์ด "ในจอ" (IntersectionObserver) — off-screen ไม่โหลด/ไม่เล่น (lazy `src`)
 * - เคารพ prefers-reduced-motion + data-saver → โชว์รูปปกเฉย ๆ (ไม่โหลดวิดีโอ)
 * - ออกจอ → หยุด + คาย src กัน memory (กลับมา = หน่วงใหม่แล้วโหลด)
 */
export const GameDemoPreview = ({ cover, video, title, delayMs = 2000 }: Props) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [playing, setPlaying] = useState(false);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        // Guard: ผู้ใช้ตั้งลดการเคลื่อนไหว หรือโหมดประหยัดเน็ต → ไม่เล่นวิดีโอเลย
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
        if (reduce || saveData) return;

        let timer: ReturnType<typeof setTimeout> | undefined;

        const io = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                const v = videoRef.current;
                if (entry.isIntersecting) {
                    timer = setTimeout(() => {
                        if (!v) return;
                        if (!v.getAttribute('src')) v.setAttribute('src', video); // lazy load ตอนจะเล่น
                        v.play().then(() => setPlaying(true)).catch(() => { /* autoplay ถูกบล็อก → คงรูปปก */ });
                    }, delayMs);
                } else {
                    if (timer) { clearTimeout(timer); timer = undefined; }
                    setPlaying(false);
                    if (v) {
                        v.pause();
                        v.removeAttribute('src');  // คาย memory
                        v.load();
                    }
                }
            },
            { threshold: 0.5 },
        );

        io.observe(el);
        return () => {
            io.disconnect();
            if (timer) clearTimeout(timer);
        };
    }, [video, delayMs]);

    return (
        <div ref={containerRef} className="aspect-video w-full overflow-hidden bg-muted relative">
            <img
                src={cover}
                alt={title}
                loading="lazy"
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            />
            <video
                ref={videoRef}
                muted
                loop
                playsInline
                preload="none"
                aria-hidden="true"
                tabIndex={-1}
                className={cn(
                    'absolute inset-0 w-full h-full object-cover transition-opacity duration-500',
                    playing ? 'opacity-100' : 'opacity-0 pointer-events-none',
                )}
            />
        </div>
    );
};
