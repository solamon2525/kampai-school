import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '../shared/ConfirmDialog';

interface Student {
    id: string;
    student_code: string | null;
    name: string;
    class: string;
    class_number: number | null;
    gender: string | null;
    is_active: boolean;
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
};

export const StudentListManagement = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Student | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterClass, setFilterClass] = useState('all');
    const [formData, setFormData] = useState(defaultForm);
    const { toast } = useToast();

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .order('class')
                .order('class_number');
            if (error) throw error;
            setStudents(data || []);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

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
            });
        } else {
            setEditingItem(null);
            setFormData(defaultForm);
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                student_code: formData.student_code || null,
                name: formData.name,
                class: formData.class,
                class_number: formData.class_number !== '' ? Number(formData.class_number) : null,
                gender: formData.gender,
                is_active: formData.is_active,
                updated_at: new Date().toISOString(),
            };

            if (editingItem) {
                const { error } = await supabase
                    .from('students')
                    .update(payload)
                    .eq('id', editingItem.id);
                if (error) throw error;
                toast({ title: 'สำเร็จ', description: 'แก้ไขข้อมูลนักเรียนเรียบร้อยแล้ว' });
            } else {
                const { error } = await supabase.from('students').insert(payload);
                if (error) throw error;
                toast({ title: 'สำเร็จ', description: 'เพิ่มนักเรียนใหม่เรียบร้อยแล้ว' });
            }

            setIsDialogOpen(false);
            fetchStudents();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: error.message });
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const { error } = await supabase.from('students').delete().eq('id', deleteId);
            if (error) throw error;
            toast({ title: 'สำเร็จ', description: 'ลบนักเรียนเรียบร้อยแล้ว' });
            fetchStudents();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: error.message });
        } finally {
            setDeleteId(null);
        }
    };

    const uniqueClasses = Array.from(new Set(students.map(s => s.class))).sort();

    const filtered = students.filter(s => {
        const matchSearch = s.name.includes(searchTerm) ||
            (s.student_code || '').includes(searchTerm);
        const matchClass = filterClass === 'all' || s.class === filterClass;
        return matchSearch && matchClass;
    });

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            รายชื่อนักเรียน ({students.length} คน)
                        </CardTitle>
                        <Button onClick={() => handleOpenDialog()} className="gap-2">
                            <Plus className="w-4 h-4" />
                            เพิ่มนักเรียน
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Search & Filter */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="ค้นหาชื่อหรือรหัสนักเรียน..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={filterClass} onValueChange={setFilterClass}>
                            <SelectTrigger className="w-full sm:w-40">
                                <SelectValue placeholder="ทุกชั้น" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทุกชั้น</SelectItem>
                                {uniqueClasses.map(c => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Table */}
                    {isLoading ? (
                        <p className="text-center text-muted-foreground py-8">กำลังโหลด...</p>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                            <p className="text-muted-foreground">
                                {students.length === 0 ? 'ยังไม่มีรายชื่อนักเรียน กด "เพิ่มนักเรียน" ด้านบนได้เลย' : 'ไม่พบนักเรียนที่ค้นหา'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-md border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-medium">รหัส</th>
                                        <th className="text-left px-4 py-3 font-medium">ชื่อ-นามสกุล</th>
                                        <th className="text-left px-4 py-3 font-medium">ห้อง</th>
                                        <th className="text-center px-4 py-3 font-medium">เลขที่</th>
                                        <th className="text-center px-4 py-3 font-medium">เพศ</th>
                                        <th className="text-center px-4 py-3 font-medium">สถานะ</th>
                                        <th className="text-center px-4 py-3 font-medium">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((student, i) => (
                                        <tr key={student.id} className={i % 2 === 0 ? '' : 'bg-muted/20'}>
                                            <td className="px-4 py-2 text-muted-foreground font-mono text-xs">
                                                {student.student_code || '—'}
                                            </td>
                                            <td className="px-4 py-2 font-medium">{student.name}</td>
                                            <td className="px-4 py-2">{student.class}</td>
                                            <td className="px-4 py-2 text-center">
                                                {student.class_number ?? '—'}
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <Badge variant={student.gender === 'male' ? 'default' : 'secondary'}>
                                                    {student.gender === 'male' ? 'ชาย' : 'หญิง'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <Badge variant={student.is_active ? 'default' : 'outline'}>
                                                    {student.is_active ? 'กำลังศึกษา' : 'ไม่ได้ศึกษา'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <div className="flex gap-1 justify-center">
                                                    <Button size="sm" variant="outline"
                                                        onClick={() => handleOpenDialog(student)}>
                                                        <Edit className="w-3 h-3" />
                                                    </Button>
                                                    <Button size="sm" variant="destructive"
                                                        onClick={() => setDeleteId(student.id)}>
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {filtered.length > 0 && (
                        <p className="text-xs text-muted-foreground text-right">
                            แสดง {filtered.length} จาก {students.length} คน
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Dialog เพิ่ม/แก้ไข */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) setIsDialogOpen(false); }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'แก้ไขข้อมูลนักเรียน' : 'เพิ่มนักเรียนใหม่'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>รหัสนักเรียน</Label>
                            <Input
                                placeholder="เช่น 12345 (ไม่บังคับ)"
                                value={formData.student_code}
                                onChange={(e) => setFormData({ ...formData, student_code: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>ชื่อ-นามสกุล *</Label>
                            <Input
                                placeholder="เช่น เด็กชายสมศักดิ์ ใจดี"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>ห้องเรียน *</Label>
                                <Select
                                    value={formData.class}
                                    onValueChange={(v) => setFormData({ ...formData, class: v })}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="เลือกชั้น" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CLASS_OPTIONS.map(c => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>เลขที่</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    placeholder="เลขที่"
                                    value={formData.class_number}
                                    onChange={(e) => setFormData({ ...formData, class_number: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>เพศ</Label>
                            <Select
                                value={formData.gender}
                                onValueChange={(v) => setFormData({ ...formData, gender: v as 'male' | 'female' })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">ชาย</SelectItem>
                                    <SelectItem value="female">หญิง</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-3">
                            <Switch
                                id="is_active"
                                checked={formData.is_active}
                                onCheckedChange={(c) => setFormData({ ...formData, is_active: c })}
                            />
                            <Label htmlFor="is_active">กำลังศึกษาอยู่</Label>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                ยกเลิก
                            </Button>
                            <Button type="submit">{editingItem ? 'บันทึก' : 'เพิ่มนักเรียน'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Confirm Delete */}
            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="ยืนยันการลบนักเรียน"
                description="คุณแน่ใจหรือไม่ว่าต้องการลบนักเรียนคนนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
            />
        </div>
    );
};
