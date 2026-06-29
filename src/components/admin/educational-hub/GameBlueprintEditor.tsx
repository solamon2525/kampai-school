import { useCallback, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, MousePointer2, Play, Square, Star, Trash2, User, HelpCircle, BookOpen, Upload, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    BLUEPRINT_QUESTION_CSV_TEMPLATE,
    bankEntryToQuestionFields,
    getQuestionBankForGame,
    mergeQuestionBanks,
    parseBlueprintQuestionsCsv,
    type BlueprintQuestionBankEntry,
} from '@/lib/blueprint-question-banks';
import {
    BLUEPRINT_WORLD_H,
    BLUEPRINT_WORLD_W,
    BLUEPRINT_PLAT_H,
    createDefaultPlatformerBlueprint,
    newBlueprintId,
    parsePlatformerBlueprint,
    questionForPlatform,
    upsertQuestionForPlatform,
    validatePlatformerBlueprint,
    type PlatformerBlueprintV1,
    type PlatformerCollectible,
    type PlatformerPlatform,
} from '@/lib/game-blueprint';
import { gameBlueprintsService } from '@/services/educational-hub.service';
import { BlueprintQuestionPanel } from './BlueprintQuestionPanel';
import { GameBlueprintPreview } from './GameBlueprintPreview';
import { BlueprintQuestionBankDialog } from './BlueprintQuestionBankDialog';
import { useToast } from '@/hooks/use-toast';

type Tool = 'select' | 'platform' | 'spawn' | 'star' | 'question' | 'delete';

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

const SNAP = 20;

function snap(n: number) {
    return Math.round(n / SNAP) * SNAP;
}

function hitPlatform(p: PlatformerPlatform, x: number, y: number) {
    return x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h;
}

