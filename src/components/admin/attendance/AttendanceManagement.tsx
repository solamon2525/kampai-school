import { useState, useEffect } from 'react';
import { studentsService, attendanceService } from '@/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ClipboardList,
  BarChart3,
  Users,
  Plus,
  Edit,
  Trash2,
  Save,
  Search,
  RefreshCw,
  UserRound,
  Download,
  Printer,
  Bell,
} from 'lucide-react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { downloadCSV, printTable } from '@/lib/export';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TableSkeleton, ListSkeleton } from '@/components/ui/loading-skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { NoPeopleIllustration, NoDataIllustration } from '@/components/ui/empty-illustrations';
import { RecorderSelect, EMPTY_RECORDER, type RecorderValue } from '@/components/admin/shared/RecorderSelect';

// ─── Types ────────────────────────────────────────────────────────────────────

type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave';

interface Student {
  id: string;
  student_code: string;
  name: string;
  class: string;
  class_number: number;
  gender: string;
  parent_name: string;
  parent_phone: string;
  is_active: boolean;
  photo_url?: string | null;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  notes: string | null;
  recorded_by: string | null;
}

interface ReportRow {
  student_id: string;
  name: string;
  student_code: string;
  class_number: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  total: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CLASSES = ['อ.1', 'อ.2', 'อ.3', 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; color: string; bg: string; activeBg: string; activeText: string }
> = {
  present: {
    label: 'มา',
    color: 'text-green-700',
    bg: 'bg-white border-green-300 text-green-700 hover:bg-green-50',
    activeBg: 'bg-green-500 border-green-500 text-white',
    activeText: 'มาเรียน',
  },
  absent: {
    label: 'ขาด',
    color: 'text-red-700',
    bg: 'bg-white border-red-300 text-red-700 hover:bg-red-50',
    activeBg: 'bg-red-500 border-red-500 text-white',
    activeText: 'ขาด',
  },
  late: {
    label: 'สาย',
    color: 'text-yellow-700',
    bg: 'bg-white border-yellow-300 text-yellow-700 hover:bg-yellow-50',
    activeBg: 'bg-yellow-500 border-yellow-500 text-white',
    activeText: 'มาสาย',
  },
  leave: {
    label: 'ลา',
    color: 'text-blue-700',
    bg: 'bg-white border-blue-300 text-blue-700 hover:bg-blue-50',
    activeBg: 'bg-blue-500 border-blue-500 text-white',
    activeText: 'ลา',
  },
};

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function ceYearToBE(ce: number): number {
  return ce + 543;
}

function beYearToCE(be: number): number {
  return be - 543;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatusButtonProps {
  status: AttendanceStatus;
  active: boolean;
  onClick: () => void;
}

function StatusButton({ status, active, onClick }: StatusButtonProps) {
  const cfg = STATUS_CONFIG[status];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 text-sm font-medium rounded border transition-colors ${
        active ? cfg.activeBg : cfg.bg
      }`}
    >
      {cfg.label}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const AttendanceManagement = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'checkin' | 'report' | 'individual' | 'students'>('checkin');

  // ── Tab 1: เช็คชื่อ ──────────────────────────────────────────────────────
  const [checkinDate, setCheckinDate] = useState(todayISO());
  const [checkinClass, setCheckinClass] = useState('');
  const [checkinStudents, setCheckinStudents] = useState<Student[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [recorder, setRecorder] = useState<RecorderValue>(EMPTY_RECORDER);

  const loadCheckin = async () => {
    if (!checkinClass) {
      toast({ title: 'กรุณาเลือกชั้นเรียน', variant: 'destructive' });
      return;
    }
    setCheckinLoading(true);
    setDataLoaded(false);
    try {
      const { data: students, error: sErr } = await studentsService.getByClass(checkinClass);
      if (sErr) throw sErr;

      const { data: records, error: rErr } = await attendanceService.getByDateAndStudentIds(
        checkinDate,
        (students ?? []).map((s) => s.id)
      );
      if (rErr) throw rErr;

      const map: Record<string, AttendanceStatus> = {};
      (records ?? []).forEach((r) => {
        map[r.student_id] = r.status as AttendanceStatus;
      });

      setCheckinStudents(students ?? []);
      setAttendanceMap(map);
      setDataLoaded(true);
    } catch (err: any) {
      toast({ title: 'เกิดข้อผิดพลาด', description: err.message, variant: 'destructive' });
    } finally {
      setCheckinLoading(false);
    }
  };

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const saveAll = async () => {
    if (!dataLoaded || checkinStudents.length === 0) return;
    if (!recorder.staffId && !recorder.administratorId) {
      toast({ title: 'กรุณาเลือกผู้บันทึก', variant: 'destructive' });
      return;
    }
    setSaveLoading(true);
    try {
      const upserts = checkinStudents
        .filter((s) => attendanceMap[s.id])
        .map((s) => ({
          student_id: s.id,
          attendance_date: checkinDate,
          status: attendanceMap[s.id],
          notes: null,
          recorded_by: recorder.name || null,
          recorded_by_staff_id: recorder.staffId,
          recorded_by_administrator_id: recorder.administratorId,
        }));

      if (upserts.length === 0) {
        toast({ title: 'ยังไม่ได้เช็คชื่อนักเรียนคนไหน', variant: 'destructive' });
        return;
      }

      const { error } = await attendanceService.upsertBulk(upserts);
      if (error) throw error;

      toast({ title: 'บันทึกการเช็คชื่อสำเร็จ', description: `บันทึก ${upserts.length} คน` });
    } catch (err: any) {
      toast({ title: 'เกิดข้อผิดพลาด', description: err.message, variant: 'destructive' });
    } finally {
      setSaveLoading(false);
    }
  };

  const summary = {
    present: Object.values(attendanceMap).filter((s) => s === 'present').length,
    absent: Object.values(attendanceMap).filter((s) => s === 'absent').length,
    late: Object.values(attendanceMap).filter((s) => s === 'late').length,
    leave: Object.values(attendanceMap).filter((s) => s === 'leave').length,
  };

  // ── แจ้งผู้ปกครอง ─────────────────────────────────────────────────────────
  const [notifyOpen, setNotifyOpen] = useState(false);
  const absentStudents = checkinStudents.filter(s => attendanceMap[s.id] === 'absent');

  // ── Tab 2: รายงาน ─────────────────────────────────────────────────────────
  const currentCEYear = new Date().getFullYear();
  const [reportMonth, setReportMonth] = useState(String(new Date().getMonth() + 1));
  const [reportYearBE, setReportYearBE] = useState(String(ceYearToBE(currentCEYear)));
  const [reportClass, setReportClass] = useState('');
  const [reportRows, setReportRows] = useState<ReportRow[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportLoaded, setReportLoaded] = useState(false);

  const loadReport = async () => {
    if (!reportClass) {
      toast({ title: 'กรุณาเลือกชั้นเรียน', variant: 'destructive' });
      return;
    }
    setReportLoading(true);
    setReportLoaded(false);
    try {
      const ceYear = beYearToCE(Number(reportYearBE));
      const month = Number(reportMonth);
      const startDate = `${ceYear}-${String(month).padStart(2, '0')}-01`;
      const endDay = new Date(ceYear, month, 0).getDate();
      const endDate = `${ceYear}-${String(month).padStart(2, '0')}-${endDay}`;

      const { data: students, error: sErr } = await studentsService.getByClass(reportClass);
      if (sErr) throw sErr;

      const studentIds = (students ?? []).map((s) => s.id);
      if (studentIds.length === 0) {
        setReportRows([]);
        setReportLoaded(true);
        return;
      }

      const { data: records, error: rErr } = await attendanceService.getByStudentIdsDateRange(
        studentIds, startDate, endDate
      );
      if (rErr) throw rErr;

      const schoolDays = new Set((records ?? []).map((r) => r.attendance_date)).size;

      const rows: ReportRow[] = (students ?? []).map((s) => {
        const recs = (records ?? []).filter((r) => r.student_id === s.id);
        const count = (status: string) => recs.filter((r) => r.status === status).length;
        return {
          student_id: s.id,
          name: s.name,
          student_code: s.student_code,
          class_number: s.class_number,
          present: count('present'),
          absent: count('absent'),
          late: count('late'),
          leave: count('leave'),
          total: schoolDays,
        };
      });

      setReportRows(rows);
      setReportLoaded(true);
    } catch (err: any) {
      toast({ title: 'เกิดข้อผิดพลาด', description: err.message, variant: 'destructive' });
    } finally {
      setReportLoading(false);
    }
  };

  // ── Export report ──────────────────────────────────────────────────────────
  const exportAttendanceCSV = () => {
    const month = THAI_MONTHS[Number(reportMonth) - 1];
    downloadCSV(`รายงานเช็คชื่อ_${reportClass}_${month}_${reportYearBE}`,
      ['เลขที่', 'ชื่อ-สกุล', 'รหัสนักเรียน', 'มาเรียน', 'ขาด', 'สาย', 'ลา', 'วันเรียนรวม'],
      reportRows.map(r => [r.class_number, r.name, r.student_code, r.present, r.absent, r.late, r.leave, r.total])
    );
  };
  const printAttendance = () => {
    const month = THAI_MONTHS[Number(reportMonth) - 1];
    const tHead = `<thead><tr><th>เลขที่</th><th>ชื่อ-สกุล</th><th>มาเรียน</th><th>ขาด</th><th>สาย</th><th>ลา</th><th>วันเรียน</th></tr></thead>`;
    const tBody = `<tbody>${reportRows.map(r => `<tr><td class="ctr">${r.class_number}</td><td>${r.name}</td><td class="ctr">${r.present}</td><td class="ctr">${r.absent}</td><td class="ctr">${r.late}</td><td class="ctr">${r.leave}</td><td class="ctr">${r.total}</td></tr>`).join('')}</tbody>`;
    printTable(`รายงานการมาเรียน ชั้น ${reportClass}`, `เดือน${month} พ.ศ. ${reportYearBE}`, `<table>${tHead}${tBody}</table>`);
  };

  // ── Tab 3: รายงานรายบุคคล ─────────────────────────────────────────────────
  const [indivClass, setIndivClass] = useState('');
  const [indivStudents, setIndivStudents] = useState<Student[]>([]);
  const [indivStudentId, setIndivStudentId] = useState('');
  const [indivRecords, setIndivRecords] = useState<{ attendance_date: string; status: AttendanceStatus }[]>([]);
  const [indivLoading, setIndivLoading] = useState(false);

  useEffect(() => {
    if (!indivClass) { setIndivStudents([]); setIndivStudentId(''); return; }
    (async () => {
      const { data } = await studentsService.getByClass(indivClass);
      setIndivStudents(data || []);
      setIndivStudentId('');
    })();
  }, [indivClass]);

  useEffect(() => {
    if (!indivStudentId) { setIndivRecords([]); return; }
    setIndivLoading(true);
    const end = new Date();
    const start = new Date(); start.setDate(end.getDate() - 29);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    (async () => {
      const { data } = await attendanceService.getByStudentDateRange(indivStudentId, fmt(start), fmt(end));
      setIndivRecords((data || []) as any);
      setIndivLoading(false);
    })();
  }, [indivStudentId]);

  const indivStudent = indivStudents.find(s => s.id === indivStudentId);
  const indivPresent = indivRecords.filter(r => r.status === 'present').length;
  const indivTotal = indivRecords.length;
  const indivPct = indivTotal > 0 ? Math.round((indivPresent / indivTotal) * 100) : 0;
  const chartColor = indivPct >= 80 ? '#22c55e' : indivPct >= 60 ? '#eab308' : '#ef4444';

  // ── Tab 4: รายชื่อนักเรียน ────────────────────────────────────────────────
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [filterClass, setFilterClass] = useState('');
  const [searchName, setSearchName] = useState('');
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentForm, setStudentForm] = useState<Omit<Student, 'id'>>({
    student_code: '',
    name: '',
    class: '',
    class_number: 1,
    gender: 'male',
    parent_name: '',
    parent_phone: '',
    is_active: true,
  });
  const [studentSaving, setStudentSaving] = useState(false);

  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      const { data, error } = await studentsService.getAll();
      if (error) throw error;
      setAllStudents(data ?? []);
    } catch (err: any) {
      toast({ title: 'เกิดข้อผิดพลาด', description: err.message, variant: 'destructive' });
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'students') fetchStudents();
  }, [activeTab]);

  const filteredStudents = allStudents.filter((s) => {
    const matchClass = filterClass ? s.class === filterClass : true;
    const matchName = searchName ? s.name.includes(searchName) : true;
    return matchClass && matchName;
  });

  const openAddDialog = () => {
    setEditingStudent(null);
    setStudentForm({
      student_code: '',
      name: '',
      class: '',
      class_number: 1,
      gender: 'male',
      parent_name: '',
      parent_phone: '',
      is_active: true,
    });
    setIsStudentDialogOpen(true);
  };

  const openEditDialog = (s: Student) => {
    setEditingStudent(s);
    setStudentForm({
      student_code: s.student_code,
      name: s.name,
      class: s.class,
      class_number: s.class_number,
      gender: s.gender,
      parent_name: s.parent_name,
      parent_phone: s.parent_phone,
      is_active: s.is_active,
    });
    setIsStudentDialogOpen(true);
  };

  const saveStudent = async () => {
    if (!studentForm.name || !studentForm.class || !studentForm.student_code) {
      toast({ title: 'กรุณากรอกข้อมูลที่จำเป็น', variant: 'destructive' });
      return;
    }
    setStudentSaving(true);
    try {
      if (editingStudent) {
        const { error } = await studentsService.update(editingStudent.id, studentForm);
        if (error) throw error;
        toast({ title: 'แก้ไขข้อมูลนักเรียนสำเร็จ' });
      } else {
        const { error } = await studentsService.insert(studentForm);
        if (error) throw error;
        toast({ title: 'เพิ่มนักเรียนสำเร็จ' });
      }
      setIsStudentDialogOpen(false);
      fetchStudents();
    } catch (err: any) {
      toast({ title: 'เกิดข้อผิดพลาด', description: err.message, variant: 'destructive' });
    } finally {
      setStudentSaving(false);
    }
  };

  const deleteStudent = async (s: Student) => {
    if (!confirm(`ต้องการลบ "${s.name}" ออกจากระบบ?`)) return;
    try {
      const { error } = await studentsService.delete(s.id);
      if (error) throw error;
      toast({ title: 'ลบนักเรียนสำเร็จ' });
      fetchStudents();
    } catch (err: any) {
      toast({ title: 'เกิดข้อผิดพลาด', description: err.message, variant: 'destructive' });
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">ระบบเช็คชื่อนักเรียน</h2>
        <p className="text-gray-500 text-sm mt-1">จัดการการเช็คชื่อ รายงานการมาเรียน และรายชื่อนักเรียน</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {([
          { key: 'checkin', label: 'เช็คชื่อ', icon: ClipboardList },
          { key: 'report', label: 'รายงานชั้นเรียน', icon: BarChart3 },
          { key: 'individual', label: 'รายงานรายบุคคล', icon: UserRound },
          { key: 'students', label: 'รายชื่อนักเรียน', icon: Users },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === key
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ───────────── Tab 1: เช็คชื่อ ───────────── */}
      {activeTab === 'checkin' && (
        <div className="space-y-4">
          {/* Controls */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                  <Label>วันที่</Label>
                  <Input
                    type="date"
                    value={checkinDate}
                    onChange={(e) => {
                      setCheckinDate(e.target.value);
                      setDataLoaded(false);
                    }}
                    className="w-44"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>ชั้นเรียน</Label>
                  <Select
                    value={checkinClass}
                    onValueChange={(v) => {
                      setCheckinClass(v);
                      setDataLoaded(false);
                    }}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="เลือกชั้น" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASSES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={loadCheckin} disabled={checkinLoading}>
                  {checkinLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ClipboardList className="w-4 h-4 mr-2" />
                  )}
                  โหลดรายชื่อ
                </Button>
                <RecorderSelect
                  value={recorder}
                  onChange={setRecorder}
                  required
                  className="w-56"
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary bar */}
          {dataLoaded && (
            <div className="flex flex-wrap gap-3">
              {(Object.entries(STATUS_CONFIG) as [AttendanceStatus, typeof STATUS_CONFIG[AttendanceStatus]][]).map(
                ([status, cfg]) => (
                  <div
                    key={status}
                    className="flex items-center gap-2 bg-white border rounded-lg px-4 py-2 shadow-sm"
                  >
                    <span className={`text-sm font-medium ${cfg.color}`}>{cfg.activeText}</span>
                    <span className="text-lg font-bold text-gray-800">{summary[status]}</span>
                    <span className="text-xs text-gray-400">คน</span>
                  </div>
                )
              )}
              <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-4 py-2 shadow-sm">
                <span className="text-sm font-medium text-gray-600">ยังไม่ได้เช็ค</span>
                <span className="text-lg font-bold text-gray-800">
                  {checkinStudents.length - Object.keys(attendanceMap).length}
                </span>
                <span className="text-xs text-gray-400">คน</span>
              </div>
            </div>
          )}

          {/* Student grid */}
          {dataLoaded && checkinStudents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  รายชื่อนักเรียน ชั้น {checkinClass} — {checkinStudents.length} คน
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {checkinStudents.map((s) => {
                    const currentStatus = attendanceMap[s.id];
                    return (
                      <div
                        key={s.id}
                        className="flex items-center gap-3 py-2 border-b last:border-b-0"
                      >
                        <span className="w-8 text-center text-sm font-semibold text-gray-500">
                          {s.class_number}
                        </span>
                        {s.photo_url ? (
                          <img src={s.photo_url} alt={s.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-gray-200" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 flex-shrink-0">
                            {s.name.slice(0, 1)}
                          </div>
                        )}
                        <span className="flex-1 text-sm font-medium text-gray-800">{s.name}</span>
                        <div className="flex gap-1">
                          {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((st) => (
                            <StatusButton
                              key={st}
                              status={st}
                              active={currentStatus === st}
                              onClick={() => setStatus(s.id, st)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  {absentStudents.length > 0 && (
                    <Button variant="outline" onClick={() => setNotifyOpen(true)} className="gap-1 text-orange-600 border-orange-300 hover:bg-orange-50">
                      <Bell className="w-4 h-4" />
                      แจ้งผู้ปกครอง ({absentStudents.length} คน)
                    </Button>
                  )}
                  <Button onClick={saveAll} disabled={saveLoading} className="bg-blue-600 hover:bg-blue-700">
                    {saveLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    บันทึกทั้งหมด
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {dataLoaded && checkinStudents.length === 0 && (
            <EmptyState
              variant="inline"
              illustration={<NoPeopleIllustration />}
              title="ไม่พบนักเรียน"
              description={`ยังไม่มีนักเรียนในชั้น ${checkinClass}`}
            />
          )}
        </div>
      )}

      {/* ───────────── Tab 2: รายงาน ───────────── */}
      {activeTab === 'report' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                  <Label>เดือน</Label>
                  <Select value={reportMonth} onValueChange={setReportMonth}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="เลือกเดือน" />
                    </SelectTrigger>
                    <SelectContent>
                      {THAI_MONTHS.map((m, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label>ปี (พ.ศ.)</Label>
                  <Input
                    type="number"
                    value={reportYearBE}
                    onChange={(e) => setReportYearBE(e.target.value)}
                    className="w-28"
                    min="2560"
                    max="2600"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>ชั้นเรียน</Label>
                  <Select value={reportClass} onValueChange={setReportClass}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="เลือกชั้น" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASSES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={loadReport} disabled={reportLoading}>
                  {reportLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <BarChart3 className="w-4 h-4 mr-2" />
                  )}
                  ดูรายงาน
                </Button>
              </div>
            </CardContent>
          </Card>

          {reportLoaded && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base">
                    รายงานการมาเรียน — ชั้น {reportClass} เดือน{' '}
                    {THAI_MONTHS[Number(reportMonth) - 1]} พ.ศ. {reportYearBE}
                  </CardTitle>
                  {reportRows.length > 0 && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={exportAttendanceCSV} className="gap-1 text-green-700 border-green-300 hover:bg-green-50">
                        <Download className="w-3.5 h-3.5" /> CSV
                      </Button>
                      <Button size="sm" variant="outline" onClick={printAttendance} className="gap-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50">
                        <Printer className="w-3.5 h-3.5" /> พิมพ์
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {reportRows.length === 0 ? (
                  <EmptyState
                    variant="inline"
                    illustration={<NoDataIllustration />}
                    title="ไม่พบข้อมูล"
                    description="ไม่พบข้อมูลในช่วงเวลาที่เลือก ลองปรับช่วงวันที่อีกครั้ง"
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left py-2 px-3 font-semibold text-gray-600">เลขที่</th>
                          <th className="text-left py-2 px-3 font-semibold text-gray-600">ชื่อ-สกุล</th>
                          <th className="text-center py-2 px-3 font-semibold text-green-700">มาเรียน</th>
                          <th className="text-center py-2 px-3 font-semibold text-red-700">ขาด</th>
                          <th className="text-center py-2 px-3 font-semibold text-yellow-700">สาย</th>
                          <th className="text-center py-2 px-3 font-semibold text-blue-700">ลา</th>
                          <th className="text-center py-2 px-3 font-semibold text-gray-600">วันเรียน</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportRows.map((row) => (
                          <tr
                            key={row.student_id}
                            className={`border-b last:border-b-0 ${
                              row.absent > 3 ? 'bg-red-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <td className="py-2 px-3 text-gray-500">{row.class_number}</td>
                            <td className="py-2 px-3 font-medium text-gray-800">
                              {row.name}
                              {row.absent > 3 && (
                                <Badge className="ml-2 bg-red-100 text-red-700 text-xs">
                                  ขาดเกิน 3 วัน
                                </Badge>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center font-semibold text-green-700">
                              {row.present}
                            </td>
                            <td
                              className={`py-2 px-3 text-center font-semibold ${
                                row.absent > 3 ? 'text-red-700' : 'text-red-500'
                              }`}
                            >
                              {row.absent}
                            </td>
                            <td className="py-2 px-3 text-center font-semibold text-yellow-600">
                              {row.late}
                            </td>
                            <td className="py-2 px-3 text-center font-semibold text-blue-600">
                              {row.leave}
                            </td>
                            <td className="py-2 px-3 text-center text-gray-600">{row.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ───────────── Tab 3: รายงานรายบุคคล ───────────── */}
      {activeTab === 'individual' && (
        <div className="space-y-4">
          {/* Selectors */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                  <Label>ชั้นเรียน</Label>
                  <Select value={indivClass} onValueChange={setIndivClass}>
                    <SelectTrigger className="w-36"><SelectValue placeholder="เลือกชั้น" /></SelectTrigger>
                    <SelectContent>
                      {CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {indivStudents.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <Label>นักเรียน</Label>
                    <Select value={indivStudentId} onValueChange={setIndivStudentId}>
                      <SelectTrigger className="w-56"><SelectValue placeholder="เลือกนักเรียน" /></SelectTrigger>
                      <SelectContent>
                        {indivStudents.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            <div className="flex items-center gap-2">
                              {s.photo_url ? (
                                <img src={s.photo_url} alt={s.name} className="w-6 h-6 rounded-full object-cover" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">{s.name.slice(0,1)}</div>
                              )}
                              <span>{s.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Report */}
          {indivStudent && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Profile card */}
              <Card>
                <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
                  {indivStudent.photo_url ? (
                    <img src={indivStudent.photo_url} alt={indivStudent.name} className="w-24 h-24 rounded-full object-cover border-4 border-blue-100" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-600">
                      {indivStudent.name.slice(0,1)}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-gray-800">{indivStudent.name}</div>
                    <div className="text-sm text-gray-500">ชั้น {indivStudent.class} เลขที่ {indivStudent.class_number}</div>
                    {indivStudent.student_code && <div className="text-xs text-gray-400 mt-1">รหัส {indivStudent.student_code}</div>}
                  </div>
                  {/* mini stats */}
                  <div className="grid grid-cols-2 gap-2 w-full text-sm mt-1">
                    <div className="bg-green-50 rounded-lg p-2">
                      <div className="font-bold text-green-700 text-lg">{indivPresent}</div>
                      <div className="text-green-600 text-xs">มาเรียน</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-2">
                      <div className="font-bold text-red-700 text-lg">{indivRecords.filter(r=>r.status==='absent').length}</div>
                      <div className="text-red-600 text-xs">ขาด</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-2">
                      <div className="font-bold text-yellow-700 text-lg">{indivRecords.filter(r=>r.status==='late').length}</div>
                      <div className="text-yellow-600 text-xs">สาย</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2">
                      <div className="font-bold text-blue-700 text-lg">{indivRecords.filter(r=>r.status==='leave').length}</div>
                      <div className="text-blue-600 text-xs">ลา</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Radial chart */}
              <Card>
                <CardHeader><CardTitle className="text-sm text-center">อัตราการมาเรียน (30 วัน)</CardTitle></CardHeader>
                <CardContent>
                  {indivLoading ? (
                    <ListSkeleton count={5} className="py-2" />
                  ) : indivTotal === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">ยังไม่มีข้อมูล</div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <ResponsiveContainer width="100%" height={160}>
                        <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" data={[{ value: indivPct, fill: chartColor }]} startAngle={90} endAngle={-270}>
                          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                          <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#f3f4f6' }} />
                        </RadialBarChart>
                      </ResponsiveContainer>
                      <div className="text-center -mt-4">
                        <div className="text-3xl font-bold" style={{ color: chartColor }}>{indivPct}%</div>
                        <div className="text-xs text-gray-500 mt-1">{indivPresent} จาก {indivTotal} วัน</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 30-day table */}
              <Card>
                <CardHeader><CardTitle className="text-sm">ประวัติ 30 วันล่าสุด</CardTitle></CardHeader>
                <CardContent className="p-0 max-h-72 overflow-y-auto">
                  {indivRecords.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">ไม่มีข้อมูล</div>
                  ) : (
                    <table className="w-full text-sm">
                      <tbody>
                        {indivRecords.map(r => {
                          const cfg = STATUS_CONFIG[r.status];
                          return (
                            <tr key={r.attendance_date} className="border-b last:border-b-0">
                              <td className="px-4 py-2 text-gray-500">{r.attendance_date}</td>
                              <td className="px-4 py-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.activeBg}`}>
                                  {cfg.activeText}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ───────────── Tab 4: รายชื่อนักเรียน ───────────── */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          {/* Filters + Add */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                  <Label>ชั้นเรียน</Label>
                  <Select value={filterClass || '__all__'} onValueChange={v => setFilterClass(v === '__all__' ? '' : v)}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="ทุกชั้น" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">ทุกชั้น</SelectItem>
                      {CLASSES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label>ค้นหาชื่อ</Label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" />
                    <Input
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      placeholder="ค้นหา..."
                      className="pl-8 w-48"
                    />
                  </div>
                </div>
                <div className="ml-auto flex gap-2">
                  <Button variant="outline" onClick={fetchStudents} disabled={studentsLoading}>
                    <RefreshCw className={`w-4 h-4 mr-1 ${studentsLoading ? 'animate-spin' : ''}`} />
                    รีเฟรช
                  </Button>
                  <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-1" />
                    เพิ่มนักเรียน
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              {studentsLoading ? (
                <TableSkeleton rows={6} cols={4} className="py-2" />
              ) : filteredStudents.length === 0 ? (
                <EmptyState
                  variant="inline"
                  illustration={<NoPeopleIllustration />}
                  title="ไม่พบนักเรียน"
                  description="ลองปรับตัวกรองหรือค้นหาด้วยคำอื่น"
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-2 px-3 font-semibold text-gray-600">รหัสนักเรียน</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-600">ชื่อ-สกุล</th>
                        <th className="text-center py-2 px-3 font-semibold text-gray-600">ชั้น</th>
                        <th className="text-center py-2 px-3 font-semibold text-gray-600">เลขที่</th>
                        <th className="text-center py-2 px-3 font-semibold text-gray-600">เพศ</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-600">ผู้ปกครอง</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-600">โทรศัพท์</th>
                        <th className="text-center py-2 px-3 font-semibold text-gray-600">สถานะ</th>
                        <th className="text-center py-2 px-3 font-semibold text-gray-600">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((s) => (
                        <tr key={s.id} className="border-b last:border-b-0 hover:bg-gray-50">
                          <td className="py-2 px-3 font-mono text-xs text-gray-600">{s.student_code}</td>
                          <td className="py-2 px-3 font-medium text-gray-800">{s.name}</td>
                          <td className="py-2 px-3 text-center text-gray-600">{s.class}</td>
                          <td className="py-2 px-3 text-center text-gray-600">{s.class_number}</td>
                          <td className="py-2 px-3 text-center text-gray-600">
                            {s.gender === 'male' ? 'ชาย' : 'หญิง'}
                          </td>
                          <td className="py-2 px-3 text-gray-600">{s.parent_name || '-'}</td>
                          <td className="py-2 px-3 text-gray-600">{s.parent_phone || '-'}</td>
                          <td className="py-2 px-3 text-center">
                            <Badge
                              className={
                                s.is_active
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-500'
                              }
                            >
                              {s.is_active ? 'กำลังเรียน' : 'ไม่ใช้งาน'}
                            </Badge>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex justify-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 w-7 p-0"
                                onClick={() => openEditDialog(s)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => deleteStudent(s)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3 text-xs text-gray-400 text-right">
                    แสดง {filteredStudents.length} จาก {allStudents.length} คน
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ───────────── Student Dialog ───────────── */}
      <Dialog open={isStudentDialogOpen} onOpenChange={setIsStudentDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingStudent ? 'แก้ไขข้อมูลนักเรียน' : 'เพิ่มนักเรียนใหม่'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label>รหัสนักเรียน *</Label>
                <Input
                  value={studentForm.student_code}
                  onChange={(e) => setStudentForm((p) => ({ ...p, student_code: e.target.value }))}
                  placeholder="เช่น 12345"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label>เลขที่</Label>
                <Input
                  type="number"
                  min={1}
                  value={studentForm.class_number}
                  onChange={(e) =>
                    setStudentForm((p) => ({ ...p, class_number: Number(e.target.value) }))
                  }
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label>ชื่อ-สกุล *</Label>
              <Input
                value={studentForm.name}
                onChange={(e) => setStudentForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="เด็กชาย/เด็กหญิง..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label>ชั้นเรียน *</Label>
                <Select
                  value={studentForm.class}
                  onValueChange={(v) => setStudentForm((p) => ({ ...p, class: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกชั้น" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASSES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label>เพศ</Label>
                <Select
                  value={studentForm.gender}
                  onValueChange={(v) => setStudentForm((p) => ({ ...p, gender: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">ชาย</SelectItem>
                    <SelectItem value="female">หญิง</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label>ชื่อผู้ปกครอง</Label>
              <Input
                value={studentForm.parent_name}
                onChange={(e) => setStudentForm((p) => ({ ...p, parent_name: e.target.value }))}
                placeholder="ชื่อผู้ปกครอง"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>เบอร์โทรผู้ปกครอง</Label>
              <Input
                value={studentForm.parent_phone}
                onChange={(e) => setStudentForm((p) => ({ ...p, parent_phone: e.target.value }))}
                placeholder="0XX-XXX-XXXX"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="is_active"
                type="checkbox"
                checked={studentForm.is_active}
                onChange={(e) => setStudentForm((p) => ({ ...p, is_active: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                กำลังเรียนอยู่ (นักเรียนที่ไม่ใช้งานจะไม่ปรากฏในการเช็คชื่อ)
              </Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsStudentDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button
                onClick={saveStudent}
                disabled={studentSaving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {studentSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                บันทึก
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ───────────── Dialog: แจ้งผู้ปกครอง ───────────── */}
      <Dialog open={notifyOpen} onOpenChange={setNotifyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <Bell className="w-5 h-5" /> แจ้งผู้ปกครองนักเรียนขาดเรียน
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              วันที่ {checkinDate} ชั้น {checkinClass} — ขาดเรียน {absentStudents.length} คน
            </p>
            <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-xs">ชื่อ-สกุล</th>
                    <th className="text-left px-3 py-2 font-medium text-xs">ผู้ปกครอง</th>
                    <th className="text-left px-3 py-2 font-medium text-xs">เบอร์โทร</th>
                  </tr>
                </thead>
                <tbody>
                  {absentStudents.map(s => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-3 py-2">{s.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{s.parent_name || '—'}</td>
                      <td className="px-3 py-2">
                        {s.parent_phone ? (
                          <a href={`tel:${s.parent_phone}`} className="text-blue-600 hover:underline">{s.parent_phone}</a>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded p-3 text-xs text-orange-800">
              <p className="font-medium mb-1">ข้อความตัวอย่างสำหรับ SMS/LINE:</p>
              <p className="font-mono leading-relaxed select-all">
                เรียน ผู้ปกครอง{'\n'}
                บุตรหลานของท่านไม่ได้มาเรียนในวันที่ {checkinDate}{'\n'}
                กรุณาติดต่อครูประจำชั้น{'\n'}
                โรงเรียน
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full gap-1"
              onClick={() => {
                const text = absentStudents.map(s => `${s.name} — ${s.parent_phone || 'ไม่มีเบอร์'}`).join('\n');
                navigator.clipboard.writeText(`รายชื่อนักเรียนขาดเรียน ${checkinDate} ชั้น ${checkinClass}\n${text}`);
                toast({ title: 'คัดลอกรายชื่อแล้ว' });
              }}
            >
              <Download className="w-4 h-4" /> คัดลอกรายชื่อ
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifyOpen(false)}>ปิด</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
