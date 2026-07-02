/**
 * Schema ด่านเกม — Multi-Engine Blueprint System
 *
 * engine แต่ละตัวมี schema ของตัวเอง (discriminated union ตาม field `engine`)
 * - 'platformer-2d' : เกมวิ่งกระโดดแพลตฟอร์ม (เดิม)
 * - 'quiz'          : เกมตอบคำถามตัวเลือกพร้อมจับเวลา/คะแนน (ใหม่)
 *
 * ระบบ engine registry อยู่ใน `src/lib/blueprint-engines.ts`
 */

export type BlueprintEngine = 'platformer-2d' | 'quiz' | 'matching' | 'drag-sort';

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

// ─── Quiz Engine ────────────────────────────────────────────────────────────

export type QuizQuestion = {
    id: string;
    prompt: string;
    options: string[];
    answer: string;
    /** คำเต็ม/คำอธิบาย สำหรับแสดงหลังตอบ (optional) */
    hint?: string;
};

/** พรีเซตพื้นหลัง — runtime เลือก gradient/ภาพตามค่านี้ */
export type QuizBgPreset = 'aurora' | 'sunset' | 'ocean' | 'forest' | 'candy' | 'midnight';

export type QuizBlueprintV1 = {
    version: 1;
    engine: 'quiz';
    meta: {
        title: string;
        subject: string;
        /** ระดับชั้นอิสระ เช่น "ป.1" */
        grade?: string;
    };
    rules: {
        /** วินาทีต่อข้อ (0 = ไม่จับเวลา) */
        timeLimitSec: number;
        pointsPerCorrect: number;
        /** คะแนนขั้นต่ำถือว่า "ผ่าน" */
        passingScore: number;
        /** true = สลับลำดับตัวเลือกทุกครั้งที่เล่น */
        shuffleOptions: boolean;
    };
    theme: {
        bgPreset: QuizBgPreset;
        accentColor: string;
    };
    questions: QuizQuestion[];
};

// ─── Matching Engine (จับคู่คำ/ภาพ) ────────────────────────────────────────

/** คู่ที่ต้องจับให้ถูก — เช่น คำพ้อง, คำตรงข้าม, คำ-ความหมาย, ภาพ-คำ */
export type MatchingPair = {
    id: string;
    /** ฝั่งซ้าย (เช่นคำที่กำลังเรียน) */
    left: string;
    /** ฝั่งขวา (เช่นคำคู่/คำแปล) */
    right: string;
};

export type MatchingBlueprintV1 = {
    version: 1;
    engine: 'matching';
    meta: {
        title: string;
        subject: string;
        grade?: string;
    };
    rules: {
        /** วินาทีรวม (0 = ไม่จับเวลา) */
        timeLimitSec: number;
        pointsPerCorrect: number;
        /** ใช้ "ค่าความผิดพลาด" คือจับผิดกี่ครั้งต่อคู่ถึงจะหักคะแนน/แสดงผิด */
        mistakesAllowed: number;
        /** true = สลับตำแหน่งฝั่งขวาทุกครั้งที่เล่น */
        shuffleRight: boolean;
    };
    theme: {
        bgPreset: QuizBgPreset;
        accentColor: string;
    };
    pairs: MatchingPair[];
};

// ─── Union กลางของทุก engine ────────────────────────────────────────────────

export type GameBlueprint = PlatformerBlueprintV1 | QuizBlueprintV1 | MatchingBlueprintV1;


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

/** เกมที่เปิด visual blueprint editor ได้ — registry-driven */
const BLUEPRINT_PLAY_STYLES = new Set(['platformer', 'platformer-2d', 'quiz', 'matching']);
const BLUEPRINT_SLUGS = new Set([
    'thai-sara-run',
    'platformer-blueprint',
    'quiz-builder',
    'matching-builder',
]);
const BLUEPRINT_ENGINE_KEYWORDS = ['platformer-2d', 'quiz', 'matching'];

export function supportsBlueprintEditor(item: {
    game_play_style?: string | null;
    external_url?: string | null;
    game_slug?: string | null;
}): boolean {
    if (item.game_play_style && BLUEPRINT_PLAY_STYLES.has(item.game_play_style)) return true;
    if (item.game_slug && BLUEPRINT_SLUGS.has(item.game_slug)) return true;
    return !!(
        item.external_url && BLUEPRINT_ENGINE_KEYWORDS.some((k) => item.external_url!.includes(k))
    );
}

