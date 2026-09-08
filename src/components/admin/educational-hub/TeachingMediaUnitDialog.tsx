import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, PackageCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { curriculumService, type CurriculumIndicator } from '@/services/curriculum.service';
import { lessonPacksService } from '@/services/lesson-packs.service';
import type { EduHubCategory, EduHubItem } from '@/services/educational-hub.service';

const NONE = '__none__';
const GRADES = ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'] as const;

const unitSchema = z.object({
    title: z.string().trim().min(1, 'กรุณาระบุชื่อหน่วย').max(180),
    description: z.string().trim().max(500).optional(),
    thumbnailUrl: z.string().trim().max(500).refine(
        (value) => !value || value.startsWith('/') || /^https:\/\//i.test(value),
        'ใช้ path ภายในที่ขึ้นต้นด้วย / หรือ URL https://',
    ),
    gradeLevels: z.array(z.string()).max(6),
    worksheetItemIds: z.array(z.string()).max(30),
    gameItemIds: z.array(z.string()).max(30),
    primaryIndicatorId: z.string().optional(),
    supportingIndicatorId1: z.string().optional(),
    supportingIndicatorId2: z.string().optional(),
    isPublished: z.boolean(),
});

type UnitFormValues = z.infer<typeof unitSchema>;

function subjectKey(subject: string | null): string | undefined {
    if (!subject) return undefined;
    if (subject.includes('ภาษาไทย')) return 'thai';
    if (subject.includes('คณิต')) return 'math';
    if (subject.includes('วิทยาศาสตร์')) return 'science';
    if (subject.includes('สังคม')) return 'social';
    if (subject.includes('สุขศึกษา')) return 'health';
    if (subject.includes('ศิลปะ')) return 'arts';
    if (subject.includes('การงาน')) return 'career';
    if (subject.includes('อังกฤษ') || subject.includes('ต่างประเทศ')) return 'english';
    return undefined;
}

function indicatorLabel(indicator: CurriculumIndicator): string {
    return `${indicator.indicator_code} · ${indicator.description}`;
}

