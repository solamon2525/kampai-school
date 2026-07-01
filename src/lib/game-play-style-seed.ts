/**
 * แมป game_slug → game_play_style สำหรับ seed 272
 */

import type { GamePlayStyleKey } from './game-play-style';

export const GAME_SLUG_PLAY_STYLE: Record<string, GamePlayStyleKey> = {
    'thai-sara-run': 'platformer-2d',
    'math-runner': 'platformer-2d',
    'farm-adventure': 'platformer-2d',
    'fraction-adventure': 'platformer-2d',
    'kingdom': 'platformer-2d',
    'weight-adventure': 'platformer-2d',
    'fishing': 'platformer-2d',
    'fishing-2': 'platformer-2d',
    'multiplication-kingdom': 'platformer-2d',
    'measure-up': 'platformer-2d',
    'jump-even-odd': 'platformer-2d',
    'attack-noun': 'platformer-2d',
    'attack-on-noun': 'platformer-2d',
    'waipot': 'platformer-2d',
    'wipod': 'platformer-2d',
    'sonnum': 'platformer-2d',
    'attnoun': 'platformer-2d',
    'ppp': 'platformer-2d',
    'tug-of-war': 'platformer-2d',
    'thai-vocab-arena': 'platformer-2d',
    'genetic-quest': 'platformer-2d',
    'probability-zoo-board': 'platformer-2d',
    'catch-numbers': 'puzzle',
    'reading-quest': 'platformer-2d',
    'english-quest': 'platformer-2d',
    'reading-game': 'platformer-2d',
    'thai-story': 'platformer-2d',
    'pizza-master-chef': 'platformer-2d',

    'thai-edu-rpg': 'top-down',
    'battle-city': 'top-down',
    'tank-commander': 'top-down',
    'robot-path': 'top-down',
    'veggie-garden': 'top-down',
    'cyberdrop': 'top-down',
    'vocab-move': 'top-down',
    'food-chain': 'top-down',
    'good-citizen': 'top-down',
    'debug-it': 'top-down',

    'flappy-bird': 'jump',
    'math-jumper': 'jump',
    'balloon-fighter': 'jump',

    'nitro-arena': 'racing',
    'math-racer': 'racing',
    'math-rally': 'racing',
    'multiply-race': 'racing',
    'multiply-rally': 'racing',
    'vocab-race': 'racing',
    'thai-spelling-moto': 'racing',

    'math-blaster': 'shooter',
    'math-tank-raid': 'shooter',
    'energy-rocket': 'shooter',
    'word-shield': 'shooter',

    'block-3d': 'sandbox-3d',
    'room-3d': 'sandbox-3d',
    'solid-3d': 'sandbox-3d',
    'net-3d': 'sandbox-3d',
    'coord-3d': 'sandbox-3d',
    'globe-3d': 'sandbox-3d',
    'snake-3d': 'sandbox-3d',
    'blocky-safari': 'sandbox-3d',

    'ai-hand-gesture-game': 'puzzle',
    'ar-zone-quiz': 'puzzle',
    'binary-bits': 'puzzle',
    'cashier': 'puzzle',
    'circuit-builder': 'puzzle',
    'coin-exchange': 'puzzle',
    'color-mix': 'puzzle',
    'color-wheel': 'puzzle',
    'detective': 'puzzle',
    'digestive-ar': 'puzzle',
    'english-ar-quiz': 'puzzle',
    'fraction-garden-ar': 'puzzle',
    'hands-up-quiz': 'puzzle',
    'handwash-order': 'puzzle',
    'line-trace': 'puzzle',
    'listen-spell': 'puzzle',
    'logic-gates': 'puzzle',
    'math-24': 'puzzle',
    'math-hand-raising': 'puzzle',
    'math-han': 'puzzle',
    'math-move-quiz': 'puzzle',
    'math-pizza': 'puzzle',
    'pizza': 'puzzle',
    'number-line': 'puzzle',
    'online-safety': 'puzzle',
    'order-it': 'puzzle',
    'phonics-pop': 'puzzle',
    'plate-builder': 'puzzle',
    'rhythm-master': 'puzzle',
    'rounding': 'puzzle',
    'sci-sort': 'puzzle',
    'sentence-builder': 'puzzle',
    'sentence-craft': 'puzzle',
    'sink-float': 'puzzle',
    'social-quiz': 'puzzle',
    'spelling': 'puzzle',
    'symmetry-art': 'puzzle',
    'thai-instruments': 'puzzle',
    'thai-spelling': 'puzzle',
    'thai-vocab-hub': 'puzzle',
    'typing': 'puzzle',
    'tech-typing': 'puzzle',
    'blockly': 'puzzle',
    'tech-blockly': 'puzzle',
    'vocab-hub': 'puzzle',
    'waste-sort': 'puzzle',
    'wizard-thai': 'puzzle',
    'food-chain': 'top-down',
};

export const TITLE_PLAY_STYLE_HINTS: { pattern: RegExp; style: GamePlayStyleKey }[] = [
    { pattern: /3d|voxel|block|มายคราฟ|sandbox/i, style: 'sandbox-3d' },
    { pattern: /racer|racing|แข่ง|รถ|moto|รัลลี่|rally/i, style: 'racing' },
    { pattern: /blaster|shooter|ยิง|rocket|tank|raid/i, style: 'shooter' },
    { pattern: /flappy|jumper|กระโดด|jump/i, style: 'jump' },
    { pattern: /runner|platform|วิ่ง|sara-run|adventure|kingdom/i, style: 'platformer-2d' },
    { pattern: /rpg|top-down|battle-city|robot-path|tank-commander/i, style: 'top-down' },
    { pattern: /quiz|spelling|sort|จับคู่|puzzle|spell|vocab|phonics|trace|symmetry|rhythm|instruments|blockly|typing|ar-quiz|hands-up/i, style: 'puzzle' },
];

export function resolvePlayStyleForSlug(slug: string | null | undefined): GamePlayStyleKey | null {
    if (!slug) return null;
    return GAME_SLUG_PLAY_STYLE[slug.trim().toLowerCase()] ?? null;
}

export function resolvePlayStyleFromTitle(title: string | null | undefined): GamePlayStyleKey {
    if (!title) return 'puzzle';
    for (const { pattern, style } of TITLE_PLAY_STYLE_HINTS) {
        if (pattern.test(title)) return style;
    }
    return 'puzzle';
}

export function slugFromGameUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    const m = url.match(/\/games\/[^/]+\/([^/?#]+)\.html/i)
        || url.match(/\/edu-hub-games\/[^/]+\/([^/?#]+)\.html/i);
    if (!m) return null;
    try {
        return decodeURIComponent(m[1]).toLowerCase();
    } catch {
        return m[1].toLowerCase();
    }
}

export function resolvePlayStyleForGame(item: {
    game_slug?: string | null;
    title?: string | null;
    external_url?: string | null;
}): GamePlayStyleKey {
    const fromSlug = resolvePlayStyleForSlug(item.game_slug);
    if (fromSlug) return fromSlug;
    const fromUrl = resolvePlayStyleForSlug(slugFromGameUrl(item.external_url));
    if (fromUrl) return fromUrl;
    return resolvePlayStyleFromTitle(item.title);
}