export function blueprintPreviewEngineUrl(item: {
    external_url?: string | null;
    game_slug?: string | null;
}): string {
    if (item.game_slug === 'thai-sara-run') return '/games/thai/thai-sara-run.html';
    if (item.external_url?.includes('quiz')) return '/games/engine/quiz/index.html';
    if (item.external_url?.includes('matching')) return '/games/engine/matching/index.html';
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

// ─── Quiz Engine: createDefault / parse / validate ──────────────────────────

export function createDefaultQuizBlueprint(meta?: Partial<QuizBlueprintV1['meta']>): QuizBlueprintV1 {
    return {
        version: 1,
        engine: 'quiz',
        meta: {
            title: meta?.title ?? 'แบบทดสอบใหม่',
            subject: meta?.subject ?? 'thai',
            grade: meta?.grade,
        },
        rules: {
            timeLimitSec: 15,
            pointsPerCorrect: 10,
            passingScore: 50,
            shuffleOptions: true,
        },
        theme: {
            bgPreset: 'aurora',
            accentColor: '#6366f1',
        },
        questions: [
            {
                id: newBlueprintId('qq'),
                prompt: '2 + 3 = ?',
                options: ['4', '5', '6'],
                answer: '5',
            },
            {
                id: newBlueprintId('qq'),
                prompt: 'สระในคำว่า ปู คือ?',
                options: ['ู', 'า', 'ิ'],
                answer: 'ู',
                hint: 'ป + ู',
            },
        ],
    };
}

const QUIZ_BG_PRESETS: QuizBgPreset[] = ['aurora', 'sunset', 'ocean', 'forest', 'candy', 'midnight'];

export function parseQuizBlueprint(raw: unknown): QuizBlueprintV1 | null {
    if (!raw || typeof raw !== 'object') return null;
    const o = raw as Record<string, unknown>;
    if (o.version !== 1 || o.engine !== 'quiz') return null;

    const metaIn = (o.meta as Record<string, unknown> | undefined) ?? {};
    const rulesIn = (o.rules as Record<string, unknown> | undefined) ?? {};
    const themeIn = (o.theme as Record<string, unknown> | undefined) ?? {};

    const questions = Array.isArray(o.questions)
        ? (o.questions as QuizQuestion[])
              .filter((q) => q && typeof q.prompt === 'string')
              .map((q) => ({
                  id: typeof q.id === 'string' ? q.id : newBlueprintId('qq'),
                  prompt: q.prompt,
                  options: Array.isArray(q.options) ? q.options.map(String).slice(0, 6) : [],
                  answer: typeof q.answer === 'string' ? q.answer : '',
                  hint: typeof q.hint === 'string' ? q.hint : undefined,
              }))
        : [];

    const bgPresetRaw = themeIn.bgPreset as QuizBgPreset;
    const bgPreset: QuizBgPreset = QUIZ_BG_PRESETS.includes(bgPresetRaw) ? bgPresetRaw : 'aurora';

    return {
        version: 1,
        engine: 'quiz',
        meta: {
            title: typeof metaIn.title === 'string' ? metaIn.title : 'แบบทดสอบ',
            subject: typeof metaIn.subject === 'string' ? metaIn.subject : 'thai',
            grade: typeof metaIn.grade === 'string' ? metaIn.grade : undefined,
        },
        rules: {
            timeLimitSec: typeof rulesIn.timeLimitSec === 'number' ? rulesIn.timeLimitSec : 15,
            pointsPerCorrect:
                typeof rulesIn.pointsPerCorrect === 'number' ? rulesIn.pointsPerCorrect : 10,
            passingScore: typeof rulesIn.passingScore === 'number' ? rulesIn.passingScore : 50,
            shuffleOptions: typeof rulesIn.shuffleOptions === 'boolean' ? rulesIn.shuffleOptions : true,
        },
        theme: {
            bgPreset,
            accentColor:
                typeof themeIn.accentColor === 'string' ? themeIn.accentColor : '#6366f1',
        },
        questions,
    };
}

export function validateQuizBlueprint(bp: QuizBlueprintV1): string | null {
    if (!bp.questions.length) return 'ต้องมีคำถามอย่างน้อย 1 ข้อ';
    for (const [i, q] of bp.questions.entries()) {
        if (!q.prompt.trim()) return `คำถามข้อ ${i + 1} ไม่มีโจทย์`;
        if (q.options.length < 2) return `คำถามข้อ ${i + 1} ต้องมีตัวเลือกอย่างน้อย 2 ข้อ`;
        if (!q.answer.trim()) return `คำถามข้อ ${i + 1} ไม่มีเฉลย`;
        if (!q.options.includes(q.answer))
            return `คำถามข้อ ${i + 1} เฉลย "${q.answer}" ไม่อยู่ในตัวเลือก`;
    }
    if (bp.rules.pointsPerCorrect < 0) return 'คะแนนต่อข้อต้องไม่ติดลบ';
    return null;
}

// ─── Matching Engine: createDefault / parse / validate ──────────────────────

export function createDefaultMatchingBlueprint(
    meta?: Partial<MatchingBlueprintV1['meta']>,
): MatchingBlueprintV1 {
    return {
        version: 1,
        engine: 'matching',
        meta: {
            title: meta?.title ?? 'จับคู่คำใหม่',
            subject: meta?.subject ?? 'thai',
            grade: meta?.grade,
        },
        rules: {
            timeLimitSec: 0,
            pointsPerCorrect: 10,
            mistakesAllowed: 3,
            shuffleRight: true,
        },
        theme: {
            bgPreset: 'ocean',
            accentColor: '#0ea5e9',
        },
        pairs: [
            { id: newBlueprintId('mp'), left: 'ดำ', right: 'ขาว' },
            { id: newBlueprintId('mp'), left: 'สูง', right: 'ต่ำ' },
            { id: newBlueprintId('mp'), left: 'ร้อน', right: 'เย็น' },
        ],
    };
}

export function parseMatchingBlueprint(raw: unknown): MatchingBlueprintV1 | null {
    if (!raw || typeof raw !== 'object') return null;
    const o = raw as Record<string, unknown>;
    if (o.version !== 1 || o.engine !== 'matching') return null;

    const metaIn = (o.meta as Record<string, unknown> | undefined) ?? {};
    const rulesIn = (o.rules as Record<string, unknown> | undefined) ?? {};
    const themeIn = (o.theme as Record<string, unknown> | undefined) ?? {};

    const pairs = Array.isArray(o.pairs)
        ? (o.pairs as MatchingPair[])
              .filter((p) => p && typeof p.left === 'string' && typeof p.right === 'string')
              .map((p) => ({
                  id: typeof p.id === 'string' ? p.id : newBlueprintId('mp'),
                  left: String(p.left),
                  right: String(p.right),
              }))
        : [];

    const bgPresetRaw = themeIn.bgPreset as QuizBgPreset;
    const bgPreset: QuizBgPreset = QUIZ_BG_PRESETS.includes(bgPresetRaw) ? bgPresetRaw : 'ocean';

    return {
        version: 1,
        engine: 'matching',
        meta: {
            title: typeof metaIn.title === 'string' ? metaIn.title : 'จับคู่คำ',
            subject: typeof metaIn.subject === 'string' ? metaIn.subject : 'thai',
            grade: typeof metaIn.grade === 'string' ? metaIn.grade : undefined,
        },
        rules: {
            timeLimitSec: typeof rulesIn.timeLimitSec === 'number' ? rulesIn.timeLimitSec : 0,
            pointsPerCorrect:
                typeof rulesIn.pointsPerCorrect === 'number' ? rulesIn.pointsPerCorrect : 10,
            mistakesAllowed:
                typeof rulesIn.mistakesAllowed === 'number' ? rulesIn.mistakesAllowed : 3,
            shuffleRight: typeof rulesIn.shuffleRight === 'boolean' ? rulesIn.shuffleRight : true,
        },
        theme: {
            bgPreset,
            accentColor:
                typeof themeIn.accentColor === 'string' ? themeIn.accentColor : '#0ea5e9',
        },
        pairs,
    };
}

export function validateMatchingBlueprint(bp: MatchingBlueprintV1): string | null {
    if (!bp.pairs.length) return 'ต้องมีคู่อย่างน้อย 1 คู่';
    const seenLeft = new Set<string>();
    for (const [i, p] of bp.pairs.entries()) {
        if (!p.left.trim() || !p.right.trim())
            return `คู่ที่ ${i + 1} มีฝั่งว่าง`;
        if (seenLeft.has(p.left))
            return `คู่ที่ ${i + 1} ฝั่งซ้าย "${p.left}" ซ้ำกับคู่อื่น`;
        seenLeft.add(p.left);
    }
    if (bp.rules.pointsPerCorrect < 0) return 'คะแนนต่อคู่ต้องไม่ติดลบ';
    return null;
}

// ─── Multi-engine dispatch helpers ──────────────────────────────────────────

/** parse blueprint JSON ตาม engine field — คืน null ถ้า engine ไม่รู้จัก */
export function parseGameBlueprint(raw: unknown): GameBlueprint | null {
    if (!raw || typeof raw !== 'object') return null;
    const engine = (raw as Record<string, unknown>).engine;
    if (engine === 'platformer-2d') return parsePlatformerBlueprint(raw);
    if (engine === 'quiz') return parseQuizBlueprint(raw);
    if (engine === 'matching') return parseMatchingBlueprint(raw);
    return null;
}

/** validate ตาม engine — คืนข้อความ error หรือ null ถ้าผ่าน */
export function validateGameBlueprint(bp: GameBlueprint): string | null {
    if (bp.engine === 'platformer-2d') return validatePlatformerBlueprint(bp);
    if (bp.engine === 'quiz') return validateQuizBlueprint(bp);
    if (bp.engine === 'matching') return validateMatchingBlueprint(bp);
    return null;
}
