/**
 * PaporEvaluationsManager.tsx
 * แผงประเมินผลการเรียนรู้ 4 มิติตามหลักสูตรแกนกลาง สพฐ.
 * - คุณลักษณะอันพึงประสงค์ 8 ประการ
 * - สมรรถนะสำคัญของผู้เรียน 5 ด้าน
 * - การอ่าน คิดวิเคราะห์ และเขียน 5 ตัวชี้วัด
 * - กิจกรรมพัฒนาผู้เรียน 4 กิจกรรม
 * สถาปัตยกรรมระดับ Production (paporGradebookService + TanStack Query)
 */
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { toast } from 'sonner';
import { Save, Sparkles, Award, Heart, BookOpenCheck, Compass, Loader2 } from 'lucide-react';
import type { TablesInsert } from '@/integrations/supabase/types';
import { levelToShort } from '@/services/papor-evaluation.service';
import {
  paporGradebookService,
  paporDraftManager,
  type GradebookStudent,
} from '@/services/papor-gradebook.service';

interface Props {
  selectedClass?: string;
  academicYear?: string;
}

const COMPETENCY_LABELS = [
  '1. การสื่อสาร',
  '2. การคิด',
  '3. การแก้ปัญหา',
  '4. ทักษะชีวิต',
  '5. การใช้เทคโนโลยี',
];

const CHARACTER_LABELS = [
  '1. รักชาติ ศาสน์ กษัตริย์',
  '2. ซื่อสัตย์สุจริต',
  '3. มีวินัย',
  '4. ใฝ่เรียนรู้',
  '5. อยู่อย่างพอเพียง',
  '6. มุ่งมั่นในการทำงาน',
  '7. รักความเป็นไทย',
  '8. มีจิตสาธารณะ',
];

const READING_LABELS = [
  '1. อ่านและจับใจความ',
  '2. สรุปประเด็นสำคัญ',
  '3. วิเคราะห์เนื้อหา',
  '4. ประเมินคุณค่า',
  '5. ถ่ายทอดและเขียนสื่อความ',
];

