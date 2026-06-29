/**
 * สเปก pose map ครบ — ท่าหลัก (core) + ท่าเสริม (extras) ใน animation_config JSONB
 */

export type CharacterJumpFrames = {
    up: number;
    peak: number;
    fall: number;
};

/** เฟรมเดียว หรือ array วนลูป */
export type PoseFrames = number[] | number;

/** ท่าหลัก — ทุก sheet ควรมี (fallback ใน preset) */
export type CharacterCorePoseKey =
    | 'idle'
    | 'walk'
    | 'run'
    | 'jump'
    | 'hurt'
    | 'happy';

/** ท่าเสริม — map เมื่อ sheet มี (extras ใน config) */
export type CharacterExtendedPoseKey =
    | 'attack'
    | 'attackHeavy'
    | 'block'
    | 'dodge'
    | 'crouch'
    | 'crawl'
    | 'sit'
    | 'slide'
    | 'wallSlide'
    | 'climb'
    | 'fall'
    | 'land'
    | 'special'
    | 'emote'
    | 'sleep'
    | 'death'
    | 'spawn';

/** ทิศเดิน top-down (4 ทิศ) */
export type CharacterFacing = 'up' | 'down' | 'left' | 'right';

export const CHARACTER_FACING_KEYS: CharacterFacing[] = ['down', 'up', 'left', 'right'];

export type CharacterPoseKey = CharacterCorePoseKey | CharacterExtendedPoseKey;

export type PoseCatalogEntry = {
    key: CharacterPoseKey;
    label: string;
    /** loop = หลายเฟรมวน · single = เฟรมเดียว · jump = รูปแบบ jump พิเศษ */
    kind: 'loop' | 'single' | 'jump';
    /** ค่า player.state ที่เกมส่งมา (ถ้าต่างจาก key) */
    gameState?: string;
    placeholder?: string;
    defaultFps?: number;
};

export type PoseCatalogGroup = {
    id: string;
    label: string;
    entries: PoseCatalogEntry[];
};

/** แคตตาล็อกท่า — ใช้ generate UI + SDK state priority */
export const CHARACTER_POSE_CATALOG: PoseCatalogGroup[] = [
    {
        id: 'movement',
        label: 'เคลื่อนที่',
        entries: [
            { key: 'idle', label: 'ยืน (idle)', kind: 'loop', defaultFps: 4 },
            { key: 'walk', label: 'เดิน (walk)', kind: 'loop', defaultFps: 5 },
            { key: 'run', label: 'วิ่ง (run)', kind: 'loop', defaultFps: 10 },
            { key: 'jump', label: 'โดด (jump)', kind: 'jump', defaultFps: 8 },
        ],
    },
    {
        id: 'combat',
        label: 'ต่อสู้',
        entries: [
            { key: 'attack', label: 'โจมตี (attack)', kind: 'loop', gameState: 'attack', defaultFps: 12, placeholder: 'เช่น 0,1,2' },
            { key: 'attackHeavy', label: 'โจมตีหนัก', kind: 'loop', gameState: 'attackHeavy', defaultFps: 10, placeholder: 'เช่น 3,4,5' },
            { key: 'block', label: 'ป้องกัน (block)', kind: 'single', gameState: 'block', placeholder: 'เช่น 6' },
            { key: 'dodge', label: 'หลบ (dodge)', kind: 'loop', gameState: 'dodge', defaultFps: 14, placeholder: 'เช่น 7,8' },
            { key: 'hurt', label: 'เจ็บ (hurt)', kind: 'single', defaultFps: 4, placeholder: 'เช่น 10' },
        ],
    },
    {
        id: 'stance',
        label: 'ท่าทาง',
        entries: [
            { key: 'crouch', label: 'หมอบ (crouch)', kind: 'loop', gameState: 'crouch', defaultFps: 4, placeholder: 'เช่น 12,13' },
            { key: 'crawl', label: 'คลาน (crawl)', kind: 'loop', gameState: 'crawl', defaultFps: 6, placeholder: 'เช่น 14,15' },
            { key: 'sit', label: 'นั่ง (sit)', kind: 'single', gameState: 'sit', placeholder: 'เช่น 16' },
            { key: 'sleep', label: 'หลับ (sleep)', kind: 'single', gameState: 'sleep', placeholder: 'เช่น 17' },
        ],
    },
    {
        id: 'platformer',
        label: 'แพลตฟอร์ม',
        entries: [
            { key: 'slide', label: 'สไลด์ (slide)', kind: 'loop', gameState: 'slide', defaultFps: 10, placeholder: 'เช่น 18,19' },
            { key: 'wallSlide', label: 'สไลด์ติดกำแพง', kind: 'single', gameState: 'wallSlide', placeholder: 'เช่น 20' },
            { key: 'climb', label: 'ปีน (climb)', kind: 'loop', gameState: 'climb', defaultFps: 8, placeholder: 'เช่น 21,22' },
            { key: 'fall', label: 'ตก (fall)', kind: 'single', gameState: 'fall', placeholder: 'jump fall หรือเฟรมแยก' },
            { key: 'land', label: 'ลงพื้น (land)', kind: 'single', gameState: 'land', placeholder: 'เช่น 23' },
        ],
    },
    {
        id: 'special',
        label: 'พิเศษ / อารมณ์',
        entries: [
            { key: 'happy', label: 'ดีใจ (happy)', kind: 'single', defaultFps: 4, placeholder: 'เช่น 11' },
            { key: 'special', label: 'ท่าพิเศษ (special)', kind: 'loop', gameState: 'special', defaultFps: 8, placeholder: 'ultimate / skill' },
            { key: 'emote', label: 'ท่าทาง (emote)', kind: 'loop', gameState: 'emote', defaultFps: 5, placeholder: 'โบกมือ ฯลฯ' },
            { key: 'spawn', label: 'เกิด (spawn)', kind: 'loop', gameState: 'spawn', defaultFps: 8, placeholder: 'เข้าฉาก' },
            { key: 'death', label: 'ตาย (death)', kind: 'single', gameState: 'death', placeholder: 'game over' },
        ],
    },
];

