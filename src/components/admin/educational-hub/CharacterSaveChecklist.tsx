import { Check, X } from 'lucide-react';
import {
    buildCharacterSaveChecklist,
    checklistReadyToSave,
    type ChecklistItem,
} from '@/lib/character-save-checklist';
import type { CharacterAnimationConfig } from '@/lib/character-animation';
import type { SpriteAutoFitResult } from '@/lib/sprite-frame-autofit';
import { cn } from '@/lib/utils';

type Props = {
    animConfig: CharacterAnimationConfig;
    frameCount: number;
    autoFitAnalysis?: SpriteAutoFitResult | null;
    assignedGameSlugs?: string[];
    playStyle?: string | null;
    className?: string;
};

function ItemRow({ item }: { item: ChecklistItem }) {
    const optional = item.id === 'games-pending';
    return (
        <li className={cn('flex items-start gap-2 text-xs', !item.ok && !optional && 'text-destructive')}>
            {item.ok ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-green-600 mt-0.5" />
            ) : (
                <X className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0">
                <span>{item.label}</span>
                {item.hint && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.hint}</p>
                )}
            </div>
        </li>
    );
}

export function CharacterSaveChecklist({
    animConfig,
    frameCount,
    autoFitAnalysis,
    assignedGameSlugs,
    playStyle,
    className,
}: Props) {
    const items = buildCharacterSaveChecklist({
        animConfig,
        frameCount,
        autoFitAnalysis,
        assignedGameSlugs,
        playStyle,
    });
    const ready = checklistReadyToSave(items);

    return (
        <div className={cn('rounded-md border border-border px-3 py-2 space-y-2', className)}>
            <p className="text-xs font-medium text-muted-foreground">
                ✅ Checklist ก่อนบันทึก {ready ? '— พร้อม' : '— ยังไม่ครบ'}
            </p>
            <ul className="space-y-1.5">
                {items.map((item) => (
                    <ItemRow key={item.id} item={item} />
                ))}
            </ul>
        </div>
    );
}

export function useCharacterSaveReady(props: Props): boolean {
    const items = buildCharacterSaveChecklist({
        animConfig: props.animConfig,
        frameCount: props.frameCount,
        autoFitAnalysis: props.autoFitAnalysis,
        assignedGameSlugs: props.assignedGameSlugs,
        playStyle: props.playStyle,
    });
    return checklistReadyToSave(items);
}
