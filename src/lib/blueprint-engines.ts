/**
 * Engine Registry — กลางกลางของระบบสร้างเกม multi-engine
 *
 * แมป engine key → { label, runtime, defaults, parse, validate, ... }
 * ใช้โดย GameBuilderWizard (เลือก engine), GameBlueprintEditor (route editor),
 * GamesTab (แสดง tag), และ runtime loader
 *
 * เพิ่ม engine ใหม่ = เพิ่ม entry ที่นี่ + สร้าง runtime HTML + editor component
 */

import {
    createDefaultPlatformerBlueprint,
    createDefaultQuizBlueprint,
    createDefaultMatchingBlueprint,
    parseGameBlueprint,
    parsePlatformerBlueprint,
    parseQuizBlueprint,
    parseMatchingBlueprint,
    validatePlatformerBlueprint,
    validateQuizBlueprint,
    validateMatchingBlueprint,
    type BlueprintEngine,
    type GameBlueprint,
    type MatchingBlueprintV1,
    type PlatformerBlueprintV1,
    type QuizBlueprintV1,
} from './game-blueprint';

export type SubjectKey =
    | 'math'
    | 'thai'
    | 'english'
    | 'science'
    | 'social'
    | 'art'
    | 'health'
    | 'career'
    | 'tech';

export type EngineRegistryEntry = {
    /** key ที่ตรงกับ field `engine` ใน blueprint JSON */
    key: BlueprintEngine;
    label: string;
    emoji: string;
    description: string;
    /** runtime HTML ที่ wrapper จะโหลด */
    runtimeUrl: string;
    /** วิชาที่ engine นี้เหมาะ (แสดงใน wizard) — 'all' = ทุกวิชา */
    subjectFit: SubjectKey[] | 'all';
    /** สร้าง blueprint เปล่าของ engine นี้ */
    createDefault: (meta?: { title?: string; subject?: string; grade?: string }) => GameBlueprint;
    /** parse raw JSON → blueprint ของ engine นี้ (คืน null ถ้าไม่ใช่ engine นี้) */
    parse: (raw: unknown) => GameBlueprint | null;
    /** validate คืนข้อความ error หรือ null ถ้าผ่าน */
    validate: (bp: GameBlueprint) => string | null;
};

const PLATFORMER_ENTRY: EngineRegistryEntry = {
    key: 'platformer-2d',
    label: 'วิ่งกระโดดแพลตฟอร์ม',
    emoji: '🏃',
    description: 'ตัวละครวิ่ง กระโดดข้ามแพลตฟอร์ม เก็บดาว และตอบคำถามตามจุดต่าง ๆ',
    runtimeUrl: '/games/engine/platformer-2d/index.html',
    subjectFit: ['math', 'thai', 'english', 'science'],
    createDefault: () => createDefaultPlatformerBlueprint(),
    parse: (raw) => {
        if (!raw || typeof raw !== 'object') return null;
        if ((raw as { engine?: string }).engine !== 'platformer-2d') return null;
        return parsePlatformerBlueprint(raw);
    },
    validate: (bp) =>
        bp.engine === 'platformer-2d' ? validatePlatformerBlueprint(bp) : 'engine ไม่ตรงกัน',
};

const QUIZ_ENTRY: EngineRegistryEntry = {
    key: 'quiz',
    label: 'แบบทดสอบตอบคำถาม',
    emoji: '📝',
    description: 'นักเรียนตอบคำถามตัวเลือกทีละข้อ พร้อมจับเวลาและนับคะแนน — ใช้ได้ทุกวิชา',
    runtimeUrl: '/games/engine/quiz/index.html',
    subjectFit: 'all',
    createDefault: (meta) => createDefaultQuizBlueprint(meta),
    parse: (raw) => {
        if (!raw || typeof raw !== 'object') return null;
        if ((raw as { engine?: string }).engine !== 'quiz') return null;
        return parseQuizBlueprint(raw);
    },
    validate: (bp) => (bp.engine === 'quiz' ? validateQuizBlueprint(bp) : 'engine ไม่ตรงกัน'),
};

const MATCHING_ENTRY: EngineRegistryEntry = {
    key: 'matching',
    label: 'จับคู่คำ',
    emoji: '🔗',
    description: 'จับคู่คำ/ภาพสองฝั่งให้ถูก — คำพ้อง คำตรงข้าม คำ-ความหมาย ฯลฯ',
    runtimeUrl: '/games/engine/matching/index.html',
    subjectFit: ['thai', 'english', 'science'],
    createDefault: (meta) => createDefaultMatchingBlueprint(meta),
    parse: (raw) => {
        if (!raw || typeof raw !== 'object') return null;
        if ((raw as { engine?: string }).engine !== 'matching') return null;
        return parseMatchingBlueprint(raw);
    },
    validate: (bp) =>
        bp.engine === 'matching' ? validateMatchingBlueprint(bp) : 'engine ไม่ตรงกัน',
};

/** registry ตามลำดับที่แสดงใน wizard */
export const ENGINE_REGISTRY: EngineRegistryEntry[] = [QUIZ_ENTRY, MATCHING_ENTRY, PLATFORMER_ENTRY];

/** lookup map สำหรับเข้าถึงด้วย key */
export const ENGINE_BY_KEY: Record<BlueprintEngine, EngineRegistryEntry> = {
    quiz: QUIZ_ENTRY,
    matching: MATCHING_ENTRY,
    'platformer-2d': PLATFORMER_ENTRY,
};

export function getEngine(key: string | null | undefined): EngineRegistryEntry | null {
    if (!key) return null;
    return ENGINE_BY_KEY[key as BlueprintEngine] ?? null;
}

/** parse โดยอ่าน engine จาก raw เอง (สำหรับ load จาก DB ที่ไม่รู้ engine ล่วงหน้า) */
export function parseBlueprintByEngine(raw: unknown): GameBlueprint | null {
    return parseGameBlueprint(raw);
}

/** type guards สำหรับ narrowing union */
export function isPlatformerBlueprint(bp: GameBlueprint): bp is PlatformerBlueprintV1 {
    return bp.engine === 'platformer-2d';
}

export function isQuizBlueprint(bp: GameBlueprint): bp is QuizBlueprintV1 {
    return bp.engine === 'quiz';
}

export function isMatchingBlueprint(bp: GameBlueprint): bp is MatchingBlueprintV1 {
    return bp.engine === 'matching';
}
