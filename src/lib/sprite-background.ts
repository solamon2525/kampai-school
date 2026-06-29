/**
 * ตัดพื้นหลัง sprite sheet — flood fill จากขอบภาพ
 * ใช้ใน admin คลังตัวละคร (browser)
 */

import type { CSSProperties } from 'react';

export type SpriteBgRemovalOptions = {
    /** ความต่างสีที่ยอมให้ถือเป็นพื้นหลัง (default 32) */
    tolerance?: number;
    /** corner = สุ่มสีจากมุม · white = ขาว/เทาอ่อน · auto = corner แล้ว fallback white */
    mode?: 'auto' | 'corner' | 'white';
};

export const SPRITE_CHECKERBOARD_STYLE: CSSProperties = {
    backgroundColor: '#f1f5f9',
    backgroundImage:
        'linear-gradient(45deg,#cbd5e1 25%,transparent 25%),'
        + 'linear-gradient(-45deg,#cbd5e1 25%,transparent 25%),'
        + 'linear-gradient(45deg,transparent 75%,#cbd5e1 75%),'
        + 'linear-gradient(-45deg,transparent 75%,#cbd5e1 75%)',
    backgroundSize: '10px 10px',
    backgroundPosition: '0 0, 0 5px, 5px -6px, -6px 0',
};

function colorDist(r: number, g: number, b: number, tr: number, tg: number, tb: number): number {
    return Math.max(Math.abs(r - tr), Math.abs(g - tg), Math.abs(b - tb));
}

function isWhiteish(r: number, g: number, b: number, tolerance: number): boolean {
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    return min >= 255 - tolerance - 40 && max - min <= tolerance;
}

function sampleCornerBg(data: Uint8ClampedArray, w: number, h: number): [number, number, number] {
    const pts: [number, number][] = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]];
    let sr = 0;
    let sg = 0;
    let sb = 0;
    let n = 0;
    const sampleR = Math.min(12, Math.floor(w / 8), Math.floor(h / 8));
    for (const [cx, cy] of pts) {
        for (let dy = 0; dy < sampleR; dy++) {
            for (let dx = 0; dx < sampleR; dx++) {
                const x = cx === 0 ? dx : cx - dx;
                const y = cy === 0 ? dy : cy - dy;
                if (x < 0 || x >= w || y < 0 || y >= h) continue;
                const i = (y * w + x) * 4;
                sr += data[i];
                sg += data[i + 1];
                sb += data[i + 2];
                n++;
            }
        }
    }
    if (!n) return [255, 255, 255];
    return [Math.round(sr / n), Math.round(sg / n), Math.round(sb / n)];
}

function buildBgTest(
    data: Uint8ClampedArray,
    w: number,
    h: number,
    opts: SpriteBgRemovalOptions,
): (r: number, g: number, b: number) => boolean {
    const tol = opts.tolerance ?? 32;
    const mode = opts.mode ?? 'auto';
    const [tr, tg, tb] = sampleCornerBg(data, w, h);

    if (mode === 'white') {
        return (r, g, b) => isWhiteish(r, g, b, tol);
    }
    if (mode === 'corner') {
        return (r, g, b) => colorDist(r, g, b, tr, tg, tb) <= tol;
    }
    return (r, g, b) =>
        colorDist(r, g, b, tr, tg, tb) <= tol || isWhiteish(r, g, b, tol);
}

export function removeBackgroundFromRgba(
    data: Uint8ClampedArray,
    w: number,
    h: number,
    opts: SpriteBgRemovalOptions = {},
): Uint8ClampedArray {
    const out = new Uint8ClampedArray(data);
    const isBg = buildBgTest(out, w, h, opts);
    const vis = new Uint8Array(w * h);
    const q: number[] = [];

    function trySeed(x: number, y: number) {
        if (x < 0 || x >= w || y < 0 || y >= h) return;
        const i = y * w + x;
        if (vis[i]) return;
        const o = i * 4;
        if (!isBg(out[o], out[o + 1], out[o + 2])) return;
        vis[i] = 1;
        q.push(i);
    }

    for (let x = 0; x < w; x++) {
        trySeed(x, 0);
        trySeed(x, h - 1);
    }
    for (let y = 0; y < h; y++) {
        trySeed(0, y);
        trySeed(w - 1, y);
    }

    while (q.length) {
        const i = q.pop()!;
        const x = i % w;
        const y = (i / w) | 0;
        for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]] as const) {
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
            const ni = ny * w + nx;
            if (vis[ni]) continue;
            const o = ni * 4;
            if (!isBg(out[o], out[o + 1], out[o + 2])) continue;
            vis[ni] = 1;
            q.push(ni);
        }
    }

    for (let i = 0; i < w * h; i++) {
        if (vis[i]) out[i * 4 + 3] = 0;
    }
    return out;
}

async function fileToImageData(file: Blob): Promise<{ data: Uint8ClampedArray; w: number; h: number }> {
    const url = URL.createObjectURL(file);
    try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const el = new Image();
            el.onload = () => resolve(el);
            el.onerror = reject;
            el.src = url;
        });
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('canvas 2d ไม่พร้อม');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, w, h);
        return { data: imageData.data, w, h };
    } finally {
        URL.revokeObjectURL(url);
    }
}

async function rgbaToPngFile(
    data: Uint8ClampedArray,
    w: number,
    h: number,
    filename: string,
): Promise<File> {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas 2d ไม่พร้อม');
    ctx.putImageData(new ImageData(data, w, h), 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob ล้มเหลว'))), 'image/png');
    });
    return new File([blob], filename.replace(/\.[^.]+$/, '') + '.png', { type: 'image/png' });
}

export async function processSpriteSheetFile(
    file: File,
    opts: SpriteBgRemovalOptions = {},
): Promise<File> {
    const { data, w, h } = await fileToImageData(file);
    const cleaned = removeBackgroundFromRgba(data, w, h, opts);
    return rgbaToPngFile(cleaned, w, h, file.name);
}

export async function processSpriteSheetPreviewUrl(
    file: File,
    opts: SpriteBgRemovalOptions = {},
): Promise<string> {
    const out = await processSpriteSheetFile(file, opts);
    return URL.createObjectURL(out);
}

export function transparentRatio(data: Uint8ClampedArray): number {
    let t = 0;
    for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 16) t++;
    }
    return t / (data.length / 4);
}
