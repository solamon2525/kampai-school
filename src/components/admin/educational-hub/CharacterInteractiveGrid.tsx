import { useCallback, useEffect, useRef, useState } from 'react';
import {
    type CharacterAnimationConfig,
    type PoseMapTarget,
    characterFrameRect,
    framesForMapTarget,
    resolveCharacterAnimation,
    toggleFrameInPoseMap,
} from '@/lib/character-animation';
import type { CharacterColorConfig } from '@/lib/character-color';
import type { SpriteAutoFitResult } from '@/lib/sprite-frame-autofit';
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
    autoFitAnalysis?: SpriteAutoFitResult | null;
    mapTarget?: PoseMapTarget | null;
    onAnimConfigChange?: (config: CharacterAnimationConfig) => void;
    className?: string;
    maxHeight?: number;
};

/** Grid คลิก map ท่า — ไม่ต้องพิมพ์เลขเฟรม */
export function CharacterInteractiveGrid({
    sheetUrl,
    frameWidth,
    frameHeight,
    frameCount,
    animationConfig,
    colorConfig,
    player = 1,
    autoFitAnalysis,
    mapTarget,
    onAnimConfigChange,
    className,
    maxHeight = 200,
}: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const layoutRef = useRef({ scale: 1, dw: 0, dh: 0, fw: 0, fh: 0 });
    const [drawSrc, setDrawSrc] = useState<CanvasImageSource | null>(null);

    const anim = resolveCharacterAnimation(animationConfig, frameCount);
    const activeFrames = mapTarget ? framesForMapTarget(anim, mapTarget) : [];
    const activeSet = new Set(activeFrames);

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

    const redraw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !drawSrc) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const nw = 'naturalWidth' in drawSrc ? drawSrc.naturalWidth : (drawSrc as HTMLCanvasElement).width;
        const nh = 'naturalHeight' in drawSrc ? drawSrc.naturalHeight : (drawSrc as HTMLCanvasElement).height;
        const scale = Math.min(1, maxHeight / nh, 480 / nw);
        const dw = Math.round(nw * scale);
        const dh = Math.round(nh * scale);
        canvas.width = dw;
        canvas.height = dh;
        layoutRef.current = { scale, dw, dh, fw: frameWidth * scale, fh: frameHeight * scale };

        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, dw, dh);
        ctx.drawImage(drawSrc, 0, 0, dw, dh);

        const { fw, fh } = layoutRef.current;

        for (let i = 0; i < frameCount; i++) {
            const { sx, sy } = characterFrameRect(i, frameWidth, frameHeight, anim);
            const dx = sx * scale;
            const dy = sy * scale;
            const cellInfo = autoFitAnalysis?.cells.find((c) => c.frame === i);
            const overflow = cellInfo && (
                cellInfo.overflowLeft || cellInfo.overflowRight
                || cellInfo.overflowTop || cellInfo.overflowBottom
            );
            const isActive = activeSet.has(i);

            ctx.fillStyle = overflow
                ? 'rgba(239, 68, 68, 0.15)'
                : isActive
                    ? 'rgba(34, 197, 94, 0.35)'
                    : 'rgba(236, 72, 153, 0.12)';
            ctx.fillRect(dx, dy, fw, fh);
            ctx.strokeStyle = overflow
                ? 'rgba(239, 68, 68, 0.95)'
                : isActive
                    ? 'rgba(22, 163, 74, 0.95)'
                    : 'rgba(236, 72, 153, 0.85)';
            ctx.lineWidth = isActive ? 2 : 1;
            ctx.strokeRect(dx + 0.5, dy + 0.5, fw - 1, fh - 1);

            ctx.fillStyle = isActive ? 'rgba(21, 128, 61, 0.95)' : 'rgba(190, 24, 93, 0.95)';
            ctx.font = `${Math.max(8, Math.floor(9 * scale))}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(i), dx + fw / 2, dy + fh / 2);
        }
    }, [drawSrc, frameWidth, frameHeight, frameCount, anim, maxHeight, autoFitAnalysis, activeSet]);

    useEffect(() => { redraw(); }, [redraw]);

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!mapTarget || !onAnimConfigChange) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);
        const { scale, fw, fh } = layoutRef.current;
        if (!fw || !fh) return;

        for (let i = 0; i < frameCount; i++) {
            const { sx, sy } = characterFrameRect(i, frameWidth, frameHeight, anim);
            const dx = sx * scale;
            const dy = sy * scale;
            if (x >= dx && x < dx + fw && y >= dy && y < dy + fh) {
                onAnimConfigChange(toggleFrameInPoseMap(anim, mapTarget, i));
                return;
            }
        }
    };

    const interactive = Boolean(mapTarget && onAnimConfigChange);

    return (
        <canvas
            ref={canvasRef}
            className={cn(
                'max-w-full rounded border border-border',
                interactive && 'cursor-crosshair ring-1 ring-primary/30',
                className,
            )}
            style={{ imageRendering: 'pixelated', ...SPRITE_CHECKERBOARD_STYLE }}
            onClick={handleClick}
            aria-label={interactive ? 'คลิกเฟรมเพื่อ map ท่า' : 'Sprite sheet grid preview'}
        />
    );
}