export function GameBlueprintEditor({
    itemId,
    itemTitle,
    blueprintId: initialBlueprintId,
    initialBlueprint,
    previewEngineUrl = '/games/engine/platformer-2d/index.html',
    gameSlug,
    onSaved,
    onCancel,
}: Props) {
    const { toast } = useToast();
    const csvInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const [blueprintId, setBlueprintId] = useState(initialBlueprintId ?? null);
    const [bp, setBp] = useState<PlatformerBlueprintV1>(() =>
        parsePlatformerBlueprint(initialBlueprint) ?? createDefaultPlatformerBlueprint(),
    );
    const [tool, setTool] = useState<Tool>('platform');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [drag, setDrag] = useState<
        | { kind: 'create'; x0: number; y0: number; x1: number; y1: number }
        | { kind: 'move'; id: string; kindTarget: 'platform' | 'star'; ox: number; oy: number; x0: number; y0: number }
        | null
    >(null);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [bankOpen, setBankOpen] = useState(false);
    const [importedBank, setImportedBank] = useState<BlueprintQuestionBankEntry[]>([]);

    const questionBank = useMemo(
        () => mergeQuestionBanks(getQuestionBankForGame(gameSlug), importedBank),
        [gameSlug, importedBank],
    );

    const selectedPlatform = useMemo(
        () => bp.platforms.find((p) => p.id === selectedId) ?? null,
        [bp.platforms, selectedId],
    );
    const selectedQuestion = selectedPlatform
        ? questionForPlatform(bp, selectedPlatform.id)
        : undefined;

    const toWorld = useCallback((clientX: number, clientY: number) => {
        const el = canvasRef.current;
        if (!el) return { x: 0, y: 0 };
        const rect = el.getBoundingClientRect();
        const scale = rect.width / BLUEPRINT_WORLD_W;
        return {
            x: Math.max(0, Math.min(BLUEPRINT_WORLD_W, (clientX - rect.left) / scale)),
            y: Math.max(0, Math.min(BLUEPRINT_WORLD_H, (clientY - rect.top) / scale)),
        };
    }, []);

    const previewRect = useMemo(() => {
        if (!drag || drag.kind !== 'create') return null;
        const x = Math.min(drag.x0, drag.x1);
        const y = Math.min(drag.y0, drag.y1);
        const w = Math.abs(drag.x1 - drag.x0);
        const h = Math.abs(drag.y1 - drag.y0);
        return { x, y, w, h };
    }, [drag]);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (e.button !== 0) return;
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        const { x, y } = toWorld(e.clientX, e.clientY);

        if (tool === 'spawn') {
            setBp((prev) => ({ ...prev, spawn: { x: snap(x), y: snap(y) } }));
            setSelectedId('spawn');
            return;
        }

        if (tool === 'star') {
            const id = newBlueprintId('star');
            const c: PlatformerCollectible = { id, x: snap(x), y: snap(y), kind: 'star' };
            setBp((prev) => ({ ...prev, collectibles: [...prev.collectibles, c] }));
            setSelectedId(id);
            return;
        }

        if (tool === 'delete') {
            for (const p of [...bp.platforms].reverse()) {
                if (p.id === 'ground') continue;
                if (hitPlatform(p, x, y)) {
                    setBp((prev) => ({
                        ...prev,
                        platforms: prev.platforms.filter((pl) => pl.id !== p.id),
                        collectibles: prev.collectibles.filter((c) => {
                            const onPlat = c.x >= p.x && c.x <= p.x + p.w && c.y >= p.y - 40 && c.y <= p.y;
                            return !onPlat;
                        }),
                        questions: prev.questions.filter((q) => q.platformId !== p.id),
                    }));
                    setSelectedId(null);
                    return;
                }
            }
            const star = bp.collectibles.find((c) => Math.hypot(c.x - x, c.y - y) < 24);
            if (star) {
                setBp((prev) => ({
                    ...prev,
                    collectibles: prev.collectibles.filter((c) => c.id !== star.id),
                }));
            }
            return;
        }

        if (tool === 'platform') {
            setDrag({ kind: 'create', x0: x, y0: y, x1: x, y1: y });
            return;
        }

        if (tool === 'question') {
            for (const p of [...bp.platforms].reverse()) {
                if (p.id === 'ground') continue;
                if (hitPlatform(p, x, y)) {
                    setSelectedId(p.id);
                    setBp((prev) =>
                        questionForPlatform(prev, p.id)
                            ? prev
                            : upsertQuestionForPlatform(prev, p.id, {
                                  prompt: 'ป _',
                                  options: ['ู', 'า', 'ิ'],
                                  answer: 'ู',
                              }),
                    );
                    return;
                }
            }
            return;
        }

        // select — platform first
        for (const p of [...bp.platforms].reverse()) {
            if (hitPlatform(p, x, y)) {
                setSelectedId(p.id);
                setDrag({ kind: 'move', id: p.id, kindTarget: 'platform', ox: p.x, oy: p.y, x0: x, y0: y });
                return;
            }
        }
        const star = bp.collectibles.find((c) => Math.hypot(c.x - x, c.y - y) < 24);
        if (star) {
            setSelectedId(star.id);
            setDrag({ kind: 'move', id: star.id, kindTarget: 'star', ox: star.x, oy: star.y, x0: x, y0: y });
            return;
        }
        if (Math.hypot(bp.spawn.x - x, bp.spawn.y - y) < 28) {
            setSelectedId('spawn');
            setDrag({ kind: 'move', id: 'spawn', kindTarget: 'star', ox: bp.spawn.x, oy: bp.spawn.y, x0: x, y0: y });
            return;
        }
        setSelectedId(null);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        const { x, y } = toWorld(e.clientX, e.clientY);
        if (!drag) return;

        if (drag.kind === 'create') {
            setDrag({ ...drag, x1: x, y1: y });
            return;
        }

        const dx = x - drag.x0;
        const dy = y - drag.y0;
        const nx = snap(drag.ox + dx);
        const ny = snap(drag.oy + dy);

        if (drag.id === 'spawn') {
            setBp((prev) => ({ ...prev, spawn: { x: nx, y: ny } }));
            return;
        }

        if (drag.kindTarget === 'platform') {
            setBp((prev) => ({
                ...prev,
                platforms: prev.platforms.map((p) =>
                    p.id === drag.id ? { ...p, x: nx, y: ny } : p,
                ),
            }));
        } else {
            setBp((prev) => ({
                ...prev,
                collectibles: prev.collectibles.map((c) =>
                    c.id === drag.id ? { ...c, x: nx, y: ny } : c,
                ),
            }));
        }
    };

    const handlePointerUp = () => {
        if (drag?.kind === 'create') {
            const x = snap(Math.min(drag.x0, drag.x1));
            const y = snap(Math.min(drag.y0, drag.y1));
            let w = snap(Math.abs(drag.x1 - drag.x0));
            let h = snap(Math.abs(drag.y1 - drag.y0));
            if (w < 40) w = 120;
            if (h < 8) h = BLUEPRINT_PLAT_H;
            if (w >= 40 && h >= 8) {
                const id = newBlueprintId('plat');
                setBp((prev) => ({
                    ...prev,
                    platforms: [...prev.platforms, { id, x, y, w, h }],
                }));
                setSelectedId(id);
            }
        }
        setDrag(null);
    };

    const openQuestionBank = useCallback(() => {
        if (!selectedPlatform || selectedPlatform.id === 'ground') {
            toast({
                title: 'เลือก platform ก่อน',
                description: 'คลิก platform บน canvas (ไม่ใช่พื้นดิน) แล้วเปิดคลังโจทย์',
                variant: 'destructive',
            });
            return;
        }
        setBankOpen(true);
    }, [selectedPlatform, toast]);

    const applyBankEntry = useCallback(
        (entry: BlueprintQuestionBankEntry) => {
            if (!selectedPlatform || selectedPlatform.id === 'ground') return;
            setBp((prev) =>
                upsertQuestionForPlatform(
                    prev,
                    selectedPlatform.id,
                    bankEntryToQuestionFields(entry),
                ),
            );
            setSelectedId(selectedPlatform.id);
        },
        [selectedPlatform],
    );

    const handleCsvImport = useCallback(
        async (file: File) => {
            const text = await file.text();
            const { entries, errors } = parseBlueprintQuestionsCsv(text);
            if (!entries.length) {
                toast({
                    title: 'นำเข้า CSV ไม่สำเร็จ',
                    description: errors[0] ?? 'ไม่พบโจทย์ที่ใช้ได้',
                    variant: 'destructive',
                });
                return;
            }
            setImportedBank((prev) => mergeQuestionBanks(prev, entries));
            toast({
                title: `นำเข้า ${entries.length} ข้อ`,
                description: errors.length
                    ? `ข้าม ${errors.length} แถว (ดู console)`
                    : 'เพิ่มในคลังโจทย์แล้ว — เลือก platform แล้วกด "เลือกจากคลัง"',
            });
            if (errors.length) console.warn('[blueprint CSV]', errors);
        },
        [toast],
    );

    const downloadCsvTemplate = useCallback(() => {
        const blob = new Blob([BLUEPRINT_QUESTION_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'blueprint-questions-template.csv';
        a.click();
        URL.revokeObjectURL(url);
    }, []);

    const handleSave = async () => {
        const validation = validatePlatformerBlueprint(bp);
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

    const tools: { key: Tool; label: string; icon: typeof Square }[] = [
        { key: 'select', label: 'เลือก', icon: MousePointer2 },
        { key: 'platform', label: 'Platform', icon: Square },
        { key: 'spawn', label: 'Spawn', icon: User },
        { key: 'star', label: 'ดาว', icon: Star },
        { key: 'question', label: 'คำถาม', icon: HelpCircle },
        { key: 'delete', label: 'ลบ', icon: Trash2 },
    ];

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                {tools.map((t) => (
                    <Button
                        key={t.key}
                        type="button"
                        size="sm"
                        variant={tool === t.key ? 'default' : 'outline'}
                        onClick={() => setTool(t.key)}
                    >
                        <t.icon className="h-3.5 w-3.5 mr-1" />
                        {t.label}
                    </Button>
                ))}
                <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="ml-1"
                    onClick={() => setPreviewOpen(true)}
                >
                    <Play className="h-3.5 w-3.5 mr-1" />
                    ทดสอบ
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={openQuestionBank}>
                    <BookOpen className="h-3.5 w-3.5 mr-1" />
                    คลัง ({questionBank.length})
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => csvInputRef.current?.click()}
                >
                    <Upload className="h-3.5 w-3.5 mr-1" />
                    CSV
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={downloadCsvTemplate} title="ดาวน์โหลด template CSV">
                    <Download className="h-3.5 w-3.5" />
                </Button>
                <input
                    ref={csvInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void handleCsvImport(f);
                        e.target.value = '';
                    }}
                />
                <div className="ml-auto flex items-center gap-2">
                    <label className="text-xs text-muted-foreground whitespace-nowrap">เวลา (วิ)</label>
                    <Input
                        className="h-8 w-16"
                        type="number"
                        min={30}
                        max={600}
                        value={bp.rules.timeLimitSec}
                        onChange={(e) =>
                            setBp((prev) => ({
                                ...prev,
                                rules: { ...prev.rules, timeLimitSec: Number(e.target.value) || 90 },
                            }))
                        }
                    />
                </div>
            </div>

            <div
                ref={canvasRef}
                className="relative w-full aspect-video rounded-lg border border-border bg-muted/30 overflow-hidden touch-none select-none cursor-crosshair"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'linear-gradient(180deg, hsl(var(--primary) / 0.15) 0%, hsl(var(--muted)) 100%)',
                    }}
                />
                {Array.from({ length: Math.floor(BLUEPRINT_WORLD_W / SNAP) }).map((_, i) => (
                    <div
                        key={`v${i}`}
                        className="absolute top-0 bottom-0 w-px bg-border/40"
                        style={{ left: `${(i * SNAP / BLUEPRINT_WORLD_W) * 100}%` }}
                    />
                ))}
                {Array.from({ length: Math.floor(BLUEPRINT_WORLD_H / SNAP) }).map((_, i) => (
                    <div
                        key={`h${i}`}
                        className="absolute left-0 right-0 h-px bg-border/40"
                        style={{ top: `${(i * SNAP / BLUEPRINT_WORLD_H) * 100}%` }}
                    />
                ))}

                {bp.platforms.map((p) => {
                    const hasQ = !!questionForPlatform(bp, p.id);
                    return (
                    <div
                        key={p.id}
                        className={cn(
                            'absolute rounded-sm border-2',
                            selectedId === p.id
                                ? 'border-primary bg-primary/30'
                                : 'border-border bg-card/80',
                            p.id === 'ground' && 'bg-muted-foreground/30',
                            hasQ && 'ring-2 ring-amber-400/70',
                        )}
                        style={{
                            left: `${(p.x / BLUEPRINT_WORLD_W) * 100}%`,
                            top: `${(p.y / BLUEPRINT_WORLD_H) * 100}%`,
                            width: `${(p.w / BLUEPRINT_WORLD_W) * 100}%`,
                            height: `${(p.h / BLUEPRINT_WORLD_H) * 100}%`,
                        }}
                        title={hasQ ? `${p.id} (มีคำถาม)` : p.id}
                    >
                        {hasQ && (
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs pointer-events-none">
                                ❓
                            </span>
                        )}
                    </div>
                    );
                })}

                {previewRect && (
                    <div
                        className="absolute border-2 border-dashed border-primary bg-primary/20 pointer-events-none"
                        style={{
                            left: `${(previewRect.x / BLUEPRINT_WORLD_W) * 100}%`,
                            top: `${(previewRect.y / BLUEPRINT_WORLD_H) * 100}%`,
                            width: `${(previewRect.w / BLUEPRINT_WORLD_W) * 100}%`,
                            height: `${(previewRect.h / BLUEPRINT_WORLD_H) * 100}%`,
                        }}
                    />
                )}

                {bp.collectibles.map((c) => (
                    <div
                        key={c.id}
                        className={cn(
                            'absolute -translate-x-1/2 -translate-y-1/2 text-xl',
                            selectedId === c.id && 'ring-2 ring-primary rounded-full',
                        )}
                        style={{
                            left: `${(c.x / BLUEPRINT_WORLD_W) * 100}%`,
                            top: `${(c.y / BLUEPRINT_WORLD_H) * 100}%`,
                        }}
                    >
                        ⭐
                    </div>
                ))}

                <div
                    className={cn(
                        'absolute -translate-x-1/2 -translate-y-full text-lg',
                        selectedId === 'spawn' && 'ring-2 ring-primary rounded-full',
                    )}
                    style={{
                        left: `${(bp.spawn.x / BLUEPRINT_WORLD_W) * 100}%`,
                        top: `${(bp.spawn.y / BLUEPRINT_WORLD_H) * 100}%`,
                    }}
                    title="จุดเกิดผู้เล่น"
                >
                    🧍
                </div>
            </div>

            <p className="text-xs text-muted-foreground">
                ลาก platform · spawn/ดาว/คำถาม · คลังโจทย์ {questionBank.length} ข้อ
                {importedBank.length > 0 ? ` (นำเข้า ${importedBank.length})` : ''}
                · grid {SNAP}px
                {blueprintId ? ` · blueprint ${blueprintId.slice(0, 8)}…` : ' · ยังไม่บันทึก'}
            </p>

            {selectedPlatform && selectedPlatform.id !== 'ground' && (
                <BlueprintQuestionPanel
                    platformId={selectedPlatform.id}
                    platformLabel={selectedPlatform.id}
                    question={selectedQuestion}
                    blueprint={bp}
                    onChange={setBp}
                    onOpenBank={openQuestionBank}
                />
            )}

            {err && <p className="text-sm text-destructive">{err}</p>}

            <GameBlueprintPreview
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                engineUrl={previewEngineUrl}
                blueprint={bp}
            />

            <BlueprintQuestionBankDialog
                open={bankOpen}
                onClose={() => setBankOpen(false)}
                bank={questionBank}
                platformLabel={
                    selectedPlatform && selectedPlatform.id !== 'ground'
                        ? selectedPlatform.id
                        : null
                }
                onSelect={applyBankEntry}
            />

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
                    ยกเลิก
                </Button>
                <Button type="button" onClick={handleSave} disabled={busy}>
                    {busy && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    บันทึกด่าน
                </Button>
            </div>
        </div>
    );
}
