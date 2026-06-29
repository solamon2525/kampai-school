/** Export PNG แยกท่า — strip แนวนอนต่อท่า */

import {
    type CharacterAnimationConfig,
    type CharacterPoseKey,
    characterFrameRect,
    getPoseFrames,
    resolveCharacterAnimation,
} from '@/lib/character-animation';
import type { CharacterColorConfig } from '@/lib/character-color';
import { recolorImageToCanvas } from '@/lib/sprite-recolor';

function collectFrameIndices(
    anim: CharacterAnimationConfig,
    pose: CharacterPoseKey,
): number[] {
    const frames = getPoseFrames(anim, pose);
    if (frames == null) return [];
    if (Array.isArray(frames)) return frames;
    if (typeof frames === 'number') return [frames];
    return [frames.up, frames.peak, frames.fall];
}

export async function exportPoseStripPng(opts: {
    sheetUrl: string;
    frameWidth: number;
    frameHeight: number;
    frameCount: number;
    animationConfig: CharacterAnimationConfig | null | undefined;
    colorConfig?: CharacterColorConfig | null;
    pose: CharacterPoseKey;
    player?: 1 | 2;
}): Promise<Blob | null> {
    const {
        sheetUrl,
        frameWidth,
        frameHeight,
        frameCount,
        animationConfig,
        colorConfig,
        pose,
        player = 1,
    } = opts;

    const anim = resolveCharacterAnimation(animationConfig, frameCount);
    const indices = collectFrameIndices(anim, pose);
    if (!indices.length) return null;

    const img = await loadRecolored(sheetUrl, colorConfig, player);
    const fw = frameWidth;
    const fh = frameHeight;
    const canvas = document.createElement('canvas');
    canvas.width = fw * indices.length;
    canvas.height = fh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.imageSmoothingEnabled = false;
    indices.forEach((fi, i) => {
        const { sx, sy } = characterFrameRect(fi, fw, fh, anim);
        ctx.drawImage(img, sx, sy, fw, fh, i * fw, 0, fw, fh);
    });

    return canvasToBlob(canvas);
}

export async function exportPoseFramePng(opts: {
    sheetUrl: string;
    frameWidth: number;
    frameHeight: number;
    frameCount: number;
    animationConfig: CharacterAnimationConfig | null | undefined;
    colorConfig?: CharacterColorConfig | null;
    frameIndex: number;
    player?: 1 | 2;
}): Promise<Blob | null> {
    const anim = resolveCharacterAnimation(opts.animationConfig, opts.frameCount);
    const img = await loadRecolored(opts.sheetUrl, opts.colorConfig, opts.player ?? 1);
    const { sx, sy } = characterFrameRect(opts.frameIndex, opts.frameWidth, opts.frameHeight, anim);
    const canvas = document.createElement('canvas');
    canvas.width = opts.frameWidth;
    canvas.height = opts.frameHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, sx, sy, opts.frameWidth, opts.frameHeight, 0, 0, opts.frameWidth, opts.frameHeight);
    return canvasToBlob(canvas);
}

function loadRecolored(
    url: string,
    colorConfig: CharacterColorConfig | null | undefined,
    player: 1 | 2,
): Promise<CanvasImageSource> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = async () => {
            try {
                const canvas = await recolorImageToCanvas(img, colorConfig ?? null, player);
                resolve(canvas);
            } catch {
                resolve(img);
            }
        };
        img.onerror = reject;
        img.src = url;
    });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
    return new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/png');
    });
}

export function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export const EXPORT_POSE_OPTIONS: { key: CharacterPoseKey; label: string }[] = [
    { key: 'idle', label: 'idle' },
    { key: 'walk', label: 'walk' },
    { key: 'run', label: 'run' },
    { key: 'jump', label: 'jump' },
    { key: 'hurt', label: 'hurt' },
    { key: 'happy', label: 'happy' },
];
