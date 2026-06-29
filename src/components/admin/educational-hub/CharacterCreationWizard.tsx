import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react';
import {
    CHARACTER_ANIM_PRESET_OPTIONS,
    type CharacterAnimationConfig,
    getCharacterAnimPreset,
    validateAnimationConfig,
} from '@/lib/character-animation';
import { applyPlayStylePreset, WIZARD_PLAY_STYLE_OPTIONS } from '@/lib/character-studio-presets';
import {
    GAME_PLAY_STYLE_OPTIONS,
    gamePlayStyleLabel,
    type GamePlayStyleKey,
} from '@/lib/game-play-style';
import { suggestFrameSizeFromImage } from '@/lib/character-animation';
import { analyzeSpriteSheetFromUrl } from '@/lib/sprite-frame-autofit';
import { processSpriteSheetPreviewUrl } from '@/lib/sprite-background';
import { CharacterInteractiveGrid } from './CharacterInteractiveGrid';
import { CharacterSheetPreview } from './CharacterSheetPreview';
import { CharacterSaveChecklist } from './CharacterSaveChecklist';
import { cn } from '@/lib/utils';

type Props = {
    busy?: boolean;
    onUpload: (payload: {
        title: string;
        file: File;
        fileP2: File | null;
        frameWidth: number;
        frameHeight: number;
        frameCount: number;
        animationConfig: CharacterAnimationConfig;
        playStyle: GamePlayStyleKey;
    }) => void | Promise<void>;
    className?: string;
};

const STEPS = ['อัปโหลด', 'แนวเกม', 'ตรวจ & บันทึก'] as const;

