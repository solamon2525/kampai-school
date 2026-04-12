import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search, Users, Camera, Upload, CreditCard, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { ImageUpload } from '../shared/ImageUpload';
import {
    useReactTable, getCoreRowModel, getFilteredRowModel,
    getPaginationRowModel, getSortedRowModel, flexRender,
    type ColumnDef, type SortingState,
} from '@tanstack/react-table';
import Webcam from 'react-webcam';
import StudentCard from './StudentCard';

interface Student {
    id: string;
    student_code: string | null;
    name: string;
    class: string;
    class_number: number | null;
    gender: string | null;
    is_active: boolean;
    photo_url: string | null;
    parent_name: string | null;
    parent_phone: string | null;
    created_at: string;
    updated_at: string;
}

const CLASS_OPTIONS = [
    'อ.1', 'อ.2', 'อ.3',
    'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6',
    'ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6',
];

const defaultForm = {
    student_code: '',
    name: '',
    class: '',
    class_number: '' as string | number,
    gender: 'male' as 'male' | 'female',
    is_active: true,
    photo_url: '',
    parent_name: '',
    parent_phone: '',
};

function StudentAvatar({ photo_url, name, size = 32 }: { photo_url: string | null; name: string; size?: number }) {
    const initials = name.slice(0, 1);
    if (photo_url) {
        return (
            <img
                src={photo_url}
                alt={name}
                style={{ width: size, height: size }}
                className="rounded-full object-cover border-2 border-border flex-shrink-0"
            />
        );
    }
    return (
        <div
            style={{ width: size, height: size, fontSize: size * 0.4 }}
            className="rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold flex-shrink-0 border-2 border-border"
        >
            {initials}
        </div>
    );
}

