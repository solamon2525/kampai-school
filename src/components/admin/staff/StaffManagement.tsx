import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Users, Briefcase, LayoutGrid, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '../shared/ImageUpload';
import { deleteStorageImage } from '@/utils/storageUtils';

interface Staff {
    id: string;
    name: string;
    position: string;
    department: string;
    subject: string;
    education: string;
    experience: string;
    photo_url: string;
    staff_type: 'teaching' | 'support';
    order_position: number;
}

export const StaffManagement = () => {
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
    const [activeTab, setActiveTab] = useState('teaching');
    const [formData, setFormData] = useState({
        name: '',
        position: '',
        department: '',
        subject: '',
        education: '',
        experience: '',
        photo_url: '',
        staff_type: 'teaching' as 'teaching' | 'support',
    });
    // Column settings
    const [adminCols, setAdminCols] = useState('1');
    const [teachingCols, setTeachingCols] = useState('4');
    const [supportCols, setSupportCols] = useState('4');
    const [savingCols, setSavingCols] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchStaff();
        fetchColumnSettings();
    }, []);

    const fetchColumnSettings = async () => {
        const { data } = await supabase
            .from('school_settings')
            .select('key, value')
            .in('key', ['staff_admin_columns', 'staff_teaching_columns', 'staff_support_columns']);
        if (data) {
            data.forEach((s: any) => {
                if (s.key === 'staff_admin_columns') setAdminCols(s.value || '1');
                if (s.key === 'staff_teaching_columns') setTeachingCols(s.value || '4');
                if (s.key === 'staff_support_columns') setSupportCols(s.value || '4');
            });
        }
    };

    const handleSaveColumnSettings = async () => {
        setSavingCols(true);
        try {
            const updates = [
                { key: 'staff_admin_columns', value: adminCols },
                { key: 'staff_teaching_columns', value: teachingCols },
                { key: 'staff_support_columns', value: supportCols },
            ];
            for (const u of updates) {
                await supabase.from('school_settings').upsert(u as any, { onConflict: 'key' });
            }
            toast({ title: 'บันทึกแล้ว', description: 'ตั้งค่าจำนวนคอลัมน์เรียบร้อย' });
        } catch {
            toast({ variant: 'destructive', title: 'เกิดข้อผิดพลาด', description: 'บันทึกไม่สำเร็จ' });
        } finally {
            setSavingCols(false);
        }
    };

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('staff')
                .select('*')
                .order('order_position', { ascending: true });

            if (error) throw error;
            setStaffList(data || []);
        } catch (error: any) {
            console.error('Error fetching staff:', error);
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาด',
                description: 'ไม่สามารถโหลดข้อมูลบุคลากรได้',
            });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            position: '',
            department: '',
            subject: '',
            education: '',
            experience: '',
            photo_url: '',
            staff_type: activeTab === 'support' ? 'support' : 'teaching',
        });
        setEditingStaff(null);
    };

    const handleOpenDialog = (staff?: Staff) => {
        if (staff) {
            setEditingStaff(staff);
            setFormData({
                name: staff.name,
                position: staff.position,
                department: staff.department || '',
                subject: staff.subject || '',
                education: staff.education || '',
                experience: staff.experience || '',
                photo_url: staff.photo_url || '',
                staff_type: staff.staff_type,
            });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingStaff) {
                const { error } = await supabase
                    .from('staff')
                    .update({
                        name: formData.name,
                        position: formData.position,
                        department: formData.department,
                        subject: formData.subject,
                        education: formData.education,
                        experience: formData.experience,
                        photo_url: formData.photo_url,
                        staff_type: formData.staff_type,
                    })
                    .eq('id', editingStaff.id);

                if (error) throw error;

                toast({
                    title: 'สำเร็จ',
                    description: 'แก้ไขข้อมูลบุคลากรเรียบร้อยแล้ว',
                });
            } else {
                const maxOrder = staffList.length > 0
                    ? Math.max(...staffList.map(s => s.order_position))
                    : 0;

                const { error } = await supabase
                    .from('staff')
                    .insert({
                        name: formData.name,
                        position: formData.position,
                        department: formData.department,
                        subject: formData.subject,
                        education: formData.education,
                        experience: formData.experience,
                        photo_url: formData.photo_url,
                        staff_type: formData.staff_type,
                        order_position: maxOrder + 1,
                    });

                if (error) throw error;

                toast({
                    title: 'สำเร็จ',
                    description: 'เพิ่มบุคลากรใหม่เรียบร้อยแล้ว',
                });
            }

            setIsDialogOpen(false);
            resetForm();
            fetchStaff();
        } catch (error: any) {
            console.error('Error saving staff:', error);
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาด',
                description: 'ไม่สามารถบันทึกข้อมูลได้',
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบบุคลากรนี้หรือไม่?')) return;

        try {
            // Find the staff to get the photo_url
            const staffToDelete = staffList.find(s => s.id === id);

            // Delete image from storage if exists
            if (staffToDelete?.photo_url) {
                await deleteStorageImage(staffToDelete.photo_url);
            }

            const { error } = await supabase
                .from('staff')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast({
                title: 'สำเร็จ',
                description: 'ลบบุคลากรเรียบร้อยแล้ว',
            });

            fetchStaff();
        } catch (error: any) {
            console.error('Error deleting staff:', error);
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาด',
                description: 'ไม่สามารถลบข้อมูลได้',
            });
        }
    };

    const teachingStaff = staffList.filter(s => s.staff_type === 'teaching');
    const supportStaff = staffList.filter(s => s.staff_type === 'support');

    if (loading) {
        return (
            <div className="p-8">
                <div className="text-center py-12">
                    <p className="text-muted-foreground">กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    const StaffCard = ({ staff }: { staff: Staff }) => (
        <Card className="overflow-hidden">
            <div className="h-24 bg-gradient-to-br from-primary to-navy-light flex items-center justify-center">
                {staff.photo_url ? (
                    <img
                        src={staff.photo_url}
                        alt={staff.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-white/50"
                    />
                ) : (
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/50">
                        <span className="text-xl font-bold text-white">
                            {staff.name.charAt(0)}
                        </span>
                    </div>
                )}
            </div>
            <CardContent className="p-4">
                <h3 className="font-bold text-foreground text-sm">{staff.name}</h3>
                <p className="text-xs text-accent font-medium">{staff.position}</p>
                {staff.subject && <p className="text-xs text-muted-foreground mt-1">วิชา: {staff.subject}</p>}
                {staff.department && <p className="text-xs text-muted-foreground">{staff.department}</p>}
                <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => handleOpenDialog(staff)} className="text-xs">
                        <Edit className="w-3 h-3 mr-1" />
                        แก้ไข
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(staff.id)} className="text-xs">
                        <Trash2 className="w-3 h-3 mr-1" />
                        ลบ
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">จัดการบุคลากร</h1>
                    <p className="text-muted-foreground mt-1">เพิ่ม แก้ไข หรือลบข้อมูลครูและบุคลากร</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()} className="gap-2">
                            <Plus className="w-4 h-4" />
                            เพิ่มบุคลากร
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingStaff ? 'แก้ไขบุคลากร' : 'เพิ่มบุคลากรใหม่'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="staff_type">ประเภทบุคลากร *</Label>
                                <Select
                                    value={formData.staff_type}
                                    onValueChange={(value: 'teaching' | 'support') =>
                                        setFormData({ ...formData, staff_type: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="เลือกประเภท" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="teaching">ครูผู้สอน</SelectItem>
                                        <SelectItem value="support">บุคลากรสนับสนุน</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">ชื่อ-นามสกุล *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="นายสมชาย ใจดี"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="position">ตำแหน่ง *</Label>
                                <Input
                                    id="position"
                                    value={formData.position}
                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                    placeholder="หัวหน้ากลุ่มสาระการเรียนรู้..."
                                    required
                                />
                            </div>
                            {formData.staff_type === 'teaching' && (
                                <div className="space-y-2">
                                    <Label htmlFor="subject">วิชาที่สอน</Label>
                                    <Input
                                        id="subject"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        placeholder="ภาษาไทย"
                                    />
                                </div>
                            )}
                            {formData.staff_type === 'support' && (
                                <div className="space-y-2">
                                    <Label htmlFor="department">แผนก/ฝ่าย</Label>
                                    <Input
                                        id="department"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        placeholder="ฝ่ายบริหารทั่วไป"
                                    />
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="education">การศึกษา</Label>
                                <Input
                                    id="education"
                                    value={formData.education}
                                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                                    placeholder="ปริญญาโท ภาษาไทย"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="experience">ประสบการณ์</Label>
                                <Input
                                    id="experience"
                                    value={formData.experience}
                                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                    placeholder="15 ปี"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>รูปภาพ</Label>
                                <ImageUpload
                                    currentImage={formData.photo_url}
                                    onUploadComplete={(url) => setFormData({ ...formData, photo_url: url })}
                                    folder="staff"
                                    maxSizeMB={5}
                                    compressionPreset="profile"
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    ยกเลิก
                                </Button>
                                <Button type="submit">
                                    {editingStaff ? 'บันทึก' : 'เพิ่ม'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Column Settings Card */}
            <Card className="mb-6">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4" />
                        ตั้งค่าการแสดงผลหน้าเว็บ (จำนวนคอลัมน์)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">ผู้บริหาร</Label>
                            <Select value={adminCols} onValueChange={setAdminCols}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {['1','2','3','4','5'].map(n => (
                                        <SelectItem key={n} value={n}>{n} คอลัมน์</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">ครูผู้สอน</Label>
                            <Select value={teachingCols} onValueChange={setTeachingCols}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {['1','2','3','4','5'].map(n => (
                                        <SelectItem key={n} value={n}>{n} คอลัมน์</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">บุคลากรสนับสนุน</Label>
                            <Select value={supportCols} onValueChange={setSupportCols}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {['1','2','3','4','5'].map(n => (
                                        <SelectItem key={n} value={n}>{n} คอลัมน์</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <Button size="sm" onClick={handleSaveColumnSettings} disabled={savingCols} className="gap-2">
                        <Save className="w-4 h-4" />
                        {savingCols ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                    </Button>
                </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                    <TabsTrigger value="teaching" className="gap-2">
                        <Users className="w-4 h-4" />
                        ครูผู้สอน ({teachingStaff.length})
                    </TabsTrigger>
                    <TabsTrigger value="support" className="gap-2">
                        <Briefcase className="w-4 h-4" />
                        บุคลากรสนับสนุน ({supportStaff.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="teaching">
                    {teachingStaff.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-xl font-semibold mb-2">ยังไม่มีข้อมูลครูผู้สอน</h3>
                                <p className="text-muted-foreground mb-4">เริ่มต้นเพิ่มครูผู้สอนได้เลย</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {teachingStaff.map((staff) => (
                                <StaffCard key={staff.id} staff={staff} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="support">
                    {supportStaff.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-xl font-semibold mb-2">ยังไม่มีข้อมูลบุคลากรสนับสนุน</h3>
                                <p className="text-muted-foreground mb-4">เริ่มต้นเพิ่มบุคลากรสนับสนุนได้เลย</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {supportStaff.map((staff) => (
                                <StaffCard key={staff.id} staff={staff} />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};