export function CharacterCreationWizard({ busy, onUpload, className }: Props) {
    const [step, setStep] = useState(0);
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [fileP2, setFileP2] = useState<File | null>(null);
    const [removeBg, setRemoveBg] = useState(true);
    const [bgTolerance, setBgTolerance] = useState(36);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewBusy, setPreviewBusy] = useState(false);
    const [playStyle, setPlayStyle] = useState<GamePlayStyleKey>('platformer-2d');
    const [fw, setFw] = useState('128');
    const [fh, setFh] = useState('128');
    const [fc, setFc] = useState('18');
    const [animConfig, setAnimConfig] = useState<CharacterAnimationConfig>(() =>
        applyPlayStylePreset('platformer-2d'),
    );

    const presetMeta = CHARACTER_ANIM_PRESET_OPTIONS.find((p) => p.key === animConfig.preset)
        ?? CHARACTER_ANIM_PRESET_OPTIONS[0];

    useEffect(() => {
        const preset = applyPlayStylePreset(playStyle);
        setAnimConfig(preset);
        const meta = CHARACTER_ANIM_PRESET_OPTIONS.find((p) => p.key === preset.preset);
        if (meta) setFc(String(meta.frameCount));
    }, [playStyle]);

    useEffect(() => {
        if (!file) {
            setPreviewUrl(null);
            return;
        }
        let cancelled = false;
        setPreviewBusy(true);
        (async () => {
            try {
                const url = removeBg
                    ? await processSpriteSheetPreviewUrl(file, { tolerance: bgTolerance, mode: 'auto' })
                    : URL.createObjectURL(file);
                if (cancelled) {
                    URL.revokeObjectURL(url);
                    return;
                }
                setPreviewUrl((prev) => {
                    if (prev) URL.revokeObjectURL(prev);
                    return url;
                });
                const img = new Image();
                img.onload = () => {
                    if (cancelled) return;
                    const fcNum = parseInt(fc, 10) || presetMeta.frameCount;
                    const gridOpts = 'cols' in presetMeta && presetMeta.cols
                        ? {
                            cols: presetMeta.cols,
                            rows: 'rows' in presetMeta ? presetMeta.rows : 3,
                            frameCount: fcNum,
                        }
                        : { frameCount: fcNum };
                    void analyzeSpriteSheetFromUrl(url, gridOpts).then((fit) => {
                        if (cancelled || !fit) {
                            const suggested = suggestFrameSizeFromImage(
                                img.naturalWidth,
                                img.naturalHeight,
                                fcNum,
                                'cols' in presetMeta && presetMeta.cols
                                    ? { cols: presetMeta.cols, rows: 'rows' in presetMeta ? presetMeta.rows : 3 }
                                    : undefined,
                            );
                            if (suggested) {
                                setFw(String(suggested.frameWidth));
                                setFh(String(suggested.frameHeight));
                            }
                            return;
                        }
                        setFw(String(fit.frameWidth));
                        setFh(String(fit.frameHeight));
                        setFc(String(fit.frameCount));
                        if (fit.cols && fit.rows) {
                            setAnimConfig((prev) => ({ ...prev, cols: fit.cols, rows: fit.rows }));
                        }
                    });
                };
                img.src = url;
            } finally {
                if (!cancelled) setPreviewBusy(false);
            }
        })();
        return () => {
            cancelled = true;
            setPreviewUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
            });
        };
    }, [file, fc, presetMeta, removeBg, bgTolerance]);

    const frameWidth = parseInt(fw, 10) || 128;
    const frameHeight = parseInt(fh, 10) || 128;
    const frameCount = parseInt(fc, 10) || presetMeta.frameCount;
    const animErr = validateAnimationConfig(animConfig, frameCount);

    const canNext = step === 0 ? Boolean(file) : step === 1 ? true : !animErr;

    const handleSubmit = () => {
        if (!file || animErr) return;
        void onUpload({
            title: title || file.name.replace(/\.[^.]+$/, ''),
            file,
            fileP2,
            frameWidth,
            frameHeight,
            frameCount,
            animationConfig: animConfig,
            playStyle,
        });
    };

    return (
        <div className={cn('space-y-3', className)}>
            <div className="flex items-center gap-1">
                {STEPS.map((label, i) => (
                    <div key={label} className="flex items-center gap-1 flex-1">
                        <div
                            className={cn(
                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium border',
                                i === step ? 'bg-primary text-primary-foreground border-primary' : i < step ? 'bg-muted border-border' : 'border-border text-muted-foreground',
                            )}
                        >
                            {i + 1}
                        </div>
                        <span className={cn('text-xs truncate', i === step ? 'font-medium' : 'text-muted-foreground')}>
                            {label}
                        </span>
                        {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border mx-1" />}
                    </div>
                ))}
            </div>

            {step === 0 && (
                <div className="space-y-2 rounded-md border border-border p-3">
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ชื่อตัวละคร" />
                    <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                        <p className="text-sm font-medium">✂️ ตัดพื้นหลังอัตโนมัติ</p>
                        <Switch checked={removeBg} onCheckedChange={setRemoveBg} />
                    </div>
                    {removeBg && (
                        <label className="text-xs text-muted-foreground block">
                            ความไว: {bgTolerance}
                            <input type="range" min={8} max={64} value={bgTolerance} onChange={(e) => setBgTolerance(Number(e.target.value))} className="w-full accent-primary" />
                        </label>
                    )}
                    <Input type="file" accept="image/png,image/webp,image/gif" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                    <Input type="file" accept="image/png,image/webp,image/gif" onChange={(e) => setFileP2(e.target.files?.[0] ?? null)} />
                    {previewUrl && (
                        <CharacterInteractiveGrid
                            sheetUrl={previewUrl}
                            frameWidth={frameWidth}
                            frameHeight={frameHeight}
                            frameCount={frameCount}
                            animationConfig={animConfig}
                            maxHeight={120}
                        />
                    )}
                    {previewBusy && <p className="text-xs text-muted-foreground">กำลังประมวลผล preview…</p>}
                </div>
            )}

            {step === 1 && (
                <div className="space-y-2 rounded-md border border-border p-3">
                    <p className="text-xs text-muted-foreground">เลือกแนวเกม → preset ท่าจะถูกตั้งอัตโนมัติ</p>
                    <div className="grid grid-cols-2 gap-2">
                        {WIZARD_PLAY_STYLE_OPTIONS.map((key) => {
                            const opt = GAME_PLAY_STYLE_OPTIONS.find((o) => o.key === key);
                            const selected = playStyle === key;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setPlayStyle(key)}
                                    className={cn(
                                        'rounded-md border px-3 py-2 text-left text-xs transition-colors',
                                        selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50',
                                    )}
                                >
                                    <span className="font-medium">{opt?.emoji} {gamePlayStyleLabel(key)}</span>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">{opt?.description}</p>
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                        Preset: {getCharacterAnimPreset(animConfig.preset).preset} · {frameCount} เฟรม
                        {' · '}
                        {CHARACTER_ANIM_PRESET_OPTIONS.find((p) => p.key === animConfig.preset)?.frameHint}
                    </p>
                </div>
            )}

            {step === 2 && previewUrl && (
                <div className="space-y-2 rounded-md border border-border p-3">
                    <CharacterInteractiveGrid
                        sheetUrl={previewUrl}
                        frameWidth={frameWidth}
                        frameHeight={frameHeight}
                        frameCount={frameCount}
                        animationConfig={animConfig}
                        maxHeight={140}
                    />
                    <div className="flex flex-wrap gap-2 justify-center">
                        {(['idle', 'walk', 'run', 'jump'] as const).map((mode) => (
                            <CharacterSheetPreview
                                key={mode}
                                sheetUrl={previewUrl}
                                frameWidth={frameWidth}
                                frameHeight={frameHeight}
                                frameCount={frameCount}
                                animationConfig={animConfig}
                                mode={mode}
                                size={56}
                                showGround
                                checkerboard
                                className="rounded border border-border"
                            />
                        ))}
                    </div>
                    <CharacterSaveChecklist
                        animConfig={animConfig}
                        frameCount={frameCount}
                        playStyle={playStyle}
                    />
                    {animErr && <p className="text-xs text-destructive">{animErr}</p>}
                </div>
            )}

            <div className="flex justify-between gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={step === 0}
                    onClick={() => setStep((s) => s - 1)}
                >
                    <ChevronLeft className="h-4 w-4 mr-1" /> ย้อน
                </Button>
                {step < STEPS.length - 1 ? (
                    <Button type="button" size="sm" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
                        ถัดไป <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                ) : (
                    <Button type="button" size="sm" disabled={busy || !file || Boolean(animErr)} onClick={handleSubmit}>
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" /> อัปโหลด</>}
                    </Button>
                )}
            </div>
        </div>
    );
}
