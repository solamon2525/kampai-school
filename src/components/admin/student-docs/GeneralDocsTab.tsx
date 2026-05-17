import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Paperclip, Trash2, FileText } from 'lucide-react';
import {
    studentDocumentsService, type StudentDocument,
} from '@/services/student-documents.service';
import { formatThaiDateFull } from '@/lib/thaiDate';
import { ThaiDatePicker } from '@/components/shared/ThaiDatePicker';

interface GeneralDocsTabProps { studentId: string }

export const GeneralDocsTab = ({ studentId }: GeneralDocsTabProps) => {
    const [docs, setDocs] = useState<StudentDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState<{
        doc_date: string; title: string; notes: string; file: File | null;
    }>({
        doc_date: new Date().toISOString().slice(0, 10),
        title: '', notes: '', file: null,
    });
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    const reload = async () => {
        setLoading(true);
        const res = await studentDocumentsService.listByStudent(studentId, 'general');
        if (res.data) setDocs(res.data);
        setLoading(false);
    };
    useEffect(() => { reload(); /* eslint-disable-next-line */ }, [studentId]);

    const handleSave = async () => {
        if (!form.title.trim() && !form.file) {
            toast({ title: 'กรอกหัวเรื่องหรือเลือกไฟล์', variant: 'destructive' });
            return;
        }
        setSaving(true);
        let fileUrl: string | null = null;
        if (form.file) {
            const up = await studentDocumentsService.upload(studentId, 'general', form.file);
            if (up.error) {
                setSaving(false);
                toast({ title: 'อัปโหลดล้มเหลว', description: up.error.message, variant: 'destructive' });
                return;
            }
            fileUrl = up.url;
        }
        const res = await studentDocumentsService.create({
            student_id: studentId,
            category_key: 'general',
            doc_date: form.doc_date,
            title: form.title || null,
            file_url: fileUrl,
            notes: form.notes || null,
        });
        setSaving(false);
        if (res.error) { toast({ title: 'บันทึกล้มเหลว', description: res.error.message, variant: 'destructive' }); return; }
        toast({ title: 'เพิ่มเอกสารแล้ว' });
        setDialogOpen(false);
        setForm({ doc_date: new Date().toISOString().slice(0, 10), title: '', notes: '', file: null });
        reload();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ลบเอกสารนี้?')) return;
        await studentDocumentsService.remove(id);
        toast({ title: 'ลบแล้ว' });
        reload();
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-primary" /> เอกสารทั่วไป
                </h3>
                <Button size="sm" onClick={() => setDialogOpen(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> เพิ่ม
                </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
                เก็บสำเนาบัตรประชาชน, สำเนาทะเบียนบ้าน, สูติบัตร, หรือเอกสารอื่นที่ไม่มีหมวดเฉพาะ
            </p>

            {loading ? (
                <p className="text-sm text-muted-foreground py-4 text-center">กำลังโหลด…</p>
            ) : docs.length === 0 ? (
                <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">ยังไม่มีเอกสาร</CardContent></Card>
            ) : (
                <ul className="space-y-1.5">
                    {docs.map((d) => (
                        <Card key={d.id}>
                            <CardContent className="p-3 flex items-center gap-3">
                                <Paperclip className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    {d.file_url ? (
                                        <a href={d.file_url} target="_blank" rel="noreferrer" className="text-sm font-medium hover:underline truncate block">
                                            {d.title || 'ไฟล์แนบ'}
                                        </a>
                                    ) : (
                                        <p className="text-sm font-medium">{d.title || '–'}</p>
                                    )}
                                    <div className="text-[11px] text-muted-foreground flex gap-2">
                                        <span>{formatThaiDateFull(d.doc_date)}</span>
                                        {d.notes ? <span>• {d.notes}</span> : null}
                                    </div>
                                </div>
                                <Button size="icon" variant="ghost" className="w-7 h-7 text-destructive" onClick={() => handleDelete(d.id)}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </ul>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>เพิ่มเอกสารทั่วไป</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label className="mb-1 block text-xs">วันที่</Label>
                                <ThaiDatePicker value={form.doc_date} onChange={v => setForm({ ...form, doc_date: v })} />
                            </div>
                            <div>
                                <Label className="mb-1 block text-xs">หัวเรื่อง</Label>
                                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="เช่น สำเนาบัตร" />
                            </div>
                        </div>
                        <div>
                            <Label className="mb-1 block text-xs">หมายเหตุ</Label>
                            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                        </div>
                        <div>
                            <Label className="mb-1 block text-xs">ไฟล์</Label>
                            <Input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] ?? null })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
                        <Button onClick={handleSave} disabled={saving}>{saving ? 'กำลังบันทึก…' : 'บันทึก'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
