/** สัญญา animation สำหรับ sprite sheet แนวนอน (platformer) */

export type CharacterJumpFrames = {
    up: number;
    peak: number;
    fall: number;
};

export type CharacterAnimationConfig = {
    preset: string;
    layout: 'horizontal';
    idle: number[];
    walk: number[];
    run: number[];
    jump: CharacterJumpFrames;
    hurt: number;
    happy: number;
    walkFps?: number;
    runFps?: number;
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

export const CHARACTER_ANIM_PRESETS: Record<string, CharacterAnimationConfig> = {
    'platformer-12': CHARACTER_ANIM_PRESET_PLATFORMER_12,
};

export const CHARACTER_ANIM_PRESET_OPTIONS = [
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
    return CHARACTER_ANIM_PRESETS[presetKey] ?? CHARACTER_ANIM_PRESET_PLATFORMER_12;
}

export function resolveCharacterAnimation(
    config: CharacterAnimationConfig | null | undefined,
    frameCount?: number | null,
): CharacterAnimationConfig {
    if (config?.preset && config.walk?.length) return config;
    if (frameCount === 12 || frameCount == null) return CHARACTER_ANIM_PRESET_PLATFORMER_12;
    return CHARACTER_ANIM_PRESET_PLATFORMER_12;
}

/** อ่าน animation_config จาก JSONB (Supabase) */
export function parseCharacterAnimationConfig(raw: unknown): CharacterAnimationConfig | null {
    if (!raw || typeof raw !== 'object') return null;
    const o = raw as Record<string, unknown>;
    if (typeof o.preset !== 'string') return null;
    const base = getCharacterAnimPreset(o.preset);
    return {
        ...base,
        ...o,
        idle: Array.isArray(o.idle) ? (o.idle as number[]) : base.idle,
        walk: Array.isArray(o.walk) ? (o.walk as number[]) : base.walk,
        run: Array.isArray(o.run) ? (o.run as number[]) : base.run,
        jump: o.jump && typeof o.jump === 'object'
            ? { ...base.jump, ...(o.jump as CharacterJumpFrames) }
            : base.jump,
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
    collect(config.jump.up);
    collect(config.jump.peak);
    collect(config.jump.fall);
    collect(config.hurt);
    collect(config.happy);
    for (const i of indices) {
        if (i < 0 || i >= frameCount) {
            return `เฟรม ${i} เกินช่วง (0–${frameCount - 1})`;
        }
    }
    return null;
}

/** คำนวณขนาดเฟรมจาก PNG แนวนอน */
export function suggestFrameSizeFromImage(
    imgW: number,
    imgH: number,
    frameCount: number,
): { frameWidth: number; frameHeight: number } | null {
    if (imgW <= 0 || imgH <= 0 || frameCount <= 0) return null;
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
