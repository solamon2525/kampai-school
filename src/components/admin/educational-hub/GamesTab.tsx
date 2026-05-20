/**
 * GamesTab.tsx — Admin-only tab สำหรับจัดการ HTML game files
 *
 * แสดงเฉพาะ items ที่ external_url ชี้ไป Supabase Storage bucket `edu-hub-games`
 * (ไม่แสดงเกม `/games/...` แบบเดิมที่ยังอยู่ใน git)
 *
 * Features:
 * - อัพโหลดเกมใหม่ → upload HTML + cover + create educational_hub_items row
 * - อัพเดท v.2 → upload HTML ทับไฟล์เดิม (path เดียวกัน) + bump ?v=timestamp
 *
 * Auth: ทั้ง tab อยู่ใน `/admin/dashboard/educational-hub` ซึ่ง gate ด้วย ProtectedRoute
 * และ Storage RLS (migration 063) บังคับ admin-only เพิ่มอีกชั้น
 */

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Plus, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
    educationalHubService,
    type EduHubItem,
} from '@/services/educational-hub.service';

// ─── Constants ──────────────────────────────────────────────────────────────

/** Subject folder slug → human label (ใช้ใน UI + map กับ public/games/{folder}/) */
const SUBJECT_OPTIONS = [
    { folder: 'math', label: 'คณิตศาสตร์' },
    { folder: 'tech', label: 'เทคโนโลยี' },
    { folder: 'thai', label: 'ภาษาไทย' },
] as const;

type SubjectFolder = (typeof SUBJECT_OPTIONS)[number]['folder'];

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
        | null
    >(null);

    // List items ที่ external_url ขึ้นต้นด้วย Storage URL
    const { data: items, isLoading } = useQuery({
        queryKey: ['edu-hub', 'storage-games'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('educational_hub_items' as never)
                .select('*')
                .eq('item_type', 'link')
                .like('external_url', `%${STORAGE_URL_MARKER}%`)
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
        queryClient.invalidateQueries({ queryKey: ['edu-hub', 'storage-games'] });
        queryClient.invalidateQueries({ queryKey: ['edu-hub'] });
        setDialog(null);
        toast({ title: 'บันทึกสำเร็จ' });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">เกม HTML (Supabase Storage)</h2>
                    <p className="text-sm text-muted-foreground">
                        อัพโหลดและรีเพลซเกม single-file HTML — v.1 → v.2 ทับไฟล์เดิม URL คงเดิม (เพิ่ม ?v=… กัน cache)
                    </p>
                </div>
                <Button onClick={() => setDialog({ mode: 'create' })} disabled={!gamesCategoryId}>
                    <Plus className="h-4 w-4 mr-1" /> อัพโหลดเกมใหม่
                </Button>
            </div>

            {isLoading ? (
                <div className="text-center text-muted-foreground py-12">กำลังโหลด...</div>
            ) : (items ?? []).length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center space-y-2">
                        <p className="text-muted-foreground">ยังไม่มีเกมใน Storage</p>
                        <p className="text-xs text-muted-foreground">
                            เกมเก่าใน `/games/...` (git) จะไม่ปรากฏที่นี่ — ต้อง migrate ก่อน
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
                                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">หมวด</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">เจ้าของ</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">URL</th>
                                        <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">การจัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items!.map((item) => {
                                        const { subject, slug } = parseGameUrl(item.external_url ?? '');
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
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setDialog({ mode: 'replace', item })}
                                                    >
                                                        <RefreshCw className="h-3 w-3 mr-1" /> อัพเดท v.2
                                                    </Button>
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
                <DialogContent className="max-w-2xl">
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
                </DialogContent>
            </Dialog>
        </div>
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

const GameUploadDialog = (props: Props) => {
    const { toast } = useToast();
    const [htmlFile, setHtmlFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    // Input mode: 'file' (upload .html) | 'paste' (paste HTML code, e.g. from Gemini)
    const [inputMode, setInputMode] = useState<'file' | 'paste'>('file');
    const [pastedHtml, setPastedHtml] = useState('');

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
            owner_staff_id: props.mode === 'create' && props.teachers[0]?.id || '',
            title: '',
            subject: 'thai',
            slug: '',
            description: '',
            thumbnail_url: '',
        },
    });

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
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="เลือกครู" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {props.teachers.map((t) => (
                                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                                    <FormControl><Input {...field} placeholder="pizza-master-chef" /></FormControl>
                                    <FormDescription className="text-[10px]">a-z, 0-9, - เท่านั้น</FormDescription>
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
