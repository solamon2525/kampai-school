import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    CHARACTER_ANIM_PRESET_OPTIONS,
    buildAnimationConfigFromFields,
    getCharacterAnimPreset,
    poseFieldsFromConfig,
    type CharacterAnimationConfig,
    type CharacterPoseFields,
} from '@/lib/character-animation';

type Props = {
    preset: string;
    frameCount: number;
    onPresetChange: (preset: string) => void;
    onConfigChange: (config: CharacterAnimationConfig) => void;
};

export function CharacterPoseMapper({ preset, frameCount, onPresetChange, onConfigChange }: Props) {
    const [fields, setFields] = useState<CharacterPoseFields>(() =>
        poseFieldsFromConfig(getCharacterAnimPreset(preset)),
    );
    const [mapError, setMapError] = useState<string | null>(null);

    useEffect(() => {
        setFields(poseFieldsFromConfig(getCharacterAnimPreset(preset)));
    }, [preset]);

    useEffect(() => {
        const { config, error } = buildAnimationConfigFromFields(fields, frameCount);
        setMapError(error);
        if (!error) onConfigChange(config);
    }, [fields, frameCount, onConfigChange]);

    const set = (patch: Partial<CharacterPoseFields>) => setFields((f) => ({ ...f, ...patch }));

    return (
        <div className="space-y-2 rounded-md border border-border p-3">
            <p className="text-xs font-medium text-muted-foreground">🎬 Map ท่าเคลื่อนไหว (เลขเฟรม)</p>
            <Select
                value={preset}
                onValueChange={(v) => {
                    onPresetChange(v);
                    set({ preset: v });
                }}
            >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                    {CHARACTER_ANIM_PRESET_OPTIONS.map((p) => (
                        <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="space-y-0.5">
                    <span className="text-muted-foreground">วิ่ง (run)</span>
                    <Input className="h-8 font-mono text-xs" value={fields.run} onChange={(e) => set({ run: e.target.value })} />
                </label>
                <label className="space-y-0.5">
                    <span className="text-muted-foreground">โดด (jump)</span>
                    <Input className="h-8 font-mono text-xs" value={fields.jump} onChange={(e) => set({ jump: e.target.value })} />
                </label>
                <label className="space-y-0.5">
                    <span className="text-muted-foreground">ยืน (idle)</span>
                    <Input className="h-8 font-mono text-xs" value={fields.idle} onChange={(e) => set({ idle: e.target.value })} />
                </label>
                <label className="space-y-0.5">
                    <span className="text-muted-foreground">เดิน (walk)</span>
                    <Input className="h-8 font-mono text-xs" value={fields.walk} onChange={(e) => set({ walk: e.target.value })} />
                </label>
                <label className="space-y-0.5">
                    <span className="text-muted-foreground">เจ็บ (hurt)</span>
                    <Input className="h-8 font-mono text-xs" value={fields.hurt} onChange={(e) => set({ hurt: e.target.value })} />
                </label>
                <label className="space-y-0.5">
                    <span className="text-muted-foreground">ดีใจ (happy)</span>
                    <Input className="h-8 font-mono text-xs" value={fields.happy} onChange={(e) => set({ happy: e.target.value })} />
                </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <label className="space-y-0.5 text-xs">
                    <span className="text-muted-foreground">ทิศทางเฟรมวิ่งใน sheet</span>
                    <Select value={fields.runFaces} onValueChange={(v: 'left' | 'right') => set({ runFaces: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="right">หันขวา (flip เมื่อเดินซ้าย)</SelectItem>
                            <SelectItem value="left">หันซ้าย (flip เมื่อเดินขวา)</SelectItem>
                        </SelectContent>
                    </Select>
                </label>
                <label className="space-y-0.5 text-xs">
                    <span className="text-muted-foreground">จุดเท้าในเฟรม: {(fields.anchorFoot * 100).toFixed(0)}%</span>
                    <input
                        type="range"
                        min={0.75}
                        max={1}
                        step={0.01}
                        value={fields.anchorFoot}
                        onChange={(e) => set({ anchorFoot: Number(e.target.value) })}
                        className="w-full accent-primary"
                    />
                </label>
            </div>
            <label className="space-y-0.5 text-xs block">
                <span className="text-muted-foreground">ขยับลงเพิ่ม (px): {fields.feetPad}</span>
                <input
                    type="range"
                    min={0}
                    max={32}
                    value={fields.feetPad}
                    onChange={(e) => set({ feetPad: Number(e.target.value) })}
                    className="w-full accent-primary"
                />
            </label>
            {mapError && <p className="text-xs text-destructive">{mapError}</p>}
            <p className="text-[10px] text-muted-foreground">
                {CHARACTER_ANIM_PRESET_OPTIONS.find((p) => p.key === preset)?.frameHint ?? ''}
            </p>
            <p className="text-[10px] text-muted-foreground">
                ใส่เลขเฟรมคั่นจุลภาค · ปรับทิศทาง/จุดเท้าให้ตรงกับ sprite
            </p>
        </div>
    );
}
