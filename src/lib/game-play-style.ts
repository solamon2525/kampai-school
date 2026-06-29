/**
 * แนว/รูปแบบการเล่นเกม — ใช้กรองรายการใน GamesTab และผูกตัวละคร/คลัง
 */

export type GamePlayStyleKey =
    | 'platformer-2d'
    | 'top-down'
    | 'jump'
    | 'racing'
    | 'shooter'
    | 'puzzle'
    | 'sandbox-3d';

export type GamePlayStyleOption = {
    key: GamePlayStyleKey;
    label: string;
    shortLabel: string;
    emoji: string;
    /** รองรับ sprite sheet จากคลังตัวละคร (KAMPAI.character) */
    supportsCharacter: boolean;
    description: string;
};

export const GAME_PLAY_STYLE_OPTIONS: GamePlayStyleOption[] = [
    {
        key: 'platformer-2d',
        label: 'เกมแพลตฟอร์ม 2D',
        shortLabel: 'แพลตฟอร์ม 2D',
        emoji: '🏃',
        supportsCharacter: true,
        description: 'วิ่ง กระโดด ข้ามพื้น — side-view platformer',
    },
    {
        key: 'top-down',
        label: 'เกมมองด้านบน (Top-down)',
        shortLabel: 'มองด้านบน',
        emoji: '🗺️',
        supportsCharacter: false,
        description: 'มองจากด้านบน — RPG / สำรวจ / เก็บของ',
    },
    {
        key: 'jump',
        label: 'เกมแนวกระโดด',
        shortLabel: 'แนวกระโดด',
        emoji: '⬆️',
        supportsCharacter: false,
        description: 'กระโดดข้ามสิ่งกีดขวาง — endless / hop',
    },
    {
        key: 'racing',
        label: 'เกมแนวแข่งรถ',
        shortLabel: 'แข่งรถ',
        emoji: '🏎️',
        supportsCharacter: false,
        description: 'แข่งความเร็ว / รถ / เรือ',
    },
    {
        key: 'shooter',
        label: 'เกมแนวยิง',
        shortLabel: 'ยิง',
        emoji: '🚀',
        supportsCharacter: false,
        description: 'ยิงเป้า / ยาน / ต่อสู้',
    },
    {
        key: 'puzzle',
        label: 'เกมแนวพัสเซิล',
        shortLabel: 'พัสเซิล',
        emoji: '🧩',
        supportsCharacter: false,
        description: 'จับคู่ ลากวาง ตอบคำถาม ปริศนา',
    },
    {
        key: 'sandbox-3d',
        label: 'เกม 3D แบบมายคราฟ',
        shortLabel: '3D มายคราฟ',
        emoji: '🧱',
        supportsCharacter: false,
        description: 'วางบล็อก สร้างโลก 3D voxel',
    },
];

export const GAME_PLAY_STYLE_KEYS = GAME_PLAY_STYLE_OPTIONS.map((o) => o.key);

export function isGamePlayStyleKey(v: string | null | undefined): v is GamePlayStyleKey {
    return !!v && (GAME_PLAY_STYLE_KEYS as readonly string[]).includes(v);
}

export function getGamePlayStyleOption(key: string | null | undefined): GamePlayStyleOption | null {
    if (!key) return null;
    return GAME_PLAY_STYLE_OPTIONS.find((o) => o.key === key) ?? null;
}

export function gamePlayStyleLabel(key: string | null | undefined): string {
    const o = getGamePlayStyleOption(key);
    if (!o) return 'ยังไม่ระบุ';
    return `${o.emoji} ${o.shortLabel}`;
}

export function gamePlayStyleSupportsCharacter(key: string | null | undefined): boolean {
    return getGamePlayStyleOption(key)?.supportsCharacter ?? false;
}

/** กรองเกมตามแนว — '__all__' | '__unset__' | key */
export type GamePlayStyleFilter = '__all__' | '__unset__' | GamePlayStyleKey;

export function filterGamesByPlayStyle<T extends { game_play_style?: string | null }>(
    items: T[],
    filter: GamePlayStyleFilter,
): T[] {
    if (filter === '__all__') return items;
    if (filter === '__unset__') return items.filter((i) => !i.game_play_style);
    return items.filter((i) => i.game_play_style === filter);
}

export function countGamesByPlayStyle<T extends { game_play_style?: string | null }>(
    items: T[],
): Record<GamePlayStyleFilter, number> {
    const counts = {
        __all__: items.length,
        __unset__: items.filter((i) => !i.game_play_style).length,
    } as Record<GamePlayStyleFilter, number>;
    for (const o of GAME_PLAY_STYLE_OPTIONS) {
        counts[o.key] = items.filter((i) => i.game_play_style === o.key).length;
    }
    return counts;
}
