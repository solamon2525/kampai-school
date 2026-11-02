import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BookCheck, AlertCircle, CheckCircle2, ChevronRight,
  ExternalLink, Loader2, Sparkles, RefreshCw,
  Search, Users, ListChecks,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import {
  assignmentsService,
  type StudentClassSummary,
} from '@/services/assignments.service';
import { StudentAssignmentHistorySheet } from './StudentAssignmentHistorySheet';
import { cn } from '@/lib/utils';

interface AssignmentMiniWidgetProps {
  className?: string;
  defaultClass?: string;
  isCompact?: boolean;
}

export function AssignmentMiniWidget({
  className,
  defaultClass = 'ป.4',
  isCompact = false,
}: AssignmentMiniWidgetProps) {
  const qc = useQueryClient();
  const [selectedClass, setSelectedClass] = useState<string>(defaultClass);
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overdue' | 'by-assignment' | 'roster'>('overdue');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [inspectStudentId, setInspectStudentId] = useState<string | null>(null);

  // 1. ดึงการบ้านของครูเพื่อเอาตัวเลือกชั้นเรียน
  const { data: myAssignments = [] } = useQuery({
    queryKey: ['my-assignments'],
    queryFn: () => assignmentsService.listMine(),
  });

  const availableClasses = useMemo(() => {
    const list = Array.from(new Set(myAssignments.map((a) => a.class))).filter(Boolean);
    if (!list.includes('ป.4')) list.unshift('ป.4');
    if (!list.includes('ป.5')) list.push('ป.5');
    if (!list.includes('ป.6')) list.push('ป.6');
    return list;
  }, [myAssignments]);

  // 2. ดึงข้อมูลสรุปการส่งงานของห้องที่เลือก
  const roomParam = selectedRoom === 'all' ? null : selectedRoom;
  const {
    data: overview,
    isLoading: loadingOverview,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['class-submission-summary', selectedClass, roomParam],
    queryFn: () => assignmentsService.getClassSubmissionSummary(selectedClass, roomParam),
  });

  const assignments = useMemo(() => overview?.assignments ?? [], [overview?.assignments]);
  const students = useMemo(() => overview?.students ?? [], [overview?.students]);

  // เลือกการบ้านตั้งต้นสำหรับแท็บ "ตรวจงานรายชิ้น"
  const currentAssignment = useMemo(() => {
    if (!assignments.length) return null;
    if (selectedAssignmentId) {
      return assignments.find((a) => a.id === selectedAssignmentId) ?? assignments[0];
    }
    return assignments[0];
  }, [assignments, selectedAssignmentId]);

  // 1-Click Toggle Mutation
  const toggleMutation = useMutation({
    mutationFn: ({
      assignmentId,
      studentId,
      currentSubmitted,
      maxScore,
    }: {
      assignmentId: string;
      studentId: string;
      currentSubmitted: boolean;
      maxScore?: number | null;
    }) =>
      assignmentsService.toggleStudentSubmission(
        assignmentId,
        studentId,
        currentSubmitted,
        maxScore ?? 10,
      ),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['class-submission-summary', selectedClass, roomParam] });
      qc.invalidateQueries({ queryKey: ['my-assignments-pending-grade'] });
      toast.success(vars.currentSubmitted ? 'ยกเลิกการส่งแล้ว' : 'บันทึกส่งงานแล้ว');
    },
    onError: (err: Error) => toast.error(`บันทึกไม่สำเร็จ: ${err.message}`),
  });

  // Filtered lists
  const overdueStudents = useMemo(() => {
    return students
      .filter((s) => s.overdue_count > 0)
      .sort((a, b) => b.overdue_count - a.overdue_count);
  }, [students]);

  const filteredRoster = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.trim().toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.student_code && s.student_code.includes(q)) ||
        (s.class_number && String(s.class_number) === q),
    );
  }, [students, studentSearch]);

  const totalOverdue = overview?.total_overdue ?? 0;
  const overallRate = overview?.overall_rate ?? 0;
  const totalSubmissions = overview?.total_actual_submissions ?? 0;
  const totalExpected = overview?.total_expected_submissions ?? 0;

  return (
    <Card className={cn('border-border bg-card shadow-sm overflow-hidden', className)}>
      {/* ─── Header ─────────────────────────────────────────── */}
      <CardHeader className="p-3.5 sm:p-4 pb-2 border-b border-border/70 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <BookCheck className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-1.5">
                ติดตามการส่งงาน & ค้างงาน
                <Badge variant="secondary" className="text-[10px] font-normal py-0 px-1.5">
                  ย่อส่วน
                </Badge>
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">
                บันทึกส่งงานและตรวจเช็กงานค้างประจำวัน
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="h-8 w-8 p-0"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className={cn('w-3.5 h-3.5 text-muted-foreground', isFetching && 'animate-spin')} />
            </Button>
            <Button variant="outline" size="sm" asChild className="h-8 text-xs gap-1">
              <Link to="/teacher/assignments">
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">หน้าจัดการเต็ม</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* ─── Class & Room Selector Strip ───────────────────── */}
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-medium">ชั้น:</span>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="h-8 w-24 text-xs font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableClasses.map((c) => (
                  <SelectItem key={c} value={c} className="text-xs">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-medium">ห้อง:</span>
            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
              <SelectTrigger className="h-8 w-20 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  ทั้งหมด
                </SelectItem>
                <SelectItem value="1" className="text-xs">
                  ห้อง 1
                </SelectItem>
                <SelectItem value="2" className="text-xs">
                  ห้อง 2
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>{students.length} คน</span>
            <span>• {assignments.length} ชิ้นงาน</span>
          </div>
        </div>

        {/* ─── Metric Pills & Progress ───────────────────────── */}
        <div className="pt-2 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              ส่งครบถ้วน{' '}
              <strong className="text-foreground font-semibold">
                {totalSubmissions}/{totalExpected} ครั้ง
              </strong>
            </span>
            <span className="font-bold text-primary">{overallRate}%</span>
          </div>
          <Progress value={overallRate} className="h-1.5" />

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                'text-[11px] font-medium py-0.5',
                totalOverdue > 0
                  ? 'bg-rose-500/10 text-rose-700 border-rose-300'
                  : 'bg-emerald-500/10 text-emerald-700 border-emerald-300',
              )}
            >
              {totalOverdue > 0 ? (
                <>
                  <AlertCircle className="w-3 h-3 mr-1 text-rose-600" />
                  ค้างงานรวม {totalOverdue} ชิ้น
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                  ไม่มีงานค้างเลย 🎉
                </>
              )}
            </Badge>

            {overdueStudents.length > 0 && (
              <Badge variant="secondary" className="text-[11px] font-normal py-0.5">
                เด็กค้างงาน {overdueStudents.length}/{students.length} คน
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      {/* ─── Sub-Tab Navigation ─────────────────────────────── */}
      <div className="px-3 sm:px-4 pt-2.5 border-b border-border/70 flex items-center gap-1 bg-muted/20">
        <button
          type="button"
          onClick={() => setActiveTab('overdue')}
          className={cn(
            'px-2.5 py-1.5 text-xs font-medium rounded-t-md transition-colors relative flex items-center gap-1',
            activeTab === 'overdue'
              ? 'bg-card text-foreground border-t border-x border-border font-bold'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          งานค้างเร่งด่วน
          {totalOverdue > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] bg-rose-600 text-white font-bold">
              {totalOverdue}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('by-assignment')}
          className={cn(
            'px-2.5 py-1.5 text-xs font-medium rounded-t-md transition-colors relative flex items-center gap-1',
            activeTab === 'by-assignment'
              ? 'bg-card text-foreground border-t border-x border-border font-bold'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <ListChecks className="w-3.5 h-3.5 text-primary" />
          ตรวจรายชิ้น
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('roster')}
          className={cn(
            'px-2.5 py-1.5 text-xs font-medium rounded-t-md transition-colors relative flex items-center gap-1',
            activeTab === 'roster'
              ? 'bg-card text-foreground border-t border-x border-border font-bold'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Users className="w-3.5 h-3.5 text-slate-600" />
          รายชื่อทั้งห้อง ({students.length})
        </button>
      </div>

      {/* ─── Content Area ───────────────────────────────────── */}
      <CardContent className="p-3 sm:p-4">
        {loadingOverview ? (
          <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            กำลังโหลดข้อมูลการส่งงาน...
          </div>
        ) : assignments.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <p className="text-sm font-semibold text-foreground">ยังไม่มีการบ้านในชั้น {selectedClass}</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              คุณครูสามารถสร้างการบ้าน ชิ้นงาน หรือใบงานประจำห้องได้ในระบบจัดการ
            </p>
            <Button size="sm" asChild className="text-xs mt-2">
              <Link to="/teacher/assignments">สร้างการบ้านใหม่</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* ─── Tab 1: งานค้างเร่งด่วน (Overdue Students) ─── */}
            {activeTab === 'overdue' && (
              <div className="space-y-2">
                {overdueStudents.length === 0 ? (
                  <div className="py-8 text-center bg-emerald-500/5 rounded-xl border border-emerald-500/20 p-4">
                    <Sparkles className="w-8 h-8 text-emerald-600 mx-auto mb-1.5" />
                    <p className="text-sm font-bold text-emerald-950">
                      ยอดเยี่ยมมาก! ไม่มีนักเรียนค้างงานในห้องนี้
                    </p>
                    <p className="text-xs text-emerald-700/80 mt-0.5">
                      นักเรียนทุกคนส่งงานครบตามกำหนดเวลาเรียบร้อยแล้ว
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                    <p className="text-[11px] text-muted-foreground font-medium pb-1">
                      แตะที่ชื่อนักเรียนเพื่อดูรายการที่ค้างและบันทึกผลได้ทันที
                    </p>
                    {overdueStudents.map((st) => (
                      <button
                        key={st.student_id}
                        type="button"
                        onClick={() => setInspectStudentId(st.student_id)}
                        className="w-full p-2.5 rounded-lg border border-border/80 bg-background hover:bg-muted/40 transition-colors flex items-center justify-between text-left gap-2 group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <PersonAvatar
                            name={st.name}
                            photoUrl={st.photo_url}
                            size="sm"
                            className="shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                              {st.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              เลขที่ {st.class_number ?? '-'} • ส่งแล้ว {st.submitted_count}/{st.total_assignments} ชิ้น
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant="destructive" className="text-[10px] py-0.5 px-2 font-bold">
                            ค้าง {st.overdue_count} งาน
                          </Badge>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── Tab 2: ตรวจงานรายชิ้น (By Assignment) ────────── */}
            {activeTab === 'by-assignment' && (
              <div className="space-y-3">
                {/* Assignment selector */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    เลือกชิ้นงานที่ต้องการตรวจ:
                  </label>
                  <Select
                    value={currentAssignment?.id ?? ''}
                    onValueChange={setSelectedAssignmentId}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="เลือกชิ้นงาน" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignments.map((a) => (
                        <SelectItem key={a.id} value={a.id} className="text-xs">
                          {a.title} {a.subject ? `(${a.subject})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {currentAssignment && (
                  <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60 text-xs flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{currentAssignment.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {currentAssignment.subject} • กำหนดส่ง {currentAssignment.due_date}
                        {currentAssignment.max_score != null && ` • เต็ม ${currentAssignment.max_score} คะแนน`}
                      </p>
                    </div>
                    {currentAssignment.attachment_url && (
                      <a
                        href={currentAssignment.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline shrink-0 text-[11px] inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> ใบงาน
                      </a>
                    )}
                  </div>
                )}

                {/* Student list for this assignment */}
                {currentAssignment && (
                  <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                    {students.map((st) => {
                      const item = st.items.find((i) => i.assignment_id === currentAssignment.id);
                      const isSubmitted = item?.is_submitted ?? false;
                      const score = item?.score;

                      return (
                        <div
                          key={st.student_id}
                          className={cn(
                            'p-2 rounded-lg border text-xs flex items-center justify-between gap-2 transition-colors',
                            isSubmitted
                              ? 'bg-emerald-500/5 border-emerald-300/40'
                              : 'bg-card border-border/70',
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => setInspectStudentId(st.student_id)}
                            className="flex items-center gap-2 min-w-0 text-left hover:opacity-80"
                          >
                            <PersonAvatar
                              name={st.name}
                              photoUrl={st.photo_url}
                              size="xs"
                              className="shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">
                                {st.name}
                              </p>
                              <span className="text-[10px] text-muted-foreground">
                                เลขที่ {st.class_number ?? '-'}
                              </span>
                            </div>
                          </button>

                          <div className="flex items-center gap-2 shrink-0">
                            {score != null && (
                              <span className="text-[11px] font-bold text-emerald-700">
                                {score}/{currentAssignment.max_score ?? 10}
                              </span>
                            )}
                            <Button
                              size="sm"
                              variant={isSubmitted ? 'default' : 'outline'}
                              onClick={() =>
                                toggleMutation.mutate({
                                  assignmentId: currentAssignment.id,
                                  studentId: st.student_id,
                                  currentSubmitted: isSubmitted,
                                  maxScore: currentAssignment.max_score,
                                })
                              }
                              disabled={toggleMutation.isPending}
                              className={cn(
                                'h-7 text-[11px] px-2.5',
                                isSubmitted
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'text-muted-foreground hover:text-foreground',
                              )}
                            >
                              {isSubmitted ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                  ส่งแล้ว
                                </>
                              ) : (
                                'ติ๊กส่ง'
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ─── Tab 3: รายชื่อทั้งห้อง (Roster Overview) ─────── */}
            {activeTab === 'roster' && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="ค้นหาชื่อ หรือเลขที่..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="h-8 pl-8 text-xs"
                  />
                </div>

                <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                  {filteredRoster.map((st) => (
                    <button
                      key={st.student_id}
                      type="button"
                      onClick={() => setInspectStudentId(st.student_id)}
                      className="w-full p-2.5 rounded-lg border border-border/70 bg-card hover:bg-muted/30 transition-colors flex items-center justify-between text-left gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <PersonAvatar
                          name={st.name}
                          photoUrl={st.photo_url}
                          size="xs"
                          className="shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {st.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            เลขที่ {st.class_number ?? '-'} • {st.total_score} คะแนน
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-semibold text-foreground">
                          {st.submitted_count}/{st.total_assignments}
                        </span>
                        {st.overdue_count > 0 ? (
                          <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                            ค้าง {st.overdue_count}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-emerald-700 bg-emerald-500/10 border-emerald-300">
                            ครบ
                          </Badge>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* ─── Detail Sheet for inspecting a student's full history ─── */}
      <StudentAssignmentHistorySheet
        studentId={inspectStudentId}
        open={!!inspectStudentId}
        onOpenChange={(op) => !op && setInspectStudentId(null)}
      />
    </Card>
  );
}
