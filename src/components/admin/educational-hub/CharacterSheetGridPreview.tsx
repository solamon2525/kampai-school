import { useEffect, useRef, useState } from 'react';
import {
    type CharacterAnimationConfig,
    characterFrameRect,
    resolveCharacterAnimation,
} from '@/lib/character-animation';
import type { CharacterColorConfig } from '@/lib/character-color';
import { recolorImageToCanvas } from '@/lib/sprite-recolor';
import { SPRITE_CHECKERBOARD_STYLE } from '@/lib/sprite-background';
import { cn } from '@/lib/utils';

type Props = {
    sheetUrl: string;
    frameWidth: number;
    frameHeight: number;
    frameCount: number;
    animationConfig?: CharacterAnimationConfig | null;
    colorConfig?: CharacterColorConfig | null;
    player?: 1 | 2;
    className?: string;
    maxHeight?: number;
};

/** แสดง sprite sheet ทั้งแผ่นพร้อมเส้น grid แต่ละเฟรม */
export function CharacterSheetGridPreview({
    sheetUrl,
    frameWidth,
    frameHeight,
    frameCount,
    animationConfig,
    colorConfig,
    player = 1,
    className,
    maxHeight = 200,
}: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [drawSrc, setDrawSrc] = useState<CanvasImageSource | null>(null);

    useEffect(() => {
        let cancelled = false;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = async () => {
            if (cancelled) return;
            const canvas = await recolorImageToCanvas(img, colorConfig, player);
            setDrawSrc(canvas);
        };
        img.onerror = () => { if (!cancelled) setDrawSrc(null); };
        img.src = sheetUrl;
        return () => { cancelled = true; };
    }, [sheetUrl, colorConfig, player]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !drawSrc) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const anim = resolveCharacterAnimation(animationConfig, frameCount);
        const nw = 'naturalWidth' in drawSrc ? drawSrc.naturalWidth : (drawSrc as HTMLCanvasElement).width;
        const nh = 'naturalHeight' in drawSrc ? drawSrc.naturalHeight : (drawSrc as HTMLCanvasElement).height;
        const scale = Math.min(1, maxHeight / nh, 480 / nw);
        const dw = Math.round(nw * scale);
        const dh = Math.round(nh * scale);
        canvas.width = dw;
        canvas.height = dh;
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, dw, dh);
        ctx.drawImage(drawSrc, 0, 0, dw, dh);

        const fw = frameWidth * scale;
        const fh = frameHeight * scale;
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.85)';
        ctx.lineWidth = 1;
        ctx.fillStyle = 'rgba(236, 72, 153, 0.12)';
        ctx.font = `${Math.max(8, Math.floor(9 * scale))}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let i = 0; i < frameCount; i++) {
            const { sx, sy } = characterFrameRect(i, frameWidth, frameHeight, anim);
            const dx = sx * scale;
            const dy = sy * scale;
            ctx.fillRect(dx, dy, fw, fh);
            ctx.strokeRect(dx + 0.5, dy + 0.5, fw - 1, fh - 1);
            ctx.fillStyle = 'rgba(190, 24, 93, 0.95)';
            ctx.fillText(String(i), dx + fw / 2, dy + fh / 2);
            ctx.fillStyle = 'rgba(236, 72, 153, 0.12)';
        }
    }, [drawSrc, frameWidth, frameHeight, frameCount, animationConfig, maxHeight]);

    return (
        <canvas
            ref={canvasRef}
            className={cn('max-w-full rounded border border-border', className)}
            style={{ imageRendering: 'pixelated', ...SPRITE_CHECKERBOARD_STYLE }}
            aria-label="Sprite sheet grid preview"
        />
    );
}
