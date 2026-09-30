/**
 * ExamClassCompetencyView.tsx
 * Classroom Competency & Topic Diagnostic Dashboard
 * 
 * Provides teachers with a high-level view of how the entire class performed
 * across learning topics and indicators, with classroom-wide remediation guidance.
 */

import React, { useMemo } from 'react';
import type { ExamSetRow, ExamSubmissionRow } from '@/services/exam.service';
import type { DiagnosticQuestion } from '@/lib/exam/diagnostic';
import { calculateClassDiagnostic } from '@/lib/exam/diagnostic';
import { findMatchingResources } from '@/lib/exam/remediation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
  Brain,
  Target,
  Award,
  AlertTriangle,
  ExternalLink,
  BookOpen,
  Gamepad2,
  FileText,
  Sparkles,
  Users,
} from 'lucide-react';

interface ExamClassCompetencyViewProps {
  examSet: ExamSetRow;
  submissions: ExamSubmissionRow[];
  onBack?: () => void;
}

export const ExamClassCompetencyView: React.FC<ExamClassCompetencyViewProps> = ({
  examSet,
  submissions,
  onBack,
}) => {
  const rawQuestions = useMemo(
    () =>
      Array.isArray(examSet.questions)
        ? (examSet.questions as DiagnosticQuestion[])
        : [],
    [examSet.questions]
  );

  const classDiagnostic = useMemo(
    () => calculateClassDiagnostic(rawQuestions, submissions, examSet.title),
    [rawQuestions, submissions, examSet.title]
  );

  return (
    <div className="space-y-6">
      {/* Header & Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">จำนวนผู้เข้าสอบ</p>
              <h3 className="text-2xl font-black text-foreground mt-0.5">
                {classDiagnostic.totalSubmissions}
              </h3>
              <p className="text-[11px] text-muted-foreground">คนในชุดนี้</p>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">คะแนนเฉลี่ยทั้งห้อง</p>
              <h3 className="text-2xl font-black text-foreground mt-0.5">
                {classDiagnostic.classAveragePercentage}%
              </h3>
              <p className="text-[11px] text-muted-foreground">จากคะแนนเต็ม 100%</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-600/10 text-emerald-700">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">จุดแข็งของชั้นเรียน</p>
              <h3 className="text-2xl font-black text-emerald-700 mt-0.5">
                {classDiagnostic.classStrengths.length}
              </h3>
              <p className="text-[11px] text-muted-foreground">หัวข้อ (เฉลี่ย ≥ 75%)</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">หัวข้อที่ต้องทบทวนซ้ำ</p>
              <h3 className="text-2xl font-black text-amber-700 mt-0.5">
                {classDiagnostic.classWeaknesses.length}
              </h3>
              <p className="text-[11px] text-muted-foreground">หัวข้อ (เฉลี่ย &lt; 60%)</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Radar Chart & Topic Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Recharts Radar */}
        <div className="lg:col-span-6 p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5 text-primary" />
              แผนภูมิเรดาร์สมรรถนะเฉลี่ยทั้งชั้นเรียน (Class Competency Radar)
            </h4>
            <span className="text-[10px] text-muted-foreground">คะแนนเฉลี่ย %</span>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            {classDiagnostic.radarData.length >= 3 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="70%"
                  data={classDiagnostic.radarData}
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
                    name="คะแนนเฉลี่ยชั้นเรียน"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.4}
                  />
                  <Tooltip
                    formatter={(val: number) => [`${val}%`, 'เฉลี่ยทั้งห้อง']}
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
                มีหัวข้อย่อยน้อยกว่า 3 หัวข้อ แนะนำดูรายละเอียดที่ตารางวิเคราะห์รายหัวข้อ
              </div>
            )}
          </div>
        </div>

        {/* Right: Detailed Topic Breakdown */}
        <div className="lg:col-span-6 p-4 rounded-xl border border-border bg-card flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-primary" />
              การกระจายคะแนนตามสาระ/หัวข้อ (Topic Mastery Breakdown)
            </h4>

            <div className="space-y-3.5 max-h-64 overflow-y-auto pr-1">
              {classDiagnostic.topics.map((t, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground truncate max-w-[200px]">
                      {t.topic}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">
                        เฉลี่ย <strong>{t.averagePercentage}%</strong>
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          t.averagePercentage >= 75
                            ? 'bg-emerald-600/10 text-emerald-700'
                            : t.averagePercentage >= 60
                            ? 'bg-blue-600/10 text-blue-700'
                            : 'bg-amber-600/10 text-amber-700'
                        }`}
                      >
                        {t.averagePercentage >= 75
                          ? 'จุดแข็ง'
                          : t.averagePercentage >= 60
                          ? 'ปานกลาง'
                          : 'ต้องทบทวน'}
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={t.averagePercentage}
                    className={`h-2 ${
                      t.averagePercentage >= 75
                        ? '[&>div]:bg-emerald-600'
                        : t.averagePercentage >= 60
                        ? '[&>div]:bg-blue-600'
                        : '[&>div]:bg-amber-500'
                    }`}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>เด็กที่ได้ ≥80%: {t.masteryCount} คน</span>
                    <span>เด็กที่ได้ &lt;60%: {t.remediationCount} คน</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border flex justify-end">
            {onBack && (
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onBack}>
                กลับไปตารางคะแนน
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Classroom Teaching & Remediation Recommendations */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-600" />
            ข้อเสนอแนะในการจัดกิจกรรมซ่อมเสริมระดับชั้นเรียน (Classroom Action Plan)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {classDiagnostic.classWeaknesses.length === 0 ? (
            <div className="p-4 rounded-lg bg-emerald-600/10 border border-emerald-300 text-xs text-emerald-800 text-center">
              🎉 <strong>ยอดเยี่ยม!</strong> ภาพรวมของนักเรียนทั้งห้องผ่านเกณฑ์คะแนนเฉลี่ย 60% ในทุกหัวข้อ คุณครูสามารถก้าวสู่เนื้อหาขั้นต่อไปได้ทันที
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {classDiagnostic.classWeaknesses.map((cw, i) => {
                const matched = findMatchingResources(cw.topic, examSet.subject, 1)[0];
                return (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-xs text-foreground">
                          📌 ควรทบทวนเรื่อง: {cw.topic}
                        </h5>
                        <Badge variant="destructive" className="text-[10px]">
                          เฉลี่ย {cw.averagePercentage}%
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        มีนักเรียน {cw.remediationCount} คน (จาก {cw.studentCount} คน) ที่ได้คะแนนต่ำกว่า 60% ในหัวข้อนี้
                      </p>

                      {matched && (
                        <div className="mt-2.5 p-2 rounded-lg bg-card border border-border text-xs flex items-start gap-2">
                          <div className="p-1 rounded bg-primary/10 text-primary mt-0.5">
                            {matched.type === 'game' ? (
                              <Gamepad2 className="h-3.5 w-3.5 text-emerald-600" />
                            ) : matched.type === 'worksheet' ? (
                              <FileText className="h-3.5 w-3.5 text-blue-600" />
                            ) : (
                              <BookOpen className="h-3.5 w-3.5 text-amber-600" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground text-[11px]">
                              {matched.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground line-clamp-1">
                              {matched.description}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {matched && (
                      <div className="mt-3 pt-2 border-t border-amber-500/20 flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => window.open(matched.url, '_blank')}
                        >
                          <span>{matched.suggestedActionText}</span>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
