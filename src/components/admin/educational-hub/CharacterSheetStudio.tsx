import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { CharacterSheetPreview } from './CharacterSheetPreview';
import { CharacterSheetGridPreview } from './CharacterSheetGridPreview';
import { CharacterPoseMapper } from './CharacterPoseMapper';
import { CharacterColorEditor } from './CharacterColorEditor';
import {
    type CharacterAnimationConfig,
    type CharacterPoseKey,
    CHARACTER_POSE_CATALOG,
    characterPoseLabel,
    getCharacterAnimPreset,
    parseCharacterAnimationConfig,
    resolveFootAnchor,
    validateAnimationConfig,
} from '@/lib/character-animation';
import { CharacterSheetAutoFitButton } from './CharacterSheetAutoFitButton';
import type { SpriteAutoFitResult } from '@/lib/sprite-frame-autofit';
import { parseCharacterColorConfig, type CharacterColorConfig } from '@/lib/character-color';
import type { CharacterSheet } from '@/services/educational-hub.service';
import { cn } from '@/lib/utils';

const QUICK_PREVIEW_POSES: CharacterPoseKey[] = ['idle', 'walk', 'run', 'jump', 'attack', 'crouch', 'slide', 'special'];

type Props = {
    sheet: CharacterSheet;
    busy?: boolean;
    onSave: (payload: {
        title: string;
        frameWidth: number;
        frameHeight: number;
        frameCount: number;
        animationConfig: CharacterAnimationConfig;
        colorConfig: CharacterColorConfig | null;
    }) => void | Promise<void>;
    className?: string;
};

