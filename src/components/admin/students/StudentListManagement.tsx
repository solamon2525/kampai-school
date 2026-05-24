import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client'; // ใช้เฉพาะ storage (webcam)
import { studentsService } from '@/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Search, Users, Camera, CreditCard, Printer, QrCode } from 'lucide-react';
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
import StudentQRSheet from './StudentQRSheet';
import { ThaiDatePicker } from '@/components/shared/ThaiDatePicker';

interface Student {
    id: string;
    student_code: string | null;
    name: string;
    title: string | null;
    first_name: string | null;
    last_name: string | null;
    nickname: string | null;
    class: string;
    room: string | null;
    class_number: number | null;
    gender: string | null;
    national_id: string | null;
    birth_date: string | null;
    religion: string | null;
    nationality: string | null;
    blood_type: string | null;
    is_active: boolean;
    photo_url: string | null;
    // ที่อยู่ปัจจุบัน
    current_house_no: string | null;
    current_moo: string | null;
    current_road: string | null;
    current_tambon: string | null;
    current_amphoe: string | null;
    current_province: string | null;
    current_postal_code: string | null;
    current_phone: string | null;
    // ที่อยู่ตามทะเบียนบ้าน
    registered_house_no: string | null;
    registered_moo: string | null;
    registered_road: string | null;
    registered_tambon: string | null;
    registered_amphoe: string | null;
    registered_province: string | null;
    registered_postal_code: string | null;
    registered_phone: string | null;
    // ครอบครัว
    father_name: string | null;
    mother_name: string | null;
    guardian_name: string | null;
    guardian_relation: string | null;
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

const TITLE_OPTIONS = ['ด.ช.', 'ด.ญ.', 'นาย', 'นาง', 'นางสาว'];
const BLOOD_TYPE_OPTIONS = ['A', 'B', 'AB', 'O'];

const defaultForm = {
    // ข้อมูลพื้นฐาน
    student_code: '',
    name: '',
    title: 'ด.ช.',
    first_name: '',
    last_name: '',
    nickname: '',
    class: '',
    room: '1',
    class_number: '' as string | number,
    gender: 'male' as 'male' | 'female',
    is_active: true,
    photo_url: '',
    // ข้อมูลส่วนตัว
    national_id: '',
    birth_date: '',
    religion: 'พุทธ',
    nationality: 'ไทย',
    blood_type: '',
    // ที่อยู่ปัจจุบัน
    current_house_no: '',
    current_moo: '',
    current_road: '',
    current_tambon: '',
    current_amphoe: '',
    current_province: '',
    current_postal_code: '',
    current_phone: '',
    // ที่อยู่ทะเบียนบ้าน
    registered_house_no: '',
    registered_moo: '',
    registered_road: '',
    registered_tambon: '',
    registered_amphoe: '',
    registered_province: '',
    registered_postal_code: '',
    registered_phone: '',
    // ครอบครัว
    father_name: '',
    mother_name: '',
    guardian_name: '',
    guardian_relation: '',
    parent_name: '',
    parent_phone: '',
};

/** คำนวณอายุจากวันเกิด (ค.ศ.) */
function calcAge(birth_date: string | null): string {
    if (!birth_date) return '—';
    const birth = new Date(birth_date);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) years--;
    return `${years} ปี`;
}

/** แปลง birth_date (ค.ศ.) → แสดงเป็น พ.ศ. */
function formatBirthDate(birth_date: string | null): string {
    if (!birth_date) return '—';
    const d = new Date(birth_date);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear() + 543;
    return `${dd}/${mm}/${yyyy}`;
}

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

/** แสดงข้อมูลแบบ read-only */
const InfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div>
        <span className="text-xs text-muted-foreground">{label}</span>
        <p className="text-sm font-medium">{value || '—'}</p>
    </div>
);

