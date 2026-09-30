/**
 * ExamItemAnalysisView.tsx
 * แดชบอร์ดวิเคราะห์คุณภาพข้อสอบ (Item Analysis & Psychometrics Dashboard)
 * แสดงค่าความยากง่าย (p), ค่าอำนาจจำแนก (r), และการกระจายตัวของตัวลวง (Distractor Efficiency)
 */

import React, { useState, useMemo } from 'react';
import type { ExamSetRow, ExamSubmissionRow } from '@/services/exam.service';
import type { ExamQuestionInput } from '@/lib/exam/multiVersion';
import { computeItemAnalysis, type QuestionAnalysisResult } from '@/lib/exam/itemAnalysis';
import { exportExamResultsToExcel } from '@/lib/excel/examExcelGenerator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Search,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface ExamItemAnalysisViewProps {
  examSet: ExamSetRow;
  submissions: ExamSubmissionRow[];
  onBack?: () => void;
}

export const ExamItemAnalysisView: React.FC<ExamItemAnalysisViewProps> = ({
  examSet,
  submissions,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterQuality, setFilterQuality] = useState<'all' | 'excellent' | 'revision'>('all');
  const [expandedQuestionIndex, setExpandedQuestionIndex] = useState<number | null>(null);

  const rawQuestions = useMemo(
    () => (Array.isArray(examSet.questions) ? (examSet.questions as ExamQuestionInput[]) : []),
    [examSet.questions]
  );

  const report = useMemo(
    () => computeItemAnalysis(rawQuestions, submissions),
    [rawQuestions, submissions]
  );

  const filteredItems = useMemo(() => {
    return report.items.filter((item) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        item.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.topic && item.topic.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;

      if (filterQuality === 'excellent') {
        return item.qualityLevel === 'excellent';
      }
      if (filterQuality === 'revision') {
        return item.qualityLevel === 'poor' || item.qualityLevel === 'critical';
      }
      return true;
    });
  }, [report.items, searchQuery, filterQuality]);

  const toggleExpand = (idx: number) => {
    setExpandedQuestionIndex(expandedQuestionIndex === idx ? null : idx);
  };

  const handleExportExcel = () => {
    exportExamResultsToExcel(examSet, submissions);
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header & Actions ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              การวิเคราะห์คุณภาพข้อสอบ (Item Analysis)
            </h2>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
              {examSet.subject} · {examSet.grade}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            ชุดข้อสอบ: <strong>{examSet.title}</strong> · ผู้เข้าสอบประมวลผล {report.overall.totalExaminees} คน
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="h-8 text-xs">
              กลับไปผลสอบ
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="h-8 text-xs gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            ส่งออกวิเคราะห์ Excel (.xlsx)
          </Button>
        </div>
      </div>

      {/* ── Psychometrics Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: Examinees */}
        <Card className="border-border shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-muted-foreground font-medium">ผู้เข้าสอบทั้งหมด</div>
              <div className="text-xl font-bold text-foreground mt-0.5">
                {report.overall.totalExaminees}{' '}
                <span className="text-xs font-normal text-muted-foreground">คน</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">
                คะแนนเฉลี่ย: {report.overall.averageScore} / {rawQuestions.length} ({report.overall.averagePercentage}%)
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Mean Difficulty (p) */}
        <Card className="border-border shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                ค่าความยากเฉลี่ย (p)
                <span title="เกณฑ์ 0.20 - 0.80 คือเหมาะสม">
                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                </span>
              </div>
              <div className="text-xl font-bold text-foreground mt-0.5">
                {report.overall.averageDifficulty.toFixed(2)}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">
                {report.overall.averageDifficulty >= 0.7
                  ? 'ค่อนข้างง่าย'
                  : report.overall.averageDifficulty <= 0.3
                  ? 'ค่อนข้างยาก'
                  : 'ระดับปานกลาง (เหมาะสม)'}
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="text-xs font-bold font-mono">p</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Mean Discrimination (r) */}
        <Card className="border-border shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                ค่าอำนาจจำแนกเฉลี่ย (r)
                <span title="เกณฑ์ r >= 0.20 คือผ่านเกณฑ์">
                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                </span>
              </div>
              <div className="text-xl font-bold text-foreground mt-0.5">
                {report.overall.averageDiscrimination.toFixed(2)}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">
                {report.overall.averageDiscrimination >= 0.3
                  ? 'อำนาจจำแนกดีมาก ⭐'
                  : report.overall.averageDiscrimination >= 0.2
                  ? 'ผ่านเกณฑ์มาตรฐาน'
                  : 'ควรปรับปรุง'}
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <span className="text-xs font-bold font-mono">r</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Quality Breakdown */}
        <Card className="border-border shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-muted-foreground font-medium">คุณภาพข้อสอบในชุด</div>
              <div className="text-xl font-bold text-emerald-600 mt-0.5">
                {report.overall.excellentCount + report.overall.acceptableCount}{' '}
                <span className="text-xs font-normal text-muted-foreground">/ {rawQuestions.length} ข้อ</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1.5">
                <span className="text-emerald-600 font-semibold">{report.overall.excellentCount} ดีเยี่ยม</span>
                <span>·</span>
                {report.overall.needsRevisionCount > 0 ? (
                  <span className="text-rose-600 font-semibold">{report.overall.needsRevisionCount} ควรปรับปรุง</span>
                ) : (
                  <span className="text-muted-foreground">0 ปรับปรุง</span>
                )}
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-center bg-card p-3 rounded-lg border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="ค้นหาข้อความหรือตัวชี้วัด..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <Button
            variant={filterQuality === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterQuality('all')}
            className="h-7 text-xs"
          >
            ทั้งหมด ({report.items.length})
          </Button>
          <Button
            variant={filterQuality === 'excellent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterQuality('excellent')}
            className="h-7 text-xs gap-1 text-emerald-700"
          >
            <Sparkles className="h-3 w-3" />
            ดีเยี่ยม ({report.overall.excellentCount})
          </Button>
          <Button
            variant={filterQuality === 'revision' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterQuality('revision')}
            className="h-7 text-xs gap-1 text-rose-700"
          >
            <AlertTriangle className="h-3 w-3" />
            ควรปรับปรุง ({report.overall.needsRevisionCount})
          </Button>
        </div>
      </div>

      {/* ── Question-by-Question Items Table ── */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span>ตารางวิเคราะห์คุณภาพรายข้อ ({filteredItems.length} ข้อ)</span>
            <span className="text-[11px] font-normal text-muted-foreground">
              คลิกที่แต่ละแถวเพื่อดูการกระจายตัวเลือก (Distractor Analysis)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-y border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">ข้อ</th>
                  <th className="py-2.5 px-3">เนื้อหาคำถามและตัวชี้วัด</th>
                  <th className="py-2.5 px-3 text-center w-24">ความยาก (p)</th>
                  <th className="py-2.5 px-3 text-center w-28">อำนาจจำแนก (r)</th>
                  <th className="py-2.5 px-3 text-center w-32">การประเมินคุณภาพ</th>
                  <th className="py-2.5 px-3 text-center w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredItems.map((item) => {
                  const isExpanded = expandedQuestionIndex === item.questionIndex;
                  return (
                    <React.Fragment key={item.questionIndex}>
                      <tr
                        onClick={() => toggleExpand(item.questionIndex)}
                        className={`hover:bg-muted/30 cursor-pointer transition-colors ${
                          isExpanded ? 'bg-muted/20' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center font-bold text-foreground">
                          {item.questionNumber}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-foreground line-clamp-1">{item.questionText}</div>
                          {item.topic && (
                            <div className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-md">
                              {item.topic}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          <span
                            className={`font-semibold ${
                              item.difficultyIndex >= 0.85
                                ? 'text-sky-600'
                                : item.difficultyIndex <= 0.2
                                ? 'text-amber-600'
                                : 'text-foreground'
                            }`}
                          >
                            {item.difficultyIndex.toFixed(2)}
                          </span>
                          <div className="text-[10px] text-muted-foreground">
                            {item.correctCount}/{item.examineeCount} คน
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          <span
                            className={`font-semibold ${
                              item.discriminationIndex >= 0.3
                                ? 'text-emerald-600'
                                : item.discriminationIndex < 0.2
                                ? 'text-rose-600'
                                : 'text-foreground'
                            }`}
                          >
                            {item.discriminationIndex.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-2 py-0.5 font-medium ${item.qualityBadgeColor}`}
                          >
                            {item.qualityLabel}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-center text-muted-foreground">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </td>
                      </tr>

                      {/* Expanded Distractor Analysis */}
                      {isExpanded && (
                        <tr className="bg-muted/30">
                          <td colSpan={6} className="p-4 border-t border-dashed border-border">
                            <div className="space-y-3">
                              {/* Full Question Text */}
                              <div className="text-xs font-semibold text-foreground">
                                โจทย์: {item.questionText}
                              </div>

                              {/* Recommendation */}
                              <div className="text-xs bg-background p-2.5 rounded border border-border/80 flex items-start gap-2">
                                <span className="font-semibold text-primary min-w-[70px]">คำแนะนำ:</span>
                                <span className="text-muted-foreground">{item.recommendation}</span>
                              </div>

                              {/* Distractor Breakdown Table */}
                              {item.distractors.length > 0 ? (
                                <div className="border border-border/80 rounded-md overflow-hidden bg-background">
                                  <table className="w-full text-left text-xs">
                                    <thead className="bg-muted/60 text-muted-foreground font-semibold">
                                      <tr>
                                        <th className="py-1.5 px-2.5 w-12 text-center">ตัวเลือก</th>
                                        <th className="py-1.5 px-2.5">ข้อความตัวเลือก</th>
                                        <th className="py-1.5 px-2.5 text-center w-24">เลือกทั้งหมด</th>
                                        <th className="py-1.5 px-2.5 text-center w-24">กลุ่มเก่ง 27%</th>
                                        <th className="py-1.5 px-2.5 text-center w-24">กลุ่มอ่อน 27%</th>
                                        <th className="py-1.5 px-2.5 text-center w-28">ประสิทธิภาพตัวลวง</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60">
                                      {item.distractors.map((d) => (
                                        <tr
                                          key={d.choiceIndex}
                                          className={d.isCorrect ? 'bg-emerald-500/10 font-medium' : ''}
                                        >
                                          <td className="py-1.5 px-2.5 text-center font-bold">
                                            {d.choiceLabel}.
                                          </td>
                                          <td className="py-1.5 px-2.5">
                                            <span className="text-foreground">{d.text}</span>
                                            {d.isCorrect && (
                                              <Badge className="ml-2 text-[9px] bg-emerald-600 text-white hover:bg-emerald-600">
                                                เฉลยถูกต้อง
                                              </Badge>
                                            )}
                                          </td>
                                          <td className="py-1.5 px-2.5 text-center">
                                            {d.totalSelected} คน ({d.totalPercent}%)
                                          </td>
                                          <td className="py-1.5 px-2.5 text-center text-emerald-700">
                                            {d.upperSelected} คน ({d.upperPercent}%)
                                          </td>
                                          <td className="py-1.5 px-2.5 text-center text-amber-700">
                                            {d.lowerSelected} คน ({d.lowerPercent}%)
                                          </td>
                                          <td className="py-1.5 px-2.5 text-center">
                                            {d.isCorrect ? (
                                              <span className="text-muted-foreground text-[10px]">-</span>
                                            ) : d.isEffective ? (
                                              <span className="text-emerald-600 text-[11px] font-medium">
                                                ✓ ลวงได้ผลดี
                                              </span>
                                            ) : (
                                              <span className="text-rose-500 text-[11px] font-medium">
                                                ✕ ไม่มีคนเลือก
                                              </span>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="text-xs text-muted-foreground italic">
                                  ไม่มีข้อมูลตัวเลือกย่อยสำหรับคำถามประเภทนี้
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
