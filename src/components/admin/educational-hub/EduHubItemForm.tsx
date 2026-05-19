import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, FileText, ExternalLink as LinkIcon, Youtube, Type } from 'lucide-react';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/admin/shared/ImageUpload';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import {
    educationalHubService,
    extractYoutubeId,
    youtubeThumbnail,
    type EduHubItem,
    type EduHubCategory,
    type EduHubItemType,
} from '@/services/educational-hub.service';
import { SUBJECT_OPTIONS } from '@/lib/edu-hub-subjects';
import { TagPicker } from './TagPicker';

const GRADE_OPTIONS = ['อ.1', 'อ.2', 'อ.3', 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];

const schema = z.object({
    item_type: z.enum(['file', 'link', 'youtube', 'text']),
    category_id: z.string().uuid({ message: 'กรุณาเลือกหมวดหมู่' }),
    title: z.string().min(1, 'กรุณากรอกชื่อรายการ').max(200),
    description: z.string().max(2000).optional().nullable(),
    thumbnail_url: z.string().url().optional().nullable().or(z.literal('')),
    file_url: z.string().optional().nullable(),
    file_name: z.string().optional().nullable(),
    file_size: z.number().optional().nullable(),
    file_mime: z.string().optional().nullable(),
    external_url: z.string().optional().nullable(),
    youtube_url_input: z.string().optional().nullable(),
    youtube_id: z.string().optional().nullable(),
    body_html: z.string().optional().nullable(),
    subject: z.string().optional().nullable(),
    grade_levels: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    is_published: z.boolean().default(true),
}).superRefine((val, ctx) => {
    if (val.item_type === 'file' && !val.file_url) {
        ctx.addIssue({ code: 'custom', path: ['file_url'], message: 'กรุณาอัปโหลดไฟล์' });
    }
    if (val.item_type === 'link' && !val.external_url) {
        ctx.addIssue({ code: 'custom', path: ['external_url'], message: 'กรุณากรอก URL' });
    }
    if (val.item_type === 'link' && val.external_url && !/^(https?:\/\/|\/)/i.test(val.external_url)) {
        ctx.addIssue({ code: 'custom', path: ['external_url'], message: 'URL ต้องขึ้นต้นด้วย http(s):// หรือ /' });
    }
    if (val.item_type === 'youtube' && !val.youtube_id) {
        ctx.addIssue({ code: 'custom', path: ['youtube_url_input'], message: 'URL ไม่ใช่ลิงก์ YouTube ที่ถูกต้อง' });
    }
    if (val.item_type === 'text' && (!val.body_html || val.body_html.trim().length === 0)) {
        ctx.addIssue({ code: 'custom', path: ['body_html'], message: 'กรุณากรอกเนื้อหา' });
    }
});

type FormValues = z.infer<typeof schema>;

interface Props {
    ownerStaffId: string;
    categories: EduHubCategory[];
    initial?: EduHubItem | null;
    onSaved: () => void;
    onCancel?: () => void;
}