export const StudentListManagement = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Student | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterClass, setFilterClass] = useState('all');
    const [formData, setFormData] = useState(defaultForm);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [webcamOpen, setWebcamOpen] = useState(false);
    const [cardStudent, setCardStudent] = useState<Student | null>(null);
    const [printClass, setPrintClass] = useState<string | null>(null);
    const webcamRef = useRef<Webcam>(null);
    const { toast } = useToast();

    useEffect(() => { fetchStudents(); }, []);

    const fetchStudents = async () => {
        setIsLoading(true);
        const { data, error } = await supabase.from('students').select('*').order('class').order('class_number');
        if (error) toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: error.message });
        else setStudents(data || []);
        setIsLoading(false);
    };

    const captureWebcam = useCallback(async () => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (!imageSrc) return;
        const blob = await fetch(imageSrc).then(r => r.blob());
        const file = new File([blob], `webcam_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const path = `students/${Date.now()}_webcam.jpg`;
        const { error } = await supabase.storage.from('school-images').upload(path, file, { upsert: true });
        if (error) { toast({ variant: 'destructive', title: 'อัพโหลดรูปไม่สำเร็จ' }); return; }
        const { data: { publicUrl } } = supabase.storage.from('school-images').getPublicUrl(path);
        setFormData(f => ({ ...f, photo_url: publicUrl }));
        setWebcamOpen(false);
        toast({ title: 'ถ่ายรูปสำเร็จ' });
    }, [toast]);

    const handleOpenDialog = (item?: Student) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                student_code: item.student_code || '',
                name: item.name,
                class: item.class,
                class_number: item.class_number ?? '',
                gender: (item.gender as 'male' | 'female') || 'male',
                is_active: item.is_active,
                photo_url: item.photo_url || '',
                parent_name: item.parent_name || '',
                parent_phone: item.parent_phone || '',
            });
        } else {
            setEditingItem(null);
            setFormData(defaultForm);
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            student_code: formData.student_code || null,
            name: formData.name,
            class: formData.class,
            class_number: formData.class_number !== '' ? Number(formData.class_number) : null,
            gender: formData.gender,
            is_active: formData.is_active,
            photo_url: formData.photo_url || null,
            parent_name: formData.parent_name || null,
            parent_phone: formData.parent_phone || null,
            updated_at: new Date().toISOString(),
        };
        const { error } = editingItem
            ? await supabase.from('students').update(payload).eq('id', editingItem.id)
            : await supabase.from('students').insert(payload);
        if (error) { toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: error.message }); return; }
        toast({ title: 'สำเร็จ', description: editingItem ? 'แก้ไขข้อมูลเรียบร้อย' : 'เพิ่มนักเรียนใหม่เรียบร้อย' });
        setIsDialogOpen(false);
        fetchStudents();
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const { error } = await supabase.from('students').delete().eq('id', deleteId);
        if (error) toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: error.message });
        else { toast({ title: 'สำเร็จ', description: 'ลบนักเรียนเรียบร้อย' }); fetchStudents(); }
        setDeleteId(null);
    };

    const uniqueClasses = useMemo(() => Array.from(new Set(students.map(s => s.class))).sort(), [students]);

    const columns: ColumnDef<Student>[] = useMemo(() => [
        {
            id: 'avatar',
            header: 'รูป',
            cell: ({ row }) => <StudentAvatar photo_url={row.original.photo_url} name={row.original.name} size={36} />,
            enableSorting: false,
            size: 56,
        },
        { accessorKey: 'student_code', header: 'รหัส', cell: ({ getValue }) => <span className="font-mono text-xs text-muted-foreground">{(getValue() as string) || '—'}</span> },
        {
            accessorKey: 'name', header: 'ชื่อ-นามสกุล',
            cell: ({ row }) => (
                <div>
                    <div className="font-medium">{row.original.name}</div>
                    {row.original.parent_name && <div className="text-xs text-muted-foreground">ผู้ปกครอง: {row.original.parent_name}</div>}
                </div>
            ),
        },
        { accessorKey: 'class', header: 'ห้อง' },
        { accessorKey: 'class_number', header: 'เลขที่', cell: ({ getValue }) => <span className="text-center block">{(getValue() as number) ?? '—'}</span> },
        {
            accessorKey: 'gender', header: 'เพศ',
            cell: ({ getValue }) => <Badge variant={(getValue() as string) === 'male' ? 'default' : 'secondary'}>{(getValue() as string) === 'male' ? 'ชาย' : 'หญิง'}</Badge>,
        },
        {
            accessorKey: 'is_active', header: 'สถานะ',
            cell: ({ getValue }) => <Badge variant={(getValue() as boolean) ? 'default' : 'outline'}>{(getValue() as boolean) ? 'กำลังศึกษา' : 'ไม่ได้ศึกษา'}</Badge>,
        },
        {
            id: 'actions', header: 'จัดการ',
            cell: ({ row }) => (
                <div className="flex gap-1 justify-center">
                    <Button size="icon" variant="ghost" title="บัตรนักเรียน" onClick={() => setCardStudent(row.original)}>
                        <CreditCard className="w-4 h-4 text-primary" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(row.original)}>
                        <Edit className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteId(row.original.id)}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                </div>
            ),
            enableSorting: false,
        },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [setCardStudent, handleOpenDialog, setDeleteId]);

    const filteredData = useMemo(
        () => students.filter(s => filterClass === 'all' || s.class === filterClass),
        [students, filterClass]
    );

    const globalFilter = searchTerm;
    const table = useReactTable({
        data: filteredData,
        columns,
        state: { sorting, globalFilter },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        initialState: { pagination: { pageSize: 20 } },
        globalFilterFn: (row, _col, value) => {
            const s = row.original;
            return s.name.includes(value) || (s.student_code || '').includes(value);
        },
    });

    const printClassStudents = students.filter(s => s.class === printClass);

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            รายชื่อนักเรียน ({students.length} คน)
                        </CardTitle>
                        <div className="flex gap-2">
                            {filterClass !== 'all' && (
                                <Button variant="outline" size="sm" onClick={() => setPrintClass(filterClass)}>
                                    <Printer className="w-4 h-4 mr-1" /> พิมพ์บัตรทั้งห้อง
                                </Button>
                            )}
                            <Button onClick={() => handleOpenDialog()} className="gap-2">
                                <Plus className="w-4 h-4" /> เพิ่มนักเรียน
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="ค้นหาชื่อหรือรหัสนักเรียน..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
                        </div>
                        <Select value={filterClass} onValueChange={setFilterClass}>
                            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="ทุกชั้น" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทุกชั้น</SelectItem>
                                {uniqueClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    {isLoading ? (
                        <p className="text-center text-muted-foreground py-8">กำลังโหลด...</p>
                    ) : table.getRowCount() === 0 ? (
                        <div className="text-center py-12">
                            <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                            <p className="text-muted-foreground">{students.length === 0 ? 'ยังไม่มีรายชื่อนักเรียน' : 'ไม่พบนักเรียนที่ค้นหา'}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-md border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    {table.getHeaderGroups().map(hg => (
                                        <tr key={hg.id}>
                                            {hg.headers.map(h => (
                                                <th key={h.id} className="text-left px-3 py-3 font-medium cursor-pointer select-none whitespace-nowrap"
                                                    onClick={h.column.getToggleSortingHandler()}>
                                                    <span className="flex items-center gap-1">
                                                        {flexRender(h.column.columnDef.header, h.getContext())}
                                                        {h.column.getIsSorted() === 'asc' ? ' ↑' : h.column.getIsSorted() === 'desc' ? ' ↓' : ''}
                                                    </span>
                                                </th>
                                            ))}
                                        </tr>
                                    ))}
                                </thead>
                                <tbody>
                                    {table.getRowModel().rows.map((row, i) => (
                                        <tr key={row.id} className={i % 2 === 0 ? '' : 'bg-muted/20'}>
                                            {row.getVisibleCells().map(cell => (
                                                <td key={cell.id} className="px-3 py-2">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {table.getPageCount() > 1 && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                                หน้า {table.getState().pagination.pageIndex + 1} / {table.getPageCount()} ({table.getFilteredRowModel().rows.length} คน)
                            </span>
                            <div className="flex gap-1">
                                <Button size="sm" variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>ก่อนหน้า</Button>
                                <Button size="sm" variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>ถัดไป</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialog เพิ่ม/แก้ไข */}
            <Dialog open={isDialogOpen} onOpenChange={open => { if (!open) setIsDialogOpen(false); }}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'แก้ไขข้อมูลนักเรียน' : 'เพิ่มนักเรียนใหม่'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Photo */}
                        <div className="space-y-2">
                            <Label>รูปนักเรียน</Label>
                            <div className="flex gap-3 items-start">
                                <div className="flex-1">
                                    <ImageUpload
                                        bucket="school-images"
                                        folder="students"
                                        compressionPreset="avatar"
                                        currentImage={formData.photo_url}
                                        onUploadComplete={url => setFormData(f => ({ ...f, photo_url: url }))}
                                    />
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={() => setWebcamOpen(true)} className="gap-1 mt-1">
                                    <Camera className="w-4 h-4" /> ถ่ายรูป
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>รหัสนักเรียน</Label>
                                <Input placeholder="เช่น 12345" value={formData.student_code} onChange={e => setFormData({ ...formData, student_code: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>เพศ</Label>
                                <Select value={formData.gender} onValueChange={v => setFormData({ ...formData, gender: v as 'male' | 'female' })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">ชาย</SelectItem>
                                        <SelectItem value="female">หญิง</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>ชื่อ-นามสกุล *</Label>
                            <Input placeholder="เช่น เด็กชายสมศักดิ์ ใจดี" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>ห้องเรียน *</Label>
                                <Select value={formData.class} onValueChange={v => setFormData({ ...formData, class: v })}>
                                    <SelectTrigger><SelectValue placeholder="เลือกชั้น" /></SelectTrigger>
                                    <SelectContent>{CLASS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>เลขที่</Label>
                                <Input type="number" min={1} placeholder="เลขที่" value={formData.class_number} onChange={e => setFormData({ ...formData, class_number: e.target.value })} />
                            </div>
                        </div>

                        <div className="border-t pt-3 space-y-3">
                            <Label className="text-muted-foreground text-xs uppercase tracking-wide">ข้อมูลผู้ปกครอง</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>ชื่อผู้ปกครอง</Label>
                                    <Input placeholder="ชื่อ-นามสกุล" value={formData.parent_name} onChange={e => setFormData({ ...formData, parent_name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>เบอร์โทรศัพท์</Label>
                                    <Input placeholder="08x-xxx-xxxx" value={formData.parent_phone} onChange={e => setFormData({ ...formData, parent_phone: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Switch id="is_active" checked={formData.is_active} onCheckedChange={c => setFormData({ ...formData, is_active: c })} />
                            <Label htmlFor="is_active">กำลังศึกษาอยู่</Label>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>ยกเลิก</Button>
                            <Button type="submit">{editingItem ? 'บันทึก' : 'เพิ่มนักเรียน'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Webcam Dialog */}
            <Dialog open={webcamOpen} onOpenChange={setWebcamOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>ถ่ายรูปนักเรียน</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <Webcam
                            ref={webcamRef}
                            audio={false}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{ facingMode: 'user', width: 400, height: 400 }}
                            className="w-full rounded-lg"
                        />
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => setWebcamOpen(false)}>ยกเลิก</Button>
                            <Button className="flex-1" onClick={captureWebcam}>
                                <Camera className="w-4 h-4 mr-1" /> ถ่ายรูป
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Student Card Modal */}
            {cardStudent && (
                <StudentCard student={cardStudent} open={!!cardStudent} onClose={() => setCardStudent(null)} />
            )}

            {/* Print All Cards for Class */}
            {printClass && (
                <StudentCard
                    students={printClassStudents}
                    open={!!printClass}
                    onClose={() => setPrintClass(null)}
                    printAll
                />
            )}

            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="ยืนยันการลบนักเรียน"
                description="คุณแน่ใจหรือไม่ว่าต้องการลบนักเรียนคนนี้?"
            />
        </div>
    );
};
