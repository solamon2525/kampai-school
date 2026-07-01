/**
 * GameBuilderWizard — เครื่องมือสร้างเกมแบบ no-code ทีละขั้น
 *
 * ขั้นตอน:
 *  1. เลือก engine (จาก ENGINE_REGISTRY)
 *  2. ตั้งชื่อ + วิชา + ระดับชั้น
 *  3. ใส่เนื้อหา (โหลด editor ตาม engine ที่เลือก)
 *  4. ธีม & กติกา (ฝังใน editor แต่ละ engine เรียบร้อย — ขั้นนี้สรุป + ปรับหนัก)
 *  5. ทดสอบ + เผยแพร่
 *
 * เมื่อเผยแพร่: สร้าง educational_hub_items row (item_type='link',
 * external_url ชี้ runtime ของ engine) + บันทึก blueprint_json ไว้ใน row
 * นักเรียนเปิดเล่น → wrapper ส่ง blueprint ผ่าน K.blueprint → runtime แสดงด่าน
 */

import { useMemo, useState } from 'react';
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    ENGINE_REGISTRY,
    type EngineRegistryEntry,
    type SubjectKey,
} from '@/lib/blueprint-engines';
import {
    parseQuizBlueprint,
    validateQuizBlueprint,
    type GameBlueprint,
    type QuizBlueprintV1,
} from '@/lib/game-blueprint';
import { educationalHubService } from '@/services/educational-hub.service';
import { QuizBlueprintEditor } from './QuizBlueprintEditor';
import { useToast } from '@/hooks/use-toast';

const SUBJECTS: { value: SubjectKey; label: string; folder: string }[] = [
    { value: 'thai', label: 'ภาษาไทย', folder: 'thai' },
    { value: 'math', label: 'คณิตศาสตร์', folder: 'math' },
    { value: 'english', label: 'ภาษาอังกฤษ', folder: 'english' },
    { value: 'science', label: 'วิทยาศาสตร์', folder: 'tech' },
    { value: 'social', label: 'สังคมศึกษา', folder: 'social' },
    { value: 'art', label: 'ศิลปะ', folder: 'arts' },
    { value: 'health', label: 'สุขศึกษา', folder: 'health' },
    { value: 'career', label: 'การงานอาชีพ', folder: 'career' },
    { value: 'tech', label: 'คอมพิวเตอร์', folder: 'tech' },
];

const GRADES = ['อ.1', 'อ.2', 'อ.3', 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];

type Step = 1 | 2 | 3 | 4 | 5;

type Props = {
    gamesCategoryId: string;
    onSaved: (newItemId?: string) => void;
    onCancel: () => void;
};