export const CHARACTER_CORE_POSE_KEYS: CharacterCorePoseKey[] = [
    'idle', 'walk', 'run', 'jump', 'hurt', 'happy',
];

export const CHARACTER_EXTENDED_POSE_KEYS: CharacterExtendedPoseKey[] =
    CHARACTER_POSE_CATALOG.flatMap((g) =>
        g.entries.map((e) => e.key).filter((k): k is CharacterExtendedPoseKey =>
            !CHARACTER_CORE_POSE_KEYS.includes(k as CharacterCorePoseKey)),
    );

export const CHARACTER_ALL_POSE_KEYS: CharacterPoseKey[] =
    CHARACTER_POSE_CATALOG.flatMap((g) => g.entries.map((e) => e.key));

export function getPoseCatalogEntry(key: CharacterPoseKey): PoseCatalogEntry | undefined {
    for (const g of CHARACTER_POSE_CATALOG) {
        const e = g.entries.find((x) => x.key === key);
        if (e) return e;
    }
    return undefined;
}

export function characterPoseLabel(pose: CharacterPoseKey): string {
    return getPoseCatalogEntry(pose)?.label ?? pose;
}

export type FootAnchorOverride = {
    anchorFoot?: number;
    feetPad?: number;
};

export type CharacterAnimationConfig = {
    preset: string;
    layout: 'horizontal' | 'grid';
    cols?: number;
    rows?: number;
    idle: number[];
    walk: number[];
    run: number[];
    jump: CharacterJumpFrames | number[];
    hurt: number;
    happy: number;
    /** ท่าเดินแยกทิศ — top-down 4 ทิศ */
    directions?: Partial<Record<CharacterFacing, number[]>>;
    /** ท่าเสริม — attack / crouch / slide / special ฯลฯ */
    extras?: Partial<Record<CharacterExtendedPoseKey, PoseFrames>>;
    walkFps?: number;
    runFps?: number;
    jumpFps?: number;
    /** FPS รายท่า (override default จาก catalog) */
    poseFps?: Partial<Record<CharacterPoseKey, number>>;
    runFaces?: 'left' | 'right';
    anchorFoot?: number;
    feetPad?: number;
    poseAnchors?: Partial<Record<CharacterPoseKey, FootAnchorOverride>>;
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
    runFaces: 'left',
    anchorFoot: 0.94,
    feetPad: 14,
};