export const PaporEvaluationsManager: React.FC<Props> = ({
  selectedClass = 'ป.5',
  academicYear = '2569',
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'competency' | 'character' | 'reading' | 'activity'>('competency');

  // States for each dimension
  const [compScores, setCompScores] = useState<Record<string, number[]>>({});
  const [charScores, setCharScores] = useState<Record<string, number[]>>({});
  const [readScores, setReadScores] = useState<Record<string, number[]>>({});
  const [actScores, setActScores] = useState<Record<string, { guidance: string; scout: string; club: string; social: string }>>({});

  // 1. Fetch Students
  const { data: students = [], isLoading: loadingStudents } = useQuery<GradebookStudent[]>({
    queryKey: ['papor-students', selectedClass],
    queryFn: () => paporGradebookService.getStudentsInClass(selectedClass),
    staleTime: 60_000,
  });

  const studentIds = students.map((s) => s.id);

  // 2. Fetch Existing Evaluations
  const { data: rawEvals = [], isLoading: loadingEvals } = useQuery({
    queryKey: ['papor-evaluations', selectedClass, academicYear],
    enabled: studentIds.length > 0,
    queryFn: () => paporGradebookService.getEvaluationsForClass(academicYear, studentIds),
    staleTime: 30_000,
  });

  // Draft Key
  const draftKey = `evals_${academicYear}_${selectedClass}_${activeTab}`;

  // Populate data when students or rawEvals change
  useEffect(() => {
    if (students.length === 0) return;

    const compMap: Record<string, number[]> = {};
    const charMap: Record<string, number[]> = {};
    const readMap: Record<string, number[]> = {};
    const actMap: Record<string, { guidance: string; scout: string; club: string; social: string }> = {};

    students.forEach((st) => {
      compMap[st.id] = [3, 3, 3, 3, 3];
      charMap[st.id] = [3, 3, 3, 3, 3, 3, 3, 3];
      readMap[st.id] = [3, 3, 3, 3, 3];
      actMap[st.id] = { guidance: 'ผ', scout: 'ผ', club: 'ผ', social: 'ผ' };
    });

    rawEvals.forEach((ev) => {
      const sId = ev.student_id;
      const itemIdx = (Number(ev.item_key) || 1) - 1;
      const sc = Number(ev.score) || 3;

      if (ev.evaluation_type === 'competency') {
        if (compMap[sId] && itemIdx >= 0 && itemIdx < 5) compMap[sId][itemIdx] = sc;
      } else if (ev.evaluation_type === 'character') {
        if (charMap[sId] && itemIdx >= 0 && itemIdx < 8) charMap[sId][itemIdx] = sc;
      } else if (ev.evaluation_type === 'reading_thinking' || ev.evaluation_type === 'reading') {
        if (readMap[sId] && itemIdx >= 0 && itemIdx < 5) readMap[sId][itemIdx] = sc;
      } else if (ev.evaluation_type === 'activity') {
        if (actMap[sId]) {
          const key = ev.category_key as keyof typeof actMap[string];
          if (actMap[sId][key] !== undefined) actMap[sId][key] = ev.status || 'ผ';
        }
      }
    });

    setCompScores(compMap);
    setCharScores(charMap);
    setReadScores(readMap);
    setActScores(actMap);
  }, [students, rawEvals]);

  // Quick fill all with uniform score
  const handleQuickFillAll = (dimension: 'competency' | 'character' | 'reading', val: number) => {
    if (dimension === 'competency') {
      const next = { ...compScores };
      students.forEach((s) => { next[s.id] = [val, val, val, val, val]; });
      setCompScores(next);
      paporDraftManager.saveDraft(draftKey, next);
    } else if (dimension === 'character') {
      const next = { ...charScores };
      students.forEach((s) => { next[s.id] = [val, val, val, val, val, val, val, val]; });
      setCharScores(next);
      paporDraftManager.saveDraft(draftKey, next);
    } else if (dimension === 'reading') {
      const next = { ...readScores };
      students.forEach((s) => { next[s.id] = [val, val, val, val, val]; });
      setReadScores(next);
      paporDraftManager.saveDraft(draftKey, next);
    }
    toast.success(`ปรับคะแนนทุกคนเป็น ${val === 3 ? 'ดีเยี่ยม (3)' : val === 2 ? 'ดี (2)' : 'ผ่าน (1)'} เรียบร้อย`);
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const rows: TablesInsert<'student_obec_evaluations'>[] = [];
      const promoUpdates: Array<{
        student_id: string;
        competency_grade?: string;
        character_grade?: string;
        reading_grade?: string;
        activities_status?: boolean;
      }> = [];

      if (activeTab === 'competency') {
        const compKeys = ['communication', 'thinking', 'problem_solving', 'life_skills', 'technology'];
        students.forEach((s) => {
          const scores = compScores[s.id] || [3, 3, 3, 3, 3];
          const avg = scores.reduce((sum, v) => sum + v, 0) / scores.length;
          const summaryGrade = levelToShort(Math.round(avg));

          scores.forEach((sc, idx) => {
            rows.push({
              student_id: s.id,
              academic_year: academicYear,
              semester: 'all',
              evaluation_type: 'competency',
              category_key: compKeys[idx],
              item_key: String(idx + 1),
              score: sc,
              status: levelToShort(sc),
              notes: summaryGrade,
            });
          });

          // Summary row for student_obec_evaluations
          rows.push({
            student_id: s.id,
            academic_year: academicYear,
            semester: 'all',
            evaluation_type: 'competency',
            category_key: 'summary',
            item_key: null,
            score: Math.round(avg),
            status: summaryGrade,
            notes: summaryGrade,
          });

          promoUpdates.push({
            student_id: s.id,
            competency_grade: summaryGrade,
          });
        });
      } else if (activeTab === 'character') {
        students.forEach((s) => {
          const scores = charScores[s.id] || [3, 3, 3, 3, 3, 3, 3, 3];
          const avg = scores.reduce((sum, v) => sum + v, 0) / scores.length;
          const summaryGrade = levelToShort(Math.round(avg));

          scores.forEach((sc, idx) => {
            rows.push({
              student_id: s.id,
              academic_year: academicYear,
              semester: 'all',
              evaluation_type: 'character',
              category_key: `c${idx + 1}`,
              item_key: String(idx + 1),
              score: sc,
              status: levelToShort(sc),
              notes: summaryGrade,
            });
          });

          // Summary row for student_obec_evaluations
          rows.push({
            student_id: s.id,
            academic_year: academicYear,
            semester: 'all',
            evaluation_type: 'character',
            category_key: 'summary',
            item_key: null,
            score: Math.round(avg),
            status: summaryGrade,
            notes: summaryGrade,
          });

          promoUpdates.push({
            student_id: s.id,
            character_grade: summaryGrade,
          });
        });
      } else if (activeTab === 'reading') {
        students.forEach((s) => {
          const scores = readScores[s.id] || [3, 3, 3, 3, 3];
          const avg = scores.reduce((sum, v) => sum + v, 0) / scores.length;
          const summaryGrade = levelToShort(Math.round(avg));

          scores.forEach((sc, idx) => {
            rows.push({
              student_id: s.id,
              academic_year: academicYear,
              semester: 'all',
              evaluation_type: 'reading_thinking',
              category_key: idx < 2 ? 'reading' : idx < 4 ? 'thinking' : 'writing',
              item_key: String(idx + 1),
              score: sc,
              status: levelToShort(sc),
              notes: summaryGrade,
            });
          });

          // Summary row for student_obec_evaluations
          rows.push({
            student_id: s.id,
            academic_year: academicYear,
            semester: 'all',
            evaluation_type: 'reading_thinking',
            category_key: 'summary',
            item_key: null,
            score: Math.round(avg),
            status: summaryGrade,
            notes: summaryGrade,
          });

          promoUpdates.push({
            student_id: s.id,
            reading_grade: summaryGrade,
          });
        });
      } else if (activeTab === 'activity') {
        students.forEach((s) => {
          const acts = actScores[s.id] || { guidance: 'ผ', scout: 'ผ', club: 'ผ', social: 'ผ' };
          const allPass = acts.guidance === 'ผ' && acts.scout === 'ผ' && acts.club === 'ผ' && acts.social === 'ผ';

          ['guidance', 'scout', 'club', 'social'].forEach((k) => {
            rows.push({
              student_id: s.id,
              academic_year: academicYear,
              semester: 'all',
              evaluation_type: 'activity',
              category_key: k,
              item_key: null,
              score: 40,
              status: acts[k as keyof typeof acts] || 'ผ',
              notes: 'ผ่าน',
            });
          });

          // Summary row for student_obec_evaluations
          rows.push({
            student_id: s.id,
            academic_year: academicYear,
            semester: 'all',
            evaluation_type: 'activity',
            category_key: 'summary',
            item_key: null,
            score: 120,
            status: allPass ? 'ผ' : 'มผ',
            notes: allPass ? 'ผ่าน' : 'ไม่ผ่าน',
          });

          promoUpdates.push({
            student_id: s.id,
            activities_status: allPass,
          });
        });
      }

      await Promise.all([
        paporGradebookService.saveEvaluationsBatch(rows),
        paporGradebookService.syncDimensionToPromotions(academicYear, promoUpdates),
      ]);
    },
    onSuccess: () => {
      toast.success('บันทึกผลการประเมินและซิงค์การเลื่อนชั้นเรียบร้อยแล้ว');
      paporDraftManager.clearDraft(draftKey);
      queryClient.invalidateQueries({ queryKey: ['papor-evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['papor-promotions'] });
      queryClient.invalidateQueries({ queryKey: ['student-papor-year-data'] });
      queryClient.invalidateQueries({ queryKey: ['papor-student-year'] });
      queryClient.invalidateQueries({ queryKey: ['papor-reports-promotions'] });
      queryClient.invalidateQueries({ queryKey: ['papor-diagnostics'] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึก';
      toast.error(msg);
    },
  });

  const isLoading = loadingStudents || loadingEvals;

  return (
    <Card className="bg-card shadow-sm border-border">
      <CardHeader className="pb-4 border-b border-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <CardTitle className="text-lg">
                การประเมิน 4 มิติตามหลักสูตรแกนกลาง — ชั้น {selectedClass}
              </CardTitle>
            </div>
            <CardDescription className="mt-1">
              ประเมินคุณลักษณะอันพึงประสงค์, สมรรถนะสำคัญ, การอ่านคิดวิเคราะห์ และกิจกรรมพัฒนาผู้เรียน
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || students.length === 0}
              className="gap-2"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              บันทึกการประเมิน
            </Button>
          </div>
        </div>

        {/* Dimension Sub-Tabs */}
        <div className="pt-4">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'competency' | 'character' | 'reading' | 'activity')}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <TabsList className="bg-muted/60 p-1">
                <TabsTrigger value="competency" className="text-xs md:text-sm gap-1.5">
                  <Award className="w-3.5 h-3.5 text-blue-600" /> สมรรถนะสำคัญ (5 ด้าน)
                </TabsTrigger>
                <TabsTrigger value="character" className="text-xs md:text-sm gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-600" /> คุณลักษณะฯ (8 ข้อ)
                </TabsTrigger>
                <TabsTrigger value="reading" className="text-xs md:text-sm gap-1.5">
                  <BookOpenCheck className="w-3.5 h-3.5 text-emerald-600" /> อ่าน คิดวิเคราะห์ (5 ข้อ)
                </TabsTrigger>
                <TabsTrigger value="activity" className="text-xs md:text-sm gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-amber-600" /> กิจกรรมพัฒนาฯ (4 ด้าน)
                </TabsTrigger>
              </TabsList>

              {activeTab !== 'activity' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">ตั้งค่าด่วน:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickFillAll(activeTab, 3)}
                    className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                  >
                    <Sparkles className="w-3 h-3" /> ผ่านดีเยี่ยม (3) ทุกคน
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickFillAll(activeTab, 2)}
                    className="h-7 text-xs"
                  >
                    ผ่านเกณฑ์ (2)
                  </Button>
                </div>
              )}
            </div>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-7 h-7 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูลการประเมิน...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            ไม่พบนักเรียนในชั้น {selectedClass} กรุณาซิงค์รายชื่อนักเรียนก่อน
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Tab 1: Competencies */}
            {activeTab === 'competency' && (
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground text-center">
                    <th className="p-3 w-12 text-center border-r border-border sticky left-0 bg-muted/90 z-20">#</th>
                    <th className="p-3 min-w-[180px] text-left border-r border-border sticky left-12 bg-muted/90 z-20">นักเรียน</th>
                    {COMPETENCY_LABELS.map((lbl) => (
                      <th key={lbl} className="p-2 border-r border-border min-w-[120px]">
                        {lbl}
                      </th>
                    ))}
                    <th className="p-2 w-20 text-center font-bold text-foreground">สรุป</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((st, sIdx) => {
                    const scores = compScores[st.id] || [3, 3, 3, 3, 3];
                    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                    const summary = levelToShort(Math.round(avg));

                    return (
                      <tr key={st.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 text-center font-mono text-xs text-muted-foreground border-r border-border sticky left-0 bg-card z-10">
                          {st.class_number || sIdx + 1}
                        </td>
                        <td className="p-3 border-r border-border sticky left-12 bg-card z-10">
                          <div className="flex items-center gap-2.5">
                            <PersonAvatar name={st.name} photoUrl={st.photo_url} size="sm" />
                            <span className="font-medium text-foreground text-xs md:text-sm">{st.name}</span>
                          </div>
                        </td>
                        {scores.map((sc, iIdx) => (
                          <td key={iIdx} className="p-2 text-center border-r border-border">
                            <Select
                              value={String(sc)}
                              onValueChange={(v) => {
                                const next = { ...compScores };
                                next[st.id] = [...scores];
                                next[st.id][iIdx] = Number(v);
                                setCompScores(next);
                                paporDraftManager.saveDraft(draftKey, next);
                              }}
                            >
                              <SelectTrigger className="h-8 w-20 mx-auto text-xs font-semibold">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="3">3 - ดีเยี่ยม</SelectItem>
                                <SelectItem value="2">2 - ดี</SelectItem>
                                <SelectItem value="1">1 - ผ่าน</SelectItem>
                                <SelectItem value="0">0 - ไม่ผ่าน</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        ))}
                        <td className="p-2 text-center font-bold">
                          <Badge variant={summary === 'ดย' ? 'default' : 'secondary'} className="text-xs">
                            {summary}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Tab 2: Character */}
            {activeTab === 'character' && (
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground text-center">
                    <th className="p-3 w-12 text-center border-r border-border sticky left-0 bg-muted/90 z-20">#</th>
                    <th className="p-3 min-w-[180px] text-left border-r border-border sticky left-12 bg-muted/90 z-20">นักเรียน</th>
                    {CHARACTER_LABELS.map((lbl) => (
                      <th key={lbl} className="p-2 border-r border-border min-w-[110px]">
                        {lbl}
                      </th>
                    ))}
                    <th className="p-2 w-20 text-center font-bold text-foreground">สรุป</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((st, sIdx) => {
                    const scores = charScores[st.id] || [3, 3, 3, 3, 3, 3, 3, 3];
                    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                    const summary = levelToShort(Math.round(avg));

                    return (
                      <tr key={st.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 text-center font-mono text-xs text-muted-foreground border-r border-border sticky left-0 bg-card z-10">
                          {st.class_number || sIdx + 1}
                        </td>
                        <td className="p-3 border-r border-border sticky left-12 bg-card z-10">
                          <div className="flex items-center gap-2.5">
                            <PersonAvatar name={st.name} photoUrl={st.photo_url} size="sm" />
                            <span className="font-medium text-foreground text-xs md:text-sm">{st.name}</span>
                          </div>
                        </td>
                        {scores.map((sc, iIdx) => (
                          <td key={iIdx} className="p-2 text-center border-r border-border">
                            <Select
                              value={String(sc)}
                              onValueChange={(v) => {
                                const next = { ...charScores };
                                next[st.id] = [...scores];
                                next[st.id][iIdx] = Number(v);
                                setCharScores(next);
                                paporDraftManager.saveDraft(draftKey, next);
                              }}
                            >
                              <SelectTrigger className="h-8 w-20 mx-auto text-xs font-semibold">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="3">3 - ดีเยี่ยม</SelectItem>
                                <SelectItem value="2">2 - ดี</SelectItem>
                                <SelectItem value="1">1 - ผ่าน</SelectItem>
                                <SelectItem value="0">0 - ไม่ผ่าน</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        ))}
                        <td className="p-2 text-center font-bold">
                          <Badge variant={summary === 'ดย' ? 'default' : 'secondary'} className="text-xs">
                            {summary}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Tab 3: Reading, Thinking & Writing */}
            {activeTab === 'reading' && (
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground text-center">
                    <th className="p-3 w-12 text-center border-r border-border sticky left-0 bg-muted/90 z-20">#</th>
                    <th className="p-3 min-w-[180px] text-left border-r border-border sticky left-12 bg-muted/90 z-20">นักเรียน</th>
                    {READING_LABELS.map((lbl) => (
                      <th key={lbl} className="p-2 border-r border-border min-w-[120px]">
                        {lbl}
                      </th>
                    ))}
                    <th className="p-2 w-20 text-center font-bold text-foreground">สรุป</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((st, sIdx) => {
                    const scores = readScores[st.id] || [3, 3, 3, 3, 3];
                    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                    const summary = levelToShort(Math.round(avg));

                    return (
                      <tr key={st.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 text-center font-mono text-xs text-muted-foreground border-r border-border sticky left-0 bg-card z-10">
                          {st.class_number || sIdx + 1}
                        </td>
                        <td className="p-3 border-r border-border sticky left-12 bg-card z-10">
                          <div className="flex items-center gap-2.5">
                            <PersonAvatar name={st.name} photoUrl={st.photo_url} size="sm" />
                            <span className="font-medium text-foreground text-xs md:text-sm">{st.name}</span>
                          </div>
                        </td>
                        {scores.map((sc, iIdx) => (
                          <td key={iIdx} className="p-2 text-center border-r border-border">
                            <Select
                              value={String(sc)}
                              onValueChange={(v) => {
                                const next = { ...readScores };
                                next[st.id] = [...scores];
                                next[st.id][iIdx] = Number(v);
                                setReadScores(next);
                                paporDraftManager.saveDraft(draftKey, next);
                              }}
                            >
                              <SelectTrigger className="h-8 w-20 mx-auto text-xs font-semibold">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="3">3 - ดีเยี่ยม</SelectItem>
                                <SelectItem value="2">2 - ดี</SelectItem>
                                <SelectItem value="1">1 - ผ่าน</SelectItem>
                                <SelectItem value="0">0 - ไม่ผ่าน</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        ))}
                        <td className="p-2 text-center font-bold">
                          <Badge variant={summary === 'ดย' ? 'default' : 'secondary'} className="text-xs">
                            {summary}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Tab 4: Activities */}
            {activeTab === 'activity' && (
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground text-center">
                    <th className="p-3 w-12 text-center border-r border-border sticky left-0 bg-muted/90 z-20">#</th>
                    <th className="p-3 min-w-[180px] text-left border-r border-border sticky left-12 bg-muted/90 z-20">นักเรียน</th>
                    <th className="p-2 border-r border-border">แนะแนว (40 ชม.)</th>
                    <th className="p-2 border-r border-border">ลูกเสือ/เนตรนารี (40 ชม.)</th>
                    <th className="p-2 border-r border-border">ชุมนุม (30 ชม.)</th>
                    <th className="p-2 border-r border-border">เพื่อสังคม/สาธารณประโยชน์ (10 ชม.)</th>
                    <th className="p-2 w-20 text-center font-bold text-foreground">สรุป</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((st, sIdx) => {
                    const acts = actScores[st.id] || { guidance: 'ผ', scout: 'ผ', club: 'ผ', social: 'ผ' };
                    const allPass = Object.values(acts).every((v) => v === 'ผ');

                    return (
                      <tr key={st.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 text-center font-mono text-xs text-muted-foreground border-r border-border sticky left-0 bg-card z-10">
                          {st.class_number || sIdx + 1}
                        </td>
                        <td className="p-3 border-r border-border sticky left-12 bg-card z-10">
                          <div className="flex items-center gap-2.5">
                            <PersonAvatar name={st.name} photoUrl={st.photo_url} size="sm" />
                            <span className="font-medium text-foreground text-xs md:text-sm">{st.name}</span>
                          </div>
                        </td>
                        {(['guidance', 'scout', 'club', 'social'] as const).map((k) => (
                          <td key={k} className="p-2 text-center border-r border-border">
                            <Select
                              value={acts[k]}
                              onValueChange={(v) => {
                                const next = { ...actScores };
                                next[st.id] = { ...acts, [k]: v };
                                setActScores(next);
                                paporDraftManager.saveDraft(draftKey, next);
                              }}
                            >
                              <SelectTrigger className="h-8 w-20 mx-auto text-xs font-semibold">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ผ">ผ - ผ่าน</SelectItem>
                                <SelectItem value="มผ">มผ - ไม่ผ่าน</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        ))}
                        <td className="p-2 text-center font-bold">
                          <Badge variant={allPass ? 'default' : 'destructive'} className="text-xs">
                            {allPass ? 'ผ' : 'มผ'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
