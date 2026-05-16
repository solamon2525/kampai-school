import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, FileText, Award, LayoutDashboard, ListTodo } from 'lucide-react';
import CertificateViewer from './CertificateViewer';
import { ImageUpload } from '@/components/admin/shared/ImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { trainingService, type TrainingRecord } from '@/services/training.service';
import { TrainingShowcase } from './TrainingShowcase';

interface Staff { id: string; name: string; }

const TRAINING_TYPES = ['อบรม', 'สัมมนา', 'ศึกษาดูงาน', 'ประชุมวิชาการ'];
const STATUSES = ['สมัครแล้ว', 'กำลังอบรม', 'ผ่านการอบรม', 'ไม่ผ่าน'];

const statusVariant = (s: string) => {
    if (s === 'ผ่านการอบรม') return 'default';
    if (s === 'ไม่ผ่าน') return 'destructive';
    if (s === 'กำลังอบรม') return 'outline';
    return 'secondary';
};

export default function TrainingManagement() {
    const [records, setRecords] = useState<TrainingRecord[]>([]);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<TrainingRecord | null>(null);
    const [certRecord, setCertRecord] = useState<TrainingRecord | null>(null);
    const [form, setForm] = useState({
        staff_id: '',
        course_name: '',
        provider: '',
        training_type: 'อบรม',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        hours: 0,
        location: '',
        budget: 0,
        certificate_url: '',
        status: 'สมัครแล้ว',
        notes: '',
    });

    useEffect(() => {
        fetchRecords();
        fetchStaff();
    }, []);

    async function fetchStaff() {
        const { data } = await supabase.from('staff').select('id, name').order('name');
        setStaffList(data || []);
    }

    async function fetchRecords() {
        setLoading(true);
        const { data, error } = await trainingService.getAll();
        if (error) toast.error('โหลดข้อมูลไม่สำเร็จ');
        else setRecords((data ?? []) as unknown as TrainingRecord[]);
        setLoading(false);
    }

    function openCreate() {
        setEditing(null);
        setForm({
            staff_id: '', course_name: '', provider: '', training_type: 'อบรม',
            start_date: new Date().toISOString().split('T')[0], end_date: '',
            hours: 0, location: '', budget: 0, certificate_url: '',
            status: 'สมัครแล้ว', notes: '',
        });
        setDialogOpen(true);
    }

    function openEdit(r: TrainingRecord) {
        setEditing(r);
        setForm({
            staff_id: r.staff_id || '',
            course_name: r.course_name,
            provider: r.provider || '',
            training_type: r.training_type,
            start_date: r.start_date,
            end_date: r.end_date || '',
            hours: r.hours,
            location: r.location || '',
            budget: r.budget,
            certificate_url: r.certificate_url || '',
            status: r.status,
            notes: r.notes || '',
        });
        setDialogOpen(true);
    }

    async function handleSave() {
        if (!form.course_name) { toast.error('กรุณากรอกชื่อหลักสูตร'); return; }
        const payload = {
            staff_id: form.staff_id || null,
            course_name: form.course_name,
            provider: form.provider || null,
            training_type: form.training_type,
            start_date: form.start_date,
            end_date: form.end_date || null,
            hours: Number(form.hours),
            location: form.location || null,
            budget: Number(form.budget),
            certificate_url: form.certificate_url || null,
            status: form.status,
            notes: form.notes || null,
        };
        if (editing) {
            const { error } = await trainingService.update(editing.id, payload);
            if (error) { toast.error('บันทึกไม่สำเร็จ'); return; }
            toast.success('แก้ไขสำเร็จ');
        } else {
            const { error } = await trainingService.insert(payload as never);
            if (error) { toast.error('บันทึกไม่สำเร็จ'); return; }
            toast.success('เพิ่มข้อมูลสำเร็จ');
        }
        setDialogOpen(false);
        fetchRecords();
    }

    async function handleDelete(id: string) {
        if (!confirm('ยืนยันการลบ?')) return;
        const { error } = await trainingService.delete(id);
        if (error) toast.error('ลบไม่สำเร็จ');
        else { toast.success('ลบสำเร็จ'); fetchRecords(); }
    }

    const filtered = records.filter(r => {
        const matchStatus = filterStatus === 'all' || r.status === filterStatus;
        const staffName = r.staff?.name || '';
        const matchSearch = !search || r.course_name.toLowerCase().includes(search.toLowerCase()) || staffName.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">การอบรม</h2>
                    <p className="text-muted-foreground text-sm">บันทึกประวัติการอบรม สัมมนา และศึกษาดูงานของบุคลากร</p>
                </div>
            </div>

            <Tabs defaultValue="manage">
                <TabsList>
                    <TabsTrigger value="manage" className="gap-1.5">
                        <ListTodo className="w-4 h-4" /> จัดการ
                    </TabsTrigger>
                    <TabsTrigger value="showcase" className="gap-1.5">
                        <LayoutDashboard className="w-4 h-4" /> ภาพรวม
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="manage" className="space-y-4 pt-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex gap-3 flex-wrap flex-1">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input placeholder="ค้นหาชื่อหลักสูตร หรือบุคลากร..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                            </div>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-[160px]"><SelectValue placeholder="สถานะ" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">ทุกสถานะ</SelectItem>
                                    {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />เพิ่มการอบรม</Button>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>บุคลากร</TableHead>
                                    <TableHead>หลักสูตร</TableHead>
                                    <TableHead>ประเภท</TableHead>
                                    <TableHead>วันที่</TableHead>
                                    <TableHead>ชม.</TableHead>
                                    <TableHead>สถานะ</TableHead>
                                    <TableHead>ใบรับรอง</TableHead>
                                    <TableHead className="text-right">จัดการ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">กำลังโหลด...</TableCell></TableRow>
                                ) : filtered.length === 0 ? (
                                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">ไม่พบข้อมูล</TableCell></TableRow>
                                ) : filtered.map(r => (
                                    <TableRow key={r.id}>
                                        <TableCell>{r.staff?.name || '-'}</TableCell>
                                        <TableCell className="max-w-[180px] truncate font-medium">{r.course_name}</TableCell>
                                        <TableCell><Badge variant="outline">{r.training_type}</Badge></TableCell>
                                        <TableCell className="text-sm">{r.start_date}</TableCell>
                                        <TableCell>{r.hours}</TableCell>
                                        <TableCell><Badge variant={statusVariant(r.status) as any}>{r.status}</Badge></TableCell>
                                        <TableCell>
                                            {r.certificate_url ? (
                                                <a href={r.certificate_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
                                                    <FileText className="w-3 h-3" />ดู
                                                </a>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {r.status === 'ผ่านการอบรม' && (
                                                    <Button size="icon" variant="ghost" title="ดูวุฒิบัตร" onClick={() => setCertRecord(r)}>
                                                        <Award className="w-4 h-4 text-amber-600" />
                                                    </Button>
                                                )}
                                                <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="w-4 h-4" /></Button>
                                                <Button size="icon" variant="ghost" onClick={() => handleDelete(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="showcase" className="pt-4">
                    <TrainingShowcase records={records} loading={loading} />
                </TabsContent>
            </Tabs>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{editing ? 'แก้ไขการอบรม' : 'เพิ่มการอบรม'}</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label>บุคลากร</Label>
                            <Select value={form.staff_id} onValueChange={v => setForm(f => ({ ...f, staff_id: v }))}>
                                <SelectTrigger><SelectValue placeholder="เลือกบุคลากร" /></SelectTrigger>
                                <SelectContent>
                                    {staffList.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>ชื่อหลักสูตร <span className="text-destructive">*</span></Label>
                            <Input value={form.course_name} onChange={e => setForm(f => ({ ...f, course_name: e.target.value }))} placeholder="ชื่อหลักสูตร/การอบรม" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>ประเภท</Label>
                                <Select value={form.training_type} onValueChange={v => setForm(f => ({ ...f, training_type: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{TRAINING_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label>สถานะ</Label>
                                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label>หน่วยงานที่จัด</Label>
                            <Input value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} placeholder="ชื่อหน่วยงาน/สถาบัน" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>วันที่เริ่ม</Label>
                                <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
                            </div>
                            <div className="space-y-1">
                                <Label>วันที่สิ้นสุด</Label>
                                <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>จำนวนชั่วโมง</Label>
                                <Input type="number" min={0} value={form.hours} onChange={e => setForm(f => ({ ...f, hours: Number(e.target.value) }))} />
                            </div>
                            <div className="space-y-1">
                                <Label>งบประมาณ (บาท)</Label>
                                <Input type="number" min={0} value={form.budget} onChange={e => setForm(f => ({ ...f, budget: Number(e.target.value) }))} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label>สถานที่</Label>
                            <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="สถานที่จัดอบรม" />
                        </div>
                        <div className="space-y-1">
                            <Label>ใบรับรอง / วุฒิบัตร</Label>
                            <ImageUpload
                                onUploadComplete={(url) => setForm(f => ({ ...f, certificate_url: url }))}
                                currentImage={form.certificate_url}
                                bucket="school-images"
                                folder="training-certificates"
                                maxSizeMB={10}
                                compressionPreset="gallery"
                            />
                            <p className="text-[10px] text-muted-foreground">รองรับ JPG/PNG/PDF (กรณีไฟล์ PDF แนะนำให้แปลงเป็นรูป)</p>
                        </div>
                        <div className="space-y-1">
                            <Label>หมายเหตุ</Label>
                            <Textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
                        <Button onClick={handleSave}>บันทึก</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <CertificateViewer
                record={certRecord as any}
                open={!!certRecord}
                onClose={() => setCertRecord(null)}
            />
        </div>
    );
}