export const EduHubItemForm = ({ ownerStaffId, categories, initial, onSaved, onCancel }: Props) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            item_type: initial?.item_type ?? 'file',
            category_id: initial?.category_id ?? categories[0]?.id ?? '',
            title: initial?.title ?? '',
            description: initial?.description ?? '',
            thumbnail_url: initial?.thumbnail_url ?? '',
            file_url: initial?.file_url ?? '',
            file_name: initial?.file_name ?? '',
            file_size: initial?.file_size ?? null,
            file_mime: initial?.file_mime ?? '',
            external_url: initial?.external_url ?? '',
            youtube_url_input: initial?.youtube_id ? `https://youtu.be/${initial.youtube_id}` : '',
            youtube_id: initial?.youtube_id ?? '',
            body_html: initial?.body_html ?? '',
            subject: initial?.subject ?? '',
            grade_levels: initial?.grade_levels ?? [],
            tags: initial?.tags ?? [],
            is_published: initial?.is_published ?? true,
        },
    });

    const itemType = form.watch('item_type') as EduHubItemType;
    const watchedThumb = form.watch('thumbnail_url');
    const watchedYtId = form.watch('youtube_id');

    // Auto-derive youtube_id from URL input
    const ytInput = form.watch('youtube_url_input');
    useEffect(() => {
        if (itemType !== 'youtube') return;
        const id = ytInput ? extractYoutubeId(ytInput) : null;
        if (id !== form.getValues('youtube_id')) {
            form.setValue('youtube_id', id ?? '', { shouldValidate: true });
        }
    }, [ytInput, itemType, form]);

    const handleFileUpload = async (file: File) => {
        setUploading(true);
        try {
            const { url, error } = await educationalHubService.uploadFile(`${ownerStaffId}/files`, file);
            if (error) throw error;
            form.setValue('file_url', url, { shouldValidate: true });
            form.setValue('file_name', file.name);
            form.setValue('file_size', file.size);
            form.setValue('file_mime', file.type);
            if (!form.getValues('title')) {
                form.setValue('title', file.name.replace(/\.[^.]+$/, ''));
            }
            toast({ title: 'อัปโหลดไฟล์สำเร็จ' });
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'อัปโหลดล้มเหลว';
            toast({ title: 'อัปโหลดล้มเหลว', description: msg, variant: 'destructive' });
        } finally {
            setUploading(false);
        }
    };

    const onSubmit = async (values: FormValues) => {
        setSaving(true);
        try {
            // Tags เป็น array อยู่แล้ว (จาก TagPicker) — แค่ trim + filter empty
            const tagsArray = (values.tags ?? [])
                .map((t) => t.trim())
                .filter(Boolean);

            const payload: Partial<EduHubItem> = {
                owner_staff_id: ownerStaffId,
                category_id: values.category_id,
                item_type: values.item_type,
                title: values.title.trim(),
                description: values.description?.trim() || null,
                thumbnail_url: values.thumbnail_url?.trim() || null,
                file_url: values.item_type === 'file' ? values.file_url || null : null,
                file_name: values.item_type === 'file' ? values.file_name || null : null,
                file_size: values.item_type === 'file' ? values.file_size ?? null : null,
                file_mime: values.item_type === 'file' ? values.file_mime || null : null,
                external_url: values.item_type === 'link' ? values.external_url?.trim() || null : null,
                youtube_id: values.item_type === 'youtube' ? values.youtube_id || null : null,
                body_html: values.item_type === 'text' ? values.body_html?.trim() || null : null,
                subject: values.subject?.trim() || null,
                grade_levels: values.grade_levels,
                tags: tagsArray,
                is_published: values.is_published,
            };

            const res = initial
                ? await educationalHubService.updateItem(initial.id, payload)
                : await educationalHubService.insertItem(payload);

            if (res.error) throw res.error;

            await queryClient.invalidateQueries({ queryKey: ['edu-hub', 'items', ownerStaffId] });
            await queryClient.invalidateQueries({ queryKey: ['edu-hub', 'items'] });
            await queryClient.invalidateQueries({ queryKey: ['edu-hub', 'teachers'] });

            toast({ title: initial ? 'แก้ไขรายการสำเร็จ' : 'เพิ่มรายการสำเร็จ' });
            onSaved();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'บันทึกล้มเหลว';
            toast({ title: 'บันทึกล้มเหลว', description: msg, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const toggleGrade = (g: string) => {
        const current = form.getValues('grade_levels') ?? [];
        const next = current.includes(g) ? current.filter((x) => x !== g) : [...current, g];
        form.setValue('grade_levels', next);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Item Type Selector */}
                <FormField
                    control={form.control}
                    name="item_type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>ประเภทรายการ</FormLabel>
                            <div className="grid grid-cols-4 gap-2">
                                {([
                                    { key: 'file', label: 'ไฟล์', icon: FileText },
                                    { key: 'link', label: 'ลิงก์', icon: LinkIcon },
                                    { key: 'youtube', label: 'YouTube', icon: Youtube },
                                    { key: 'text', label: 'ข้อความ', icon: Type },
                                ] as const).map(({ key, label, icon: Icon }) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => field.onChange(key)}
                                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors ${
                                            field.value === key
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'bg-card hover:bg-accent border-border'
                                        }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span className="text-xs font-medium">{label}</span>
                                    </button>
                                ))}
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Type-specific source field */}
                {itemType === 'file' && (
                    <FormField
                        control={form.control}
                        name="file_url"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>ไฟล์ <span className="text-destructive">*</span></FormLabel>
                                {field.value ? (
                                    <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/30">
                                        <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {form.watch('file_name') ?? 'ไฟล์'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {(form.watch('file_size') ?? 0) > 0
                                                    ? `${((form.watch('file_size') ?? 0) / 1024 / 1024).toFixed(2)} MB`
                                                    : ''}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                form.setValue('file_url', '');
                                                form.setValue('file_name', '');
                                                form.setValue('file_size', null);
                                                form.setValue('file_mime', '');
                                            }}
                                        >
                                            เปลี่ยน
                                        </Button>
                                    </div>
                                ) : (
                                    <FormControl>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="file"
                                                disabled={uploading}
                                                onChange={(e) => {
                                                    const f = e.target.files?.[0];
                                                    if (f) handleFileUpload(f);
                                                }}
                                            />
                                            {uploading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                                        </div>
                                    </FormControl>
                                )}
                                <FormDescription>PDF, รูป, วิดีโอ, doc/ppt/xls — สูงสุด 50 MB</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {itemType === 'link' && (
                    <FormField
                        control={form.control}
                        name="external_url"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>URL ลิงก์ภายนอก <span className="text-destructive">*</span></FormLabel>
                                <FormControl>
                                    <Input
                                        type="url"
                                        placeholder="https://wordwall.net/... หรือ https://quizizz.com/..."
                                        {...field}
                                        value={field.value ?? ''}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {itemType === 'youtube' && (
                    <>
                        <FormField
                            control={form.control}
                            name="youtube_url_input"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>YouTube URL <span className="text-destructive">*</span></FormLabel>
                                    <FormControl>
                                        <Input
                                            type="url"
                                            placeholder="https://www.youtube.com/watch?v=... หรือ https://youtu.be/..."
                                            {...field}
                                            value={field.value ?? ''}
                                        />
                                    </FormControl>
                                    {watchedYtId && (
                                        <div className="mt-2 aspect-video w-full max-w-xs overflow-hidden rounded-md border border-border">
                                            <img
                                                src={youtubeThumbnail(watchedYtId, 'hq')}
                                                alt="preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </>
                )}

                {itemType === 'text' && (
                    <FormField
                        control={form.control}
                        name="body_html"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>เนื้อหา <span className="text-destructive">*</span></FormLabel>
                                <FormControl>
                                    <Textarea
                                        rows={8}
                                        placeholder="พิมพ์ข้อความ / คำอธิบาย / วิธีใช้สื่อ ฯลฯ"
                                        {...field}
                                        value={field.value ?? ''}
                                    />
                                </FormControl>
                                <FormDescription>รองรับ HTML พื้นฐาน (ใช้สำหรับวิธีทำกิจกรรม, ลิงก์รวม ฯลฯ)</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {/* Shared metadata */}
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>ชื่อรายการ <span className="text-destructive">*</span></FormLabel>
                            <FormControl><Input {...field} placeholder="เช่น ใบงานบวกเลข ป.1" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>คำอธิบาย</FormLabel>
                            <FormControl>
                                <Textarea rows={2} placeholder="คำอธิบายสั้น ๆ" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>หมวดหมู่ <span className="text-destructive">*</span></FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="เลือกหมวดหมู่" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {categories.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="thumbnail_url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>ปกรายการ (ไม่บังคับ)</FormLabel>
                            <FormControl>
                                <ImageUpload
                                    bucket="educational-hub"
                                    folder={`${ownerStaffId}/thumbs`}
                                    compressionPreset="cover"
                                    currentImage={watchedThumb || undefined}
                                    onUploadComplete={(url) => field.onChange(url)}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => {
                        const currentValue = field.value ?? '';
                        const isCustom = currentValue !== '' && !SUBJECT_OPTIONS.some((s) => s.value === currentValue);
                        // ค่าใน Select: ถ้าเป็น custom → "__custom__" / ถ้าว่าง → "" / ไม่งั้น = currentValue
                        const selectValue = isCustom ? '__custom__' : currentValue;
                        return (
                            <FormItem>
                                <FormLabel>วิชา</FormLabel>
                                <Select
                                    value={selectValue}
                                    onValueChange={(v) => {
                                        // เลือก "__custom__" → เคลียร์ field เพื่อให้ user พิมพ์เอง
                                        field.onChange(v === '__custom__' ? '' : v);
                                    }}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="เลือกกลุ่มสาระ" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {SUBJECT_OPTIONS.map((s) => (
                                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                        ))}
                                        <SelectItem value="__custom__">อื่นๆ (พิมพ์เอง)</SelectItem>
                                    </SelectContent>
                                </Select>
                                {(isCustom || selectValue === '__custom__') && (
                                    <Input
                                        placeholder="พิมพ์ชื่อวิชาเอง"
                                        value={currentValue}
                                        onChange={(e) => field.onChange(e.target.value)}
                                        className="mt-2"
                                    />
                                )}
                                <FormMessage />
                            </FormItem>
                        );
                    }}
                />

                <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>แท็ก</FormLabel>
                            <FormControl>
                                <TagPicker
                                    subject={form.watch('subject')}
                                    value={field.value ?? []}
                                    onChange={field.onChange}
                                />
                            </FormControl>
                            <FormDescription className="text-[10px]">
                                คลิกแท็กแนะนำเพื่อเลือก หรือพิมพ์แท็กใหม่ + Enter
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="grade_levels"
                    render={() => (
                        <FormItem>
                            <FormLabel>ระดับชั้น</FormLabel>
                            <div className="flex flex-wrap gap-2">
                                {GRADE_OPTIONS.map((g) => {
                                    const selected = form.watch('grade_levels')?.includes(g);
                                    return (
                                        <button
                                            type="button"
                                            key={g}
                                            onClick={() => toggleGrade(g)}
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
                    control={form.control}
                    name="is_published"
                    render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border border-border p-3">
                            <div>
                                <FormLabel className="mb-0">เผยแพร่</FormLabel>
                                <FormDescription>ปิดเพื่อบันทึกร่างไว้ก่อน</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <div className="flex gap-2 pt-2">
                    <Button type="submit" disabled={saving || uploading} className="flex-1">
                        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {initial ? 'บันทึกการแก้ไข' : 'เพิ่มรายการ'}
                    </Button>
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                            ยกเลิก
                        </Button>
                    )}
                </div>
            </form>
        </Form>
    );
};
