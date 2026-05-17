import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { ArrowLeft, GraduationCap, Plus, Paperclip, Trash2, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
    studentDocumentsService, STUDENT_DOC_CATEGORIES,
    type StudentDocCategoryKey, type StudentDocument,
} from '@/services/student-documents.service';
import { formatThaiDateFull } from '@/lib/thaiDate';

type Student = { id: string; first_name: string | null; last_name: string | null; photo_url: string | null; classroom: string | null };

const StudentDocsHub = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const category = searchParams.get('cat') as StudentDocCategoryKey | null;
    const navigate = useNavigate();
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const res = await studentDocumentsService.countsByCategory();
            if (res.data) setCounts(res.data);
            setLoading(false);
        })();
    }, []);

    if (category) {
        return (
            <StudentDocsByCategory
                category={category}
                onBack={() => setSearchParams({})}
            />
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
            <div>
                <p className="text-xs font-semibold text-primary uppercase">เอกสารนักเรียน</p>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mt-1 flex items-center gap-2">
                    <GraduationCap className="w-8 h-8 text-primary" /> Student Documents Hub
                </h1>
                <p className="text-sm text-muted-foreground mt-1">6 หมวด — ทะเบียน, ปพ., SDQ, อาหาร, เยี่ยมบ้าน, ดูแลช่วยเหลือ</p>
            </div>

            {loading ? (
                <p className="text-center py-12 text-muted-foreground">กำลังโหลด…</p>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {STUDENT_DOC_CATEGORIES.map((cat) => (
                        <Card
                            key={cat.key}
                            className="cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
                            onClick={() => setSearchParams({ cat: cat.key })}
                        >
                            <CardContent className="p-4 text-center space-y-2">
                                <span className="text-3xl block" aria-hidden>{cat.emoji}</span>
                                <p className="font-semibold text-sm text-foreground">{cat.label}</p>
                                <p className="text-[11px] text-muted-foreground">{cat.description}</p>
                                <Badge variant="outline" className="text-[10px]">{counts[cat.key] ?? 0} รายการ</Badge>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                    <p>
                        💡 คลิกหมวดเพื่ออัปโหลด/บันทึกเอกสารต่อนักเรียน
                        — ระบบ SDQ + เยี่ยมบ้านแบบเต็มจะอยู่ใน sub-page เฉพาะของหมวด (Phase ถัดไป).
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

interface ByCategoryProps {
    category: StudentDocCategoryKey;
    onBack: () => void;
}

const StudentDocsByCategory = ({ category, onBack }: ByCategoryProps) => {
    const meta = STUDENT_DOC_CATEGORIES.find((c) => c.key === category)!;
    const [docs, setDocs] = useState<(StudentDocument & { student?: Student })[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState<{
        student_id: string; doc_date: string; title: string; notes: string; file: File | null;
    }>({
        student_id: '', doc_date: new Date().toISOString().slice(0, 10),
        title: '', notes: '', file: null,
    });

    const reload = async () => {
        setLoading(true);
        const res = await studentDocumentsService.listByCategory(category);
        if (res.data) {
            setDocs(res.data as (StudentDocument & { student?: Student })[]);
        }
        setLoading(false);
    };
    useEffect(() => { reload(); /* eslint-disable-next-line */ }, [category]);

    useEffect(() => {
        supabase.from('students')
            .select('id, first_name, last_name, photo_url, classroom')
            .order('first_name')
            .then(({ data }) => { if (data) setStudents(data as Student[]); });
    }, []);

    const handleSave = async () => {
        if (!form.student_id) { toast({ title: 'เลือกนักเรียน', variant: 'destructive' }); return; }
        let fileUrl: string | null = null;
        if (form.file) {
            const up = await studentDocumentsService.upload(form.student_id, category, form.file);
            if (up.error) { toast({ title: 'อัปโหลดไฟล์ล้มเหลว', description: up.error.message, variant: 'destructive' }); return; }
            fileUrl = up.url;
        }
        const res = await studentDocumentsService.create({
            student_id: form.student_id,
            category_key: category,
            doc_date: form.doc_date,
            title: form.title || null,
            file_url: fileUrl,
            notes: form.notes || null,
        });
        if (res.error) { toast({ title: 'บันทึกล้มเหลว', description: res.error.message, variant: 'destructive' }); return; }
        toast({ title: 'เพิ่มเอกสารแล้ว' });
        setDialogOpen(false);
        setForm({ student_id: '', doc_date: new Date().toISOString().slice(0, 10), title: '', notes: '', file: null });
        reload();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ลบเอกสารนี้?')) return;
        await studentDocumentsService.remove(id);
        toast({ title: 'ลบแล้ว' });
        reload();
    };

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
            <div className="flex items-center gap-3">
                <Button size="icon" variant="ghost" onClick={onBack}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <p className="text-xs font-semibold text-primary uppercase">เอกสารนักเรียน</p>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                        <span>{meta.emoji}</span> {meta.label}
                    </h1>
                    <p className="text-sm text-muted-foreground">{meta.description}</p>
                </div>
                <div className="ml-auto">
                    <Button onClick={() => setDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-1" /> เพิ่มเอกสาร
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <p className="text-center py-12 text-muted-foreground">กำลังโหลด…</p>
                    ) : docs.length === 0 ? (
                        <p className="text-center py-12 text-muted-foreground">ยังไม่มีเอกสารในหมวดนี้</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>นักเรียน</TableHead>
                                    <TableHead>วันที่</TableHead>
                                    <TableHead>หัวเรื่อง</TableHead>
                                    <TableHead>หมายเหตุ</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {docs.map((d) => {
                                    const name = d.student
                                        ? `${d.student.first_name ?? ''} ${d.student.last_name ?? ''}`.trim() || '–'
                                        : '–';
                                    return (
                                        <TableRow key={d.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {d.student ? (
                                                        <PersonAvatar name={name} photoUrl={d.student.photo_url} size="xs" />
                                                    ) : null}
                                                    <div>
                                                        <p className="text-sm">{name}</p>
                                                        {d.student?.classroom ? (
                                                            <p className="text-[11px] text-muted-foreground">ห้อง {d.student.classroom}</p>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs whitespace-nowrap">{formatThaiDateFull(d.doc_date)}</TableCell>
                                            <TableCell className="text-sm">
                                                <div className="flex items-center gap-1">
                                                    {d.file_url ? (
                                                        <a href={d.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline">
                                                            <Paperclip className="w-3 h-3" /> {d.title ?? 'ไฟล์แนบ'}
                                                        </a>
                                                    ) : (
                                                        d.title ?? '–'
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{d.notes ?? '–'}</TableCell>
                                            <TableCell>
                                                <Button size="icon" variant="ghost" className="w-7 h-7 text-destructive"
                                                    onClick={() => handleDelete(d.id)}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>เพิ่ม{meta.label}</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label className="mb-1 block text-xs">นักเรียน *</Label>
                            <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                                <SelectTrigger><SelectValue placeholder="เลือกนักเรียน" /></SelectTrigger>
                                <SelectContent>
                                    {students.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {`${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() || s.id} {s.classroom ? `(${s.classroom})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label className="mb-1 block text-xs">วันที่</Label>
                                <Input type="date" value={form.doc_date} onChange={(e) => setForm({ ...form, doc_date: e.target.value })} />
                            </div>
                            <div>
                                <Label className="mb-1 block text-xs">หัวเรื่อง</Label>
                                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <Label className="mb-1 block text-xs">หมายเหตุ</Label>
                            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                        </div>
                        <div>
                            <Label className="mb-1 block text-xs">ไฟล์</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                                    onChange={(e) => setForm({ ...form, file: e.target.files?.[0] ?? null })}
                                />
                                <Upload className="w-4 h-4 text-muted-foreground" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
                        <Button onClick={handleSave}>บันทึก</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default StudentDocsHub;
export { StudentDocsHub };
