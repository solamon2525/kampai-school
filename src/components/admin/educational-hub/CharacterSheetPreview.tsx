import { useEffect, useRef } from 'react';
import {
    type CharacterAnimationConfig,
    resolveCharacterAnimation,
} from '@/lib/character-animation';

type Props = {
    sheetUrl: string;
    frameWidth: number;
    frameHeight: number;
    frameCount: number;
    animationConfig?: CharacterAnimationConfig | null;
    /** idle | walk | run | jump */
    mode?: 'idle' | 'walk' | 'run' | 'jump';
    size?: number;
    className?: string;
};

export function CharacterSheetPreview({
    sheetUrl,
    frameWidth,
    frameHeight,
    frameCount,
    animationConfig,
    mode = 'walk',
    size = 64,
    className,
}: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const anim = resolveCharacterAnimation(animationConfig, frameCount);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.imageSmoothingEnabled = false;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        let raf = 0;
        let start = 0;

        const framesForMode = (): number[] => {
            if (mode === 'idle') return anim.idle.length ? anim.idle : [0];
            if (mode === 'run') return anim.run.length ? anim.run : [0];
            if (mode === 'jump') return [anim.jump.up, anim.jump.peak, anim.jump.fall];
            return anim.walk.length ? anim.walk : [0];
        };

        const fps = mode === 'run'
            ? (anim.runFps ?? 10)
            : mode === 'walk'
                ? (anim.walkFps ?? 5)
                : mode === 'jump'
                    ? 8
                    : 1;

        const tick = (now: number) => {
            if (!start) start = now;
            const fr = framesForMode();
            const idx = mode === 'idle'
                ? fr[0]
                : fr[Math.floor(((now - start) / 1000) * fps) % fr.length];
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (img.complete && img.naturalWidth > 0) {
                ctx.drawImage(
                    img,
                    idx * frameWidth,
                    0,
                    frameWidth,
                    frameHeight,
                    0,
                    0,
                    canvas.width,
                    canvas.height,
                );
            }
            raf = requestAnimationFrame(tick);
        };

        img.onload = () => {
            cancelAnimationFrame(raf);
            start = 0;
            raf = requestAnimationFrame(tick);
        };
        img.src = sheetUrl;

        return () => {
            cancelAnimationFrame(raf);
            img.onload = null;
        };
    }, [sheetUrl, frameWidth, frameHeight, frameCount, animationConfig, mode]);

    return (
        <canvas
            ref={canvasRef}
            width={size}
            height={size}
            className={className}
            style={{ imageRendering: 'pixelated' }}
            aria-hidden
        />
    );
}
