import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Plus,
  Users,
  Search,
  Trash2,
  QrCode,
  Sparkles,
  BookMarked,
  Layers,
  FileSpreadsheet,
  Award,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { formatThaiDateMedium } from '@/lib/thaiDate';
import { StudentQRScanner } from '@/components/shared/StudentQRScanner';
import { cn } from '@/lib/utils';
import {
  readingBankService,
  BOOK_CATEGORIES,
  type ReadingStudentSummary,
  type ReadingLog,
} from '@/services/reading-bank.service';
import { studentsService } from '@/services/students.service';

const CLASSES = ['อ.1', 'อ.2', 'อ.3', 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];

type TabId = 'record' | 'summary' | 'logs';

export const ReadingBankManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('record');
  const [scannerOpen, setScannerOpen] = useState(false);

  // Form State
  const [selectedClass, setSelectedClass] = useState<string>('ป.1');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [form, setForm] = useState({
    bookTitle: '',
    bookAuthor: '',
    bookCategory: 'นิทาน/วรรณกรรม',
    pagesRead: 1,
    summaryNotes: '',
    rating: 5,
  });

  // Filter state for summary tab
  const [summaryClassFilter, setSummaryClassFilter] = useState('all');
  const [summarySearch, setSummarySearch] = useState('');

  // Queries
  const studentsQuery = useQuery({
    queryKey: ['students', 'by-class', selectedClass],
    queryFn: async () => {
      const { data } = await studentsService.getByClass(selectedClass);
      return data ?? [];
    },
    enabled: Boolean(selectedClass),
  });

  const summariesQuery = useQuery({
    queryKey: ['reading-bank', 'summaries'],
    queryFn: async () => {
      const { data } = await readingBankService.getAllSummaries();
      return (data ?? []) as ReadingStudentSummary[];
    },
  });

  const logsQuery = useQuery({
    queryKey: ['reading-bank', 'logs'],
    queryFn: async () => {
      const { data } = await readingBankService.getRecentLogs(100);
      return (data ?? []) as ReadingLog[];
    },
  });

  const studentsList = studentsQuery.data ?? [];
  const selectedStudent = studentsList.find((s) => s.id === selectedStudentId);

  // Mutations
  const recordMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStudent?.student_code) {
        throw new Error('กรุณาเลือกนักเรียนที่มีรหัสประจำตัว');
      }
      const { error } = await readingBankService.recordEntry({
        code: selectedStudent.student_code,
        bookTitle: form.bookTitle,
        bookAuthor: form.bookAuthor,
        bookCategory: form.bookCategory,
        pagesRead: Number(form.pagesRead),
        summaryNotes: form.summaryNotes,
        rating: form.rating,
        recordedBy: 'คุณครูผู้สอน',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'บันทึกการอ่านสำเร็จ!',
        description: `บันทึก "${form.bookTitle}" ให้ ${selectedStudent?.name} เรียบร้อย`,
      });
      setForm({
        bookTitle: '',
        bookAuthor: '',
        bookCategory: 'นิทาน/วรรณกรรม',
        pagesRead: 1,
        summaryNotes: '',
        rating: 5,
      });
      queryClient.invalidateQueries({ queryKey: ['reading-bank'] });
    },
    onError: (err: Error) => {
      toast({ title: 'บันทึกไม่สำเร็จ', description: err.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => readingBankService.deleteLog(id),
    onSuccess: () => {
      toast({ title: 'ลบรายการสำเร็จ' });
      queryClient.invalidateQueries({ queryKey: ['reading-bank'] });
    },
    onError: (err: Error) => {
      toast({ title: 'ลบไม่สำเร็จ', description: err.message, variant: 'destructive' });
    },
  });

  const allSummaries = summariesQuery.data ?? [];
  const filteredSummaries = allSummaries.filter((s) => {
    if (summaryClassFilter !== 'all' && s.class_name !== summaryClassFilter) return false;
    if (summarySearch.trim()) {
      const q = summarySearch.toLowerCase();
      return s.full_name.toLowerCase().includes(q) || (s.student_code && s.student_code.includes(q));
    }
    return true;
  });

  const exportSummaryCsv = () => {
    const headers = ['รหัสนักเรียน', 'ชื่อ-นามสกุล', 'ชั้นเรียน', 'จำนวนเล่มที่อ่าน', 'จำนวนหน้าที่อ่าน', 'แต้มสะสม', 'ระดับนักอ่าน'];
    const rows = filteredSummaries.map((s) => [
      s.student_code ?? '',
      s.full_name,
      s.class_name ?? '',
      s.total_books,
      s.total_pages,
      s.total_points,
      s.reading_tier,
    ]);
    const csvContent = '\uFEFF' + [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reading_summary_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">ระบบจัดการธนาคารการอ่าน (Reading Bank Admin)</h2>
            <p className="text-xs text-muted-foreground">บันทึกชั่วโมงรักการอ่าน สะสมแต้มหน้าหนังสือ และส่งเสริมวินัยการเรียนรู้</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 bg-muted p-1 rounded-xl">
          <Button
            size="sm"
            variant={activeTab === 'record' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('record')}
            className="text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> บันทึกการอ่าน
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'summary' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('summary')}
            className="text-xs font-bold"
          >
            <Users className="w-3.5 h-3.5 mr-1" /> สรุปยอดนักเรียน
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'logs' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('logs')}
            className="text-xs font-bold"
          >
            <Layers className="w-3.5 h-3.5 mr-1" /> ประวัติการอ่าน
          </Button>
        </div>
      </div>

      {/* ─── TAB 1: Record Reading Entry ─────────────────────────── */}
      {activeTab === 'record' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Student Selector */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" /> เลือกนักเรียน
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setScannerOpen(true)}
                  className="h-8 text-xs font-semibold"
                >
                  <QrCode className="w-3.5 h-3.5 mr-1" /> สแกน QR
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">ระดับชั้นเรียน</label>
                <Select value={selectedClass} onValueChange={(val) => { setSelectedClass(val); setSelectedStudentId(''); }}>
                  <SelectTrigger className="mt-1 bg-background text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASSES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                {studentsList.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStudentId(st.id)}
                    className={cn(
                      'w-full flex items-center gap-2.5 p-2 rounded-xl border text-left transition',
                      selectedStudentId === st.id
                        ? 'border-primary bg-primary/10 text-foreground font-bold'
                        : 'border-border bg-card hover:bg-muted text-foreground',
                    )}
                  >
                    <PersonAvatar name={st.name} photoUrl={st.photo_url} className="w-8 h-8 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs">{st.name}</p>
                      <p className="text-[10px] text-muted-foreground">เลขที่ {st.class_number ?? '—'} · รหัส {st.student_code ?? '—'}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Right: Book Details Form */}
          <Card className="lg:col-span-2 bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-primary" /> ข้อมูลหนังสือที่อ่าน
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedStudent ? (
                <div className="p-3 mb-4 rounded-xl bg-muted/60 border border-border flex items-center gap-3">
                  <PersonAvatar name={selectedStudent.name} photoUrl={selectedStudent.photo_url} className="w-10 h-10 shrink-0" />
                  <div>
                    <p className="font-bold text-sm text-foreground">{selectedStudent.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedStudent.class} · รหัสนักเรียน {selectedStudent.student_code}</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 mb-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                  โปรดเลือกนักเรียนจากรายการด้านซ้าย หรือกด "สแกน QR" ก่อนบันทึก
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!selectedStudentId) {
                    toast({ title: 'โปรดเลือกนักเรียนก่อน', variant: 'destructive' });
                    return;
                  }
                  recordMutation.mutate();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs font-bold text-foreground">ชื่อหนังสือ *</label>
                  <Input
                    required
                    value={form.bookTitle}
                    onChange={(e) => setForm({ ...form, bookTitle: e.target.value })}
                    placeholder="เช่น นิทานอีสป, สารคดีไดโนเสาร์, หนังสือเรียนภาษาพาที"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-foreground">ผู้แต่ง / สำนักพิมพ์ (ถ้ามี)</label>
                    <Input
                      value={form.bookAuthor}
                      onChange={(e) => setForm({ ...form, bookAuthor: e.target.value })}
                      placeholder="เช่น กระทรวงศึกษาธิการ, สุริยันต์"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground">จำนวนหน้าที่อ่าน (หน้า) *</label>
                    <Input
                      type="number"
                      min="1"
                      max="1000"
                      required
                      value={form.pagesRead}
                      onChange={(e) => setForm({ ...form, pagesRead: parseInt(e.target.value, 10) || 1 })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-foreground">หมวดหมู่หนังสือ</label>
                    <Select
                      value={form.bookCategory}
                      onValueChange={(val) => setForm({ ...form, bookCategory: val })}
                    >
                      <SelectTrigger className="mt-1 bg-background text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BOOK_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground">ระดับความประทับใจ (ดาว)</label>
                    <Select
                      value={String(form.rating)}
                      onValueChange={(val) => setForm({ ...form, rating: Number(val) })}
                    >
                      <SelectTrigger className="mt-1 bg-background text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">⭐⭐⭐⭐⭐ (ยอดเยี่ยม 5 ดาว)</SelectItem>
                        <SelectItem value="4">⭐⭐⭐⭐ (ดีมาก 4 ดาว)</SelectItem>
                        <SelectItem value="3">⭐⭐⭐ (ดี 3 ดาว)</SelectItem>
                        <SelectItem value="2">⭐⭐ (พอใช้ 2 ดาว)</SelectItem>
                        <SelectItem value="1">⭐ (1 ดาว)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">ข้อคิดหรือเรื่องย่อสั้นๆ</label>
                  <Input
                    value={form.summaryNotes}
                    onChange={(e) => setForm({ ...form, summaryNotes: e.target.value })}
                    placeholder="เช่น สอนให้ขยันหมั่นเพียร ไม่ประมาท"
                    className="mt-1"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={!selectedStudentId || recordMutation.isPending}
                    className="font-bold px-6"
                  >
                    {recordMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกการอ่านลงสมุด'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── TAB 2: Summary of All Students ──────────────────────── */}
      {activeTab === 'summary' && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> สรุปยอดการอ่านสะสมรายบุคคล
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={exportSummaryCsv} className="h-8 text-xs">
                  <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-600" /> ส่งออก CSV
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Input
                placeholder="ค้นหาชื่อ หรือ รหัสนักเรียน..."
                value={summarySearch}
                onChange={(e) => setSummarySearch(e.target.value)}
                className="max-w-xs h-8 text-xs"
              />
              <Select value={summaryClassFilter} onValueChange={setSummaryClassFilter}>
                <SelectTrigger className="w-[130px] h-8 text-xs bg-background">
                  <SelectValue placeholder="ทุกชั้นเรียน" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกชั้นเรียน</SelectItem>
                  {CLASSES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground text-left">
                    <th className="p-3">นักเรียน</th>
                    <th className="p-3">ชั้น</th>
                    <th className="p-3 text-right">จำนวนเล่ม</th>
                    <th className="p-3 text-right">จำนวนหน้า</th>
                    <th className="p-3 text-right">แต้มการอ่าน</th>
                    <th className="p-3">ระดับนักอ่าน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredSummaries.map((s) => (
                    <tr key={s.student_id} className="hover:bg-muted/30 transition">
                      <td className="p-3 flex items-center gap-2.5">
                        <PersonAvatar name={s.full_name} photoUrl={s.photo_url} className="w-7 h-7 shrink-0" />
                        <div>
                          <p className="font-bold text-foreground">{s.full_name}</p>
                          <p className="text-[10px] text-muted-foreground">{s.student_code ?? '—'}</p>
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground">{s.class_name}</td>
                      <td className="p-3 text-right font-bold text-foreground">{s.total_books} เล่ม</td>
                      <td className="p-3 text-right font-black text-foreground">{s.total_pages.toLocaleString()} หน้า</td>
                      <td className="p-3 text-right font-bold text-teal-600">{s.total_points.toLocaleString()}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[11px] font-semibold">
                          {s.reading_tier}
                        </Badge>
                      </td>
                    </tr>
                  ))}

                  {filteredSummaries.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        ไม่พบข้อมูลนักเรียนตามเงื่อนไขที่เลือก
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── TAB 3: Recent Logs ──────────────────────────────────── */}
      {activeTab === 'logs' && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" /> ประวัติการบันทึกหนังสือล่าสุด (100 รายการล่าสุด)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {(logsQuery.data ?? []).map((log) => (
                <div key={log.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-muted/30 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <PersonAvatar name={log.student_name} photoUrl={log.students?.photo_url} className="w-8 h-8 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{log.book_title}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.student_name} ({log.student_class}) · {log.book_category} · {formatThaiDateMedium(log.reading_date)}
                      </p>
                      {log.summaryNotes && (
                        <p className="text-xs text-slate-600 italic line-clamp-1">"{log.summaryNotes}"</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">
                        {log.pages_read} หน้า
                      </span>
                      <p className="text-[10px] text-muted-foreground pt-0.5">{'⭐'.repeat(log.rating || 5)}</p>
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`ต้องการลบรายการบันทึก "${log.book_title}" ของ ${log.student_name}?`)) {
                          deleteMutation.mutate(log.id);
                        }
                      }}
                      className="text-muted-foreground hover:text-destructive h-8 w-8"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {(logsQuery.data ?? []).length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  ยังไม่มีประวัติการบันทึกการอ่าน
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* QR Scanner Dialog */}
      <StudentQRScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanned={(studentId) => {
          setSelectedStudentId(studentId);
          setScannerOpen(false);
          toast({ title: 'สแกน QR สำเร็จ', description: 'เลือกนักเรียนในแบบฟอร์มแล้ว' });
        }}
      />
    </div>
  );
};
