import { useMemo, useState, useEffect } from 'react';
import { FolderOpen, Plus, BookOpen, Loader2, Eye, Upload } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RolePortalLayout } from '@/components/portal/RolePortalLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ImageUpload } from '@/components/admin/shared/ImageUpload';
import { useLinkedRecord } from '@/hooks/useLinkedRecord';
import { useToast } from '@/hooks/use-toast';
import {
    educationalHubService,
    type EduHubCategory,
    type EduHubItem,
    type EduHubProfile,
} from '@/services/educational-hub.service';
import { EduHubItemForm } from '@/components/admin/educational-hub/EduHubItemForm';
import { SortableItemsTable } from '@/components/admin/educational-hub/SortableItemsTable';
import { GameDocsDialog } from '@/components/admin/educational-hub/GameDocsDialog';
import { ThaiVocabManageDialog } from '@/components/admin/educational-hub/ThaiVocabManageDialog';
import { ThaiVocabMissedReportClass } from '@/components/thai-vocab/ThaiVocabMissedReport';
import { staffService } from '@/services/staff.service';
import TeacherGameAnalytics from './TeacherGameAnalytics';
import { WorksheetSetsPanel } from '@/components/educational-hub/WorksheetSetsPanel';
import { Link } from 'react-router-dom';

const MENU = [
    { id: 'dashboard', label: 'แดชบอร์ด', icon: FolderOpen, path: '/teacher' },
    { id: 'edu-hub', label: 'คลังสื่อของฉัน', icon: FolderOpen, path: '/teacher/edu-hub' },
];

