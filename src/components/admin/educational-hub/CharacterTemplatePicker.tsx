import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    CHARACTER_STUDIO_TEMPLATES,
    type CharacterStudioTemplate,
} from '@/lib/character-templates';
import { cn } from '@/lib/utils';

type Props = {
    busy?: boolean;
    onSelect: (template: CharacterStudioTemplate) => void | Promise<void>;
    className?: string;
};

/** เลือกเทมเพลตสำเร็จรูป — เริ่มจากกระต่าย/แบบว่าง */
export function CharacterTemplatePicker({ busy, onSelect, className }: Props) {
    return (
        <div className={cn('space-y-2 rounded-md border border-border p-3', className)}>
            <p className="text-xs font-medium text-muted-foreground">📦 เทมเพลตสำเร็จรูป</p>
            <p className="text-[10px] text-muted-foreground">
                ใช้เทมเพลต → เปลี่ยนแค่สีหรือ duplicate ทำชุดใหม่ — ไม่ต้อง map ท่าใหม่
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
                {CHARACTER_STUDIO_TEMPLATES.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        disabled={busy}
                        onClick={() => void onSelect(t)}
                        className={cn(
                            'rounded-md border border-border px-3 py-2 text-left text-xs transition-colors hover:bg-muted/50',
                            busy && 'opacity-60 pointer-events-none',
                        )}
                    >
                        <span className="font-medium">{t.emoji} {t.label}</span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{t.description}</p>
                    </button>
                ))}
            </div>
            {busy && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> กำลังสร้างจากเทมเพลต…
                </p>
            )}
        </div>
    );
}
