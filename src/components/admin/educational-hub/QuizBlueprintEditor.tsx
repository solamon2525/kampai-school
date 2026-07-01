/**
 * QuizBlueprintEditor — editor สำหรับ Quiz Engine (บลูพริ้นท์เกมตอบคำถาม)
 *
 * ฟังก์ชัน: จัดการโจทย์ (เพิ่ม/แก้/ลบ/จัดลำดับ) + ตั้งกติกา (เวลา/คะแนน) + ธีม (พื้นหลัง/สี)
 *           + ทดสอบเล่น (preview) + บันทึกผ่าน gameBlueprintsService
 *
 * Props เดียวกับ GameBlueprintEditor เพื่อใช้แทนกันได้ใน router
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ArrowDown,
    ArrowUp,
    ChevronDown,
    ChevronUp,
    Loader2,
    Plus,
    Play,
    Trash2,
    Upload,
    HelpCircle,
    Palette,
} from 'lucide-react';
import {
    bankEntryToQuestionFields,
    getQuestionBankForGame,
    mergeQuestionBanks,
    parseBlueprintQuestionsCsv,
    type BlueprintQuestionBankEntry,
} from '@/lib/blueprint-question-banks';
import {
    createDefaultQuizBlueprint,
    newBlueprintId,
    parseQuizBlueprint,
    validateQuizBlueprint,
    type QuizBgPreset,
    type QuizBlueprintV1,
    type QuizQuestion,
} from '@/lib/game-blueprint';
import { gameBlueprintsService } from '@/services/educational-hub.service';
import { GameBlueprintPreview } from './GameBlueprintPreview';
import { BlueprintQuestionBankDialog } from './BlueprintQuestionBankDialog';
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
    /** ถ้าส่งมา editor จะ report blueprint ทุกครั้งที่มีการแก้ไข (สำหรับ wizard sync) */
    onBlueprintChange?: (bp: QuizBlueprintV1) => void;
    onSaved: () => void;
    onCancel: () => void;
};

