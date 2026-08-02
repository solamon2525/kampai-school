import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink, FileCheck2, Loader2, Upload } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
    LPC_GENERATOR_URL,
    analyzeLpcDimensions,
    parseLpcMetadata,
    readImageDimensions,
    type LpcImportMetadata,
    type LpcSheetAnalysis,
} from '@/lib/lpc-character';

const MAX_SHEET_SIZE = 10 * 1024 * 1024;
const MAX_METADATA_SIZE = 2 * 1024 * 1024;

const schema = z.object({
    title: z.string().trim().min(1, 'กรุณากรอกชื่อตัวละคร').max(120),
    accepted: z.boolean().refine(Boolean, 'กรุณายืนยันการเก็บและแสดงเครดิต'),
});

type Values = z.infer<typeof schema>;

export type LpcImportPayload = {
    title: string;
    sheetFile: File;
    analysis: LpcSheetAnalysis;
    metadata: LpcImportMetadata;
};

type Props = {
    busy?: boolean;
    onImport: (payload: LpcImportPayload) => void | Promise<void>;
};

export function LpcCharacterImporter({ busy = false, onImport }: Props) {
    const [open, setOpen] = useState(false);
    const [sheetFile, setSheetFile] = useState<File | null>(null);
    const [jsonFile, setJsonFile] = useState<File | null>(null);
    const [creditsFile, setCreditsFile] = useState<File | null>(null);
    const [analysis, setAnalysis] = useState<LpcSheetAnalysis | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const form = useForm<Values>({
        resolver: zodResolver(schema),
        defaultValues: { title: '', accepted: false },
    });

    useEffect(() => {
        if (!sheetFile) {
            setAnalysis(null);
            setImageError(null);
            setPreviewUrl(null);
            return;
        }

        const url = URL.createObjectURL(sheetFile);
        setPreviewUrl(url);
        let cancelled = false;
        void readImageDimensions(sheetFile)
            .then(({ width, height }) => {
                if (cancelled) return;
                setAnalysis(analyzeLpcDimensions(width, height));
                setImageError(null);
                if (!form.getValues('title')) {
                    form.setValue('title', sheetFile.name.replace(/\.[^.]+$/, ''));
                }
            })
            .catch((error: unknown) => {
                if (cancelled) return;
                setAnalysis(null);
                setImageError(error instanceof Error ? error.message : 'ตรวจภาพไม่สำเร็จ');
            });

        return () => {
            cancelled = true;
            URL.revokeObjectURL(url);
        };
    }, [form, sheetFile]);

    const submit = form.handleSubmit(async (values) => {
        if (!sheetFile || !jsonFile || !creditsFile || !analysis) {
            form.setError('root', { message: 'กรุณาแนบ PNG, JSON และ Credits ให้ครบและตรวจภาพให้ผ่าน' });
            return;
        }
        if (sheetFile.size > MAX_SHEET_SIZE) {
            form.setError('root', { message: 'ไฟล์ spritesheet ต้องไม่เกิน 10 MB' });
            return;
        }
        if (jsonFile.size > MAX_METADATA_SIZE || creditsFile.size > MAX_METADATA_SIZE) {
            form.setError('root', { message: 'ไฟล์ JSON/Credits แต่ละไฟล์ต้องไม่เกิน 2 MB' });
            return;
        }

        try {
            const [jsonText, creditsText] = await Promise.all([jsonFile.text(), creditsFile.text()]);
            const metadata = parseLpcMetadata(
                jsonText,
                jsonFile.name,
                creditsText,
                creditsFile.name,
            );
            await onImport({ title: values.title, sheetFile, analysis, metadata });
        } catch (error) {
            form.setError('root', {
                message: error instanceof Error ? error.message : 'อ่านข้อมูล LPC ไม่สำเร็จ',
            });
        }
    });

    return (
        <section className="rounded-lg border border-border bg-card">
            <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">🧙 Universal LPC Importer</p>
                        <Badge variant="secondary">Top-down 4 ทิศ</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                        สร้างตัวละครจาก LPC แล้วนำเข้า PNG + JSON + Credits พร้อม map ท่าและเก็บลิขสิทธิ์
                    </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" asChild>
                        <a href={LPC_GENERATOR_URL} target="_blank" rel="noopener noreferrer">
                            เปิดตัวสร้าง <ExternalLink className="ml-1 h-3.5 w-3.5" />
                        </a>
                    </Button>
                    <Button type="button" size="sm" variant={open ? 'secondary' : 'default'} onClick={() => setOpen((value) => !value)}>
                        <Upload className="mr-1 h-3.5 w-3.5" /> {open ? 'ซ่อนตัวนำเข้า' : 'นำเข้า LPC'}
                    </Button>
                </div>
            </div>

            {open && (
                <div className="space-y-4 border-t border-border p-3">
                    <ol className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                        <li className="rounded-md border border-border p-2"><strong className="text-foreground">1.</strong> สร้างตัวละครและเลือก Complete spritesheet</li>
                        <li className="rounded-md border border-border p-2"><strong className="text-foreground">2.</strong> ดาวน์โหลด PNG และ Export JSON</li>
                        <li className="rounded-md border border-border p-2"><strong className="text-foreground">3.</strong> ดาวน์โหลด Credits แบบ TXT หรือ CSV</li>
                    </ol>

                    <Form {...form}>
                        <form className="space-y-4" onSubmit={submit}>
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ชื่อตัวละคร</FormLabel>
                                        <FormControl><Input {...field} placeholder="เช่น นักผจญภัยหญิง ชุดนักเรียน" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid gap-3 md:grid-cols-3">
                                <label className="space-y-1.5 text-sm font-medium text-foreground">
                                    Spritesheet PNG
                                    <Input type="file" accept="image/png" onChange={(event) => setSheetFile(event.target.files?.[0] ?? null)} />
                                </label>
                                <label className="space-y-1.5 text-sm font-medium text-foreground">
                                    Character JSON
                                    <Input type="file" accept="application/json,.json" onChange={(event) => setJsonFile(event.target.files?.[0] ?? null)} />
                                </label>
                                <label className="space-y-1.5 text-sm font-medium text-foreground">
                                    Credits TXT/CSV
                                    <Input type="file" accept="text/plain,text/csv,.txt,.csv" onChange={(event) => setCreditsFile(event.target.files?.[0] ?? null)} />
                                </label>
                            </div>

                            {(previewUrl || imageError) && (
                                <div className={cn('flex gap-3 rounded-md border p-3', imageError ? 'border-destructive/40' : 'border-border')}>
                                    {previewUrl && (
                                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded border border-border bg-muted">
                                            <img src={previewUrl} alt="ตัวอย่าง LPC spritesheet" className="h-full w-full object-contain [image-rendering:pixelated]" />
                                        </div>
                                    )}
                                    <div className="min-w-0 text-xs">
                                        {analysis ? (
                                            <>
                                                <p className="flex items-center gap-1 font-medium text-foreground"><FileCheck2 className="h-4 w-4 text-primary" /> รูปแบบ LPC พร้อมนำเข้า</p>
                                                <p className="mt-1 text-muted-foreground">
                                                    {analysis.width}×{analysis.height}px · เฟรม {analysis.frameWidth}×{analysis.frameHeight}px · {analysis.columns}×{analysis.rows} · {analysis.frameCount} เฟรม
                                                </p>
                                                <p className="mt-1 text-muted-foreground">map อัตโนมัติ: เดิน 4 ทิศ · ฟัน · แทง · ร่ายเวท · บาดเจ็บ/ล้ม</p>
                                            </>
                                        ) : (
                                            <p className="text-destructive">{imageError ?? 'กำลังตรวจภาพ…'}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <FormField
                                control={form.control}
                                name="accepted"
                                render={({ field }) => (
                                    <FormItem className="flex items-start gap-3 rounded-md border border-border p-3">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={(value) => field.onChange(value === true)} />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>ยืนยันว่าจะเก็บและแสดงเครดิตตาม license ของ LPC</FormLabel>
                                            <p className="text-xs font-normal leading-relaxed text-muted-foreground">
                                                ระบบจะแสดงเครดิตภาพตัวละครก่อนเข้าเกม และเก็บ JSON ต้นฉบับเพื่อกลับมาแก้ไขภายหลัง
                                            </p>
                                            <FormMessage />
                                        </div>
                                    </FormItem>
                                )}
                            />

                            {form.formState.errors.root?.message && (
                                <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
                            )}

                            <Button type="submit" className="w-full" disabled={busy || !analysis || !jsonFile || !creditsFile}>
                                {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังนำเข้า…</> : <><Upload className="mr-2 h-4 w-4" /> นำเข้าและบันทึกเข้าคลังตัวละคร</>}
                            </Button>
                        </form>
                    </Form>
                </div>
            )}
        </section>
    );
}