export const CHARACTER_ANIM_PRESET_TOPDOWN_4DIR_16: CharacterAnimationConfig = {
    preset: 'topdown-4dir-16',
    layout: 'grid',
    cols: 4,
    rows: 4,
    idle: [12, 13],
    walk: [0, 1, 2],
    run: [0, 1, 2],
    jump: [12],
    hurt: 14,
    happy: 15,
    directions: {
        down: [0, 1, 2],
        up: [3, 4, 5],
        left: [6, 7, 8],
        right: [9, 10, 11],
    },
    walkFps: 6,
    runFps: 8,
    anchorFoot: 0.92,
    feetPad: 8,
};

export const CHARACTER_ANIM_PRESETS: Record<string, CharacterAnimationConfig> = {
    'platformer-12': CHARACTER_ANIM_PRESET_PLATFORMER_12,
    'grid-3x6-18': CHARACTER_ANIM_PRESET_GRID_3X6_18,
    'topdown-4dir-16': CHARACTER_ANIM_PRESET_TOPDOWN_4DIR_16,
};

export const CHARACTER_ANIM_PRESET_OPTIONS = [
    {
        key: 'grid-3x6-18',
        label: 'Grid 3×6 — 18 เฟรม (วิ่ง / โดด / ยืน)',
        frameCount: 18,
        cols: 6,
        rows: 3,
        frameHint: 'แถว1 วิ่ง 0–5 · แถว2 โดด 6–11 · แถว3 ยืน 12–17 · ท่าอื่น map ใน extras',
    },
    {
        key: 'topdown-4dir-16',
        label: 'Top-down 4×4 — 16 เฟรม (4 ทิศ)',
        frameCount: 16,
        cols: 4,
        rows: 4,
        frameHint: '↓0–2 · ↑3–5 · ←6–8 · →9–11 · idle 12–13 · คลิก map ทิศใน Studio',
    },
    {
        key: 'platformer-12',
        label: 'Platformer 12 เฟรม (idle/walk/run/jump/hurt/happy)',
        frameCount: 12,
        frameHint: '0 idle · 1–2 walk · 3–6 run · 7–9 jump · 10 hurt · 11 happy · ท่าเสริมใน extras',
    },
] as const;

export const GAMES_WITH_CHARACTER_SUPPORT = [
    'thai-sara-run',
    'jump-even-odd',
    'fraction-adventure',
] as const;

export const CHARACTER_FACING_LABELS: Record<CharacterFacing, string> = {
    down: '↓ ลง',
    up: '↑ ขึ้น',
    left: '← ซ้าย',
    right: '→ ขวา',
};

export type PoseMapTarget =
    | { kind: 'pose'; key: CharacterPoseKey }
    | { kind: 'direction'; key: CharacterFacing };

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
    if (frameCount === 16) return CHARACTER_ANIM_PRESET_TOPDOWN_4DIR_16;
    if (frameCount === 12) return CHARACTER_ANIM_PRESET_PLATFORMER_12;
    return CHARACTER_ANIM_PRESET_GRID_3X6_18;
}

function collectJumpIndices(jump: CharacterJumpFrames | number[]): number[] {
    if (Array.isArray(jump)) return jump;
    return [jump.up, jump.peak, jump.fall];
}

/** ดึงเฟรมของท่า — core จาก field หลัก · extended จาก extras */
export function getPoseFrames(
    config: CharacterAnimationConfig,
    pose: CharacterPoseKey,
): PoseFrames | null {
    switch (pose) {
        case 'idle': return config.idle?.length ? config.idle : null;
        case 'walk': return config.walk?.length ? config.walk : null;
        case 'run': return config.run?.length ? config.run : null;
        case 'jump': return config.jump ?? null;
        case 'hurt': return config.hurt;
        case 'happy': return config.happy;
        default: {
            const ex = config.extras?.[pose as CharacterExtendedPoseKey];
            return ex ?? null;
        }
    }
}

/** ลำดับความสำคัญ state → ท่า (ใช้ใน pickCharacterFrame) */
export const POSE_STATE_PRIORITY: { state: string; pose: CharacterPoseKey }[] = [
    { state: 'death', pose: 'death' },
    { state: 'hurt', pose: 'hurt' },
    { state: 'happy', pose: 'happy' },
    { state: 'emote', pose: 'emote' },
    { state: 'special', pose: 'special' },
    { state: 'spawn', pose: 'spawn' },
    { state: 'attackHeavy', pose: 'attackHeavy' },
    { state: 'attack', pose: 'attack' },
    { state: 'block', pose: 'block' },
    { state: 'dodge', pose: 'dodge' },
    { state: 'slide', pose: 'slide' },
    { state: 'wallSlide', pose: 'wallSlide' },
    { state: 'climb', pose: 'climb' },
    { state: 'crouch', pose: 'crouch' },
    { state: 'crawl', pose: 'crawl' },
    { state: 'sit', pose: 'sit' },
    { state: 'sleep', pose: 'sleep' },
    { state: 'land', pose: 'land' },
    { state: 'fall', pose: 'fall' },
    { state: 'jump', pose: 'jump' },
];

