import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { GraduationCap, Search, Users } from 'lucide-react';
import { student360Service } from '@/services/student-360.service';
import { Student360Detail } from './Student360Detail';
import { cn } from '@/lib/utils';

type StudentRow = {
    id: string;
    student_code: string | null;
    name: string | null;
    first_name: string | null;
    last_name: string | null;
    photo_url: string | null;
    class: string | null;
    class_number: number | null;
};

const StudentDocsHub = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const studentId = searchParams.get('id');

    const [search, setSearch] = useState('');
    const [classroom, setClassroom] = useState<string>('all');
    const [classrooms, setClassrooms] = useState<string[]>([]);
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const res = await student360Service.listClassrooms();
            if (res.data) setClassrooms(res.data);
        })();
    }, []);

    useEffect(() => {
        let canceled = false;
        (async () => {
            setLoading(true);
            const res = await student360Service.listStudents({
                search: search || undefined,
                classroom: classroom === 'all' ? undefined : classroom,
            });
            if (!canceled) {
                setStudents((res.data ?? []) as StudentRow[]);
                setLoading(false);
            }
        })();
        return () => { canceled = true; };
    }, [search, classroom]);

    const counts = useMemo(() => {
        const byClass: Record<string, number> = {};
        for (const s of students) {
            const k = s.class ?? '–';
            byClass[k] = (byClass[k] ?? 0) + 1;
        }
        return { total: students.length, byClass };
    }, [students]);

    if (studentId) {
        return (
            <div className="p-6 md:p-8 max-w-screen-2xl mx-auto">
                <Student360Detail
                    studentId={studentId}
                    onBack={() => setSearchParams({})}
                />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
            <div>
                <p className="text-xs font-semibold text-primary uppercase">เอกสารนักเรียน</p>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mt-1 flex items-center gap-2">
                    <GraduationCap className="w-8 h-8 text-primary" /> ภาพรวมนักเรียน 360°
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    เลือกนักเรียน → ดูโปรไฟล์ + คะแนน + เช็คชื่อ + เยี่ยมบ้าน + SDQ + อาหาร/นม + ธนาคาร + ไฟล์แนบ ในที่เดียว
                </p>
            </div>

            <Card>
                <CardContent className="p-4 flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[220px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="ค้นหาชื่อ / รหัสนักเรียน…"
                            className="pl-9"
                        />
                    </div>
                    <Select value={classroom} onValueChange={setClassroom}>
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder="ทุกห้อง" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">ทุกห้อง</SelectItem>
                            {classrooms.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Badge variant="outline" className="text-xs">
                        <Users className="w-3 h-3 mr-1" /> {counts.total} คน
                    </Badge>
                </CardContent>
            </Card>

            {loading ? (
                <p className="text-center py-12 text-muted-foreground">กำลังโหลด…</p>
            ) : students.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        ไม่พบนักเรียนตามเงื่อนไข
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {students.map((s) => {
                        const fullName = `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() || s.name || '–';
                        return (
                            <Card
                                key={s.id}
                                onClick={() => setSearchParams({ id: s.id })}
                                className={cn(
                                    'cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md',
                                )}
                            >
                                <CardContent className="p-3 flex flex-col items-center text-center gap-2">
                                    <PersonAvatar name={fullName} photoUrl={s.photo_url} size="lg" />
                                    <div className="min-w-0 w-full">
                                        <p className="text-sm font-semibold text-foreground truncate">{fullName}</p>
                                        <div className="flex items-center justify-center gap-1 mt-1 flex-wrap">
                                            {s.class ? (
                                                <Badge variant="secondary" className="text-[10px]">{s.class}</Badge>
                                            ) : null}
                                            {s.class_number ? (
                                                <Badge variant="outline" className="text-[10px]">เลขที่ {s.class_number}</Badge>
                                            ) : null}
                                        </div>
                                        {s.student_code ? (
                                            <p className="text-[10px] text-muted-foreground mt-1 font-mono truncate">{s.student_code}</p>
                                        ) : null}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default StudentDocsHub;
export { StudentDocsHub };
