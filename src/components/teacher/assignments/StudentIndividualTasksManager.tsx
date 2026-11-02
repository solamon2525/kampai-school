import { useState, useMemo, useEffect } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import {
  Target, Plus, CheckCircle2, Clock, AlertTriangle, XCircle,
  Trash2, ChevronRight, Search, Users, Calendar,
  Sparkles, Loader2, Minus, FileText, Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import {
  studentTasksService,
  TASK_STATUS_META,
  TASK_CATEGORIES,
  type TaskStatus,
  type TaskCategory,
  type StudentIndividualTask,
} from '@/services/student-tasks.service';
import { cn } from '@/lib/utils';

const DEFAULT_CLASSES = ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];

const QUICK_TEMPLATES: Array<{
  title: string;
  category: TaskCategory;
  emoji: string;
}> = [
  { title: 'แบบฝึกหัดซ่อมเสริมคณิตศาสตร์', category: 'remediation', emoji: '🎯' },
  { title: 'ส่งสมุดคัดคำศัพท์ภาษาอังกฤษ', category: 'assignment', emoji: '📗' },
  { title: 'ท่องบทอาขยานภาษาไทย', category: 'assignment', emoji: '📙' },
  { title: 'เวรทำความสะอาดประจำวัน', category: 'duty', emoji: '🧹' },
  { title: 'ใบงานวิทยาศาสตร์และเทคโนโลยี', category: 'assignment', emoji: '🔬' },
  { title: 'โครงงาน/ชิ้นงานสร้างสรรค์', category: 'project', emoji: '🎨' },
];

interface StudentIndividualTasksManagerProps {
  initialClass?: string;
  initialStudentId?: string | null;
  className?: string;
  isCompact?: boolean;
}

