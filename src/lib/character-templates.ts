/** เทมเพลตตัวละครสำเร็จรูป — Phase 2 Character Studio */

import {
    CHARACTER_ANIM_PRESET_GRID_3X6_18,
    type CharacterAnimationConfig,
} from '@/lib/character-animation';
import type { GamePlayStyleKey } from '@/lib/game-play-style';

export type CharacterStudioTemplate = {
    key: string;
    label: string;
    description: string;
    emoji: string;
    playStyle: GamePlayStyleKey;
    sheetUrl: string;
    sheetUrlP2?: string;
    storagePath: string;
    storagePathP2?: string;
    frameWidth: number;
    frameHeight: number;
    frameCount: number;
    animationConfig: CharacterAnimationConfig;
    /** preset สีแนะนำหลังสร้าง (optional) */
    defaultColorPreset?: string;
};

const BUNNY_ANIM: CharacterAnimationConfig = {
    ...CHARACTER_ANIM_PRESET_GRID_3X6_18,
    preset: 'grid-3x6-18',
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

export const CHARACTER_STUDIO_TEMPLATES: CharacterStudioTemplate[] = [
    {
        key: 'bunny-platformer-18',
        label: 'กระต่าย แพลตฟอร์ม 2D',
        description: '18 เฟรม — วิ่ง โดด ยืน · map ครบแล้ว · เปลี่ยนแค่สีได้',
        emoji: '🐰',
        playStyle: 'platformer-2d',
        sheetUrl: '/games/thai/assets/thai-sara-run/bunny-white-sheet.png',
        sheetUrlP2: '/games/thai/assets/thai-sara-run/bunny-blue-sheet.png',
        storagePath: 'git:games/thai/assets/thai-sara-run/bunny-white-sheet.png',
        storagePathP2: 'git:games/thai/assets/thai-sara-run/bunny-blue-sheet.png',
        frameWidth: 170,
        frameHeight: 227,
        frameCount: 18,
        animationConfig: BUNNY_ANIM,
        defaultColorPreset: 'bunny-blue',
    },
];

export function getCharacterStudioTemplate(key: string): CharacterStudioTemplate | undefined {
    return CHARACTER_STUDIO_TEMPLATES.find((t) => t.key === key);
}

/** preset จาก animation config → ใช้กรองคลัง */
export function inferPlayStyleFromAnim(config: CharacterAnimationConfig | null | undefined): GamePlayStyleKey {
    if (!config) return 'platformer-2d';
    if (config.preset === 'topdown-4dir-16' || config.directions) return 'top-down';
    if (config.preset === 'platformer-12') return 'jump';
    return 'platformer-2d';
}
