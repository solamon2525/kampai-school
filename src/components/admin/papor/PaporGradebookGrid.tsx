import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { useToast } from '@/hooks/use-toast';
import { Save, BookOpen, Calculator, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';
import { scoreToGrade } from '@/services/papor-evaluation.service';

const DEFAULT_SUBJECTS = [
  { code: 'ท15101', name: 'ภาษาไทย', maxF: 70, maxS: 30, weight: 5 },
  { code: 'ค15101', name: 'คณิตศาสตร์', maxF: 70, maxS: 30, weight: 5 },
  { code: 'ว15101', name: 'วิทยาศาสตร์และเทคโนโลยี', maxF: 70, maxS: 30, weight: 2 },
  { code: 'ส15101', name: 'สังคมศึกษาศาสนาและวัฒนธรรม', maxF: 70, maxS: 30, weight: 2 },
  { code: 'ส15102', name: 'ประวัติศาสตร์', maxF: 70, maxS: 30, weight: 1 },
  { code: 'พ15101', name: 'สุขศึกษาและพลศึกษา', maxF: 80, maxS: 20, weight: 1 },
  { code: 'ศ15101', name: 'ศิลปะ', maxF: 80, maxS: 20, weight: 1 },
  { code: 'ง15101', name: 'การงานอาชีพ', maxF: 80, maxS: 20, weight: 1 },
  { code: 'อ15101', name: 'ภาษาอังกฤษ', maxF: 80, maxS: 20, weight: 3 },
  { code: 'อ15201', name: 'ภาษาอังกฤษเพื่อการสื่อสาร', maxF: 80, maxS: 20, weight: 2 },
  { code: 'ส15201', name: 'ต้านทุจริตศึกษา', maxF: 80, maxS: 20, weight: 1 },
];

interface StudentItem {
  id: string;
  name: string;
  student_code: string | null;
  class_number: number | null;
  photo_url: string | null;
}

interface GradeRow {
  student: StudentItem;
  formativeT1: number;
  summativeT1: number;
  formativeT2: number;
  summativeT2: number;
  totalT1: number;
  totalT2: number;
  yearlyTotal: number;
  grade: string;
}

interface Props {
  selectedClass?: string;
  academicYear?: string;
}

export const PaporGradebookGrid: React.FC<Props> = ({
  selectedClass = 'ป.5',
  academicYear = '2568',
}) => {
  const { toast } = useToast();
  const [selectedSubject, setSelectedSubject] = useState(DEFAULT_SUBJECTS[0].code);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [rows, setRows] = useState<GradeRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const currentSubject = DEFAULT_SUBJECTS.find(s => s.code === selectedSubject) || DEFAULT_SUBJECTS[0];

  // Load students and scores
  useEffect(() => {
    loadClassData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedSubject, academicYear]);

  const loadClassData = async () => {
    setIsLoading(true);
    try {
      // 1. Get students for class or top students if filtered
      const { data: stList } = await supabase
        .from('students')
        .select('id, name, student_code, class_number, photo_url')
        .eq('is_active', true)
        .order('class_number', { ascending: true });

      // If specific class has students, filter by it, else show active students
      const filteredStudents = stList || [];
      setStudents(filteredStudents);

      if (filteredStudents.length === 0) {
        setRows([]);
        setIsLoading(false);
        return;
      }

      // 2. Fetch existing scores for current subject and academic year
      const sIds = filteredStudents.map(s => s.id);
      const { data: existingScores } = await supabase
        .from('score_records')
        .select('*')
        .eq('academic_year', academicYear)
        .eq('subject', currentSubject.name)
        .in('student_id', sIds);

      const scoreMap: Record<string, Record<string, number>> = {};
      existingScores?.forEach(sc => {
        if (!scoreMap[sc.student_id]) scoreMap[sc.student_id] = {};
        scoreMap[sc.student_id][`${sc.semester}_${sc.score_type}`] = sc.score;
      });

      // 3. Construct rows
      const initialRows: GradeRow[] = filteredStudents.map(st => {
        const sData = scoreMap[st.id] || {};
        const f1 = sData['1_ระหว่างเรียน_T1'] ?? 0;
        const s1 = sData['1_ปลายภาค_T1'] ?? 0;
        const f2 = sData['2_ระหว่างเรียน_T2'] ?? 0;
        const s2 = sData['2_ปลายภาค_T2'] ?? 0;

        const t1 = f1 + s1;
        const t2 = f2 + s2;
        const yearly = Math.round((t1 + t2) / 2);
        const grade = scoreToGrade(yearly > 0 ? yearly : t1 || t2);

        return {
          student: st,
          formativeT1: f1,
          summativeT1: s1,
          formativeT2: f2,
          summativeT2: s2,
          totalT1: t1,
          totalT2: t2,
          yearlyTotal: yearly,
          grade,
        };
      });

      setRows(initialRows);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดคะแนน';
      toast({
        variant: 'destructive',
        title: 'โหลดข้อมูลคะแนนไม่สำเร็จ',
        description: msg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cell input change
  const handleScoreChange = (
    index: number,
    field: 'formativeT1' | 'summativeT1' | 'formativeT2' | 'summativeT2',
    val: string
  ) => {
    const num = Math.max(0, Math.min(100, Number(val) || 0));
    setRows(prev => {
      const next = [...prev];
      const cur = { ...next[index], [field]: num };
      cur.totalT1 = cur.formativeT1 + cur.summativeT1;
      cur.totalT2 = cur.formativeT2 + cur.summativeT2;
      cur.yearlyTotal = Math.round((cur.totalT1 + cur.totalT2) / 2);
      cur.grade = scoreToGrade(cur.yearlyTotal > 0 ? cur.yearlyTotal : cur.totalT1 || cur.totalT2);
      next[index] = cur;
      return next;
    });
  };

  // Save changes
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const upsertRows: TablesInsert<'score_records'>[] = [];
      for (const row of rows) {
        // T1
        upsertRows.push({
          student_id: row.student.id,
          subject: currentSubject.name,
          score_type: 'ระหว่างเรียน_T1',
          score: row.formativeT1,
          max_score: currentSubject.maxF,
          semester: '1',
          academic_year: academicYear,
          notes: `รหัส ${currentSubject.code}`,
        });
        upsertRows.push({
          student_id: row.student.id,
          subject: currentSubject.name,
          score_type: 'ปลายภาค_T1',
          score: row.summativeT1,
          max_score: currentSubject.maxS,
          semester: '1',
          academic_year: academicYear,
          notes: `รหัส ${currentSubject.code}`,
        });
        // T2
        upsertRows.push({
          student_id: row.student.id,
          subject: currentSubject.name,
          score_type: 'ระหว่างเรียน_T2',
          score: row.formativeT2,
          max_score: currentSubject.maxF,
          semester: '2',
          academic_year: academicYear,
          notes: `รหัส ${currentSubject.code}`,
        });
        upsertRows.push({
          student_id: row.student.id,
          subject: currentSubject.name,
          score_type: 'ปลายภาค_T2',
          score: row.summativeT2,
          max_score: currentSubject.maxS,
          semester: '2',
          academic_year: academicYear,
          notes: `รหัส ${currentSubject.code}`,
        });
        // Yearly
        upsertRows.push({
          student_id: row.student.id,
          subject: currentSubject.name,
          score_type: 'รวมทั้งปี',
          score: row.yearlyTotal,
          max_score: 100,
          semester: 'all',
          academic_year: academicYear,
          notes: `เกรด ${row.grade}`,
        });
      }

      await supabase.from('score_records').upsert(upsertRows, {
        onConflict: 'student_id,subject,score_type,semester,academic_year',
      });

      toast({
        title: 'บันทึกคะแนนสำเร็จ',
        description: `บันทึกคะแนนวิชา ${currentSubject.name} จำนวน ${rows.length} คน เรียบร้อยแล้ว`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึก';
      toast({
        variant: 'destructive',
        title: 'บันทึกไม่สำเร็จ',
        description: msg,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="bg-card">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <span>สมุดบันทึกคะแนนรายวิชา (Online Gradebook)</span>
            </CardTitle>
            <CardDescription>
              บันทึกคะแนนระหว่างเรียนและปลายภาค คำนวณคะแนนรวมและตัดเกรดอัตโนมัติ (สพฐ.)
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Subject Selector */}
            <div className="w-64">
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกรายวิชา" />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_SUBJECTS.map(s => (
                    <SelectItem key={s.code} value={s.code}>
                      {s.code} {s.name} ({s.maxF}:{s.maxS})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSaveAll} disabled={isSaving || rows.length === 0}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกคะแนนทั้งหมด'}
            </Button>
          </div>
        </div>

        {/* Info Pill */}
        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-muted-foreground">
          <Badge variant="outline">รหัสวิชา: {currentSubject.code}</Badge>
          <Badge variant="outline">สัดส่วนคะแนน: {currentSubject.maxF} : {currentSubject.maxS}</Badge>
          <Badge variant="outline">น้ำหนัก/หน่วยกิต: {currentSubject.weight} หน่วย</Badge>
          <Badge variant="outline">ปีการศึกษา: {academicYear}</Badge>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">กำลังโหลดข้อมูล...</div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">ไม่พบข้อมูลนักเรียนในห้องนี้</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                  <th rowSpan={2} className="py-2.5 px-3 text-center w-12 border-r border-border">เลขที่</th>
                  <th rowSpan={2} className="py-2.5 px-3 text-left border-r border-border min-w-[200px]">นักเรียน</th>
                  <th colSpan={3} className="py-1.5 px-2 text-center border-r border-border bg-blue-500/5">
                    ภาคเรียนที่ 1 ({currentSubject.maxF + currentSubject.maxS})
                  </th>
                  <th colSpan={3} className="py-1.5 px-2 text-center border-r border-border bg-emerald-500/5">
                    ภาคเรียนที่ 2 ({currentSubject.maxF + currentSubject.maxS})
                  </th>
                  <th colSpan={2} className="py-1.5 px-2 text-center bg-amber-500/5">
                    สรุปทั้งปี (100)
                  </th>
                </tr>
                <tr className="border-b border-border text-xs text-muted-foreground bg-muted/20">
                  <th className="py-1.5 px-2 text-center w-20">ระหว่าง ({currentSubject.maxF})</th>
                  <th className="py-1.5 px-2 text-center w-20">ปลายภาค ({currentSubject.maxS})</th>
                  <th className="py-1.5 px-2 text-center w-16 border-r border-border font-bold">รวม</th>
                  <th className="py-1.5 px-2 text-center w-20">ระหว่าง ({currentSubject.maxF})</th>
                  <th className="py-1.5 px-2 text-center w-20">ปลายภาค ({currentSubject.maxS})</th>
                  <th className="py-1.5 px-2 text-center w-16 border-r border-border font-bold">รวม</th>
                  <th className="py-1.5 px-2 text-center w-20 font-bold">คะแนนรวม</th>
                  <th className="py-1.5 px-2 text-center w-16 font-bold">เกรด</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.student.id} className="border-b border-border hover:bg-muted/10 transition-colors">
                    <td className="py-2 px-3 text-center font-medium border-r border-border">
                      {row.student.class_number || idx + 1}
                    </td>
                    <td className="py-2 px-3 border-r border-border">
                      <div className="flex items-center gap-2">
                        <PersonAvatar name={row.student.name} photoUrl={row.student.photo_url} className="w-7 h-7 text-xs" />
                        <div>
                          <div className="font-medium">{row.student.name}</div>
                          <div className="text-[11px] text-muted-foreground">รหัส: {row.student.student_code || '-'}</div>
                        </div>
                      </div>
                    </td>

                    {/* Term 1 Inputs */}
                    <td className="py-1.5 px-2 text-center">
                      <Input
                        type="number"
                        min={0}
                        max={currentSubject.maxF}
                        value={row.formativeT1 || ''}
                        onChange={e => handleScoreChange(idx, 'formativeT1', e.target.value)}
                        className="h-8 text-center text-sm w-16 mx-auto"
                      />
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      <Input
                        type="number"
                        min={0}
                        max={currentSubject.maxS}
                        value={row.summativeT1 || ''}
                        onChange={e => handleScoreChange(idx, 'summativeT1', e.target.value)}
                        className="h-8 text-center text-sm w-16 mx-auto"
                      />
                    </td>
                    <td className="py-1.5 px-2 text-center font-bold border-r border-border text-blue-600 bg-blue-500/5">
                      {row.totalT1}
                    </td>

                    {/* Term 2 Inputs */}
                    <td className="py-1.5 px-2 text-center">
                      <Input
                        type="number"
                        min={0}
                        max={currentSubject.maxF}
                        value={row.formativeT2 || ''}
                        onChange={e => handleScoreChange(idx, 'formativeT2', e.target.value)}
                        className="h-8 text-center text-sm w-16 mx-auto"
                      />
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      <Input
                        type="number"
                        min={0}
                        max={currentSubject.maxS}
                        value={row.summativeT2 || ''}
                        onChange={e => handleScoreChange(idx, 'summativeT2', e.target.value)}
                        className="h-8 text-center text-sm w-16 mx-auto"
                      />
                    </td>
                    <td className="py-1.5 px-2 text-center font-bold border-r border-border text-emerald-600 bg-emerald-500/5">
                      {row.totalT2}
                    </td>

                    {/* Yearly Summary & Grade */}
                    <td className="py-1.5 px-2 text-center font-bold text-base bg-amber-500/5">
                      {row.yearlyTotal}
                    </td>
                    <td className="py-1.5 px-2 text-center bg-amber-500/5">
                      <Badge
                        variant="default"
                        className={
                          row.grade === '4'
                            ? 'bg-emerald-600 text-white font-bold'
                            : row.grade === '3.5' || row.grade === '3'
                            ? 'bg-blue-600 text-white font-bold'
                            : row.grade === '0'
                            ? 'bg-red-600 text-white font-bold'
                            : 'bg-amber-600 text-white font-bold'
                        }
                      >
                        {row.grade}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
