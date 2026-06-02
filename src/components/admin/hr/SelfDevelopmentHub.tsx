import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatThaiDateFull } from '@/lib/thaiDate';
import { ThaiDatePicker } from '@/components/shared/ThaiDatePicker';
import { useAuth } from '@/contexts/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
    Plus, Pencil, Trash2, Search, FileText, Award, Calendar, BookOpen, Clock, 
    Users, MapPin, X, Loader2, Sparkles, Filter, Eye, ChevronRight
} from 'lucide-react';
import { ImageUpload } from '@/components/admin/shared/ImageUpload';
import { ActivityPhotoUploader } from '@/components/admin/shared/ActivityPhotoUploader';
import { runCertOCR } from '@/components/admin/hr/CertOCR';
import CertificateViewer from '@/components/admin/hr/CertificateViewer';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { trainingService, meetingsService, staffService } from '@/services';

interface Staff {
    id: string;
    name: string;
    photo_url: string | null;
    position: string | null;
}

interface UnifiedRecord {
    id: string;
    type: 'training' | 'meeting';
    title: string;
    date: string;
    endDate?: string | null;
    time?: string | null;
    hours?: number;
    location?: string | null;
    provider?: string | null;
    budget?: number;
    certificateUrl?: string | null;
    photos?: string[];
    notes?: string | null;
    staffId: string | null;
    staffName?: string;
    staffPhoto?: string | null;
    created_at: string;
    decisions?: string | null;
    attendees?: string[] | null;
    agendas?: string[] | null;
    minutes_url?: string | null;
}

const TRAINING_TYPES = ['อบรม', 'สัมมนา', 'ศึกษาดูงาน', 'ประชุมวิชาการ', 'รางวัล/เกียรติยศ'];