export function GameBuilderWizard({ gamesCategoryId, onSaved, onCancel }: Props) {
    const { toast } = useToast();
    const [step, setStep] = useState<Step>(1);
    const [engine, setEngine] = useState<EngineRegistryEntry | null>(null);
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState<SubjectKey>('thai');
    const [grade, setGrade] = useState<string>('ป.1');
    const [blueprint, setBlueprint] = useState<GameBlueprint | null>(null);
    const [publishing, setPublishing] = useState(false);

    // category id ของหมวดเกม (ส่งมาจาก GamesTab)
    const gamesCatId = gamesCategoryId;

    // ─── Step navigation helpers ──────────────────────────────────────
    const canNextFromStep = (s: Step): boolean => {
        if (s === 1) return !!engine;
        if (s === 2) return title.trim().length > 0;
        if (s === 3) {
            if (!blueprint) return false;
            if (engine?.key === 'quiz') {
                return !validateQuizBlueprint(blueprint as QuizBlueprintV1);
            }
            return true;
        }
        return true;
    };

    const nextStep = () => {
        if (!canNextFromStep(step)) return;
        // เมื่อเข้า step 3 ครั้งแรก → สร้าง default blueprint ของ engine ที่เลือก
        if (step === 2 && !blueprint && engine) {
            const bp = engine.createDefault({ title: title.trim(), subject, grade });
            setBlueprint(bp);
        }
        setStep((s) => Math.min(5, (s + 1) as Step) as Step);
    };
    const prevStep = () => setStep((s) => Math.max(1, (s - 1) as Step) as Step);

    // ─── Publish ──────────────────────────────────────────────────────
    const handlePublish = async () => {
        if (!engine || !blueprint) return;
        setPublishing(true);
        try {
            const subjectLabel = SUBJECTS.find((s) => s.value === subject)?.label ?? subject;

            // 1. สร้าง blueprint row ก่อน (เพื่อเอา id)
            const { data: bpRow, error: bpErr } = await gameBlueprintsService.create(
                `${title.trim()} — ด่าน`,
                blueprint as never,
            );
            if (bpErr || !bpRow) throw bpErr ?? new Error('สร้าง blueprint ไม่สำเร็จ');
            const blueprintId = (bpRow as { id: string }).id;

            // 2. สร้าง educational_hub_items row ชี้ runtime + ผูก blueprint
            const slug = `builder-${engine.key}-${blueprintId.slice(0, 8)}`;
            const { data: inserted, error: insErr } = await educationalHubService.insertItem({
                category_id: gamesCatId,
                item_type: 'link',
                title: title.trim(),
                description: `เกมจาก Builder (${engine.label}) · ${subjectLabel}${grade ? ' · ' + grade : ''}`,
                external_url: engine.runtimeUrl,
                subject: subjectLabel,
                grade_levels: grade ? [grade] : [],
                tags: ['builder', engine.key],
                game_slug: slug,
                tracked_game: true,
                is_published: true,
                game_play_style: engine.key,
                blueprint_id: blueprintId,
                blueprint_json: blueprint as never,
            } as never);
            if (insErr) throw insErr;

            const newItemId = (inserted as { id?: string } | null)?.id;
            toast({
                title: '🎉 เผยแพร่เกมแล้ว',
                description: `"${title}" อยู่ในคลังเกมแล้ว`,
            });
            onSaved(newItemId);
        } catch (err) {
            toast({
                title: 'เผยแพร่ไม่สำเร็จ',
                description: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด',
                variant: 'destructive',
            });
        } finally {
            setPublishing(false);
        }
    };

    // ─── Render ───────────────────────────────────────────────────────
    const steps = [
        { n: 1 as Step, label: 'เลือกแนวเกม' },
        { n: 2 as Step, label: 'ข้อมูลเกม' },
        { n: 3 as Step, label: 'เนื้อหา' },
        { n: 4 as Step, label: 'ธีม & กติกา' },
        { n: 5 as Step, label: 'ทดสอบ & เผยแพร่' },
    ];

    return (
        <div className="space-y-4">
            {/* Stepper */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {steps.map((s, i) => (
                    <div key={s.n} className="flex items-center gap-1 flex-none">
                        <div
                            className={cn(
                                'flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition',
                                step === s.n
                                    ? 'bg-primary text-primary-foreground'
                                    : step > s.n
                                      ? 'bg-primary/15 text-primary'
                                      : 'bg-muted text-muted-foreground',
                            )}
                        >
                            {step > s.n ? <Check className="h-3.5 w-3.5" /> : <span>{s.n}</span>}
                            <span className="hidden sm:inline">{s.label}</span>
                        </div>
                        {i < steps.length - 1 && (
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        )}
                    </div>
                ))}
            </div>

            {/* Step 1: เลือก engine */}
            {step === 1 && (
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        เลือกแนวเกมที่เหมาะกับเนื้อหา — แต่ละแนวมีรูปแบบการเล่นต่างกัน
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {ENGINE_REGISTRY.map((e) => {
                            const selected = engine?.key === e.key;
                            return (
                                <button
                                    key={e.key}
                                    type="button"
                                    onClick={() => setEngine(e)}
                                    className={cn(
                                        'flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition',
                                        selected
                                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                            : 'border-border hover:border-muted-foreground',
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{e.emoji}</span>
                                        <span className="font-semibold">{e.label}</span>
                                        {selected && (
                                            <Check className="ml-auto h-5 w-5 text-primary" />
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{e.description}</p>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {e.subjectFit === 'all' ? (
                                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
                                                ทุกวิชา
                                            </span>
                                        ) : (
                                            e.subjectFit.map((s) => (
                                                <span
                                                    key={s}
                                                    className="rounded bg-muted px-1.5 py-0.5 text-[10px]"
                                                >
                                                    {SUBJECTS.find((x) => x.value === s)?.label ?? s}
                                                </span>
                                            ))
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Step 2: ข้อมูลเกม */}
            {step === 2 && (
                <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5 sm:col-span-2">
                            <Label htmlFor="wiz-title">ชื่อเกม</Label>
                            <Input
                                id="wiz-title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="เช่น ทบทวนสระเสียงสั้น-ยาว"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="wiz-subject">วิชา</Label>
                            <Select
                                value={subject}
                                onValueChange={(v) => setSubject(v as SubjectKey)}
                            >
                                <SelectTrigger id="wiz-subject">
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
                            <Label htmlFor="wiz-grade">ระดับชั้น</Label>
                            <Select value={grade} onValueChange={setGrade}>
                                <SelectTrigger id="wiz-grade">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {GRADES.map((g) => (
                                        <SelectItem key={g} value={g}>
                                            {g}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                        <span className="font-medium">
                            {engine?.emoji} {engine?.label}
                        </span>
                        <span className="text-muted-foreground"> — {engine?.description}</span>
                    </div>
                </div>
            )}

            {/* Step 3: ใส่เนื้อหา (editor ตาม engine) */}
            {step === 3 && (
                <div>
                    <p className="mb-3 text-sm text-muted-foreground">
                        เพิ่ม/แก้โจทย์และเนื้อหาของเกม บันทึกใน editor นี้ก่อนกดถัดไป
                    </p>
                    {/* editor ตาม engine — ใช้ key ใหม่ทุกครั้งที่ engine เปลี่ยน */}
                    {engine?.key === 'quiz' && blueprint && (
                        <QuizBlueprintEditor
                            key={`wiz-${engine.key}`}
                            itemId="wizard-draft"
                            itemTitle={title}
                            previewEngineUrl={engine.runtimeUrl}
                            initialBlueprint={blueprint}
                            onBlueprintChange={(next) => setBlueprint(next)}
                            onSaved={() => {
                                toast({ title: 'บันทึกฉบับร่างแล้ว (ยังไม่เผยแพร่)' });
                            }}
                            onCancel={() => {}}
                        />
                    )}
                    {engine && engine.key !== 'quiz' && (
                        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                            Editor สำหรับแนว &laquo;{engine.label}&raquo; จะเพิ่มใน Phase 3 —
                            ตอนนี้รองรับแนว Quiz ใน Builder
                        </div>
                    )}
                </div>
            )}

            {/* Step 4: ธีม & กติกา (สรุป + ปรับ) */}
            {step === 4 && (
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        ธีมและกติกาปรับได้ใน editor ขั้นที่แล้ว — นี่คือสรุปค่าปัจจุบัน กดถัดไปเพื่อทดสอบ
                    </p>
                    <BlueprintSummary blueprint={blueprint} engine={engine} />
                </div>
            )}

            {/* Step 5: ทดสอบ & เผยแพร่ */}
            {step === 5 && (
                <div className="space-y-4">
                    <div className="rounded-lg border border-border bg-muted/30 p-4">
                        <div className="mb-2 text-sm font-semibold">พร้อมเผยแพร่</div>
                        <BlueprintSummary blueprint={blueprint} engine={engine} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        ⚠️ หมายเหตุ: หากคุณแก้โจทย์ใน editor (ขั้น 3) แล้วยังไม่ได้กดบันทึก
                        ระบบจะเผยแพร่เฉพาะเนื้อหาที่บันทึกแล้วเท่านั้น
                    </p>
                    <Button
                        type="button"
                        size="lg"
                        className="w-full"
                        disabled={publishing}
                        onClick={handlePublish}
                    >
                        {publishing ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <Sparkles className="mr-2 h-5 w-5" />
                        )}
                        {publishing ? 'กำลังเผยแพร่…' : '🚀 เผยแพร่เกม'}
                    </Button>
                </div>
            )}

            {/* Footer nav */}
            <div className="flex items-center justify-between border-t border-border pt-3">
                <Button type="button" variant="ghost" onClick={step === 1 ? onCancel : prevStep}>
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    {step === 1 ? 'ยกเลิก' : 'ย้อนกลับ'}
                </Button>
                {step < 5 ? (
                    <Button
                        type="button"
                        onClick={nextStep}
                        disabled={!canNextFromStep(step)}
                    >
                        ถัดไป
                        <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                ) : null}
            </div>
        </div>
    );
}

/** สรุป blueprint แบบกระชับ สำหรับ step 4-5 */
function BlueprintSummary({
    blueprint,
    engine,
}: {
    blueprint: GameBlueprint | null;
    engine: EngineRegistryEntry | null;
}) {
    if (!blueprint || !engine) {
        return <p className="text-sm text-muted-foreground">ยังไม่มีเนื้อหา</p>;
    }
    if (blueprint.engine === 'quiz') {
        const q = parseQuizBlueprint(blueprint) ?? blueprint;
        return (
            <ul className="space-y-1 text-sm">
                <li>
                    <b>แนวเกม:</b> {engine.emoji} {engine.label}
                </li>
                <li>
                    <b>จำนวนโจทย์:</b> {q.questions.length} ข้อ
                </li>
                <li>
                    <b>เวลา/ข้อ:</b> {q.rules.timeLimitSec > 0 ? `${q.rules.timeLimitSec} วินาที` : 'ไม่จับเวลา'}
                </li>
                <li>
                    <b>คะแนน/ข้อ:</b> {q.rules.pointsPerCorrect} · <b>ผ่าน:</b> {q.rules.passingScore}
                </li>
                <li>
                    <b>สลับตัวเลือก:</b> {q.rules.shuffleOptions ? 'เปิด' : 'ปิด'} · <b>พื้นหลัง:</b> {q.theme.bgPreset}
                </li>
            </ul>
        );
    }
    return (
        <ul className="space-y-1 text-sm">
            <li>
                <b>แนวเกม:</b> {engine.emoji} {engine.label}
            </li>
        </ul>
    );
}
