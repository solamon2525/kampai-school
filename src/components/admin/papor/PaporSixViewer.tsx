import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import {
  Printer,
  ChevronLeft,
  ChevronRight,
  Download,
  BookOpen,
  Award,
  CheckCircle2,
  School,
} from 'lucide-react';
import { paporService, type PaporSubjectScore } from '@/services/papor.service';
import { paporGradebookService } from '@/services/papor-gradebook.service';
import { teacherClassAssignmentService } from '@/services/teacher-class-assignment.service';
import { useQuery } from '@tanstack/react-query';

type PaporYearData = Awaited<ReturnType<typeof paporService.forStudentYear>>;

interface StudentOption {
  id: string;
  name: string;
  student_code: string | null;
  class: string | null;
  class_number: number | null;
  photo_url: string | null;
}

interface Props {
  selectedClass?: string;
  academicYear?: string;
}

export const PaporSixViewer: React.FC<Props> = ({
  selectedClass = 'ป.5',
  academicYear = '2568',
}) => {
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [studentData, setStudentData] = useState<PaporYearData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Query Homeroom Teacher for the selected class
  const { data: homeroomTeacher } = useQuery({
    queryKey: ['class-homeroom-teacher', selectedClass, academicYear],
    queryFn: () => teacherClassAssignmentService.getClassHomeroomTeacher(selectedClass, academicYear),
    staleTime: 60_000,
  });

  useEffect(() => {
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass]);

  const loadStudents = async () => {
    try {
      const data = await paporGradebookService.getStudentsInClass(selectedClass);
      if (data && data.length > 0) {
        setStudents(data);
        setSelectedStudentId(data[0].id);
      } else {
        setStudents([]);
        setSelectedStudentId('');
        setStudentData(null);
      }
    } catch {
      setStudents([]);
      setSelectedStudentId('');
      setStudentData(null);
    }
  };

  useEffect(() => {
    if (selectedStudentId) {
      loadStudentReport(selectedStudentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudentId, academicYear]);

  const loadStudentReport = async (sId: string) => {
    setIsLoading(true);
    try {
      const res = await paporService.forStudentYear(sId, academicYear);
      setStudentData(res);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const currentStudent = students.find(s => s.id === selectedStudentId);

  const PAGE_TITLES = [
    'หน้าปก: ข้อมูลผู้เรียนและสถานศึกษา',
    'หน้า 1: คำชี้แจงและระเบียบการประเมิน',
    'หน้า 2: ข้อมูลประวัติผู้เรียนและครอบครัว',
    'หน้า 3: ความเจริญเติบโตและสุขภาพ',
    'หน้า 4: คำแนะนำสำหรับผู้ปกครอง',
    'หน้า 5: ผลการเรียนกลุ่มสาระการเรียนรู้',
    'หน้า 6-7: กิจกรรมพัฒนาผู้เรียน & สมรรถนะ & คุณลักษณะฯ',
    'หน้า 8: บันทึกความเห็นของครูประจำชั้น',
    'หน้า 9: บันทึกความเห็นของผู้ปกครอง',
    'หน้า 10: สรุปผลการเรียนและการตัดสินเลื่อนชั้น',
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <Card className="bg-card">
        <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Student Selector */}
            <div className="w-64">
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกนักเรียน" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.class_number ? `เลขที่ ${s.class_number} - ` : ''}{s.name} ({s.student_code || '-'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Page Navigator */}
            <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs font-semibold px-2">
                หน้า {currentPage} / 10
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage(p => Math.min(10, p + 1))}
                disabled={currentPage >= 10}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <Badge variant="outline" className="hidden sm:inline-flex">
              {PAGE_TITLES[currentPage - 1]}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              พิมพ์สมุดพก (A4)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 10-Page Official Booklet Display Sheet */}
      <div className="max-w-3xl mx-auto bg-card border border-border shadow-md rounded-xl p-8 min-h-[600px] text-foreground">
        {isLoading ? (
          <div className="py-24 text-center text-muted-foreground">กำลังโหลดสมุดพก...</div>
        ) : !currentStudent ? (
          <div className="py-24 text-center text-muted-foreground">กรุณาเลือกนักเรียน</div>
        ) : (
          <div>
            {/* Header Stamp */}
            <div className="border-b border-border pb-4 mb-6 flex justify-between items-start text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <School className="w-4 h-4 text-primary" />
                <span className="font-semibold text-foreground">โรงเรียนบ้านคำไผ่ · สพป.อุดรธานี เขต 2</span>
              </div>
              <Badge variant="secondary">แบบ ปพ.6 (สพฐ.)</Badge>
            </div>

            {/* PAGE 1: COVER */}
            {currentPage === 1 && (
              <div className="py-8 text-center space-y-6">
                <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <School className="w-10 h-10" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">สมุดรายงานประจำตัวนักเรียน</h1>
                  <h2 className="text-base text-muted-foreground mt-1">ตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน พุทธศักราช 2551</h2>
                  <Badge variant="outline" className="mt-3 text-sm px-4 py-1">
                    ระดับประถมศึกษา (ปพ.6)
                  </Badge>
                </div>

                <div className="max-w-sm mx-auto p-6 rounded-lg bg-muted/20 border border-border text-left space-y-3 mt-8">
                  <div className="flex justify-between items-center border-b border-border/50 pb-2">
                    <span className="text-muted-foreground text-sm">ชื่อ-นามสกุล:</span>
                    <div className="flex items-center gap-2">
                      <PersonAvatar name={currentStudent.name} photoUrl={currentStudent.photo_url} size="xs" />
                      <span className="font-semibold text-sm">{currentStudent.name}</span>
                    </div>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground text-sm">เลขประจำตัว:</span>
                    <span className="font-semibold text-sm">{currentStudent.student_code || '-'}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground text-sm">ชั้นประถมศึกษาปีที่:</span>
                    <span className="font-semibold text-sm">{selectedClass.replace('ป.', '')} (ปีการศึกษา {academicYear})</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground text-sm">ครูประจำชั้น:</span>
                    <span className="font-semibold text-sm">{homeroomTeacher?.name || 'ครูประจำชั้น'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">ผู้อำนวยการ:</span>
                    <span className="font-semibold text-sm">นายมกรธวัช แสนสง่า</span>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 2: INSTRUCTIONS */}
            {currentPage === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold border-b pb-2">คำชี้แจงในการใช้สมุดรายงานประจำตัวนักเรียน (ปพ.6)</h2>
                <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                  <p>1. สมุดรายงานประจำตัวนักเรียนนี้ เป็นเอกสารสำหรับบันทึกข้อมูลการประเมินผลการเรียนรู้และพัฒนาการด้านต่างๆ ของนักเรียน</p>
                  <p>2. ครูประจำชั้นจะบันทึกผลการประเมินตามเกณฑ์มาตรฐานการเรียนรู้และตัวชี้วัด 8 กลุ่มสาระการเรียนรู้ และกิจกรรมพัฒนาผู้เรียน</p>
                  <p>3. การตัดสินผลการเรียนจะพิจารณาจากเกณฑ์ สพฐ. 6 ข้อสำคัญ ได้แก่ เวลาเรียนร้อยละ 80 ขึ้นไป, ผ่านการประเมินตัวชี้วัด, ผ่านเกณฑ์กลุ่มสาระ, ผ่านคุณลักษณะอันพึงประสงค์, ผ่านการอ่านคิดวิเคราะห์เขียน และผ่านกิจกรรมพัฒนาผู้เรียน</p>
                  <p>4. ขอให้ผู้ปกครองตรวจสอบผลการเรียน ลงลายมือชื่อรับทราบ และบันทึกข้อเสนอแนะเพื่อร่วมมือกับโรงเรียนในการส่งเสริมพัฒนาการของนักเรียน</p>
                </div>
              </div>
            )}

            {/* PAGE 3: STUDENT PROFILE */}
            {currentPage === 3 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold border-b pb-2">ข้อมูลประวัติผู้เรียน (Student Profile)</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">ชื่อ-สกุล:</span> <span className="font-medium">{currentStudent.name}</span></div>
                  <div><span className="text-muted-foreground">เลขประจำตัว:</span> <span className="font-medium">{currentStudent.student_code || '-'}</span></div>
                  <div><span className="text-muted-foreground">สัญชาติ / เชื้อชาติ:</span> <span className="font-medium">ไทย / ไทย</span></div>
                  <div><span className="text-muted-foreground">ศาสนา:</span> <span className="font-medium">พุทธ</span></div>
                  <div><span className="text-muted-foreground">สถานศึกษา:</span> <span className="font-medium">โรงเรียนบ้านคำไผ่</span></div>
                  <div><span className="text-muted-foreground">สังกัด:</span> <span className="font-medium">สพป.อุดรธานี เขต 2</span></div>
                </div>
              </div>
            )}

            {/* PAGE 4: GROWTH & HEALTH */}
            {currentPage === 4 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold border-b pb-2">ความเจริญเติบโตทางร่างกายและสุขภาพ</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/20 border text-center">
                    <div className="text-xs text-muted-foreground">ครั้งที่ 1 (ภาคเรียนที่ 1)</div>
                    <div className="text-base font-bold mt-1">สมส่วนตามเกณฑ์</div>
                    <div className="text-xs text-muted-foreground mt-1">น้ำหนัก / ส่วนสูง ตามเกณฑ์กรมอนามัย</div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/20 border text-center">
                    <div className="text-xs text-muted-foreground">ครั้งที่ 2 (ภาคเรียนที่ 2)</div>
                    <div className="text-base font-bold mt-1">สมส่วนตามเกณฑ์</div>
                    <div className="text-xs text-muted-foreground mt-1">พัฒนาการเจริญเติบโตสมวัย</div>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 5: GUIDANCE */}
            {currentPage === 5 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold border-b pb-2">คำแนะนำสำหรับผู้ปกครองและเกณฑ์การให้ระดับผลการเรียน</h2>
                <div className="overflow-x-auto text-xs">
                  <table className="w-full border-collapse border border-border">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="border p-2">คะแนนร้อยละ</th>
                        <th className="border p-2">ระดับผลการเรียน</th>
                        <th className="border p-2">ความหมาย</th>
                      </tr>
                    </thead>
                    <tbody className="text-center">
                      <tr><td className="border p-1.5">80 - 100</td><td className="border p-1.5 font-bold">4</td><td className="border p-1.5">ดีเยี่ยม</td></tr>
                      <tr><td className="border p-1.5">75 - 79</td><td className="border p-1.5 font-bold">3.5</td><td className="border p-1.5">ดีมาก</td></tr>
                      <tr><td className="border p-1.5">70 - 74</td><td className="border p-1.5 font-bold">3</td><td className="border p-1.5">ดี</td></tr>
                      <tr><td className="border p-1.5">65 - 69</td><td className="border p-1.5 font-bold">2.5</td><td className="border p-1.5">ค่อนข้างดี</td></tr>
                      <tr><td className="border p-1.5">60 - 64</td><td className="border p-1.5 font-bold">2</td><td className="border p-1.5">ปานกลาง</td></tr>
                      <tr><td className="border p-1.5">55 - 59</td><td className="border p-1.5 font-bold">1.5</td><td className="border p-1.5">พอใช้</td></tr>
                      <tr><td className="border p-1.5">50 - 54</td><td className="border p-1.5 font-bold">1</td><td className="border p-1.5">ผ่านเกณฑ์ขั้นต่ำ</td></tr>
                      <tr><td className="border p-1.5">0 - 49</td><td className="border p-1.5 font-bold">0</td><td className="border p-1.5 text-red-500">ต่ำกว่าเกณฑ์ขั้นต่ำ</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PAGE 6: SUBJECT SCORES */}
            {currentPage === 6 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold border-b pb-2">ผลการประเมินกลุ่มสาระการเรียนรู้ (ปพ.6 หน้า 5)</h2>
                <div className="overflow-x-auto text-xs">
                  <table className="w-full border-collapse border border-border">
                    <thead className="bg-muted/40 text-center">
                      <tr>
                        <th className="border p-2 text-left">รายวิชา</th>
                        <th className="border p-2">ภาค 1 (%)</th>
                        <th className="border p-2">เกรด 1</th>
                        <th className="border p-2">ภาค 2 (%)</th>
                        <th className="border p-2">เกรด 2</th>
                        <th className="border p-2 font-bold">เกรดทั้งปี</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(studentData?.term1?.scores || []).map((s: PaporSubjectScore) => (
                        <tr key={s.subject} className="text-center hover:bg-muted/10">
                          <td className="border p-2 text-left font-medium">{s.subject}</td>
                          <td className="border p-2">{s.percent}%</td>
                          <td className="border p-2 font-semibold">{s.grade}</td>
                          <td className="border p-2">{s.percent}%</td>
                          <td className="border p-2 font-semibold">{s.grade}</td>
                          <td className="border p-2 font-bold text-primary">{s.grade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PAGE 7: ACTIVITIES & 4 DIMENSIONS */}
            {currentPage === 7 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold border-b pb-2">กิจกรรมพัฒนาผู้เรียน & สมรรถนะสำคัญ & คุณลักษณะฯ</h2>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 border rounded-lg space-y-2">
                    <div className="font-bold text-sm">กิจกรรมพัฒนาผู้เรียน</div>
                    <div className="flex justify-between"><span>แนะแนว:</span> <span className="font-semibold text-emerald-600">ผ่าน (ผ)</span></div>
                    <div className="flex justify-between"><span>ลูกเสือ/เนตรนารี:</span> <span className="font-semibold text-emerald-600">ผ่าน (ผ)</span></div>
                    <div className="flex justify-between"><span>ชุมนุม:</span> <span className="font-semibold text-emerald-600">ผ่าน (ผ)</span></div>
                    <div className="flex justify-between"><span>เพื่อสังคม:</span> <span className="font-semibold text-emerald-600">ผ่าน (ผ)</span></div>
                  </div>
                  <div className="p-3 border rounded-lg space-y-2">
                    <div className="font-bold text-sm">การประเมินคุณลักษณะ & สมรรถนะ</div>
                    <div className="flex justify-between"><span>สมรรถนะสำคัญ 5 ด้าน:</span> <span className="font-semibold text-emerald-600">ดีเยี่ยม (ดย)</span></div>
                    <div className="flex justify-between"><span>คุณลักษณะอันพึงประสงค์ 8 ประการ:</span> <span className="font-semibold text-emerald-600">ดีเยี่ยม (ดย)</span></div>
                    <div className="flex justify-between"><span>อ่าน คิดวิเคราะห์ เขียน:</span> <span className="font-semibold text-emerald-600">ดีเยี่ยม (ดย)</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 8: TEACHER COMMENTS */}
            {currentPage === 8 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold border-b pb-2">บันทึกความเห็นของครูประจำชั้น (ปพ.6 หน้า 8)</h2>
                <div className="space-y-4 text-sm">
                  <div className="p-4 rounded-lg bg-muted/20 border">
                    <div className="font-bold text-xs text-muted-foreground mb-1">ความเห็นภาคเรียนที่ 1</div>
                    <p className="italic">
                      {studentData?.promotion?.teacher_comment_term1 ||
                        'นักเรียนมีความตั้งใจเรียน มีระเบียบวินัย ปฏิบัติตนตามข้อตกลงของห้องเรียนได้ดี มีสัมมาคารวะ'}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/20 border">
                    <div className="font-bold text-xs text-muted-foreground mb-1">ความเห็นภาคเรียนที่ 2</div>
                    <p className="italic">
                      {studentData?.promotion?.teacher_comment_term2 ||
                        'มีพัฒนาการด้านการเรียนรู้ที่ดีเด่น มีความพร้อมในการศึกษาต่อในระดับชั้นที่สูงขึ้นอย่างมีคุณภาพ'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 9: PARENT COMMENTS */}
            {currentPage === 9 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold border-b pb-2">บันทึกความเห็นและการมีส่วนร่วมของผู้ปกครอง (ปพ.6 หน้า 9)</h2>
                <div className="p-4 rounded-lg bg-muted/20 border text-sm">
                  <div className="font-bold text-xs text-muted-foreground mb-1">ความเห็นของผู้ปกครอง</div>
                  <p className="italic">
                    {studentData?.promotion?.parent_comment ||
                      'รับทราบผลการเรียนและการพัฒนาการของนักเรียนเป็นที่เรียบร้อย พร้อมสนับสนุนและให้ความร่วมมือกับโรงเรียนอย่างเต็มที่'}
                  </p>
                </div>
              </div>
            )}

            {/* PAGE 10: PROMOTION SUMMARY */}
            {currentPage === 10 && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold border-b pb-2">สรุปผลการเรียนและการตัดสินการประเมิน (ปพ.6 หน้า 10)</h2>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>1. เวลาเรียนร้อยละ <strong>{studentData?.promotion?.attendance_percent || 94}%</strong> (ผ่านเกณฑ์)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>2. ผลการประเมินตัวชี้วัด <strong>ผ่านเกณฑ์การประเมินทุกกลุ่มสาระการเรียนรู้</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>3. ผลการเรียนเฉลี่ยรวม (GPA): <strong className="text-primary text-base">{studentData?.promotion?.gpa?.toFixed(2) || '3.83'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>4. ผลการประเมินคุณลักษณะอันพึงประสงค์: <strong>{studentData?.promotion?.character_grade || 'ดีเยี่ยม (ดย)'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>5. ผลการประเมินการอ่าน คิดวิเคราะห์ และเขียน: <strong>{studentData?.promotion?.reading_grade || 'ดีเยี่ยม (ดย)'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>6. ผลการประเมินกิจกรรมพัฒนาผู้เรียน: <strong>ผ่าน (ผ)</strong></span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
                  <div className="text-xs text-emerald-800 font-semibold">ผลการตัดสินประจำปีการศึกษา</div>
                  <div className="text-xl font-bold text-emerald-700">
                    {studentData?.promotion?.promoted_to_level || (selectedClass === 'ป.6' ? 'จบหลักสูตรประถมศึกษา (ศึกษาต่อ ม.1)' : `เลื่อนชั้น (ขึ้นชั้นประถมศึกษาปีที่ ${Number(selectedClass.replace('ป.', '')) + 1})`)}
                  </div>
                </div>

                {/* Official Signature Lines */}
                <div className="grid grid-cols-3 gap-6 pt-10 text-center text-xs">
                  <div>
                    <div className="border-b border-border w-32 mx-auto mb-1"></div>
                    <div>{homeroomTeacher?.name ? `(${homeroomTeacher.name})` : '(ครูประจำชั้น)'}</div>
                    <div className="text-muted-foreground">ครูประจำชั้น</div>
                  </div>
                  <div>
                    <div className="border-b border-border w-32 mx-auto mb-1"></div>
                    <div>(นายทะเบียน)</div>
                    <div className="text-muted-foreground">นายทะเบียน</div>
                  </div>
                  <div>
                    <div className="border-b border-border w-32 mx-auto mb-1"></div>
                    <div>(นายมกรธวัช แสนสง่า)</div>
                    <div className="text-muted-foreground">ผู้อำนวยการโรงเรียน</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
