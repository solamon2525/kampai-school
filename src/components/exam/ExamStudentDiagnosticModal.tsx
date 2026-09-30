/**
 * ExamStudentDiagnosticModal.tsx
 * Individual Student Diagnostic & Smart Remediation Report Modal
 * 
 * Features:
 * 1. Student profile header with score, pass/fail status, and badge
 * 2. Interactive Recharts Radar Chart showing competency across exam topics
 * 3. Strengths & Areas for Improvement breakdown
 * 4. Personalized Remediation Quests with direct links to Kampai games/media
 * 5. Printable 1-page individual diagnostic report for parents and teachers
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';
import {
  calculateStudentDiagnostic,
  type DiagnosticQuestion,
} from '@/lib/exam/diagnostic';
import { generateRemediationQuests } from '@/lib/exam/remediation';
import type { ExamSetRow, ExamSubmissionRow } from '@/services/exam.service';
import {
  Target,
  Sparkles,
  Award,
  AlertTriangle,
  CheckCircle2,
  Printer,
  ExternalLink,
  BookOpen,
  Gamepad2,
  FileText,
  Brain,
  TrendingUp,
} from 'lucide-react';

interface ExamStudentDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: ExamSubmissionRow | null;
  examSet: ExamSetRow | null;
}

export const ExamStudentDiagnosticModal: React.FC<ExamStudentDiagnosticModalProps> = ({
  isOpen,
  onClose,
  submission,
  examSet,
}) => {
  if (!submission || !examSet) return null;

  const rawQuestions = Array.isArray(examSet.questions)
    ? (examSet.questions as DiagnosticQuestion[])
    : [];

  const diagnostic = calculateStudentDiagnostic(rawQuestions, submission);
  const remediationQuests = generateRemediationQuests(
    diagnostic.weaknesses,
    examSet.subject
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 print:max-h-none print:overflow-visible print:border-none print:p-0 print:shadow-none">
        {/* Modal Header */}
        <DialogHeader className="border-b border-border pb-3 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold">
                  รายงานการวินิจฉัยสมรรถนะรายบุคคล & ภารกิจซ่อมเสริม
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  วิเคราะห์จุดแข็งและจุดที่ต้องพัฒนาแบบเจาะลึกเฉพาะบุคคล
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-xs print:hidden"
              onClick={handlePrint}
            >
              <Printer className="h-3.5 w-3.5" />
              พิมพ์รายงานผล (A4)
            </Button>
          </div>
        </DialogHeader>

        {/* Printable Paper View Container */}
        <div className="space-y-6 pt-2">
          {/* Printable Header (Visible only in print) */}
          <div className="hidden print:block text-center border-b-2 border-foreground/80 pb-3 mb-4">
            <h1 className="text-lg font-bold">โรงเรียนบ้านคำไผ่</h1>
            <h2 className="text-sm font-semibold">
              ใบรายงานผลการวินิจฉัยสมรรถนะการเรียนรู้และแผนพัฒนาตนเองรายบุคคล
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {examSet.title} · กลุ่มสาระการเรียนรู้: {examSet.subject} ({examSet.grade})
            </p>
          </div>

          {/* Student Profile & Quick KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Student Info Card */}
            <div className="p-4 rounded-xl border border-border bg-card flex items-center gap-3">
              <PersonAvatar
                name={diagnostic.studentName}
                photoUrl={null}
                className="h-12 w-12 text-sm font-bold shadow-sm"
              />
              <div className="min-w-0">
                <h3 className="font-bold text-sm truncate text-foreground">
                  {diagnostic.studentName}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {diagnostic.studentClass} {diagnostic.studentNo ? `· เลขที่ ${diagnostic.studentNo}` : ''}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  {diagnostic.passed ? (
                    <Badge className="bg-emerald-600/10 text-emerald-700 border-emerald-300 text-[10px]">
                      <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> ผ่านเกณฑ์
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px]">
                      <AlertTriangle className="h-2.5 w-2.5 mr-1" /> ต่ำกว่าเกณฑ์
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Score Card */}
            <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">คะแนนที่ได้</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black text-foreground">
                    {diagnostic.overallScore}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    /{diagnostic.maxScore} คะแนน
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  คิดเป็นร้อยละ <strong>{diagnostic.overallPercentage}%</strong>
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                {diagnostic.overallPercentage}%
              </div>
            </div>

            {/* Summary Diagnosis Badge */}
            <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">ภาพรวมการวินิจฉัย</p>
                <h4 className="font-bold text-sm text-foreground mt-0.5 flex items-center gap-1">
                  {diagnostic.weaknesses.length === 0 ? (
                    <>
                      <Award className="h-4 w-4 text-emerald-600" />
                      สมรรถนะดีเยี่ยมครบทุกด้าน
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 text-amber-600" />
                      พบ {diagnostic.weaknesses.length} หัวข้อที่ควรพัฒนา
                    </>
                  )}
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  จุดแข็ง {diagnostic.strengths.length} ด้าน · จุดพัฒนา {diagnostic.weaknesses.length} ด้าน
                </p>
              </div>
            </div>
          </div>

          {/* Radar Chart & Competency Dimension Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Radar Chart */}
            <div className="lg:col-span-6 p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Brain className="h-3.5 w-3.5 text-primary" />
                  แผนภูมิเรดาร์สมรรถนะรายหัวข้อ (Competency Radar)
                </h4>
                <span className="text-[10px] text-muted-foreground">เต็ม 100%</span>
              </div>
              <div className="h-64 w-full flex items-center justify-center">
                {diagnostic.radarData.length >= 3 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      cx="50%"
                      cy="50%"
                      outerRadius="70%"
                      data={diagnostic.radarData}
                    >
                      <PolarGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                      <PolarAngleAxis
                        dataKey="topic"
                        tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fontSize: 9 }}
                      />
                      <Radar
                        name="คะแนนนักเรียน"
                        dataKey="score"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.4}
                      />
                      <Tooltip
                        formatter={(val: number) => [`${val}%`, 'ความแม่นยำ']}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '11px',
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-xs text-muted-foreground py-16">
                    ชุดข้อสอบนี้มีหัวข้อย่อยน้อยกว่า 3 หัวข้อ แนะนำดูรายละเอียดที่ตารางสมรรถนะ
                  </div>
                )}
              </div>
            </div>

            {/* Right: Topic Progress Bars & Status */}
            <div className="lg:col-span-6 p-4 rounded-xl border border-border bg-card flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-primary" />
                  ระดับความเชี่ยวชาญแยกรายหัวข้อ (Topic Mastery)
                </h4>
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {diagnostic.topicBreakdown.map((t, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground truncate max-w-[200px]">
                          {t.topic}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-muted-foreground">
                            {t.correctCount}/{t.totalQuestions} ({t.scorePercentage}%)
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              t.level === 'mastered'
                                ? 'bg-emerald-600/10 text-emerald-700'
                                : t.level === 'proficient'
                                ? 'bg-blue-600/10 text-blue-700'
                                : t.level === 'developing'
                                ? 'bg-amber-600/10 text-amber-700'
                                : 'bg-red-600/10 text-red-700'
                            }`}
                          >
                            {t.level === 'mastered'
                              ? 'ดีเยี่ยม'
                              : t.level === 'proficient'
                              ? 'ทำได้ดี'
                              : t.level === 'developing'
                              ? 'พอใช้'
                              : 'ต้องพัฒนา'}
                          </span>
                        </div>
                      </div>
                      <Progress
                        value={t.scorePercentage}
                        className={`h-2 ${
                          t.scorePercentage >= 80
                            ? '[&>div]:bg-emerald-600'
                            : t.scorePercentage >= 60
                            ? '[&>div]:bg-blue-600'
                            : t.scorePercentage >= 40
                            ? '[&>div]:bg-amber-500'
                            : '[&>div]:bg-red-500'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Cognitive Bloom Level Mini Summary */}
              <div className="mt-4 pt-3 border-t border-border/80">
                <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
                  จำแนกตามระดับความคิด (Bloom's Taxonomy):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {diagnostic.bloomBreakdown.map((b, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-muted/60 px-2 py-0.5 rounded border border-border/60 text-muted-foreground"
                    >
                      {b.levelNameTh}: <strong>{b.scorePercentage}%</strong> ({b.correctCount}/{b.totalQuestions})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Personalized Remediation Quests */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">
                    ภารกิจซ่อมเสริมเฉพาะบุคคล (Personalized Remediation Plan)
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    ระบบจับคู่อัตโนมัติระหว่างหัวข้อที่ได้คะแนนต่ำ กับคลังเกมและสื่อการสอนของโรงเรียน
                  </p>
                </div>
              </div>
            </div>

            {remediationQuests.length === 0 ? (
              <div className="p-6 rounded-lg bg-emerald-600/5 border border-emerald-300 text-center text-xs text-emerald-800">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                <p className="font-bold text-sm">ยินดีด้วย! นักเรียนผ่านเกณฑ์มาตรฐานทุกหัวข้อ</p>
                <p className="text-muted-foreground mt-0.5">
                  ไม่มีหัวข้อใดที่ได้คะแนนต่ำกว่า 60% สามารถส่งเสริมต่อยอดด้วยกิจกรรมท้าทายขั้นสูงได้
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {remediationQuests.map((quest, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-card border border-border shadow-xs text-primary">
                            {quest.resource.type === 'game' ? (
                              <Gamepad2 className="h-4 w-4 text-emerald-600" />
                            ) : quest.resource.type === 'worksheet' ? (
                              <FileText className="h-4 w-4 text-blue-600" />
                            ) : (
                              <BookOpen className="h-4 w-4 text-amber-600" />
                            )}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 border border-amber-300/40">
                              {quest.resource.badgeText}
                            </span>
                            <h5 className="font-bold text-xs text-foreground mt-0.5">
                              {quest.questTitle}
                            </h5>
                          </div>
                        </div>
                        <Badge variant="destructive" className="text-[10px] shrink-0">
                          {quest.studentScorePct}%
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {quest.resource.description}
                      </p>

                      <div className="mt-2 text-[11px] text-amber-800/90 bg-card p-2 rounded border border-amber-500/20 font-medium">
                        💡 <strong>คำแนะนำคุณครู:</strong> {quest.teacherTip}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-amber-500/20 flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        เป้าหมาย: ยกระดับให้ผ่าน ≥ 70%
                      </span>
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-xs gap-1 print:hidden"
                        onClick={() => window.open(quest.resource.url, '_blank')}
                      >
                        <span>{quest.resource.suggestedActionText}</span>
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                      <span className="hidden print:inline text-[10px] text-muted-foreground">
                        {quest.resource.url}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Printable Signature & Notes (Visible in print) */}
          <div className="hidden print:grid grid-cols-2 gap-8 pt-8 mt-4 border-t border-foreground/60 text-xs">
            <div className="text-center">
              <p>ลงชื่อ ............................................................</p>
              <p className="mt-1 font-semibold">( คุณครูผู้สอน / ผู้ประเมิน )</p>
              <p className="text-muted-foreground mt-0.5">วันที่ ........ / ........ / ................</p>
            </div>
            <div className="text-center">
              <p>ลงชื่อ ............................................................</p>
              <p className="mt-1 font-semibold">( ผู้ปกครองนักเรียน )</p>
              <p className="text-muted-foreground mt-0.5">วันที่ ........ / ........ / ................</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
