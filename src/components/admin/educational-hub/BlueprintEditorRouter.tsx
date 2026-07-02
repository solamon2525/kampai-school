/**
 * BlueprintEditorRouter — เลือก editor ที่ถูกต้องตาม engine ของ blueprint
 *
 * อ่าน engine จาก initialBlueprint แล้ว dispatch ไปยัง editor เฉพาะของ engine นั้น
 * - platformer-2d → GameBlueprintEditor (canvas editor เดิม)
 * - quiz          → QuizBlueprintEditor (form editor)
 *
 * Props pass-through เดียวกันทั้งคู่
 */

import { useMemo } from 'react';
import { getEngine } from '@/lib/blueprint-engines';
import { GameBlueprintEditor } from './GameBlueprintEditor';
import { QuizBlueprintEditor } from './QuizBlueprintEditor';
import { MatchingBlueprintEditor } from './MatchingBlueprintEditor';

type Props = {
    itemId: string;
    itemTitle: string;
    blueprintId?: string | null;
    initialBlueprint?: unknown;
    previewEngineUrl?: string;
    gameSlug?: string | null;
    onSaved: () => void;
    onCancel: () => void;
};

export function BlueprintEditorRouter(props: Props) {
    // อ่าน engine key จาก blueprint JSON (หรือเดาจาก url/slug)
    const engineKey = useMemo(() => {
        const raw = props.initialBlueprint;
        if (raw && typeof raw === 'object') {
            const e = (raw as { engine?: string }).engine;
            if (e) return e;
        }
        // fallback: ดูจาก preview url / slug
        const url = props.previewEngineUrl ?? '';
        if (url.includes('quiz')) return 'quiz';
        if (url.includes('platformer')) return 'platformer-2d';
        if (props.gameSlug === 'quiz-builder') return 'quiz';
        return 'platformer-2d'; // default เดิม
    }, [props.initialBlueprint, props.previewEngineUrl, props.gameSlug]);

    const engine = getEngine(engineKey);

    if (engine?.key === 'quiz') {
        return <QuizBlueprintEditor {...props} />;
    }
    if (engine?.key === 'matching') {
        return <MatchingBlueprintEditor {...props} />;
    }

    // default (platformer-2d หรือ engine ไม่รู้จัก) → ใช้ editor เดิม
    return <GameBlueprintEditor {...props} />;
}
