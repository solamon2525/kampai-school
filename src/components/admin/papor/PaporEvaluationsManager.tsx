import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { useToast } from '@/hooks/use-toast';
import { Save, Sparkles, CheckCheck, Award, Heart, BookOpenCheck, Compass } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';
import { levelToShort } from '@/services/papor-evaluation.service';

interface StudentItem {
  id: string;
  name: string;
  student_code: string | null;
  class_number: number | null;
  photo_url: string | null;
}

interface Props {
  selectedClass?: string;
  academicYear?: string;
}

export const PaporEvaluationsManager: React.FC<Props> = ({
  selectedClass = 'ป.5',
  academicYear = '2568',
}) => {
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [activeTab, setActiveTab] = useState<'competency' | 'character' | 'reading' | 'activity'>('competency');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // States for each dimension
  // studentId -> number[]
  const [compScores, setCompScores] = useState<Record<string, number[]>>({});
  const [charScores, setCharScores] = useState<Record<string, number[]>>({});
  const [readScores, setReadScores] = useState<Record<string, number[]>>({});
  const [actScores, setActScores] = useState<Record<string, { guidance: string; scout: string; club: string; social: string }>>({});

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, academicYear]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch students
      const { data: stList } = await supabase
        .from('students')
        .select('id, name, student_code, class_number, photo_url')
        .eq('is_active', true)
        .order('class_number', { ascending: true });

      const filtered = stList || [];
      setStudents(filtered);
      if (filtered.length === 0) {
        setIsLoading(false);
        return;
      }

      // 2. Fetch existing evaluations
      const sIds = filtered.map(s => s.id);
      const { data: evals } = await supabase
        .from('student_obec_evaluations')
        .select('*')
        .eq('academic_year', academicYear)
        .in('student_id', sIds);

      const compMap: Record<string, number[]> = {};
      const charMap: Record<string, number[]> = {};
      const readMap: Record<string, number[]> = {};
      const actMap: Record<string, { guidance: string; scout: string; club: string; social: string }> = {};

      filtered.forEach(st => {
        compMap[st.id] = [3, 3, 3, 3, 3];
        charMap[st.id] = [3, 3, 3, 3, 3, 3, 3, 3];
        readMap[st.id] = [3, 3, 3, 3, 3];
        actMap[st.id] = { guidance: 'ผ', scout: 'ผ', club: 'ผ', social: 'ผ' };
      });

      evals?.forEach(ev => {
        const sId = ev.student_id;
        const itemIdx = (Number(ev.item_key) || 1) - 1;
        const sc = Number(ev.score) || 3;

        if (ev.evaluation_type === 'competency') {
          if (compMap[sId] && itemIdx >= 0 && itemIdx < 5) compMap[sId][itemIdx] = sc;
        } else if (ev.evaluation_type === 'character') {
          if (charMap[sId] && itemIdx >= 0 && itemIdx < 8) charMap[sId][itemIdx] = sc;
        } else if (ev.evaluation_type === 'reading_thinking') {
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดการประเมิน';
      toast({
        variant: 'destructive',
        title: 'โหลดการประเมินไม่สำเร็จ',
        description: msg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Quick fill all with excellent
  const handleQuickFillAll = (dimension: 'competency' | 'character' | 'reading', val: number) => {
    if (dimension === 'competency') {
      const next = { ...compScores };
      students.forEach(s => { next[s.id] = [val, val, val, val, val]; });
      setCompScores(next);
    } else if (dimension === 'character') {
      const next = { ...charScores };
      students.forEach(s => { next[s.id] = [val, val, val, val, val, val, val, val]; });
      setCharScores(next);
    } else if (dimension === 'reading') {
      const next = { ...readScores };
      students.forEach(s => { next[s.id] = [val, val, val, val, val]; });
      setReadScores(next);
    }
    toast({
      title: 'ตั้งค่าด่วนสำเร็จ',
      description: `ปรับคะแนนทุกคนเป็น ${val === 3 ? 'ดีเยี่ยม (3)' : val === 2 ? 'ดี (2)' : 'ผ่าน (1)'} เรียบร้อย`,
    });
  };

  // Save current dimension
  const handleSaveDimension = async () => {
    setIsSaving(true);
    try {
      const rows: TablesInsert<'student_obec_evaluations'>[] = [];

      if (activeTab === 'competency') {
        const compKeys = ['communication', 'thinking', 'problem_solving', 'life_skills', 'technology'];
        students.forEach(s => {
          const scores = compScores[s.id] || [3, 3, 3, 3, 3];
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
              notes: levelToShort(Math.max(...scores)),
            });
          });
        });
      } else if (activeTab === 'character') {
        students.forEach(s => {
          const scores = charScores[s.id] || [3, 3, 3, 3, 3, 3, 3, 3];
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
              notes: levelToShort(Math.max(...scores)),
            });
          });
        });
      } else if (activeTab === 'reading') {
        students.forEach(s => {
          const scores = readScores[s.id] || [3, 3, 3, 3, 3];
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
              notes: levelToShort(Math.max(...scores)),
            });
          });
        });
      } else if (activeTab === 'activity') {
        students.forEach(s => {
          const acts = actScores[s.id] || { guidance: 'ผ', scout: 'ผ', club: 'ผ', social: 'ผ' };
          ['guidance', 'scout', 'club', 'social'].forEach(k => {
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
        });
      }

      await supabase.from('student_obec_evaluations').upsert(rows, {
        onConflict: 'student_id,academic_year,semester,evaluation_type,category_key,item_key',
      });

      toast({
        title: 'บันทึกการประเมินสำเร็จ',
        description: `บันทึกข้อมูล ${rows.length} รายการ เรียบร้อยแล้ว`,
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
    'ข้อ 1 (การอ่านเข้าใจความ)',
    'ข้อ 2 (การอ่านจับใจความ)',
    'ข้อ 3 (การคิดวิเคราะห์ข้อมูล)',
    'ข้อ 4 (การสรุปความคิดเห็น)',
    'ข้อ 5 (การเขียนสื่อสาร)',
  ];

  return (
    <Card className="bg-card">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              <span>ระบบประเมินผล 4 ด้านมาตรฐาน สพฐ.</span>
            </CardTitle>
            <CardDescription>
              ประเมินสมรรถนะสำคัญ คุณลักษณะอันพึงประสงค์ การอ่านคิดวิเคราะห์ และกิจกรรมพัฒนาผู้เรียน
            </CardDescription>
          </div>

          <Button onClick={handleSaveDimension} disabled={isSaving || students.length === 0}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'กำลังบันทึก...' : 'บันทึกผลการประเมิน'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'competency' | 'character' | 'reading' | 'activity')}>
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="competency" className="gap-1.5 text-xs md:text-sm">
              <Sparkles className="w-4 h-4" /> สมรรถนะ (5 ด้าน)
            </TabsTrigger>
            <TabsTrigger value="character" className="gap-1.5 text-xs md:text-sm">
              <Heart className="w-4 h-4" /> คุณลักษณะฯ (8 ข้อ)
            </TabsTrigger>
            <TabsTrigger value="reading" className="gap-1.5 text-xs md:text-sm">
              <BookOpenCheck className="w-4 h-4" /> อ่านคิดวิเคราะห์
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5 text-xs md:text-sm">
              <Compass className="w-4 h-4" /> กิจกรรมพัฒนาฯ
            </TabsTrigger>
          </TabsList>

          {/* Quick Fill Toolstrip */}
          {activeTab !== 'activity' && (
            <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
              <span>ตั้งค่าด่วนทั้งห้อง:</span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleQuickFillAll(activeTab, 3)}
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" /> ดีเยี่ยม (3) ทุกคน
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleQuickFillAll(activeTab, 2)}
              >
                ดี (2) ทุกคน
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleQuickFillAll(activeTab, 1)}
              >
                ผ่าน (1) ทุกคน
              </Button>
            </div>
          )}

          {/* Tab 1: Competencies */}
          <TabsContent value="competency" className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-muted-foreground text-xs">
                    <th className="py-2 px-3 text-center w-12">เลขที่</th>
                    <th className="py-2 px-3 text-left min-w-[180px]">นักเรียน</th>
                    {COMPETENCY_LABELS.map((lbl, i) => (
                      <th key={i} className="py-2 px-2 text-center w-28">{lbl}</th>
                    ))}
                    <th className="py-2 px-3 text-center w-24 font-bold">ระดับคุณภาพ</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((st, idx) => {
                    const scores = compScores[st.id] || [3, 3, 3, 3, 3];
                    const mode = Math.max(...scores);
                    const grade = levelToShort(mode);
                    return (
                      <tr key={st.id} className="border-b border-border hover:bg-muted/10 transition-colors">
                        <td className="py-2 px-3 text-center font-medium">{st.class_number || idx + 1}</td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <PersonAvatar name={st.name} photoUrl={st.photo_url} className="w-7 h-7 text-xs" />
                            <span className="font-medium">{st.name}</span>
                          </div>
                        </td>
                        {scores.map((sc, scIdx) => (
                          <td key={scIdx} className="py-2 px-2 text-center">
                            <Select
                              value={String(sc)}
                              onValueChange={v => {
                                const next = { ...compScores };
                                const cur = [...(next[st.id] || [3, 3, 3, 3, 3])];
                                cur[scIdx] = Number(v);
                                next[st.id] = cur;
                                setCompScores(next);
                              }}
                            >
                              <SelectTrigger className="h-8 w-24 mx-auto text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="3">3 (ดีเยี่ยม)</SelectItem>
                                <SelectItem value="2">2 (ดี)</SelectItem>
                                <SelectItem value="1">1 (ผ่าน)</SelectItem>
                                <SelectItem value="0">0 (ไม่ผ่าน)</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        ))}
                        <td className="py-2 px-3 text-center">
                          <Badge variant="default" className="bg-emerald-600 text-white font-bold">
                            {grade}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Tab 2: Character */}
          <TabsContent value="character" className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-muted-foreground text-xs">
                    <th className="py-2 px-3 text-center w-12">เลขที่</th>
                    <th className="py-2 px-3 text-left min-w-[160px]">นักเรียน</th>
                    {CHARACTER_LABELS.map((lbl, i) => (
                      <th key={i} className="py-2 px-1 text-center w-24 text-[11px]">{lbl}</th>
                    ))}
                    <th className="py-2 px-3 text-center w-20 font-bold">สรุปผล</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((st, idx) => {
                    const scores = charScores[st.id] || [3, 3, 3, 3, 3, 3, 3, 3];
                    const grade = levelToShort(Math.max(...scores));
                    return (
                      <tr key={st.id} className="border-b border-border hover:bg-muted/10 transition-colors">
                        <td className="py-2 px-3 text-center font-medium">{st.class_number || idx + 1}</td>
                        <td className="py-2 px-3 font-medium">{st.name}</td>
                        {scores.map((sc, scIdx) => (
                          <td key={scIdx} className="py-2 px-1 text-center">
                            <Select
                              value={String(sc)}
                              onValueChange={v => {
                                const next = { ...charScores };
                                const cur = [...(next[st.id] || [3, 3, 3, 3, 3, 3, 3, 3])];
                                cur[scIdx] = Number(v);
                                next[st.id] = cur;
                                setCharScores(next);
                              }}
                            >
                              <SelectTrigger className="h-7 w-16 mx-auto text-xs px-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="3">3</SelectItem>
                                <SelectItem value="2">2</SelectItem>
                                <SelectItem value="1">1</SelectItem>
                                <SelectItem value="0">0</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        ))}
                        <td className="py-2 px-3 text-center">
                          <Badge variant="default" className="bg-emerald-600 text-white font-bold">
                            {grade}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Tab 3: Reading */}
          <TabsContent value="reading" className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-muted-foreground text-xs">
                    <th className="py-2 px-3 text-center w-12">เลขที่</th>
                    <th className="py-2 px-3 text-left min-w-[180px]">นักเรียน</th>
                    {READING_LABELS.map((lbl, i) => (
                      <th key={i} className="py-2 px-2 text-center w-28">{lbl}</th>
                    ))}
                    <th className="py-2 px-3 text-center w-24 font-bold">ระดับคุณภาพ</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((st, idx) => {
                    const scores = readScores[st.id] || [3, 3, 3, 3, 3];
                    const grade = levelToShort(Math.max(...scores));
                    return (
                      <tr key={st.id} className="border-b border-border hover:bg-muted/10 transition-colors">
                        <td className="py-2 px-3 text-center font-medium">{st.class_number || idx + 1}</td>
                        <td className="py-2 px-3 font-medium">{st.name}</td>
                        {scores.map((sc, scIdx) => (
                          <td key={scIdx} className="py-2 px-2 text-center">
                            <Select
                              value={String(sc)}
                              onValueChange={v => {
                                const next = { ...readScores };
                                const cur = [...(next[st.id] || [3, 3, 3, 3, 3])];
                                cur[scIdx] = Number(v);
                                next[st.id] = cur;
                                setReadScores(next);
                              }}
                            >
                              <SelectTrigger className="h-8 w-24 mx-auto text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="3">3 (ดีเยี่ยม)</SelectItem>
                                <SelectItem value="2">2 (ดี)</SelectItem>
                                <SelectItem value="1">1 (ผ่าน)</SelectItem>
                                <SelectItem value="0">0 (ไม่ผ่าน)</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        ))}
                        <td className="py-2 px-3 text-center">
                          <Badge variant="default" className="bg-emerald-600 text-white font-bold">
                            {grade}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Tab 4: Activities */}
          <TabsContent value="activity" className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-muted-foreground text-xs">
                    <th className="py-2 px-3 text-center w-12">เลขที่</th>
                    <th className="py-2 px-3 text-left min-w-[180px]">นักเรียน</th>
                    <th className="py-2 px-3 text-center">กิจกรรมแนะแนว (40 ชม.)</th>
                    <th className="py-2 px-3 text-center">ลูกเสือ/เนตรนารี (40 ชม.)</th>
                    <th className="py-2 px-3 text-center">กิจกรรมชุมนุม (40 ชม.)</th>
                    <th className="py-2 px-3 text-center">กิจกรรมเพื่อสังคม (40 ชม.)</th>
                    <th className="py-2 px-3 text-center font-bold">สรุปผลประเมิน</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((st, idx) => {
                    const acts = actScores[st.id] || { guidance: 'ผ', scout: 'ผ', club: 'ผ', social: 'ผ' };
                    const isAllPass = acts.guidance === 'ผ' && acts.scout === 'ผ' && acts.club === 'ผ' && acts.social === 'ผ';
                    return (
                      <tr key={st.id} className="border-b border-border hover:bg-muted/10 transition-colors">
                        <td className="py-2 px-3 text-center font-medium">{st.class_number || idx + 1}</td>
                        <td className="py-2 px-3 font-medium">{st.name}</td>

                        {(['guidance', 'scout', 'club', 'social'] as const).map(actKey => (
                          <td key={actKey} className="py-2 px-3 text-center">
                            <Select
                              value={acts[actKey]}
                              onValueChange={v => {
                                const next = { ...actScores };
                                next[st.id] = { ...acts, [actKey]: v };
                                setActScores(next);
                              }}
                            >
                              <SelectTrigger className="h-8 w-24 mx-auto text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ผ">ผ่าน (ผ)</SelectItem>
                                <SelectItem value="มผ">ไม่ผ่าน (มผ)</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        ))}

                        <td className="py-2 px-3 text-center">
                          <Badge
                            variant={isAllPass ? 'default' : 'destructive'}
                            className={isAllPass ? 'bg-emerald-600 text-white font-bold' : ''}
                          >
                            {isAllPass ? 'ผ่าน' : 'ไม่ผ่าน'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
