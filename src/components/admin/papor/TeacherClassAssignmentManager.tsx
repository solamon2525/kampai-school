/**
 * TeacherClassAssignmentManager.tsx
 * แผงบริหารจัดการมอบหมายครูประจำชั้นและครูสอนควบ (Admin Homeroom Management)
 * - แสดงภาพรวมการจัดครูประจำชั้นระดับประถมศึกษา (ป.1 - ป.6)
 * - รองรับกรณีครู 1 คน สอนควบหลายชั้นเรียน (Multi-Grade Teaching)
 * - เชื่อมโยงรูปภาพและชื่อครูผ่าน <PersonAvatar> ตาม DESIGN.md Rule 14.13
 * - ปรับเปลี่ยน มอบหมาย และยกเลิกการมอบหมายได้แบบเรียลไทม์
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
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

  // Form State
  const [targetClass, setTargetClass] = useState<string>('ป.1');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [isMultiGrade, setIsMultiGrade] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  // 1. Fetch Assignments
  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ['teacher-class-assignments', selectedYear],
    queryFn: () => teacherClassAssignmentService.listAssignments(selectedYear),
    staleTime: 30_000,
  });

  // 2. Fetch Teachers
  const { data: teachers = [], isLoading: loadingTeachers } = useQuery({
    queryKey: ['staff-teachers'],
    queryFn: async () => {
      const res = await staffService.getTeachers();
      return (res.data as any[]) || [];
    },
    staleTime: 60_000,
  });

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!targetClass || !selectedTeacherId) {
        throw new Error('กรุณาเลือกระดับชั้นและครูผู้สอน');
      }
      await teacherClassAssignmentService.assignTeacher({
        academic_year: selectedYear,
        class_name: targetClass,
        teacher_id: selectedTeacherId,
        is_primary_homeroom: true,
        is_multi_grade: isMultiGrade,
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success(`บันทึกครูประจำชั้น ${targetClass} เรียบร้อยแล้ว`);
      setIsDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['teacher-class-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['papor-homeroom-teacher'] });
      queryClient.invalidateQueries({ queryKey: ['class-homeroom-teacher'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-assigned-classes'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      await teacherClassAssignmentService.removeAssignment(assignmentId);
    },
    onSuccess: () => {
      toast.success('ยกเลิกการมอบหมายเรียบร้อยแล้ว');
      queryClient.invalidateQueries({ queryKey: ['teacher-class-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['papor-homeroom-teacher'] });
      queryClient.invalidateQueries({ queryKey: ['class-homeroom-teacher'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-assigned-classes'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'เกิดข้อผิดพลาดในการยกเลิก');
    },
  });

  const resetForm = () => {
    setEditingAssignment(null);
    setTargetClass('ป.1');
    setSelectedTeacherId('');
    setIsMultiGrade(false);
    setNotes('');
  };

  const handleOpenAdd = (className?: string) => {
    resetForm();
    if (className) {
      setTargetClass(className);
    }
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (assignment: TeacherClassAssignmentRow) => {
    setEditingAssignment(assignment);
    setTargetClass(assignment.class_name);
    setSelectedTeacherId(assignment.teacher_id);
    setIsMultiGrade(assignment.is_multi_grade);
    setNotes(assignment.notes || '');
    setIsDialogOpen(true);
  };

  // Map assignments by class name
  const assignmentByClass = React.useMemo(() => {
    const map: Record<string, TeacherClassAssignmentRow> = {};
    assignments.forEach((a) => {
      map[a.class_name] = a;
    });
    return map;
  }, [assignments]);

  // Teachers teaching multiple classes
  const multiGradeTeachers = React.useMemo(() => {
    const teacherMap: Record<string, { teacherName: string; classes: string[] }> = {};
    assignments.forEach((a) => {
      const name = a.teacher?.name || 'ไม่ทราบชื่อ';
      if (!teacherMap[a.teacher_id]) {
        teacherMap[a.teacher_id] = { teacherName: name, classes: [] };
      }
      teacherMap[a.teacher_id].classes.push(a.class_name);
    });

    return Object.values(teacherMap).filter((t) => t.classes.length > 1);
  }, [assignments]);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                <CardTitle className="text-xl">
                  ระบบจัดครูประจำชั้นและครูสอนควบ (Homeroom Management)
                </CardTitle>
                <Badge variant="secondary" className="font-mono text-xs">
                  ปีการศึกษา {selectedYear}
                </Badge>
              </div>
              <CardDescription className="mt-1">
                กำหนดครูประจำชั้นสำหรับ ป.1 - ป.6 เพื่อควบคุมสิทธิ์การออกเกรดในพอร์ทัลครู และใส่ชื่อครูในใบ ปพ. อัตโนมัติ
              </CardDescription>
            </div>

            <div className="flex items-center gap-2.5">
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

              <Button onClick={() => handleOpenAdd()} size="sm" className="gap-2 text-xs font-semibold">
                <Plus className="w-4 h-4" /> เพิ่มการมอบหมาย
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Multi-Grade Teaching Notice Callout */}
      {multiGradeTeachers.length > 0 && (
        <Card className="border-indigo-200 bg-indigo-50/40">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="text-xs text-indigo-950 space-y-0.5">
              <div className="font-bold flex items-center gap-1.5">
                <span>ครูผู้สอนควบชั้นเรียน (Multi-Grade Teaching)</span>
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 text-[10px] py-0">
                  {multiGradeTeachers.length} ท่าน
                </Badge>
              </div>
              <p className="text-indigo-800/80">
                {multiGradeTeachers
                  .map((t) => `${t.teacherName} (สอนควบ ${t.classes.join(' และ ')})`)
                  .join(' • ')}
              </p>
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

            return (
              <Card
                key={className}
                className={cn(
                  'border-border bg-card transition-all hover:shadow-md relative overflow-hidden',
                  !assignment && 'border-dashed border-amber-300/80 bg-amber-50/20'
                )}
              >
                {/* Accent Top Bar */}
                <div
                  className={cn(
                    'h-1.5 w-full',
                    assignment?.is_multi_grade
                      ? 'bg-indigo-500'
                      : assignment
                      ? 'bg-primary'
                      : 'bg-amber-400'
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
                      assignment.is_multi_grade ? (
                        <Badge variant="outline" className="text-indigo-700 bg-indigo-50 border-indigo-200 gap-1 text-[11px]">
                          <Layers className="w-3 h-3 text-indigo-600" /> สอนควบชั้น
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 gap-1 text-[11px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ประจำชั้นหลัก
                        </Badge>
                      )
                    ) : (
                      <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-300 gap-1 text-[11px]">
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
                          <div className="text-xs text-muted-foreground truncate">{teacher.position}</div>
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
                              deleteMutation.mutate(assignment.id);
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
                        className="text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10 h-7"
                      >
                        <Plus className="w-3 h-3" /> มอบหมายครูประจำชั้น
                      </Button>
                    </div>
                  )}

                  {/* Notes / Multi-grade info */}
                  {assignment?.notes && (
                    <div className="text-[11px] text-muted-foreground bg-muted/20 px-2.5 py-1.5 rounded border border-border/50">
                      📝 {assignment.notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Assignment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="w-5 h-5 text-primary" />
              {editingAssignment ? `แก้ไขครูประจำชั้น ${targetClass}` : 'มอบหมายครูประจำชั้น'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            {/* Class Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs">ระดับชั้นเรียน</Label>
              <Select value={targetClass} onValueChange={setTargetClass}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="เลือกระดับชั้น" />
                </SelectTrigger>
                <SelectContent>
                  {PRIMARY_CLASSES.map((cls) => (
                    <SelectItem key={cls} value={cls} className="text-xs">
                      ชั้นประถมศึกษาปีที่ {cls.replace('ป.', '')} ({cls})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Teacher Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs">ครูผู้รับผิดชอบ</Label>
              <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="เลือกคุณครูในโรงเรียน" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-xs">
                      {t.name} ({t.position || 'ครูผู้สอน'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Multi-Grade Checkbox */}
            <div className="flex items-start space-x-2 pt-2">
              <Checkbox
                id="multigrade-check"
                checked={isMultiGrade}
                onCheckedChange={(checked) => setIsMultiGrade(Boolean(checked))}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <Label htmlFor="multigrade-check" className="text-xs font-semibold cursor-pointer">
                  สอนควบชั้นเรียน (Multi-Grade Teaching)
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  ติ๊กตัวเลือกนี้หากคุณครูสอนควบมากกว่า 1 ชั้นเรียน (เช่น สอนควบ ป.1 และ ป.2)
                </p>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs">หมายเหตุเพิ่มเติม</Label>
              <Input
                placeholder="เช่น สอนควบชั้น ป.1 และ ป.2 ร่วมกับคุณครูสมศรี"
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
              disabled={saveMutation.isPending || !selectedTeacherId}
              className="text-xs gap-1.5 font-semibold"
            >
              {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              บันทึกการมอบหมาย
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