export const StudentListManagement = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Student | null>(null);
    const [viewStudent, setViewStudent] = useState<Student | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterClass, setFilterClass] = useState('all');
    const [filterRoom, setFilterRoom] = useState('all');
    const [filterGender, setFilterGender] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [formData, setFormData] = useState(defaultForm);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [webcamOpen, setWebcamOpen] = useState(false);
    const [cardStudent, setCardStudent] = useState<Student | null>(null);
    const [printClass, setPrintClass] = useState<string | null>(null);
    const [qrSheetOpen, setQrSheetOpen] = useState(false);
    const webcamRef = useRef<Webcam>(null);
    const { toast } = useToast();

    useEffect(() => { fetchStudents(); }, []);

    const fetchStudents = async () => {
        setIsLoading(true);
        const { data, error } = await studentsService.getAll();
        if (error) toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: error.message });
        else setStudents((data || []) as Student[]);
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
                title: item.title || 'ด.ช.',
                first_name: item.first_name || '',
                last_name: item.last_name || '',
                nickname: item.nickname || '',
                class: item.class,
                room: item.room || '1',
                class_number: item.class_number ?? '',
                gender: (item.gender as 'male' | 'female') || 'male',
                is_active: item.is_active,
                photo_url: item.photo_url || '',
                national_id: item.national_id || '',
                birth_date: item.birth_date || '',
                religion: item.religion || 'พุทธ',
                nationality: item.nationality || 'ไทย',
                blood_type: item.blood_type || '',
                current_house_no: item.current_house_no || '',
                current_moo: item.current_moo || '',
                current_road: item.current_road || '',
                current_tambon: item.current_tambon || '',
                current_amphoe: item.current_amphoe || '',
                current_province: item.current_province || '',
                current_postal_code: item.current_postal_code || '',
                current_phone: item.current_phone || '',
                registered_house_no: item.registered_house_no || '',
                registered_moo: item.registered_moo || '',
                registered_road: item.registered_road || '',
                registered_tambon: item.registered_tambon || '',
                registered_amphoe: item.registered_amphoe || '',
                registered_province: item.registered_province || '',
                registered_postal_code: item.registered_postal_code || '',
                registered_phone: item.registered_phone || '',
                father_name: item.father_name || '',
                mother_name: item.mother_name || '',
                guardian_name: item.guardian_name || '',
                guardian_relation: item.guardian_relation || '',
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
        // auto-build display name from title+first+last if not set
        const displayName = formData.name ||
            `${formData.title}${formData.first_name} ${formData.last_name}`.trim();
        const payload = {
            student_code: formData.student_code || null,
            name: displayName,
            title: formData.title || null,
            first_name: formData.first_name || null,
            last_name: formData.last_name || null,
            nickname: formData.nickname || null,
            class: formData.class,
            room: formData.room || null,
            class_number: formData.class_number !== '' ? Number(formData.class_number) : null,
            gender: formData.gender,
            is_active: formData.is_active,
            photo_url: formData.photo_url || null,
            national_id: formData.national_id || null,
            birth_date: formData.birth_date || null,
            religion: formData.religion || null,
            nationality: formData.nationality || null,
            blood_type: formData.blood_type || null,
            current_house_no: formData.current_house_no || null,
            current_moo: formData.current_moo || null,
            current_road: formData.current_road || null,
            current_tambon: formData.current_tambon || null,
            current_amphoe: formData.current_amphoe || null,
            current_province: formData.current_province || null,
            current_postal_code: formData.current_postal_code || null,
            current_phone: formData.current_phone || null,
            registered_house_no: formData.registered_house_no || null,
            registered_moo: formData.registered_moo || null,
            registered_road: formData.registered_road || null,
            registered_tambon: formData.registered_tambon || null,
            registered_amphoe: formData.registered_amphoe || null,
            registered_province: formData.registered_province || null,
            registered_postal_code: formData.registered_postal_code || null,
            registered_phone: formData.registered_phone || null,
            father_name: formData.father_name || null,
            mother_name: formData.mother_name || null,
            guardian_name: formData.guardian_name || null,
            guardian_relation: formData.guardian_relation || null,
            parent_name: formData.guardian_name || formData.parent_name || null,
            parent_phone: formData.parent_phone || null,
            updated_at: new Date().toISOString(),
        };
        const { error } = editingItem
            ? await studentsService.update(editingItem.id, payload)
            : await studentsService.insert(payload);
        if (error) { toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: error.message }); return; }
        toast({ title: 'สำเร็จ', description: editingItem ? 'แก้ไขข้อมูลเรียบร้อย' : 'เพิ่มนักเรียนใหม่เรียบร้อย' });
        setIsDialogOpen(false);
        fetchStudents();
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const { error } = await studentsService.delete(deleteId);
        if (error) toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: error.message });
        else { toast({ title: 'สำเร็จ', description: 'ลบนักเรียนเรียบร้อย' }); fetchStudents(); }
        setDeleteId(null);
    };

    const uniqueClasses = useMemo(() => Array.from(new Set(students.map(s => s.class))).sort(), [students]);
    const uniqueRooms = useMemo(() => Array.from(new Set(students.map(s => s.room).filter(Boolean) as string[])).sort(), [students]);

    const columns: ColumnDef<Student>[] = useMemo(() => [
        {
            id: 'avatar',
            header: 'รูป',
            cell: ({ row }) => <StudentAvatar photo_url={row.original.photo_url} name={row.original.name} size={36} />,
            enableSorting: false,
            size: 56,
        },
        {
            accessorKey: 'student_code',
            header: 'รหัส',
            cell: ({ getValue }) => <span className="font-mono text-xs text-muted-foreground">{(getValue() as string) || '—'}</span>,
        },
        {
            accessorKey: 'name',
            header: 'ชื่อ-นามสกุล',
            cell: ({ row }) => (
                <div>
                    <div
                        className="font-medium cursor-pointer hover:text-primary"
                        onClick={() => setViewStudent(row.original)}
                    >
                        {row.original.name}
                    </div>
                    {row.original.nickname && (
                        <div className="text-xs text-muted-foreground">ชื่อเล่น: {row.original.nickname}</div>
                    )}
                    {row.original.national_id && (
                        <div className="text-xs text-muted-foreground font-mono">{row.original.national_id}</div>
                    )}
                </div>
            ),
        },
        { accessorKey: 'class', header: 'ชั้น' },
        { accessorKey: 'room', header: 'ห้อง', cell: ({ getValue }) => <span>{(getValue() as string) || '—'}</span> },
        { accessorKey: 'class_number', header: 'เลขที่', cell: ({ getValue }) => <span className="text-center block">{(getValue() as number) ?? '—'}</span> },
        {
            accessorKey: 'gender',
            header: 'เพศ',
            cell: ({ getValue }) => (
                <Badge variant={(getValue() as string) === 'male' ? 'default' : 'secondary'}>
                    {(getValue() as string) === 'male' ? 'ชาย' : 'หญิง'}
                </Badge>
            ),
        },
        {
            accessorKey: 'birth_date',
            header: 'วันเกิด / อายุ',
            cell: ({ row }) => (
                <div className="text-xs whitespace-nowrap">
                    <div>{formatBirthDate(row.original.birth_date)}</div>
                    <div className="text-muted-foreground">{calcAge(row.original.birth_date)}</div>
                </div>
            ),
        },
        {
            accessorKey: 'is_active',
            header: 'สถานะ',
            cell: ({ getValue }) => (
                <Badge variant={(getValue() as boolean) ? 'default' : 'outline'}>
                    {(getValue() as boolean) ? 'กำลังศึกษา' : 'ไม่ได้ศึกษา'}
                </Badge>
            ),
        },
        {
            id: 'actions',
            header: 'จัดการ',
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
        () => students.filter(s => {
            if (filterClass !== 'all' && s.class !== filterClass) return false;
            if (filterRoom !== 'all' && s.room !== filterRoom) return false;
            if (filterGender !== 'all' && s.gender !== filterGender) return false;
            if (filterStatus === 'active' && !s.is_active) return false;
            if (filterStatus === 'inactive' && s.is_active) return false;
            return true;
        }),
        [students, filterClass, filterRoom, filterGender, filterStatus]
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
            return s.name.includes(value)
                || (s.student_code || '').includes(value)
                || (s.national_id || '').includes(value)
                || (s.first_name || '').includes(value)
                || (s.last_name || '').includes(value);
        },
    });

    const printClassStudents = students.filter(s => s.class === printClass);

    const set = (key: keyof typeof defaultForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setFormData(f => ({ ...f, [key]: e.target.value }));

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            รายชื่อนักเรียน ({students.length} คน)
                        </CardTitle>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setQrSheetOpen(true)}
                                className="border-amber-300 text-amber-900 hover:bg-amber-50"
                            >
                                <QrCode className="w-4 h-4 mr-1" /> พิมพ์ QR ทั้งห้อง
                            </Button>
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
                    <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="ค้นหาชื่อ, รหัส, หรือเลขบัตรประชาชน..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={filterClass} onValueChange={setFilterClass}>
                            <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="ทุกชั้น" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทุกชั้น</SelectItem>
                                {uniqueClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filterRoom} onValueChange={setFilterRoom}>
                            <SelectTrigger className="w-full sm:w-32"><SelectValue placeholder="ทุกห้อง" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทุกห้อง</SelectItem>
                                {uniqueRooms.map(r => <SelectItem key={r} value={r}>ห้อง {r}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filterGender} onValueChange={setFilterGender}>
                            <SelectTrigger className="w-full sm:w-32"><SelectValue placeholder="ทุกเพศ" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทุกเพศ</SelectItem>
                                <SelectItem value="male">ชาย</SelectItem>
                                <SelectItem value="female">หญิง</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="ทุกสถานะ" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทุกสถานะ</SelectItem>
                                <SelectItem value="active">กำลังศึกษา</SelectItem>
                                <SelectItem value="inactive">ไม่ได้ศึกษา</SelectItem>
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
                                                <th
                                                    key={h.id}
                                                    className="text-left px-3 py-3 font-medium cursor-pointer select-none whitespace-nowrap"
                                                    onClick={h.column.getToggleSortingHandler()}
                                                >
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

            {/* ===== View Dialog (read-only) ===== */}
            <Dialog open={!!viewStudent} onOpenChange={open => { if (!open) setViewStudent(null); }}>
                <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>ข้อมูลนักเรียน</DialogTitle>
                    </DialogHeader>
                    {viewStudent && (
                        <div className="space-y-5">
                            {/* Header: รูป + ชื่อ + รหัส + ชั้น */}
                            <div className="flex items-center gap-4 pb-3 border-b">
                                <StudentAvatar photo_url={viewStudent.photo_url} name={viewStudent.name} size={80} />
                                <div>
                                    <p className="text-xl font-bold">{viewStudent.name}</p>
                                    {viewStudent.student_code && (
                                        <p className="text-sm text-muted-foreground font-mono">รหัส: {viewStudent.student_code}</p>
                                    )}
                                    <div className="flex gap-2 mt-1">
                                        <Badge>{viewStudent.class}</Badge>
                                        {viewStudent.room && <Badge variant="outline">ห้อง {viewStudent.room}</Badge>}
                                        <Badge variant={viewStudent.is_active ? 'default' : 'outline'}>
                                            {viewStudent.is_active ? 'กำลังศึกษา' : 'ไม่ได้ศึกษา'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Section 1: ข้อมูลหลัก */}
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">ข้อมูลหลัก</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    <InfoRow label="ชื่อ-นามสกุล" value={viewStudent.name} />
                                    <InfoRow label="ชื่อเล่น" value={viewStudent.nickname} />
                                    <InfoRow label="ชั้น" value={viewStudent.class} />
                                    <InfoRow label="ห้อง" value={viewStudent.room} />
                                    <InfoRow label="เลขที่" value={viewStudent.class_number?.toString()} />
                                    <InfoRow label="เพศ" value={viewStudent.gender === 'male' ? 'ชาย' : viewStudent.gender === 'female' ? 'หญิง' : viewStudent.gender} />
                                </div>
                            </div>

                            {/* Section 2: ข้อมูลส่วนตัว */}
                            <div className="border-t pt-4">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">ข้อมูลส่วนตัว</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    <InfoRow label="เลขบัตรประชาชน" value={viewStudent.national_id} />
                                    <InfoRow label="วันเกิด (พ.ศ.)" value={formatBirthDate(viewStudent.birth_date)} />
                                    <InfoRow label="อายุ" value={calcAge(viewStudent.birth_date)} />
                                    <InfoRow label="ศาสนา" value={viewStudent.religion} />
                                    <InfoRow label="สัญชาติ" value={viewStudent.nationality} />
                                    <InfoRow label="หมู่โลหิต" value={viewStudent.blood_type} />
                                </div>
                            </div>

                            {/* Section 3: ที่อยู่ */}
                            <div className="border-t pt-4">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">ที่อยู่</p>
                                <p className="text-xs text-muted-foreground mb-2 font-medium">ที่อยู่ปัจจุบัน</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                                    <InfoRow label="บ้านเลขที่" value={viewStudent.current_house_no} />
                                    <InfoRow label="หมู่" value={viewStudent.current_moo} />
                                    <InfoRow label="ถนน" value={viewStudent.current_road} />
                                    <InfoRow label="ตำบล" value={viewStudent.current_tambon} />
                                    <InfoRow label="อำเภอ" value={viewStudent.current_amphoe} />
                                    <InfoRow label="จังหวัด" value={viewStudent.current_province} />
                                    <InfoRow label="รหัสไปรษณีย์" value={viewStudent.current_postal_code} />
                                    <InfoRow label="โทรศัพท์" value={viewStudent.current_phone} />
                                </div>
                                <p className="text-xs text-muted-foreground mb-2 font-medium">ที่อยู่ตามทะเบียนบ้าน</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    <InfoRow label="บ้านเลขที่" value={viewStudent.registered_house_no} />
                                    <InfoRow label="หมู่" value={viewStudent.registered_moo} />
                                    <InfoRow label="ถนน" value={viewStudent.registered_road} />
                                    <InfoRow label="ตำบล" value={viewStudent.registered_tambon} />
                                    <InfoRow label="อำเภอ" value={viewStudent.registered_amphoe} />
                                    <InfoRow label="จังหวัด" value={viewStudent.registered_province} />
                                    <InfoRow label="รหัสไปรษณีย์" value={viewStudent.registered_postal_code} />
                                    <InfoRow label="โทรศัพท์" value={viewStudent.registered_phone} />
                                </div>
                            </div>

                            {/* Section 4: ครอบครัว */}
                            <div className="border-t pt-4">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">ครอบครัว</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    <InfoRow label="บิดา" value={viewStudent.father_name} />
                                    <InfoRow label="มารดา" value={viewStudent.mother_name} />
                                    <InfoRow label="ผู้ปกครอง" value={viewStudent.guardian_name} />
                                    <InfoRow label="ความสัมพันธ์" value={viewStudent.guardian_relation} />
                                    <InfoRow label="เบอร์โทรผู้ปกครอง" value={viewStudent.parent_phone} />
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                const s = viewStudent!;
                                setViewStudent(null);
                                handleOpenDialog(s);
                            }}
                        >
                            <Edit className="w-4 h-4 mr-1" /> แก้ไข
                        </Button>
                        <Button variant="secondary" onClick={() => setViewStudent(null)}>ปิด</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ===== Dialog เพิ่ม/แก้ไขนักเรียน ===== */}
            <Dialog open={isDialogOpen} onOpenChange={open => { if (!open) setIsDialogOpen(false); }}>
                <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'แก้ไขข้อมูลนักเรียน' : 'เพิ่มนักเรียนใหม่'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* รูปภาพ */}
                        <div className="flex gap-4 items-start">
                            <div className="flex-1 space-y-2">
                                <Label>รูปนักเรียน</Label>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <ImageUpload
                                            bucket="school-images"
                                            folder="students"
                                            compressionPreset="avatar"
                                            currentImage={formData.photo_url}
                                            onUploadComplete={url => setFormData(f => ({ ...f, photo_url: url }))}
                                        />
                                    </div>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setWebcamOpen(true)} className="gap-1 mt-1 shrink-0">
                                        <Camera className="w-4 h-4" /> ถ่ายรูป
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Tabs หลัก */}
                        <Tabs defaultValue="basic">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="basic">ข้อมูลหลัก</TabsTrigger>
                                <TabsTrigger value="personal">ส่วนตัว</TabsTrigger>
                                <TabsTrigger value="address">ที่อยู่</TabsTrigger>
                                <TabsTrigger value="family">ครอบครัว</TabsTrigger>
                            </TabsList>

                            {/* ===== Tab 1: ข้อมูลหลัก ===== */}
                            <TabsContent value="basic" className="space-y-3 pt-3">
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-2">
                                        <Label>คำนำหน้า</Label>
                                        <Select value={formData.title} onValueChange={v => setFormData(f => ({ ...f, title: v }))}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {TITLE_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>ชื่อ *</Label>
                                        <Input placeholder="ชื่อ" value={formData.first_name} onChange={set('first_name')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>นามสกุล *</Label>
                                        <Input placeholder="นามสกุล" value={formData.last_name} onChange={set('last_name')} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>ชื่อเล่น</Label>
                                        <Input placeholder="ชื่อเล่น" value={formData.nickname} onChange={set('nickname')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>รหัสนักเรียน</Label>
                                        <Input placeholder="เช่น 1354" value={formData.student_code} onChange={set('student_code')} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-2">
                                        <Label>ระดับชั้น *</Label>
                                        <Select value={formData.class} onValueChange={v => setFormData(f => ({ ...f, class: v }))}>
                                            <SelectTrigger><SelectValue placeholder="เลือกชั้น" /></SelectTrigger>
                                            <SelectContent>{CLASS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>ห้อง</Label>
                                        <Input placeholder="1" value={formData.room} onChange={set('room')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>เลขที่</Label>
                                        <Input type="number" min={1} placeholder="เลขที่" value={formData.class_number} onChange={set('class_number')} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>เพศ</Label>
                                        <Select value={formData.gender} onValueChange={v => setFormData(f => ({ ...f, gender: v as 'male' | 'female' }))}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="male">ชาย</SelectItem>
                                                <SelectItem value="female">หญิง</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center gap-3 pt-6">
                                        <Switch id="is_active" checked={formData.is_active} onCheckedChange={c => setFormData(f => ({ ...f, is_active: c }))} />
                                        <Label htmlFor="is_active">กำลังศึกษาอยู่</Label>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* ===== Tab 2: ข้อมูลส่วนตัว ===== */}
                            <TabsContent value="personal" className="space-y-3 pt-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>เลขบัตรประชาชน</Label>
                                        <Input placeholder="13 หลัก" maxLength={13} value={formData.national_id} onChange={set('national_id')} />
                                    </div>
                                    <div className="space-y-2 font-medium">
                                        <Label>วันเกิด</Label>
                                        <ThaiDatePicker
                                            value={formData.birth_date}
                                            onChange={(v) => setFormData(f => ({ ...f, birth_date: v }))}
                                        />
                                        {formData.birth_date && (
                                            <p className="text-xs text-muted-foreground">
                                                อายุ {calcAge(formData.birth_date)}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-2">
                                        <Label>ศาสนา</Label>
                                        <Input placeholder="พุทธ" value={formData.religion} onChange={set('religion')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>สัญชาติ</Label>
                                        <Input placeholder="ไทย" value={formData.nationality} onChange={set('nationality')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>หมู่โลหิต</Label>
                                        <Select value={formData.blood_type || '__unset__'} onValueChange={v => setFormData(f => ({ ...f, blood_type: v === '__unset__' ? '' : v }))}>
                                            <SelectTrigger><SelectValue placeholder="เลือก" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__unset__">ไม่ระบุ</SelectItem>
                                                {BLOOD_TYPE_OPTIONS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* ===== Tab 3: ที่อยู่ ===== */}
                            <TabsContent value="address" className="space-y-4 pt-3">
                                {/* ที่อยู่ปัจจุบัน */}
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">ที่อยู่ปัจจุบัน</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label>บ้านเลขที่</Label>
                                            <Input placeholder="บ้านเลขที่" value={formData.current_house_no} onChange={set('current_house_no')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>หมู่ที่</Label>
                                            <Input placeholder="หมู่ที่" value={formData.current_moo} onChange={set('current_moo')} />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <Label>ซอย/ถนน</Label>
                                            <Input placeholder="ซอย/ถนน" value={formData.current_road} onChange={set('current_road')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>ตำบล</Label>
                                            <Input placeholder="ตำบล" value={formData.current_tambon} onChange={set('current_tambon')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>อำเภอ</Label>
                                            <Input placeholder="อำเภอ" value={formData.current_amphoe} onChange={set('current_amphoe')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>จังหวัด</Label>
                                            <Input placeholder="จังหวัด" value={formData.current_province} onChange={set('current_province')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>รหัสไปรษณีย์</Label>
                                            <Input placeholder="รหัสไปรษณีย์" maxLength={5} value={formData.current_postal_code} onChange={set('current_postal_code')} />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <Label>โทรศัพท์บ้าน</Label>
                                            <Input placeholder="โทรศัพท์" value={formData.current_phone} onChange={set('current_phone')} />
                                        </div>
                                    </div>
                                </div>

                                {/* ที่อยู่ตามทะเบียนบ้าน */}
                                <div className="border-t pt-4">
                                    <p className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">ที่อยู่ตามทะเบียนบ้าน</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label>บ้านเลขที่</Label>
                                            <Input placeholder="บ้านเลขที่" value={formData.registered_house_no} onChange={set('registered_house_no')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>หมู่ที่</Label>
                                            <Input placeholder="หมู่ที่" value={formData.registered_moo} onChange={set('registered_moo')} />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <Label>ซอย/ถนน</Label>
                                            <Input placeholder="ซอย/ถนน" value={formData.registered_road} onChange={set('registered_road')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>ตำบล</Label>
                                            <Input placeholder="ตำบล" value={formData.registered_tambon} onChange={set('registered_tambon')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>อำเภอ</Label>
                                            <Input placeholder="อำเภอ" value={formData.registered_amphoe} onChange={set('registered_amphoe')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>จังหวัด</Label>
                                            <Input placeholder="จังหวัด" value={formData.registered_province} onChange={set('registered_province')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>รหัสไปรษณีย์</Label>
                                            <Input placeholder="รหัสไปรษณีย์" maxLength={5} value={formData.registered_postal_code} onChange={set('registered_postal_code')} />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <Label>โทรศัพท์บ้าน (ทะเบียนบ้าน)</Label>
                                            <Input placeholder="โทรศัพท์" value={formData.registered_phone} onChange={set('registered_phone')} />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* ===== Tab 4: ครอบครัว ===== */}
                            <TabsContent value="family" className="space-y-3 pt-3">
                                <div className="space-y-2">
                                    <Label>ชื่อ-สกุล บิดา</Label>
                                    <Input placeholder="ชื่อ-สกุล บิดา" value={formData.father_name} onChange={set('father_name')} />
                                </div>
                                <div className="space-y-2">
                                    <Label>ชื่อ-สกุล มารดา</Label>
                                    <Input placeholder="ชื่อ-สกุล มารดา" value={formData.mother_name} onChange={set('mother_name')} />
                                </div>
                                <div className="border-t pt-3">
                                    <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide">ผู้ปกครอง</p>
                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            <Label>ชื่อ-สกุล ผู้ปกครอง</Label>
                                            <Input placeholder="ชื่อ-สกุล ผู้ปกครอง" value={formData.guardian_name} onChange={set('guardian_name')} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label>ความสัมพันธ์</Label>
                                                <Input placeholder="เช่น บิดา, มารดา, ปู่" value={formData.guardian_relation} onChange={set('guardian_relation')} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>เบอร์โทรผู้ปกครอง</Label>
                                                <Input placeholder="08x-xxx-xxxx" value={formData.parent_phone} onChange={set('parent_phone')} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

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

            {/* Bulk QR Sheet */}
            <StudentQRSheet
                students={students.map((s) => ({
                    id: s.id,
                    name: s.name,
                    class: s.class,
                    class_number: s.class_number,
                }))}
                open={qrSheetOpen}
                onClose={() => setQrSheetOpen(false)}
            />

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