export function resolvePoseFps(config: CharacterAnimationConfig, pose: CharacterPoseKey): number {
    const custom = config.poseFps?.[pose];
    if (typeof custom === 'number') return custom;
    const entry = getPoseCatalogEntry(pose);
    if (entry?.defaultFps) return entry.defaultFps;
    if (pose === 'walk') return config.walkFps ?? 5;
    if (pose === 'run') return config.runFps ?? 10;
    if (pose === 'jump') return config.jumpFps ?? 8;
    return 4;
}

function pickFromPoseFrames(
    frames: PoseFrames,
    animTime: number,
    fps: number,
    jumpOpts?: { vy?: number; vyJumpUp?: number; vyJumpFall?: number },
): number {
    if (Array.isArray(frames)) {
        if (frames.length <= 1) return frames[0] ?? 0;
        return frames[Math.floor(animTime * (fps / 10)) % frames.length];
    }
    if (typeof frames === 'number') return frames;
    const j = frames as CharacterJumpFrames;
    const vy = jumpOpts?.vy ?? 0;
    const up = jumpOpts?.vyJumpUp ?? -3.5;
    const fall = jumpOpts?.vyJumpFall ?? 2.5;
    if (vy < up) return j.up;
    if (vy > fall) return j.fall;
    return j.peak;
}

/** เลือก index เฟรมจาก state ผู้เล่น — รองรับท่า extras ครบ */
export function pickCharacterFrameIndex(
    p: {
        state?: string;
        onGround?: boolean;
        vy?: number;
        vx?: number;
        animTime?: number;
        facing?: CharacterFacing;
    },
    config: CharacterAnimationConfig,
    opt?: { runSpeed?: number; vyJumpUp?: number; vyJumpFall?: number },
): number {
    const animTime = p.animTime ?? 0;
    const runSpeed = opt?.runSpeed ?? 4.5;
    const state = p.state ?? 'idle';

    for (const { state: st, pose } of POSE_STATE_PRIORITY) {
        if (state !== st) continue;
        const frames = getPoseFrames(config, pose);
        if (frames == null) continue;
        return pickFromPoseFrames(frames, animTime, resolvePoseFps(config, pose), {
            vy: p.vy,
            vyJumpUp: opt?.vyJumpUp,
            vyJumpFall: opt?.vyJumpFall,
        });
    }

    if (!p.onGround || state === 'jump') {
        const land = getPoseFrames(config, 'land');
        if (state === 'land' && land != null) {
            return pickFromPoseFrames(land, animTime, resolvePoseFps(config, 'land'));
        }
        const fall = getPoseFrames(config, 'fall');
        if (p.onGround === false && p.vy != null && p.vy > (opt?.vyJumpFall ?? 2.5) && fall != null) {
            return pickFromPoseFrames(fall, animTime, resolvePoseFps(config, 'fall'));
        }
        const j = getPoseFrames(config, 'jump');
        if (j != null) {
            return pickFromPoseFrames(j, animTime, resolvePoseFps(config, 'jump'), {
                vy: p.vy,
                vyJumpUp: opt?.vyJumpUp,
                vyJumpFall: opt?.vyJumpFall,
            });
        }
    }

    if (state === 'run' || Math.abs(p.vx ?? 0) > runSpeed * 0.55) {
        const rf = getPoseFrames(config, 'run');
        if (rf != null) return pickFromPoseFrames(rf, animTime, resolvePoseFps(config, 'run'));
    }

    const facing = p.facing ?? inferFacingFromVelocity(p.vx, p.vy);
    if (facing && config.directions?.[facing]?.length) {
        const dirFrames = config.directions[facing]!;
        const moving = Math.abs(p.vx ?? 0) > 0.15 || Math.abs(p.vy ?? 0) > 0.15;
        if (moving || state === 'walk' || state === 'run') {
            return pickFromPoseFrames(dirFrames, animTime, resolvePoseFps(config, 'walk'));
        }
    }

    if (Math.abs(p.vx ?? 0) > 0.15) {
        const wf = getPoseFrames(config, 'walk');
        if (wf != null) return pickFromPoseFrames(wf, animTime, resolvePoseFps(config, 'walk'));
    }
    const idle = getPoseFrames(config, 'idle');
    if (idle != null) return pickFromPoseFrames(idle, animTime, resolvePoseFps(config, 'idle'));
    return 0;
}

