import { useState, useEffect, useMemo } from 'react';
import { studentsService, conductService } from '@/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Star, Plus, Minus, Trophy, History, Search, Trash2, Users, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { RecorderSelect, EMPTY_RECORDER, type RecorderValue } from '../shared/RecorderSelect';
import { TableSkeleton } from '@/components/ui/loading-skeletons';
import { PersonAvatar } from '@/components/shared/PersonAvatar';

// ===== Constants =====
const CLASS_OPTIONS = ['อ.1', 'อ.2', 'อ.3', 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6', 'ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];

const currentYear = (new Date().getFullYear() + 543).toString();

// Sentinel สำหรับ <Select> ของ radix v2.2+ ที่ห้าม value=""
const ALL = '__all__';

const PRESET_REASONS: Record<'add' | 'deduct', { category: string; reasons: string[] }[]> = {
    add: [
        { category: 'ความดี', reasons: ['ช่วยเหลือผู้อื่น', 'มีน้ำใจ', 'รักษาความสะอาด', 'ซื่อสัตย์สุจริต'] },
        { category: 'จิตอาสา', reasons: ['เข้าร่วมกิจกรรมจิตอาสา', 'ช่วยงานโรงเรียน', 'บริจาคสิ่งของ'] },
        { category: 'วินัย', reasons: ['มาเรียนตรงเวลา', 'แต่งกายถูกระเบียบ', 'รักษาระเบียบวินัย'] },
        { category: 'วิชาการ', reasons: ['ได้รับรางวัลการแข่งขัน', 'สอบได้คะแนนดีเด่น', 'ทำงานส่งครบ'] },
        { category: 'กีฬา', reasons: ['ได้รับรางวัลกีฬา', 'มีน้ำใจนักกีฬา'] },
    ],
    deduct: [
        { category: 'วินัย', reasons: ['มาสาย', 'แต่งกายผิดระเบียบ', 'ใช้โทรศัพท์ในห้องเรียน', 'ส่งเสียงรบกวน'] },
        { category: 'ทรัพย์สิน', reasons: ['ทำลายทรัพย์สินโรงเรียน', 'ลักขโมย'] },
        { category: 'การเรียน', reasons: ['ไม่ส่งงาน', 'ขาดเรียนโดยไม่มีเหตุผล', 'ทุจริตในการสอบ'] },
        { category: 'ความประพฤติ', reasons: ['ทะเลาะวิวาท', 'พูดจาหยาบคาย', 'กลั่นแกล้งเพื่อน'] },
    ],
};

// ===== Interfaces =====
interface Student {
    id: string;
    student_code: string | null;
    name: string;
    class: string;
    room: string | null;
    class_number: number | null;
    gender: string | null;
    photo_url: string | null;
}

interface ConductRecord {
    id: string;
    student_id: string;
    type: 'add' | 'deduct';
    score: number;
    category: string;
    reason: string;
    recorded_by: string | null;
    academic_year: string;
    semester: string;
    created_at: string;
    students?: { name: string; class: string; photo_url?: string | null } | null;
}

// ===== Main Component =====
export const ConductManagement = () => {
    const { toast } = useToast();

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-500" />
                <h2 className="text-xl font-bold">ระบบคะแนนความดี</h2>
            </div>

            <Tabs defaultValue="record">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="record" className="gap-1 text-xs sm:text-sm px-1">
                        <Plus className="w-3.5 h-3.5 flex-shrink-0" /> ทีละคน
                    </TabsTrigger>
                    <TabsTrigger value="bulk" className="gap-1 text-xs sm:text-sm px-1">
                        <Users className="w-3.5 h-3.5 flex-shrink-0" /> หลายคน
                    </TabsTrigger>
                    <TabsTrigger value="leaderboard" className="gap-1 text-xs sm:text-sm px-1">
                        <Trophy className="w-3.5 h-3.5 flex-shrink-0" /> อันดับ
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-1 text-xs sm:text-sm px-1">
                        <History className="w-3.5 h-3.5 flex-shrink-0" /> ประวัติ
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="record"><RecordTab toast={toast} /></TabsContent>
                <TabsContent value="bulk"><BulkRecordTab toast={toast} /></TabsContent>
                <TabsContent value="leaderboard"><LeaderboardTab /></TabsContent>
                <TabsContent value="history"><HistoryTab toast={toast} /></TabsContent>
            </Tabs>
        </div>
    );
};

