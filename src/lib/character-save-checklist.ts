/** Checklist ก่อนบันทึกตัวละคร */

import type { CharacterAnimationConfig } from '@/lib/character-animation';
import { isCharacterSupportedGame } from '@/lib/character-animation';
import type { SpriteAutoFitResult } from '@/lib/sprite-frame-autofit';

export type ChecklistItem = {
    id: string;
    label: string;
    ok: boolean;
    hint?: string;
};

export function buildCharacterSaveChecklist(opts: {
    animConfig: CharacterAnimationConfig;
    frameCount: number;
    autoFitAnalysis?: SpriteAutoFitResult | null;
    assignedGameSlugs?: string[];
    playStyle?: string | null;
}): ChecklistItem[] {
    const { animConfig, frameCount, autoFitAnalysis, assignedGameSlugs = [], playStyle } = opts;

    const hasRun = animConfig.run?.length > 0;
    const hasJump = Array.isArray(animConfig.jump)
        ? animConfig.jump.length > 0
        : animConfig.jump != null;
    const hasIdle = animConfig.idle?.length > 0;
    const overflow = autoFitAnalysis?.cells.some(
        (c) => c.overflowLeft || c.overflowRight || c.overflowTop || c.overflowBottom,
    ) ?? false;

    const liveSlugs = assignedGameSlugs.filter((s) => isCharacterSupportedGame(s));
    const pendingSlugs = assignedGameSlugs.filter((s) => !isCharacterSupportedGame(s));

    const hasDirections = animConfig.directions
        && Object.values(animConfig.directions).some((v) => v != null);

    const items: ChecklistItem[] = [
        {
            id: 'run',
            label: 'มีท่าวิ่ง (run)',
            ok: hasRun,
            hint: 'คลิกเฟรมบน sheet แล้ว map ท่า run',
        },
        {
            id: 'jump',
            label: playStyle === 'top-down' ? 'มีท่ายืน (idle)' : 'มีท่ากระโดด (jump)',
            ok: playStyle === 'top-down' ? hasIdle : hasJump,
        },
        {
            id: 'idle',
            label: 'มีท่ายืน (idle)',
            ok: hasIdle,
        },
        {
            id: 'frames',
            label: `เฟรมครบ (${frameCount} เฟรม)`,
            ok: frameCount > 0,
        },
        {
            id: 'overflow',
            label: 'ไม่ล้นเซลล์ข้างเคียง',
            ok: !overflow,
            hint: overflow ? 'ใช้ Auto fit หรือปรับขนาด W×H' : undefined,
        },
    ];

    if (playStyle === 'top-down') {
        items.push({
            id: 'directions',
            label: 'มีท่า 4 ทิศ (up/down/left/right)',
            ok: Boolean(hasDirections),
            hint: 'map ท่า walk แยกทิศในแท็บมองด้านบน',
        });
    }

    if (assignedGameSlugs.length > 0) {
        items.push({
            id: 'games-live',
            label: `เกม opt-in พร้อมใช้ (${liveSlugs.length})`,
            ok: liveSlugs.length > 0,
            hint: liveSlugs.length ? liveSlugs.join(', ') : undefined,
        });
        if (pendingSlugs.length) {
            items.push({
                id: 'games-pending',
                label: `เกมรอ integrate โค้ด (${pendingSlugs.length})`,
                ok: true,
                hint: pendingSlugs.join(', '),
            });
        }
    }

    return items;
}

export function checklistReadyToSave(items: ChecklistItem[]): boolean {
    return items.filter((i) => i.id !== 'games-pending').every((i) => i.ok);
}
