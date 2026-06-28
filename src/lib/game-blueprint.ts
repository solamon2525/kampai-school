/** Schema ด่านเกม — Platformer 2D Blueprint Engine v1 */

export type BlueprintEngine = 'platformer-2d';

export type PlatformerPlatform = {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
};

export type PlatformerCollectible = {
    id: string;
    x: number;
    y: number;
    kind: 'star' | 'heart';
};

export type PlatformerQuestion = {
    id: string;
    platformId: string;
    prompt: string;
    options: string[];
    answer: string;
};

export type PlatformerBlueprintV1 = {
    version: 1;
    engine: 'platformer-2d';
    world: {
        width: number;
        height: number;
        groundY: number;
    };
    rules: {
        lives: number;
        timeLimitSec: number;
        starPoints: number;
    };
    spawn: { x: number; y: number };
    platforms: PlatformerPlatform[];
    collectibles: PlatformerCollectible[];
    questions: PlatformerQuestion[];
};

export const BLUEPRINT_WORLD_W = 1280;
export const BLUEPRINT_WORLD_H = 720;
export const BLUEPRINT_GROUND_Y = 620;
export const BLUEPRINT_PLAT_H = 24;

export function createDefaultPlatformerBlueprint(): PlatformerBlueprintV1 {
    return {
        version: 1,
        engine: 'platformer-2d',
        world: {
            width: BLUEPRINT_WORLD_W,
            height: BLUEPRINT_WORLD_H,
            groundY: BLUEPRINT_GROUND_Y,
        },
        rules: {
            lives: 5,
            timeLimitSec: 90,
            starPoints: 10,
        },
        spawn: { x: 120, y: BLUEPRINT_GROUND_Y - 96 },
        platforms: [
            { id: 'ground', x: 0, y: BLUEPRINT_GROUND_Y, w: BLUEPRINT_WORLD_W, h: BLUEPRINT_PLAT_H },
            { id: 'p1', x: 280, y: 480, w: 180, h: BLUEPRINT_PLAT_H },
            { id: 'p2', x: 520, y: 400, w: 160, h: BLUEPRINT_PLAT_H },
            { id: 'p3', x: 760, y: 320, w: 200, h: BLUEPRINT_PLAT_H },
        ],
        collectibles: [
            { id: 's1', x: 340, y: 440, kind: 'star' },
            { id: 's2', x: 580, y: 360, kind: 'star' },
            { id: 's3', x: 820, y: 280, kind: 'star' },
        ],
        questions: [
            {
                id: 'q-p2',
                platformId: 'p2',
                prompt: 'ป _',
                options: ['ู', 'า', 'ิ'],
                answer: 'ู',
            },
        ],
    };
}

export function parsePlatformerBlueprint(raw: unknown): PlatformerBlueprintV1 | null {
    if (!raw || typeof raw !== 'object') return null;
    const o = raw as Record<string, unknown>;
    if (o.version !== 1 || o.engine !== 'platformer-2d') return null;
    const world = o.world as Record<string, unknown> | undefined;
    const rules = o.rules as Record<string, unknown> | undefined;
    const spawn = o.spawn as Record<string, unknown> | undefined;
    if (!world || !spawn) return null;

    const platforms = Array.isArray(o.platforms)
        ? (o.platforms as PlatformerPlatform[]).filter((p) => p && typeof p.x === 'number')
        : [];
    const collectibles = Array.isArray(o.collectibles)
        ? (o.collectibles as PlatformerCollectible[]).filter((c) => c && typeof c.x === 'number')
        : [];
    const questions = Array.isArray(o.questions)
        ? (o.questions as PlatformerQuestion[]).filter((q) => q && typeof q.platformId === 'string')
        : [];

    return {
        version: 1,
        engine: 'platformer-2d',
        world: {
            width: typeof world.width === 'number' ? world.width : BLUEPRINT_WORLD_W,
            height: typeof world.height === 'number' ? world.height : BLUEPRINT_WORLD_H,
            groundY: typeof world.groundY === 'number' ? world.groundY : BLUEPRINT_GROUND_Y,
        },
        rules: {
            lives: typeof rules?.lives === 'number' ? rules.lives : 5,
            timeLimitSec: typeof rules?.timeLimitSec === 'number' ? rules.timeLimitSec : 90,
            starPoints: typeof rules?.starPoints === 'number' ? rules.starPoints : 10,
        },
        spawn: {
            x: typeof spawn.x === 'number' ? spawn.x : 120,
            y: typeof spawn.y === 'number' ? spawn.y : BLUEPRINT_GROUND_Y - 96,
        },
        platforms,
        collectibles,
        questions,
    };
}

export function validatePlatformerBlueprint(bp: PlatformerBlueprintV1): string | null {
    if (!bp.platforms.length) return 'ต้องมี platform อย่างน้อย 1 ชิ้น';
    if (bp.spawn.x < 0 || bp.spawn.y < 0) return 'จุด spawn ไม่ถูกต้อง';
    for (const p of bp.platforms) {
        if (p.w < 40 || p.h < 8) return `platform ${p.id} เล็กเกินไป`;
    }
    return null;
}

export function newBlueprintId(prefix: string): string {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

/** เกมที่เปิด visual blueprint editor ได้ */
const BLUEPRINT_PLAY_STYLES = new Set(['platformer', 'platformer-2d']);

export function supportsBlueprintEditor(item: {
    game_play_style?: string | null;
    external_url?: string | null;
    game_slug?: string | null;
}): boolean {
    if (item.game_play_style && BLUEPRINT_PLAY_STYLES.has(item.game_play_style)) return true;
    if (item.game_slug === 'thai-sara-run' || item.game_slug === 'platformer-blueprint') return true;
    return !!(item.external_url && item.external_url.includes('platformer-2d'));
}

export function blueprintPreviewEngineUrl(item: {
    external_url?: string | null;
    game_slug?: string | null;
}): string {
    if (item.game_slug === 'thai-sara-run') return '/games/thai/thai-sara-run.html';
    if (item.external_url?.includes('.html')) return item.external_url;
    return '/games/engine/platformer-2d/index.html';
}

export function questionForPlatform(
    bp: PlatformerBlueprintV1,
    platformId: string,
): PlatformerQuestion | undefined {
    return bp.questions.find((q) => q.platformId === platformId);
}

export function upsertQuestionForPlatform(
    bp: PlatformerBlueprintV1,
    platformId: string,
    patch: Partial<Omit<PlatformerQuestion, 'id' | 'platformId'>> | null,
): PlatformerBlueprintV1 {
    const rest = bp.questions.filter((q) => q.platformId !== platformId);
    if (!patch) return { ...bp, questions: rest };
    const existing = bp.questions.find((q) => q.platformId === platformId);
    const next: PlatformerQuestion = {
        id: existing?.id ?? newBlueprintId('q'),
        platformId,
        prompt: patch.prompt ?? existing?.prompt ?? 'คำถาม _',
        options: patch.options ?? existing?.options ?? ['ก', 'ข', 'ค'],
        answer: patch.answer ?? existing?.answer ?? 'ก',
    };
    return { ...bp, questions: [...rest, next] };
}
