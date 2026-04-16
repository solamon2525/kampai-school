import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Save, Search, BarChart3, ClipboardList } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ===== Constants =====
const CLASS_OPTIONS = ['อ.1', 'อ.2', 'อ.3', 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6', 'ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];

const SUBJECTS = [
    'ภาษาไทย', 'คณิตศาสตร์', 'วิทยาศาสตร์', 'สังคมศึกษา',
    'ศิลปะ', 'สุขศึกษาและพลศึกษา', 'การงานอาชีพ', 'ภาษาอังกฤษ',
    'คอมพิวเตอร์', 'ดนตรี',
];

const SCORE_TYPES = ['เก็บ', 'กลางภาค', 'ปลายภาค'] as const;
type ScoreType = typeof SCORE_TYPES[number];

const currentYear = (new Date().getFullYear() + 543).toString();

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

interface ScoreRecord {
    id: string;
    student_id: string;
    subject: string;
    score_type: string;
    score: number;
    max_score: number;
    semester: string;
    academic_year: string;
    recorded_by: string | null;
    notes: string | null;
}

interface ScoreRow {
    student: Student;
    score: string;       // input value (string for controlled input)
    existingId?: string; // UUID of existing record if update
}

// ===== Helper =====
function scoreColor(score: number, maxScore: number) {
    const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
    if (pct >= 80) return 'text-green-600 font-semibold';
    if (pct >= 60) return 'text-blue-600';
    if (pct >= 50) return 'text-yellow-600';
    return 'text-red-500';
}

// ===== Main Component =====
export const ScoresManagement = () => {
    const { toast } = useToast();

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold">ระบบคะแนนเก็บ</h2>
            </div>

            <Tabs defaultValue="record">
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                    <TabsTrigger value="record" className="gap-1">
                        <ClipboardList className="w-4 h-4" /> บันทึกคะแนน
                    </TabsTrigger>
                    <TabsTrigger value="view" className="gap-1">
                        <Search className="w-4 h-4" /> ดูคะแนน
                    </TabsTrigger>
                    <TabsTrigger value="summary" className="gap-1">
                        <BarChart3 className="w-4 h-4" /> สรุปรายนักเรียน
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="record"><RecordTab toast={toast} /></TabsContent>
                <TabsContent value="view"><ViewTab /></TabsContent>
                <TabsContent value="summary"><SummaryTab /></TabsContent>
            </Tabs>
        </div>
    );
};

