/**
 * GamesTab.tsx — Admin-only tab สำหรับจัดการ HTML game files (ทุกประเภท)
 *
 * แสดง 2 ประเภท:
 * - Storage games: external_url มี /edu-hub-games/ → อัพเดท v.2 ได้ + ลบ DB+file
 * - Git games: external_url ขึ้นต้น /games/ → ลบแค่ DB (ไฟล์อยู่ใน git)
 *
 * Features:
 * - อัพโหลดเกมใหม่ → upload HTML + cover + create educational_hub_items row
 * - อัพเดท v.2 → upload HTML ทับไฟล์เดิม (Storage games เท่านั้น)
 * - ตั้งค่า → แก้ game_slug / tracked_game / is_published
 * - ลบ → ลบ DB record (+ Storage file ถ้าเป็น Storage game)
 * - รีเซทคะแนน → ลบ sessions + achievements ทุก student ต่อเกม
 *
 * Auth: ทั้ง tab อยู่ใน `/admin/dashboard/educational-hub` ซึ่ง gate ด้วย ProtectedRoute
 * และ Storage RLS (migration 063) บังคับ admin-only เพิ่มอีกชั้น
 */

import { useMemo, useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Plus, RefreshCw, AlertTriangle, Loader2, Trash2, RotateCcw, Settings, Code2, ChevronDown, Copy, Check, Download, Image as ImageIcon, ClipboardList, Target, Sparkles, Pin, Pencil, ArrowLeft, CopyPlus, LayoutGrid, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { ImageUpload } from '@/components/admin/shared/ImageUpload';
import { VideoUpload } from '@/components/admin/shared/VideoUpload';
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog';
import { Switch } from '@/components/ui/switch';
import {
    Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { TagPicker } from './TagPicker';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
    educationalHubService,
    bgmTracksService,
    characterSheetsService,
    characterAssignmentFromSheet,
    type EduHubItem,
    type BgmTrack,
    type CharacterSheet,
} from '@/services/educational-hub.service';
import { CharacterSheetPreview } from './CharacterSheetPreview';
import { CharacterSheetScenePreview } from './CharacterSheetScenePreview';
import { CharacterSheetStudio } from './CharacterSheetStudio';
import { CharacterCreationWizard } from './CharacterCreationWizard';
import { CharacterTemplatePicker } from './CharacterTemplatePicker';
import { GameBlueprintEditor } from './GameBlueprintEditor';
import { supportsBlueprintEditor, blueprintPreviewEngineUrl } from '@/lib/game-blueprint';
import {
    isCharacterSupportedGame,
    parseCharacterAnimationConfig,
    validateAnimationConfig,
    getCharacterAnimPreset,
    type CharacterAnimationConfig,
} from '@/lib/character-animation';
import { parseCharacterColorConfig, type CharacterColorConfig } from '@/lib/character-color';
import { inferPlayStyleFromAnim, type CharacterStudioTemplate } from '@/lib/character-templates';
import {
    GAME_PLAY_STYLE_OPTIONS,
    GAME_PLAY_STYLE_KEYS,
    type GamePlayStyleFilter,
    countGamesByPlayStyle,
    filterGamesByPlayStyle,
    gamePlayStyleLabel,
    gamePlayStyleSupportsCharacter,
    isGamePlayStyleKey,
} from '@/lib/game-play-style';
import {
    processSpriteSheetFile,
    SPRITE_CHECKERBOARD_STYLE,
} from '@/lib/sprite-background';
import { gamePlayService } from '@/services/game-play.service';
import { GameDocsDialog } from './GameDocsDialog';
import { GameCoverAiDialog } from './GameCoverAiDialog';
import { GameIndicatorsDialog } from './GameIndicatorsDialog';
import { FeaturedGamesDisplaySettings } from './FeaturedGamesDisplaySettings';
import { IndicatorPromptDialog } from './IndicatorPromptDialog';
import { IndicatorCoverageDialog } from './IndicatorCoverageDialog';
import { ThaiVocabManageDialog } from './ThaiVocabManageDialog';
import { curriculumService } from '@/services/curriculum.service';
import { GameIndicatorBatchMapper } from '@/components/admin/curriculum/GameIndicatorBatchMapper';

/** preset เพลงสังเคราะห์ (ตรงกับ BGM_PRESETS ใน kampai-sdk.js) */
const BGM_PRESETS: { key: string; label: string }[] = [
    { key: 'cheerful', label: 'สดใส (โทน C)' },
    { key: 'calm', label: 'นุ่ม สงบ (โทน D)' },
    { key: 'warm', label: 'อบอุ่น (โทน A)' },
    { key: 'playful', label: 'สดใส เล่น ๆ (โทน E)' },
    { key: 'bright', label: 'สว่าง (โทน F)' },
    { key: 'mellow', label: 'ช้า ผ่อนคลาย (โทน G)' },
    { key: 'none', label: 'ปิดเพลง' },
];

// ─── Constants ──────────────────────────────────────────────────────────────

/** Subject folder slug → human label (ใช้ใน UI + map กับ public/games/{folder}/) */
const SUBJECT_OPTIONS = [
    { folder: 'thai',    label: 'ภาษาไทย' },
    { folder: 'math',    label: 'คณิตศาสตร์' },
    { folder: 'tech',    label: 'วิทยาศาสตร์และเทคโนโลยี' },
    { folder: 'social',  label: 'สังคมศึกษา ศาสนา และวัฒนธรรม' },
    { folder: 'health',  label: 'สุขศึกษาและพลศึกษา' },
    { folder: 'arts',    label: 'ศิลปะ' },
    { folder: 'career',  label: 'การงานอาชีพ' },
    { folder: 'english', label: 'ภาษาต่างประเทศ (อังกฤษ)' },
] as const;

type SubjectFolder = (typeof SUBJECT_OPTIONS)[number]['folder'];

const GRADE_OPTIONS = ['อ.1', 'อ.2', 'อ.3', 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];

/** category_key ของหมวด "คลังเกมการศึกษา" — เกมใหม่จะถูก assign เข้าหมวดนี้ */
const GAMES_CATEGORY_KEY = 'games';

/** Marker ใน URL ที่บอกว่าเกมนี้อยู่บน Storage (vs /games/... ใน git) */
const STORAGE_URL_MARKER = '/edu-hub-games/';

/** ขนาด HTML สูงสุด — sync กับ file_size_limit ใน migration 063 (5 MB) */
const MAX_HTML_SIZE = 5 * 1024 * 1024;

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Extract subject folder + slug จาก Storage public URL */
const parseGameUrl = (url: string): { subject: SubjectFolder | null; slug: string | null } => {
    const m = url.match(/\/edu-hub-games\/([^/]+)\/([^/?]+)\.html/);
    if (!m) return { subject: null, slug: null };
    const subject = m[1] as SubjectFolder;
    return {
        subject: SUBJECT_OPTIONS.some((s) => s.folder === subject) ? subject : null,
        slug: m[2],
    };
};

const subjectLabel = (folder: string | null): string =>
    SUBJECT_OPTIONS.find((s) => s.folder === folder)?.label ?? '—';

/** Returns true for Supabase Storage-hosted games (vs git-static /games/...) */
const isStorageGame = (url: string | null | undefined): boolean =>
    !!(url?.includes(STORAGE_URL_MARKER));

/**
 * Extract subject + slug from either game URL type:
 * - Storage: `.../edu-hub-games/{subject}/{slug}.html`
 * - Git:     `/games/{subject}/{slug}.html`
 */
const getGameDisplayInfo = (url: string | null | undefined): { subject: SubjectFolder | null; slug: string | null } => {
    if (!url) return { subject: null, slug: null };
    const sm = url.match(/\/edu-hub-games\/([^/]+)\/([^/?]+)\.html/);
    if (sm) {
        const s = sm[1] as SubjectFolder;
        return { subject: SUBJECT_OPTIONS.some((o) => o.folder === s) ? s : null, slug: sm[2] };
    }
    const gm = url.match(/^\/games\/([^/]+)\/([^/?]+)\.html/);
    if (gm) {
        const s = gm[1] as SubjectFolder;
        return { subject: SUBJECT_OPTIONS.some((o) => o.folder === s) ? s : null, slug: gm[2] };
    }
    return { subject: null, slug: null };
};

// ─── DeveloperCheatsheet ────────────────────────────────────────────────────
// คู่มือคำสั่งสำหรับ AI/นักพัฒนา — sync กับ GAME.md (รวมคำสั่ง verify, integrate, copy template)
// แสดงเป็น collapsible card ด้านบนสุดของ GamesTab — กันลืม + copy-to-clipboard ได้

interface CommandBlockProps {
    label: string;
    command: string;
    note?: string;
}

function CommandBlock({ label, command, note }: CommandBlockProps) {
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(command);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
            toast({ title: 'คัดลอกแล้ว', description: command });
        } catch {
            toast({ title: 'คัดลอกไม่สำเร็จ', variant: 'destructive' });
        }
    };

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-foreground">{label}</span>
                <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-[10px]"
                    onClick={handleCopy}
                >
                    {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                    {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
                </Button>
            </div>
            <code className="block w-full rounded-md border border-border bg-muted/50 px-3 py-2 font-mono text-xs text-foreground overflow-x-auto whitespace-pre">
                {command}
            </code>
            {note && <p className="text-[11px] text-muted-foreground">{note}</p>}
        </div>
    );
}

