/** สัญญา animation สำหรับ sprite sheet (horizontal หรือ grid) */

export type CharacterJumpFrames = {
    up: number;
    peak: number;
    fall: number;
};

export type CharacterAnimationConfig = {
    preset: string;
    layout: 'horizontal' | 'grid';
    cols?: number;
    rows?: number;
    idle: number[];
    walk: number[];
    run: number[];
    /** แนวนอน: up/peak/fall · grid: array วนลูปตอนกระโดด */
    jump: CharacterJumpFrames | number[];
    hurt: number;
    happy: number;
    walkFps?: number;
    runFps?: number;
    jumpFps?: number;
};

export const CHARACTER_ANIM_PRESET_PLATFORMER_12: CharacterAnimationConfig = {
    preset: 'platformer-12',
    layout: 'horizontal',
    idle: [0],
    walk: [1, 2],
    run: [3, 4, 5, 6],
    jump: { up: 7, peak: 8, fall: 9 },
    hurt: 10,
    happy: 11,
    walkFps: 5,
    runFps: 10,
};

/** กระต่าย thai-sara-run — grid 3 แถว × 6 คอลัมน์ (วิ่ง / โดด / ยืน) */
export const CHARACTER_ANIM_PRESET_GRID_3X6_18: CharacterAnimationConfig = {
    preset: 'grid-3x6-18',
    layout: 'grid',
    cols: 6,
    rows: 3,
    idle: [12, 13, 14, 15, 16, 17],
    walk: [12, 13, 14, 15, 16, 17],
    run: [0, 1, 2, 3, 4, 5],
    jump: [6, 7, 8, 9, 10, 11],
    hurt: 12,
    happy: 12,
    walkFps: 4,
    runFps: 12,
    jumpFps: 10,
};

export const CHARACTER_ANIM_PRESETS: Record<string, CharacterAnimationConfig> = {
    'platformer-12': CHARACTER_ANIM_PRESET_PLATFORMER_12,
    'grid-3x6-18': CHARACTER_ANIM_PRESET_GRID_3X6_18,
};

export const CHARACTER_ANIM_PRESET_OPTIONS = [
    {
        key: 'grid-3x6-18',
        label: 'Grid 3×6 — 18 เฟรม (วิ่ง / โดด / ยืน)',
        frameCount: 18,
        cols: 6,
        rows: 3,
        frameHint: 'แถว1 วิ่ง 0–5 · แถว2 โดด 6–11 · แถว3 ยืน 12–17',
    },
    {
        key: 'platformer-12',
        label: 'Platformer 12 เฟรม (idle/walk/run/jump/hurt/happy)',
        frameCount: 12,
        frameHint: '0 idle · 1–2 walk · 3–6 run · 7–9 jump · 10 hurt · 11 happy',
    },
] as const;

/** เกมที่ opt-in รองรับ KAMPAI.character + pickCharacterFrame */
export const GAMES_WITH_CHARACTER_SUPPORT = ['thai-sara-run'] as const;

export function isCharacterSupportedGame(slug: string | null | undefined): boolean {
    if (!slug) return false;
    return (GAMES_WITH_CHARACTER_SUPPORT as readonly string[]).includes(slug);
}

export function getCharacterAnimPreset(presetKey: string): CharacterAnimationConfig {
    return CHARACTER_ANIM_PRESETS[presetKey] ?? CHARACTER_ANIM_PRESET_GRID_3X6_18;
}

export function resolveCharacterAnimation(
    config: CharacterAnimationConfig | null | undefined,
    frameCount?: number | null,
): CharacterAnimationConfig {
    if (config?.preset && config.run?.length) return config;
    if (frameCount === 18) return CHARACTER_ANIM_PRESET_GRID_3X6_18;
    if (frameCount === 12) return CHARACTER_ANIM_PRESET_PLATFORMER_12;
    return CHARACTER_ANIM_PRESET_GRID_3X6_18;
}

function collectJumpIndices(jump: CharacterJumpFrames | number[]): number[] {
    if (Array.isArray(jump)) return jump;
    return [jump.up, jump.peak, jump.fall];
}

