import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Pipette, Sparkles } from 'lucide-react';
import {
    CHARACTER_COLOR_PRESETS,
    type CharacterColorConfig,
    type CharacterColorSlot,
    parseCharacterColorConfig,
    presetToColorConfig,
} from '@/lib/character-color';
import { extractDominantColorSlots } from '@/lib/sprite-recolor';
import { cn } from '@/lib/utils';

type Props = {
    sheetUrl: string;
    value: CharacterColorConfig | null;
    onChange: (config: CharacterColorConfig | null) => void;
    className?: string;
};

export function CharacterColorEditor({ sheetUrl, value, onChange, className }: Props) {
    const config = value ?? { version: 1, mode: 'palette', slots: [], preset: 'original' };
    const [busy, setBusy] = useState(false);
    const [pickMode, setPickMode] = useState(false);

    const setPreset = (key: string) => {
        onChange(presetToColorConfig(key));
    };

    const updateSlot = (index: number, patch: Partial<CharacterColorSlot>) => {
        const slots = [...(config.slots ?? [])];
        slots[index] = { ...slots[index], ...patch };
        onChange({ ...config, version: 1, mode: 'palette', slots, preset: undefined });
    };

    const handleAutoDetect = async () => {
        setBusy(true);
        try {
            const slots = await extractDominantColorSlots(sheetUrl, 6);
            onChange({ version: 1, mode: 'palette', slots, preset: undefined });
        } finally {
            setBusy(false);
        }
    };

    const handleEyedropper = useCallback(async () => {
        if (!('EyeDropper' in window)) {
            setPickMode((p) => !p);
            return;
        }
        try {
            // @ts-expect-error EyeDropper is experimental
            const dropper = new window.EyeDropper();
            const result = await dropper.open();
            const hex = result.sRGBHex as string;
            const slots = config.slots?.length
                ? [...config.slots]
                : [{ id: 'slot-0', label: 'ตัว', source: { r: 200, g: 200, b: 200 }, target: hex, tolerance: 20, enabled: true }];
            if (slots.length) {
                slots[0] = { ...slots[0], target: hex };
                onChange({ ...config, version: 1, mode: 'palette', slots, preset: undefined });
            }
        } catch {
            /* user cancelled */
        }
    }, [config, onChange]);

    useEffect(() => {
        if (!pickMode) return;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(img, 0, 0);
            const onClick = (e: MouseEvent) => {
                const rect = canvas.getBoundingClientRect();
                const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width);
                const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height);
                const d = ctx.getImageData(x, y, 1, 1).data;
                const slots = config.slots?.length
                    ? [...config.slots]
                    : [{
                        id: 'slot-0',
                        label: 'ตัว',
                        source: { r: d[0], g: d[1], b: d[2] },
                        target: '#ffffff',
                        tolerance: 20,
                        enabled: true,
                    }];
                slots[0] = {
                    ...slots[0],
                    source: { r: d[0], g: d[1], b: d[2] },
                };
                onChange(parseCharacterColorConfig({ ...config, slots, preset: undefined }) ?? {
                    version: 1,
                    mode: 'palette',
                    slots,
                });
                setPickMode(false);
            };
            canvas.style.position = 'fixed';
            canvas.style.inset = '0';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.zIndex = '9999';
            canvas.style.cursor = 'crosshair';
            canvas.style.imageRendering = 'pixelated';
            document.body.appendChild(canvas);
            canvas.addEventListener('click', onClick);
            return () => {
                canvas.removeEventListener('click', onClick);
                canvas.remove();
            };
        };
        img.src = sheetUrl;
    }, [pickMode, sheetUrl, config, onChange]);

    return (
        <div className={cn('space-y-3 rounded-md border border-border p-3', className)}>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">🎨 ใส่สีตัวละคร (palette)</p>
                <div className="flex flex-wrap gap-1">
                    <Button type="button" size="sm" variant="outline" className="h-7 text-xs" disabled={busy} onClick={handleAutoDetect}>
                        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                        ตรวจสีอัตโนมัติ
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={handleEyedropper}>
                        <Pipette className="h-3 w-3 mr-1" />
                        {pickMode ? 'คลิกบน sheet…' : 'หยิบสี'}
                    </Button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Label className="text-xs shrink-0">Preset</Label>
                <Select value={config.preset ?? (config.slots?.length ? 'custom' : 'original')} onValueChange={setPreset}>
                    <SelectTrigger className="h-8 w-40 text-xs">
                        <SelectValue placeholder="เลือก preset" />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(CHARACTER_COLOR_PRESETS).map(([key, p]) => (
                            <SelectItem key={key} value={key} className="text-xs">{p.label}</SelectItem>
                        ))}
                        <SelectItem value="custom" className="text-xs">กำหนดเอง</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-wrap gap-1">
                {(['bunny-blue', 'bunny-pink', 'bunny-green'] as const).map((key) => (
                    <Button
                        key={key}
                        type="button"
                        size="sm"
                        variant={config.preset === key ? 'default' : 'outline'}
                        className="h-7 text-xs"
                        onClick={() => setPreset(key)}
                    >
                        {CHARACTER_COLOR_PRESETS[key].label}
                    </Button>
                ))}
                <Button
                    type="button"
                    size="sm"
                    variant={!config.preset || config.preset === 'original' ? 'default' : 'outline'}
                    className="h-7 text-xs"
                    onClick={() => setPreset('original')}
                >
                    ต้นฉบับ
                </Button>
            </div>

            {!config.slots?.length ? (
                <p className="text-[11px] text-muted-foreground">
                    ต้นฉบับ — ไม่เปลี่ยนสี · กด &quot;ตรวจสีอัตโนมัติ&quot; หรือเลือก preset
                </p>
            ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {config.slots.map((slot, i) => (
                        <div key={slot.id} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 text-xs">
                            <Switch
                                checked={slot.enabled !== false}
                                onCheckedChange={(v) => updateSlot(i, { enabled: v })}
                                aria-label={`เปิด/ปิด ${slot.label}`}
                            />
                            <Input
                                value={slot.label}
                                onChange={(e) => updateSlot(i, { label: e.target.value })}
                                className="h-7 text-xs"
                            />
                            <div
                                className="h-7 w-7 rounded border border-border shrink-0"
                                style={{ background: `rgb(${slot.source.r},${slot.source.g},${slot.source.b})` }}
                                title="สีต้นฉบับ"
                            />
                            <Input
                                type="color"
                                value={slot.target.startsWith('#') ? slot.target : '#ffffff'}
                                onChange={(e) => updateSlot(i, { target: e.target.value })}
                                className="h-7 w-10 p-0 border-0 cursor-pointer"
                                title="สีเป้าหมาย"
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
