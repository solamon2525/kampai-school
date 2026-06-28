/** ช่องสี + config สำหรับ recolor sprite sheet */

export type CharacterColorSlot = {
    id: string;
    label: string;
    source: { r: number; g: number; b: number };
    target: string;
    tolerance?: number;
    enabled?: boolean;
};

export type CharacterColorConfig = {
    version: 1;
    mode: 'palette';
    slots: CharacterColorSlot[];
    /** สี P2 co-op — ว่าง = ใช้ slots เดียวกับ P1 */
    slotsP2?: CharacterColorSlot[];
    preset?: string;
};

export const CHARACTER_COLOR_PRESETS: Record<string, { label: string; slots: Omit<CharacterColorSlot, 'id'>[] }> = {
    original: { label: 'ต้นฉบับ', slots: [] },
    'bunny-blue': {
        label: 'กระต่ายฟ้า',
        slots: [
            { label: 'ตัว', source: { r: 245, g: 240, b: 230 }, target: '#bae6fd', tolerance: 22 },
            { label: 'เงา', source: { r: 180, g: 160, b: 140 }, target: '#3b82f6', tolerance: 28 },
            { label: 'หู', source: { r: 255, g: 180, b: 200 }, target: '#93c5fd', tolerance: 24 },
            { label: 'ขอบ', source: { r: 60, g: 40, b: 30 }, target: '#1e3a8a', tolerance: 20 },
        ],
    },
    'bunny-pink': {
        label: 'กระต่ายชมพู',
        slots: [
            { label: 'ตัว', source: { r: 245, g: 240, b: 230 }, target: '#fce7f3', tolerance: 22 },
            { label: 'เงา', source: { r: 180, g: 160, b: 140 }, target: '#ec4899', tolerance: 28 },
            { label: 'หู', source: { r: 255, g: 180, b: 200 }, target: '#f472b6', tolerance: 24 },
            { label: 'ขอบ', source: { r: 60, g: 40, b: 30 }, target: '#9d174d', tolerance: 20 },
        ],
    },
    'bunny-green': {
        label: 'กระต่ายเขียว',
        slots: [
            { label: 'ตัว', source: { r: 245, g: 240, b: 230 }, target: '#dcfce7', tolerance: 22 },
            { label: 'เงา', source: { r: 180, g: 160, b: 140 }, target: '#22c55e', tolerance: 28 },
            { label: 'หู', source: { r: 255, g: 180, b: 200 }, target: '#86efac', tolerance: 24 },
            { label: 'ขอบ', source: { r: 60, g: 40, b: 30 }, target: '#14532d', tolerance: 20 },
        ],
    },
};

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex(r: number, g: number, b: number): string {
    const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    return `#${c(r)}${c(g)}${c(b)}`;
}

export function parseCharacterColorConfig(raw: unknown): CharacterColorConfig | null {
    if (!raw || typeof raw !== 'object') return null;
    const o = raw as Record<string, unknown>;
    if (o.version !== 1) return null;
    const slots = Array.isArray(o.slots) ? parseSlots(o.slots) : [];
    const slotsP2 = Array.isArray(o.slotsP2) ? parseSlots(o.slotsP2) : undefined;
    return {
        version: 1,
        mode: 'palette',
        slots,
        slotsP2,
        preset: typeof o.preset === 'string' ? o.preset : undefined,
    };
}

function parseSlots(arr: unknown[]): CharacterColorSlot[] {
    return arr
        .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
        .map((s, i) => {
            const src = s.source as { r?: number; g?: number; b?: number } | undefined;
            return {
                id: typeof s.id === 'string' ? s.id : `slot-${i}`,
                label: typeof s.label === 'string' ? s.label : `สี ${i + 1}`,
                source: {
                    r: src?.r ?? 0,
                    g: src?.g ?? 0,
                    b: src?.b ?? 0,
                },
                target: typeof s.target === 'string' ? s.target : '#ffffff',
                tolerance: typeof s.tolerance === 'number' ? s.tolerance : 18,
                enabled: s.enabled !== false,
            };
        });
}

export function presetToColorConfig(presetKey: string): CharacterColorConfig {
    const p = CHARACTER_COLOR_PRESETS[presetKey];
    if (!p || presetKey === 'original') {
        return { version: 1, mode: 'palette', slots: [], preset: 'original' };
    }
    return {
        version: 1,
        mode: 'palette',
        preset: presetKey,
        slots: p.slots.map((s, i) => ({
            id: `slot-${i}`,
            ...s,
            enabled: true,
        })),
    };
}

export function hasActiveColorSlots(config: CharacterColorConfig | null | undefined): boolean {
    if (!config?.slots?.length) return false;
    return config.slots.some((s) => s.enabled !== false);
}

export function effectiveColorSlots(
    config: CharacterColorConfig | null | undefined,
    player: 1 | 2 = 1,
): CharacterColorSlot[] {
    if (!config) return [];
    if (player === 2 && config.slotsP2?.length) return config.slotsP2.filter((s) => s.enabled !== false);
    return (config.slots ?? []).filter((s) => s.enabled !== false);
}