export function CharacterSheetStudio({ sheet, busy, onSave, className }: Props) {
    const initialAnim = useMemo(
        () => parseCharacterAnimationConfig(sheet.animation_config) ?? getCharacterAnimPreset('grid-3x6-18'),
        [sheet.animation_config],
    );
    const [title, setTitle] = useState(sheet.title);
    const [fw, setFw] = useState(String(sheet.frame_width));
    const [fh, setFh] = useState(String(sheet.frame_height));
    const [fc, setFc] = useState(String(sheet.frame_count));
    const [preset, setPreset] = useState(initialAnim.preset);
    const [animConfig, setAnimConfig] = useState<CharacterAnimationConfig>(initialAnim);
    const [colorConfig, setColorConfig] = useState<CharacterColorConfig | null>(
        () => parseCharacterColorConfig(sheet.color_config),
    );
    const [previewMode, setPreviewMode] = useState<CharacterPoseKey>('run');
    const [face, setFace] = useState(1);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [autoFitAnalysis, setAutoFitAnalysis] = useState<SpriteAutoFitResult | null>(null);

    const frameWidth = parseInt(fw, 10) || sheet.frame_width;
    const frameHeight = parseInt(fh, 10) || sheet.frame_height;
    const frameCount = parseInt(fc, 10) || sheet.frame_count;

    const gridCols = animConfig.cols ?? (frameCount === 18 ? 6 : undefined);
    const gridRows = animConfig.rows ?? (frameCount === 18 ? 3 : undefined);

    const poseFoot = resolveFootAnchor(animConfig, previewMode);
    const poseHasOverride = Boolean(animConfig.poseAnchors?.[previewMode]);

    const setPoseFoot = (patch: { anchorFoot?: number; feetPad?: number }) => {
        setAnimConfig((prev) => {
            const current = resolveFootAnchor(prev, previewMode);
            const next = {
                anchorFoot: patch.anchorFoot ?? current.anchorFoot,
                feetPad: patch.feetPad ?? current.feetPad,
            };
            return {
                ...prev,
                poseAnchors: {
                    ...prev.poseAnchors,
                    [previewMode]: next,
                },
            };
        });
    };

    const resetPoseFoot = () => {
        setAnimConfig((prev) => {
            if (!prev.poseAnchors?.[previewMode]) return prev;
            const next = { ...prev.poseAnchors };
            delete next[previewMode];
            return {
                ...prev,
                poseAnchors: Object.keys(next).length ? next : undefined,
            };
        });
    };

    const handleSave = async () => {
        const err = validateAnimationConfig(animConfig, frameCount);
        if (err) {
            setSaveError(err);
            return;
        }
        setSaveError(null);
        await onSave({
            title: title.trim() || sheet.title,
            frameWidth,
            frameHeight,
            frameCount,
            animationConfig: animConfig,
            colorConfig,
        });
    };

    return (
        <div className={cn('space-y-3', className)}>
            <div className="flex flex-wrap items-center gap-2">
                <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-9 max-w-xs"
                    placeholder="ชื่อตัวละคร"
                />
                <Select value={previewMode} onValueChange={(v) => setPreviewMode(v as CharacterPoseKey)}>
                    <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {CHARACTER_POSE_CATALOG.map((g) => (
                            <SelectGroup key={g.id}>
                                <SelectLabel className="text-xs">{g.label}</SelectLabel>
                                {g.entries.map((e) => (
                                    <SelectItem key={e.key} value={e.key} className="text-xs">{e.label}</SelectItem>
                                ))}
                            </SelectGroup>
                        ))}
                    </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-1">
                    {QUICK_PREVIEW_POSES.map((m) => (
                        <Button
                            key={m}
                            type="button"
                            size="sm"
                            variant={previewMode === m ? 'default' : 'outline'}
                            className="h-8 text-xs"
                            onClick={() => setPreviewMode(m)}
                        >
                            {characterPoseLabel(m).split(' ')[0]}
                        </Button>
                    ))}
                </div>
                <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={() => setFace((f) => -f)}>
                    ทิศ: {face > 0 ? '→ ขวา' : '← ซ้าย'}
                </Button>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
                <div className="space-y-2 rounded-md border border-border p-2">
                    <p className="text-xs font-medium text-muted-foreground">📋 Sheet + เลขเฟรม</p>
                    <CharacterSheetGridPreview
                        sheetUrl={sheet.sheet_url}
                        frameWidth={frameWidth}
                        frameHeight={frameHeight}
                        frameCount={frameCount}
                        animationConfig={animConfig}
                        colorConfig={colorConfig}
                        autoFitAnalysis={autoFitAnalysis}
                        maxHeight={180}
                    />
                    <CharacterSheetAutoFitButton
                        sheetUrl={sheet.sheet_url}
                        frameCount={frameCount}
                        cols={gridCols}
                        rows={gridRows}
                        onApply={({ frameWidth: w, frameHeight: h, frameCount: n, cols, rows, analysis }) => {
                            setFw(String(w));
                            setFh(String(h));
                            setFc(String(n));
                            setAutoFitAnalysis(analysis);
                            if (cols && rows && animConfig.layout === 'grid') {
                                setAnimConfig((prev) => ({ ...prev, cols, rows }));
                            }
                        }}
                    />
                    <p className="text-[10px] text-muted-foreground">
                        กรอบเขียว = ตัวละครในเซลล์ · กรอบแดง = ล้นไปแตะเฟรมข้างเคียง
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                        <Input value={fw} onChange={(e) => setFw(e.target.value)} className="h-8 text-xs" placeholder="W" />
                        <Input value={fh} onChange={(e) => setFh(e.target.value)} className="h-8 text-xs" placeholder="H" />
                        <Input value={fc} onChange={(e) => setFc(e.target.value)} className="h-8 text-xs" placeholder="N" />
                    </div>
                </div>

                <div className="space-y-2 rounded-md border border-border p-2">
                    <p className="text-xs font-medium text-muted-foreground">🎬 Preview ในเกม (P1 / P2 + พื้น)</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <div className="text-center">
                            <CharacterSheetPreview
                                sheetUrl={sheet.sheet_url}
                                frameWidth={frameWidth}
                                frameHeight={frameHeight}
                                frameCount={frameCount}
                                animationConfig={animConfig}
                                colorConfig={colorConfig}
                                player={1}
                                mode={previewMode}
                                size={120}
                                face={face}
                                showGround
                                checkerboard
                                className="rounded border border-border mx-auto"
                            />
                            <p className="text-[10px] text-muted-foreground mt-1">P1</p>
                        </div>
                        <div className="text-center">
                            <CharacterSheetPreview
                                sheetUrl={sheet.sheet_url_p2 ?? sheet.sheet_url}
                                frameWidth={frameWidth}
                                frameHeight={frameHeight}
                                frameCount={frameCount}
                                animationConfig={animConfig}
                                colorConfig={colorConfig}
                                player={2}
                                mode={previewMode}
                                size={120}
                                face={face}
                                showGround
                                checkerboard
                                className="rounded border border-border mx-auto"
                            />
                            <p className="text-[10px] text-muted-foreground mt-1">P2</p>
                        </div>
                    </div>
                    <p className="text-[10px] text-center text-muted-foreground">
                        เส้นพื้น = จุดเท้าท่า {characterPoseLabel(previewMode)} · {((poseFoot.anchorFoot) * 100).toFixed(0)}% + {poseFoot.feetPad}px
                        {poseHasOverride ? ' (ปรับแยก)' : ' (default)'}
                    </p>
                    <div className="rounded-md border border-border px-2 py-2 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium text-muted-foreground">
                                👣 จุดเท้า — ท่า {characterPoseLabel(previewMode)}
                            </p>
                            {poseHasOverride && (
                                <Button type="button" size="sm" variant="ghost" className="h-7 text-[10px]" onClick={resetPoseFoot}>
                                    ใช้ default
                                </Button>
                            )}
                        </div>
                        <label className="space-y-0.5 text-xs block">
                            <span className="text-muted-foreground">anchorFoot: {(poseFoot.anchorFoot * 100).toFixed(0)}%</span>
                            <input
                                type="range"
                                min={0.75}
                                max={1}
                                step={0.01}
                                value={poseFoot.anchorFoot}
                                onChange={(e) => setPoseFoot({ anchorFoot: Number(e.target.value) })}
                                className="w-full accent-primary"
                            />
                        </label>
                        <label className="space-y-0.5 text-xs block">
                            <span className="text-muted-foreground">feetPad: {poseFoot.feetPad}px</span>
                            <input
                                type="range"
                                min={0}
                                max={32}
                                value={poseFoot.feetPad}
                                onChange={(e) => setPoseFoot({ feetPad: Number(e.target.value) })}
                                className="w-full accent-primary"
                            />
                        </label>
                        <p className="text-[10px] text-muted-foreground">
                            สลับปุ่ม run / jump / idle ด้านบน แล้วปรับทีละท่า — บันทึกแล้วเกมใช้ค่าแยกอัตโนมัติ
                        </p>
                    </div>
                </div>
            </div>

            <CharacterColorEditor
                sheetUrl={sheet.sheet_url}
                value={colorConfig}
                onChange={setColorConfig}
            />

            <CharacterPoseMapper
                preset={preset}
                frameCount={frameCount}
                onPresetChange={setPreset}
                onConfigChange={(config) => setAnimConfig((prev) => ({ ...config, poseAnchors: prev.poseAnchors }))}
            />

            {saveError && <p className="text-xs text-destructive">{saveError}</p>}

            <Button type="button" className="w-full" disabled={busy} onClick={handleSave}>
                {busy ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> กำลังบันทึก...</> : <><Save className="h-4 w-4 mr-1" /> บันทึกการตั้งค่า</>}
            </Button>
        </div>
    );
}
