import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface Props {
    cover: string;
    video: string;
    title: string;
    /**
     * เวลาโชว์รูปปกก่อน/ระหว่างสลับกลับ (ms)
     * ค่าเริ่มต้น 2000 — หลังบ้านตั้งได้ผ่าน school_settings.game_preview_cover_seconds
     */
    coverMs?: number;
    /**
     * เวลาโชว์วิดีโอก่อนสลับกลับไปปก (ms) · 0 = เล่นจนจบคลิป/วนวิดีโออย่างเดียวไม่สลับกลับ
     * ค่าเริ่มต้น 0 (พฤติกรรมเดิม: เข้าจอแล้วเล่นวิดีโอค้าง)
     * หลังบ้าน: school_settings.game_preview_video_seconds
     */
    videoMs?: number;
    /** @deprecated ใช้ coverMs แทน — คงไว้เพื่อไม่พัง caller เดิม */
    delayMs?: number;
}

/**
 * การ์ดกริดวิดีโอ: โชว์รูปปก ↔ คลิปเดโม (มิวต์) สลับวนซ้ำ
 * - coverMs: โชว์ปกก่อนเริ่ม / ระหว่างรอบ
 * - videoMs > 0: เล่นวิดีโซ่แล้วกลับปก วนซ้ำ · videoMs = 0: เล่นวิดีโอค้าง (loop attribute)
 * - auto-play เฉพาะการ์ดในจอ (IntersectionObserver) · prefers-reduced-motion / Save-Data → ปกอย่างเดียว
 */
export const GameDemoPreview = ({
    cover,
    video,
    title,
    coverMs,
    videoMs = 0,
    delayMs,
}: Props) => {
    const coverDelay = coverMs ?? delayMs ?? 2000;
    const videoHold = Math.max(0, videoMs);

    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [playing, setPlaying] = useState(false);
    const [inView, setInView] = useState(false);

    // ติดตามว่าการ์ดอยู่ในจอหรือไม่
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
        if (reduce || saveData) return;

        const io = new IntersectionObserver(
            (entries) => {
                setInView(!!entries[0]?.isIntersecting);
            },
            { threshold: 0.25 },
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    // วงจรปก ↔ วิดีโอ เมื่ออยู่ในจอ
    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;

        v.muted = true;
        v.defaultMuted = true;

        let coverTimer: ReturnType<typeof setTimeout> | undefined;
        let videoTimer: ReturnType<typeof setTimeout> | undefined;
        let cancelled = false;

        const clearTimers = () => {
            if (coverTimer) { clearTimeout(coverTimer); coverTimer = undefined; }
            if (videoTimer) { clearTimeout(videoTimer); videoTimer = undefined; }
        };

        const hideVideo = () => {
            setPlaying(false);
            v.pause();
        };

        const unload = () => {
            hideVideo();
            if (v.getAttribute('src')) {
                v.removeAttribute('src');
                v.load();
            }
        };

        const ensureSrc = () => {
            if (!v.getAttribute('src')) {
                v.setAttribute('src', video);
                v.load();
            }
        };

        const playOnce = () => {
            if (cancelled) return;
            ensureSrc();
            v.muted = true;
            // โหมดวนวิดีโอค้าง: ใช้ loop attribute
            v.loop = videoHold <= 0;
            const p = v.play();
            if (p && typeof p.catch === 'function') {
                p.catch(() => { /* autoplay ถูกบล็อก → คงรูปปก */ });
            }
        };

        const onPlaying = () => {
            if (cancelled) return;
            setPlaying(true);
            // โหมดสลับ: ถือวิดีโอ videoHold แล้วกลับปก → วนซ้ำ
            if (videoHold > 0) {
                if (videoTimer) clearTimeout(videoTimer);
                videoTimer = setTimeout(() => {
                    if (cancelled) return;
                    hideVideo();
                    try { v.currentTime = 0; } catch { /* ignore */ }
                    coverTimer = setTimeout(() => {
                        if (!cancelled) playOnce();
                    }, coverDelay);
                }, videoHold);
            }
        };

        const onEnded = () => {
            // กรณี videoHold > 0 แต่คลิปสั้นกว่า → จบคลิปแล้วก็กลับปก
            if (cancelled || videoHold <= 0) return;
            if (videoTimer) { clearTimeout(videoTimer); videoTimer = undefined; }
            hideVideo();
            try { v.currentTime = 0; } catch { /* ignore */ }
            coverTimer = setTimeout(() => {
                if (!cancelled) playOnce();
            }, coverDelay);
        };

        v.addEventListener('playing', onPlaying);
        v.addEventListener('ended', onEnded);

        if (inView) {
            coverTimer = setTimeout(() => {
                if (!cancelled) playOnce();
            }, coverDelay);
        } else {
            clearTimers();
            unload();
        }

        return () => {
            cancelled = true;
            clearTimers();
            v.removeEventListener('playing', onPlaying);
            v.removeEventListener('ended', onEnded);
            if (!inView) unload();
            else hideVideo();
        };
    }, [video, coverDelay, videoHold, inView]);

    return (
        <div ref={containerRef} className="aspect-video w-full overflow-hidden bg-muted relative">
            <img
                src={cover}
                alt={title}
                loading="lazy"
                className="w-full h-full object-cover"
            />
            <video
                ref={videoRef}
                muted
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
