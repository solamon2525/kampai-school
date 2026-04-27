/**
 * Color conversion utilities for Theme Manager.
 * CSS custom properties in this project use HSL space-separated format
 * (e.g. `--primary: 142 72% 29%`) so Tailwind's `hsl(var(--primary))` works.
 *
 * These helpers convert between hex (admin UI) and HSL string (CSS var value).
 */

/** Clamp number to [0, 1] */
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** Validate `#RRGGBB` (case-insensitive). Returns normalized lowercase form or null. */
export const normalizeHex = (input: string): string | null => {
    const trimmed = input.trim();
    if (!/^#?[0-9A-Fa-f]{6}$/.test(trimmed)) return null;
    return `#${trimmed.replace(/^#/, '').toLowerCase()}`;
};

/** Convert `#RRGGBB` to `[r, g, b]` in [0, 1]. Throws if invalid. */
export const hexToRgb01 = (hex: string): [number, number, number] => {
    const h = normalizeHex(hex);
    if (!h) throw new Error(`Invalid hex color: ${hex}`);
    const n = parseInt(h.slice(1), 16);
    return [
        ((n >> 16) & 0xff) / 255,
        ((n >> 8) & 0xff) / 255,
        (n & 0xff) / 255,
    ];
};

/** Convert `[r, g, b]` in [0, 1] to `#rrggbb`. */
export const rgb01ToHex = (r: number, g: number, b: number): string => {
    const toHex = (v: number) =>
        Math.round(clamp01(v) * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/** Convert RGB [0,1] to HSL [h(0-360), s(0-1), l(0-1)]. */
export const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0;
    let s = 0;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
                break;
            case g:
                h = ((b - r) / d + 2) * 60;
                break;
            default:
                h = ((r - g) / d + 4) * 60;
        }
    }
    return [h, s, l];
};

/** Convert HSL [h(0-360), s(0-1), l(0-1)] back to RGB [0,1]. */
export const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
    if (s === 0) return [l, l, l];
    const hue2rgb = (p: number, q: number, t: number) => {
        let tt = t;
        if (tt < 0) tt += 1;
        if (tt > 1) tt -= 1;
        if (tt < 1 / 6) return p + (q - p) * 6 * tt;
        if (tt < 1 / 2) return q;
        if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
        return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hh = h / 360;
    return [hue2rgb(p, q, hh + 1 / 3), hue2rgb(p, q, hh), hue2rgb(p, q, hh - 1 / 3)];
};

/**
 * Convert hex (`#RRGGBB`) → CSS HSL space-separated string for `--var: <value>`.
 * Example: `#157F3C` → `"142 72% 29%"`
 */
export const hexToHslString = (hex: string): string => {
    const [r, g, b] = hexToRgb01(hex);
    const [h, s, l] = rgbToHsl(r, g, b);
    return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

/** Convert HSL space-separated string back to hex (`#rrggbb`). */
export const hslStringToHex = (hsl: string): string | null => {
    const m = hsl.trim().match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
    if (!m) return null;
    const h = parseFloat(m[1]);
    const s = parseFloat(m[2]) / 100;
    const l = parseFloat(m[3]) / 100;
    const [r, g, b] = hslToRgb(h, s, l);
    return rgb01ToHex(r, g, b);
};

/** WCAG relative luminance for an sRGB color (RGB in [0,1]). */
const luminance = (r: number, g: number, b: number) => {
    const trans = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * trans(r) + 0.7152 * trans(g) + 0.0722 * trans(b);
};

/** WCAG contrast ratio between two hex colors. Returns ratio (1 worst, 21 best). */
export const contrastRatio = (hexA: string, hexB: string): number => {
    const [r1, g1, b1] = hexToRgb01(hexA);
    const [r2, g2, b2] = hexToRgb01(hexB);
    const l1 = luminance(r1, g1, b1);
    const l2 = luminance(r2, g2, b2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
};
