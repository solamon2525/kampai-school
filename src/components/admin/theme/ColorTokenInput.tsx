import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { normalizeHex, contrastRatio } from '@/lib/colorUtils';
import { cn } from '@/lib/utils';

interface Props {
    id: string;
    label: string;
    description?: string;
    value: string;
    defaultValue: string;
    /** Optional companion color used to display contrast ratio (e.g. background for foreground). */
    contrastWith?: string;
    onChange: (next: string) => void;
}

/**
 * ColorTokenInput — label + native color picker swatch + hex text input + reset button.
 * Two-way bound: typing valid hex updates the picker; using picker updates hex.
 * Optional contrast badge: shows WCAG ratio against `contrastWith` color.
 */
export const ColorTokenInput = ({
    id,
    label,
    description,
    value,
    defaultValue,
    contrastWith,
    onChange,
}: Props) => {
    const [text, setText] = useState(value);

    // Sync local input when external value changes (e.g. after Reset)
    useEffect(() => {
        setText(value);
    }, [value]);

    const commit = (raw: string) => {
        const normalized = normalizeHex(raw);
        if (normalized) onChange(normalized);
    };

    const ratio = contrastWith ? contrastRatio(value, contrastWith) : null;
    const ratioBadge = ratio !== null
        ? {
            text: `${ratio.toFixed(2)}:1`,
            // WCAG AA: body 4.5:1, large/UI 3:1
            tone: ratio >= 4.5 ? 'pass' : ratio >= 3 ? 'warn' : 'fail',
        } as const
        : null;

    const isCustom = value.toLowerCase() !== defaultValue.toLowerCase();

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
                <Label htmlFor={id} className="text-sm font-medium">
                    {label}
                </Label>
                {ratioBadge && (
                    <span
                        className={cn(
                            'text-[11px] font-mono px-1.5 py-0.5 rounded',
                            ratioBadge.tone === 'pass' && 'bg-green-100 text-green-800',
                            ratioBadge.tone === 'warn' && 'bg-yellow-100 text-yellow-800',
                            ratioBadge.tone === 'fail' && 'bg-red-100 text-red-800'
                        )}
                        title="Contrast ratio against companion color (WCAG AA: 4.5:1 body, 3:1 large/UI)"
                    >
                        {ratioBadge.text}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    aria-label={`เลือกสี ${label}`}
                    value={value}
                    onChange={(e) => {
                        setText(e.target.value);
                        commit(e.target.value);
                    }}
                    className="w-10 h-10 rounded-md border border-border cursor-pointer flex-shrink-0 p-0.5 bg-background"
                />
                <Input
                    id={id}
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onBlur={() => commit(text)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            commit(text);
                        }
                    }}
                    placeholder="#157F3C"
                    pattern="^#?[0-9A-Fa-f]{6}$"
                    className="font-mono text-sm uppercase"
                />
                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="คืนค่าเริ่มต้น"
                    title="คืนค่าเริ่มต้น"
                    disabled={!isCustom}
                    onClick={() => onChange(defaultValue)}
                    className="flex-shrink-0"
                >
                    <RotateCcw className="w-4 h-4" />
                </Button>
            </div>
            {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
            )}
        </div>
    );
};

export default ColorTokenInput;