export function TeachingMediaUnitDialog({
    media,
    items,
    categories,
    onClose,
}: {
    media: EduHubItem;
    items: EduHubItem[];
    categories: EduHubCategory[];
    onClose: () => void;
}) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [saving, setSaving] = useState(false);
    const mediaSubjectKey = subjectKey(media.subject);

    const { data: unit, isLoading: loadingUnit } = useQuery({
        queryKey: ['lesson-packs', 'teaching-unit-editor', media.id],
        queryFn: () => lessonPacksService.getTeachingUnitForMedia(media.id),
    });
    const { data: existingIndicatorIds = [] } = useQuery({
        queryKey: ['curriculum', 'item-indicator-ids', media.id],
        queryFn: () => curriculumService.listGameIndicatorIds(media.id),
    });
    const { data: allIndicators = [] } = useQuery({
        queryKey: ['curriculum', 'indicators', mediaSubjectKey ?? 'unknown'],
        enabled: !!mediaSubjectKey,
        queryFn: async () => {
            const { data, error } = await curriculumService.listAllIndicators(mediaSubjectKey);
            if (error) throw error;
            return (data ?? []) as CurriculumIndicator[];
        },
        staleTime: 10 * 60 * 1000,
    });

    const form = useForm<UnitFormValues>({
        resolver: zodResolver(unitSchema),
        defaultValues: {
            title: media.title,
            description: media.description ?? '',
            thumbnailUrl: media.thumbnail_url ?? '',
            gradeLevels: media.grade_levels ?? [],
            worksheetItemIds: [],
            gameItemIds: [],
            primaryIndicatorId: NONE,
            supportingIndicatorId1: NONE,
            supportingIndicatorId2: NONE,
            isPublished: media.is_published,
        },
    });

    useEffect(() => {
        if (loadingUnit) return;
        form.reset({
            title: unit?.pack.title ?? media.title,
            description: unit?.pack.description ?? media.description ?? '',
            thumbnailUrl: unit?.pack.thumbnail_url ?? media.thumbnail_url ?? '',
            gradeLevels: unit?.pack.grade_levels ?? media.grade_levels ?? [],
            worksheetItemIds: unit?.worksheets.map((item) => item.edu_hub_item_id) ?? [],
            gameItemIds: unit?.games.map((item) => item.edu_hub_item_id) ?? [],
            primaryIndicatorId: existingIndicatorIds[0] ?? NONE,
            supportingIndicatorId1: existingIndicatorIds[1] ?? NONE,
            supportingIndicatorId2: existingIndicatorIds[2] ?? NONE,
            isPublished: unit?.pack.is_published ?? media.is_published,
        });
    }, [existingIndicatorIds, form, loadingUnit, media, unit]);

    const categoryKeyById = useMemo(
        () => new Map(categories.map((category) => [category.id, category.category_key])),
        [categories],
    );
    const worksheets = useMemo(
        () => items.filter((item) => categoryKeyById.get(item.category_id) === 'worksheets'),
        [categoryKeyById, items],
    );
    const games = useMemo(
        () => items.filter((item) => categoryKeyById.get(item.category_id) === 'games' || item.tracked_game),
        [categoryKeyById, items],
    );
    const selectedGrades = form.watch('gradeLevels');
    const indicators = useMemo(
        () => allIndicators.filter((indicator) => indicator.is_active && (
            selectedGrades.length === 0 || selectedGrades.includes(indicator.grade)
        )),
        [allIndicators, selectedGrades],
    );

    const onSubmit = async (values: UnitFormValues) => {
        const indicatorIds = [
            values.primaryIndicatorId,
            values.supportingIndicatorId1,
            values.supportingIndicatorId2,
        ].filter((id): id is string => !!id && id !== NONE);
        if (new Set(indicatorIds).size !== indicatorIds.length) {
            toast({ title: 'เลือกตัวชี้วัดซ้ำกัน', description: 'ตัวชี้วัดหลักและตัวสนับสนุนต้องไม่ซ้ำ', variant: 'destructive' });
            return;
        }
        if (indicators.length > 0 && (!values.primaryIndicatorId || values.primaryIndicatorId === NONE)) {
            toast({ title: 'กรุณาเลือกตัวชี้วัดหลัก', variant: 'destructive' });
            return;
        }

        setSaving(true);
        try {
            await lessonPacksService.saveTeachingUnit({
                packId: unit?.pack.id,
                mediaItemId: media.id,
                ownerStaffId: media.owner_staff_id,
                title: values.title,
                description: values.description || null,
                subject: media.subject,
                gradeLevels: values.gradeLevels,
                thumbnailUrl: values.thumbnailUrl || null,
                worksheetItemIds: values.worksheetItemIds,
                gameItemIds: values.gameItemIds,
                isPublished: values.isPublished,
            });
            const indicatorResult = await curriculumService.setGameIndicators(media.id, indicatorIds);
            if (indicatorResult.error) throw indicatorResult.error;
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['lesson-packs'] }),
                queryClient.invalidateQueries({ queryKey: ['edu-hub'] }),
                queryClient.invalidateQueries({ queryKey: ['game-card-indicators'] }),
                queryClient.invalidateQueries({ queryKey: ['curriculum', 'item-indicator-ids', media.id] }),
            ]);
            toast({ title: 'บันทึกหน่วยสอนแล้ว', description: 'การ์ดสื่อจะแสดงใบงานและเกมที่เชื่อมไว้ในจุดเดียว' });
            onClose();
        } catch (error) {
            toast({
                title: 'บันทึกหน่วยสอนไม่สำเร็จ',
                description: error instanceof Error ? error.message : 'โปรดลองอีกครั้ง',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loadingUnit) {
        return <div className="py-12 text-center text-muted-foreground">กำลังโหลดหน่วยสอน...</div>;
    }

    const renderIndicatorSelect = (
        name: 'primaryIndicatorId' | 'supportingIndicatorId1' | 'supportingIndicatorId2',
        label: string,
    ) => (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <Select value={field.value || NONE} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value={NONE}>{name === 'primaryIndicatorId' ? 'ยังไม่เลือก' : 'ไม่ใช้'}</SelectItem>
                            {indicators.map((indicator) => (
                                <SelectItem key={indicator.id} value={indicator.id}>
                                    {indicatorLabel(indicator)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
        />
    );

    const renderResourcePicker = (
        name: 'worksheetItemIds' | 'gameItemIds',
        label: string,
        resources: EduHubItem[],
        emptyText: string,
    ) => (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                        {resources.length === 0 && (
                            <p className="px-2 py-4 text-center text-xs text-muted-foreground">{emptyText}</p>
                        )}
                        {resources.map((item) => (
                            <label key={item.id} className="flex min-h-11 items-center gap-2 rounded-md px-2 hover:bg-muted">
                                <Checkbox
                                    checked={field.value.includes(item.id)}
                                    onCheckedChange={(checked) => field.onChange(
                                        checked
                                            ? [...field.value, item.id]
                                            : field.value.filter((value) => value !== item.id),
                                    )}
                                />
                                <span className="line-clamp-2 text-sm text-foreground">{item.title}</span>
                            </label>
                        ))}
                    </div>
                    <FormDescription>เลือกได้หลายรายการ ระบบจะเก็บลำดับตามรายการในคลัง</FormDescription>
                    <FormMessage />
                </FormItem>
            )}
        />
    );

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="flex items-center gap-2 font-semibold text-foreground">
                        <PackageCheck className="h-4 w-4 text-primary" />
                        สื่อหลัก: {media.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        การ์ดนี้จะแสดงสื่อ ใบงาน และเกมร่วมกัน โดยคลังใบงานยังค้นหาแยกได้ตามเดิม
                    </p>
                </div>

                <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>ชื่อหน่วยสอน</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>คำอธิบายสั้น</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="thumbnailUrl" render={({ field }) => (
                    <FormItem>
                        <FormLabel>ปกหน่วยสอน</FormLabel>
                        <FormControl><Input placeholder="/games/.../cover.webp" {...field} /></FormControl>
                        <FormDescription>ใช้ปก WebP/ภาพกึ่งสมจริงที่เข้ากับเนื้อหา หรือเว้นว่างเพื่อใช้ปกสื่อหลัก</FormDescription>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="gradeLevels" render={() => (
                    <FormItem>
                        <FormLabel>ระดับชั้น</FormLabel>
                        <div className="flex flex-wrap gap-3 rounded-lg border border-border p-3">
                            {GRADES.map((grade) => (
                                <FormField key={grade} control={form.control} name="gradeLevels" render={({ field }) => (
                                    <label className="flex min-h-11 items-center gap-2 rounded-md px-2 hover:bg-muted">
                                        <Checkbox
                                            checked={field.value.includes(grade)}
                                            onCheckedChange={(checked) => field.onChange(
                                                checked ? [...field.value, grade] : field.value.filter((value) => value !== grade),
                                            )}
                                        />
                                        <span className="text-sm">{grade}</span>
                                    </label>
                                )} />
                            ))}
                        </div>
                        <FormMessage />
                    </FormItem>
                )} />

                <div className="grid gap-4 sm:grid-cols-2">
                    {renderResourcePicker('worksheetItemIds', 'ใบงานที่ใช้ต่อจากสื่อ', worksheets, 'ยังไม่มีใบงานในคลัง')}
                    {renderResourcePicker('gameItemIds', 'เกมเสริม (ไม่บังคับ)', games, 'ยังไม่มีเกมในคลัง')}
                </div>

                <div className="space-y-3 rounded-lg border border-border p-3">
                    <div>
                        <p className="text-sm font-semibold text-foreground">ตัวชี้วัด</p>
                        <p className="text-xs text-muted-foreground">เลือกตัวหลัก 1 รายการ และตัวสนับสนุนได้ไม่เกิน 2 รายการ</p>
                    </div>
                    {renderIndicatorSelect('primaryIndicatorId', 'ตัวชี้วัดหลัก')}
                    <div className="grid gap-3 sm:grid-cols-2">
                        {renderIndicatorSelect('supportingIndicatorId1', 'ตัวสนับสนุน 1')}
                        {renderIndicatorSelect('supportingIndicatorId2', 'ตัวสนับสนุน 2')}
                    </div>
                </div>

                <FormField control={form.control} name="isPublished" render={({ field }) => (
                    <FormItem className="flex items-center gap-3 rounded-lg border border-border p-3">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} /></FormControl>
                        <div><FormLabel>เผยแพร่หน่วยสอน</FormLabel><FormDescription>ปิดไว้ได้ระหว่างเติมใบงานหรือเกม</FormDescription></div>
                    </FormItem>
                )} />

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>ยกเลิก</Button>
                    <Button type="submit" disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        บันทึกหน่วยสอน
                    </Button>
                </div>
            </form>
        </Form>
    );
}
