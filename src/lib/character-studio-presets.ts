/** Preset ท่าตามแนวเกม — ใช้ใน Wizard + อัปโหลด */

import type { GamePlayStyleKey } from '@/lib/game-play-style';
import {
    getCharacterAnimPreset,
    type CharacterAnimationConfig,
} from '@/lib/character-animation';

export function animPresetKeyForPlayStyle(style: GamePlayStyleKey): string {
    switch (style) {
        case 'platformer-2d':
            return 'grid-3x6-18';
        case 'top-down':
            return 'topdown-4dir-16';
        case 'jump':
            return 'platformer-12';
        default:
            return 'platformer-12';
    }
}

export function applyPlayStylePreset(style: GamePlayStyleKey): CharacterAnimationConfig {
    const key = animPresetKeyForPlayStyle(style);
    const base = getCharacterAnimPreset(key);
    return JSON.parse(JSON.stringify(base)) as CharacterAnimationConfig;
}

export const WIZARD_PLAY_STYLE_OPTIONS: GamePlayStyleKey[] = [
    'platformer-2d',
    'top-down',
    'jump',
    'puzzle',
];
