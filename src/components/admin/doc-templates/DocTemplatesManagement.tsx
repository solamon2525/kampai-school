import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { FileText, Printer, RotateCcw } from 'lucide-react';
import {
    docTemplatesService, renderTemplate,
    type DocTemplateDefinition,
} from '@/services/doc-templates.service';
import { formatThaiDateFull } from '@/lib/thaiDate';

const DocTemplatesManagement = () => {
    const [templates, setTemplates] = useState<DocTemplateDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<DocTemplateDefinition | null>(null);
    const [payload, setPayload] = useState<Record<string, string>>({});
    const [showPreview, setShowPreview] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        (async () => {
            const res = await docTemplatesService.list();
            if (res.data) setTemplates(res.data);
            setLoading(false);
        })();
    }, []);

    const opened = !!selected;

    const renderedText = useMemo(() => {
        if (!selected) return '';
        return renderTemplate(selected.body_template, {
            ...payload,
            date: formatThaiDateFull(new Date().toISOString()),
            number: payload.number || '____/____',
        });
    }, [selected, payload]);

    const openTemplate = (t: DocTemplateDefinition) => {
        setSelected(t);
        // initialize payload
        const init: Record<string, string> = {};
        for (const f of t.fields) init[f.key] = '';
        setPayload(init);
        setShowPreview(false);
    };

    const handlePreview = () => {
        if (!selected) return;
        // validate required
        const missing = selected.fields.filter((f) => f.required && !payload[f.key]?.trim()).map((f) => f.label);
        if (missing.length > 0) {
            toast({ title: `กรุณากรอก: ${missing.join(', ')}`, variant: 'destructive' });
            return;
        }
        setShowPreview(true);
    };

    const handlePrint = async () => {
        if (!selected) return;
        const html = `<pre style="font-family:'Sarabun',sans-serif;font-size:16px;white-space:pre-wrap;line-height:1.6;padding:32px">${
            renderedText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        }</pre>`;
        const w = window.open('', '_blank');
        if (w) {
            w.document.write(
                `<html><head><title>${selected.name}</title>` +
                `<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">` +
                `</head><body>${html}<script>window.print();</script></body></html>`,
            );
            w.document.close();
        }
        // log generation
        await docTemplatesService.logGeneration(selected.id, payload, renderedText);
        toast({ title: 'พิมพ์เรียบร้อย' });
    };

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
            <div>
                <p className="text-xs font-semibold text-primary uppercase">แบบฟอร์มสำเร็จรูป</p>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mt-1 flex items-center gap-2">
                    <FileText className="w-8 h-8 text-primary" /> Template Library
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    เลือกแบบ → กรอกข้อมูล → ดูตัวอย่าง → พิมพ์ได้ทันที
                </p>
            </div>

            {loading ? (
                <p className="text-center py-12 text-muted-foreground">กำลังโหลด…</p>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {templates.map((t) => (
                        <Card
                            key={t.id}
                            className="cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
                            onClick={() => openTemplate(t)}
                        >
                            <CardContent className="p-4 text-center space-y-2">
                                <span className="text-3xl block" aria-hidden>{t.emoji ?? '📄'}</span>
                                <p className="font-semibold text-sm text-foreground">{t.name}</p>
                                {t.description ? (
                                    <p className="text-[11px] text-muted-foreground">{t.description}</p>
                                ) : null}
                                <Badge variant="outline" className="text-[10px]">{t.fields.length} ช่อง</Badge>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={opened} onOpenChange={(v) => { if (!v) setSelected(null); }}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    {selected ? (
                        <>
                            <DialogHeader>
                                <DialogTitle>{selected.emoji} {selected.name}</DialogTitle>
                                <p className="text-xs text-muted-foreground">{selected.description}</p>
                            </DialogHeader>

                            {!showPreview ? (
                                <div className="space-y-3">
                                    {selected.fields.map((f) => (
                                        <div key={f.key}>
                                            <Label className="mb-1 block text-xs">
                                                {f.label} {f.required ? '*' : ''}
                                            </Label>
                                            {f.type === 'textarea' ? (
                                                <Textarea
                                                    rows={3}
                                                    value={payload[f.key] ?? ''}
                                                    onChange={(e) => setPayload({ ...payload, [f.key]: e.target.value })}
                                                    placeholder={f.placeholder}
                                                />
                                            ) : (
                                                <Input
                                                    type={f.type}
                                                    value={payload[f.key] ?? ''}
                                                    onChange={(e) => setPayload({ ...payload, [f.key]: e.target.value })}
                                                    placeholder={f.placeholder}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="border border-border rounded-lg bg-background p-6 max-h-[60vh] overflow-y-auto">
                                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                                        {renderedText}
                                    </pre>
                                </div>
                            )}

                            <DialogFooter className="gap-2 sm:gap-0">
                                {showPreview ? (
                                    <>
                                        <Button variant="outline" onClick={() => setShowPreview(false)}>
                                            <RotateCcw className="w-4 h-4 mr-1" /> ย้อนกลับแก้ไข
                                        </Button>
                                        <Button onClick={handlePrint}>
                                            <Printer className="w-4 h-4 mr-1" /> พิมพ์
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button variant="outline" onClick={() => setSelected(null)}>ยกเลิก</Button>
                                        <Button onClick={handlePreview}>ดูตัวอย่าง</Button>
                                    </>
                                )}
                            </DialogFooter>
                        </>
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DocTemplatesManagement;
export { DocTemplatesManagement };
