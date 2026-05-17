import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Upload, X, Home } from 'lucide-react';
import { homeVisitsService, type HomeVisit } from '@/services/home-visits.service';
import { formatThaiDateFull } from '@/lib/thaiDate';

interface HomeVisitTabProps { studentId: string }

export const HomeVisitTab = ({ studentId }: HomeVisitTabProps) => {
    const [items, setItems] = useState<HomeVisit[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState({
        visit_date: new Date().toISOString().slice(0, 10),
        visitors_input: '',
        findings: '',
        photos: [] as { url: string }[],
    });
    const [uploading, setUploading] = useState(false);
    const { toast } = useToast();

    const reload = async () => {
        setLoading(true);
        const res = await homeVisitsService.listByStudent(studentId);
        if (res.data) setItems(res.data);
        setLoading(false);
    };
    useEffect(() => { reload(); /* eslint-disable-next-line */ }, [studentId]);

    const handleUploadPhoto = async (file: File) => {
        setUploading(true);
        const res = await homeVisitsService.uploadPhoto(studentId, file);
        setUploading(false);
        if (res.error) { toast({ title: 'อัปโหลดล้มเหลว', variant: 'destructive' }); return; }
        setForm((f) => ({ ...f, photos: [...f.photos, { url: res.url }] }));
    };

    const handleSave = async () => {
        const visitors = form.visitors_input.split(',').map((v) => v.trim()).filter(Boolean);
        const res = await homeVisitsService.create({
            student_id: studentId,
            visit_date: form.visit_date,
            visitors,
            findings: form.findings || null,
            photo_urls: form.photos.map((p) => p.url),
        });
        if (res.error) { toast({ title: 'บันทึกล้มเหลว', description: res.error.message, variant: 'destructive' }); return; }
        toast({ title: 'บันทึกการเยี่ยมบ้านแล้ว' });
        setDialogOpen(false);
        setForm({ visit_date: new Date().toISOString().slice(0, 10), visitors_input: '', findings: '', photos: [] });
        reload();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ลบบันทึกการเยี่ยมบ้านนี้?')) return;
        await homeVisitsService.remove(id);
        toast({ title: 'ลบแล้ว' });
        reload();
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-1.5">
                    <Home className="w-4 h-4 text-primary" /> ประวัติการเยี่ยมบ้าน
                </h3>
                <Button size="sm" onClick={() => setDialogOpen(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> เพิ่มบันทึก
                </Button>
            </div>

            {loading ? (
                <p className="text-sm text-muted-foreground py-4 text-center">กำลังโหลด…</p>
            ) : items.length === 0 ? (
                <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">ยังไม่มีบันทึกการเยี่ยมบ้าน</CardContent></Card>
            ) : (
                <ol className="space-y-2">
                    {items.map((v) => (
                        <Card key={v.id}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm">{formatThaiDateFull(v.visit_date)}</CardTitle>
                                    <Button size="icon" variant="ghost" className="w-6 h-6 text-destructive" onClick={() => handleDelete(v.id)}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                                {v.visitors.length > 0 ? (
                                    <div className="flex gap-1 flex-wrap mt-1">
                                        {v.visitors.map((vs, i) => (
                                            <Badge key={i} variant="secondary" className="text-[10px]">{vs}</Badge>
                                        ))}
                                    </div>
                                ) : null}
                            </CardHeader>
                            <CardContent className="pt-0 space-y-2">
                                {v.findings ? (
                                    <p className="text-sm text-foreground whitespace-pre-wrap">{v.findings}</p>
                                ) : null}
                                {v.photo_urls.length > 0 ? (
                                    <div className="flex gap-2 flex-wrap">
                                        {v.photo_urls.map((url, i) => (
                                            <a key={i} href={url} target="_blank" rel="noreferrer"
                                                className="block w-20 h-20 bg-muted rounded overflow-hidden">
                                                <img src={url} alt="" className="w-full h-full object-cover" />
                                            </a>
                                        ))}
                                    </div>
                                ) : null}
                            </CardContent>
                        </Card>
                    ))}
                </ol>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>เพิ่มบันทึกการเยี่ยมบ้าน</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label className="mb-1 block text-xs">วันที่เยี่ยม *</Label>
                            <Input type="date" value={form.visit_date} onChange={(e) => setForm({ ...form, visit_date: e.target.value })} />
                        </div>
                        <div>
                            <Label className="mb-1 block text-xs">ผู้ไปเยี่ยม (คั่นด้วย ,)</Label>
                            <Input value={form.visitors_input} onChange={(e) => setForm({ ...form, visitors_input: e.target.value })} placeholder="เช่น ครูสมศรี, ครูวิภา" />
                        </div>
                        <div>
                            <Label className="mb-1 block text-xs">สิ่งที่พบ / สรุป</Label>
                            <Textarea rows={3} value={form.findings} onChange={(e) => setForm({ ...form, findings: e.target.value })} placeholder="สภาพครอบครัว สิ่งที่ต้องการช่วยเหลือ…" />
                        </div>
                        <div>
                            <Label className="mb-1 block text-xs">รูปถ่าย (เลือกได้หลายไฟล์)</Label>
                            <Input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => {
                                    const files = Array.from(e.target.files ?? []);
                                    files.forEach(handleUploadPhoto);
                                    e.target.value = '';
                                }}
                            />
                            {uploading ? <p className="text-[11px] text-muted-foreground mt-1">กำลังอัปโหลด…</p> : null}
                            {form.photos.length > 0 ? (
                                <div className="flex gap-2 flex-wrap mt-2">
                                    {form.photos.map((p, i) => (
                                        <div key={i} className="relative w-16 h-16 bg-muted rounded overflow-hidden">
                                            <img src={p.url} alt="" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => setForm((f) => ({ ...f, photos: f.photos.filter((_, j) => j !== i) }))}
                                                className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-bl p-0.5"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
                        <Button onClick={handleSave} disabled={uploading}>บันทึก</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
