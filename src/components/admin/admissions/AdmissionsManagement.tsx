import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Eye, Check, X, Clock, Search, RefreshCw, Download, Mail, Phone, Calendar, User, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface Admission {
    id: string;
    student_name: string;
    student_id_card: string;
    birth_date: string;
    gender: string;
    parent_name: string;
    parent_phone: string;
    parent_email: string;
    address: string;
    previous_school: string;
    grade_applying: string;
    program_applying: string;
    status: 'pending' | 'reviewing' | 'approved' | 'rejected';
    notes: string;
    created_at: string;
}

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    reviewing: 'bg-blue-100 text-blue-800 border-blue-300',
    approved: 'bg-green-100 text-green-800 border-green-300',
    rejected: 'bg-red-100 text-red-800 border-red-300',
};

const statusLabels: Record<string, string> = {
    pending: 'รอดำเนินการ',
    reviewing: 'กำลังตรวจสอบ',
    approved: 'อนุมัติแล้ว',
    rejected: 'ไม่อนุมัติ',
};

export const AdmissionsManagement = () => {
    const [admissions, setAdmissions] = useState<Admission[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchAdmissions();
    }, []);

    const fetchAdmissions = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('admissions')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAdmissions(data || []);
        } catch (error: any) {
            console.error('Error fetching admissions:', error);
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาด',
                description: 'ไม่สามารถโหลดข้อมูลใบสมัครได้',
            });
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('admissions')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            toast({
                title: 'สำเร็จ',
                description: `อัพเดทสถานะเป็น "${statusLabels[newStatus]}" เรียบร้อยแล้ว`,
            });

            fetchAdmissions();
            setIsDetailDialogOpen(false);
        } catch (error: any) {
            console.error('Error updating status:', error);
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาด',
                description: 'ไม่สามารถอัพเดทสถานะได้',
            });
        }
    };

    const getFilteredAdmissions = () => {
        let filtered = admissions;

        if (activeTab !== 'all') {
            filtered = filtered.filter(a => a.status === activeTab);
        }

        if (searchTerm) {
            const lowercaseSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(a =>
                a.student_name.toLowerCase().includes(lowercaseSearch) ||
                a.parent_name.toLowerCase().includes(lowercaseSearch) ||
                a.parent_phone.includes(searchTerm)
            );
        }

        return filtered;
    };

    const filteredAdmissions = getFilteredAdmissions();
    const counts = {
        all: admissions.length,
        pending: admissions.filter(a => a.status === 'pending').length,
        reviewing: admissions.filter(a => a.status === 'reviewing').length,
        approved: admissions.filter(a => a.status === 'approved').length,
        rejected: admissions.filter(a => a.status === 'rejected').length,
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="text-center py-12">
                    <p className="text-muted-foreground">กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">จัดการใบสมัคร</h1>
                    <p className="text-muted-foreground mt-1">ตรวจสอบและดำเนินการใบสมัครเข้าเรียน</p>
                </div>
                <Button onClick={fetchAdmissions} variant="outline" className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    รีเฟรช
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <Card className={`cursor-pointer hover:shadow-md transition ${activeTab === 'all' ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setActiveTab('all')}>
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-foreground">{counts.all}</p>
                        <p className="text-sm text-muted-foreground">ทั้งหมด</p>
                    </CardContent>
                </Card>
                <Card className={`cursor-pointer hover:shadow-md transition ${activeTab === 'pending' ? 'ring-2 ring-yellow-500' : ''}`}
                    onClick={() => setActiveTab('pending')}>
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-yellow-600">{counts.pending}</p>
                        <p className="text-sm text-muted-foreground">รอดำเนินการ</p>
                    </CardContent>
                </Card>
                <Card className={`cursor-pointer hover:shadow-md transition ${activeTab === 'reviewing' ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => setActiveTab('reviewing')}>
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-blue-600">{counts.reviewing}</p>
                        <p className="text-sm text-muted-foreground">กำลังตรวจสอบ</p>
                    </CardContent>
                </Card>
                <Card className={`cursor-pointer hover:shadow-md transition ${activeTab === 'approved' ? 'ring-2 ring-green-500' : ''}`}
                    onClick={() => setActiveTab('approved')}>
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-green-600">{counts.approved}</p>
                        <p className="text-sm text-muted-foreground">อนุมัติแล้ว</p>
                    </CardContent>
                </Card>
                <Card className={`cursor-pointer hover:shadow-md transition ${activeTab === 'rejected' ? 'ring-2 ring-red-500' : ''}`}
                    onClick={() => setActiveTab('rejected')}>
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-red-600">{counts.rejected}</p>
                        <p className="text-sm text-muted-foreground">ไม่อนุมัติ</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                    placeholder="ค้นหาชื่อนักเรียน, ผู้ปกครอง หรือเบอร์โทร..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Admissions List */}
            {filteredAdmissions.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-xl font-semibold mb-2">ยังไม่มีใบสมัคร</h3>
                        <p className="text-muted-foreground">ใบสมัครจากหน้าเว็บไซต์จะปรากฏที่นี่</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredAdmissions.map((admission) => (
                        <Card key={admission.id} className="hover:shadow-md transition">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-foreground">{admission.student_name}</h3>
                                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                <span>{admission.grade_applying}</span>
                                                <span>•</span>
                                                <span>{admission.program_applying}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge className={`${statusColors[admission.status]} border`}>
                                            {statusLabels[admission.status]}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                            {format(new Date(admission.created_at), 'd MMM yyyy', { locale: th })}
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setSelectedAdmission(admission);
                                                setIsDetailDialogOpen(true);
                                            }}
                                        >
                                            <Eye className="w-4 h-4 mr-1" />
                                            ดูรายละเอียด
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Detail Dialog */}
            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>รายละเอียดใบสมัคร</DialogTitle>
                    </DialogHeader>
                    {selectedAdmission && (
                        <div className="space-y-6">
                            {/* Status Badge */}
                            <div className="flex items-center justify-between">
                                <Badge className={`${statusColors[selectedAdmission.status]} border text-sm px-3 py-1`}>
                                    {statusLabels[selectedAdmission.status]}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                    สมัครเมื่อ {format(new Date(selectedAdmission.created_at), 'd MMMM yyyy HH:mm น.', { locale: th })}
                                </span>
                            </div>

                            {/* Student Info */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">ข้อมูลนักเรียน</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">ชื่อ-นามสกุล</p>
                                        <p className="font-medium">{selectedAdmission.student_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">เลขบัตรประชาชน</p>
                                        <p className="font-medium">{selectedAdmission.student_id_card || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">วันเกิด</p>
                                        <p className="font-medium">
                                            {selectedAdmission.birth_date
                                                ? format(new Date(selectedAdmission.birth_date), 'd MMMM yyyy', { locale: th })
                                                : '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">เพศ</p>
                                        <p className="font-medium">{selectedAdmission.gender || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">โรงเรียนเดิม</p>
                                        <p className="font-medium">{selectedAdmission.previous_school || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">ที่อยู่</p>
                                        <p className="font-medium">{selectedAdmission.address || '-'}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Program Info */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">สมัครเข้าเรียน</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">ระดับชั้น</p>
                                        <p className="font-medium">{selectedAdmission.grade_applying}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">แผนการเรียน</p>
                                        <p className="font-medium">{selectedAdmission.program_applying}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Parent Info */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">ข้อมูลผู้ปกครอง</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">ชื่อผู้ปกครอง</p>
                                        <p className="font-medium">{selectedAdmission.parent_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">เบอร์โทรศัพท์</p>
                                        <p className="font-medium flex items-center gap-2">
                                            <Phone className="w-4 h-4" />
                                            <a href={`tel:${selectedAdmission.parent_phone}`} className="text-primary hover:underline">
                                                {selectedAdmission.parent_phone}
                                            </a>
                                        </p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-sm text-muted-foreground">อีเมล</p>
                                        <p className="font-medium flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            <a href={`mailto:${selectedAdmission.parent_email}`} className="text-primary hover:underline">
                                                {selectedAdmission.parent_email || '-'}
                                            </a>
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Action Buttons */}
                            <div className="flex gap-3 justify-between pt-4 border-t">
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => {
                                        const printWindow = window.open('', '_blank');
                                        if (printWindow) {
                                            printWindow.document.write(`
                                                <html>
                                                <head>
                                                    <title>ใบสมัครเข้าเรียน</title>
                                                    <style>
                                                        @page { size: A4 portrait; margin: 8mm; }
                                                        body { font-family: 'Sarabun', sans-serif; font-size: 11px; padding: 16px; }
                                                        h1 { font-size: 18px; margin: 0; }
                                                        h2 { font-size: 14px; margin: 4px 0 16px 0; }
                                                        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
                                                        .top-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
                                                        .photo-box { width: 80px; height: 96px; border: 2px solid #000; display: flex; align-items: center; justify-content: center; font-size: 8px; text-align: center; }
                                                        .section-title { background: #000; color: #fff; padding: 2px 8px; font-weight: bold; font-size: 10px; margin-bottom: 4px; }
                                                        table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 10px; }
                                                        td { border: 1px solid #999; padding: 4px; }
                                                        .declaration { border: 1px solid #000; padding: 8px; margin: 12px 0; font-size: 10px; }
                                                        .signatures { display: flex; justify-content: space-around; margin-top: 16px; }
                                                        .sig-box { text-align: center; font-size: 10px; }
                                                        .sig-line { border-bottom: 1px solid #000; width: 144px; height: 32px; margin-bottom: 4px; }
                                                        .officer { margin-top: 16px; padding-top: 8px; border-top: 1px solid #999; text-align: center; font-size: 9px; }
                                                    </style>
                                                </head>
                                                <body>
                                                    <div class="header">
                                                        <h1>ใบสมัครเข้าเรียน</h1>
                                                        <h2>ปีการศึกษา 2568</h2>
                                                    </div>
                                                    <div class="top-row">
                                                        <div>
                                                            <p><strong>วันที่สมัคร:</strong> ${format(new Date(selectedAdmission.created_at), 'd MMMM yyyy', { locale: th })}</p>
                                                            <p><strong>สมัครเข้าชั้น:</strong> ${selectedAdmission.grade_applying} <strong>แผน:</strong> ${selectedAdmission.program_applying}</p>
                                                        </div>
                                                        <div class="photo-box">ติดรูปถ่าย<br/>1 นิ้ว</div>
                                                    </div>
                                                    <div class="section-title">ส่วนที่ 1: ข้อมูลนักเรียน</div>
                                                    <table>
                                                        <tr><td width="25%"><strong>ชื่อ-สกุล:</strong></td><td colspan="3">${selectedAdmission.student_name}</td></tr>
                                                        <tr><td><strong>เลขบัตร:</strong></td><td>${selectedAdmission.student_id_card || '-'}</td><td width="15%"><strong>วันเกิด:</strong></td><td>${selectedAdmission.birth_date || '-'}</td></tr>
                                                        <tr><td><strong>ที่อยู่:</strong></td><td colspan="3">${selectedAdmission.address || '-'}</td></tr>
                                                    </table>
                                                    <div class="section-title">ส่วนที่ 2: ข้อมูลผู้ปกครอง</div>
                                                    <table>
                                                        <tr><td width="25%"><strong>ชื่อผู้ปกครอง:</strong></td><td>${selectedAdmission.parent_name}</td><td width="15%"><strong>โทร:</strong></td><td>${selectedAdmission.parent_phone}</td></tr>
                                                        <tr><td><strong>อีเมล:</strong></td><td colspan="3">${selectedAdmission.parent_email || '-'}</td></tr>
                                                    </table>
                                                    <div class="section-title">ส่วนที่ 3: ข้อมูลการศึกษา</div>
                                                    <table>
                                                        <tr><td width="25%"><strong>โรงเรียนเดิม:</strong></td><td colspan="3">${selectedAdmission.previous_school || '-'}</td></tr>
                                                    </table>
                                                    <div class="declaration">
                                                        <strong>คำรับรอง:</strong> ข้าพเจ้าขอรับรองว่าข้อความข้างต้นเป็นความจริงทุกประการ หากปรากฏว่าเป็นเท็จ ข้าพเจ้ายินยอมให้โรงเรียนเพิกถอนการรับสมัครได้ทันที
                                                    </div>
                                                    <div class="signatures">
                                                        <div class="sig-box"><div class="sig-line"></div><p>ลงชื่อ ..........................</p><p>(....................................)</p><p>ผู้สมัคร</p></div>
                                                        <div class="sig-box"><div class="sig-line"></div><p>ลงชื่อ ..........................</p><p>(....................................)</p><p>ผู้ปกครอง</p></div>
                                                    </div>
                                                    <div class="officer">
                                                        <p><strong>สำหรับเจ้าหน้าที่</strong></p>
                                                        <p>☐ รับเอกสารครบ &nbsp;&nbsp; ☐ ตรวจสอบแล้ว &nbsp;&nbsp; ผู้รับสมัคร ................. &nbsp;&nbsp; วันที่ ...../...../.....</p>
                                                    </div>
                                                </body>
                                                </html>
                                            `);
                                            printWindow.document.close();
                                            printWindow.print();
                                        }
                                    }}
                                >
                                    <Printer className="w-4 h-4" />
                                    พิมพ์ใบสมัคร
                                </Button>
                                <div className="flex gap-3">
                                    {selectedAdmission.status === 'pending' && (
                                        <Button onClick={() => updateStatus(selectedAdmission.id, 'reviewing')} variant="outline" className="gap-2">
                                            <Clock className="w-4 h-4" />
                                            เริ่มตรวจสอบ
                                        </Button>
                                    )}
                                    {(selectedAdmission.status === 'pending' || selectedAdmission.status === 'reviewing') && (
                                        <>
                                            <Button onClick={() => updateStatus(selectedAdmission.id, 'rejected')} variant="destructive" className="gap-2">
                                                <X className="w-4 h-4" />
                                                ไม่อนุมัติ
                                            </Button>
                                            <Button onClick={() => updateStatus(selectedAdmission.id, 'approved')} className="gap-2 bg-green-600 hover:bg-green-700">
                                                <Check className="w-4 h-4" />
                                                อนุมัติ
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};