export function StudentIndividualTasksManager({
  initialClass = 'ป.4',
  initialStudentId = null,
  className,
  isCompact: _isCompact = false,
}: StudentIndividualTasksManagerProps) {
  const qc = useQueryClient();
  const [selectedClass, setSelectedClass] = useState<string>(initialClass);
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(initialStudentId);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<TaskCategory>('assignment');
  const [newStatus, setNewStatus] = useState<TaskStatus>('doing');
  const [newDueDate, setNewDueDate] = useState<string>(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
  );
  const [newMissedCount, setNewMissedCount] = useState<number>(0);
  const [newNotes, setNewNotes] = useState('');
  const [assignTarget, setAssignTarget] = useState<'single' | 'class'>('single');

  // 1. ดึงภาพรวมภารกิจทั้งห้อง
  const roomParam = selectedRoom === 'all' ? null : selectedRoom;
  const { data: classOverview = [], isLoading: loadingClass } = useQuery({
    queryKey: ['class-tasks-overview', selectedClass, roomParam],
    queryFn: () => studentTasksService.getClassTasksOverview(selectedClass, roomParam),
  });

  // Auto-select first student if none selected
  useEffect(() => {
    if (classOverview.length > 0 && !selectedStudentId) {
      setSelectedStudentId(classOverview[0].student_id);
    }
  }, [classOverview, selectedStudentId]);

  // Active student summary
  const currentStudent = useMemo(() => {
    if (!selectedStudentId) return classOverview[0] ?? null;
    return classOverview.find((s) => s.student_id === selectedStudentId) ?? classOverview[0] ?? null;
  }, [classOverview, selectedStudentId]);

  // Tasks for current student
  const activeTasks = useMemo(() => currentStudent?.tasks ?? [], [currentStudent?.tasks]);

  // Filtered tasks
  const displayedTasks = useMemo(() => {
    if (statusFilter === 'all') return activeTasks;
    return activeTasks.filter((t) => t.status === statusFilter);
  }, [activeTasks, statusFilter]);

  // Filtered student list for picker
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return classOverview;
    const q = searchQuery.trim().toLowerCase();
    return classOverview.filter(
      (s) =>
        s.student_name.toLowerCase().includes(q) ||
        (s.student_code && s.student_code.includes(q)) ||
        (s.class_number && String(s.class_number) === q),
    );
  }, [classOverview, searchQuery]);

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      studentTasksService.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['class-tasks-overview', selectedClass, roomParam] });
      toast.success('อัปเดตสถานะภารกิจแล้ว');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const incrementMissedMutation = useMutation({
    mutationFn: ({ id, delta }: { id: string; delta: number }) =>
      studentTasksService.incrementMissedCount(id, delta),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['class-tasks-overview', selectedClass, roomParam] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => studentTasksService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['class-tasks-overview', selectedClass, roomParam] });
      toast.success('ลบภารกิจแล้ว');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!newTitle.trim()) throw new Error('กรุณาระบุชื่องาน');
      if (assignTarget === 'single') {
        if (!currentStudent) throw new Error('กรุณาเลือกนักเรียน');
        await studentTasksService.create({
          student_id: currentStudent.student_id,
          title: newTitle,
          description: newDesc || null,
          category: newCategory,
          status: newStatus,
          due_date: newDueDate || null,
          missed_count: newMissedCount,
          notes: newNotes || null,
        });
      } else {
        const studentIds = classOverview.map((s) => s.student_id);
        await studentTasksService.batchCreate(studentIds, {
          title: newTitle,
          description: newDesc || null,
          category: newCategory,
          status: newStatus,
          due_date: newDueDate || null,
          missed_count: newMissedCount,
          notes: newNotes || null,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['class-tasks-overview', selectedClass, roomParam] });
      setAddDialogOpen(false);
      resetForm();
      toast.success(
        assignTarget === 'single'
          ? 'เพิ่มภารกิจให้นักเรียนแล้ว'
          : `มอบหมายภารกิจให้นักเรียนทั้งห้อง (${classOverview.length} คน) สำเร็จ`,
      );
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const resetForm = () => {
    setNewTitle('');
    setNewDesc('');
    setNewCategory('assignment');
    setNewStatus('doing');
    setNewMissedCount(0);
    setNewNotes('');
    setAssignTarget('single');
  };

  const applyTemplate = (tmpl: (typeof QUICK_TEMPLATES)[0]) => {
    setNewTitle(tmpl.title);
    setNewCategory(tmpl.category);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* ─── Top Control Strip ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-medium">ชั้น:</span>
            <Select value={selectedClass} onValueChange={(cls) => {
              setSelectedClass(cls);
              setSelectedStudentId(null);
            }}>
              <SelectTrigger className="h-8 w-24 text-xs font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_CLASSES.map((c) => (
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
                <SelectItem value="all" className="text-xs">ทั้งหมด</SelectItem>
                <SelectItem value="1" className="text-xs">ห้อง 1</SelectItem>
                <SelectItem value="2" className="text-xs">ห้อง 2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative w-40 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="ค้นหานักเรียน..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => setAddDialogOpen(true)}
          className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1.5 self-end sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          มอบหมายภารกิจ
        </Button>
      </div>

      {/* ─── Student Horizontal Selector (เลือกนักเรียนจากระบบ) ── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-primary" />
            เลือกนักเรียนในชั้น {selectedClass} ({classOverview.length} คน)
          </span>
          <span className="text-[11px]">แตะเลือกเพื่อดูภารกิจรายคน</span>
        </div>

        {loadingClass ? (
          <div className="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            กำลังโหลดรายชื่อนักเรียน...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
            ไม่พบนักเรียนในชั้นนี้
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
            {filteredStudents.map((st) => {
              const isSelected = currentStudent?.student_id === st.student_id;
              const hasAlert = st.pending_count > 0 || st.missed_count > 0;

              return (
                <button
                  key={st.student_id}
                  type="button"
                  onClick={() => setSelectedStudentId(st.student_id)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all shrink-0 w-28 text-center',
                    isSelected
                      ? 'border-primary bg-primary/10 ring-2 ring-primary ring-offset-1'
                      : 'border-border bg-card hover:bg-muted/40',
                  )}
                >
                  <div className="relative">
                    <PersonAvatar
                      name={st.student_name}
                      photoUrl={st.photo_url}
                      size="md"
                      className="h-12 w-12 rounded-xl"
                    />
                    {hasAlert && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center shadow">
                        {st.pending_count + (st.missed_count > 0 ? 1 : 0)}
                      </span>
                    )}
                  </div>
                  <div className="w-full min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {st.student_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      เลขที่ {st.class_number ?? '-'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Selected Student Profile & 4 Stat Tiles ───────────── */}
      {currentStudent && (
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
              <div className="flex items-center gap-3">
                <PersonAvatar
                  name={currentStudent.student_name}
                  photoUrl={currentStudent.photo_url}
                  size="lg"
                  className="h-14 w-14 rounded-xl shrink-0"
                />
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                    {currentStudent.student_name}
                    <Badge variant="outline" className="text-xs font-normal">
                      เลขที่ {currentStudent.class_number ?? '-'}
                    </Badge>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {currentStudent.class}{currentStudent.room ? `/${currentStudent.room}` : ''}
                    {currentStudent.student_code && ` • รหัส ${currentStudent.student_code}`}
                  </p>
                </div>
              </div>

              {/* 4 Stat Boxes (เสร็จแล้ว, ทำอยู่, งานค้าง, ขาดไปกี่ครั้ง) */}
              <div className="grid grid-cols-4 gap-2 sm:flex sm:items-center">
                <div className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <span className="text-[10px] text-emerald-700 font-semibold block leading-tight">
                    เสร็จแล้ว
                  </span>
                  <span className="text-base font-extrabold text-emerald-800">
                    {currentStudent.done_count}
                  </span>
                </div>

                <div className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                  <span className="text-[10px] text-amber-700 font-semibold block leading-tight">
                    ทำอยู่
                  </span>
                  <span className="text-base font-extrabold text-amber-800">
                    {currentStudent.doing_count}
                  </span>
                </div>

                <div className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-center">
                  <span className="text-[10px] text-orange-700 font-semibold block leading-tight">
                    งานค้าง
                  </span>
                  <span className="text-base font-extrabold text-orange-800">
                    {currentStudent.pending_count}
                  </span>
                </div>

                <div className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-center ring-1 ring-rose-400/30">
                  <span className="text-[10px] text-rose-700 font-bold block leading-tight">
                    ขาดกี่ครั้ง
                  </span>
                  <span className="text-base font-extrabold text-rose-800">
                    {currentStudent.missed_count}
                  </span>
                </div>
              </div>
            </div>

            {/* ─── Task Filter Tabs & Count ─────────────────────── */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-foreground">
                  ภารกิจ ({activeTasks.length})
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={cn(
                      'px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors',
                      statusFilter === 'all'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground',
                    )}
                  >
                    ทั้งหมด
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('doing')}
                    className={cn(
                      'px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors',
                      statusFilter === 'doing'
                        ? 'bg-amber-600 text-white'
                        : 'bg-muted text-muted-foreground hover:text-foreground',
                    )}
                  >
                    ทำอยู่ ({currentStudent.doing_count})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('pending')}
                    className={cn(
                      'px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors',
                      statusFilter === 'pending'
                        ? 'bg-orange-600 text-white'
                        : 'bg-muted text-muted-foreground hover:text-foreground',
                    )}
                  >
                    งานค้าง ({currentStudent.pending_count})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('done')}
                    className={cn(
                      'px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors',
                      statusFilter === 'done'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-muted text-muted-foreground hover:text-foreground',
                    )}
                  >
                    เสร็จ ({currentStudent.done_count})
                  </button>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddDialogOpen(true)}
                className="h-7 text-xs gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> เพิ่มงานให้นักเรียนคนนี้
              </Button>
            </div>

            {/* ─── Task Cards List ──────────────────────────────── */}
            {displayedTasks.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border p-6 space-y-2">
                <Target className="w-8 h-8 text-muted-foreground/50 mx-auto" />
                <p className="font-semibold text-foreground">
                  {statusFilter === 'all'
                    ? 'ยังไม่มีภารกิจสำหรับนักเรียนคนนี้'
                    : `ไม่มีภารกิจในสถานะนี้`}
                </p>
                <p className="text-muted-foreground">
                  กดปุ่ม "มอบหมายภารกิจ" ด้านบนเพื่อเพิ่มงานหรือภารกิจแรก
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {displayedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={(newSt) =>
                      updateStatusMutation.mutate({ id: task.id, status: newSt })
                    }
                    onMissedChange={(delta) =>
                      incrementMissedMutation.mutate({ id: task.id, delta })
                    }
                    onDelete={() => deleteMutation.mutate(task.id)}
                    isMutating={
                      updateStatusMutation.isPending ||
                      incrementMissedMutation.isPending ||
                      deleteMutation.isPending
                    }
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Add Task Dialog ─────────────────────────────────── */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md bg-background">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              มอบหมายภารกิจ / บันทึกงานใหม่
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 pt-1 text-sm">
            {/* Quick Templates */}
            <div>
              <Label className="text-xs text-muted-foreground block mb-1.5">
                ⚡ เลือกจากแม่แบบด่วน:
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.title}
                    type="button"
                    onClick={() => applyTemplate(tmpl)}
                    className="px-2 py-1 rounded-md bg-muted hover:bg-primary/10 hover:text-primary text-[11px] border border-border transition-colors text-left flex items-center gap-1"
                  >
                    <span>{tmpl.emoji}</span>
                    <span className="truncate max-w-[150px]">{tmpl.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Assignment */}
            <div className="space-y-1">
              <Label className="text-xs">เป้าหมายการมอบหมาย:</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAssignTarget('single')}
                  className={cn(
                    'p-2 rounded-lg border text-xs font-semibold text-center transition-colors',
                    assignTarget === 'single'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground',
                  )}
                >
                  เฉพาะ {currentStudent?.student_name || 'คนนี้'}
                </button>
                <button
                  type="button"
                  onClick={() => setAssignTarget('class')}
                  className={cn(
                    'p-2 rounded-lg border text-xs font-semibold text-center transition-colors',
                    assignTarget === 'class'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground',
                  )}
                >
                  ทั้งห้อง {selectedClass} ({classOverview.length} คน)
                </button>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">ชื่องาน / ภารกิจ *</Label>
              <Input
                placeholder="เช่น ส่งสมุดคณิตศาสตร์ หน้า 24"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {/* Category & Status */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">ประเภทงาน:</Label>
                <Select
                  value={newCategory}
                  onValueChange={(v) => setNewCategory(v as TaskCategory)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_CATEGORIES.map((c) => (
                      <SelectItem key={c.key} value={c.key} className="text-xs">
                        {c.emoji} {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">สถานะเริ่มต้น:</Label>
                <Select
                  value={newStatus}
                  onValueChange={(v) => setNewStatus(v as TaskStatus)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doing" className="text-xs">🟡 กำลังทำอยู่</SelectItem>
                    <SelectItem value="pending" className="text-xs">🟠 งานค้าง</SelectItem>
                    <SelectItem value="done" className="text-xs">🟢 สำเร็จแล้ว</SelectItem>
                    <SelectItem value="missed" className="text-xs">🔴 ขาดส่ง</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Due Date & Initial Missed Count */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">กำหนดส่ง:</Label>
                <Input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">ขาดไปกี่ครั้ง (เริ่มต้น):</Label>
                <Input
                  type="number"
                  min="0"
                  value={newMissedCount}
                  onChange={(e) => setNewMissedCount(Number(e.target.value) || 0)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label className="text-xs">หมายเหตุ/ข้อคิดเห็นครู:</Label>
              <Textarea
                rows={2}
                placeholder="เช่น ข้อ 3-5 ให้แสดงวิธีทำละเอียด"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddDialogOpen(false)}
              className="text-xs"
            >
              ยกเลิก
            </Button>
            <Button
              size="sm"
              onClick={() => createMutation.mutate()}
              disabled={!newTitle.trim() || createMutation.isPending}
              className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              บันทึกภารกิจ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Task Card Component (with 1-click status pill and missed count stepper)
// ─────────────────────────────────────────────────────────────────────────────
function TaskCard({
  task,
  onStatusChange,
  onMissedChange,
  onDelete,
  isMutating,
}: {
  task: StudentIndividualTask;
  onStatusChange: (status: TaskStatus) => void;
  onMissedChange: (delta: number) => void;
  onDelete: () => void;
  isMutating: boolean;
}) {
  const meta = TASK_STATUS_META[task.status];
  const catObj = TASK_CATEGORIES.find((c) => c.key === task.category);

  const formattedDate = (() => {
    if (!task.due_date) return null;
    try {
      return format(new Date(task.due_date), 'd MMM yyyy', { locale: th });
    } catch {
      return task.due_date;
    }
  })();

  return (
    <div
      className={cn(
        'p-3 sm:p-3.5 rounded-xl border text-sm transition-all space-y-2.5 bg-card',
        task.status === 'done'
          ? 'border-emerald-200 bg-emerald-500/5'
          : task.status === 'pending'
          ? 'border-orange-300 bg-orange-500/5'
          : task.status === 'missed'
          ? 'border-rose-300 bg-rose-500/5'
          : 'border-border hover:border-primary/40',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs">{catObj?.emoji ?? '📌'}</span>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
              {catObj?.label ?? 'งานทั่วไป'}
            </Badge>
            <h4 className="font-semibold text-foreground text-sm truncate">
              {task.title}
            </h4>
          </div>

          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5 flex-wrap">
            {formattedDate && (
              <span className="inline-flex items-center gap-1 text-[11px]">
                <Calendar className="w-3 h-3" /> ครบกำหนด {formattedDate}
              </span>
            )}
            {task.notes && (
              <span className="text-[11px] text-muted-foreground italic truncate max-w-xs">
                💬 {task.notes}
              </span>
            )}
          </div>
        </div>

        {/* Current status badge */}
        <Badge
          variant="outline"
          className={cn('text-[11px] font-semibold py-0.5 px-2 shrink-0', meta.badgeCls)}
        >
          {meta.label}
        </Badge>
      </div>

      {/* ─── Action Controls: 1-Click Status Bar + Missed Stepper ─ */}
      <div className="pt-2 border-t border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        {/* 1-Click Status Selector */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[11px] text-muted-foreground font-medium mr-1">สถานะ:</span>
          {(['doing', 'pending', 'done', 'missed'] as TaskStatus[]).map((st) => {
            const isCurrent = task.status === st;
            const stMeta = TASK_STATUS_META[st];

            return (
              <button
                key={st}
                type="button"
                onClick={() => onStatusChange(st)}
                disabled={isMutating}
                className={cn(
                  'px-2 py-0.5 rounded-md text-[11px] font-medium border transition-all flex items-center gap-1',
                  isCurrent
                    ? cn('font-bold ring-1 ring-offset-0', stMeta.badgeCls)
                    : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted',
                )}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full', stMeta.dotCls)} />
                {stMeta.label}
              </button>
            );
          })}
        </div>

        {/* Missed Counter Stepper ("ขาดไปกี่ครั้ง") */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center gap-1 bg-muted/30 px-2 py-1 rounded-lg border border-border">
            <span className="text-[11px] font-medium text-muted-foreground">ขาดไป:</span>
            <button
              type="button"
              onClick={() => onMissedChange(-1)}
              disabled={isMutating || task.missed_count <= 0}
              className="w-5 h-5 rounded flex items-center justify-center bg-card border border-border hover:bg-muted text-foreground disabled:opacity-30 transition-colors"
              title="ลดจำนวนครั้งที่ขาด"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span
              className={cn(
                'min-w-6 text-center text-xs font-bold px-1',
                task.missed_count > 0 ? 'text-rose-700 font-extrabold' : 'text-foreground',
              )}
            >
              {task.missed_count}
            </span>
            <span className="text-[10px] text-muted-foreground">ครั้ง</span>
            <button
              type="button"
              onClick={() => onMissedChange(1)}
              disabled={isMutating}
              className="w-5 h-5 rounded flex items-center justify-center bg-card border border-border hover:bg-muted text-foreground transition-colors"
              title="เพิ่มจำนวนครั้งที่ขาด"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <button
            type="button"
            onClick={onDelete}
            disabled={isMutating}
            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="ลบภารกิจนี้"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