function parseExtras(raw: unknown): CharacterAnimationConfig['extras'] | undefined {
    if (!raw || typeof raw !== 'object') return undefined;
    const o = raw as Record<string, unknown>;
    const out: NonNullable<CharacterAnimationConfig['extras']> = {};
    let any = false;
    for (const key of CHARACTER_EXTENDED_POSE_KEYS) {
        const v = o[key];
        if (typeof v === 'number') {
            out[key] = v;
            any = true;
        } else if (Array.isArray(v) && v.length) {
            out[key] = v as number[];
            any = true;
        }
    }
    return any ? out : undefined;
}

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
        extras: parseExtras(o.extras) ?? base.extras,
        poseFps: o.poseFps && typeof o.poseFps === 'object' ? (o.poseFps as CharacterAnimationConfig['poseFps']) : base.poseFps,
        runFaces: o.runFaces === 'left' || o.runFaces === 'right' ? o.runFaces : base.runFaces,
        anchorFoot: typeof o.anchorFoot === 'number' ? o.anchorFoot : base.anchorFoot,
        feetPad: typeof o.feetPad === 'number' ? o.feetPad : base.feetPad,
        poseAnchors: parsePoseAnchors(o.poseAnchors) ?? base.poseAnchors,
        directions: parseDirections(o.directions) ?? base.directions,
    };
}

function parseDirections(raw: unknown): CharacterAnimationConfig['directions'] | undefined {
    if (!raw || typeof raw !== 'object') return undefined;
    const o = raw as Record<string, unknown>;
    const out: NonNullable<CharacterAnimationConfig['directions']> = {};
    let any = false;
    for (const key of CHARACTER_FACING_KEYS) {
        const v = o[key];
        if (Array.isArray(v) && v.length) {
            out[key] = v as number[];
            any = true;
        }
    }
    return any ? out : undefined;
}

export function inferFacingFromVelocity(vx?: number, vy?: number): CharacterFacing | undefined {
    const ax = Math.abs(vx ?? 0);
    const ay = Math.abs(vy ?? 0);
    if (ax < 0.15 && ay < 0.15) return undefined;
    if (ax >= ay) return (vx ?? 0) >= 0 ? 'right' : 'left';
    return (vy ?? 0) >= 0 ? 'down' : 'up';
}

function parsePoseAnchors(raw: unknown): CharacterAnimationConfig['poseAnchors'] | undefined {
    if (!raw || typeof raw !== 'object') return undefined;
    const o = raw as Record<string, unknown>;
    const out: NonNullable<CharacterAnimationConfig['poseAnchors']> = {};
    let any = false;
    for (const pose of CHARACTER_ALL_POSE_KEYS) {
        const v = o[pose];
        if (!v || typeof v !== 'object') continue;
        const p = v as Record<string, unknown>;
        const anchorFoot = typeof p.anchorFoot === 'number' ? p.anchorFoot : undefined;
        const feetPad = typeof p.feetPad === 'number' ? p.feetPad : undefined;
        if (anchorFoot != null || feetPad != null) {
            out[pose] = { anchorFoot, feetPad };
            any = true;
        }
    }
    return any ? out : undefined;
}

function collectPoseIndices(pose: CharacterPoseKey, config: CharacterAnimationConfig): number[] {
    const frames = getPoseFrames(config, pose);
    if (frames == null) return [];
    if (Array.isArray(frames)) return frames;
    if (typeof frames === 'number') return [frames];
    return collectJumpIndices(frames);
}

export function validateAnimationConfig(
    config: CharacterAnimationConfig,
    frameCount: number,
): string | null {
    const indices = new Set<number>();
    for (const pose of CHARACTER_ALL_POSE_KEYS) {
        for (const i of collectPoseIndices(pose, config)) indices.add(i);
    }
    if (config.directions) {
        for (const frames of Object.values(config.directions)) {
            if (frames) for (const i of frames) indices.add(i);
        }
    }
    for (const i of indices) {
        if (i < 0 || i >= frameCount) {
            return `เฟรม ${i} เกินช่วง (0–${frameCount - 1})`;
        }
    }
    return null;
}

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

