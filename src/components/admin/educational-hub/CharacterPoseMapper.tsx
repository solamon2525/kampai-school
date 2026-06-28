import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import {
    CHARACTER_ANIM_PRESET_OPTIONS,
    CHARACTER_POSE_CATALOG,
    CHARACTER_CORE_POSE_KEYS,
    buildAnimationConfigFromFields,
    getCharacterAnimPreset,
    poseFieldsFromConfig,
    type CharacterAnimationConfig,
    type CharacterCorePoseKey,
    type CharacterExtendedPoseKey,
    type CharacterPoseFields,
} from '@/lib/character-animation';
import { cn } from '@/lib/utils';

type Props = {
    preset: string;
    frameCount: number;
    initialConfig?: CharacterAnimationConfig | null;
    onPresetChange: (preset: string) => void;
    onConfigChange: (config: CharacterAnimationConfig) => void;
};

export function CharacterPoseMapper({ preset, frameCount, initialConfig, onPresetChange, onConfigChange }: Props) {
    const [fields, setFields] = useState<CharacterPoseFields>(() =>
        poseFieldsFromConfig(initialConfig ?? getCharacterAnimPreset(preset)),
    );
    const [mapError, setMapError] = useState<string | null>(null);
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
        movement: true,
        combat: false,
        stance: false,
        platformer: false,
        special: false,
    });

    useEffect(() => {
        if (initialConfig) {
            setFields(poseFieldsFromConfig(initialConfig));
        }
    }, [initialConfig]);

    useEffect(() => {
        const { config, error } = buildAnimationConfigFromFields(fields, frameCount);
        setMapError(error);
        if (!error) onConfigChange(config);
    }, [fields, frameCount, onConfigChange]);

    const setCore = (key: CharacterCorePoseKey, value: string) =>
        setFields((f) => ({ ...f, core: { ...f.core, [key]: value } }));

    const setExtra = (key: CharacterExtendedPoseKey, value: string) =>
        setFields((f) => ({
            ...f,
            extras: value.trim() ? { ...f.extras, [key]: value } : (() => {
                const next = { ...f.extras };
                delete next[key];
                return next;
            })(),
        }));

    const setMeta = (patch: Partial<Pick<CharacterPoseFields, 'runFaces' | 'anchorFoot' | 'feetPad'>>) =>
        setFields((f) => ({ ...f, ...patch }));

    return (
        <div className="space-y-2 rounded-md border border-border p-3">
            <p className="text-xs font-medium text-muted-foreground">🎬 Map ท่าเคลื่อนไหว (เลขเฟรม)</p>
            <Select
                value={preset}
                onValueChange={(v) => {
                    onPresetChange(v);
                    setFields(poseFieldsFromConfig(getCharacterAnimPreset(v)));
                }}
            >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                    {CHARACTER_ANIM_PRESET_OPTIONS.map((p) => (
                        <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {CHARACTER_POSE_CATALOG.map((group) => {
                const open = openGroups[group.id] ?? false;
                return (
                    <Collapsible
                        key={group.id}
                        open={open}
                        onOpenChange={(v) => setOpenGroups((g) => ({ ...g, [group.id]: v }))}
                    >
                        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-border px-2 py-1.5 text-xs font-medium hover:bg-muted/50">
                            <span>{group.label}</span>
                            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-2">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                {group.entries.map((entry) => {
                                    const isCoreKey = CHARACTER_CORE_POSE_KEYS.includes(entry.key as CharacterCorePoseKey);
                                    const value = isCoreKey
                                        ? fields.core[entry.key as CharacterCorePoseKey]
                                        : (fields.extras[entry.key as CharacterExtendedPoseKey] ?? '');
                                    return (
                                        <label key={entry.key} className="space-y-0.5">
                                            <span className="text-muted-foreground">{entry.label}</span>
                                            <Input
                                                className="h-8 font-mono text-xs"
                                                value={value}
                                                placeholder={entry.placeholder ?? (isCoreKey ? '' : 'ว่าง = ยังไม่ map')}
                                                onChange={(e) => {
                                                    if (isCoreKey) setCore(entry.key as CharacterCorePoseKey, e.target.value);
                                                    else setExtra(entry.key as CharacterExtendedPoseKey, e.target.value);
                                                }}
                                            />
                                        </label>
                                    );
                                })}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                );
            })}

            <div className="grid grid-cols-2 gap-2">
                <label className="space-y-0.5 text-xs">
                    <span className="text-muted-foreground">ทิศทางเฟรมวิ่งใน sheet</span>
                    <Select value={fields.runFaces} onValueChange={(v: 'left' | 'right') => setMeta({ runFaces: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="right">หันขวา (flip เมื่อเดินซ้าย)</SelectItem>
                            <SelectItem value="left">หันซ้าย (flip เมื่อเดินขวา)</SelectItem>
                        </SelectContent>
                    </Select>
                </label>
                <label className="space-y-0.5 text-xs">
                    <span className="text-muted-foreground">จุดเท้า default: {(fields.anchorFoot * 100).toFixed(0)}%</span>
                    <input
                        type="range"
                        min={0.75}
                        max={1}
                        step={0.01}
                        value={fields.anchorFoot}
                        onChange={(e) => setMeta({ anchorFoot: Number(e.target.value) })}
                        className="w-full accent-primary"
                    />
                </label>
            </div>
            <label className="space-y-0.5 text-xs block">
                <span className="text-muted-foreground">ขยับลง default (px): {fields.feetPad}</span>
                <input
                    type="range"
                    min={0}
                    max={32}
                    value={fields.feetPad}
                    onChange={(e) => setMeta({ feetPad: Number(e.target.value) })}
                    className="w-full accent-primary"
                />
            </label>
            {mapError && <p className="text-xs text-destructive">{mapError}</p>}
            <p className="text-[10px] text-muted-foreground">
                {CHARACTER_ANIM_PRESET_OPTIONS.find((p) => p.key === preset)?.frameHint ?? ''}
            </p>
            <p className="text-[10px] text-muted-foreground">
                เกมเรียกท่าเสริมด้วย <code className="text-[10px]">player.state</code> เช่น attack · crouch · slide · special
                · ท่าที่ยังไม่ map จะ fallback ไปท่าเคลื่อนที่
            </p>
        </div>
    );
}
