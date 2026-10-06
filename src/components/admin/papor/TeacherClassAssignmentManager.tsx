/**
 * TeacherClassAssignmentManager.tsx
 * แผงบริหารจัดการมอบหมายครูประจำชั้นและครูสอนควบ (Admin Homeroom & Multi-Grade Management)
 * - แสดงภาพรวมการจัดครูประจำชั้นระดับประถมศึกษา (ป.1 - ป.6)
 * - รองรับกรณีครู 1 คน สอนควบหลายชั้นเรียน (Multi-Grade Teaching เช่น ป.1-2, ป.3-4, ป.5-6)
 * - ป้ายสถานะสอนควบคำนวณและแสดงผลอัตโนมัติ ไม่ขัดแย้งกับแบนเนอร์ (Zero Contradictory State)
 * - ป้องกันการเกิดแถวซ้ำซ้อนในฐานข้อมูล (Clean Overwrite & Unique Primary Homeroom)
 * - หน้าต่าง Modal รองรับการเลือกหลายห้องเรียนพร้อมกัน (Multi-Class Selection)
 * - เชื่อมโยงรูปภาพและชื่อครูผ่าน <PersonAvatar> ตาม DESIGN.md Rule 14.13
 * - มีเครื่องมือ 1-Click Auto-Pair Multi-Grade และ 1-Click Clean & Sync
 */
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { cn } from '@/lib/utils';
import {
  Users,
  GraduationCap,
  Layers,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Calendar,
  Sparkles,
  RefreshCw,
  Info,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { staffService } from '@/services/staff.service';
import {
  teacherClassAssignmentService,
  type TeacherClassAssignmentRow,
} from '@/services/teacher-class-assignment.service';

interface Props {
  academicYear?: string;
  onYearChange?: (year: string) => void;
}

const PRIMARY_CLASSES = ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];

const MULTI_GRADE_PRESETS = [
  { label: 'ป.1 ควบ ป.2', classes: ['ป.1', 'ป.2'] },
  { label: 'ป.3 ควบ ป.4', classes: ['ป.3', 'ป.4'] },
  { label: 'ป.5 ควบ ป.6', classes: ['ป.5', 'ป.6'] },
];