function TeacherHabitStrip({ staffId }: { staffId: string }) {
    const { data: stats } = useQuery({
        queryKey: ['edu-hub', 'my-upload-stats', staffId],
        queryFn: () => educationalHubService.getMyUploadStats(staffId),
    });

    if (!stats) return null;

    const lastLabel = stats.lastCreatedAt
        ? formatDistanceToNow(new Date(stats.lastCreatedAt), { addSuffix: true, locale: th })
        : 'ยังไม่เคยอัป';

    return (
        <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                <div className="flex items-center gap-2 text-sm">
                    <Upload className="h-4 w-4 text-primary" />
                    <span>
                        ของคุณ <strong>{stats.total}</strong> รายการ · เผยแพร่แล้ว{' '}
                        <strong>{stats.published}</strong>
                    </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    ยอดดูรวม {stats.totalViews.toLocaleString('th-TH')} · อัปล่าสุด {lastLabel}
                </div>
                <div className="sm:ml-auto flex flex-wrap gap-2">
                    <Badge variant={stats.published > 0 ? 'default' : 'outline'} className="text-[10px]">
                        {stats.published > 0 ? 'มีสื่อเผยแพร่แล้ว' : 'ยังไม่มีสื่อเผยแพร่ — เริ่มอัปได้เลย'}
                    </Badge>
                    <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                        <Link to="/educational-hub">ดูชุดเรียนในคลัง</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default function TeacherEduHubManager() {
    const { data: link } = useLinkedRecord();
    const staffId = link?.staff_id ?? null;

    return (
        <RolePortalLayout title="Portal ครู" subtitle="คลังสื่อ/เกม ของฉัน" menu={MENU} accent="teacher">
            <div className="p-4 sm:p-6 space-y-4 max-w-5xl mx-auto">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">คลังสื่อและเกมการศึกษา</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            จัดการโปรไฟล์คลังและรายการสื่อ/เกม/ใบงานของคุณ
                        </p>
                    </div>
                    <Button variant="outline" asChild className="shrink-0">
                        <a href="/docs/teacher-upload-media-guide.html" target="_blank" rel="noopener noreferrer">
                            <BookOpen className="mr-2 h-4 w-4" />
                            คู่มืออัปสื่อ 5 นาที
                        </a>
                    </Button>
                </div>

                {staffId && <TeacherHabitStrip staffId={staffId} />}

                {!staffId ? (
                    <Card>
                        <CardContent className="p-6">
                            <p className="text-sm text-amber-600">
                                บัญชีของคุณยังไม่ได้เชื่อมกับข้อมูลบุคลากร กรุณาติดต่อผู้ดูแลระบบ
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <Tabs defaultValue="items" className="w-full">
                        <TabsList>
                            <TabsTrigger value="items">รายการของฉัน</TabsTrigger>
                            <TabsTrigger value="worksheet-sets">ชุดใบงาน</TabsTrigger>
                            <TabsTrigger value="profile">โปรไฟล์คลัง</TabsTrigger>
                            <TabsTrigger value="analytics">วิเคราะห์คะแนนเกม</TabsTrigger>
                            <TabsTrigger value="vocab-review">
                                <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                                คำศัพท์ที่พลาด
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="items"><MyItemsTab staffId={staffId} /></TabsContent>
                        <TabsContent value="worksheet-sets">
                            <WorksheetSetsPanel staffId={staffId} mode="mine" />
                        </TabsContent>
                        <TabsContent value="profile"><MyProfileTab staffId={staffId} /></TabsContent>
                        <TabsContent value="analytics"><TeacherGameAnalytics staffId={staffId} /></TabsContent>
                        <TabsContent value="vocab-review"><ThaiVocabMissedReportClass /></TabsContent>
                    </Tabs>
                )}
            </div>
        </RolePortalLayout>
    );
}

// ──────────────────────────────────────────────────────────────────────────
// Items tab — list grouped by category + add/edit/delete
// ──────────────────────────────────────────────────────────────────────────
const MyItemsTab = ({ staffId }: { staffId: string }) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<EduHubItem | null>(null);
    const [docsItem, setDocsItem] = useState<EduHubItem | null>(null);
    const [vocabItem, setVocabItem] = useState<EduHubItem | null>(null);

    const { data: items, isLoading } = useQuery({
        queryKey: ['edu-hub', 'items', 'mine', staffId],
        queryFn: async () => {
            const { data, error } = await educationalHubService.listMyItems(staffId);
            if (error) throw error;
            return (data ?? []) as EduHubItem[];
        },
    });

    const { data: categories } = useQuery({
        queryKey: ['edu-hub', 'categories'],
        queryFn: async () => {
            const { data, error } = await educationalHubService.listCategories();
            if (error) throw error;
            return (data ?? []) as EduHubCategory[];
        },
    });

    const itemsByCategory = useMemo(() => {
        const m = new Map<string, EduHubItem[]>();
        (items ?? []).forEach((it) => {
            const arr = m.get(it.category_id) ?? [];
            arr.push(it);
            m.set(it.category_id, arr);
        });
        return m;
    }, [items]);

    // Query keys to invalidate after row actions (delete/publish/reorder) —
    // covers self-view, public hub view, and teacher card counts
    const invalidateKeys = useMemo<readonly (readonly unknown[])[]>(
        () => [
            ['edu-hub', 'items', 'mine', staffId],
            ['edu-hub', 'items', staffId],
            ['edu-hub', 'teachers'],
        ],
        [staffId],
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    รวม {items?.length ?? 0} รายการ
                </div>
                    <Button
                        onClick={() => { setEditing(null); setDialogOpen(true); }}
                        disabled={!categories || categories.length === 0}
                    >
                        <Plus className="h-4 w-4 mr-2" />เพิ่มสื่อ / ใบงาน / เกม
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    ครูอัปโหลดเองได้ — แนะนำเริ่มที่หมวด <strong>สื่อ</strong> หรือ <strong>ใบงาน</strong> แล้วใส่วิชา·ชั้น·ปกก่อนเผยแพร่ ·{' '}
                    <a href="/docs/teacher-upload-media-guide.html" target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-2 hover:underline">
                        คู่มือ 5 นาที
                    </a>
                </p>

            {isLoading ? (
                <div className="text-center text-muted-foreground py-12">กำลังโหลด...</div>
            ) : !categories || categories.length === 0 ? (
                <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                        ยังไม่มีหมวดหมู่ในระบบ — กรุณาติดต่อผู้ดูแล
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {categories.map((cat) => {
                        const list = itemsByCategory.get(cat.id) ?? [];
                        return (
                            <div key={cat.id} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-foreground">{cat.name}</h3>
                                    <span className="text-xs text-muted-foreground">
                                        {list.length > 1 ? `${list.length} รายการ · ลากแถวเพื่อจัดลำดับ` : `${list.length} รายการ`}
                                    </span>
                                </div>
                                {list.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic px-3">— ยังไม่มี —</p>
                                ) : (
                                    <SortableItemsTable
                                        items={list}
                                        invalidateKeys={invalidateKeys}
                                        onEdit={(item) => { setEditing(item); setDialogOpen(true); }}
                                        onDocs={(item) => setDocsItem(item)}
                                        onVocabManage={(item) => setVocabItem(item)}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'แก้ไขรายการ' : 'เพิ่มรายการ'}</DialogTitle>
                    </DialogHeader>
                    {categories && categories.length > 0 && (
                        <EduHubItemForm
                            ownerStaffId={staffId}
                            categories={categories}
                            initial={editing}
                            onSaved={() => setDialogOpen(false)}
                            onCancel={() => setDialogOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!docsItem} onOpenChange={(open) => !open && setDocsItem(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    {docsItem && (
                        <GameDocsDialog item={docsItem} onClose={() => setDocsItem(null)} />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!vocabItem} onOpenChange={(open) => !open && setVocabItem(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    {vocabItem && (
                        <ThaiVocabManageDialog item={vocabItem} onClose={() => setVocabItem(null)} />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

// ──────────────────────────────────────────────────────────────────────────
// Profile tab — edit per-teacher hub metadata
// ──────────────────────────────────────────────────────────────────────────
const profileSchema = z.object({
    username: z
        .string()
        .optional()
        .nullable()
        .refine(
            (v) => !v || /^[a-z0-9_-]{2,32}$/.test(v),
            'username: a-z, 0-9, - หรือ _ เท่านั้น (2-32 ตัว)',
        ),
    hub_bio: z.string().max(500).optional().nullable(),
    banner_url: z.string().optional().nullable(),
    accent_color: z.string().optional().nullable(),
    external_url: z
        .string()
        .optional()
        .nullable()
        .refine(
            (v) => !v || /^https?:\/\//i.test(v),
            'URL ต้องขึ้นต้นด้วย http(s)://',
        ),
    is_hub_active: z.boolean().default(true),
});
type ProfileForm = z.infer<typeof profileSchema>;

const MyProfileTab = ({ staffId }: { staffId: string }) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [saving, setSaving] = useState(false);

    const { data: profile, isLoading } = useQuery({
        queryKey: ['edu-hub', 'profile', staffId],
        queryFn: async () => {
            const { data, error } = await educationalHubService.getProfile(staffId);
            if (error) throw error;
            return data as EduHubProfile | null;
        },
    });

    // Username lives on staff table (migration 067) — fetch separately
    const { data: staffRecord } = useQuery({
        queryKey: ['staff', staffId, 'username'],
        queryFn: async () => {
            const { data, error } = await staffService.getById(staffId);
            if (error) throw error;
            return data as { username: string | null } | null;
        },
    });

    const form = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            username: '',
            hub_bio: '',
            banner_url: '',
            accent_color: '#157F3C',
            external_url: '',
            is_hub_active: true,
        },
    });

    useEffect(() => {
        if (profile) {
            form.reset({
                username: staffRecord?.username ?? '',
                hub_bio: profile.hub_bio ?? '',
                banner_url: profile.banner_url ?? '',
                accent_color: profile.accent_color ?? '#157F3C',
                external_url: profile.external_url ?? '',
                is_hub_active: profile.is_hub_active,
            });
        }
    }, [profile, staffRecord, form]);

    const onSubmit = async (values: ProfileForm) => {
        setSaving(true);
        try {
            // Hub fields → educational_hub_profiles (no longer includes username)
            const profileRes = await educationalHubService.upsertProfile({
                staff_id: staffId,
                hub_bio: values.hub_bio?.trim() || null,
                banner_url: values.banner_url?.trim() || null,
                accent_color: values.accent_color?.trim() || null,
                external_url: values.external_url?.trim() || null,
                is_hub_active: values.is_hub_active,
            });
            if (profileRes.error) throw profileRes.error;

            // username → staff.username (moved out of profile in migration 067)
            const usernameRes = await staffService.updateUsername(
                staffId,
                values.username?.trim() || null,
            );
            if (usernameRes.error) throw usernameRes.error;

            await queryClient.invalidateQueries({ queryKey: ['edu-hub', 'profile', staffId] });
            await queryClient.invalidateQueries({ queryKey: ['edu-hub', 'teachers'] });
            await queryClient.invalidateQueries({ queryKey: ['staff', staffId, 'username'] });
            toast({ title: 'บันทึกโปรไฟล์สำเร็จ' });
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'บันทึกล้มเหลว';
            toast({ title: 'บันทึกล้มเหลว', description: msg, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) {
        return <div className="text-center text-muted-foreground py-12">กำลังโหลด...</div>;
    }

    const watchedBanner = form.watch('banner_url');

    return (
        <Card>
            <CardContent className="p-4 sm:p-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => {
                                const previewName = (field.value ?? '').trim();
                                return (
                                    <FormItem>
                                        <FormLabel>Username (สำหรับลิงก์สั้น)</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="nattapong"
                                                {...field}
                                                value={field.value ?? ''}
                                                onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            {previewName
                                                ? <>ลิงก์สั้น: <code className="text-primary">{`/h/${previewName}`}</code> · <code className="text-primary">{`/staff/${previewName}`}</code></>
                                                : 'ตั้ง username (a-z, 0-9, -, _) เพื่อใช้ลิงก์สั้นแทน UUID — ใช้ทั้งคลังสื่อและหน้าข้อมูลครู'}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                );
                            }}
                        />

                        <FormField
                            control={form.control}
                            name="banner_url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ภาพแบนเนอร์ (ไม่บังคับ)</FormLabel>
                                    <FormControl>
                                        <ImageUpload
                                            bucket="educational-hub"
                                            folder={`${staffId}/banners`}
                                            compressionPreset="cover"
                                            currentImage={watchedBanner || undefined}
                                            onUploadComplete={(url) => field.onChange(url)}
                                        />
                                    </FormControl>
                                    <FormDescription>แสดงเป็นพื้นหลังบนการ์ดของครูในหน้าคลังหลัก</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="hub_bio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>คำแนะนำตัว / คำอธิบายคลัง</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            rows={3}
                                            placeholder="เช่น ครูคณิตศาสตร์ ม.ปลาย — สื่อสำหรับชั้น ป.4-6 ..."
                                            {...field}
                                            value={field.value ?? ''}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="external_url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ลิงก์เว็บส่วนตัวครู (ไม่บังคับ)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="url"
                                            placeholder="https://sites.google.com/... หรือ https://padlet.com/..."
                                            {...field}
                                            value={field.value ?? ''}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Google Site / Padlet / Facebook ฯลฯ — จะแสดงเป็นปุ่ม "เว็บส่วนตัวครู" บนหน้าคลังของคุณ
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="is_hub_active"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border border-border p-3">
                                    <div>
                                        <FormLabel className="mb-0">เปิดให้สาธารณะเข้าชม</FormLabel>
                                        <FormDescription>
                                            ปิดเมื่อยังไม่พร้อมเผยแพร่ — คลังของคุณจะไม่แสดงในหน้าคลังหลัก
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <Button type="submit" disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            บันทึกโปรไฟล์
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};
