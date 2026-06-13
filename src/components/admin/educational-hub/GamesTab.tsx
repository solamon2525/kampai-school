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
import { ExternalLink, Plus, RefreshCw, AlertTriangle, Loader2, Trash2, RotateCcw, Settings, Code2, ChevronDown, Copy, Check, Download, Image as ImageIcon, ClipboardList } from 'lucide-react';
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
    gameDocsService,
    type EduHubItem,
    type BgmTrack,
    type GameDoc,
} from '@/services/educational-hub.service';
import { gamePlayService } from '@/services/game-play.service';

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

function AiGameKit() {
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
                    <Button asChild size="sm" variant="ghost">
                        <a href="/GAME-PROMPT.md" target="_blank" rel="noreferrer">
                            <ExternalLink className="h-3.5 w-3.5 mr-1" /> ดู Prompt
                        </a>
                    </Button>
                </div>
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
        | { mode: 'bgm' }
        | null
    >(null);
    const [confirmAction, setConfirmAction] = useState<
        | { type: 'delete'; item: EduHubItem }
        | { type: 'reset'; item: EduHubItem }
        | null
    >(null);

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

    const teacherById = useMemo(() => {
        const map = new Map<string, Teacher>();
        (teachers ?? []).forEach((t) => map.set(t.id, t));
        return map;
    }, [teachers]);

    const handleSaved = () => {
        queryClient.invalidateQueries({ queryKey: ['edu-hub', 'all-games'] });
        queryClient.invalidateQueries({ queryKey: ['edu-hub'] });
        setDialog(null);
        toast({ title: 'บันทึกสำเร็จ' });
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
                    <Button variant="outline" onClick={() => setDialog({ mode: 'bgm' })}>
                        🎵 คลังเพลง
                    </Button>
                    <Button onClick={() => setDialog({ mode: 'create' })} disabled={!gamesCategoryId}>
                        <Plus className="h-4 w-4 mr-1" /> อัพโหลดเกมใหม่
                    </Button>
                </div>
            </div>

            <AiGameKit />
            <CoverStandardKit />
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
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b border-border bg-muted/30">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">ปก</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">ชื่อเกม</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">ประเภท</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">หมวด</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">เจ้าของ</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">URL</th>
                                        <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">การจัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items!.map((item) => {
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
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-violet-600 border-violet-200 hover:bg-violet-50"
                                                            onClick={() => setDialog({ mode: 'docs', item })}
                                                        >
                                                            <ClipboardList className="h-3 w-3 mr-1" /> รายละเอียด
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
                    (dialog?.mode === 'settings' || dialog?.mode === 'bgm') ? 'max-w-md' : 'max-w-2xl',
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
                    {dialog?.mode === 'bgm' && (
                        <BgmLibraryDialog onClose={() => setDialog(null)} />
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
    const [saving, setSaving] = useState(false);

    const { data: tracks } = useQuery({
        queryKey: ['bgm-tracks'],
        queryFn: async () => {
            const { data } = await bgmTracksService.list();
            return (data ?? []) as BgmTrack[];
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
            const { error } = await educationalHubService.updateItem(item.id, {
                game_slug: gameSlug.trim() || null,
                tracked_game: tracked,
                is_published: published,
                ...bgm,
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

// ─── รายละเอียดเกม (Game Docs) ────────────────────────────────────────────────
// สเปกเดียวต่อเกม แก้ทับได้ — เห็นเฉพาะเจ้าของเกม + admin (RLS); ไม่ล็อกอิน = ได้ 0 แถว
const GameDocsDialog = ({
    item,
    onClose,
}: {
    item: EduHubItem;
    onClose: () => void;
}) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [format, setFormat] = useState('');
    const [featuresText, setFeaturesText] = useState('');
    const [version, setVersion] = useState('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    const { data: doc, isLoading } = useQuery({
        queryKey: ['game-docs', item.id],
        queryFn: async () => {
            const { data, error } = await gameDocsService.getByItem(item.id);
            if (error) throw error;
            return (data as GameDoc | null) ?? null;
        },
    });

    // เติมค่าเดิมเมื่อโหลดเสร็จ
    useEffect(() => {
        if (doc) {
            setFormat(doc.game_format ?? '');
            setFeaturesText((doc.features ?? []).join('\n'));
            setVersion(doc.version ?? '');
            setNotes(doc.notes ?? '');
        }
    }, [doc]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const features = featuresText
                .split('\n')
                .map((f) => f.trim())
                .filter(Boolean);
            const { error } = await gameDocsService.upsert({
                item_id: item.id,
                owner_staff_id: item.owner_staff_id,
                game_format: format.trim() || null,
                features,
                version: version.trim() || null,
                notes: notes.trim() || null,
            });
            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ['game-docs', item.id] });
            toast({ title: 'บันทึกรายละเอียดเกมสำเร็จ' });
            onClose();
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
                <DialogTitle>รายละเอียดเกม — {item.title}</DialogTitle>
                <DialogDescription>
                    บันทึกรูปแบบ ฟีเจอร์ และเวอร์ชันของเกม — เห็นเฉพาะเจ้าของเกมและผู้ดูแลระบบ
                    (ต้องอัปเดตทุกครั้งที่สร้าง/แก้เกม)
                </DialogDescription>
            </DialogHeader>

            {isLoading ? (
                <div className="py-10 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 mx-auto animate-spin" />
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">รูปแบบเกม</label>
                        <Input
                            value={format}
                            onChange={(e) => setFormat(e.target.value)}
                            placeholder="เช่น ตอบคำถาม/quiz, จับคู่, platformer, ลากวาง"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">ฟีเจอร์ในเกม</label>
                        <Textarea
                            value={featuresText}
                            onChange={(e) => setFeaturesText(e.target.value)}
                            rows={5}
                            placeholder={'บรรทัดละ 1 ฟีเจอร์ เช่น\nเสียงไทย TTS\nโหมดศึกษา\nเล่นออนไลน์'}
                        />
                        <p className="text-xs text-muted-foreground">บรรทัดละ 1 ฟีเจอร์</p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">เวอร์ชันบิลด์ล่าสุด</label>
                        <Input
                            value={version}
                            onChange={(e) => setVersion(e.target.value)}
                            placeholder="เช่น v1.2.0"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">บันทึก / changelog ย่อ (ไม่บังคับ)</label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            placeholder="สรุปสิ่งที่เปลี่ยนในเวอร์ชันนี้"
                        />
                    </div>

                    {doc?.updated_at && (
                        <p className="text-[11px] text-muted-foreground">
                            แก้ไขล่าสุด: {new Date(doc.updated_at).toLocaleString('th-TH')}
                        </p>
                    )}
                </div>
            )}

            <DialogFooter>
                <Button variant="ghost" onClick={onClose} disabled={saving}>ยกเลิก</Button>
                <Button onClick={handleSave} disabled={saving || isLoading}>
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

// ─── Dialog (unified create + replace) ──────────────────────────────────────

const createSchema = z.object({
    owner_staff_id: z.string().uuid('กรุณาเลือกครูเจ้าของ'),
    title: z.string().min(1, 'กรุณากรอกชื่อเกม').max(200),
    subject: z.enum(['math', 'tech', 'thai']),
    slug: z
        .string()
        .min(1, 'กรุณากรอก slug')
        .max(60)
        .regex(/^[a-z0-9-]+$/, 'ใช้ a-z, 0-9, - เท่านั้น (ห้ามมีไทย/space)'),
    description: z.string().max(2000).optional().nullable(),
    thumbnail_url: z.string().optional().nullable(),
    grade_levels: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
});

type CreateValues = z.infer<typeof createSchema>;

type Props =
    | {
          mode: 'create';
          teachers: Teacher[];
          gamesCategoryId: string;
          onSaved: () => void;
          onCancel: () => void;
      }
    | {
          mode: 'replace';
          item: EduHubItem;
          onSaved: () => void;
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
            grade_levels: [],
            tags: [],
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

            const { error: insErr } = await educationalHubService.insertItem({
                owner_staff_id: values.owner_staff_id,
                category_id: props.gamesCategoryId,
                item_type: 'link',
                title: values.title.trim(),
                description: values.description?.trim() || null,
                thumbnail_url: values.thumbnail_url?.trim() || null,
                external_url: up.publicUrl,
                subject: SUBJECT_OPTIONS.find((s) => s.folder === values.subject)?.label ?? null,
                grade_levels: values.grade_levels ?? [],
                tags: (values.tags ?? []).map((t) => t.trim()).filter(Boolean),
                game_slug: info.slug,
                tracked_game: !!info.slug,
                is_published: true,
            });
            if (insErr) throw insErr;
            props.onSaved();
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
