/**
 * MatchingBlueprintEditor — editor สำหรับ Matching Engine (บลูพริ้นท์เกมจับคู่คำ)
 *
 * จัดการคู่คำ (เพิ่ม/แก้/ลบ/จัดลำดับ) + กติกา (เวลา/คะแนน/จำนวนผิด) + ธีม
 * + ทดสอบเล่น (preview) + บันทึกผ่าน gameBlueprintsService
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    ArrowDown,
    ArrowUp,
    ChevronDown,
    ChevronUp,
    Loader2,
    Plus,
    Play,
    Trash2,
    Palette,
} from 'lucide-react';
import {
    createDefaultMatchingBlueprint,
    newBlueprintId,
    parseMatchingBlueprint,
    validateMatchingBlueprint,
    type MatchingBlueprintV1,
    type MatchingPair,
    type QuizBgPreset,
} from '@/lib/game-blueprint';
import { gameBlueprintsService } from '@/services/educational-hub.service';
import { GameBlueprintPreview } from './GameBlueprintPreview';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const BG_PRESETS: { value: QuizBgPreset; label: string; swatch: string }[] = [
    { value: 'aurora', label: 'ออโรร่า', swatch: 'linear-gradient(135deg,#667eea,#764ba2)' },
    { value: 'sunset', label: 'อาทิตย์ตก', swatch: 'linear-gradient(135deg,#f093fb,#f5576c)' },
    { value: 'ocean', label: 'มหาสมุทร', swatch: 'linear-gradient(135deg,#4facfe,#00f2fe)' },
    { value: 'forest', label: 'ป่าเขา', swatch: 'linear-gradient(135deg,#43e97b,#38f9d7)' },
    { value: 'candy', label: 'ลูกกวาด', swatch: 'linear-gradient(135deg,#fa709a,#fee140)' },
    { value: 'midnight', label: 'เที่ยงคืน', swatch: 'linear-gradient(135deg,#232526,#414345)' },
];

const SUBJECTS: { value: string; label: string }[] = [
    { value: 'thai', label: 'ภาษาไทย' },
    { value: 'math', label: 'คณิตศาสตร์' },
    { value: 'english', label: 'ภาษาอังกฤษ' },
    { value: 'science', label: 'วิทยาศาสตร์' },
    { value: 'social', label: 'สังคมศึกษา' },
    { value: 'art', label: 'ศิลปะ' },
    { value: 'health', label: 'สุขศึกษา' },
    { value: 'career', label: 'การงานอาชีพ' },
    { value: 'tech', label: 'คอมพิวเตอร์' },
];

type Props = {
    itemId: string;
    itemTitle: string;
    blueprintId?: string | null;
    initialBlueprint?: unknown;
    previewEngineUrl?: string;
    gameSlug?: string | null;
    onBlueprintChange?: (bp: MatchingBlueprintV1) => void;
    onSaved: () => void;
    onCancel: () => void;
};

export function MatchingBlueprintEditor({
    itemTitle,
    blueprintId: initialBlueprintId,
    initialBlueprint,
    previewEngineUrl = '/games/engine/matching/index.html',
    onBlueprintChange,
    onSaved,
    onCancel,
}: Props) {
    const { toast } = useToast();
    const [blueprintId, setBlueprintId] = useState(initialBlueprintId ?? null);
    const [bp, setBp] = useState<MatchingBlueprintV1>(
        () => parseMatchingBlueprint(initialBlueprint) ?? createDefaultMatchingBlueprint({ title: itemTitle }),
    );
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);

    useEffect(() => {
        onBlueprintChange?.(bp);
    }, [bp, onBlueprintChange]);

    // ─── mutations ────────────────────────────────────────────────────
    const patchMeta = (patch: Partial<MatchingBlueprintV1['meta']>) =>
        setBp((p) => ({ ...p, meta: { ...p.meta, ...patch } }));
    const patchRules = (patch: Partial<MatchingBlueprintV1['rules']>) =>
        setBp((p) => ({ ...p, rules: { ...p.rules, ...patch } }));
    const patchTheme = (patch: Partial<MatchingBlueprintV1['theme']>) =>
        setBp((p) => ({ ...p, theme: { ...p.theme, ...patch } }));

    const addPair = () =>
        setBp((p) => ({
            ...p,
            pairs: [...p.pairs, { id: newBlueprintId('mp'), left: '', right: '' }],
        }));

    const updatePair = (id: string, patch: Partial<Omit<MatchingPair, 'id'>>) =>
        setBp((p) => ({
            ...p,
            pairs: p.pairs.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        }));

    const removePair = (id: string) =>
        setBp((p) => ({ ...p, pairs: p.pairs.filter((m) => m.id !== id) }));

    const movePair = (index: number, dir: -1 | 1) =>
        setBp((p) => {
            const arr = [...p.pairs];
            const j = index + dir;
            if (j < 0 || j >= arr.length) return p;
            [arr[index], arr[j]] = [arr[j], arr[index]];
            return { ...p, pairs: arr };
        });

    // ─── save ─────────────────────────────────────────────────────────
    const handleSave = async () => {
        const validation = validateMatchingBlueprint(bp);
        if (validation) {
            setErr(validation);
            return;
        }
        setBusy(true);
        setErr(null);
        try {
            const { blueprintId: savedId, error } = await gameBlueprintsService.saveForItem(
                itemId,
                itemTitle,
                bp,
                blueprintId,
            );
            if (error) throw error;
            if (savedId) setBlueprintId(savedId);
            onSaved();
        } catch (e) {
            setErr(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
        } finally {
            setBusy(false);
        }
    };

    const validation = validateMatchingBlueprint(bp);

    return (
        <div className="space-y-4">
            {/* Meta + Rules + Theme */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="m-title">ชื่อเกมจับคู่</Label>
                        <Input
                            id="m-title"
                            value={bp.meta.title}
                            onChange={(e) => patchMeta({ title: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="m-subject">วิชา</Label>
                        <Select value={bp.meta.subject} onValueChange={(v) => patchMeta({ subject: v })}>
                            <SelectTrigger id="m-subject">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {SUBJECTS.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="m-grade">ระดับชั้น (ไม่บังคับ)</Label>
                        <Input
                            id="m-grade"
                            value={bp.meta.grade ?? ''}
                            onChange={(e) => patchMeta({ grade: e.target.value || undefined })}
                            placeholder="เช่น ป.1"
                        />
                    </div>
                </div>

                {/* Rules */}
                <div className="border-t border-border pt-3">
                    <div className="mb-2 text-sm font-semibold">⚙️ กติกา</div>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="m-time">เวลารวม (วินาที, 0=ไม่จับ)</Label>
                            <Input
                                id="m-time"
                                type="number"
                                min={0}
                                max={600}
                                value={bp.rules.timeLimitSec}
                                onChange={(e) =>
                                    patchRules({ timeLimitSec: Number(e.target.value) || 0 })
                                }
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="m-pts">คะแนน/คู่</Label>
                            <Input
                                id="m-pts"
                                type="number"
                                min={1}
                                value={bp.rules.pointsPerCorrect}
                                onChange={(e) =>
                                    patchRules({ pointsPerCorrect: Number(e.target.value) || 1 })
                                }
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="m-mistakes">จำนวนผิดสูงสุด (0=ไม่จำกัด)</Label>
                            <Input
                                id="m-mistakes"
                                type="number"
                                min={0}
                                value={bp.rules.mistakesAllowed}
                                onChange={(e) =>
                                    patchRules({ mistakesAllowed: Number(e.target.value) || 0 })
                                }
                            />
                        </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                        <Switch
                            id="m-shuffle"
                            checked={bp.rules.shuffleRight}
                            onCheckedChange={(v) => patchRules({ shuffleRight: v })}
                        />
                        <Label htmlFor="m-shuffle" className="cursor-pointer">
                            สลับตำแหน่งฝั่งขวาทุกครั้งที่เล่น
                        </Label>
                    </div>
                </div>

                {/* Theme */}
                <div className="border-t border-border pt-3">
                    <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                        <Palette className="h-4 w-4" /> ธีมพื้นหลัง
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {BG_PRESETS.map((p) => (
                            <button
                                key={p.value}
                                type="button"
                                onClick={() => patchTheme({ bgPreset: p.value })}
                                className={cn(
                                    'flex items-center gap-2 rounded-lg border-2 px-3 py-1.5 text-sm transition',
                                    bp.theme.bgPreset === p.value
                                        ? 'border-primary ring-2 ring-primary/30'
                                        : 'border-border hover:border-muted-foreground',
                                )}
                            >
                                <span
                                    className="h-5 w-5 rounded-full border border-black/10"
                                    style={{ background: p.swatch }}
                                />
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Pairs */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold">🔗 คู่คำ ({bp.pairs.length} คู่)</div>
                    <Button type="button" size="sm" onClick={addPair}>
                        <Plus className="mr-1 h-4 w-4" /> เพิ่มคู่
                    </Button>
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2 px-1 text-xs font-medium text-muted-foreground">
                    <span>ฝั่งซ้าย (เช่น คำที่เรียน)</span>
                    <span className="w-6 text-center">↔</span>
                    <span>ฝั่งขวา (เช่น คำคู่)</span>
                    <span className="w-16 text-center">จัดการ</span>
                </div>
                <div className="space-y-2">
                    {bp.pairs.map((pair, i) => (
                        <div
                            key={pair.id}
                            className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2"
                        >
                            <Input
                                value={pair.left}
                                onChange={(e) => updatePair(pair.id, { left: e.target.value })}
                                placeholder="ฝั่งซ้าย"
                            />
                            <span className="text-center text-muted-foreground">↔</span>
                            <Input
                                value={pair.right}
                                onChange={(e) => updatePair(pair.id, { right: e.target.value })}
                                placeholder="ฝั่งขวา"
                            />
                            <div className="flex w-16 justify-end">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={i === 0}
                                    onClick={() => movePair(i, -1)}
                                >
                                    <ArrowUp className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={i === bp.pairs.length - 1}
                                    onClick={() => movePair(i, 1)}
                                >
                                    <ArrowDown className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => removePair(pair.id)}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Error / actions */}
            {(err || validation) && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    {err || validation}
                </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPreviewOpen(true)}
                    disabled={!!validation}
                >
                    <Play className="mr-1 h-4 w-4" /> ทดสอบเล่น
                </Button>
                <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
                        ยกเลิก
                    </Button>
                    <Button type="button" onClick={handleSave} disabled={busy}>
                        {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                        บันทึก
                    </Button>
                </div>
            </div>

            <GameBlueprintPreview
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                engineUrl={previewEngineUrl}
                blueprint={bp}
            />
        </div>
    );
}
