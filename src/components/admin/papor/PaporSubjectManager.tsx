import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Clock,
  Award,
  Layers,
  Save,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  curriculumSubjectsService,
  type ObecGradeSubjectRow,
  type ObecGradeSubjectInsert,
} from '@/services/curriculum-subjects.service';

interface Props {
  selectedClass?: string;
  academicYear?: string;
}

const LEARNING_AREAS = [
  'ภาษาไทย',
  'คณิตศาสตร์',
  'วิทยาศาสตร์และเทคโนโลยี',
  'สังคมศึกษา ศาสนา และวัฒนธรรม',
  'สุขศึกษาและพลศึกษา',
  'ศิลปะ',
  'การงานอาชีพ',
  'ภาษาต่างประเทศ',
  'กิจกรรมพัฒนาผู้เรียน',
];

export const PaporSubjectManager: React.FC<Props> = ({
  selectedClass = 'ป.5',
  academicYear = '2568',
}) => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<ObecGradeSubjectRow | null>(null);

  // Form State
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectGroup, setSubjectGroup] = useState(LEARNING_AREAS[0]);
  const [subjectType, setSubjectType] = useState<'พื้นฐาน' | 'เพิ่มเติม' | 'กิจกรรมพัฒนาผู้เรียน'>('พื้นฐาน');
  const [creditHours, setCreditHours] = useState(80);
  const [creditUnits, setCreditUnits] = useState(2.0);
  const [formativeWeight, setFormativeWeight] = useState(70);
  const [summativeWeight, setSummativeWeight] = useState(30);
  const [teacherName, setTeacherName] = useState('');

  // Query Subjects
  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ['curriculum-subjects', selectedClass, academicYear],
    queryFn: () => curriculumSubjectsService.listSubjects(selectedClass, academicYear),
  });

  // KPI Calculations
  const totalCredits = subjects.reduce((sum, s) => sum + Number(s.credit_units || 0), 0);
  const totalHours = subjects.reduce((sum, s) => sum + Number(s.credit_hours || 0), 0);
  const coreCount = subjects.filter((s) => s.subject_type === 'พื้นฐาน').length;
  const additionalCount = subjects.filter((s) => s.subject_type === 'เพิ่มเติม').length;

  const openAddDialog = () => {
    setEditingSubject(null);
    setSubjectCode('');
    setSubjectName('');
    setSubjectGroup(LEARNING_AREAS[0]);
    setSubjectType('พื้นฐาน');
    setCreditHours(80);
    setCreditUnits(2.0);
    setFormativeWeight(70);
    setSummativeWeight(30);
    setTeacherName('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (sub: ObecGradeSubjectRow) => {
    setEditingSubject(sub);
    setSubjectCode(sub.subject_code);
    setSubjectName(sub.subject_name);
    setSubjectGroup(sub.subject_group);
    setSubjectType(sub.subject_type as 'พื้นฐาน' | 'เพิ่มเติม' | 'กิจกรรมพัฒนาผู้เรียน');
    setCreditHours(sub.credit_hours);
    setCreditUnits(Number(sub.credit_units));
    setFormativeWeight(sub.formative_weight);
    setSummativeWeight(sub.summative_weight);
    setTeacherName(sub.teacher_name || '');
    setIsDialogOpen(true);
  };

  // Create / Update Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!subjectCode.trim() || !subjectName.trim()) {
        throw new Error('กรุณากรอกรหัสวิชาและชื่อรายวิชาให้ครบถ้วน');
      }

      if (editingSubject) {
        return curriculumSubjectsService.updateSubject(editingSubject.id, {
          subject_code: subjectCode.trim(),
          subject_name: subjectName.trim(),
          subject_group: subjectGroup,
          subject_type: subjectType,
          credit_hours: creditHours,
          credit_units: creditUnits,
          formative_weight: formativeWeight,
          summative_weight: summativeWeight,
          teacher_name: teacherName.trim() || null,
        });
      } else {
        const newSubject: ObecGradeSubjectInsert = {
          academic_year: academicYear,
          grade_level: selectedClass,
          subject_code: subjectCode.trim(),
          subject_name: subjectName.trim(),
          subject_group: subjectGroup,
          subject_type: subjectType,
          credit_hours: creditHours,
          credit_units: creditUnits,
          formative_weight: formativeWeight,
          summative_weight: summativeWeight,
          passing_score: 50,
          display_order: subjects.length + 1,
          teacher_name: teacherName.trim() || null,
          is_active: true,
        };
        return curriculumSubjectsService.createSubject(newSubject);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculum-subjects', selectedClass, academicYear] });
      queryClient.invalidateQueries({ queryKey: ['gradebook-subjects', selectedClass, academicYear] });
      toast.success(editingSubject ? 'บันทึกการแก้ไขรายวิชาเรียบร้อย' : 'เพิ่มรายวิชาใหม่เรียบร้อย');
      setIsDialogOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'เกิดข้อผิดพลาดในการบันทึกรายวิชา');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => curriculumSubjectsService.deleteSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculum-subjects', selectedClass, academicYear] });
      queryClient.invalidateQueries({ queryKey: ['gradebook-subjects', selectedClass, academicYear] });
      toast.success('ลบรายวิชาเรียบร้อย');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'เกิดข้อผิดพลาดในการลบรายวิชา');
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`คุณต้องการลบรายวิชา "${name}" ใช่หรือไม่?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-5 rounded-xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground">
              โครงสร้างรายวิชา ชั้น {selectedClass} (ปีการศึกษา {academicYear})
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            กำหนดรายวิชาพื้นฐานและเพิ่มเติม น้ำหนักหน่วยกิต ชั่วโมงเรียน และสัดส่วนคะแนนวัดผลตามหลักสูตรแกนกลาง สพฐ.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button onClick={openAddDialog} className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> เพิ่มรายวิชาใหม่
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">รายวิชาทั้งหมด</p>
              <h3 className="text-2xl font-bold text-foreground mt-0.5">{subjects.length} วิชา</h3>
              <p className="text-[11px] text-muted-foreground mt-1">
                พื้นฐาน {coreCount} · เพิ่มเติม {additionalCount}
              </p>
            </div>
            <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">หน่วยกิตรวม (Weight)</p>
              <h3 className="text-2xl font-bold text-foreground mt-0.5">{totalCredits.toFixed(1)} นก.</h3>
              <p className="text-[11px] text-muted-foreground mt-1">สพฐ. กำหนด ~23-24 หน่วย</p>
            </div>
            <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-600">
              <Award className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">ชั่วโมงเรียนรวม</p>
              <h3 className="text-2xl font-bold text-foreground mt-0.5">{totalHours} ชม./ปี</h3>
              <p className="text-[11px] text-muted-foreground mt-1">เกณฑ์ขั้นต่ำ 840–1,000 ชม.</p>
            </div>
            <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">ระดับชั้น</p>
              <h3 className="text-2xl font-bold text-foreground mt-0.5">{selectedClass}</h3>
              <p className="text-[11px] text-muted-foreground mt-1">สถานะ: หลักสูตรแกนกลาง</p>
            </div>
            <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-600">
              <Sparkles className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subjects Table */}
      <Card className="bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>ตารางรายชื่อวิชาและน้ำหนักการให้คะแนน</span>
            <Badge variant="outline" className="text-xs font-normal">
              แสดง {subjects.length} รายการ
            </Badge>
          </CardTitle>
          <CardDescription>
            รายวิชาเหล่านี้จะถูกนำไปใช้ในสมุด ปพ.5 ออนไลน์ สมุด ปพ.6 และการพิมพ์รายงานอัตโนมัติ
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead className="w-28">รหัสวิชา</TableHead>
                  <TableHead>ชื่อรายวิชา</TableHead>
                  <TableHead>กลุ่มสาระการเรียนรู้</TableHead>
                  <TableHead className="w-24 text-center">ประเภท</TableHead>
                  <TableHead className="w-24 text-center">หน่วยกิต</TableHead>
                  <TableHead className="w-24 text-center">ชม./ปี</TableHead>
                  <TableHead className="w-28 text-center">สัดส่วนคะแนน</TableHead>
                  <TableHead>ครูผู้สอน</TableHead>
                  <TableHead className="w-24 text-center">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      กำลังโหลดข้อมูลรายวิชา...
                    </TableCell>
                  </TableRow>
                ) : subjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10 space-y-3">
                      <p className="text-muted-foreground text-sm">ยังไม่มีรายวิชาสำหรับชั้น {selectedClass}</p>
                      <Button onClick={openAddDialog} variant="outline" size="sm" className="gap-2">
                        <Plus className="w-4 h-4" /> เพิ่มรายวิชาแรก
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  subjects.map((sub, idx) => (
                    <TableRow key={sub.id} className="hover:bg-muted/30">
                      <TableCell className="text-center font-mono text-xs text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-mono font-medium text-foreground">
                        {sub.subject_code}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {sub.subject_name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {sub.subject_group}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={sub.subject_type === 'พื้นฐาน' ? 'default' : 'secondary'}
                          className="text-[11px]"
                        >
                          {sub.subject_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-semibold text-foreground">
                        {Number(sub.credit_units).toFixed(1)}
                      </TableCell>
                      <TableCell className="text-center text-sm text-foreground">
                        {sub.credit_hours}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono text-xs">
                          {sub.formative_weight}:{sub.summative_weight}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {sub.teacher_name || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => openEditDialog(sub)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive/80 hover:text-destructive"
                            onClick={() => handleDelete(sub.id, sub.subject_name)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSubject ? 'แก้ไขรายวิชา' : 'เพิ่มรายวิชาใหม่'} — ชั้น {selectedClass}
            </DialogTitle>
            <DialogDescription>
              กำหนดรหัสวิชา กลุ่มสาระ และเกณฑ์สัดส่วนคะแนนตามหลักสูตร
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sub-code">รหัสวิชา *</Label>
                <Input
                  id="sub-code"
                  placeholder="เช่น ท15101"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sub-type">ประเภทวิชา</Label>
                <Select
                  value={subjectType}
                  onValueChange={(v: 'พื้นฐาน' | 'เพิ่มเติม' | 'กิจกรรมพัฒนาผู้เรียน') => setSubjectType(v)}
                >
                  <SelectTrigger id="sub-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="พื้นฐาน">รายวิชาพื้นฐาน</SelectItem>
                    <SelectItem value="เพิ่มเติม">รายวิชาเพิ่มเติม</SelectItem>
                    <SelectItem value="กิจกรรมพัฒนาผู้เรียน">กิจกรรมพัฒนาผู้เรียน</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sub-name">ชื่อรายวิชา *</Label>
              <Input
                id="sub-name"
                placeholder="เช่น ภาษาไทย 5 หรือ คณิตศาสตร์เพิ่มเติม"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sub-group">กลุ่มสาระการเรียนรู้</Label>
              <Select value={subjectGroup} onValueChange={setSubjectGroup}>
                <SelectTrigger id="sub-group">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEARNING_AREAS.map((area) => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sub-credits">หน่วยกิต (น้ำหนัก)</Label>
                <Input
                  id="sub-credits"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="10"
                  value={creditUnits}
                  onChange={(e) => setCreditUnits(parseFloat(e.target.value) || 1.0)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sub-hours">ชั่วโมงเรียน/ปี</Label>
                <Input
                  id="sub-hours"
                  type="number"
                  step="10"
                  min="20"
                  max="400"
                  value={creditHours}
                  onChange={(e) => setCreditHours(parseInt(e.target.value, 10) || 40)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sub-formative">คะแนนเก็บ (ระหว่างภาค)</Label>
                <Input
                  id="sub-formative"
                  type="number"
                  min="50"
                  max="90"
                  value={formativeWeight}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 70;
                    setFormativeWeight(val);
                    setSummativeWeight(100 - val);
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sub-summative">คะแนนสอบปลายภาค</Label>
                <Input
                  id="sub-summative"
                  type="number"
                  value={summativeWeight}
                  disabled
                  className="bg-muted text-muted-foreground"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sub-teacher">ครูผู้สอนประจำวิชา (ไม่บังคับ)</Label>
              <Input
                id="sub-teacher"
                placeholder="ระบุชื่อครูผู้สอน"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="gap-2"
            >
              <Save className="w-4 h-4" /> บันทึกรายวิชา
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