export function shouldFlipCharacterFace(face: number, anim: CharacterAnimationConfig): boolean {
    const rf = anim.runFaces ?? 'right';
    return rf === 'right' ? face < 0 : face > 0;
}

export function resolveFootAnchor(
    anim: CharacterAnimationConfig,
    pose: CharacterPoseKey,
): { anchorFoot: number; feetPad: number } {
    const globalFoot = anim.anchorFoot ?? 0.94;
    const globalPad = anim.feetPad ?? 0;
    const o = anim.poseAnchors?.[pose];
    return {
        anchorFoot: o?.anchorFoot ?? globalFoot,
        feetPad: o?.feetPad ?? globalPad,
    };
}

export function poseKeyFromPlayerState(
    p: { state?: string; onGround?: boolean; vy?: number; vx?: number },
    opt?: { runSpeed?: number },
): CharacterPoseKey {
    const runSpeed = opt?.runSpeed ?? 4.5;
    const state = p.state ?? 'idle';
    for (const { state: st, pose } of POSE_STATE_PRIORITY) {
        if (state === st) return pose;
    }
    if (!p.onGround || state === 'jump') {
        if (state === 'land') return 'land';
        if (p.vy != null && p.vy > 2.5) return 'fall';
        return 'jump';
    }
    if (state === 'run' || Math.abs(p.vx ?? 0) > runSpeed * 0.55) return 'run';
    if (Math.abs(p.vx ?? 0) > 0.15) return 'walk';
    return 'idle';
}

export function parseFrameIndexList(raw: string): number[] {
    return raw
        .split(/[,;\s]+/)
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n));
}

export function frameIndexListToString(arr: number[]): string {
    return arr.join(', ');
}

function poseFramesToString(frames: PoseFrames | null | undefined): string {
    if (frames == null) return '';
    if (Array.isArray(frames)) return frameIndexListToString(frames);
    if (typeof frames === 'number') return String(frames);
    return `${frames.up},${frames.peak},${frames.fall}`;
}

export type CharacterPoseFields = {
    preset: string;
    runFaces: 'left' | 'right';
    anchorFoot: number;
    feetPad: number;
    /** core poses serialized */
    core: Record<CharacterCorePoseKey, string>;
    /** extended poses serialized */
    extras: Partial<Record<CharacterExtendedPoseKey, string>>;
};

export function poseFieldsFromConfig(config: CharacterAnimationConfig): CharacterPoseFields {
    const extras: Partial<Record<CharacterExtendedPoseKey, string>> = {};
    for (const key of CHARACTER_EXTENDED_POSE_KEYS) {
        const s = poseFramesToString(config.extras?.[key]);
        if (s) extras[key] = s;
    }
    return {
        preset: config.preset,
        runFaces: config.runFaces ?? 'right',
        anchorFoot: config.anchorFoot ?? 0.94,
        feetPad: config.feetPad ?? 0,
        core: {
            idle: poseFramesToString(config.idle),
            walk: poseFramesToString(config.walk),
            run: poseFramesToString(config.run),
            jump: poseFramesToString(config.jump),
            hurt: String(config.hurt),
            happy: String(config.happy),
        },
        extras,
    };
}

export function buildAnimationConfigFromFields(
    fields: CharacterPoseFields,
    frameCount: number,
): { config: CharacterAnimationConfig; error: string | null } {
    const base = getCharacterAnimPreset(fields.preset);
    const jumpParts = parseFrameIndexList(fields.core.jump);
    const jump: CharacterAnimationConfig['jump'] = jumpParts.length >= 3 && jumpParts.length <= 4
        ? jumpParts.length === 3
            ? { up: jumpParts[0], peak: jumpParts[1], fall: jumpParts[2] }
            : jumpParts
        : jumpParts.length > 0
            ? jumpParts
            : base.jump;

    const extras: NonNullable<CharacterAnimationConfig['extras']> = {};
    for (const key of CHARACTER_EXTENDED_POSE_KEYS) {
        const raw = fields.extras[key]?.trim();
        if (!raw) continue;
        const parts = parseFrameIndexList(raw);
        if (parts.length === 1) extras[key] = parts[0];
        else if (parts.length > 1) extras[key] = parts;
    }

    const config: CharacterAnimationConfig = {
        ...base,
        preset: fields.preset,
        idle: parseFrameIndexList(fields.core.idle).length ? parseFrameIndexList(fields.core.idle) : base.idle,
        walk: parseFrameIndexList(fields.core.walk).length ? parseFrameIndexList(fields.core.walk) : base.walk,
        run: parseFrameIndexList(fields.core.run).length ? parseFrameIndexList(fields.core.run) : base.run,
        jump,
        hurt: parseInt(fields.core.hurt, 10),
        happy: parseInt(fields.core.happy, 10),
        extras: Object.keys(extras).length ? extras : undefined,
        runFaces: fields.runFaces,
        anchorFoot: fields.anchorFoot,
        feetPad: fields.feetPad,
    };
    if (Number.isNaN(config.hurt)) config.hurt = base.hurt;
    if (Number.isNaN(config.happy)) config.happy = base.happy;
    const err = validateAnimationConfig(config, frameCount);
    return { config, error: err };
}

