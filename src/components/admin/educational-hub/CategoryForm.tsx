import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import * as Icons from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import {
    educationalHubService,
    type EduHubCategory,
} from '@/services/educational-hub.service';

const COLOR_OPTIONS = [
    { value: 'primary', label: 'หลัก', className: 'bg-primary' },
    { value: 'accent',  label: 'เน้น', className: 'bg-accent' },
    { value: 'info',    label: 'น้ำเงิน', className: 'bg-blue-500' },
    { value: 'success', label: 'เขียว', className: 'bg-green-500' },
    { value: 'warning', label: 'เหลือง', className: 'bg-amber-500' },
    { value: 'muted',   label: 'เทา', className: 'bg-muted-foreground' },
];

const schema = z.object({
    category_key: z.string()
        .min(1, 'กรุณากรอก key')
        .regex(/^[a-z0-9_]+$/, 'ใช้ตัวอักษรพิมพ์เล็ก ตัวเลข และ _ เท่านั้น'),
    name: z.string().min(1, 'กรุณากรอกชื่อหมวด').max(100),
    description: z.string().max(500).optional().nullable(),
    icon_name: z.string().min(1, 'กรุณาเลือก icon').max(50),
    color_class: z.string().min(1),
    sort_order: z.coerce.number().int().default(0),
    is_active: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

interface Props {
    initial?: EduHubCategory | null;
    onSaved: () => void;
    onCancel?: () => void;
}

const slugify = (s: string) =>
    s.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '_')
        .replace(/^_+|_+$/g, '');

export const CategoryForm = ({ initial, onSaved, onCancel }: Props) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [saving, setSaving] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            category_key: initial?.category_key ?? '',
            name: initial?.name ?? '',
            description: initial?.description ?? '',
            icon_name: initial?.icon_name ?? 'Folder',
            color_class: initial?.color_class ?? 'primary',
            sort_order: initial?.sort_order ?? 0,
            is_active: initial?.is_active ?? true,
        },
    });

    const iconName = form.watch('icon_name');
    const PreviewIcon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName]
        ?? Icons.Folder;

    const onSubmit = async (values: FormValues) => {
        setSaving(true);
        try {
            const payload: Partial<EduHubCategory> = {
                category_key: values.category_key,
                name: values.name.trim(),
                description: values.description?.trim() || null,
                icon_name: values.icon_name,
                color_class: values.color_class,
                sort_order: values.sort_order,
                is_active: values.is_active,
            };
            const res = initial
                ? await educationalHubService.updateCategory(initial.id, payload)
                : await educationalHubService.insertCategory(payload);
            if (res.error) throw res.error;

            await queryClient.invalidateQueries({ queryKey: ['edu-hub', 'categories'] });
            await queryClient.invalidateQueries({ queryKey: ['edu-hub', 'teachers'] });

            toast({ title: initial ? 'แก้ไขหมวดหมู่สำเร็จ' : 'เพิ่มหมวดหมู่สำเร็จ' });
            onSaved();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'บันทึกล้มเหลว';
            toast({ title: 'บันทึกล้มเหลว', description: msg, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>ชื่อหมวดหมู่ <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="เช่น คลังสื่อการสอน"
                                    {...field}
                                    onChange={(e) => {
                                        field.onChange(e);
                                        if (!initial && !form.getValues('category_key')) {
                                            form.setValue('category_key', slugify(e.target.value));
                                        }
                                    }}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="category_key"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Key (ระบุระบบ) <span className="text-destructive">*</span></FormLabel>
                            <FormControl><Input {...field} placeholder="media, games, worksheets" /></FormControl>
                            <FormDescription>ใช้สำหรับ deep-link (?cat=key) และอ้างอิง — ห้ามซ้ำ ใช้ a-z 0-9 _ เท่านั้น</FormDescription>
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
                                <Textarea rows={2} {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="icon_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Icon (Lucide name)</FormLabel>
                            <div className="flex items-center gap-3">
                                <FormControl>
                                    <Input placeholder="เช่น Folder, Gamepad2, FileSpreadsheet" {...field} />
                                </FormControl>
                                <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0 border border-border">
                                    <PreviewIcon className="w-5 h-5 text-foreground" />
                                </div>
                            </div>
                            <FormDescription>
                                ดูชื่อ icon ได้ที่ <a href="https://lucide.dev/icons" target="_blank" rel="noreferrer" className="underline">lucide.dev/icons</a> — ใส่ชื่อแบบ PascalCase
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="color_class"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>สี</FormLabel>
                            <div className="flex flex-wrap gap-2">
                                {COLOR_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => field.onChange(opt.value)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-colors ${
                                            field.value === opt.value
                                                ? 'border-foreground bg-accent'
                                                : 'border-border hover:bg-accent/50'
                                        }`}
                                    >
                                        <span className={`w-4 h-4 rounded-full ${opt.className}`} />
                                        <span className="text-xs">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-3">
                    <FormField
                        control={form.control}
                        name="sort_order"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>ลำดับ</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} value={field.value ?? 0} />
                                </FormControl>
                                <FormDescription>เพิ่มทีละ 10 เพื่อเว้นที่ไว้แทรก</FormDescription>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="is_active"
                        render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border border-border p-3">
                                <FormLabel className="mb-0">เปิดใช้งาน</FormLabel>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex gap-2 pt-2">
                    <Button type="submit" disabled={saving} className="flex-1">
                        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {initial ? 'บันทึกการแก้ไข' : 'เพิ่มหมวดหมู่'}
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