// ===== Tab 1: บันทึกคะแนน =====
function RecordTab({ toast }: { toast: ReturnType<typeof useToast>['toast'] }) {
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedType, setSelectedType] = useState<ScoreType>('เก็บ');
    const [maxScore, setMaxScore] = useState('100');
    const [semester, setSemester] = useState('1');
    const [academicYear, setAcademicYear] = useState(currentYear);
    const [recordedBy, setRecordedBy] = useState('');
    const [rows, setRows] = useState<ScoreRow[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // โหลดนักเรียนเมื่อเลือกห้อง
    useEffect(() => {
        if (!selectedClass) { setRows([]); return; }
        loadStudentsAndScores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClass, selectedSubject, selectedType, semester, academicYear]);

    const loadStudentsAndScores = async () => {
        setIsLoading(true);
        const { data: students, error } = await supabase
            .from('students')
            .select('id, student_code, name, class, room, class_number, gender, photo_url')
            .eq('class', selectedClass)
            .eq('is_active', true)
            .order('class_number');

        if (error) { toast({ variant: 'destructive', title: 'โหลดข้อมูลไม่สำเร็จ' }); setIsLoading(false); return; }

        // โหลดคะแนนที่บันทึกไปแล้ว (ถ้ามี subject + type เลือกแล้ว)
        let existingMap: Record<string, ScoreRecord> = {};
        if (selectedSubject && selectedType) {
            const { data: existing } = await supabase
                .from('score_records')
                .select('*')
                .eq('subject', selectedSubject)
                .eq('score_type', selectedType)
                .eq('semester', semester)
                .eq('academic_year', academicYear)
                .in('student_id', (students || []).map(s => s.id));
            (existing || []).forEach(r => { existingMap[r.student_id] = r; });
        }

        setRows((students || []).map(s => ({
            student: s as Student,
            score: existingMap[s.id] ? String(existingMap[s.id].score) : '',
            existingId: existingMap[s.id]?.id,
        })));
        setIsLoading(false);
    };

    const updateScore = (idx: number, value: string) => {
        setRows(r => r.map((row, i) => i === idx ? { ...row, score: value } : row));
    };

    const handleSave = async () => {
        if (!selectedClass || !selectedSubject || !selectedType) {
            toast({ variant: 'destructive', title: 'กรุณาเลือกห้อง วิชา และประเภทคะแนนก่อน' });
            return;
        }
        const max = parseFloat(maxScore) || 100;
        const upserts = rows
            .filter(r => r.score !== '')
            .map(r => ({
                id: r.existingId,
                student_id: r.student.id,
                subject: selectedSubject,
                score_type: selectedType,
                score: parseFloat(r.score) || 0,
                max_score: max,
                semester,
                academic_year: academicYear,
                recorded_by: recordedBy || null,
                updated_at: new Date().toISOString(),
            }));

        if (upserts.length === 0) { toast({ variant: 'destructive', title: 'ไม่มีข้อมูลคะแนน' }); return; }

        setIsSaving(true);
        const { error } = await supabase.from('score_records').upsert(upserts, { onConflict: 'student_id,subject,score_type,semester,academic_year' });
        setIsSaving(false);

        if (error) { toast({ variant: 'destructive', title: 'บันทึกไม่สำเร็จ', description: error.message }); return; }
        toast({ title: 'บันทึกคะแนนสำเร็จ', description: `${upserts.length} คน` });
        loadStudentsAndScores();
    };

    const filledCount = rows.filter(r => r.score !== '').length;

    return (
        <div className="space-y-4 pt-4">
            {/* ตัวเลือกตัวกรอง */}
            <Card>
                <CardContent className="pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <Label>ชั้น/ห้อง *</Label>
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger><SelectValue placeholder="เลือกชั้น" /></SelectTrigger>
                                <SelectContent>{CLASS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>วิชา *</Label>
                            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                                <SelectTrigger><SelectValue placeholder="เลือกวิชา" /></SelectTrigger>
                                <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>ประเภทคะแนน *</Label>
                            <Select value={selectedType} onValueChange={v => setSelectedType(v as ScoreType)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{SCORE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>คะแนนเต็ม</Label>
                            <Input type="number" min={1} max={1000} value={maxScore} onChange={e => setMaxScore(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label>ภาคเรียน</Label>
                            <Select value={semester} onValueChange={setSemester}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">ภาคเรียนที่ 1</SelectItem>
                                    <SelectItem value="2">ภาคเรียนที่ 2</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>ปีการศึกษา</Label>
                            <Input placeholder={currentYear} value={academicYear} onChange={e => setAcademicYear(e.target.value)} />
                        </div>
                    </div>
                    <div className="mt-3">
                        <Label>ผู้บันทึก (ชื่อครู)</Label>
                        <Input className="mt-1 max-w-xs" placeholder="ชื่อครูผู้บันทึก" value={recordedBy} onChange={e => setRecordedBy(e.target.value)} />
                    </div>
                </CardContent>
            </Card>

            {/* ตารางกรอกคะแนน */}
            {selectedClass && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">
                                กรอกคะแนน — {selectedClass}
                                {selectedSubject && ` · ${selectedSubject}`}
                                {selectedType && ` (${selectedType})`}
                                {' '}<span className="text-muted-foreground font-normal text-sm">/ {maxScore} คะแนน</span>
                            </CardTitle>
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground">{filledCount}/{rows.length} คน</span>
                                <Button onClick={handleSave} disabled={isSaving || !selectedSubject} className="gap-1">
                                    <Save className="w-4 h-4" />
                                    {isSaving ? 'กำลังบันทึก...' : 'บันทึกทั้งหมด'}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <p className="text-center py-8 text-muted-foreground">กำลังโหลด...</p>
                        ) : rows.length === 0 ? (
                            <p className="text-center py-8 text-muted-foreground">ไม่มีนักเรียนในชั้นนี้</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="text-left px-3 py-2 w-10">#</th>
                                            <th className="text-left px-3 py-2">ชื่อ-นามสกุล</th>
                                            <th className="text-left px-3 py-2 w-20">เลขที่</th>
                                            <th className="text-center px-3 py-2 w-32">
                                                คะแนน
                                                <span className="text-muted-foreground font-normal"> /{maxScore}</span>
                                            </th>
                                            <th className="text-center px-3 py-2 w-20">%</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row, idx) => {
                                            const scoreNum = parseFloat(row.score);
                                            const max = parseFloat(maxScore) || 100;
                                            const pct = !isNaN(scoreNum) && max > 0 ? ((scoreNum / max) * 100).toFixed(1) : '—';
                                            return (
                                                <tr key={row.student.id} className={idx % 2 === 0 ? '' : 'bg-muted/20'}>
                                                    <td className="px-3 py-1.5 text-muted-foreground text-xs">{idx + 1}</td>
                                                    <td className="px-3 py-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className={`w-2 h-2 rounded-full flex-shrink-0 ${row.student.gender === 'male' ? 'bg-blue-400' : 'bg-pink-400'}`}
                                                            />
                                                            <span>{row.student.name}</span>
                                                            {row.existingId && <Badge variant="outline" className="text-xs h-4 px-1">มีข้อมูล</Badge>}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-1.5 text-center text-muted-foreground">
                                                        {row.student.class_number ?? '—'}
                                                    </td>
                                                    <td className="px-3 py-1.5">
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            max={maxScore}
                                                            step="0.5"
                                                            className="h-8 text-center w-24 mx-auto"
                                                            placeholder="—"
                                                            value={row.score}
                                                            onChange={e => updateScore(idx, e.target.value)}
                                                        />
                                                    </td>
                                                    <td className={`px-3 py-1.5 text-center text-sm ${!isNaN(scoreNum) ? scoreColor(scoreNum, max) : 'text-muted-foreground'}`}>
                                                        {pct}{!isNaN(scoreNum) ? '%' : ''}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// ===== Tab 2: ดูคะแนน =====
function ViewTab() {
    const [filterClass, setFilterClass] = useState('');
    const [filterSubject, setFilterSubject] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterSemester, setFilterSemester] = useState('1');
    const [filterYear, setFilterYear] = useState(currentYear);
    const [records, setRecords] = useState<(ScoreRecord & { students: { name: string; class: string; class_number: number | null } | null })[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadRecords = async () => {
        setIsLoading(true);
        let q = supabase
            .from('score_records')
            .select('*, students(name, class, class_number)')
            .eq('semester', filterSemester)
            .eq('academic_year', filterYear)
            .order('subject')
            .order('score_type');

        if (filterSubject) q = q.eq('subject', filterSubject);
        if (filterType) q = q.eq('score_type', filterType);

        const { data, error } = await q;
        if (!error) {
            let result = (data || []) as typeof records;
            if (filterClass) result = result.filter(r => r.students?.class === filterClass);
            setRecords(result);
        }
        setIsLoading(false);
    };

    useEffect(() => { loadRecords(); }, [filterClass, filterSubject, filterType, filterSemester, filterYear]);

    const avgScore = useMemo(() => {
        if (records.length === 0) return null;
        const sum = records.reduce((a, r) => a + r.score, 0);
        return (sum / records.length).toFixed(2);
    }, [records]);

    return (
        <div className="space-y-4 pt-4">
            <Card>
                <CardContent className="pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <Select value={filterClass} onValueChange={setFilterClass}>
                            <SelectTrigger><SelectValue placeholder="ทุกชั้น" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">ทุกชั้น</SelectItem>
                                {CLASS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filterSubject} onValueChange={setFilterSubject}>
                            <SelectTrigger><SelectValue placeholder="ทุกวิชา" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">ทุกวิชา</SelectItem>
                                {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger><SelectValue placeholder="ทุกประเภท" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">ทุกประเภท</SelectItem>
                                {SCORE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filterSemester} onValueChange={setFilterSemester}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">ภาคเรียน 1</SelectItem>
                                <SelectItem value="2">ภาคเรียน 2</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input placeholder={`ปี (เช่น ${currentYear})`} value={filterYear} onChange={e => setFilterYear(e.target.value)} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                        <span>รายการคะแนน ({records.length} รายการ)</span>
                        {avgScore && <Badge variant="outline">เฉลี่ย {avgScore} คะแนน</Badge>}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p className="text-center py-8 text-muted-foreground">กำลังโหลด...</p>
                    ) : records.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">ไม่มีข้อมูลคะแนน</p>
                    ) : (
                        <div className="overflow-x-auto rounded-md border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="text-left px-3 py-2">ชื่อนักเรียน</th>
                                        <th className="text-left px-3 py-2">ชั้น</th>
                                        <th className="text-left px-3 py-2">วิชา</th>
                                        <th className="text-left px-3 py-2">ประเภท</th>
                                        <th className="text-center px-3 py-2">คะแนน</th>
                                        <th className="text-center px-3 py-2">%</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((r, i) => {
                                        const pct = r.max_score > 0 ? ((r.score / r.max_score) * 100).toFixed(1) : '—';
                                        return (
                                            <tr key={r.id} className={i % 2 === 0 ? '' : 'bg-muted/20'}>
                                                <td className="px-3 py-2">{r.students?.name ?? '—'}</td>
                                                <td className="px-3 py-2">{r.students?.class ?? '—'}</td>
                                                <td className="px-3 py-2">{r.subject}</td>
                                                <td className="px-3 py-2">
                                                    <Badge variant={r.score_type === 'ปลายภาค' ? 'default' : r.score_type === 'กลางภาค' ? 'secondary' : 'outline'}>
                                                        {r.score_type}
                                                    </Badge>
                                                </td>
                                                <td className={`px-3 py-2 text-center font-mono ${scoreColor(r.score, r.max_score)}`}>
                                                    {r.score} / {r.max_score}
                                                </td>
                                                <td className={`px-3 py-2 text-center ${scoreColor(r.score, r.max_score)}`}>{pct}%</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ===== Tab 3: สรุปรายนักเรียน =====
function SummaryTab() {
    const [filterClass, setFilterClass] = useState('');
    const [filterSemester, setFilterSemester] = useState('1');
    const [filterYear, setFilterYear] = useState(currentYear);
    const [searchName, setSearchName] = useState('');
    const [allRecords, setAllRecords] = useState<(ScoreRecord & { students: { id: string; name: string; class: string; class_number: number | null } | null })[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadAll = async () => {
        setIsLoading(true);
        const { data } = await supabase
            .from('score_records')
            .select('*, students(id, name, class, class_number)')
            .eq('semester', filterSemester)
            .eq('academic_year', filterYear)
            .order('subject');
        setAllRecords((data || []) as typeof allRecords);
        setIsLoading(false);
    };

    useEffect(() => { loadAll(); }, [filterClass, filterSemester, filterYear]);

    // จัดกลุ่มตามนักเรียน
    const studentSummary = useMemo(() => {
        const filtered = allRecords.filter(r => {
            if (filterClass && r.students?.class !== filterClass) return false;
            if (searchName && !(r.students?.name || '').includes(searchName)) return false;
            return true;
        });

        const map: Record<string, {
            id: string; name: string; class: string; classNumber: number | null;
            subjects: Record<string, { เก็บ?: number; กลางภาค?: number; ปลายภาค?: number; max: number }>;
        }> = {};

        filtered.forEach(r => {
            if (!r.students) return;
            const sid = r.students.id;
            if (!map[sid]) map[sid] = { id: sid, name: r.students.name, class: r.students.class, classNumber: r.students.class_number, subjects: {} };
            if (!map[sid].subjects[r.subject]) map[sid].subjects[r.subject] = { max: r.max_score };
            map[sid].subjects[r.subject][r.score_type as 'เก็บ' | 'กลางภาค' | 'ปลายภาค'] = r.score;
        });

        return Object.values(map).sort((a, b) => {
            if (a.class !== b.class) return a.class.localeCompare(b.class);
            return (a.classNumber ?? 99) - (b.classNumber ?? 99);
        });
    }, [allRecords, filterClass, searchName]);

    const allSubjects = useMemo(() => {
        const set = new Set<string>();
        studentSummary.forEach(s => Object.keys(s.subjects).forEach(sub => set.add(sub)));
        return Array.from(set).sort();
    }, [studentSummary]);

    return (
        <div className="space-y-4 pt-4">
            <Card>
                <CardContent className="pt-4">
                    <div className="flex flex-wrap gap-3">
                        <Select value={filterClass} onValueChange={setFilterClass}>
                            <SelectTrigger className="w-36"><SelectValue placeholder="ทุกชั้น" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">ทุกชั้น</SelectItem>
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
                        <Input className="w-28" placeholder={currentYear} value={filterYear} onChange={e => setFilterYear(e.target.value)} />
                        <div className="relative flex-1 min-w-40">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input className="pl-9" placeholder="ค้นหาชื่อ..." value={searchName} onChange={e => setSearchName(e.target.value)} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{studentSummary.length} นักเรียน · {allSubjects.length} วิชา</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p className="text-center py-8 text-muted-foreground">กำลังโหลด...</p>
                    ) : studentSummary.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">ไม่มีข้อมูลคะแนน</p>
                    ) : (
                        <div className="overflow-x-auto rounded-md border">
                            <table className="text-sm w-max min-w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="sticky left-0 bg-muted/80 text-left px-3 py-2 z-10">ชื่อ-นามสกุล</th>
                                        <th className="text-center px-2 py-2 whitespace-nowrap">ชั้น</th>
                                        <th className="text-center px-2 py-2 whitespace-nowrap">เลขที่</th>
                                        {allSubjects.map(sub => (
                                            <th key={sub} className="text-center px-2 py-2 whitespace-nowrap min-w-24">{sub}</th>
                                        ))}
                                    </tr>
                                    <tr className="text-xs text-muted-foreground border-b">
                                        <th className="sticky left-0 bg-background" />
                                        <th /><th />
                                        {allSubjects.map(sub => (
                                            <th key={sub} className="px-2 pb-1 text-center">
                                                <span className="mr-1">เก็บ</span>
                                                <span className="mr-1">กลาง</span>
                                                <span>ปลาย</span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentSummary.map((s, i) => (
                                        <tr key={s.id} className={i % 2 === 0 ? '' : 'bg-muted/20'}>
                                            <td className="sticky left-0 bg-inherit px-3 py-2 font-medium whitespace-nowrap">{s.name}</td>
                                            <td className="px-2 py-2 text-center">{s.class}</td>
                                            <td className="px-2 py-2 text-center text-muted-foreground">{s.classNumber ?? '—'}</td>
                                            {allSubjects.map(sub => {
                                                const data = s.subjects[sub];
                                                return (
                                                    <td key={sub} className="px-2 py-2 text-center">
                                                        {data ? (
                                                            <div className="flex gap-1 justify-center text-xs font-mono">
                                                                <span className={data.เก็บ !== undefined ? scoreColor(data.เก็บ, data.max) : 'text-muted-foreground'}>
                                                                    {data.เก็บ ?? '—'}
                                                                </span>
                                                                <span className="text-muted-foreground">/</span>
                                                                <span className={data.กลางภาค !== undefined ? scoreColor(data.กลางภาค, data.max) : 'text-muted-foreground'}>
                                                                    {data.กลางภาค ?? '—'}
                                                                </span>
                                                                <span className="text-muted-foreground">/</span>
                                                                <span className={data.ปลายภาค !== undefined ? scoreColor(data.ปลายภาค, data.max) : 'text-muted-foreground'}>
                                                                    {data.ปลายภาค ?? '—'}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs">—</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