export function SelfDevelopmentHub() {
    const { staffId: currentStaffId, isAdmin } = useAuth();
    
    // Core states
    const [records, setRecords] = useState<UnifiedRecord[]>([]);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [viewTab, setViewTab] = useState<'my' | 'all'>('my');
    const [filterType, setFilterType] = useState<'all' | 'training' | 'meeting'>('all');
    
    // Form and Dialog States
    const [dialogOpen, setDialogOpen] = useState(false);
    const [recordType, setRecordType] = useState<'training' | 'meeting'>('training');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // OCR / Preview states
    const [ocrLoading, setOcrLoading] = useState(false);
    const [ocrProgress, setOcrProgress] = useState(0);
    const ocrFileRef = useRef<HTMLInputElement>(null);
    const [previewCert, setPreviewCert] = useState<any | null>(null);

    // Form inputs state
    const [form, setForm] = useState({
        staff_id: '',
        title: '',
        provider: '',
        training_type: 'อบรม',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        meeting_time: '',
        hours: 0,
        location: '',
        budget: 0,
        certificate_url: '',
        decisions: '',
        notes: '',
        minutes_url: ''
    });
    const [attendees, setAttendees] = useState<string[]>(['']);
    const [agendas, setAgendas] = useState<string[]>(['']);
    const [activityPhotos, setActivityPhotos] = useState<string[]>([]);

    useEffect(() => {
        fetchRecords();
        fetchStaff();
    }, [currentStaffId]);

    // Initial viewTab logic: If user is admin but has no staffId, default to 'all'
    useEffect(() => {
        if (isAdmin && !currentStaffId) {
            setViewTab('all');
        } else {
            setViewTab('my');
        }
    }, [currentStaffId, isAdmin]);

    async function fetchStaff() {
        const { data } = await staffService.getAll();
        setStaffList(data || []);
    }

    async function fetchRecords() {
        setLoading(true);
        try {
            // 1. Fetch training records with staff details
            const { data: trainings, error: errT } = await trainingService.getAll();

            if (errT) throw errT;

            // 2. Fetch meeting records with staff details
            const { data: meetings, error: errM } = await meetingsService.getAll();

            if (errM) throw errM;

            // 3. Unify records
            const unifiedTrainings: UnifiedRecord[] = (trainings || []).map((t: any) => ({
                id: t.id,
                type: 'training',
                title: t.course_name,
                date: t.start_date,
                endDate: t.end_date,
                hours: Number(t.hours || 0),
                location: t.location,
                provider: t.provider,
                budget: Number(t.budget || 0),
                certificateUrl: t.certificate_url,
                photos: Array.isArray(t.activity_photos) ? t.activity_photos : [],
                notes: t.notes,
                staffId: t.staff_id,
                staffName: t.staff?.name,
                staffPhoto: t.staff?.photo_url,
                created_at: t.created_at,
            }));

            const unifiedMeetings: UnifiedRecord[] = (meetings || []).map((m: any) => ({
                id: m.id,
                type: 'meeting',
                title: m.title,
                date: m.meeting_date,
                time: m.meeting_time,
                location: m.location,
                photos: Array.isArray(m.photos) ? m.photos : [],
                decisions: m.decisions,
                attendees: m.attendees,
                agendas: m.agendas,
                minutes_url: m.minutes_url,
                staffId: m.staff_id,
                staffName: m.staff?.name,
                staffPhoto: m.staff?.photo_url,
                created_at: m.created_at,
            }));

            // Merge and sort chronologically (newest first)
            const unified = [...unifiedTrainings, ...unifiedMeetings].sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            setRecords(unified);
        } catch (err: any) {
            console.error('Error fetching unified records:', err);
            toast.error('โหลดข้อมูลผลงานไม่สำเร็จ');
        } finally {
            setLoading(false);
        }
    }

    // Filtered records
    const filteredRecords = useMemo(() => {
        return records.filter(r => {
            // Tab Filter (My Portfolio vs All Portfolios)
            const matchTab = viewTab === 'all' || r.staffId === currentStaffId;

            // Type Filter (Training vs Meeting)
            const matchType = filterType === 'all' || r.type === filterType;

            // Search Filter
            const matchSearch =
                !search ||
                r.title.toLowerCase().includes(search.toLowerCase()) ||
                (r.provider || '').toLowerCase().includes(search.toLowerCase()) ||
                (r.location || '').toLowerCase().includes(search.toLowerCase()) ||
                (r.staffName || '').toLowerCase().includes(search.toLowerCase());

            return matchTab && matchType && matchSearch;
        });
    }, [records, viewTab, filterType, search, currentStaffId]);

    // Stats calculations
    const stats = useMemo(() => {
        // Calculate only for "My Portfolio" or active tab context
        const contextRecords = records.filter(r => r.staffId === currentStaffId);
        
        const trainingHours = contextRecords
            .filter(r => r.type === 'training')
            .reduce((sum, r) => sum + (r.hours || 0), 0);

        const meetingCount = contextRecords.filter(r => r.type === 'meeting').length;
        
        const certificateCount = contextRecords.filter(
            r => r.type === 'training' && r.certificateUrl
        ).length;

        return {
            trainingHours,
            meetingCount,
            certificateCount,
        };
    }, [records, currentStaffId]);

    function openCreate() {
        setEditingId(null);
        setRecordType('training');
        setForm({
            staff_id: currentStaffId || '',
            title: '',
            provider: '',
            training_type: 'อบรม',
            start_date: new Date().toISOString().split('T')[0],
            end_date: '',
            meeting_time: '',
            hours: 0,
            location: '',
            budget: 0,
            certificate_url: '',
            decisions: '',
            notes: '',
            minutes_url: ''
        });
        setAttendees(['']);
        setAgendas(['']);
        setActivityPhotos([]);
        setDialogOpen(true);
    }

    function openEdit(r: UnifiedRecord) {
        setEditingId(r.id);
        setRecordType(r.type);
        setForm({
            staff_id: r.staffId || '',
            title: r.title,
            provider: r.provider || '',
            training_type: r.type === 'training' ? r.provider || 'อบรม' : 'อบรม',
            start_date: r.date,
            end_date: r.endDate || '',
            meeting_time: r.time || '',
            hours: r.hours || 0,
            location: r.location || '',
            budget: r.budget || 0,
            certificate_url: r.certificateUrl || '',
            decisions: r.decisions || '',
            notes: r.notes || '',
            minutes_url: r.minutes_url || ''
        });
        setAttendees(r.attendees?.length ? r.attendees : ['']);
        setAgendas(r.agendas?.length ? r.agendas : ['']);
        setActivityPhotos(r.photos || []);
        setDialogOpen(true);
    }

    async function handleSave() {
        if (!form.title || !form.start_date) {
            toast.error('กรุณากรอกหัวข้อ/ชื่อโครงการ และวันที่เริ่มต้น');
            return;
        }

        setIsSaving(true);
        try {
            const cleanAttendees = attendees.filter(a => a.trim());
            const cleanAgendas = agendas.filter(a => a.trim());

            if (recordType === 'training') {
                const payload = {
                    staff_id: form.staff_id || currentStaffId || null,
                    course_name: form.title,
                    provider: form.provider || null,
                    training_type: form.training_type,
                    start_date: form.start_date,
                    end_date: form.end_date || null,
                    hours: Number(form.hours),
                    location: form.location || null,
                    budget: Number(form.budget),
                    certificate_url: form.certificate_url || null,
                    status: 'ผ่านการอบรม', // Default status for teacher recorded training
                    activity_photos: activityPhotos,
                    notes: form.notes || null
                };

                if (editingId) {
                    const { error } = await trainingService.update(editingId, payload as never);
                    if (error) throw error;
                    toast.success('แก้ไขประวัติการอบรมสำเร็จ');
                } else {
                    const { error } = await trainingService.insert(payload as never);
                    if (error) throw error;
                    toast.success('บันทึกการอบรมใหม่สำเร็จ');
                }
            } else {
                const payload = {
                    staff_id: form.staff_id || currentStaffId || null,
                    title: form.title,
                    meeting_date: form.start_date,
                    meeting_time: form.meeting_time || null,
                    location: form.location || null,
                    attendees: cleanAttendees.length ? cleanAttendees : null,
                    agendas: cleanAgendas.length ? cleanAgendas : null,
                    decisions: form.decisions || null,
                    minutes_url: form.minutes_url || null,
                    photos: activityPhotos
                };

                if (editingId) {
                    const { error } = await meetingsService.update(editingId, payload as never);
                    if (error) throw error;
                    toast.success('แก้ไขบันทึกการประชุมสำเร็จ');
                } else {
                    const { error } = await meetingsService.insert(payload as never);
                    if (error) throw error;
                    toast.success('บันทึกการประชุมใหม่สำเร็จ');
                }
            }
            setDialogOpen(false);
            fetchRecords();
        } catch (err: any) {
            console.error('Save error:', err);
            toast.error(err.message || 'บันทึกข้อมูลล้มเหลว');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete(id: string, type: 'training' | 'meeting') {
        if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการประวัตินี้?')) return;

        const { error } = type === 'training' 
            ? await trainingService.delete(id) 
            : await meetingsService.delete(id);

        if (error) {
            toast.error('ลบข้อมูลไม่สำเร็จ');
        } else {
            toast.success('ลบข้อมูลสำเร็จ');
            fetchRecords();
        }
    }

    // OCR function
    async function handleOcrFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('กรุณาเลือกไฟล์รูปภาพเพื่อทำ OCR');
            return;
        }

        setOcrLoading(true);
        setOcrProgress(0);
        try {
            const { parsed } = await runCertOCR(file, (p) => setOcrProgress(p));
            const updates: Partial<typeof form> = {};
            const filled: string[] = [];

            if (parsed.courseName) {
                updates.title = parsed.courseName;
                filled.push('ชื่อโครงการ');
            }
            if (parsed.startDate) {
                updates.start_date = parsed.startDate;
                filled.push('วันที่');
            }
            if (parsed.hours) {
                updates.hours = parsed.hours;
                filled.push(`${parsed.hours} ชม.`);
            }

            if (filled.length > 0) {
                setForm(f => ({ ...f, ...updates }));
                toast.success(`แสกนสำเร็จ เติมข้อมูลออโต้: ${filled.join(' · ')}`, {
                    description: 'กรุณาตรวจสอบความถูกต้องอีกครั้งก่อนบันทึก',
                });
            } else {
                toast.warning('แสกนสำเร็จแต่วิเคราะห์ข้อมูลไม่ได้', {
                    description: 'กรุณากรอกข้อมูลดัวยตนเอง',
                });
            }
        } catch (err: any) {
            toast.error('ระบบ OCR ล้มเหลว', { description: err.message || 'กรุณาลองใหม่อีกครั้ง' });
        } finally {
            setOcrLoading(false);
            if (ocrFileRef.current) ocrFileRef.current.value = '';
        }
    }

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
            {/* Header section with Glassmorphism subtle glow */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/10 bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-sm">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs tracking-wider uppercase">
                        <Sparkles className="w-4 h-4 text-primary animate-pulse" /> Self-Development Portfolio Hub
                    </div>
                    <h1 className="text-3xl font-black bg-gradient-to-r from-teal-500 via-primary to-violet-500 bg-clip-text text-transparent">
                        แฟ้มบันทึกพัฒนาตนเอง
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        รวบรวมชั่วโมงการอบรม ประวัติการสัมมนา และบันทึกการประชุมสำหรับจัดทำรายงานประกันคุณภาพการศึกษา (SAR)
                    </p>
                </div>
                <Button onClick={openCreate} className="bg-gradient-to-r from-teal-500 to-primary text-white hover:shadow-lg hover:shadow-primary/20 transition-all font-semibold rounded-xl self-start md:self-center">
                    <Plus className="w-5 h-5 mr-2" /> บันทึกผลงานใหม่
                </Button>
            </div>

            {/* KPI Cards Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border border-white/10 bg-gradient-to-br from-violet-500/10 to-purple-500/5 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-md">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-semibold text-violet-500 uppercase tracking-wider">
                            ชั่วโมงอบรมสะสม
                        </CardDescription>
                        <CardTitle className="text-3xl font-extrabold text-foreground flex items-baseline gap-2">
                            {stats.trainingHours} <span className="text-xs text-muted-foreground font-normal">ชั่วโมง</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                <div 
                                    className="bg-violet-500 h-full rounded-full transition-all duration-500" 
                                    style={{ width: `${Math.min(100, (stats.trainingHours / 20) * 100)}%` }}
                                />
                            </div>
                            <span className="text-xs text-muted-foreground font-medium shrink-0">
                                {stats.trainingHours}/20 ชม.
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-white/10 bg-gradient-to-br from-teal-500/10 to-emerald-500/5 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-md">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-semibold text-teal-500 uppercase tracking-wider">
                            บันทึกการประชุม
                        </CardDescription>
                        <CardTitle className="text-3xl font-extrabold text-foreground flex items-baseline gap-2">
                            {stats.meetingCount} <span className="text-xs text-muted-foreground font-normal">ครั้ง</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                            <Calendar className="w-3.5 h-3.5 text-teal-500" />
                            จัดเก็บระเบียบวาระและมติการประชุมเป็นระบบ
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-white/10 bg-gradient-to-br from-amber-500/10 to-orange-500/5 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-md">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
                            เกียรติบัตรที่ได้รับ
                        </CardDescription>
                        <CardTitle className="text-3xl font-extrabold text-foreground flex items-baseline gap-2">
                            {stats.certificateCount} <span className="text-xs text-muted-foreground font-normal">ใบประกาศ</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                            <Award className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                            ใบเกียรติบัตรพร้อมหลักฐานรูปถ่ายครบถ้วน
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter and Tab controls */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border border-border bg-card rounded-2xl p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                    <Tabs value={viewTab} onValueChange={(v: any) => setViewTab(v)} className="w-auto">
                        <TabsList className="bg-muted p-1 rounded-xl">
                            <TabsTrigger value="my" className="rounded-lg font-semibold px-4 py-1.5 text-xs">
                                📂 ผลงานของฉัน
                            </TabsTrigger>
                            <TabsTrigger value="all" className="rounded-lg font-semibold px-4 py-1.5 text-xs">
                                ✨ ผลงานเพื่อนครู (ห้องสมุดไอเดีย)
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="h-6 w-[1px] bg-border hidden sm:block mx-1" />

                    {/* Filter Type */}
                    <div className="flex items-center gap-1 bg-muted rounded-xl p-1 text-xs">
                        <Button 
                            variant={filterType === 'all' ? 'default' : 'ghost'} 
                            size="sm" 
                            className="h-7 text-xs rounded-lg px-3 py-1 font-semibold"
                            onClick={() => setFilterType('all')}
                        >
                            ทั้งหมด
                        </Button>
                        <Button 
                            variant={filterType === 'training' ? 'default' : 'ghost'} 
                            size="sm" 
                            className="h-7 text-xs rounded-lg px-3 py-1 font-semibold"
                            onClick={() => setFilterType('training')}
                        >
                            การอบรม
                        </Button>
                        <Button 
                            variant={filterType === 'meeting' ? 'default' : 'ghost'} 
                            size="sm" 
                            className="h-7 text-xs rounded-lg px-3 py-1 font-semibold"
                            onClick={() => setFilterType('meeting')}
                        >
                            การประชุม
                        </Button>
                    </div>
                </div>

                {/* Search Input */}
                <div className="relative w-full md:max-w-xs shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="ค้นหาชื่อหลักสูตร, แหล่งจัด, ครู..."
                        className="pl-9 pr-4 rounded-xl text-xs h-9"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* List and Grid display */}
            {loading ? (
                <div className="flex flex-col items-center justify-center p-24 gap-3 bg-card border rounded-2xl">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">กำลังประมวลผลข้อมูลประวัติพัฒนาตนเอง...</p>
                </div>
            ) : filteredRecords.length === 0 ? (
                <div className="text-center py-16 bg-card border rounded-2xl flex flex-col items-center gap-2">
                    <BookOpen className="h-10 w-10 text-muted-foreground/60" />
                    <p className="font-semibold text-lg">ไม่พบข้อมูลบันทึกตามการตั้งค่านี้</p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                        คุณครูสามารถกดบันทึกใหม่ หรือเปลี่ยนเงื่อนไขค้นหาด้านบน เพื่อขยายขอบเขตการดูประวัติ
                    </p>
                    <Button onClick={openCreate} variant="outline" className="mt-4 rounded-xl text-xs font-semibold">
                        <Plus className="w-4 h-4 mr-1.5" /> เริ่มเพิ่มระเบียนแรก
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Timeline section (Takes 2 columns) */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" /> ไทม์ไลน์บันทึกตามลำดับเวลา
                        </h2>

                        <div className="relative pl-6 border-l border-border space-y-6 py-2">
                            {filteredRecords.map(r => (
                                <div key={r.id} className="relative group">
                                    {/* Event bullet point */}
                                    <div className={`absolute -left-[31px] top-1 w-5 h-5 rounded-full border-4 border-background flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${
                                        r.type === 'training' ? 'bg-violet-500' : 'bg-teal-500'
                                    }`} />

                                    <Card className="border border-border/60 hover:border-primary/45 transition-all duration-200 shadow-sm overflow-hidden">
                                        <div className="p-5 space-y-4">
                                            {/* Header with Type, Date and Actions */}
                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge className={r.type === 'training' ? 'bg-violet-500 text-white' : 'bg-teal-500 text-white'}>
                                                        {r.type === 'training' ? 'การอบรม/สัมมนา' : 'การประชุม'}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5" /> {formatThaiDateFull(r.date)} {r.endDate ? ` - ${formatThaiDateFull(r.endDate)}` : ''} {r.time ? `@ ${r.time} น.` : ''}
                                                    </span>
                                                </div>

                                                {/* Author profile */}
                                                <div className="flex items-center gap-2">
                                                    <PersonAvatar name={r.staffName || ''} photoUrl={r.staffPhoto} size="xs" />
                                                    <span className="text-[10px] text-muted-foreground font-medium">{r.staffName}</span>
                                                </div>
                                            </div>

                                            {/* Course Title and basic info */}
                                            <div className="space-y-1.5">
                                                <h3 className="font-extrabold text-foreground group-hover:text-primary transition-colors leading-snug">
                                                    {r.title}
                                                </h3>
                                                
                                                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                                                    {r.provider && (
                                                        <span className="flex items-center gap-1 font-medium">
                                                            <BookOpen className="w-3.5 h-3.5 text-muted-foreground" /> จัดโดย: {r.provider}
                                                        </span>
                                                    )}
                                                    {r.hours ? (
                                                        <span className="flex items-center gap-1 font-medium">
                                                            <Clock className="w-3.5 h-3.5 text-muted-foreground" /> จำนวน: {r.hours} ชั่วโมง
                                                        </span>
                                                    ) : null}
                                                    {r.location && (
                                                        <span className="flex items-center gap-1 font-medium">
                                                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> สถานที่: {r.location}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Photo strip if any */}
                                            {r.photos && r.photos.length > 0 && (
                                                <div className="flex flex-wrap gap-2 pt-1">
                                                    {r.photos.map((url, index) => (
                                                        <a key={index} href={url} target="_blank" rel="noreferrer" className="w-16 h-16 rounded-lg overflow-hidden border border-border shadow-sm shrink-0 block hover:scale-105 transition-transform duration-200">
                                                            <img src={url} alt="Activity" className="w-full h-full object-cover" />
                                                        </a>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Notes / Decisions */}
                                            {r.notes && (
                                                <p className="text-xs text-muted-foreground bg-secondary/35 p-2.5 rounded-lg border border-border/30">
                                                    💡 <strong>บันทึกเพิ่มเติม:</strong> {r.notes}
                                                </p>
                                            )}
                                            {r.decisions && (
                                                <p className="text-xs text-muted-foreground bg-teal-500/5 p-2.5 rounded-lg border border-teal-500/20">
                                                    📝 <strong>มติที่ประชุม:</strong> {r.decisions}
                                                </p>
                                            )}

                                            {/* Cert indicator / Minutes report Link */}
                                            <div className="flex items-center justify-between pt-2 border-t border-border/40">
                                                <div className="flex items-center gap-2">
                                                    {r.certificateUrl ? (
                                                        <Button 
                                                            variant="link" 
                                                            className="text-amber-600 hover:text-amber-700 h-auto p-0 text-xs font-bold flex items-center gap-1"
                                                            onClick={() => setPreviewCert({ certificate_url: r.certificateUrl, course_name: r.title })}
                                                        >
                                                            <Award className="w-4 h-4 text-amber-500 animate-bounce" /> ดูใบเกียรติบัตรสำเร็จรูป
                                                        </Button>
                                                    ) : r.type === 'training' ? (
                                                        <span className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                                                            <Award className="w-3.5 h-3.5 text-muted-foreground/50" /> ไม่มีภาพเกียรติบัตรประกอบ
                                                        </span>
                                                    ) : null}

                                                    {r.minutes_url && (
                                                        <a href={r.minutes_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-xs font-bold">
                                                            <FileText className="w-3.5 h-3.5" /> ดูรายงานสรุปมติ
                                                        </a>
                                                    )}
                                                </div>

                                                {/* Edit / Delete control (only allowed for owner staff or admin) */}
                                                {(isAdmin || r.staffId === currentStaffId) && (
                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="icon" className="w-7 h-7 rounded-lg" onClick={() => openEdit(r)}>
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="w-7 h-7 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDelete(r.id, r.type)}>
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Polaroid Wall Side showcase (Takes 1 column) */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Award className="w-5 h-5 text-amber-500" /> แผงเกียรติบัตรคุณครู
                        </h2>

                        <div className="border border-border/80 bg-card rounded-2xl p-4 shadow-sm space-y-4 max-h-[80vh] overflow-y-auto">
                            <p className="text-xs text-muted-foreground">
                                แสดงผลใบประกาศที่แนบมากับประวัติการอบรมของคุณครู สามารถแตะคลิกเพื่อขยายดูรายละเอียดใบเต็มได้
                            </p>

                            <div className="grid grid-cols-1 gap-4">
                                {filteredRecords
                                    .filter(r => r.type === 'training' && r.certificateUrl)
                                    .map(r => (
                                        <div 
                                            key={r.id} 
                                            className="bg-white border border-border rounded-xl p-3 shadow-md hover:scale-[1.03] transition-all hover:rotate-1 duration-200 cursor-pointer text-center group"
                                            onClick={() => setPreviewCert({ certificate_url: r.certificateUrl, course_name: r.title })}
                                        >
                                            <div className="aspect-[4/3] rounded-lg overflow-hidden border bg-muted relative">
                                                <img 
                                                    src={r.certificateUrl!} 
                                                    alt={r.title} 
                                                    className="w-full h-full object-cover" 
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                                    <Eye className="w-6 h-6 text-white" />
                                                </div>
                                            </div>
                                            <div className="pt-2 text-left space-y-1">
                                                <p className="text-[11px] text-muted-foreground font-semibold">{formatThaiDateFull(r.date)}</p>
                                                <p className="text-xs font-extrabold text-foreground truncate">{r.title}</p>
                                                <div className="flex items-center gap-1.5 pt-0.5">
                                                    <PersonAvatar name={r.staffName || ''} photoUrl={r.staffPhoto} size="xs" />
                                                    <span className="text-[10px] text-primary font-medium">{r.staffName}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                {filteredRecords.filter(r => r.type === 'training' && r.certificateUrl).length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground/60 text-xs italic">
                                        ยังไม่มีประวัติแนบภาพเกียรติบัตร
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Unified Modal Dialog for record entry */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            {editingId ? '📝 แก้ไขข้อมูลประวัติงานพัฒนาตนเอง' : '✨ บันทึกผลงานการพัฒนาตนเองและกิจกรรม'}
                        </DialogTitle>
                    </DialogHeader>

                    {/* Selector Switch if creating new */}
                    {!editingId && (
                        <div className="grid grid-cols-2 p-1.5 bg-muted rounded-xl gap-1 shrink-0">
                            <button
                                type="button"
                                className={`py-2 rounded-lg font-bold text-xs transition-all ${
                                    recordType === 'training'
                                        ? 'bg-background text-primary shadow-sm'
                                        : 'text-muted-foreground hover:bg-white/10'
                                }`}
                                onClick={() => setRecordType('training')}
                            >
                                🎓 บันทึก การอบรม/สัมมนา
                            </button>
                            <button
                                type="button"
                                className={`py-2 rounded-lg font-bold text-xs transition-all ${
                                    recordType === 'meeting'
                                        ? 'bg-background text-primary shadow-sm'
                                        : 'text-muted-foreground hover:bg-white/10'
                                }`}
                                onClick={() => setRecordType('meeting')}
                            >
                                👥 บันทึก การประชุมบุคลากร
                            </button>
                        </div>
                    )}

                    <div className="space-y-4 pt-2">
                        {/* Admin target staff select */}
                        {isAdmin && (
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">บันทึกผลงานให้กับคุณครู/บุคลากร <span className="text-destructive">*</span></Label>
                                <Select 
                                    value={form.staff_id} 
                                    onValueChange={v => setForm(f => ({ ...f, staff_id: v }))}
                                >
                                    <SelectTrigger className="rounded-xl text-xs h-9">
                                        <SelectValue placeholder="เลือกคุณครูผู้เป็นเจ้าของผลงาน" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {staffList.map(s => (
                                            <SelectItem key={s.id} value={s.id} className="text-xs">
                                                {s.name} ({s.position || 'บุคลากร'})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Title / Topic */}
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">
                                {recordType === 'training' ? 'ชื่อหลักสูตร / โครงการการอบรม' : 'หัวข้อ/ชื่อการประชุม'} <span className="text-destructive">*</span>
                            </Label>
                            <Input 
                                value={form.title} 
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} 
                                placeholder={recordType === 'training' ? 'ระบุชื่อหลักสูตร หรือวิชาที่อบรม...' : 'ระบุหัวข้อประชุม...'} 
                                className="rounded-xl text-xs h-9"
                            />
                        </div>

                        {/* Date selectors */}
                        {recordType === 'training' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">วันที่เริ่มต้นอบรม <span className="text-destructive">*</span></Label>
                                    <ThaiDatePicker value={form.start_date} onChange={v => setForm(f => ({ ...f, start_date: v }))} clearable={false} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">วันที่เสร็จสิ้นอบรม (ถ้ามี)</Label>
                                    <ThaiDatePicker value={form.end_date} onChange={v => setForm(f => ({ ...f, end_date: v }))} clearable={true} />
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">วันที่ประชุม <span className="text-destructive">*</span></Label>
                                    <ThaiDatePicker value={form.start_date} onChange={v => setForm(f => ({ ...f, start_date: v }))} clearable={false} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">เวลาประชุม</Label>
                                    <Input 
                                        type="time" 
                                        value={form.meeting_time} 
                                        onChange={e => setForm(f => ({ ...f, meeting_time: e.target.value }))} 
                                        className="rounded-xl text-xs h-9"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Training specific fields */}
                        {recordType === 'training' && (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold">ประเภทระเบียน</Label>
                                        <Select 
                                            value={form.training_type} 
                                            onValueChange={v => setForm(f => ({ ...f, training_type: v }))}
                                        >
                                            <SelectTrigger className="rounded-xl text-xs h-9">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TRAINING_TYPES.map(t => (
                                                    <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold">จำนวนชั่วโมงอบรม</Label>
                                        <Input 
                                            type="number" 
                                            value={form.hours || ''} 
                                            onChange={e => setForm(f => ({ ...f, hours: Number(e.target.value) }))} 
                                            placeholder="ใส่จำนวนชั่วโมงสะสม..."
                                            className="rounded-xl text-xs h-9"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold">งบประมาณที่ใช้ (บาท)</Label>
                                        <Input 
                                            type="number" 
                                            value={form.budget || ''} 
                                            onChange={e => setForm(f => ({ ...f, budget: Number(e.target.value) }))} 
                                            placeholder="งบประมาณ..."
                                            className="rounded-xl text-xs h-9"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold">หน่วยงานผู้จัด / แหล่งเรียนรู้</Label>
                                        <Input 
                                            value={form.provider} 
                                            onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} 
                                            placeholder="สพม. / มหาวิทยาลัย / สถาบันจัด..." 
                                            className="rounded-xl text-xs h-9"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold">สถานที่อบรม</Label>
                                        <Input 
                                            value={form.location} 
                                            onChange={e => setForm(f => ({ ...f, location: e.target.value }))} 
                                            placeholder="ออนไลน์ / โรงแรม..." 
                                            className="rounded-xl text-xs h-9"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Meeting specific fields */}
                        {recordType === 'meeting' && (
                            <>
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">สถานที่ประชุม</Label>
                                    <Input 
                                        value={form.location} 
                                        onChange={e => setForm(f => ({ ...f, location: e.target.value }))} 
                                        placeholder="ห้องประชุมเบญจมาศ / ห้องประชุมใหญ่..." 
                                        className="rounded-xl text-xs h-9"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">สรุปมติที่ประชุม</Label>
                                    <Textarea 
                                        value={form.decisions} 
                                        onChange={e => setForm(f => ({ ...f, decisions: e.target.value }))} 
                                        placeholder="สรุปมติ สาระ หรือนโยบายที่ได้จากการประชุมนี้..." 
                                        className="rounded-xl text-xs" 
                                        rows={3} 
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">URL เอกสารประกอบ / รายงาน (Minutes URL)</Label>
                                    <Input 
                                        value={form.minutes_url} 
                                        onChange={e => setForm(f => ({ ...f, minutes_url: e.target.value }))} 
                                        placeholder="https://gdrive/folder-report" 
                                        className="rounded-xl text-xs h-9"
                                    />
                                </div>
                            </>
                        )}

                        {/* Activity image uploader */}
                        <div className="space-y-1.5 border-t pt-3">
                            <Label className="text-xs font-semibold">📸 แนบรูปภาพบรรยากาศกิจกรรม (อัปโหลดได้หลายรูป)</Label>
                            <ActivityPhotoUploader
                                currentPhotos={activityPhotos}
                                onPhotosChange={urls => setActivityPhotos(urls)}
                                maxPhotos={6}
                                folder={recordType === 'training' ? 'training-photos' : 'meeting-photos'}
                            />
                        </div>

                        {/* Certificate uploader for Training */}
                        {recordType === 'training' && (
                            <div className="space-y-3 border-t pt-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                                        <Award className="w-4 h-4 text-amber-500" /> แนบรูปภาพใบประกาศเกียรติบัตร (ถ้ามี)
                                    </Label>

                                    {/* OCR scanner btn */}
                                    <div className="flex items-center gap-2">
                                        <input
                                            ref={ocrFileRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleOcrFile}
                                            className="hidden"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => ocrFileRef.current?.click()}
                                            disabled={ocrLoading}
                                            className="h-7 text-[10px] font-semibold border-amber-500/35 hover:bg-amber-500/5 text-amber-600 rounded-lg"
                                        >
                                            {ocrLoading ? (
                                                <>
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                                                    วิเคราะห์รูป {ocrProgress}%
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                                                    แสกนข้อมูลใบเสร็จ/เกียรติบัตรอัตโนมัติ (OCR)
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                <ImageUpload
                                    currentImage={form.certificate_url}
                                    onUploadComplete={url => setForm(f => ({ ...f, certificate_url: url }))}
                                    folder="training-certificates"
                                    compressionPreset="gallery"
                                />
                            </div>
                        )}

                        {/* General notes */}
                        <div className="space-y-1 border-t pt-3">
                            <Label className="text-xs font-semibold">หมายเหตุ / ข้อมูลเพิ่มเติม</Label>
                            <Textarea 
                                value={form.notes} 
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} 
                                placeholder="บันทึกข้อความสั้น ๆ หรือข้อควรระวัง..." 
                                className="rounded-xl text-xs" 
                                rows={2} 
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 border-t pt-3">
                        <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl font-semibold text-xs">
                            ยกเลิก
                        </Button>
                        <Button 
                            onClick={handleSave} 
                            disabled={isSaving}
                            className="bg-gradient-to-r from-teal-500 to-primary text-white hover:shadow-md rounded-xl font-semibold text-xs"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                            บันทึกข้อมูล
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Standard Certificate Preview Modal */}
            {previewCert && (
                <CertificateViewer
                    record={previewCert}
                    open={!!previewCert}
                    onClose={() => setPreviewCert(null)}
                />
            )}
        </div>
    );
}

export default SelfDevelopmentHub;