/** ท่าที่ map แล้ว (มีเฟรม) — ใช้ preview dropdown */
export function listMappedPoses(config: CharacterAnimationConfig): CharacterPoseKey[] {
    return CHARACTER_ALL_POSE_KEYS.filter((pose) => {
        const f = getPoseFrames(config, pose);
        if (f == null) return false;
        if (Array.isArray(f)) return f.length > 0;
        return true;
    });
}

function getFramesForTarget(config: CharacterAnimationConfig, target: PoseMapTarget): number[] {
    if (target.kind === 'direction') {
        return [...(config.directions?.[target.key] ?? [])];
    }
    const frames = getPoseFrames(config, target.key);
    if (frames == null) return [];
    if (Array.isArray(frames)) return [...frames];
    if (typeof frames === 'number') return [frames];
    return collectJumpIndices(frames);
}

function setFramesForTarget(
    config: CharacterAnimationConfig,
    target: PoseMapTarget,
    frames: number[],
): CharacterAnimationConfig {
    const sorted = [...new Set(frames)].sort((a, b) => a - b);
    if (target.kind === 'direction') {
        const directions = { ...config.directions };
        if (sorted.length) directions[target.key] = sorted;
        else delete directions[target.key];
        return { ...config, directions: Object.keys(directions).length ? directions : undefined };
    }
    const key = target.key;
    if (CHARACTER_CORE_POSE_KEYS.includes(key as CharacterCorePoseKey)) {
        const coreKey = key as CharacterCorePoseKey;
        if (coreKey === 'hurt' || coreKey === 'happy') {
            return { ...config, [coreKey]: sorted[0] ?? config[coreKey] };
        }
        if (coreKey === 'jump') {
            if (sorted.length >= 3) {
                return {
                    ...config,
                    jump: sorted.length === 3
                        ? { up: sorted[0], peak: sorted[1], fall: sorted[2] }
                        : sorted,
                };
            }
            return { ...config, jump: sorted.length ? sorted : config.jump };
        }
        return { ...config, [coreKey]: sorted };
    }
    const extras = { ...config.extras };
    if (sorted.length === 1) extras[key as CharacterExtendedPoseKey] = sorted[0];
    else if (sorted.length > 1) extras[key as CharacterExtendedPoseKey] = sorted;
    else delete extras[key as CharacterExtendedPoseKey];
    return { ...config, extras: Object.keys(extras).length ? extras : undefined };
}

/** คลิก toggle เฟรมใน/ออกจากท่าที่เลือก */
export function toggleFrameInPoseMap(
    config: CharacterAnimationConfig,
    target: PoseMapTarget,
    frameIndex: number,
): CharacterAnimationConfig {
    const current = getFramesForTarget(config, target);
    const next = current.includes(frameIndex)
        ? current.filter((i) => i !== frameIndex)
        : [...current, frameIndex];
    return setFramesForTarget(config, target, next);
}

/** เฟรมที่ map กับ target — ใส่ highlight บน grid */
export function framesForMapTarget(config: CharacterAnimationConfig, target: PoseMapTarget): number[] {
    return getFramesForTarget(config, target);
}

export function framesMappedInConfig(config: CharacterAnimationConfig): Set<number> {
    const set = new Set<number>();
    for (const pose of CHARACTER_ALL_POSE_KEYS) {
        for (const i of collectPoseIndices(pose, config)) set.add(i);
    }
    if (config.directions) {
        for (const frames of Object.values(config.directions)) {
            if (frames) for (const i of frames) set.add(i);
        }
    }
    return set;
}
