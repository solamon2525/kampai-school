import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import {
  Calendar, CheckCircle2, Clock, AlertCircle, FileText,
  Save, Trash2, ExternalLink, Loader2, Award,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { assignmentsService, type StudentSubmissionItem } from '@/services/assignments.service';
import { studentTasksService, TASK_STATUS_META, TASK_CATEGORIES, type StudentIndividualTask } from '@/services/student-tasks.service';
import { cn } from '@/lib/utils';

interface StudentAssignmentHistorySheetProps {
  studentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StudentAssignmentHistorySheet({
  studentId,
  open,
  onOpenChange,
}: StudentAssignmentHistorySheetProps) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['student-assignment-history', studentId],
    enabled: !!studentId && open,
    queryFn: () => assignmentsService.getStudentAssignmentHistory(studentId!),
  });

  const [activeHistoryTab, setActiveHistoryTab] = useState<'assignments' | 'tasks'>('assignments');

  const { data: individualTasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['student-individual-tasks', studentId],
    enabled: !!studentId && open,
    queryFn: () => studentTasksService.listByStudent(studentId!),
  });

  const incrementMissedMutation = useMutation({
    mutationFn: ({ id, delta }: { id: string; delta: number }) =>
      studentTasksService.incrementMissedCount(id, delta),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-individual-tasks', studentId] });
      qc.invalidateQueries({ queryKey: ['class-tasks-overview'] });
    },
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      studentTasksService.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-individual-tasks', studentId] });
      qc.invalidateQueries({ queryKey: ['class-tasks-overview'] });
      toast.success('อัปเดตสถานะแล้ว');
    },
  });

  const recordMutation = useMutation({
    mutationFn: (payload: {
      assignment_id: string;
      student_id: string;
      score?: number | null;
      teacher_comment?: string | null;
    }) => assignmentsService.recordStudentSubmission(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-assignment-history', studentId] });
      qc.invalidateQueries({ queryKey: ['class-submission-summary'] });
      qc.invalidateQueries({ queryKey: ['my-assignments-pending-grade'] });
      toast.success('บันทึกการส่งงานสำเร็จ');
    },
    onError: (err: Error) => toast.error(`บันทึกไม่สำเร็จ: ${err.message}`),
  });

  const removeMutation = useMutation({
    mutationFn: (payload: { assignment_id: string; student_id: string }) =>
      assignmentsService.removeStudentSubmission(payload.assignment_id, payload.student_id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-assignment-history', studentId] });
      qc.invalidateQueries({ queryKey: ['class-submission-summary'] });
      qc.invalidateQueries({ queryKey: ['my-assignments-pending-grade'] });
      toast.success('ยกเลิกรายการส่งงานแล้ว');
    },
    onError: (err: Error) => toast.error(`ยกเลิกไม่สำเร็จ: ${err.message}`),
  });

  const student = data?.student;
  const items = data?.items ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-4 sm:p-6 bg-background">
        <SheetHeader className="pb-4 border-b border-border text-left">
          <SheetTitle className="text-lg font-bold flex items-center gap-3">
            {student && (
              <PersonAvatar
                name={student.name}
                photoUrl={student.photo_url}
                size="md"
                className="shrink-0"
              />
            )}
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-foreground">
                {student?.name || 'ประวัติการส่งงาน'}
              </p>
              <p className="text-xs text-muted-foreground font-normal">
                {student ? `${student.class}${student.room ? `/${student.room}` : ''} • เลขที่ ${student.class_number ?? '-'}` : 'กำลังโหลด...'}
              </p>
            </div>
          </SheetTitle>
          <SheetDescription className="sr-only">
            รายละเอียดประวัติการส่งงานและการบ้านของนักเรียน
          </SheetDescription>

          {data && (
            <div className="grid grid-cols-3 gap-2 pt-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="text-[10px] text-emerald-700 font-medium block">ส่งแล้ว</span>
                <span className="text-base font-bold text-emerald-800">
                  {data.submitted_count}/{data.total_assignments}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-center">
                <span className="text-[10px] text-rose-700 font-medium block">ค้างงาน</span>
                <span className="text-base font-bold text-rose-800">
                  {data.overdue_count}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-center">
                <span className="text-[10px] text-primary font-medium block">คะแนนสะสม</span>
                <span className="text-base font-bold text-primary">
                  {data.total_score} <span className="text-[10px] font-normal text-muted-foreground">/{data.max_possible_score}</span>
                </span>
              </div>
            </div>
          )}
        </SheetHeader>

        {/* Tab switch between classroom assignments & individual missions */}
        <div className="pt-3 pb-1 flex items-center gap-1.5 border-b border-border">
          <button
            type="button"
            onClick={() => setActiveHistoryTab('assignments')}
            className={cn(
              'px-2.5 py-1 text-xs font-semibold rounded-md transition-colors',
              activeHistoryTab === 'assignments'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            การบ้านห้องเรียน ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveHistoryTab('tasks')}
            className={cn(
              'px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1',
              activeHistoryTab === 'tasks'
                ? 'bg-amber-600 text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            🎯 ภารกิจเฉพาะบุคคล ({individualTasks.length})
          </button>
        </div>

        {activeHistoryTab === 'tasks' ? (
          <div className="space-y-2.5 pt-3">
            {loadingTasks ? (
              <div className="py-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                กำลังโหลดภารกิจเฉพาะบุคคล...
              </div>
            ) : individualTasks.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border p-4">
                ยังไม่มีภารกิจเฉพาะบุคคลสำหรับนักเรียนคนนี้
              </div>
            ) : (
              individualTasks.map((task: StudentIndividualTask) => {
                const meta = TASK_STATUS_META[task.status as keyof typeof TASK_STATUS_META] || TASK_STATUS_META.doing;
                const cat = TASK_CATEGORIES.find((c) => c.key === task.category);
                return (
                  <div key={task.id} className="p-3 rounded-xl border border-border bg-card space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{cat?.emoji || '📌'}</span>
                          <span className="font-semibold text-foreground">{task.title}</span>
                        </div>
                        {task.notes && <p className="text-muted-foreground mt-0.5">💬 {task.notes}</p>}
                      </div>
                      <Badge variant="outline" className={cn('text-[10px] shrink-0', meta.badgeCls)}>
                        {meta.label}
                      </Badge>
                    </div>

                    <div className="pt-1.5 border-t border-border flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        {(['doing', 'pending', 'done', 'missed'] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => updateTaskStatusMutation.mutate({ id: task.id, status: st })}
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-medium border',
                              task.status === st
                                ? 'bg-primary text-primary-foreground font-bold'
                                : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                            )}
                          >
                            {TASK_STATUS_META[st].label}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-1 bg-muted/40 px-2 py-0.5 rounded border border-border text-[11px]">
                        <span className="text-muted-foreground">ขาดไป:</span>
                        <button
                          type="button"
                          onClick={() => incrementMissedMutation.mutate({ id: task.id, delta: -1 })}
                          disabled={task.missed_count <= 0}
                          className="w-4 h-4 rounded flex items-center justify-center bg-card border disabled:opacity-30"
                        >
                          -
                        </button>
                        <span className="font-bold px-1 text-rose-700">{task.missed_count}</span>
                        <span className="text-muted-foreground">ครั้ง</span>
                        <button
                          type="button"
                          onClick={() => incrementMissedMutation.mutate({ id: task.id, delta: 1 })}
                          className="w-4 h-4 rounded flex items-center justify-center bg-card border"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            กำลังโหลดประวัติการส่งงาน...
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            ยังไม่มีชิ้นงานหรือการบ้านสำหรับชั้นเรียนนี้
          </div>
        ) : (
          <div className="space-y-3 pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>รายการชิ้นงานทั้งหมด ({items.length} รายการ)</span>
            </h4>

            {items.map((item) => (
              <HistoryItemCard
                key={item.assignment_id}
                item={item}
                studentId={studentId!}
                onRecord={(score, comment) =>
                  recordMutation.mutate({
                    assignment_id: item.assignment_id,
                    student_id: studentId!,
                    score,
                    teacher_comment: comment,
                  })
                }
                onRemove={() =>
                  removeMutation.mutate({
                    assignment_id: item.assignment_id,
                    student_id: studentId!,
                  })
                }
                isMutating={recordMutation.isPending || removeMutation.isPending}
              />
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function HistoryItemCard({
  item,
  studentId: _studentId,
  onRecord,
  onRemove,
  isMutating,
}: {
  item: StudentSubmissionItem;
  studentId: string;
  onRecord: (score: number | null, comment?: string) => void;
  onRemove: () => void;
  isMutating: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [scoreVal, setScoreVal] = useState<string>(item.score != null ? String(item.score) : '');
  const [commentVal, setCommentVal] = useState<string>(item.teacher_comment ?? '');

  const dueDateFormatted = (() => {
    try {
      return format(new Date(item.due_date), 'd MMM yyyy', { locale: th });
    } catch {
      return item.due_date;
    }
  })();

  const handleSave = () => {
    const num = scoreVal.trim() !== '' ? Number(scoreVal) : null;
    onRecord(num, commentVal.trim() || undefined);
    setEditing(false);
  };

  return (
    <div
      className={cn(
        'p-3.5 rounded-xl border text-sm transition-colors space-y-2',
        item.is_submitted
          ? 'bg-card border-border hover:border-primary/40'
          : item.is_overdue
          ? 'bg-rose-500/5 border-rose-300/60'
          : 'bg-muted/30 border-border',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {item.subject && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {item.subject}
              </Badge>
            )}
            <h5 className="font-semibold text-foreground text-sm truncate">
              {item.assignment_title}
            </h5>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" /> กำหนดส่ง {dueDateFormatted}
            </span>
            {item.max_score != null && (
              <span className="inline-flex items-center gap-1">
                <Award className="w-3 h-3" /> เต็ม {item.max_score} คะแนน
              </span>
            )}
          </div>
        </div>

        <div>
          {item.is_submitted ? (
            <Badge variant="default" className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {item.score != null ? `${item.score}/${item.max_score ?? '-'}` : 'ส่งแล้ว'}
            </Badge>
          ) : item.is_overdue ? (
            <Badge variant="destructive" className="text-[10px] shrink-0">
              <AlertCircle className="w-3 h-3 mr-1" /> ค้างงาน
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px] shrink-0">
              <Clock className="w-3 h-3 mr-1" /> รอส่ง
            </Badge>
          )}
        </div>
      </div>

      {item.attachment_url && (
        <div className="pt-1">
          <a
            href={item.attachment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
          >
            <ExternalLink className="w-3 h-3" /> ดูใบงานประกอบ
          </a>
        </div>
      )}

      {item.teacher_comment && !editing && (
        <p className="text-xs text-muted-foreground bg-muted/40 p-2 rounded-md">
          💬 ครู: {item.teacher_comment}
        </p>
      )}

      {/* Editing / Quick grading panel */}
      {editing ? (
        <div className="pt-2 border-t border-border space-y-2">
          <div className="grid grid-cols-[80px_1fr] gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground block mb-0.5">คะแนน</label>
              <Input
                type="number"
                min="0"
                max={item.max_score ?? 100}
                placeholder={`/${item.max_score ?? 10}`}
                value={scoreVal}
                onChange={(e) => setScoreVal(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground block mb-0.5">ความเห็นครู</label>
              <Input
                placeholder="เช่น ส่งตรงเวลา ลายมือเรียบร้อย"
                value={commentVal}
                onChange={(e) => setCommentVal(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(false)}>
              ยกเลิก
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSave} disabled={isMutating}>
              <Save className="w-3 h-3 mr-1" /> บันทึก
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-border/60">
          {item.is_submitted ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => setEditing(true)}
              >
                แก้ไขคะแนน
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-destructive hover:bg-destructive/10"
                onClick={onRemove}
                disabled={isMutating}
                title="ยกเลิกการส่ง"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="default"
              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => {
                onRecord(item.max_score ?? 10, 'ส่งงานในชั้นเรียน');
              }}
              disabled={isMutating}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              บันทึกว่าส่งแล้ว
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