/** อ่าน animation_config จาก JSONB (Supabase) */
export function parseCharacterAnimationConfig(raw: unknown): CharacterAnimationConfig | null {
    if (!raw || typeof raw !== 'object') return null;
    const o = raw as Record<string, unknown>;
    if (typeof o.preset !== 'string') return null;
    const base = getCharacterAnimPreset(o.preset);
    const jumpRaw = o.jump;
    let jump: CharacterJumpFrames | number[] = base.jump;
    if (Array.isArray(jumpRaw)) jump = jumpRaw as number[];
    else if (jumpRaw && typeof jumpRaw === 'object') {
        jump = { ...(base.jump as CharacterJumpFrames), ...(jumpRaw as CharacterJumpFrames) };
    }
    return {
        ...base,
        ...o,
        layout: o.layout === 'grid' ? 'grid' : base.layout,
        cols: typeof o.cols === 'number' ? o.cols : base.cols,
        rows: typeof o.rows === 'number' ? o.rows : base.rows,
        idle: Array.isArray(o.idle) ? (o.idle as number[]) : base.idle,
        walk: Array.isArray(o.walk) ? (o.walk as number[]) : base.walk,
        run: Array.isArray(o.run) ? (o.run as number[]) : base.run,
        jump,
        hurt: typeof o.hurt === 'number' ? o.hurt : base.hurt,
        happy: typeof o.happy === 'number' ? o.happy : base.happy,
    };
}

/** ตรวจว่า index เฟรมอยู่ในช่วง sheet */
export function validateAnimationConfig(
    config: CharacterAnimationConfig,
    frameCount: number,
): string | null {
    const indices = new Set<number>();
    const collect = (n: number | number[]) => {
        if (Array.isArray(n)) n.forEach((i) => indices.add(i));
        else indices.add(n);
    };
    collect(config.idle);
    collect(config.walk);
    collect(config.run);
    collectJumpIndices(config.jump).forEach((i) => indices.add(i));
    collect(config.hurt);
    collect(config.happy);
    for (const i of indices) {
        if (i < 0 || i >= frameCount) {
            return `เฟรม ${i} เกินช่วง (0–${frameCount - 1})`;
        }
    }
    return null;
}

/** คำนวณขนาดเฟรมจาก PNG */
export function suggestFrameSizeFromImage(
    imgW: number,
    imgH: number,
    frameCount: number,
    opts?: { cols?: number; rows?: number },
): { frameWidth: number; frameHeight: number } | null {
    if (imgW <= 0 || imgH <= 0 || frameCount <= 0) return null;
    const cols = opts?.cols ?? (frameCount === 18 ? 6 : frameCount);
    const rows = opts?.rows ?? (frameCount === 18 ? 3 : 1);
    if (rows > 1 || cols < frameCount) {
        const fw = Math.floor(imgW / cols);
        const fh = Math.floor(imgH / rows);
        if (fw > 0 && fh > 0) return { frameWidth: fw, frameHeight: fh };
    }
    const fw = Math.round(imgW / frameCount);
    if (fw <= 0) return null;
    if (Math.abs(fw - imgH) <= 2 || imgH === fw) {
        return { frameWidth: fw, frameHeight: imgH };
    }
    if (imgW % frameCount === 0) {
        return { frameWidth: imgW / frameCount, frameHeight: imgH };
    }
    return { frameWidth: fw, frameHeight: imgH };
}

/** แปลง index เฟรม → ตำแหน่ง crop บน sheet */
export function characterFrameRect(
    frameIndex: number,
    fw: number,
    fh: number,
    anim: CharacterAnimationConfig,
): { sx: number; sy: number } {
    if (anim.layout === 'grid' && anim.cols) {
        const col = frameIndex % anim.cols;
        const row = Math.floor(frameIndex / anim.cols);
        return { sx: col * fw, sy: row * fh };
    }
    return { sx: frameIndex * fw, sy: 0 };
}
