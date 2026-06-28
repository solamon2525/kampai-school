/**
 * Recolor sprite sheet — palette slots + รักษา shading
 */

import {
    hexToRgb,
    rgbToHex,
    type CharacterColorConfig,
    type CharacterColorSlot,
    effectiveColorSlots,
} from '@/lib/character-color';

export function pixelLuminance(r: number, g: number, b: number): number {
    return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function colorDistMax(r: number, g: number, b: number, tr: number, tg: number, tb: number): number {
    return Math.max(Math.abs(r - tr), Math.abs(g - tg), Math.abs(b - tb));
}

function scaleTargetByRatio(tr: number, tg: number, tb: number, ratio: number): [number, number, number] {
    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
    return [clamp(tr * ratio), clamp(tg * ratio), clamp(tb * ratio)];
}

export function recolorRgb(
    r: number,
    g: number,
    b: number,
    slots: CharacterColorSlot[],
): [number, number, number] {
    if (!slots.length) return [r, g, b];
    let best: CharacterColorSlot | null = null;
    let bestD = Infinity;
    for (const slot of slots) {
        if (slot.enabled === false) continue;
        const tol = slot.tolerance ?? 18;
        const d = colorDistMax(r, g, b, slot.source.r, slot.source.g, slot.source.b);
        if (d <= tol && d < bestD) {
            bestD = d;
            best = slot;
        }
    }
    if (!best) return [r, g, b];
    const srcL = pixelLuminance(best.source.r, best.source.g, best.source.b) || 1;
    const pxL = pixelLuminance(r, g, b);
    const ratio = Math.max(0.35, Math.min(1.65, pxL / srcL));
    const { r: tr, g: tg, b: tb } = hexToRgb(best.target);
    return scaleTargetByRatio(tr, tg, tb, ratio);
}

export function applyColorSlotsToImageData(data: Uint8ClampedArray, slots: CharacterColorSlot[]): void {
    if (!slots.length) return;
    for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a < 8) continue;
        const [nr, ng, nb] = recolorRgb(data[i], data[i + 1], data[i + 2], slots);
        data[i] = nr;
        data[i + 1] = ng;
        data[i + 2] = nb;
    }
}

export function applyColorConfigToCanvas(
    ctx: CanvasRenderingContext2D,
    config: CharacterColorConfig | null | undefined,
    player: 1 | 2 = 1,
): void {
    const slots = effectiveColorSlots(config, player);
    if (!slots.length) return;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const img = ctx.getImageData(0, 0, w, h);
    applyColorSlotsToImageData(img.data, slots);
    ctx.putImageData(img, 0, 0);
}

export async function loadImageElement(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

export async function recolorImageToCanvas(
    img: HTMLImageElement,
    config: CharacterColorConfig | null | undefined,
    player: 1 | 2 = 1,
): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    ctx.drawImage(img, 0, 0);
    applyColorConfigToCanvas(ctx, config, player);
    return canvas;
}

export async function recolorImageToImage(
    url: string,
    config: CharacterColorConfig | null | undefined,
    player: 1 | 2 = 1,
): Promise<HTMLImageElement> {
    const slots = effectiveColorSlots(config, player);
    const img = await loadImageElement(url);
    if (!slots.length) return img;
    const canvas = await recolorImageToCanvas(img, config, player);
    return new Promise((resolve, reject) => {
        const out = new Image();
        out.onload = () => resolve(out);
        out.onerror = reject;
        out.src = canvas.toDataURL('image/png');
    });
}

export async function extractDominantColorSlots(
    url: string,
    maxSlots = 6,
): Promise<CharacterColorSlot[]> {
    const img = await loadImageElement(url);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const bucket = new Map<string, { r: number; g: number; b: number; n: number }>();
    const step = Math.max(1, Math.floor((canvas.width * canvas.height) / 12000));
    for (let i = 0; i < data.length; i += 4 * step) {
        const a = data[i + 3];
        if (a < 128) continue;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r > 250 && g > 250 && b > 250) continue;
        const qr = Math.round(r / 16) * 16;
        const qg = Math.round(g / 16) * 16;
        const qb = Math.round(b / 16) * 16;
        const key = `${qr},${qg},${qb}`;
        const prev = bucket.get(key);
        if (prev) {
            prev.r += r;
            prev.g += g;
            prev.b += b;
            prev.n++;
        } else {
            bucket.set(key, { r, g, b, n: 1 });
        }
    }

    const sorted = [...bucket.values()]
        .map((v) => ({
            r: Math.round(v.r / v.n),
            g: Math.round(v.g / v.n),
            b: Math.round(v.b / v.n),
            n: v.n,
        }))
        .sort((a, b) => b.n - a.n);

    const picked: typeof sorted = [];
    for (const c of sorted) {
        if (picked.length >= maxSlots) break;
        const tooClose = picked.some(
            (p) => colorDistMax(c.r, c.g, c.b, p.r, p.g, p.b) < 24,
        );
        if (!tooClose) picked.push(c);
    }

    const labels = ['ตัว', 'เงา', 'หู', 'ท้อง', 'ขอบ', 'รายละเอียด'];
    return picked.map((c, i) => ({
        id: `slot-${i}`,
        label: labels[i] ?? `สี ${i + 1}`,
        source: { r: c.r, g: c.g, b: c.b },
        target: rgbToHex(c.r, c.g, c.b),
        tolerance: 20,
        enabled: true,
    }));
}