export const TeacherClassAssignmentManager: React.FC<Props> = ({
  academicYear = '2568',
}) => {
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState<string>(academicYear);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<TeacherClassAssignmentRow | null>(null);

  React.useEffect(() => {
    if (academicYear) {
      setSelectedYear(academicYear);
    }
  }, [academicYear]);

  // Form State for Dialog
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>(['ป.1']);
  const [notes, setNotes] = useState<string>('');

  // 1. Fetch Assignments
  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ['teacher-class-assignments', selectedYear],
    queryFn: () => teacherClassAssignmentService.listAssignments(selectedYear),
    staleTime: 30_000,
  });

  // 2. Fetch Teachers
  const { data: teachers = [] } = useQuery({
    queryKey: ['staff-teachers'],
    queryFn: async () => {
      const res = await staffService.getTeachers();
      const list = (res.data as any[]) || [];
      return list.map((t) => ({
        ...t,
        name: (t.name || '').trim(),
      }));
    },
    staleTime: 60_000,
  });

  // Map assignments by class name (1 class -> 1 assignment)
  const assignmentByClass = useMemo(() => {
    const map: Record<string, TeacherClassAssignmentRow> = {};
    assignments.forEach((a) => {
      map[a.class_name] = a;
    });
    return map;
  }, [assignments]);

  // Map classes assigned to each teacher: teacher_id -> string[]
  const classesByTeacherId = useMemo(() => {
    const map: Record<string, string[]> = {};
    assignments.forEach((a) => {
      if (!map[a.teacher_id]) map[a.teacher_id] = [];
      if (!map[a.teacher_id].includes(a.class_name)) {
        map[a.teacher_id].push(a.class_name);
      }
    });
    return map;
  }, [assignments]);

  // Teachers teaching multiple classes (Distinct and accurate)
  const multiGradeTeachers = useMemo(() => {
    const map: Record<string, { teacherName: string; photoUrl: string | null; classes: string[] }> = {};
    assignments.forEach((a) => {
      const name = a.teacher?.name || 'ไม่ทราบชื่อ';
      if (!map[a.teacher_id]) {
        map[a.teacher_id] = {
          teacherName: name,
          photoUrl: a.teacher?.photo_url || null,
          classes: [],
        };
      }
      if (!map[a.teacher_id].classes.includes(a.class_name)) {
        map[a.teacher_id].classes.push(a.class_name);
      }
    });

    return Object.values(map)
      .filter((t) => t.classes.length > 1)
      .map((t) => ({
        ...t,
        classes: t.classes.sort(),
      }));
  }, [assignments]);

  // Helper to invalidate queries after changes
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['teacher-class-assignments'] });
    queryClient.invalidateQueries({ queryKey: ['papor-homeroom-teacher'] });
    queryClient.invalidateQueries({ queryKey: ['class-homeroom-teacher'] });
    queryClient.invalidateQueries({ queryKey: ['teacher-assigned-classes'] });
  };

  // Save Mutation (Multi-Class Support & Safe Overwrite)
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTeacherId || selectedClasses.length === 0) {
        throw new Error('กรุณาเลือกคุณครูและระดับชั้นเรียนอย่างน้อย 1 ห้อง');
      }

      await teacherClassAssignmentService.assignMultiGrade({
        academic_year: selectedYear,
        teacher_id: selectedTeacherId,
        class_names: selectedClasses,
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success(`บันทึกการมอบหมายชั้นเรียน (${selectedClasses.join(', ')}) เรียบร้อยแล้ว`);
      setIsDialogOpen(false);
      resetForm();
      invalidateAll();
    },
    onError: (err: any) => {
      toast.error(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ id, className }: { id: string; className: string }) => {
      await teacherClassAssignmentService.removeAssignment(id, selectedYear);
    },
    onSuccess: () => {
      toast.success('ยกเลิกการมอบหมายเรียบร้อยแล้ว');
      invalidateAll();
    },
    onError: (err: any) => {
      toast.error(err.message || 'เกิดข้อผิดพลาดในการยกเลิก');
    },
  });

  // 1-Click Standard Preset Mutation
  const applyStandardMutation = useMutation({
    mutationFn: async () => {
      await teacherClassAssignmentService.applyStandardPreset(selectedYear);
    },
    onSuccess: () => {
      toast.success('จัดโครงสร้างครูสอนควบมาตรฐาน 3 คู่ (ป.1-2, ป.3-4, ป.5-6) สำเร็จแล้ว');
      invalidateAll();
    },
    onError: (err: any) => {
      toast.error(err.message || 'เกิดข้อผิดพลาดในการจัดโครงสร้างมาตรฐาน');
    },
  });

  // 1-Click Auto-Sync Mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      await teacherClassAssignmentService.syncMultiGradeFlags(selectedYear);
    },
    onSuccess: () => {
      toast.success('จัดระเบียบข้อมูลและสถานะสอนควบเรียบร้อยแล้ว');
      invalidateAll();
    },
    onError: (err: any) => {
      toast.error(err.message || 'เกิดข้อผิดพลาดในการจัดระเบียบข้อมูล');
    },
  });

  const resetForm = () => {
    setEditingAssignment(null);
    setSelectedTeacherId('');
    setSelectedClasses(['ป.1']);
    setNotes('');
  };

  const handleOpenAdd = (className?: string) => {
    resetForm();
    if (className) {
      setSelectedClasses([className]);
    }
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (assignment: TeacherClassAssignmentRow) => {
    setEditingAssignment(assignment);
    setSelectedTeacherId(assignment.teacher_id);

    // If teacher already teaches multiple classes, pre-select all classes of this teacher
    const teacherClasses = classesByTeacherId[assignment.teacher_id] || [assignment.class_name];
    setSelectedClasses(teacherClasses);

    setNotes(assignment.notes || '');
    setIsDialogOpen(true);
  };

  const toggleClass = (cls: string) => {
    setSelectedClasses((prev) => {
      if (prev.includes(cls)) {
        if (prev.length === 1) return prev; // Keep at least one class
        return prev.filter((c) => c !== cls);
      } else {
        return [...prev, cls].sort();
      }
    });
  };

  const applyClassPreset = (presetClasses: string[]) => {
    setSelectedClasses(presetClasses);
  };

  // Check if any selected class currently belongs to another teacher
  const conflictingClasses = useMemo(() => {
    if (!selectedTeacherId) return [];
    return selectedClasses
      .map((cls) => {
        const existing = assignmentByClass[cls];
        if (existing && existing.teacher_id !== selectedTeacherId) {
          return {
            className: cls,
            currentTeacherName: existing.teacher?.name || 'ครูท่านอื่น',
          };
        }
        return null;
      })
      .filter(Boolean) as Array<{ className: string; currentTeacherName: string }>;
  }, [selectedClasses, selectedTeacherId, assignmentByClass]);

  // Count assigned classes
  const assignedCount = Object.keys(assignmentByClass).length;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <GraduationCap className="w-5 h-5 text-primary" />
                <CardTitle className="text-xl">
                  ระบบจัดครูประจำชั้นและครูสอนควบ (Homeroom Management)
                </CardTitle>
                <Badge variant="secondary" className="font-mono text-xs">
                  ปีการศึกษา {selectedYear}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs font-medium',
                    assignedCount === 6
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  )}
                >
                  จัดแล้ว {assignedCount}/6 ห้องเรียน
                </Badge>
              </div>
              <CardDescription className="mt-1">
                กำหนดครูประจำชั้น ป.1 - ป.6 เพื่อควบคุมสิทธิ์การออกเกรดในพอร์ทัลครู และใส่ชื่อครูในใบ ปพ. อัตโนมัติ
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-md border border-border">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground ml-2" />
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-24 h-8 text-xs border-none bg-transparent shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2568">2568</SelectItem>
                    <SelectItem value="2569">2569</SelectItem>
                    <SelectItem value="2570">2570</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sync Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                className="gap-1.5 text-xs h-8 border-border hover:bg-muted"
                title="จัดระเบียบข้อมูลและปรับสถานะสอนควบให้ตรงกับความเป็นจริง"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', syncMutation.isPending && 'animate-spin')} />
                <span className="hidden sm:inline">จัดระเบียบข้อมูล</span>
              </Button>

              {/* 1-Click Preset Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (
                    window.confirm(
                      'ยืนยันจัดโครงสร้างครูสอนควบมาตรฐาน 3 คู่ (ป.1-2, ป.3-4, ป.5-6)? ข้อมูลเดิมของปีนี้จะถูกจัดสรรตามมาตรฐานโรงเรียนขนาดเล็ก'
                    )
                  ) {
                    applyStandardMutation.mutate();
                  }
                }}
                disabled={applyStandardMutation.isPending}
                className="gap-1.5 text-xs h-8 border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100/60"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>จัดมาตรฐาน 3 คู่</span>
              </Button>

              <Button onClick={() => handleOpenAdd()} size="sm" className="gap-2 text-xs font-semibold h-8">
                <Plus className="w-4 h-4" /> เพิ่มการมอบหมาย
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Multi-Grade Teaching Notice Callout */}
      {multiGradeTeachers.length > 0 && (
        <Card className="border-indigo-200 bg-indigo-50/40">
          <CardContent className="p-4 flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5 sm:mt-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="text-xs text-indigo-950 space-y-1 flex-1">
              <div className="font-bold flex items-center gap-2 flex-wrap">
                <span>ครูผู้สอนควบชั้นเรียน (Multi-Grade Teaching)</span>
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 text-[10px] py-0">
                  {multiGradeTeachers.length} ท่าน
                </Badge>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-indigo-800">
                {multiGradeTeachers.map((t) => (
                  <span key={t.teacherName} className="inline-flex items-center gap-1 font-medium">
                    • <strong>{t.teacherName}</strong> (สอนควบ {t.classes.join(' และ ')})
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Class Assignments Grid (ป.1 - ป.6) */}
      {loadingAssignments ? (
        <div className="p-16 text-center space-y-3 bg-card border border-border rounded-xl">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูลการมอบหมายครูประจำชั้น...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRIMARY_CLASSES.map((className) => {
            const assignment = assignmentByClass[className];
            const teacher = assignment?.teacher;

            // Compute multi-grade status dynamically based on current assignments
            const teacherAssignedClasses = assignment
              ? classesByTeacherId[assignment.teacher_id] || [assignment.class_name]
              : [];
            const isMultiGrade = teacherAssignedClasses.length > 1;
            const siblingClasses = teacherAssignedClasses.filter((c) => c !== className);

            // Intelligent note display
            const displayNote = assignment?.notes
              ? assignment.notes
              : isMultiGrade
              ? `สอนควบชั้น ${teacherAssignedClasses.sort().join(' และ ')}`
              : `ครูประจำชั้น ${className}`;

            return (
              <Card
                key={className}
                className={cn(
                  'border-border bg-card transition-all hover:shadow-md relative overflow-hidden flex flex-col justify-between',
                  !assignment && 'border-dashed border-amber-300/80 bg-amber-50/20'
                )}
              >
                <div>
                  {/* Accent Top Bar */}
                  <div
                    className={cn(
                      'h-1.5 w-full',
                      isMultiGrade ? 'bg-indigo-500' : assignment ? 'bg-primary' : 'bg-amber-400'
                    )}
                  />

                  <CardContent className="p-4 space-y-3">
                    {/* Class Badge & Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-base text-foreground">ชั้น {className}</span>
                        <span className="text-xs text-muted-foreground font-light">
                          (ประถมศึกษาปีที่ {className.replace('ป.', '')})
                        </span>
                      </div>

                      {assignment ? (
                        isMultiGrade ? (
                          <Badge
                            variant="outline"
                            className="text-indigo-700 bg-indigo-50 border-indigo-200 gap-1 text-[11px] font-semibold"
                            title={`สอนควบร่วมกับห้อง ${siblingClasses.join(', ')}`}
                          >
                            <Layers className="w-3 h-3 text-indigo-600" /> สอนควบ ({teacherAssignedClasses.sort().join(', ')})
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-emerald-700 bg-emerald-50 border-emerald-200 gap-1 text-[11px] font-semibold"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ประจำชั้นหลัก
                          </Badge>
                        )
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-amber-700 bg-amber-50 border-amber-300 gap-1 text-[11px] font-semibold"
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-600" /> ยังไม่จัดครู
                        </Badge>
                      )}
                    </div>

                    {/* Teacher Profile / Empty State */}
                    {assignment && teacher ? (
                      <div className="p-3 bg-muted/40 rounded-lg border border-border flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <PersonAvatar
                            name={teacher.name}
                            photoUrl={teacher.photo_url}
                            className="w-11 h-11 rounded-full border border-border shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-foreground truncate">{teacher.name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {teacher.position || 'ครูผู้สอน'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(assignment)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="แก้ไขการมอบหมาย"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (window.confirm(`ยืนยันยกเลิกครูประจำชั้น ${className}?`)) {
                                deleteMutation.mutate({ id: assignment.id, className });
                              }
                            }}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            title="ยกเลิกการมอบหมาย"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 border border-dashed border-border rounded-lg text-center space-y-2">
                        <Users className="w-7 h-7 mx-auto text-muted-foreground/60" />
                        <p className="text-xs text-muted-foreground">ยังไม่มีการระบุครูประจำชั้นสำหรับห้องนี้</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAdd(className)}
                          className="text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10 h-7 font-medium"
                        >
                          <Plus className="w-3 h-3" /> มอบหมายครูประจำชั้น
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </div>

                {/* Notes / Multi-grade info Footer */}
                {assignment && (
                  <div className="px-4 pb-3">
                    <div
                      className={cn(
                        'text-[11px] px-2.5 py-1.5 rounded border truncate',
                        isMultiGrade
                          ? 'bg-indigo-50/50 text-indigo-900 border-indigo-100'
                          : 'bg-muted/30 text-muted-foreground border-border/50'
                      )}
                    >
                      📝 {displayNote}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Assignment Dialog (Modal) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="w-5 h-5 text-primary" />
              {editingAssignment
                ? `แก้ไขการมอบหมายชั้นเรียน (${selectedClasses.join(', ')})`
                : 'มอบหมายครูประจำชั้น / ครูสอนควบ'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            {/* Teacher Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">1. เลือกคุณครูผู้รับผิดชอบ</Label>
              <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder="เลือกคุณครูในโรงเรียน" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {teachers.map((t) => {
                    const assigned = classesByTeacherId[t.id] || [];
                    const statusText = assigned.length > 0 ? `(ปัจจุบันสอน: ${assigned.join(', ')})` : '';

                    return (
                      <SelectItem key={t.id} value={t.id} className="text-xs py-2">
                        <div className="flex items-center gap-2">
                          <PersonAvatar name={t.name} photoUrl={t.photo_url} className="w-5 h-5 rounded-full" />
                          <span>{t.name}</span>
                          <span className="text-muted-foreground font-light text-[11px]">
                            {t.position || 'ครูผู้สอน'} {statusText}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Multi-Class Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">2. เลือกระดับชั้นเรียนที่รับผิดชอบ</Label>
                <span className="text-[11px] text-muted-foreground">
                  (เลือกได้มากกว่า 1 ห้อง สำหรับกรณีสอนควบ)
                </span>
              </div>

              {/* Class Chips */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PRIMARY_CLASSES.map((cls) => {
                  const isSelected = selectedClasses.includes(cls);
                  const existingAssignment = assignmentByClass[cls];
                  const hasOtherTeacher =
                    existingAssignment && existingAssignment.teacher_id !== selectedTeacherId;

                  return (
                    <button
                      type="button"
                      key={cls}
                      onClick={() => toggleClass(cls)}
                      className={cn(
                        'flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-semibold transition-all relative',
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-sm ring-1 ring-indigo-500'
                          : 'border-border bg-card text-foreground hover:bg-muted/50'
                      )}
                    >
                      <div className="flex items-center gap-1">
                        {isSelected && <Check className="w-3 h-3 text-indigo-600" />}
                        <span>{cls}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-light mt-0.5">
                        ป.{cls.replace('ป.', '')}
                      </span>

                      {hasOtherTeacher && !isSelected && (
                        <span className="text-[9px] text-amber-600 truncate max-w-full px-1">
                          มีครูแล้ว
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Quick Multi-Grade Presets */}
              <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                <span className="text-[11px] text-muted-foreground">ชุดสอนควบแนะนำ:</span>
                {MULTI_GRADE_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyClassPreset(preset.classes)}
                    className="h-6 text-[10px] px-2 border-indigo-200 text-indigo-700 bg-indigo-50/40 hover:bg-indigo-100"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Conflict Warnings */}
            {conflictingClasses.length > 0 && (
              <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/60 text-amber-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold">จะทำการแทนที่ครูประจำชั้นเดิม:</div>
                  <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5">
                    {conflictingClasses.map((c) => (
                      <li key={c.className}>
                        ห้อง <strong>{c.className}</strong> (เดิมคือ {c.currentTeacherName}) จะถูกเปลี่ยนเป็นครูท่านนี้
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Multi-Grade Status Notice */}
            {selectedClasses.length > 1 && (
              <div className="p-2.5 rounded-lg border border-indigo-200 bg-indigo-50/60 text-indigo-900 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  ✨ มอบหมายแบบ <strong>สอนควบชั้นเรียน ({selectedClasses.join(' และ ')})</strong> ระบบจะอัปเดตสิทธิ์และป้ายให้อัตโนมัติ
                </span>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs">3. หมายเหตุเพิ่มเติม (ระบุหรือไม่ระบุก็ได้)</Label>
              <Input
                placeholder={
                  selectedClasses.length > 1
                    ? `สอนควบชั้น ${selectedClasses.join(' และ ')}`
                    : `ครูประจำชั้น ${selectedClasses[0] || 'ป.1'}`
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)} className="text-xs">
              ยกเลิก
            </Button>
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !selectedTeacherId || selectedClasses.length === 0}
              className="text-xs gap-1.5 font-semibold"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              บันทึกการมอบหมาย
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
