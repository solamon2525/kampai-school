import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { useToast } from '@/hooks/use-toast';
import { Save, CheckCircle2, XCircle, AlertTriangle, UserCheck, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

interface StudentPromotionState {
  id: string; // studentId
  name: string;
  student_code: string | null;
  class_number: number | null;
  photo_url: string | null;
  attendancePct: number;
  attendancePass: boolean;
  indicatorPass: boolean;
  academicPass: boolean;
  gpa: number;
  competencyGrade: string;
  characterGrade: string;
  readingGrade: string;
  activityPass: boolean;
  promotionDecision: 'promoted' | 'retained';
  teacherCommentTerm1: string;
  teacherCommentTerm2: string;
  parentComment: string;
}

interface Props {
  selectedClass?: string;
  academicYear?: string;
}

export const PaporPromotionManager: React.FC<Props> = ({
  selectedClass = 'ป.5',
  academicYear = '2568',
}) => {
  const { toast } = useToast();
  const [records, setRecords] = useState<StudentPromotionState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    loadPromotions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, academicYear]);

  const loadPromotions = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch students
      const { data: stList } = await supabase
        .from('students')
        .select('id, name, student_code, class_number, photo_url')
        .eq('is_active', true)
        .order('class_number', { ascending: true });

      const filtered = stList || [];
      if (filtered.length === 0) {
        setRecords([]);
        setIsLoading(false);
        return;
      }

      // 2. Fetch existing promotion records
      const sIds = filtered.map(s => s.id);
      const { data: promoData } = await supabase
        .from('student_term_promotion_records')
        .select('*')
        .eq('academic_year', academicYear)
        .in('student_id', sIds);

      const promoMap = new Map<string, Tables<'student_term_promotion_records'>>();
      promoData?.forEach(p => promoMap.set(p.student_id, p));

      const states: StudentPromotionState[] = filtered.map(st => {
        const p = promoMap.get(st.id);
        return {
          id: st.id,
          name: st.name,
          student_code: st.student_code,
          class_number: st.class_number,
          photo_url: st.photo_url,
          attendancePct: Number(p?.attendance_percent) || 94,
          attendancePass: p ? p.attendance_status ?? true : true,
          indicatorPass: p ? p.indicator_status ?? true : true,
          academicPass: p ? p.academic_pass ?? true : true,
          gpa: Number(p?.gpa) || 3.5,
          competencyGrade: p?.competency_grade || 'ดย',
          characterGrade: p?.character_grade || 'ดย',
          readingGrade: p?.reading_grade || 'ดย',
          activityPass: p ? p.activities_status ?? true : true,
          promotionDecision: (p?.promotion_decision as 'promoted' | 'retained') || 'promoted',
          teacherCommentTerm1: p?.teacher_comment_term1 || 'ตั้งใจเรียน มีวินัย ปฏิบัติตามกฎระเบียบของโรงเรียนได้ดี',
          teacherCommentTerm2: p?.teacher_comment_term2 || 'มีความพร้อมในการศึกษาต่อในระดับชั้นที่สูงขึ้น',
          parentComment: p?.parent_comment || 'รับทราบผลการเรียนของนักเรียนเป็นที่เรียบร้อย',
        };
      });

      setRecords(states);
      if (states.length > 0 && !selectedStudentId) {
        setSelectedStudentId(states[0].id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดผลการตัดสิน';
      toast({
        variant: 'destructive',
        title: 'โหลดผลการตัดสินไม่สำเร็จ',
        description: msg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const rows = records.map(r => ({
        student_id: r.id,
        academic_year: academicYear,
        attendance_percent: r.attendancePct,
        attendance_status: r.attendancePass,
        indicator_status: r.indicatorPass,
        academic_pass: r.academicPass,
        gpa: r.gpa,
        competency_grade: r.competencyGrade,
        character_grade: r.characterGrade,
        reading_grade: r.readingGrade,
        activities_status: r.activityPass,
        promotion_decision: r.promotionDecision,
        promoted_to_level: r.promotionDecision === 'promoted' ? 'ชั้นประถมศึกษาปีที่ 6' : null,
        teacher_comment_term1: r.teacherCommentTerm1,
        teacher_comment_term2: r.teacherCommentTerm2,
        parent_comment: r.parentComment,
        approved_at: new Date().toISOString(),
      }));

      await supabase.from('student_term_promotion_records').upsert(rows, {
        onConflict: 'student_id,academic_year',
      });

      toast({
        title: 'บันทึกผลการตัดสินเลื่อนชั้นสำเร็จ',
        description: `บันทึกข้อมูลการตัดสินเลื่อนชั้นนักเรียน ${rows.length} คน เรียบร้อยแล้ว`,
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

  const selectedRecord = records.find(r => r.id === selectedStudentId);

  return (
    <div className="space-y-6">
      {/* Overview Table */}
      <Card className="bg-card">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <span>สรุปผลการประเมินและการตัดสินเลื่อนชั้น (ปพ.6 หน้า 10 สพฐ.)</span>
              </CardTitle>
              <CardDescription>
                ตรวจสอบเกณฑ์มาตรฐาน สพฐ. 6 ข้อ บันทึกความเห็นครู/ผู้ปกครอง และอนุมัติการเลื่อนชั้น
              </CardDescription>
            </div>

            <Button onClick={handleSaveAll} disabled={isSaving || records.length === 0}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกและอนุมัติผลทั้งหมด'}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">กำลังโหลดข้อมูล...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-muted-foreground text-xs">
                    <th className="py-2.5 px-3 text-center w-12">เลขที่</th>
                    <th className="py-2.5 px-3 text-left">นักเรียน</th>
                    <th className="py-2.5 px-3 text-center">GPA</th>
                    <th className="py-2.5 px-2 text-center">1.เวลาเรียน (&gt;=80%)</th>
                    <th className="py-2.5 px-2 text-center">2.ตัวชี้วัด</th>
                    <th className="py-2.5 px-2 text-center">3.เกณฑ์ขั้นต่ำ</th>
                    <th className="py-2.5 px-2 text-center">4.คุณลักษณะ</th>
                    <th className="py-2.5 px-2 text-center">5.อ่านคิดวิเคราะห์</th>
                    <th className="py-2.5 px-2 text-center">6.กิจกรรม</th>
                    <th className="py-2.5 px-3 text-center font-bold">ผลการตัดสิน</th>
                    <th className="py-2.5 px-3 text-center">ความเห็น</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, idx) => {
                    const isAllPass =
                      r.attendancePass &&
                      r.indicatorPass &&
                      r.academicPass &&
                      r.competencyGrade !== 'มผ' &&
                      r.characterGrade !== 'มผ' &&
                      r.readingGrade !== 'มผ' &&
                      r.activityPass;

                    return (
                      <tr
                        key={r.id}
                        className={`border-b border-border transition-colors ${
                          selectedStudentId === r.id ? 'bg-primary/5' : 'hover:bg-muted/10'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center font-medium">{r.class_number || idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <PersonAvatar name={r.name} photoUrl={r.photo_url} className="w-7 h-7 text-xs" />
                            <span className="font-medium">{r.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-primary">{r.gpa.toFixed(2)}</td>

                        {/* 1. Attendance */}
                        <td className="py-2.5 px-2 text-center">
                          {r.attendancePass ? (
                            <Badge variant="outline" className="text-emerald-700 bg-emerald-50 text-xs">
                              {r.attendancePct}% ผ่าน
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">{r.attendancePct}% ตก</Badge>
                          )}
                        </td>

                        {/* 2. Indicators */}
                        <td className="py-2.5 px-2 text-center">
                          {r.indicatorPass ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                          )}
                        </td>

                        {/* 3. Academic Minimum */}
                        <td className="py-2.5 px-2 text-center">
                          {r.academicPass ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                          )}
                        </td>

                        {/* 4. Character */}
                        <td className="py-2.5 px-2 text-center">
                          <Badge variant="secondary" className="text-xs">{r.characterGrade}</Badge>
                        </td>

                        {/* 5. Reading */}
                        <td className="py-2.5 px-2 text-center">
                          <Badge variant="secondary" className="text-xs">{r.readingGrade}</Badge>
                        </td>

                        {/* 6. Activities */}
                        <td className="py-2.5 px-2 text-center">
                          {r.activityPass ? (
                            <Badge variant="outline" className="text-emerald-700 text-xs">ผ่าน</Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">ไม่ผ่าน</Badge>
                          )}
                        </td>

                        {/* Decision */}
                        <td className="py-2.5 px-3 text-center">
                          <Select
                            value={r.promotionDecision}
                            onValueChange={v => {
                              setRecords(prev =>
                                prev.map(item => (item.id === r.id ? { ...item, promotionDecision: v as 'promoted' | 'retained' } : item))
                              );
                            }}
                          >
                            <SelectTrigger className="h-8 w-28 mx-auto text-xs font-semibold">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="promoted">เลื่อนชั้น (ป.6)</SelectItem>
                              <SelectItem value="retained">ไม่เลื่อนชั้น</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>

                        {/* Edit comments */}
                        <td className="py-2.5 px-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => setSelectedStudentId(r.id)}
                          >
                            แก้ไขความเห็น
                          </Button>
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

      {/* Selected Student Comments Card */}
      {selectedRecord && (
        <Card className="border border-primary/30 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              <span>บันทึกความเห็นสำหรับ: {selectedRecord.name} (เลขที่ {selectedRecord.class_number || '-'})</span>
            </CardTitle>
            <CardDescription>
              ความเห็นจะปรากฏในสมุดพก ปพ.6 หน้า 8 (ความเห็นครูประจำชั้น) และหน้า 9 (ความเห็นผู้ปกครอง)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  ความเห็นครูประจำชั้น ภาคเรียนที่ 1 (หน้า 8)
                </label>
                <Textarea
                  value={selectedRecord.teacherCommentTerm1}
                  onChange={e => {
                    const text = e.target.value;
                    setRecords(prev =>
                      prev.map(r => (r.id === selectedRecord.id ? { ...r, teacherCommentTerm1: text } : r))
                    );
                  }}
                  rows={3}
                  className="text-sm"
                  placeholder="กรอกความเห็นครูประจำชั้น เทอม 1..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  ความเห็นครูประจำชั้น ภาคเรียนที่ 2 (หน้า 8)
                </label>
                <Textarea
                  value={selectedRecord.teacherCommentTerm2}
                  onChange={e => {
                    const text = e.target.value;
                    setRecords(prev =>
                      prev.map(r => (r.id === selectedRecord.id ? { ...r, teacherCommentTerm2: text } : r))
                    );
                  }}
                  rows={3}
                  className="text-sm"
                  placeholder="กรอกความเห็นครูประจำชั้น เทอม 2..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">
                บันทึกความเห็นของผู้ปกครอง (หน้า 9)
              </label>
              <Textarea
                value={selectedRecord.parentComment}
                onChange={e => {
                  const text = e.target.value;
                  setRecords(prev =>
                    prev.map(r => (r.id === selectedRecord.id ? { ...r, parentComment: text } : r))
                  );
                }}
                rows={2}
                className="text-sm"
                placeholder="กรอกความเห็นหรือข้อเสนอแนะของผู้ปกครอง..."
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