// ===== Tab 1: บันทึกคะแนน =====
function RecordTab({ toast }: { toast: ReturnType<typeof useToast>['toast'] }) {
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [type, setType] = useState<'add' | 'deduct'>('add');
    const [category, setCategory] = useState('');
    const [reason, setReason] = useState('');
    const [score, setScore] = useState('1');
    const [recorder, setRecorder] = useState<RecorderValue>(EMPTY_RECORDER);
    const [semester, setSemester] = useState('1');
    const [academicYear, setAcademicYear] = useState(currentYear);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!selectedClass) { setStudents([]); setSelectedStudentId(''); return; }
        studentsService.getByClass(selectedClass)
            .then(({ data }) => setStudents((data || []) as Student[]));
    }, [selectedClass]);

    const presets = PRESET_REASONS[type];
    const categoryPreset = presets.find(p => p.category === category);

    const handleSave = async () => {
        if (!selectedStudentId || !reason.trim()) {
            toast({ variant: 'destructive', title: 'กรุณาเลือกนักเรียนและกรอกเหตุผล' });
            return;
        }
        setIsSaving(true);
        const { error } = await conductService.insert({
            student_id: selectedStudentId,
            type,
            score: parseInt(score) || 1,
            category: category || (type === 'add' ? 'ความดี' : 'วินัย'),
            reason: reason.trim(),
            recorded_by: recorder.name || null,
            recorded_by_staff_id: recorder.staffId,
            recorded_by_administrator_id: recorder.administratorId,
            academic_year: academicYear,
            semester,
        });
        setIsSaving(false);
        if (error) { toast({ variant: 'destructive', title: 'บันทึกไม่สำเร็จ', description: error.message }); return; }

        const student = students.find(s => s.id === selectedStudentId);
        toast({
            title: type === 'add' ? '+ บวกคะแนนสำเร็จ' : '- หักคะแนนสำเร็จ',
            description: `${student?.name} ${type === 'add' ? '+' : '-'}${score} คะแนน · ${reason}`,
        });
        setReason('');
        setScore('1');
    };

    return (
        <div className="space-y-4 pt-4">
            <div className="grid md:grid-cols-2 gap-4">
                {/* เลือกนักเรียน */}
                <Card>
                    <CardHeader><CardTitle className="text-base">เลือกนักเรียน</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-1">
                            <Label>ชั้น/ห้อง</Label>
                            <Select value={selectedClass} onValueChange={v => { setSelectedClass(v); setSelectedStudentId(''); }}>
                                <SelectTrigger><SelectValue placeholder="เลือกชั้น" /></SelectTrigger>
                                <SelectContent>{CLASS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>นักเรียน</Label>
                            <Select value={selectedStudentId} onValueChange={setSelectedStudentId} disabled={students.length === 0}>
                                <SelectTrigger><SelectValue placeholder={students.length === 0 ? 'เลือกชั้นก่อน' : 'เลือกนักเรียน'} /></SelectTrigger>
                                <SelectContent>
                                    {students.map(s => (
                                        <SelectItem key={s.id} value={s.id}>
                                            <div className="flex items-center gap-2">
                                                <PersonAvatar name={s.name} photoUrl={s.photo_url} size="xs" />
                                                <span>
                                                    {s.name}
                                                    {s.class_number ? ` (เลขที่ ${s.class_number})` : ''}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label>ภาคเรียน</Label>
                                <Select value={semester} onValueChange={setSemester}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">ภาคเรียน 1</SelectItem>
                                        <SelectItem value="2">ภาคเรียน 2</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label>ปีการศึกษา</Label>
                                <Input value={academicYear} onChange={e => setAcademicYear(e.target.value)} />
                            </div>
                        </div>
                        <RecorderSelect label="ผู้บันทึก (ครู/ผอ.)" value={recorder} onChange={setRecorder} />
                    </CardContent>
                </Card>

                {/* บันทึกคะแนน */}
                <Card>
                    <CardHeader><CardTitle className="text-base">รายละเอียดคะแนน</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {/* ประเภท: บวก/หัก */}
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                type="button"
                                variant={type === 'add' ? 'default' : 'outline'}
                                className={`gap-1 ${type === 'add' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                onClick={() => { setType('add'); setCategory(''); setReason(''); }}
                            >
                                <Plus className="w-4 h-4" /> บวกคะแนน
                            </Button>
                            <Button
                                type="button"
                                variant={type === 'deduct' ? 'default' : 'outline'}
                                className={`gap-1 ${type === 'deduct' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                                onClick={() => { setType('deduct'); setCategory(''); setReason(''); }}
                            >
                                <Minus className="w-4 h-4" /> หักคะแนน
                            </Button>
                        </div>

                        {/* หมวดหมู่ */}
                        <div className="space-y-1">
                            <Label>หมวดหมู่</Label>
                            <div className="flex flex-wrap gap-1">
                                {presets.map(p => (
                                    <Badge
                                        key={p.category}
                                        variant={category === p.category ? 'default' : 'outline'}
                                        className="cursor-pointer"
                                        onClick={() => { setCategory(p.category); setReason(''); }}
                                    >
                                        {p.category}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* เหตุผลสำเร็จรูป */}
                        {categoryPreset && (
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">เหตุผลสำเร็จรูป</Label>
                                <div className="flex flex-wrap gap-1">
                                    {categoryPreset.reasons.map(r => (
                                        <Badge
                                            key={r}
                                            variant={reason === r ? 'default' : 'secondary'}
                                            className="cursor-pointer text-xs"
                                            onClick={() => setReason(r)}
                                        >
                                            {r}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* เหตุผล (กรอกเอง) */}
                        <div className="space-y-1">
                            <Label>เหตุผล *</Label>
                            <Textarea
                                placeholder="ระบุเหตุผล..."
                                rows={2}
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                            />
                        </div>

                        {/* จำนวนคะแนน */}
                        <div className="space-y-1">
                            <Label>จำนวนคะแนน</Label>
                            <div className="flex items-center gap-2">
                                <Button type="button" variant="outline" size="icon" onClick={() => setScore(s => String(Math.max(1, parseInt(s) - 1)))}>
                                    <Minus className="w-4 h-4" />
                                </Button>
                                <Input type="number" min={1} max={100} className="w-20 text-center" value={score} onChange={e => setScore(e.target.value)} />
                                <Button type="button" variant="outline" size="icon" onClick={() => setScore(s => String(parseInt(s) + 1))}>
                                    <Plus className="w-4 h-4" />
                                </Button>
                                <span className="text-sm text-muted-foreground">คะแนน</span>
                            </div>
                        </div>

                        <Button
                            className={`w-full gap-1 mt-2 ${type === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                            onClick={handleSave}
                            disabled={isSaving || !selectedStudentId}
                        >
                            {type === 'add' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                            {isSaving ? 'กำลังบันทึก...' : `${type === 'add' ? 'บวก' : 'หัก'} ${score} คะแนน`}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// ===== Tab 2: อันดับคะแนนความดี =====
function LeaderboardTab() {
    const [filterClass, setFilterClass] = useState('');
    const [filterSemester, setFilterSemester] = useState('1');
    const [filterYear, setFilterYear] = useState(currentYear);
    const [records, setRecords] = useState<ConductRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const { data } = await conductService.getAll(filterSemester, filterYear);
            setRecords((data || []) as ConductRecord[]);
            setIsLoading(false);
        };
        load();
    }, [filterClass, filterSemester, filterYear]);

    // รวมคะแนนรายนักเรียน
    const leaderboard = useMemo(() => {
        const map: Record<string, { studentId: string; name: string; class: string; photoUrl: string | null; total: number; added: number; deducted: number }> = {};
        records.forEach(r => {
            if (!r.students) return;
            if (filterClass && r.students.class !== filterClass) return;
            if (!map[r.student_id]) {
                map[r.student_id] = { studentId: r.student_id, name: r.students.name, class: r.students.class, photoUrl: r.students.photo_url ?? null, total: 0, added: 0, deducted: 0 };
            }
            if (r.type === 'add') { map[r.student_id].total += r.score; map[r.student_id].added += r.score; }
            else { map[r.student_id].total -= r.score; map[r.student_id].deducted += r.score; }
        });
        return Object.values(map).sort((a, b) => b.total - a.total);
    }, [records, filterClass]);

    return (
        <div className="space-y-4 pt-4">
            <div className="flex flex-wrap gap-3">
                <Select value={filterClass || ALL} onValueChange={v => setFilterClass(v === ALL ? '' : v)}>
                    <SelectTrigger className="w-36"><SelectValue placeholder="ทุกชั้น" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>ทุกชั้น</SelectItem>
                        {CLASS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterSemester} onValueChange={setFilterSemester}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">ภาคเรียน 1</SelectItem>
                        <SelectItem value="2">ภาคเรียน 2</SelectItem>
                    </SelectContent>
                </Select>
                <Input className="w-28" value={filterYear} onChange={e => setFilterYear(e.target.value)} placeholder={currentYear} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        อันดับคะแนนความดี ({leaderboard.length} คน)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <TableSkeleton rows={6} cols={4} className="py-4" />
                    ) : leaderboard.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">ยังไม่มีข้อมูลคะแนนความดี</p>
                    ) : (
                        <div className="space-y-2">
                            {leaderboard.map((s, idx) => (
                                <div key={s.studentId} className={`flex items-center gap-3 p-3 rounded-lg border ${idx === 0 ? 'bg-yellow-50 border-yellow-200' : idx === 1 ? 'bg-gray-50 border-gray-200' : idx === 2 ? 'bg-amber-50 border-amber-200' : ''}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${idx === 0 ? 'bg-yellow-400 text-white' : idx === 1 ? 'bg-gray-400 text-white' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                                        {idx + 1}
                                    </div>
                                    <PersonAvatar name={s.name} photoUrl={s.photoUrl} size="md" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{s.name}</p>
                                        <p className="text-xs text-muted-foreground">{s.class}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className={`text-lg font-bold ${s.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {s.total >= 0 ? '+' : ''}{s.total}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            <span className="text-green-600">+{s.added}</span>
                                            {' / '}
                                            <span className="text-red-500">-{s.deducted}</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ===== Tab 3: ประวัติคะแนน =====
function HistoryTab({ toast }: { toast: ReturnType<typeof useToast>['toast'] }) {
    const [filterClass, setFilterClass] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterSemester, setFilterSemester] = useState('1');
    const [filterYear, setFilterYear] = useState(currentYear);
    const [searchName, setSearchName] = useState('');
    const [records, setRecords] = useState<ConductRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const load = async () => {
        setIsLoading(true);
        let q = conductService.getAll(filterSemester, filterYear);
        if (filterType) q = q.eq('type', filterType);
        const { data } = await q;
        let result = (data || []) as ConductRecord[];
        if (filterClass) result = result.filter(r => r.students?.class === filterClass);
        if (searchName) result = result.filter(r => (r.students?.name || '').includes(searchName));
        setRecords(result);
        setIsLoading(false);
    };

    useEffect(() => { load(); }, [filterClass, filterType, filterSemester, filterYear, searchName]);

    const handleDelete = async () => {
        if (!deleteId) return;
        const { error } = await conductService.delete(deleteId);
        if (error) toast({ variant: 'destructive', title: 'ลบไม่สำเร็จ' });
        else { toast({ title: 'ลบรายการสำเร็จ' }); load(); }
        setDeleteId(null);
    };

    return (
        <div className="space-y-4 pt-4">
            <div className="flex flex-wrap gap-3">
                <Select value={filterClass || ALL} onValueChange={v => setFilterClass(v === ALL ? '' : v)}>
                    <SelectTrigger className="w-32"><SelectValue placeholder="ทุกชั้น" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>ทุกชั้น</SelectItem>
                        {CLASS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterType || ALL} onValueChange={v => setFilterType(v === ALL ? '' : v)}>
                    <SelectTrigger className="w-32"><SelectValue placeholder="ทุกประเภท" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>ทุกประเภท</SelectItem>
                        <SelectItem value="add">บวกคะแนน</SelectItem>
                        <SelectItem value="deduct">หักคะแนน</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filterSemester} onValueChange={setFilterSemester}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">ภาคเรียน 1</SelectItem>
                        <SelectItem value="2">ภาคเรียน 2</SelectItem>
                    </SelectContent>
                </Select>
                <Input className="w-24" value={filterYear} onChange={e => setFilterYear(e.target.value)} placeholder={currentYear} />
                <div className="relative flex-1 min-w-40">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="ค้นหาชื่อ..." value={searchName} onChange={e => setSearchName(e.target.value)} />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">ประวัติการบันทึก ({records.length} รายการ)</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <TableSkeleton rows={6} cols={4} className="py-4" />
                    ) : records.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">ไม่มีข้อมูล</p>
                    ) : (
                        <div className="space-y-2">
                            {records.map(r => (
                                <div key={r.id} className={`flex items-start gap-3 p-3 rounded-lg border ${r.type === 'add' ? 'border-green-100 bg-green-50/50' : 'border-red-100 bg-red-50/50'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${r.type === 'add' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {r.type === 'add' ? `+${r.score}` : `-${r.score}`}
                                    </div>
                                    <PersonAvatar name={r.students?.name ?? '—'} photoUrl={r.students?.photo_url} size="sm" className="flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium">{r.students?.name ?? '—'}</span>
                                            <Badge variant="outline" className="text-xs">{r.students?.class}</Badge>
                                            <Badge variant="secondary" className="text-xs">{r.category}</Badge>
                                        </div>
                                        <p className="text-sm mt-0.5">{r.reason}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {r.recorded_by && `บันทึกโดย ${r.recorded_by} · `}
                                            {new Date(r.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <Button size="icon" variant="ghost" className="flex-shrink-0" onClick={() => setDeleteId(r.id)}>
                                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="ลบรายการคะแนนนี้?"
                description="รายการที่ลบแล้วจะไม่สามารถกู้คืนได้"
            />
        </div>
    );
}

// ===== Tab Bulk: บันทึกคะแนนหลายคนพร้อมกัน =====
function BulkRecordTab({ toast }: { toast: ReturnType<typeof useToast>['toast'] }) {
    const [selectedClass, setSelectedClass] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [type, setType] = useState<'add' | 'deduct'>('add');
    const [category, setCategory] = useState('');
    const [reason, setReason] = useState('');
    const [score, setScore] = useState('1');
    const [recorder, setRecorder] = useState<RecorderValue>(EMPTY_RECORDER);
    const [semester, setSemester] = useState('1');
    const [academicYear, setAcademicYear] = useState(currentYear);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);

    useEffect(() => {
        if (!selectedClass) { setStudents([]); setSelectedIds(new Set()); return; }
        setIsLoadingStudents(true);
        studentsService.getByClass(selectedClass).then(({ data }) => {
            setStudents((data || []) as Student[]);
            setSelectedIds(new Set());
            setIsLoadingStudents(false);
        });
    }, [selectedClass]);

    const toggleStudent = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const allSelected = students.length > 0 && selectedIds.size === students.length;
    const someSelected = selectedIds.size > 0 && selectedIds.size < students.length;

    const toggleAll = () => {
        setSelectedIds(allSelected ? new Set() : new Set(students.map(s => s.id)));
    };

    const presets = PRESET_REASONS[type];
    const categoryPreset = presets.find(p => p.category === category);

    const handleBulkSave = async () => {
        if (selectedIds.size === 0) {
            toast({ variant: 'destructive', title: 'กรุณาเลือกนักเรียนอย่างน้อย 1 คน' });
            return;
        }
        if (!reason.trim()) {
            toast({ variant: 'destructive', title: 'กรุณาระบุเหตุผล' });
            return;
        }
        const records = Array.from(selectedIds).map(student_id => ({
            student_id,
            type,
            score: parseInt(score) || 1,
            category: category || (type === 'add' ? 'ความดี' : 'วินัย'),
            reason: reason.trim(),
            recorded_by: recorder.name || null,
            recorded_by_staff_id: recorder.staffId,
            recorded_by_administrator_id: recorder.administratorId,
            academic_year: academicYear,
            semester,
        }));
        setIsSaving(true);
        const { error } = await conductService.insertBulk(records);
        setIsSaving(false);
        if (error) {
            toast({ variant: 'destructive', title: 'บันทึกไม่สำเร็จ', description: error.message });
            return;
        }
        toast({
            title: `${type === 'add' ? '+ บวก' : '− หัก'}คะแนนสำเร็จ`,
            description: `${selectedIds.size} คน · ${score} คะแนน · ${reason}`,
        });
        // reset selection + reason; keep class/type/category for quick re-use
        setSelectedIds(new Set());
        setReason('');
        setScore('1');
    };

    const saveLabel = selectedIds.size === 0
        ? 'เลือกนักเรียนก่อน'
        : `${type === 'add' ? 'บวก' : 'หัก'} ${score} คะแนน · ${selectedIds.size} คน`;

    const saveBtnClass = type === 'add'
        ? 'bg-green-600 hover:bg-green-700 active:bg-green-800'
        : 'bg-red-600 hover:bg-red-700 active:bg-red-800';

    return (
        /* Mobile: single column + sticky save bar
           Desktop (md+): 2-column side-by-side, save button inside Step-2 card */
        <div className="pt-4 pb-28 md:pb-4">
            <div className="grid md:grid-cols-2 md:items-start gap-4">

            {/* ──────────── ขั้นที่ 1: เลือกนักเรียน ──────────── */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold flex-shrink-0">1</span>
                        เลือกนักเรียน
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {/* ชั้น + ภาคเรียน */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <Label>ชั้น/ห้อง *</Label>
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="เลือกชั้น" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CLASS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>ภาคเรียน</Label>
                            <Select value={semester} onValueChange={setSemester}>
                                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">ภาคเรียน 1</SelectItem>
                                    <SelectItem value="2">ภาคเรียน 2</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* รายชื่อนักเรียน */}
                    {selectedClass && (
                        <div className="space-y-2">
                            {/* Select-all bar — full-width tappable */}
                            <button
                                type="button"
                                onClick={toggleAll}
                                className="w-full flex items-center justify-between bg-muted/60 hover:bg-muted active:bg-muted rounded-xl px-4 py-3 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    {/* Custom checkbox */}
                                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                        allSelected ? 'bg-primary border-primary' : someSelected ? 'border-primary bg-primary/20' : 'border-muted-foreground/50'
                                    }`}>
                                        {allSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                                        {someSelected && <div className="w-2.5 h-0.5 bg-primary rounded" />}
                                    </div>
                                    <span className="font-semibold text-sm">เลือกทั้งห้อง</span>
                                </div>
                                <Badge variant={selectedIds.size > 0 ? 'default' : 'secondary'} className="text-sm font-bold">
                                    {selectedIds.size} / {students.length} คน
                                </Badge>
                            </button>

                            {/* Student rows */}
                            {isLoadingStudents ? (
                                <TableSkeleton rows={5} cols={2} className="py-2" />
                            ) : students.length === 0 ? (
                                <p className="text-center py-6 text-muted-foreground text-sm">ไม่มีนักเรียนในชั้นนี้</p>
                            ) : (
                                <div className="divide-y rounded-xl border overflow-hidden">
                                    {students.map(s => {
                                        const isSelected = selectedIds.has(s.id);
                                        return (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => toggleStudent(s.id)}
                                                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                                                    isSelected ? 'bg-primary/10' : 'bg-background hover:bg-muted/40'
                                                }`}
                                            >
                                                {/* Checkbox */}
                                                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                                    isSelected ? 'bg-primary border-primary scale-110' : 'border-muted-foreground/40'
                                                }`}>
                                                    {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                                                </div>
                                                {/* Avatar */}
                                                <PersonAvatar name={s.name} photoUrl={s.photo_url} size="sm" />
                                                {/* Name + class number */}
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                                                        {s.name}
                                                    </p>
                                                    {s.class_number && (
                                                        <p className="text-xs text-muted-foreground">เลขที่ {s.class_number}</p>
                                                    )}
                                                </div>
                                                {/* Gender dot */}
                                                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                                    s.gender === 'male' ? 'bg-blue-400' : 'bg-amber-400'
                                                }`} />
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ──────────── ขั้นที่ 2: รายละเอียดคะแนน ──────────── */}
            {/* md:sticky md:top-4 — stays in view while scrolling the student list */}
            <Card className="md:sticky md:top-4">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold flex-shrink-0">2</span>
                        รายละเอียดคะแนน
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* บวก / หัก */}
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            type="button"
                            variant={type === 'add' ? 'default' : 'outline'}
                            className={`h-12 gap-2 text-base font-semibold ${
                                type === 'add'
                                    ? 'bg-green-600 hover:bg-green-700 border-green-600'
                                    : 'border-green-300 text-green-700 hover:bg-green-50 dark:hover:bg-green-950'
                            }`}
                            onClick={() => { setType('add'); setCategory(''); setReason(''); }}
                        >
                            <Plus className="w-5 h-5" /> บวกคะแนน
                        </Button>
                        <Button
                            type="button"
                            variant={type === 'deduct' ? 'default' : 'outline'}
                            className={`h-12 gap-2 text-base font-semibold ${
                                type === 'deduct'
                                    ? 'bg-red-600 hover:bg-red-700 border-red-600'
                                    : 'border-red-300 text-red-700 hover:bg-red-50 dark:hover:bg-red-950'
                            }`}
                            onClick={() => { setType('deduct'); setCategory(''); setReason(''); }}
                        >
                            <Minus className="w-5 h-5" /> หักคะแนน
                        </Button>
                    </div>

                    {/* หมวดหมู่ */}
                    <div className="space-y-2">
                        <Label>หมวดหมู่</Label>
                        <div className="flex flex-wrap gap-2">
                            {presets.map(p => (
                                <Badge
                                    key={p.category}
                                    variant={category === p.category ? 'default' : 'outline'}
                                    className="cursor-pointer py-1.5 px-3 text-sm"
                                    onClick={() => { setCategory(p.category); setReason(''); }}
                                >
                                    {p.category}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* เหตุผลสำเร็จรูป */}
                    {categoryPreset && (
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">เหตุผลสำเร็จรูป — กดเพื่อเลือก</Label>
                            <div className="flex flex-wrap gap-2">
                                {categoryPreset.reasons.map(r => (
                                    <Badge
                                        key={r}
                                        variant={reason === r ? 'default' : 'secondary'}
                                        className="cursor-pointer py-1.5 px-3 text-sm"
                                        onClick={() => setReason(r)}
                                    >
                                        {r}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* เหตุผล (กรอกเอง) */}
                    <div className="space-y-1">
                        <Label>เหตุผล *</Label>
                        <Textarea
                            placeholder="ระบุเหตุผล..."
                            rows={2}
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            className="text-base resize-none"
                        />
                    </div>

                    {/* จำนวนคะแนน — large tap targets */}
                    <div className="space-y-2">
                        <Label>จำนวนคะแนน</Label>
                        <div className="flex items-center gap-3">
                            <Button
                                type="button" variant="outline" size="icon"
                                className="h-12 w-12 flex-shrink-0"
                                onClick={() => setScore(s => String(Math.max(1, parseInt(s) - 1)))}
                            >
                                <Minus className="w-5 h-5" />
                            </Button>
                            <Input
                                type="number" min={1} max={100}
                                className="h-12 text-center text-xl font-bold w-20"
                                value={score}
                                onChange={e => setScore(e.target.value)}
                            />
                            <Button
                                type="button" variant="outline" size="icon"
                                className="h-12 w-12 flex-shrink-0"
                                onClick={() => setScore(s => String(parseInt(s) + 1))}
                            >
                                <Plus className="w-5 h-5" />
                            </Button>
                            <span className="text-sm text-muted-foreground">คะแนน</span>
                        </div>
                    </div>

                    {/* ผู้บันทึก */}
                    <RecorderSelect label="ผู้บันทึก (ครู/ผอ.)" value={recorder} onChange={setRecorder} />

                    {/* ปีการศึกษา */}
                    <div className="space-y-1">
                        <Label>ปีการศึกษา</Label>
                        <Input className="max-w-xs" value={academicYear} onChange={e => setAcademicYear(e.target.value)} />
                    </div>

                    {/* Desktop: save button inside card */}
                    <Button
                        className={`w-full h-12 text-base gap-2 font-semibold hidden md:flex ${saveBtnClass}`}
                        onClick={handleBulkSave}
                        disabled={isSaving || selectedIds.size === 0}
                    >
                        {type === 'add' ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                        {isSaving ? 'กำลังบันทึก...' : saveLabel}
                    </Button>
                </CardContent>
            </Card>

            {/* ──────── Mobile sticky save bar (hidden on md+) ──────── */}
            <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur-md border-t p-3">
                <Button
                    className={`w-full h-14 text-base gap-2 font-semibold rounded-xl ${saveBtnClass}`}
                    onClick={handleBulkSave}
                    disabled={isSaving || selectedIds.size === 0}
                >
                    {isSaving ? (
                        'กำลังบันทึก...'
                    ) : (
                        <>
                            {type === 'add' ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                            {saveLabel}
                        </>
                    )}
                </Button>
            </div>
        </div>{/* end grid */}
        </div>{/* end outer */}
    );
}
