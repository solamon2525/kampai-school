import { useEffect, useRef } from 'react';
import {
    type CharacterAnimationConfig,
    characterFrameRect,
    resolveCharacterAnimation,
    shouldFlipCharacterFace,
} from '@/lib/character-animation';
import { SPRITE_CHECKERBOARD_STYLE } from '@/lib/sprite-background';
import { cn } from '@/lib/utils';

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
    checkerboard?: boolean;
    /** ทดสอบ flip ตาม runFaces */
    face?: number;
    /** แสดงเส้นพื้น + anchor เท้า (ใช้ใน studio) */
    showGround?: boolean;
    drawW?: number;
    drawH?: number;
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
    checkerboard = false,
    face = 1,
    showGround = false,
    drawW = 96,
    drawH = 128,
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
            if (mode === 'jump') {
                return Array.isArray(anim.jump) ? anim.jump : [anim.jump.up, anim.jump.peak, anim.jump.fall];
            }
            return anim.walk.length ? anim.walk : [0];
        };

        const fps = mode === 'run'
            ? (anim.runFps ?? 10)
            : mode === 'walk'
                ? (anim.walkFps ?? 5)
                : mode === 'jump'
                    ? (anim.jumpFps ?? 8)
                    : 4;

        const tick = (now: number) => {
            if (!start) start = now;
            const fr = framesForMode();
            const idx = mode === 'idle' && fr.length === 1
                ? fr[0]
                : fr[Math.floor(((now - start) / 1000) * fps) % fr.length];
            const { sx, sy } = characterFrameRect(idx, frameWidth, frameHeight, anim);
            const w = canvas.width;
            const h = canvas.height;
            ctx.clearRect(0, 0, w, h);

            if (showGround) {
                const groundY = h - 12;
                ctx.strokeStyle = 'hsl(var(--border))';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(8, groundY);
                ctx.lineTo(w - 8, groundY);
                ctx.stroke();
                ctx.fillStyle = 'hsl(var(--muted-foreground) / 0.5)';
                ctx.font = '10px sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('พื้น', 10, groundY - 4);
            }

            if (img.complete && img.naturalWidth > 0) {
                const footRatio = anim.anchorFoot ?? 0.94;
                const feetPad = anim.feetPad ?? 0;
                const scale = showGround ? Math.min((w - 24) / drawW, (h - 28) / drawH) : w / frameWidth;
                const dw = showGround ? drawW * scale : frameWidth * scale;
                const dh = showGround ? drawH * scale : frameHeight * scale;
                const cx = w / 2;
                const groundY = h - 12;
                const dy = showGround ? groundY - dh * footRatio + feetPad * scale : 0;
                const flip = shouldFlipCharacterFace(face, anim);

                ctx.save();
                if (flip) {
                    ctx.translate(cx, dy);
                    ctx.scale(-1, 1);
                    ctx.drawImage(img, sx, sy, frameWidth, frameHeight, -dw / 2, 0, dw, dh);
                } else if (showGround) {
                    ctx.drawImage(img, sx, sy, frameWidth, frameHeight, cx - dw / 2, dy, dw, dh);
                } else {
                    ctx.drawImage(img, sx, sy, frameWidth, frameHeight, 0, 0, dw, dh);
                }
                ctx.restore();
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
    }, [sheetUrl, frameWidth, frameHeight, frameCount, animationConfig, mode, face, showGround, drawW, drawH]);

    return (
        <canvas
            ref={canvasRef}
            width={size}
            height={showGround ? Math.round(size * 1.15) : size}
            className={cn(className)}
            style={{
                imageRendering: 'pixelated',
                ...(checkerboard ? SPRITE_CHECKERBOARD_STYLE : undefined),
            }}
            aria-hidden
        />
    );
}