function AiGameKit({
    onOpenPrompt,
    pendingCount,
}: {
    onOpenPrompt: () => void;
    pendingCount: number;
}) {
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);

    const copyPrompt = async () => {
        try {
            const res = await fetch('/GAME-PROMPT.md');
            const text = await res.text();
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
            toast({ title: 'คัดลอก Prompt แล้ว', description: 'วางให้ AI (ChatGPT / Gemini / Claude) พร้อมไอเดียเกมได้เลย' });
        } catch {
            toast({ title: 'คัดลอกไม่สำเร็จ', variant: 'destructive' });
        }
    };

    return (
        <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">🎮 สร้างเกมใหม่ด้วย AI ภายนอก</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    ดาวน์โหลดเทมเพลต → คัดลอก Prompt ไปวางให้ AI (ChatGPT / Gemini / Claude) พร้อมไอเดียเกม →
                    ได้ไฟล์ HTML กลับมา → กด "อัพโหลดเกมใหม่" → ตั้ง game slug → เสร็จ
                    (เกมเชื่อมคะแนน + นักเรียน + leaderboard ผ่าน <code className="text-foreground">KAMPAI SDK</code> อัตโนมัติ)
                </p>
                <p className="text-xs text-primary leading-relaxed">
                    💡 อยากให้เกมตรงหลักสูตร? กด <strong>"🎯 ใช้ตัวชี้วัดช่วยสร้าง"</strong> เลือกตัวชี้วัดที่อยากฝึก →
                    Prompt จะแนบตัวชี้วัดให้ AI + เมื่ออัปโหลดเกม ระบบผูกตัวชี้วัดเข้าเกมให้อัตโนมัติ
                </p>
                <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                        <a href="/games/_template-full.html" download>
                            <Download className="h-3.5 w-3.5 mr-1" /> เทมเพลต (vanilla)
                        </a>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                        <a href="/games/_template-react.html" download>
                            <Download className="h-3.5 w-3.5 mr-1" /> เทมเพลต (React)
                        </a>
                    </Button>
                    <Button size="sm" onClick={copyPrompt}>
                        {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                        คัดลอก Prompt สำหรับ AI
                    </Button>
                    <Button size="sm" variant="secondary" onClick={onOpenPrompt}>
                        <Target className="h-3.5 w-3.5 mr-1" />
                        🎯 ใช้ตัวชี้วัดช่วยสร้าง
                        {pendingCount > 0 && (
                            <Badge className="ml-1.5 h-4 px-1.5 text-[10px] bg-primary text-primary-foreground">
                                {pendingCount}
                            </Badge>
                        )}
                    </Button>
                    <Button asChild size="sm" variant="ghost">
                        <a href="/GAME-PROMPT.md" target="_blank" rel="noreferrer">
                            <ExternalLink className="h-3.5 w-3.5 mr-1" /> ดู Prompt
                        </a>
                    </Button>
                </div>
                {pendingCount > 0 && (
                    <p className="text-[11px] text-emerald-700">
                        ✓ จำตัวชี้วัด {pendingCount} ตัวไว้แล้ว — อัปโหลดเกมใหม่ตอนนี้เพื่อผูกอัตโนมัติ
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

function CoverStandardKit() {
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);

    const copyCoverPrompt = async () => {
        try {
            const res = await fetch('/COVER-PROMPT.md');
            const text = await res.text();
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
            toast({ title: 'คัดลอก Prompt ปกแล้ว', description: 'วางใน Canva (เลือก YouTube Thumbnail = 16:9) หรือ AI สร้างภาพ พร้อมเติมชื่อเกม + ฉาก' });
        } catch {
            toast({ title: 'คัดลอกไม่สำเร็จ', variant: 'destructive' });
        }
    };

    return (
        <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">🎨 มาตรฐานปกเกม</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    ปกทุกเกมใช้แนวเดียวกันเพื่อความสม่ำเสมอ — คัดลอก Prompt → เติมชื่อเกม/ฉาก → วางใน
                    Canva (เลือก "YouTube Thumbnail" = 16:9) หรือ AI สร้างภาพ → ได้ปก PNG → อัปโหลดที่ช่อง "รูปปก"
                </p>
                <ul className="text-[11px] text-muted-foreground space-y-0.5 list-disc list-inside">
                    <li>สดใสระดับประถม สีสันสดใส</li>
                    <li>มีเด็กนักเรียน (ชุดนักเรียน) เป็นตัวเอก</li>
                    <li>ภาพประกอบ + ฉากเด่นที่สื่อ gameplay</li>
                    <li>ปกตรงกับเกม + ชื่อไทยตัวใหญ่อ่านชัด</li>
                </ul>
                <div className="grid grid-cols-2 gap-2">
                    <figure className="space-y-1">
                        <div className="aspect-video w-full overflow-hidden rounded-md border border-border bg-muted">
                            <img
                                src="/games/science/circuit-builder-cover.png"
                                alt="ตัวอย่างปกเกม ต่อวงจรไฟฟ้า"
                                className="w-full h-full object-contain"
                                loading="lazy"
                            />
                        </div>
                        <figcaption className="text-[10px] text-muted-foreground text-center">ต่อวงจรไฟฟ้า (วิทยาศาสตร์)</figcaption>
                    </figure>
                    <figure className="space-y-1">
                        <div className="aspect-video w-full overflow-hidden rounded-md border border-border bg-muted">
                            <img
                                src="/games/arts/symmetry-art-cover.png"
                                alt="ตัวอย่างปกเกม เติมลายสมมาตร"
                                className="w-full h-full object-contain"
                                loading="lazy"
                            />
                        </div>
                        <figcaption className="text-[10px] text-muted-foreground text-center">เติมลายสมมาตร (ศิลปะ)</figcaption>
                    </figure>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={copyCoverPrompt}>
                        {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                        คัดลอก Prompt ปก
                    </Button>
                    <Button asChild size="sm" variant="ghost">
                        <a href="/COVER-PROMPT.md" target="_blank" rel="noreferrer">
                            <ExternalLink className="h-3.5 w-3.5 mr-1" /> ดู Prompt ปก
                        </a>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function DeveloperCheatsheet() {
    const [open, setOpen] = useState(false);
    return (
        <Card className="border-amber-200 bg-amber-50/30">
            <Collapsible open={open} onOpenChange={setOpen}>
                <CollapsibleTrigger asChild>
                    <button
                        type="button"
                        className="w-full flex items-center justify-between gap-2 p-4 text-left hover:bg-amber-50/50 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Code2 className="h-4 w-4 text-amber-700" />
                            <span className="text-sm font-semibold text-foreground">
                                💡 คู่มือคำสั่งสำหรับ AI / นักพัฒนา
                            </span>
                            <Badge variant="outline" className="text-[10px] bg-amber-100 border-amber-300 text-amber-800">
                                GAME.md
                            </Badge>
                        </div>
                        <ChevronDown
                            className={cn(
                                'h-4 w-4 text-muted-foreground transition-transform',
                                open && 'rotate-180',
                            )}
                        />
                    </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent className="space-y-4 pt-0 pb-4">
                        <div className="space-y-3">
                            <CommandBlock
                                label="🔍 ตรวจเกมที่มีอยู่"
                                command="pnpm verify:game public/games/tech/word-shield.html"
                                note="ตรวจ 7 จุด: GAME_SLUG, submit score, navigate back, init, submit called, migration, + render smoke-test (จับจอดำ)"
                            />
                            <CommandBlock
                                label="🤖 ให้ Claude auto-integrate เกมใหม่ (ใน Claude Code)"
                                command="/integrate-game public/games/thai/my-new-game.html"
                                note="Claude อ่าน GAME.md + แก้ kampai integration ให้ครบตาม checklist"
                            />
                            <CommandBlock
                                label="🆕 สร้างเกมใหม่จากศูนย์"
                                command={[
                                    'cp public/games/_template-full.html public/games/tech/my-game.html',
                                    '# → แก้ GAME_SLUG → เขียน logic → verify → migration → done',
                                ].join('\n')}
                                note="Template มี kampai postMessage + Supabase leaderboard ครบ — copy แล้วแก้แค่ game logic"
                            />
                        </div>

                        <div className="border-t border-amber-200 pt-3 space-y-2">
                            <p className="text-xs font-semibold text-foreground">📋 Integration Checklist</p>
                            <ul className="text-[11px] text-muted-foreground space-y-0.5 list-disc list-inside">
                                <li>โหลด <code className="text-foreground">/games/kampai-sdk.js</code> + ตั้ง <code className="text-foreground">KAMPAI.setSlug('slug')</code> ให้ตรง DB</li>
                                <li>เรียก <code className="text-foreground">KAMPAI.submitScore(score, &#123;mode, ...&#125;)</code> เมื่อเกมจบ</li>
                                <li>ปุ่ม "กลับ" ใช้ <code className="text-foreground">KAMPAI.goHome()</code> ไม่ใช่ <code className="text-foreground">window.location.href</code></li>
                                <li>ห้ามมี Firebase / input ชื่อผู้เล่น (ใช้ <code className="text-foreground">KAMPAI.student.displayName</code>)</li>
                                <li>สร้าง migration: <code className="text-foreground">supabase/migrations/NNN_seed_&#123;slug&#125;_game.sql</code></li>
                            </ul>
                        </div>

                        <div className="border-t border-amber-200 pt-3">
                            <p className="text-[11px] text-muted-foreground">
                                📖 อ่านมาตรฐานเต็มได้ที่ <code className="text-foreground">GAME.md</code> ใน repo root —
                                หรือบอก Claude ว่า <em>"อ่าน GAME.md แล้ว integrate เกม &#123;path&#125;"</em>
                            </p>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}

// ─── Tab ────────────────────────────────────────────────────────────────────

function isThaiVocabHubGame(item: EduHubItem): boolean {
    return item.game_slug === 'thai-vocab-hub'
        || (item.external_url ?? '').includes('thai-vocab-hub');
}

type Teacher = {
    id: string;
    name: string;
    photo_url: string | null;
};

export const GamesTab = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [dialog, setDialog] = useState<
        | { mode: 'create' }
        | { mode: 'replace'; item: EduHubItem }
        | { mode: 'settings'; item: EduHubItem }
        | { mode: 'docs'; item: EduHubItem }
        | { mode: 'cover-ai'; item: EduHubItem }
        | { mode: 'indicators'; item: EduHubItem }
        | { mode: 'prompt' }
        | { mode: 'coverage' }
        | { mode: 'bgm' }
        | { mode: 'characters' }
        | { mode: 'batch-map' }
        | { mode: 'blueprint'; item: EduHubItem }
        | { mode: 'vocab'; item: EduHubItem }
        | null
    >(null);
    // ตัวชี้วัดที่เลือกจาก IndicatorPromptDialog → auto-map เข้าเกมใหม่หลังอัปโหลด
    const [pendingIndicatorIds, setPendingIndicatorIds] = useState<string[]>([]);
    const [confirmAction, setConfirmAction] = useState<
        | { type: 'delete'; item: EduHubItem }
        | { type: 'reset'; item: EduHubItem }
        | null
    >(null);
    const [styleFilter, setStyleFilter] = useState<GamePlayStyleFilter>('__all__');

    const handleConfirm = async () => {
        if (!confirmAction) return;
        const { type, item } = confirmAction;
        setConfirmAction(null);

        if (type === 'delete') {
            try {
                const { error: dbErr } = await educationalHubService.deleteItem(item.id);
                if (dbErr) throw dbErr;
                const { subject, slug } = parseGameUrl(item.external_url ?? '');
                if (subject && slug) {
                    await educationalHubService.removeGameHtml(`${subject}/${slug}.html`);
                }
                queryClient.invalidateQueries({ queryKey: ['edu-hub', 'all-games'] });
                queryClient.invalidateQueries({ queryKey: ['edu-hub'] });
                toast({ title: 'ลบเกมสำเร็จ', description: `ลบ "${item.title}" แล้ว` });
            } catch (err) {
                toast({ title: 'ลบไม่สำเร็จ', description: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด', variant: 'destructive' });
            }
        } else {
            const gameSlug = item.game_slug ?? parseGameUrl(item.external_url ?? '').slug;
            if (!gameSlug) {
                toast({ title: 'รีเซทไม่ได้', description: 'เกมนี้ยังไม่มี game_slug กำหนดไว้', variant: 'destructive' });
                return;
            }
            try {
                const result = await gamePlayService.adminResetGameSessions(gameSlug);
                queryClient.invalidateQueries({ queryKey: ['game-leaderboard'] });
                queryClient.invalidateQueries({ queryKey: ['game-sessions-recent'] });
                toast({
                    title: 'รีเซทคะแนนสำเร็จ',
                    description: `ลบ ${result.sessions_deleted} เซสชั่น, ${result.achievements_deleted} badge`,
                });
            } catch (err) {
                toast({ title: 'รีเซทไม่สำเร็จ', description: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด', variant: 'destructive' });
            }
        }
    };

    // ปักหมุด/ปลดหมุด เกมขึ้นโซน "เกมแนะนำ" หน้าแรก
    const toggleFeatured = async (item: EduHubItem) => {
        const next = !item.homepage_featured;
        try {
            const { error } = await educationalHubService.updateItem(item.id, { homepage_featured: next });
            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ['edu-hub', 'all-games'] });
            queryClient.invalidateQueries({ queryKey: ['edu-hub', 'featured-games'] });
            toast({ title: next ? 'ปักหมุดขึ้นหน้าแรกแล้ว' : 'ปลดหมุดจากหน้าแรกแล้ว', description: `"${item.title}"` });
        } catch (err) {
            toast({ title: 'อัปเดตไม่สำเร็จ', description: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด', variant: 'destructive' });
        }
    };

    // List items ทั้งหมด — Storage games (/edu-hub-games/) + Git games (/games/)
    const { data: items, isLoading } = useQuery({
        queryKey: ['edu-hub', 'all-games'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('educational_hub_items' as never)
                .select('*')
                .eq('item_type', 'link')
                .or('external_url.like.%/edu-hub-games/%,external_url.like./games/%')
                .order('updated_at', { ascending: false });
            if (error) throw error;
            return (data ?? []) as EduHubItem[];
        },
    });

    // ดึง teachers ไว้แสดงชื่อ + รูป
    const { data: teachers } = useQuery({
        queryKey: ['edu-hub', 'admin-teachers'],
        queryFn: async () => {
            const { data, error } = await educationalHubService.listAllTeachersForAdmin();
            if (error) throw error;
            return (data ?? []) as Teacher[];
        },
    });

    // Category id ของหมวด "เกม" — ส่งเข้า upload dialog
    const { data: gamesCategoryId } = useQuery({
        queryKey: ['edu-hub', 'games-category-id'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('educational_hub_categories' as never)
                .select('id')
                .eq('category_key', GAMES_CATEGORY_KEY)
                .maybeSingle();
            if (error) throw error;
            return (data as { id: string } | null)?.id ?? null;
        },
    });

    // จำนวนตัวชี้วัดที่ผูกต่อเกม (badge ในตาราง)
    const { data: indicatorCounts } = useQuery({
        queryKey: ['edu-hub', 'indicator-counts'],
        queryFn: () => curriculumService.countIndicatorsByGame(),
    });

    const teacherById = useMemo(() => {
        const map = new Map<string, Teacher>();
        (teachers ?? []).forEach((t) => map.set(t.id, t));
        return map;
    }, [teachers]);

    const styleCounts = useMemo(
        () => countGamesByPlayStyle(items ?? []),
        [items],
    );

    const filteredItems = useMemo(
        () => filterGamesByPlayStyle(items ?? [], styleFilter),
        [items, styleFilter],
    );

    const handleSaved = async (newItemId?: string) => {
        // auto-map ตัวชี้วัดที่เลือกไว้ (จาก IndicatorPromptDialog) เข้ากับเกมใหม่
        if (newItemId && pendingIndicatorIds.length > 0) {
            const { error } = await curriculumService.setGameIndicators(newItemId, pendingIndicatorIds);
            if (error) {
                toast({
                    title: 'อัปโหลดสำเร็จ แต่ผูกตัวชี้วัดไม่สำเร็จ',
                    description: error.message,
                    variant: 'destructive',
                });
            } else {
                toast({ title: `บันทึกเกม + ผูก ${pendingIndicatorIds.length} ตัวชี้วัดแล้ว` });
                setPendingIndicatorIds([]);
            }
            queryClient.invalidateQueries({ queryKey: ['edu-hub', 'indicator-counts'] });
        } else {
            toast({ title: 'บันทึกสำเร็จ' });
        }
        queryClient.invalidateQueries({ queryKey: ['edu-hub', 'all-games'] });
        queryClient.invalidateQueries({ queryKey: ['edu-hub'] });
        setDialog(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">เกม HTML (ทั้งหมด)</h2>
                    <p className="text-sm text-muted-foreground">
                        จัดการเกมทุกประเภท — Storage (อัพเดท v.2 ได้) และ Git legacy (ตั้งค่า/ลบ DB record ได้)
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setDialog({ mode: 'coverage' })}>
                        📊 ความครอบคลุมตัวชี้วัด
                    </Button>
                    <Button variant="outline" onClick={() => setDialog({ mode: 'batch-map' })}>
                        🔗 จับคู่เกม↔ตัวชี้วัด
                    </Button>
                    <Button variant="outline" onClick={() => setDialog({ mode: 'bgm' })}>
                        🎵 คลังเพลง
                    </Button>
                    <Button variant="outline" onClick={() => setDialog({ mode: 'characters' })}>
                        🐰 คลังตัวละคร
                    </Button>
                    <Button onClick={() => setDialog({ mode: 'create' })} disabled={!gamesCategoryId}>
                        <Plus className="h-4 w-4 mr-1" /> อัพโหลดเกมใหม่
                    </Button>
                </div>
            </div>

            <AiGameKit
                onOpenPrompt={() => setDialog({ mode: 'prompt' })}
                pendingCount={pendingIndicatorIds.length}
            />
            <CoverStandardKit />
            <FeaturedGamesDisplaySettings />
            <DeveloperCheatsheet />

            {isLoading ? (
                <div className="text-center text-muted-foreground py-12">กำลังโหลด...</div>
            ) : (items ?? []).length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center space-y-2">
                        <p className="text-muted-foreground">ยังไม่มีเกมในระบบ</p>
                        <p className="text-xs text-muted-foreground">
                            เกมที่มี external_url เป็น /edu-hub-games/ หรือ /games/ จะปรากฏที่นี่
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <div className="border-b border-border px-4 py-3 space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">แนวเกม — เลือกก่อนดูรายการ</p>
                            <div className="flex flex-wrap gap-1.5">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={styleFilter === '__all__' ? 'default' : 'outline'}
                                    className="h-8 text-xs"
                                    onClick={() => setStyleFilter('__all__')}
                                >
                                    ทั้งหมด ({styleCounts.__all__})
                                </Button>
                                {GAME_PLAY_STYLE_OPTIONS.map((o) => (
                                    <Button
                                        key={o.key}
                                        type="button"
                                        size="sm"
                                        variant={styleFilter === o.key ? 'default' : 'outline'}
                                        className="h-8 text-xs"
                                        onClick={() => setStyleFilter(o.key)}
                                    >
                                        {o.emoji} {o.shortLabel} ({styleCounts[o.key] ?? 0})
                                    </Button>
                                ))}
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={styleFilter === '__unset__' ? 'default' : 'outline'}
                                    className="h-8 text-xs"
                                    onClick={() => setStyleFilter('__unset__')}
                                >
                                    ยังไม่ระบุ ({styleCounts.__unset__})
                                </Button>
                            </div>
                            {styleFilter !== '__all__' && (
                                <p className="text-[10px] text-muted-foreground">
                                    แสดง {filteredItems.length} จาก {items!.length} เกม
                                    {styleFilter !== '__unset__' && isGamePlayStyleKey(styleFilter)
                                        ? ` · ${GAME_PLAY_STYLE_OPTIONS.find((o) => o.key === styleFilter)?.description}`
                                        : ''}
                                </p>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b border-border bg-muted/30">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">ปก</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">ชื่อเกม</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">ที่เก็บ</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">แนวเกม</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">หมวดวิชา</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">เจ้าของ</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">URL</th>
                                        <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">การจัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                                                ไม่มีเกมในแนวนี้ — ลองเลือก「ทั้งหมด」หรือตั้งแนวเกมใน「ตั้งค่า」
                                            </td>
                                        </tr>
                                    ) : filteredItems.map((item) => {
                                        const { subject, slug } = getGameDisplayInfo(item.external_url);
                                        const storage = isStorageGame(item.external_url);
                                        const owner = teacherById.get(item.owner_staff_id);
                                        return (
                                            <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                                                <td className="px-4 py-3">
                                                    {item.thumbnail_url ? (
                                                        <img
                                                            src={item.thumbnail_url}
                                                            alt=""
                                                            className="h-12 w-16 object-contain bg-muted rounded border border-border"
                                                        />
                                                    ) : (
                                                        <div className="h-12 w-16 bg-muted rounded border border-border" />
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm max-w-xs">
                                                    <p className="font-medium truncate">{item.title}</p>
                                                    {slug && (
                                                        <p className="text-[10px] text-muted-foreground truncate">{slug}.html</p>
                                                    )}
                                                    {item.game_slug && (
                                                        <p className="text-[10px] text-primary/70 truncate">slug: {item.game_slug}</p>
                                                    )}
                                                    {(indicatorCounts?.get(item.id) ?? 0) > 0 && (
                                                        <span className="mt-0.5 inline-flex items-center gap-0.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                                                            <Target className="h-2.5 w-2.5" /> {indicatorCounts!.get(item.id)} ตัวชี้วัด
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {storage ? (
                                                        <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200">
                                                            Storage
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-[10px]">
                                                            Git
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className="text-[10px] whitespace-nowrap">
                                                        {gamePlayStyleLabel(item.game_play_style)}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {subjectLabel(subject)}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <PersonAvatar
                                                            name={owner?.name ?? '—'}
                                                            photoUrl={owner?.photo_url ?? null}
                                                            size="xs"
                                                        />
                                                        <span className="text-xs">{owner?.name ?? '—'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {item.external_url && (
                                                        <a
                                                            href={item.external_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                                                        >
                                                            <ExternalLink className="h-3 w-3" /> เปิด
                                                        </a>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1 flex-wrap">
                                                        {storage && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setDialog({ mode: 'replace', item })}
                                                            >
                                                                <RefreshCw className="h-3 w-3 mr-1" /> อัพเดท v.2
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-sky-600 border-sky-200 hover:bg-sky-50"
                                                            onClick={() => setDialog({ mode: 'settings', item })}
                                                        >
                                                            <Settings className="h-3 w-3 mr-1" /> ตั้งค่า
                                                        </Button>
                                                        {supportsBlueprintEditor(item) && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                                                onClick={() => setDialog({ mode: 'blueprint', item })}
                                                            >
                                                                <LayoutGrid className="h-3 w-3 mr-1" /> ออกแบบด่าน
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-violet-600 border-violet-200 hover:bg-violet-50"
                                                            onClick={() => setDialog({ mode: 'docs', item })}
                                                        >
                                                            <ClipboardList className="h-3 w-3 mr-1" /> รายละเอียด
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-pink-600 border-pink-200 hover:bg-pink-50"
                                                            onClick={() => setDialog({ mode: 'cover-ai', item })}
                                                        >
                                                            <Sparkles className="h-3 w-3 mr-1" /> ปก AI
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-amber-700 border-amber-200 hover:bg-amber-50"
                                                            onClick={() => setDialog({ mode: 'indicators', item })}
                                                        >
                                                            <Target className="h-3 w-3 mr-1" /> ตัวชี้วัด
                                                        </Button>
                                                        {isThaiVocabHubGame(item) && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-amber-800 border-amber-300 hover:bg-amber-50"
                                                                onClick={() => setDialog({ mode: 'vocab', item })}
                                                            >
                                                                <BookOpen className="h-3 w-3 mr-1" /> จัดการคำศัพท์
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant={item.homepage_featured ? 'default' : 'outline'}
                                                            size="sm"
                                                            className={item.homepage_featured ? '' : 'text-rose-600 border-rose-200 hover:bg-rose-50'}
                                                            onClick={() => toggleFeatured(item)}
                                                            title={item.homepage_featured ? 'ปักหมุดบนหน้าแรกอยู่ — กดเพื่อปลด' : 'ปักหมุดขึ้นโซนเกมแนะนำหน้าแรก'}
                                                        >
                                                            <Pin className={cn('h-3 w-3 mr-1', item.homepage_featured && 'fill-current')} /> หน้าแรก
                                                        </Button>
                                                        {item.game_slug && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-amber-600 border-amber-200 hover:bg-amber-50"
                                                                onClick={() => setConfirmAction({ type: 'reset', item })}
                                                            >
                                                                <RotateCcw className="h-3 w-3 mr-1" /> รีเซทคะแนน
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-destructive border-destructive/30 hover:bg-destructive/5"
                                                            onClick={() => setConfirmAction({ type: 'delete', item })}
                                                        >
                                                            <Trash2 className="h-3 w-3 mr-1" /> ลบ
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Dialog open={!!dialog} onOpenChange={(open) => !open && setDialog(null)}>
                <DialogContent className={cn(
                    dialog?.mode === 'blueprint' ? 'max-w-5xl' :
                    (dialog?.mode === 'characters') ? 'max-w-4xl' : (dialog?.mode === 'settings' || dialog?.mode === 'bgm') ? 'max-w-md' : 'max-w-2xl',
                    'overflow-y-auto max-h-[90vh]',
                )}>
                    {dialog?.mode === 'create' && gamesCategoryId && (
                        <GameUploadDialog
                            mode="create"
                            teachers={teachers ?? []}
                            gamesCategoryId={gamesCategoryId}
                            onSaved={handleSaved}
                            onCancel={() => setDialog(null)}
                        />
                    )}
                    {dialog?.mode === 'replace' && (
                        <GameUploadDialog
                            mode="replace"
                            item={dialog.item}
                            onSaved={handleSaved}
                            onCancel={() => setDialog(null)}
                        />
                    )}
                    {dialog?.mode === 'settings' && (
                        <GameSettingsDialog
                            item={dialog.item}
                            onSaved={handleSaved}
                            onCancel={() => setDialog(null)}
                        />
                    )}
                    {dialog?.mode === 'docs' && (
                        <GameDocsDialog
                            item={dialog.item}
                            onClose={() => setDialog(null)}
                        />
                    )}
                    {dialog?.mode === 'cover-ai' && (
                        <GameCoverAiDialog
                            item={dialog.item}
                            onSaved={handleSaved}
                            onCancel={() => setDialog(null)}
                        />
                    )}
                    {dialog?.mode === 'indicators' && (
                        <GameIndicatorsDialog
                            item={dialog.item}
                            onClose={() => setDialog(null)}
                        />
                    )}
                    {dialog?.mode === 'vocab' && (
                        <ThaiVocabManageDialog
                            item={dialog.item}
                            onClose={() => setDialog(null)}
                        />
                    )}
                    {dialog?.mode === 'prompt' && (
                        <IndicatorPromptDialog
                            onApply={(ids) => setPendingIndicatorIds(ids)}
                            onClose={() => setDialog(null)}
                        />
                    )}
                    {dialog?.mode === 'coverage' && (
                        <IndicatorCoverageDialog onClose={() => setDialog(null)} />
                    )}
                    {dialog?.mode === 'batch-map' && (
                        <GameIndicatorBatchMapper
                            open
                            onClose={() => setDialog(null)}
                        />
                    )}
                    {dialog?.mode === 'bgm' && (
                        <BgmLibraryDialog onClose={() => setDialog(null)} />
                    )}
                    {dialog?.mode === 'characters' && (
                        <CharacterLibraryDialog onClose={() => setDialog(null)} />
                    )}
                    {dialog?.mode === 'blueprint' && (
                        <>
                            <DialogHeader>
                                <DialogTitle>ออกแบบด่าน — {dialog.item.title}</DialogTitle>
                                <DialogDescription>
                                    ลาก platform · คลิกวาง spawn/ดาว · บันทึกแล้วเกมโหลดด่านจาก blueprint อัตโนมัติ
                                </DialogDescription>
                            </DialogHeader>
                            <GameBlueprintEditor
                                itemId={dialog.item.id}
                                itemTitle={dialog.item.title}
                                blueprintId={dialog.item.blueprint_id}
                                initialBlueprint={dialog.item.blueprint_json}
                                previewEngineUrl={blueprintPreviewEngineUrl(dialog.item)}
                                gameSlug={dialog.item.game_slug}
                                onSaved={() => {
                                    handleSaved();
                                    toast({ title: 'บันทึกด่านแล้ว', description: 'นักเรียนจะเห็นด่านใหม่เมื่อเล่นเกม' });
                                }}
                                onCancel={() => setDialog(null)}
                            />
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={confirmAction?.type === 'delete'}
                onOpenChange={(open) => !open && setConfirmAction(null)}
                onConfirm={handleConfirm}
                title={`ลบเกม "${confirmAction?.item.title}"?`}
                description={
                    confirmAction?.type === 'delete' && isStorageGame(confirmAction.item.external_url)
                        ? 'ลบ record และไฟล์ HTML ออกจาก Storage ถาวร — ประวัติคะแนนของนักเรียนจะยังคงอยู่ใน DB'
                        : 'ลบออกจากคลังข้อมูล — ไฟล์ HTML ยังอยู่ใน git (ต้องลบด้วยตัวเองถ้าต้องการ) — ประวัติคะแนนจะยังคงอยู่ใน DB'
                }
                confirmText="ลบเกม"
            />
            <ConfirmDialog
                open={confirmAction?.type === 'reset'}
                onOpenChange={(open) => !open && setConfirmAction(null)}
                onConfirm={handleConfirm}
                title={`รีเซทคะแนนเกม "${confirmAction?.item.title}"?`}
                description="ลบประวัติการเล่นและ badge ของนักเรียนทุกคนสำหรับเกมนี้ — ไม่สามารถกู้คืนได้"
                confirmText="รีเซทคะแนนทั้งหมด"
            />
        </div>
    );
};

// ─── Settings Dialog ────────────────────────────────────────────────────────

const GameSettingsDialog = ({
    item,
    onSaved,
    onCancel,
}: {
    item: EduHubItem;
    onSaved: () => void;
    onCancel: () => void;
}) => {
    const { toast } = useToast();
    const [gameSlug, setGameSlug] = useState(item.game_slug ?? '');
    const [tracked, setTracked] = useState(item.tracked_game);
    const [published, setPublished] = useState(item.is_published);
    // value-encoded: '__default__' | 'preset:<key>' | 'track:<url>'
    const [bgmSel, setBgmSel] = useState(
        item.bgm_url ? `track:${item.bgm_url}` : item.bgm_preset ? `preset:${item.bgm_preset}` : '__default__',
    );
    const [charSel, setCharSel] = useState(
        item.character_sheet_id ? `char:${item.character_sheet_id}` : '__default__',
    );
    const [playStyle, setPlayStyle] = useState(item.game_play_style ?? '__unset__');
    const [previewVideoUrl, setPreviewVideoUrl] = useState(item.preview_video_url ?? '');
    const [saving, setSaving] = useState(false);

    const { data: tracks } = useQuery({
        queryKey: ['bgm-tracks'],
        queryFn: async () => {
            const { data } = await bgmTracksService.list();
            return (data ?? []) as BgmTrack[];
        },
    });

    const { data: characters } = useQuery({
        queryKey: ['character-sheets'],
        queryFn: async () => {
            const { data } = await characterSheetsService.list();
            return (data ?? []) as CharacterSheet[];
        },
    });

    const handleSave = async () => {
        setSaving(true);
        try {
            const bgm = bgmSel.startsWith('track:')
                ? { bgm_url: bgmSel.slice(6), bgm_preset: null }
                : bgmSel.startsWith('preset:')
                    ? { bgm_url: null, bgm_preset: bgmSel.slice(7) }
                    : { bgm_url: null, bgm_preset: null };
            const charId = charSel.startsWith('char:') ? charSel.slice(5) : null;
            const sheet = charId ? (characters ?? []).find((c) => c.id === charId) : null;
            const charFields = characterAssignmentFromSheet(sheet);
            const { error } = await educationalHubService.updateItem(item.id, {
                game_slug: gameSlug.trim() || null,
                tracked_game: tracked,
                is_published: published,
                preview_video_url: previewVideoUrl.trim() || null,
                game_play_style: playStyle === '__unset__' ? null : playStyle,
                ...bgm,
                ...charFields,
            });
            if (error) throw error;
            onSaved();
        } catch (err) {
            toast({
                title: 'บันทึกไม่สำเร็จ',
                description: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle>ตั้งค่าเกม — {item.title}</DialogTitle>
                <DialogDescription>
                    กำหนด game_slug สำหรับเชื่อมกับระบบ XP/Leaderboard และสถานะการเผยแพร่
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Game Slug (ว่างได้ = ยังไม่ track)</label>
                    <Input
                        value={gameSlug}
                        onChange={(e) => setGameSlug(e.target.value)}
                        placeholder="เช่น pizza-master-chef"
                    />
                    <p className="text-xs text-muted-foreground">
                        ต้องตรงกับค่า gameSlug ใน HTML ไฟล์ เพื่อให้ระบบ XP/Leaderboard ทำงาน
                    </p>
                </div>

                <div className="flex items-center justify-between rounded-md border border-border p-3">
                    <div>
                        <p className="text-sm font-medium">ติดตามคะแนน (Tracked)</p>
                        <p className="text-xs text-muted-foreground">เปิดเพื่อให้ระบบ XP และ Leaderboard ทำงาน</p>
                    </div>
                    <Switch checked={tracked} onCheckedChange={setTracked} />
                </div>

                <div className="flex items-center justify-between rounded-md border border-border p-3">
                    <div>
                        <p className="text-sm font-medium">เผยแพร่ (Published)</p>
                        <p className="text-xs text-muted-foreground">ปิดเพื่อซ่อนจากคลังเกมของนักเรียน</p>
                    </div>
                    <Switch checked={published} onCheckedChange={setPublished} />
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">🎮 แนวเกม</label>
                    <Select value={playStyle} onValueChange={setPlayStyle}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__unset__">ยังไม่ระบุ</SelectItem>
                            {GAME_PLAY_STYLE_OPTIONS.map((o) => (
                                <SelectItem key={o.key} value={o.key}>
                                    {o.emoji} {o.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        ใช้กรองรายการในแท็บเกม HTML · {playStyle !== '__unset__' && isGamePlayStyleKey(playStyle)
                            ? GAME_PLAY_STYLE_OPTIONS.find((o) => o.key === playStyle)?.description
                            : 'เลือกแนวให้ตรงการเล่นจริง'}
                    </p>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">🎵 เพลงประกอบ</label>
                    <Select value={bgmSel} onValueChange={setBgmSel}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__default__">ค่าเริ่มต้นของเกม</SelectItem>
                            {(tracks ?? []).length > 0 && (
                                <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground">— เพลงที่อัปโหลด (mp3) —</div>
                            )}
                            {(tracks ?? []).map((t) => (
                                <SelectItem key={t.id} value={`track:${t.url}`}>🎶 {t.title}</SelectItem>
                            ))}
                            <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground">— เพลงสังเคราะห์ —</div>
                            {BGM_PRESETS.map((p) => (
                                <SelectItem key={p.key} value={`preset:${p.key}`}>{p.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        เพลงอัปโหลดมาก่อนเพลงสังเคราะห์ · จัดการคลังเพลงที่ปุ่ม "🎵 คลังเพลง" · ผู้เล่นยังกดปิด 🎵 เองได้
                    </p>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">🐰 ตัวละคร (sprite sheet)</label>
                    <Select value={charSel} onValueChange={setCharSel}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__default__">ค่าเริ่มต้นของเกม (bundled)</SelectItem>
                            {(characters ?? []).map((c) => (
                                <SelectItem key={c.id} value={`char:${c.id}`}>
                                    🐰 {c.title} ({c.frame_width}×{c.frame_height} · {c.frame_count} เฟรม)
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        เกมที่รองรับ KAMPAI.character จะโหลด sheet จากคลัง · จัดการที่ปุ่ม &quot;🐰 คลังตัวละคร&quot;
                        {!isCharacterSupportedGame(gameSlug.trim()) && charSel.startsWith('char:') && (
                            <span className="block mt-1 text-amber-700">
                                ⚠ เกมนี้ยังไม่ opt-in ตัวละครจากคลัง — ตั้งค่าได้แต่เกมอาจไม่ใช้
                            </span>
                        )}
                        {charSel.startsWith('char:') && playStyle !== '__unset__' && !gamePlayStyleSupportsCharacter(playStyle) && (
                            <span className="block mt-1 text-amber-700">
                                ⚠ แนวเกมนี้ยังไม่รองรับ sprite จากคลัง — ใช้ได้กับแพลตฟอร์ม 2D เป็นหลัก
                            </span>
                        )}
                        {charSel.startsWith('char:') && (() => {
                            const sheet = (characters ?? []).find((c) => `char:${c.id}` === charSel);
                            const anim = sheet?.animation_config ?? getCharacterAnimPreset('platformer-12');
                            return sheet ? (
                                <span className="block mt-1">
                                    แบบเฟรม: {anim.preset} · walk [{anim.walk.join(',')}] · run [{anim.run.join(',')}]
                                </span>
                            ) : null;
                        })()}
                    </p>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">🎬 คลิปเดโม (หน้ารวมเกม)</label>
                    <VideoUpload currentVideo={previewVideoUrl} onUploadComplete={setPreviewVideoUrl} />
                    <p className="text-xs text-muted-foreground">
                        การ์ดเกมจะโชว์รูปปก ~2 วิ แล้วเล่นคลิปนี้อัตโนมัติ (มิวต์ วน) — ใช้คลิปสั้นเน้นช่วงเล่นจริง · ว่างได้ = โชว์รูปปกเฉย ๆ
                    </p>
                </div>
            </div>

            <DialogFooter>
                <Button variant="ghost" onClick={onCancel} disabled={saving}>ยกเลิก</Button>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> บันทึก...</> : 'บันทึก'}
                </Button>
            </DialogFooter>
        </>
    );
};

// ─── คลังเพลงประกอบกลาง (อัปโหลด mp3 → ใช้ซ้ำรายเกม) ─────────────────────────
const MAX_AUDIO_SIZE = 50 * 1024 * 1024;   // 50 MB (sync กับ bucket educational-hub)

const BgmLibraryDialog = ({ onClose }: { onClose: () => void }) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [busy, setBusy] = useState(false);

    const { data: tracks, isLoading } = useQuery({
        queryKey: ['bgm-tracks'],
        queryFn: async () => {
            const { data, error } = await bgmTracksService.list();
            if (error) throw error;
            return (data ?? []) as BgmTrack[];
        },
    });

    const handleUpload = async () => {
        if (!file) { toast({ title: 'เลือกไฟล์เพลงก่อน', variant: 'destructive' }); return; }
        if (!file.type.startsWith('audio/')) { toast({ title: 'รองรับเฉพาะไฟล์เสียง (mp3)', variant: 'destructive' }); return; }
        if (file.size > MAX_AUDIO_SIZE) { toast({ title: 'ไฟล์ใหญ่เกิน 50 MB', variant: 'destructive' }); return; }
        setBusy(true);
        try {
            const { error } = await bgmTracksService.upload(title || file.name.replace(/\.[^.]+$/, ''), file);
            if (error) throw error;
            setTitle(''); setFile(null);
            queryClient.invalidateQueries({ queryKey: ['bgm-tracks'] });
            toast({ title: 'อัปโหลดเพลงสำเร็จ' });
        } catch (err) {
            toast({ title: 'อัปโหลดไม่สำเร็จ', description: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด', variant: 'destructive' });
        } finally { setBusy(false); }
    };

    const handleDelete = async (t: BgmTrack) => {
        try {
            const { error } = await bgmTracksService.remove(t.id, t.storage_path);
            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ['bgm-tracks'] });
            toast({ title: 'ลบเพลงแล้ว', description: t.title });
        } catch (err) {
            toast({ title: 'ลบไม่สำเร็จ', description: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด', variant: 'destructive' });
        }
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle>🎵 คลังเพลงประกอบ</DialogTitle>
                <DialogDescription>
                    อัปโหลด mp3 เข้าคลังกลาง แล้วเลือกใช้รายเกมได้ที่ "ตั้งค่า" ของแต่ละเกม
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
                <div className="space-y-2 rounded-md border border-border p-3">
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ชื่อเพลง (เว้นว่าง = ใช้ชื่อไฟล์)" />
                    <Input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                    <Button onClick={handleUpload} disabled={busy || !file} className="w-full">
                        {busy ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> กำลังอัปโหลด...</> : <><Plus className="h-4 w-4 mr-1" /> อัปโหลดเพลง</>}
                    </Button>
                </div>

                {isLoading ? (
                    <p className="text-center text-sm text-muted-foreground py-4">กำลังโหลด...</p>
                ) : (tracks ?? []).length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-4">ยังไม่มีเพลงในคลัง</p>
                ) : (
                    <ul className="space-y-2 max-h-[40vh] overflow-y-auto">
                        {tracks!.map((t) => (
                            <li key={t.id} className="flex items-center gap-2 rounded-md border border-border p-2">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{t.title}</p>
                                    <audio controls preload="none" src={t.url} className="mt-1 h-8 w-full" />
                                </div>
                                <Button variant="ghost" size="sm" className="text-destructive shrink-0" onClick={() => handleDelete(t)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <DialogFooter>
                <Button variant="ghost" onClick={onClose}>ปิด</Button>
            </DialogFooter>
        </>
    );
};

// ─── คลัง sprite sheet ตัวละคร ─────────────────────────────────────────────
const MAX_SHEET_SIZE = 10 * 1024 * 1024;

const CharacterLibraryDialog = ({ onClose }: { onClose: () => void }) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [removeBg, setRemoveBg] = useState(true);
    const [bgTolerance] = useState(36);
    const [busy, setBusy] = useState(false);
    const [templateBusy, setTemplateBusy] = useState(false);
    const [editingSheet, setEditingSheet] = useState<CharacterSheet | null>(null);
    const [saveBusy, setSaveBusy] = useState(false);
    const [search, setSearch] = useState('');
    const [styleFilter, setStyleFilter] = useState<GamePlayStyleFilter>('all');
    const [onlyAssigned, setOnlyAssigned] = useState(false);

    const { data: sheets, isLoading } = useQuery({
        queryKey: ['character-sheets'],
        queryFn: async () => {
            const { data, error } = await characterSheetsService.list();
            if (error) throw error;
            return (data ?? []) as CharacterSheet[];
        },
    });

    const { data: gameCounts } = useQuery({
        queryKey: ['character-sheet-game-counts'],
        queryFn: async () => {
            const { data, error } = await characterSheetsService.listSheetGameCounts();
            if (error) throw error;
            return data;
        },
    });

    const filteredSheets = useMemo(() => {
        const list = sheets ?? [];
        const q = search.trim().toLowerCase();
        return list.filter((s) => {
            const anim = parseCharacterAnimationConfig(s.animation_config);
            const style = inferPlayStyleFromAnim(anim);
            if (styleFilter !== 'all' && style !== styleFilter) return false;
            if (onlyAssigned && !(gameCounts?.[s.id] ?? 0)) return false;
            if (!q) return true;
            return s.title.toLowerCase().includes(q)
                || (s.slug?.toLowerCase().includes(q) ?? false)
                || (anim?.preset?.includes(q) ?? false);
        });
    }, [sheets, search, styleFilter, onlyAssigned, gameCounts]);

    const handleDelete = async (s: CharacterSheet) => {
        try {
            const { error } = await characterSheetsService.remove(s);
            if (error) throw error;
            if (editingSheet?.id === s.id) setEditingSheet(null);
            queryClient.invalidateQueries({ queryKey: ['character-sheets'] });
            toast({ title: 'ลบตัวละครแล้ว', description: s.title });
        } catch (err) {
            toast({ title: 'ลบไม่สำเร็จ', description: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด', variant: 'destructive' });
        }
    };

    const handleSaveSheet = async (
        sheet: CharacterSheet,
        payload: {
            title: string;
            frameWidth: number;
            frameHeight: number;
            frameCount: number;
            animationConfig: CharacterAnimationConfig;
            colorConfig: CharacterColorConfig | null;
        },
    ) => {
        setSaveBusy(true);
        try {
            const { sheet: updated, error } = await characterSheetsService.update(sheet.id, {
                title: payload.title,
                frameWidth: payload.frameWidth,
                frameHeight: payload.frameHeight,
                frameCount: payload.frameCount,
                animationConfig: payload.animationConfig,
                colorConfig: payload.colorConfig,
            });
            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ['character-sheets'] });
            queryClient.invalidateQueries({ queryKey: ['edu-hub'] });
            if (updated) setEditingSheet(updated);
            toast({ title: 'บันทึกตัวละครแล้ว', description: 'เกมที่ผูกตัวละครนี้จะใช้ค่าใหม่ทันที' });
        } catch (err) {
            toast({ title: 'บันทึกไม่สำเร็จ', description: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด', variant: 'destructive' });
        } finally {
            setSaveBusy(false);
        }
    };

    const handleDuplicate = async (s: CharacterSheet) => {
        try {
            const { sheet, error } = await characterSheetsService.duplicate(s.id);
            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ['character-sheets'] });
            toast({ title: 'สำเนาตัวละครแล้ว', description: sheet?.title });
            if (sheet) setEditingSheet(sheet);
        } catch (err) {
            toast({ title: 'สำเนาไม่สำเร็จ', description: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด', variant: 'destructive' });
        }
    };

    const handleWizardUpload = async (payload: {
        title: string;
        file: File;
        fileP2: File | null;
        frameWidth: number;
        frameHeight: number;
        frameCount: number;
        animationConfig: CharacterAnimationConfig;
    }) => {
        if (payload.file.size > MAX_SHEET_SIZE) {
            toast({ title: 'ไฟล์ใหญ่เกิน 10 MB', variant: 'destructive' });
            return;
        }
        const animErr = validateAnimationConfig(payload.animationConfig, payload.frameCount);
        if (animErr) {
            toast({ title: 'แบบเฟรมไม่ตรงจำนวน', description: animErr, variant: 'destructive' });
            return;
        }
        setBusy(true);
        try {
            const bgOpts = { tolerance: bgTolerance, mode: 'auto' as const };
            const sheet1 = removeBg ? await processSpriteSheetFile(payload.file, bgOpts) : payload.file;
            const sheet2 = payload.fileP2 && removeBg ? await processSpriteSheetFile(payload.fileP2, bgOpts) : payload.fileP2;
            const { sheet, error } = await characterSheetsService.upload({
                title: payload.title,
                sheetFile: sheet1,
                sheetFileP2: sheet2,
                frameWidth: payload.frameWidth,
                frameHeight: payload.frameHeight,
                frameCount: payload.frameCount,
                animationConfig: payload.animationConfig,
            });
            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ['character-sheets'] });
            toast({ title: 'อัปโหลดตัวละครสำเร็จ' });
            if (sheet) setEditingSheet(sheet);
        } catch (err) {
            toast({ title: 'อัปโหลดไม่สำเร็จ', description: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด', variant: 'destructive' });
        } finally {
            setBusy(false);
        }
    };

    const handleCreateFromTemplate = async (template: CharacterStudioTemplate) => {
        setTemplateBusy(true);
        try {
            const { sheet, error } = await characterSheetsService.createFromTemplate(template.key);
            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ['character-sheets'] });
            toast({ title: 'สร้างจากเทมเพลตแล้ว', description: sheet?.title });
            if (sheet) setEditingSheet(sheet);
        } catch (err) {
            toast({
                title: 'สร้างเทมเพลตไม่สำเร็จ',
                description: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด',
                variant: 'destructive',
            });
        } finally {
            setTemplateBusy(false);
        }
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle>🐰 คลังตัวละคร</DialogTitle>
                <DialogDescription>
                    เทมเพลต · Wizard · Scene thumbnail · Export PNG · ค้นหา/กรอง
                </DialogDescription>
            </DialogHeader>

            {editingSheet ? (
                <div className="space-y-3">
                    <Button type="button" variant="ghost" size="sm" className="h-8 -ml-2" onClick={() => setEditingSheet(null)}>
                        <ArrowLeft className="h-4 w-4 mr-1" /> กลับรายการ
                    </Button>
                    <CharacterSheetStudio
                        key={editingSheet.id + String(editingSheet.created_at)}
                        sheet={editingSheet}
                        busy={saveBusy}
                        onSave={(payload) => handleSaveSheet(editingSheet, payload)}
                    />
                </div>
            ) : (
            <div className="space-y-4">
                <CharacterTemplatePicker busy={templateBusy} onSelect={handleCreateFromTemplate} />
                <CharacterCreationWizard busy={busy} onUpload={handleWizardUpload} />
                <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                    <p className="text-xs text-muted-foreground">ตัดพื้นหลังตอนอัปโหลด (Wizard ขั้น 1)</p>
                    <Switch checked={removeBg} onCheckedChange={setRemoveBg} />
                </div>

                <div className="space-y-2 rounded-md border border-border p-3">
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="ค้นหาชื่อ / slug / preset…"
                        className="h-8 text-xs"
                    />
                    <div className="flex flex-wrap gap-1">
                        <Button
                            type="button"
                            size="sm"
                            variant={styleFilter === 'all' ? 'default' : 'outline'}
                            className="h-7 text-[10px]"
                            onClick={() => setStyleFilter('all')}
                        >
                            ทั้งหมด
                        </Button>
                        {(['platformer-2d', 'top-down', 'jump'] as const).map((key) => (
                            <Button
                                key={key}
                                type="button"
                                size="sm"
                                variant={styleFilter === key ? 'default' : 'outline'}
                                className="h-7 text-[10px]"
                                onClick={() => setStyleFilter(key)}
                            >
                                {gamePlayStyleLabel(key)}
                            </Button>
                        ))}
                        <Button
                            type="button"
                            size="sm"
                            variant={onlyAssigned ? 'default' : 'outline'}
                            className="h-7 text-[10px]"
                            onClick={() => setOnlyAssigned((v) => !v)}
                        >
                            มีเกมผูก
                        </Button>
                    </div>
                </div>

                {isLoading ? (
                    <p className="text-center text-sm text-muted-foreground py-4">กำลังโหลด...</p>
                ) : filteredSheets.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-4">
                        {(sheets ?? []).length === 0 ? 'ยังไม่มีตัวละครในคลัง' : 'ไม่พบตัวละครตามตัวกรอง'}
                    </p>
                ) : (
                    <ul className="space-y-2 max-h-[40vh] overflow-y-auto">
                        {filteredSheets.map((s) => {
                            const anim = parseCharacterAnimationConfig(s.animation_config) ?? getCharacterAnimPreset('platformer-12');
                            const assigned = gameCounts?.[s.id] ?? 0;
                            return (
                                <li key={s.id} className="flex items-center gap-2 rounded-md border border-border p-2">
                                    <div className="shrink-0 w-[88px]">
                                        <CharacterSheetScenePreview
                                            sheetUrl={s.sheet_url}
                                            frameWidth={s.frame_width}
                                            frameHeight={s.frame_height}
                                            frameCount={s.frame_count}
                                            animationConfig={anim}
                                            colorConfig={parseCharacterColorConfig(s.color_config)}
                                            width={88}
                                            height={52}
                                            className="[&_canvas]:max-w-[88px]"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{s.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {s.frame_width}×{s.frame_height} · {s.frame_count} เฟรม · {anim.preset}
                                            {s.sheet_url_p2 ? ' · 2P' : ''}
                                            {assigned > 0 ? ` · ${assigned} เกม` : ''}
                                        </p>
                                    </div>
                                    <Button variant="outline" size="sm" className="shrink-0" title="สำเนา" onClick={() => handleDuplicate(s)}>
                                        <CopyPlus className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" className="shrink-0" onClick={() => setEditingSheet(s)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-destructive shrink-0" onClick={() => handleDelete(s)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
            )}

            <DialogFooter>
                <Button variant="ghost" onClick={() => { setEditingSheet(null); onClose(); }}>ปิด</Button>
            </DialogFooter>
        </>
    );
};

// ─── Dialog (unified create + replace) ──────────────────────────────────────

const createSchema = z.object({
    owner_staff_id: z.string().uuid('กรุณาเลือกครูเจ้าของ'),
    title: z.string().min(1, 'กรุณากรอกชื่อเกม').max(200),
    subject: z.enum(['thai', 'math', 'tech', 'social', 'health', 'arts', 'career', 'english']),
    slug: z
        .string()
        .min(1, 'กรุณากรอก slug')
        .max(60)
        .regex(/^[a-z0-9-]+$/, 'ใช้ a-z, 0-9, - เท่านั้น (ห้ามมีไทย/space)'),
    description: z.string().max(2000).optional().nullable(),
    thumbnail_url: z.string().optional().nullable(),
    preview_video_url: z.string().optional().nullable(),
    grade_levels: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    game_play_style: z.enum(GAME_PLAY_STYLE_KEYS as [string, ...string[]]).optional().nullable(),
});

type CreateValues = z.infer<typeof createSchema>;

type Props =
    | {
          mode: 'create';
          teachers: Teacher[];
          gamesCategoryId: string;
          onSaved: (newItemId?: string) => void;
          onCancel: () => void;
      }
    | {
          mode: 'replace';
          item: EduHubItem;
          onSaved: (newItemId?: string) => void;
          onCancel: () => void;
      };

// title → slug kebab-case (ascii). ชื่อไทยล้วน → fallback timestamp
function slugify(title: string): string {
    const s = title.toLowerCase().normalize('NFKD')
        .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
    return s || `game-${Date.now().toString(36)}`;
}

// ตรวจ HTML เกม: มีการส่งคะแนน (KAMPAI/sendGameEnd) ไหม + ดึง game_slug ที่ฝังไว้
function analyzeGameHtml(text: string): { hasSubmit: boolean; slug: string | null } {
    const hasSubmit = /KAMPAI\s*\.\s*submitScore\s*\(|kampai-sdk\.js|sendGameEnd\s*\(/.test(text);
    const m = text.match(/KAMPAI\s*\.\s*setSlug\s*\(\s*['"]([^'"]+)['"]/)
        || text.match(/const\s+GAME_SLUG\s*=\s*['"]([^'"]+)['"]/);
    const slug = m && !['CHANGE-ME', 'placeholder-slug', 'TODO-CHANGE-ME'].includes(m[1]) ? m[1] : null;
    return { hasSubmit, slug };
}

const GameUploadDialog = (props: Props) => {
    const { toast } = useToast();
    const { staffId: myStaffId, isAdmin } = useAuth();
    const [htmlFile, setHtmlFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    // Input mode: 'file' (upload .html) | 'paste' (paste HTML code, e.g. from Gemini)
    const [inputMode, setInputMode] = useState<'file' | 'paste'>('file');
    const [pastedHtml, setPastedHtml] = useState('');
    const [sdk, setSdk] = useState<{ hasSubmit: boolean; slug: string | null } | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const slugEdited = useRef(false);

    /**
     * Resolve the HTML payload from either file picker or pasted code.
     * Returns a File ready for uploadGameHtml(), or null + toast on validation fail.
     */
    const resolveHtmlFile = (slug: string): File | null => {
        if (inputMode === 'file') {
            if (!htmlFile) {
                toast({ title: 'กรุณาเลือกไฟล์ HTML', variant: 'destructive' });
                return null;
            }
            return htmlFile;
        }
        // paste mode
        const code = pastedHtml.trim();
        if (!code) {
            toast({ title: 'กรุณาวางโค้ด HTML', variant: 'destructive' });
            return null;
        }
        const blob = new Blob([pastedHtml], { type: 'text/html' });
        if (blob.size > MAX_HTML_SIZE) {
            toast({
                title: 'โค้ดยาวเกินกำหนด',
                description: `${(blob.size / 1024 / 1024).toFixed(1)} MB > ${(MAX_HTML_SIZE / 1024 / 1024).toFixed(0)} MB`,
                variant: 'destructive',
            });
            return null;
        }
        return new File([blob], `${slug || 'game'}.html`, { type: 'text/html' });
    };

    // Replace mode — parse existing URL เพื่อ derive subject/slug
    const existing = props.mode === 'replace'
        ? parseGameUrl(props.item.external_url ?? '')
        : null;

    // ── CREATE form ──
    const createForm = useForm<CreateValues>({
        resolver: zodResolver(createSchema),
        defaultValues: {
            owner_staff_id: props.mode === 'create' ? (myStaffId ?? props.teachers[0]?.id ?? '') : '',
            title: '',
            subject: 'thai',
            slug: '',
            description: '',
            thumbnail_url: '',
            preview_video_url: '',
            grade_levels: [],
            tags: [],
            game_play_style: null,
        },
    });

    // อ่านข้อความ HTML ปัจจุบัน (ไฟล์/วางโค้ด)
    const readCurrentHtml = async (): Promise<string> =>
        inputMode === 'paste' ? pastedHtml : (htmlFile ? await htmlFile.text() : '');

    // วิเคราะห์ SDK ทุกครั้งที่ไฟล์/โค้ดเปลี่ยน → เตือนถ้าไม่เก็บคะแนน + ดึง slug ที่ฝัง
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const text = await readCurrentHtml();
            if (cancelled) return;
            setSdk(text.trim() ? analyzeGameHtml(text) : null);
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [htmlFile, pastedHtml, inputMode]);

    // auto-slug จากชื่อ (จนกว่าผู้ใช้จะแก้ slug เอง)
    const titleWatch = createForm.watch('title');
    useEffect(() => {
        if (props.mode !== 'create' || slugEdited.current) return;
        createForm.setValue('slug', slugify(titleWatch || ''));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [titleWatch]);

    // เล่นทดสอบก่อนอัปโหลด (Blob preview — SDK โหลดจาก app origin, ไม่มีข้อมูลนักเรียน)
    const handlePlaytest = async () => {
        const text = await readCurrentHtml();
        if (!text.trim()) { toast({ title: 'ยังไม่มีไฟล์/โค้ดให้ทดสอบ', variant: 'destructive' }); return; }
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(new Blob([text], { type: 'text/html' })));
    };

    const handleHtmlSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (!f.name.toLowerCase().endsWith('.html')) {
            toast({ title: 'รองรับเฉพาะ .html', variant: 'destructive' });
            return;
        }
        if (f.size > MAX_HTML_SIZE) {
            toast({
                title: 'ไฟล์ใหญ่เกินกำหนด',
                description: `ขีดจำกัด ${(MAX_HTML_SIZE / 1024 / 1024).toFixed(0)} MB`,
                variant: 'destructive',
            });
            return;
        }
        setHtmlFile(f);
    };

    // ── CREATE submit ──
    const onCreateSubmit = async (values: CreateValues) => {
        if (props.mode !== 'create') return;
        const file = resolveHtmlFile(values.slug);
        if (!file) return;
        setSaving(true);
        try {
            const info = analyzeGameHtml(await file.text()); // auto game_slug + tracked จาก SDK
            const up = await educationalHubService.uploadGameHtml(values.subject, values.slug, file);
            if (up.error) throw up.error;

            const { data: inserted, error: insErr } = await educationalHubService.insertItem({
                owner_staff_id: values.owner_staff_id,
                category_id: props.gamesCategoryId,
                item_type: 'link',
                title: values.title.trim(),
                description: values.description?.trim() || null,
                thumbnail_url: values.thumbnail_url?.trim() || null,
                preview_video_url: values.preview_video_url?.trim() || null,
                external_url: up.publicUrl,
                subject: SUBJECT_OPTIONS.find((s) => s.folder === values.subject)?.label ?? null,
                grade_levels: values.grade_levels ?? [],
                tags: (values.tags ?? []).map((t) => t.trim()).filter(Boolean),
                game_slug: info.slug,
                tracked_game: !!info.slug,
                is_published: true,
                game_play_style: values.game_play_style ?? null,
            });
            if (insErr) throw insErr;
            props.onSaved((inserted as { id?: string } | null)?.id);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'อัพโหลดล้มเหลว';
            toast({ title: 'อัพโหลดล้มเหลว', description: msg, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    // ── REPLACE submit ──
    const onReplaceSubmit = async () => {
        if (props.mode !== 'replace') return;
        if (!existing?.subject || !existing?.slug) {
            toast({ title: 'URL เดิมไม่ valid', variant: 'destructive' });
            return;
        }
        const file = resolveHtmlFile(existing.slug);
        if (!file) return;
        setSaving(true);
        try {
            const { error } = await educationalHubService.replaceGameHtml(
                props.item.id,
                existing.subject,
                existing.slug,
                file,
            );
            if (error) throw error;
            props.onSaved();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'อัพเดทล้มเหลว';
            toast({ title: 'อัพเดทล้มเหลว', description: msg, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    // ─── RENDER: Replace mode ───
    if (props.mode === 'replace') {
        return (
            <>
                <DialogHeader>
                    <DialogTitle>อัพเดทเกม v.2 — {props.item.title}</DialogTitle>
                    <DialogDescription>
                        ไฟล์ใหม่จะ <strong>ทับ v.1 ทันที</strong> URL คงเดิม (แค่ bump ?v=… กัน browser cache)
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="rounded-md border border-border bg-muted/30 p-3 text-xs space-y-1">
                        <p><span className="text-muted-foreground">หมวด:</span> {subjectLabel(existing?.subject ?? null)}</p>
                        <p><span className="text-muted-foreground">Slug:</span> <code>{existing?.slug}.html</code></p>
                        <p className="truncate">
                            <span className="text-muted-foreground">URL:</span>{' '}
                            <a href={props.item.external_url ?? '#'} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                {props.item.external_url}
                            </a>
                        </p>
                    </div>

                    <HtmlInput
                        label="ไฟล์ HTML ใหม่ (v.2)"
                        inputMode={inputMode}
                        setInputMode={setInputMode}
                        htmlFile={htmlFile}
                        handleHtmlSelect={handleHtmlSelect}
                        pastedHtml={pastedHtml}
                        setPastedHtml={setPastedHtml}
                    />

                    {sdk && (
                        <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-muted/40 p-3">
                            <div className="flex items-start gap-2 text-sm">
                                {sdk.hasSubmit ? (
                                    <>
                                        <Check className="h-4 w-4 mt-0.5 shrink-0 text-green-600" />
                                        <p className="font-medium text-foreground">เชื่อม KAMPAI SDK แล้ว — เก็บคะแนนได้</p>
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
                                        <p className="font-medium text-foreground">ไฟล์ใหม่จะไม่เก็บคะแนน (ไม่พบ KAMPAI SDK)</p>
                                    </>
                                )}
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={handlePlaytest} className="shrink-0">
                                <ExternalLink className="h-4 w-4 mr-1" /> เล่นทดสอบ
                            </Button>
                        </div>
                    )}

                    <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <p>การ replace เป็นแบบ overwrite — v.1 จะหายถาวร (ไม่มี rollback)</p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={props.onCancel} disabled={saving}>ยกเลิก</Button>
                    <Button onClick={onReplaceSubmit} disabled={saving || (inputMode === 'file' ? !htmlFile : !pastedHtml.trim())}>
                        {saving ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> กำลังอัพโหลด...</> : 'อัพเดท v.2'}
                    </Button>
                </DialogFooter>

                <Dialog
                    open={!!previewUrl}
                    onOpenChange={(open) => {
                        if (!open && previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
                    }}
                >
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>เล่นทดสอบ (ตัวอย่าง)</DialogTitle>
                            <DialogDescription>เล่นจากไฟล์ก่อนอัปเดต — ไม่มีข้อมูลนักเรียนจริง/ไม่บันทึกคะแนน</DialogDescription>
                        </DialogHeader>
                        {previewUrl && (
                            <iframe
                                src={previewUrl}
                                title="game-playtest"
                                className="w-full rounded-md border border-border"
                                style={{ height: '70vh' }}
                            />
                        )}
                    </DialogContent>
                </Dialog>
            </>
        );
    }

    // ─── RENDER: Create mode ───
    return (
        <>
            <DialogHeader>
                <DialogTitle>อัพโหลดเกม HTML ใหม่</DialogTitle>
                <DialogDescription>เกมจะถูกเก็บใน Supabase Storage และเชื่อมเข้าหมวด &quot;คลังเกมการศึกษา&quot;</DialogDescription>
            </DialogHeader>

            <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                    <FormField
                        control={createForm.control}
                        name="owner_staff_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>เจ้าของ (ครู)</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange} disabled={!isAdmin}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="เลือกครู" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {props.teachers.map((t) => (
                                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {!isAdmin && (
                                    <FormDescription className="text-[10px]">เกมจะบันทึกในชื่อของคุณ</FormDescription>
                                )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={createForm.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>ชื่อเกม</FormLabel>
                                <FormControl><Input {...field} placeholder="เช่น Pizza Master Chef" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <FormField
                            control={createForm.control}
                            name="subject"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>หมวด</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {SUBJECT_OPTIONS.map((s) => (
                                                <SelectItem key={s.folder} value={s.folder}>{s.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={createForm.control}
                            name="slug"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Slug (ชื่อไฟล์)</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="pizza-master-chef"
                                            onChange={(e) => { slugEdited.current = true; field.onChange(e); }}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-[10px]">สร้างจากชื่ออัตโนมัติ · a-z, 0-9, - เท่านั้น</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={createForm.control}
                        name="game_play_style"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>แนวเกม</FormLabel>
                                <Select
                                    value={field.value ?? '__unset__'}
                                    onValueChange={(v) => field.onChange(v === '__unset__' ? null : v)}
                                >
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="เลือกแนวเกม" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="__unset__">ยังไม่ระบุ (ตั้งทีหลังได้)</SelectItem>
                                        {GAME_PLAY_STYLE_OPTIONS.map((o) => (
                                            <SelectItem key={o.key} value={o.key}>
                                                {o.emoji} {o.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormDescription className="text-[10px]">
                                    ใช้กรองรายการในแท็บเกม — เลือกให้ตรงการเล่นจริง
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <HtmlInput
                        label="ไฟล์ HTML"
                        inputMode={inputMode}
                        setInputMode={setInputMode}
                        htmlFile={htmlFile}
                        handleHtmlSelect={handleHtmlSelect}
                        pastedHtml={pastedHtml}
                        setPastedHtml={setPastedHtml}
                    />

                    {sdk && (
                        <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-muted/40 p-3">
                            <div className="flex items-start gap-2 text-sm">
                                {sdk.hasSubmit ? (
                                    <>
                                        <Check className="h-4 w-4 mt-0.5 shrink-0 text-green-600" />
                                        <div>
                                            <p className="font-medium text-foreground">เชื่อม KAMPAI SDK แล้ว — เก็บคะแนนได้</p>
                                            {sdk.slug && (
                                                <p className="text-xs text-muted-foreground">game_slug: <code>{sdk.slug}</code> (เปิด tracked อัตโนมัติ)</p>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
                                        <div>
                                            <p className="font-medium text-foreground">เกมนี้จะไม่เก็บคะแนน</p>
                                            <p className="text-xs text-muted-foreground">ไม่พบ <code>KAMPAI.submitScore</code> / <code>kampai-sdk.js</code> — อัปโหลดได้ แต่จะไม่บันทึกคะแนนนักเรียน</p>
                                        </div>
                                    </>
                                )}
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={handlePlaytest} className="shrink-0">
                                <ExternalLink className="h-4 w-4 mr-1" /> เล่นทดสอบ
                            </Button>
                        </div>
                    )}

                    <FormField
                        control={createForm.control}
                        name="thumbnail_url"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>รูปปก (ไม่บังคับ)</FormLabel>
                                <FormControl>
                                    <ImageUpload
                                        bucket="educational-hub"
                                        folder={`${createForm.watch('owner_staff_id') || 'shared'}/thumbs`}
                                        currentImage={field.value ?? ''}
                                        compressionPreset="cover"
                                        onUploadComplete={(url) => field.onChange(url)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={createForm.control}
                        name="preview_video_url"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>🎬 คลิปเดโม (ไม่บังคับ)</FormLabel>
                                <FormControl>
                                    <VideoUpload
                                        folder={`${createForm.watch('owner_staff_id') || 'shared'}/previews`}
                                        currentVideo={field.value ?? ''}
                                        onUploadComplete={(url) => field.onChange(url)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={createForm.control}
                        name="tags"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>แท็ก</FormLabel>
                                <FormControl>
                                    <TagPicker
                                        subject={SUBJECT_OPTIONS.find((s) => s.folder === createForm.watch('subject'))?.label}
                                        value={field.value ?? []}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormDescription className="text-[10px]">
                                    คลิกแท็กแนะนำหรือพิมพ์แท็กใหม่ + Enter
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={createForm.control}
                        name="grade_levels"
                        render={() => (
                            <FormItem>
                                <FormLabel>ระดับชั้น</FormLabel>
                                <div className="flex flex-wrap gap-2">
                                    {GRADE_OPTIONS.map((g) => {
                                        const selected = createForm.watch('grade_levels')?.includes(g);
                                        return (
                                            <button
                                                type="button"
                                                key={g}
                                                onClick={() => {
                                                    const current = createForm.getValues('grade_levels') ?? [];
                                                    const next = current.includes(g)
                                                        ? current.filter((x) => x !== g)
                                                        : [...current, g];
                                                    createForm.setValue('grade_levels', next);
                                                }}
                                                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                                    selected
                                                        ? 'bg-primary text-primary-foreground border-primary'
                                                        : 'bg-card text-foreground border-border hover:bg-accent'
                                                }`}
                                            >
                                                {g}
                                            </button>
                                        );
                                    })}
                                </div>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={createForm.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>คำอธิบาย (ไม่บังคับ)</FormLabel>
                                <FormControl><Textarea {...field} value={field.value ?? ''} rows={2} /></FormControl>
                            </FormItem>
                        )}
                    />

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={props.onCancel} disabled={saving}>ยกเลิก</Button>
                        <Button type="submit" disabled={saving || (inputMode === 'file' ? !htmlFile : !pastedHtml.trim())}>
                            {saving ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> กำลังอัพโหลด...</> : 'อัพโหลด'}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>

            <Dialog
                open={!!previewUrl}
                onOpenChange={(open) => {
                    if (!open && previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
                }}
            >
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>เล่นทดสอบ (ตัวอย่าง)</DialogTitle>
                        <DialogDescription>เล่นจากไฟล์ก่อนอัปโหลด — ไม่มีข้อมูลนักเรียนจริง/ไม่บันทึกคะแนน</DialogDescription>
                    </DialogHeader>
                    {previewUrl && (
                        <iframe
                            src={previewUrl}
                            title="game-playtest"
                            className="w-full rounded-md border border-border"
                            style={{ height: '70vh' }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

// ─── HtmlInput: shared file/paste toggle for both create + replace modes ───
const HtmlInput = ({
    label,
    inputMode,
    setInputMode,
    htmlFile,
    handleHtmlSelect,
    pastedHtml,
    setPastedHtml,
}: {
    label: string;
    inputMode: 'file' | 'paste';
    setInputMode: (m: 'file' | 'paste') => void;
    htmlFile: File | null;
    handleHtmlSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    pastedHtml: string;
    setPastedHtml: (v: string) => void;
}) => {
    const pasteBytes = new Blob([pastedHtml]).size;
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">{label}</label>

            {/* Mode toggle */}
            <div className="inline-flex rounded-md border border-border overflow-hidden text-xs">
                <button
                    type="button"
                    onClick={() => setInputMode('file')}
                    className={cn(
                        'px-3 py-1.5 font-medium transition-colors',
                        inputMode === 'file'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card text-foreground hover:bg-accent',
                    )}
                >
                    📁 อัพโหลดไฟล์
                </button>
                <button
                    type="button"
                    onClick={() => setInputMode('paste')}
                    className={cn(
                        'px-3 py-1.5 font-medium transition-colors border-l border-border',
                        inputMode === 'paste'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card text-foreground hover:bg-accent',
                    )}
                >
                    📋 วางโค้ด
                </button>
            </div>

            {/* Conditional input */}
            {inputMode === 'file' ? (
                <>
                    <Input type="file" accept=".html" onChange={handleHtmlSelect} />
                    {htmlFile && (
                        <p className="text-xs text-muted-foreground">
                            เลือกแล้ว: {htmlFile.name} ({(htmlFile.size / 1024).toFixed(1)} KB)
                        </p>
                    )}
                </>
            ) : (
                <>
                    <Textarea
                        value={pastedHtml}
                        onChange={(e) => setPastedHtml(e.target.value)}
                        placeholder={'วางโค้ด HTML ของเกมที่นี่...\n\n<!DOCTYPE html>\n<html lang="th">\n  ...\n</html>'}
                        className="font-mono text-xs h-64 resize-y"
                        rows={20}
                        spellCheck={false}
                    />
                    <p className="text-[10px] text-muted-foreground flex items-center justify-between">
                        <span>🤖 วางโค้ดจาก AI (Gemini / Claude / ChatGPT) ได้</span>
                        <span className={cn(pasteBytes > MAX_HTML_SIZE && 'text-destructive font-semibold')}>
                            {pasteBytes.toLocaleString()} / {MAX_HTML_SIZE.toLocaleString()} bytes
                        </span>
                    </p>
                </>
            )}
        </div>
    );
};