export function QuizBlueprintEditor({
    itemId,
    itemTitle,
    blueprintId: initialBlueprintId,
    initialBlueprint,
    previewEngineUrl = '/games/engine/quiz/index.html',
    gameSlug,
    onBlueprintChange,
    onSaved,
    onCancel,
}: Props) {
    const { toast } = useToast();
    const csvInputRef = useRef<HTMLInputElement>(null);
    const [blueprintId, setBlueprintId] = useState(initialBlueprintId ?? null);
    const [bp, setBp] = useState<QuizBlueprintV1>(
        () => parseQuizBlueprint(initialBlueprint) ?? createDefaultQuizBlueprint({ title: itemTitle }),
    );
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [bankOpen, setBankOpen] = useState(false);
    const [importedBank, setImportedBank] = useState<BlueprintQuestionBankEntry[]>([]);
    const [expanded, setExpanded] = useState<Set<string>>(new Set([bp.questions[0]?.id ?? '']));

    // report blueprint ทุกครั้งที่เปลี่ยน → wizard ใช้สำหรับ publish (sync ทันที)
    useEffect(() => {
        onBlueprintChange?.(bp);
    }, [bp, onBlueprintChange]);

    const questionBank = useMemo(
        () => mergeQuestionBanks(getQuestionBankForGame(gameSlug), importedBank),
        [gameSlug, importedBank],
    );

    // ─── mutations ────────────────────────────────────────────────────
    const patchBp = (patch: Partial<QuizBlueprintV1>) => setBp((p) => ({ ...p, ...patch }));
    const patchRules = (patch: Partial<QuizBlueprintV1['rules']>) =>
        setBp((p) => ({ ...p, rules: { ...p.rules, ...patch } }));
    const patchTheme = (patch: Partial<QuizBlueprintV1['theme']>) =>
        setBp((p) => ({ ...p, theme: { ...p.theme, ...patch } }));
    const patchMeta = (patch: Partial<QuizBlueprintV1['meta']>) =>
        setBp((p) => ({ ...p, meta: { ...p.meta, ...patch } }));

    const addQuestion = () => {
        const q: QuizQuestion = {
            id: newBlueprintId('qq'),
            prompt: 'คำถามใหม่',
            options: ['ตัวเลือก 1', 'ตัวเลือก 2'],
            answer: 'ตัวเลือก 1',
        };
        setBp((p) => ({ ...p, questions: [...p.questions, q] }));
        setExpanded((s) => new Set([...s, q.id]));
    };

    const updateQuestion = (id: string, patch: Partial<Omit<QuizQuestion, 'id'>>) =>
        setBp((p) => ({
            ...p,
            questions: p.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)),
        }));

    const removeQuestion = (id: string) =>
        setBp((p) => ({ ...p, questions: p.questions.filter((q) => q.id !== id) }));

    const moveQuestion = (index: number, dir: -1 | 1) =>
        setBp((p) => {
            const arr = [...p.questions];
            const j = index + dir;
            if (j < 0 || j >= arr.length) return p;
            [arr[index], arr[j]] = [arr[j], arr[index]];
            return { ...p, questions: arr };
        });

    const toggleExpand = (id: string) =>
        setExpanded((s) => {
            const next = new Set(s);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const importFromBank = (entry: BlueprintQuestionBankEntry) => {
        const f = bankEntryToQuestionFields(entry);
        const q: QuizQuestion = {
            id: newBlueprintId('qq'),
            prompt: f.prompt,
            options: f.options,
            answer: f.answer,
            hint: entry.word,
        };
        setBp((p) => ({ ...p, questions: [...p.questions, q] }));
        toast({ title: 'เพิ่มโจทย์แล้ว', description: q.prompt });
    };

    const handleCsv = (file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            const res = parseBlueprintQuestionsCsv(String(reader.result ?? ''));
            if (res.errors.length) {
                toast({
                    title: 'นำเข้าบางส่วน',
                    description: res.errors.slice(0, 3).join(' · '),
                    variant: 'destructive',
                });
            }
            if (res.entries.length) {
                setImportedBank((prev) => mergeQuestionBanks(prev, res.entries));
                const newQs: QuizQuestion[] = res.entries.map((e) => ({
                    id: newBlueprintId('qq'),
                    prompt: e.prompt,
                    options: e.options,
                    answer: e.answer,
                    hint: e.word,
                }));
                setBp((p) => ({ ...p, questions: [...p.questions, ...newQs] }));
                toast({ title: `นำเข้า ${res.entries.length} ข้อ` });
            }
        };
        reader.readAsText(file);
    };

    // ─── save ─────────────────────────────────────────────────────────
    const handleSave = async () => {
        const validation = validateQuizBlueprint(bp);
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

    const validation = validateQuizBlueprint(bp);

    return (
        <div className="space-y-4">
            {/* ─── Meta + Rules + Theme (collapsible sections) ─── */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="q-title">ชื่อแบบทดสอบ</Label>
                        <Input
                            id="q-title"
                            value={bp.meta.title}
                            onChange={(e) => patchMeta({ title: e.target.value })}
                            placeholder="เช่น ทบทวนสระเสียง"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="q-subject">วิชา</Label>
                        <Select value={bp.meta.subject} onValueChange={(v) => patchMeta({ subject: v })}>
                            <SelectTrigger id="q-subject">
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
                        <Label htmlFor="q-grade">ระดับชั้น (ไม่บังคับ)</Label>
                        <Input
                            id="q-grade"
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
                            <Label htmlFor="q-time">เวลา/ข้อ (วินาที, 0=ไม่จับ)</Label>
                            <Input
                                id="q-time"
                                type="number"
                                min={0}
                                max={300}
                                value={bp.rules.timeLimitSec}
                                onChange={(e) =>
                                    patchRules({ timeLimitSec: Number(e.target.value) || 0 })
                                }
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="q-pts">คะแนน/ข้อ</Label>
                            <Input
                                id="q-pts"
                                type="number"
                                min={1}
                                value={bp.rules.pointsPerCorrect}
                                onChange={(e) =>
                                    patchRules({ pointsPerCorrect: Number(e.target.value) || 1 })
                                }
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="q-pass">คะแนนผ่าน</Label>
                            <Input
                                id="q-pass"
                                type="number"
                                min={0}
                                value={bp.rules.passingScore}
                                onChange={(e) =>
                                    patchRules({ passingScore: Number(e.target.value) || 0 })
                                }
                            />
                        </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                        <Switch
                            id="q-shuffle"
                            checked={bp.rules.shuffleOptions}
                            onCheckedChange={(v) => patchRules({ shuffleOptions: v })}
                        />
                        <Label htmlFor="q-shuffle" className="cursor-pointer">
                            สลับลำดับตัวเลือกทุกครั้งที่เล่น
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

            {/* ─── Questions ─── */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold">
                        📝 โจทย์ ({bp.questions.length} ข้อ)
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setBankOpen(true)}
                        >
                            <HelpCircle className="mr-1 h-4 w-4" /> จากคลังโจทย์
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => csvInputRef.current?.click()}
                        >
                            <Upload className="mr-1 h-4 w-4" /> นำเข้า CSV
                        </Button>
                        <input
                            ref={csvInputRef}
                            type="file"
                            accept=".csv,text/csv"
                            className="hidden"
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleCsv(f);
                                e.target.value = '';
                            }}
                        />
                        <Button type="button" size="sm" onClick={addQuestion}>
                            <Plus className="mr-1 h-4 w-4" /> เพิ่มโจทย์
                        </Button>
                    </div>
                </div>

                {bp.questions.length === 0 && (
                    <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                        ยังไม่มีโจทย์ — กด "เพิ่มโจทย์" หรือนำเข้าจากคลัง/CSV
                    </div>
                )}

                {bp.questions.map((q, i) => {
                    const isOpen = expanded.has(q.id);
                    return (
                        <div key={q.id} className="rounded-md border border-border">
                            <div className="flex items-center gap-2 p-2">
                                <button
                                    type="button"
                                    className="text-muted-foreground hover:text-foreground"
                                    onClick={() => toggleExpand(q.id)}
                                >
                                    {isOpen ? (
                                        <ChevronUp className="h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4" />
                                    )}
                                </button>
                                <span className="w-6 text-center text-sm font-semibold text-muted-foreground">
                                    {i + 1}
                                </span>
                                <span className="flex-1 truncate text-sm">
                                    {q.prompt || <span className="text-muted-foreground">(ไม่มีโจทย์)</span>}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    เฉลย: {q.answer || '—'}
                                </span>
                                <div className="flex items-center">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        disabled={i === 0}
                                        onClick={() => moveQuestion(i, -1)}
                                    >
                                        <ArrowUp className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        disabled={i === bp.questions.length - 1}
                                        onClick={() => moveQuestion(i, 1)}
                                    >
                                        <ArrowDown className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive"
                                        onClick={() => removeQuestion(q.id)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>

                            {isOpen && (
                                <div className="space-y-3 border-t border-border p-3">
                                    <div className="space-y-1.5">
                                        <Label>โจทย์</Label>
                                        <Input
                                            value={q.prompt}
                                            onChange={(e) =>
                                                updateQuestion(q.id, { prompt: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>ตัวเลือก (คลิกเพื่อตั้งเป็นเฉลย)</Label>
                                        <div className="space-y-2">
                                            {q.options.map((opt, oi) => (
                                                <div key={oi} className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        className={cn(
                                                            'flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 text-xs',
                                                            opt === q.answer
                                                                ? 'border-green-500 bg-green-500 text-white'
                                                                : 'border-border',
                                                        )}
                                                        title="ตั้งเป็นเฉลย"
                                                        onClick={() =>
                                                            updateQuestion(q.id, { answer: opt })
                                                        }
                                                    >
                                                        ✓
                                                    </button>
                                                    <Input
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const next = [...q.options];
                                                            next[oi] = e.target.value;
                                                            const patch: Partial<QuizQuestion> = {
                                                                options: next,
                                                            };
                                                            // ถ้าแก้คำตอบที่เป็นเฉลยอยู่ ให้เฉลยตามไปด้วย
                                                            if (q.answer === opt)
                                                                patch.answer = e.target.value;
                                                            updateQuestion(q.id, patch);
                                                        }}
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive"
                                                        disabled={q.options.length <= 2}
                                                        onClick={() => {
                                                            const next = q.options.filter(
                                                                (_, k) => k !== oi,
                                                            );
                                                            const patch: Partial<QuizQuestion> = {
                                                                options: next,
                                                            };
                                                            if (q.answer === opt)
                                                                patch.answer = next[0] ?? '';
                                                            updateQuestion(q.id, patch);
                                                        }}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={q.options.length >= 6}
                                            onClick={() =>
                                                updateQuestion(q.id, {
                                                    options: [...q.options, 'ตัวเลือกใหม่'],
                                                })
                                            }
                                        >
                                            <Plus className="mr-1 h-3.5 w-3.5" /> เพิ่มตัวเลือก
                                        </Button>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>คำใบ้ (แสดงหลังตอบ ไม่บังคับ)</Label>
                                        <Input
                                            value={q.hint ?? ''}
                                            onChange={(e) =>
                                                updateQuestion(q.id, {
                                                    hint: e.target.value || undefined,
                                                })
                                            }
                                            placeholder="เช่น ป + ู"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ─── Error / actions ─── */}
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
                        {busy ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : (
                            <Upload className="mr-1 h-4 w-4" />
                        )}
                        บันทึก
                    </Button>
                </div>
            </div>

            {/* ─── Preview + bank dialog ─── */}
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
                onSelect={importFromBank}
            />
        </div>
    );
}
