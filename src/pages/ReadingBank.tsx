import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Search,
  Trophy,
  Sparkles,
  Star,
  Plus,
  Flame,
  Award,
  Layers,
  ChevronRight,
  BookMarked,
  Library,
  PawPrint,
  Clock,
  Heart,
} from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatThaiDateMedium } from '@/lib/thaiDate';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import {
  readingBankService,
  BOOK_CATEGORIES,
  type ReadingStudentSummary,
  type StudentReadingHistoryRow,
  type PublicReadingLeaderboardEntry,
} from '@/services/reading-bank.service';
import { studentPetService } from '@/services/student-pet.service';
import { PetVisual } from '@/components/games/PetVisual';

const CLASSES = ['อ.1', 'อ.2', 'อ.3', 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];

export default function ReadingBank() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search & lookup state
  const [searchCode, setSearchCode] = useState('');
  const [activeCode, setActiveCode] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);

  // New reading entry form state
  const [entryForm, setEntryForm] = useState({
    code: '',
    bookTitle: '',
    bookAuthor: '',
    bookCategory: 'นิทาน/วรรณกรรม',
    pagesRead: 1,
    summaryNotes: '',
    rating: 5,
  });

  // Queries
  const leaderboardQuery = useQuery({
    queryKey: ['reading-bank', 'leaderboard'],
    queryFn: () => readingBankService.getLeaderboard(100),
    staleTime: 30_000,
  });

  const studentQuery = useQuery({
    queryKey: ['reading-bank', 'student', activeCode],
    queryFn: async () => {
      if (!activeCode) return null;
      const [sumRes, histRes, petRes] = await Promise.all([
        readingBankService.lookupStudent(activeCode),
        readingBankService.getStudentHistory(activeCode, 50),
        studentPetService.getCompanion(activeCode).catch(() => null),
      ]);
      return {
        summary: (sumRes.data ?? [])[0] ?? null,
        history: histRes.data ?? [],
        companion: petRes ?? null,
      };
    },
    enabled: Boolean(activeCode),
  });

  const studentSummary = studentQuery.data?.summary ?? null;
  const studentHistory = studentQuery.data?.history ?? [];
  const companion = studentQuery.data?.companion ?? null;

  // Add reading entry mutation
  const recordMutation = useMutation({
    mutationFn: async (data: typeof entryForm) => {
      const { error } = await readingBankService.recordEntry({
        code: data.code,
        bookTitle: data.bookTitle,
        bookAuthor: data.bookAuthor,
        bookCategory: data.bookCategory,
        pagesRead: Number(data.pagesRead),
        summaryNotes: data.summaryNotes,
        rating: data.rating,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: '🎉 บันทึกการอ่านสำเร็จ!',
        description: `สะสมเพิ่ม ${entryForm.pagesRead} หน้า และคู่หูสัตว์เลี้ยงได้รับ 15 Bond XP`,
      });
      setRecordDialogOpen(false);
      if (entryForm.code.trim()) {
        setActiveCode(entryForm.code.trim());
      }
      setEntryForm({
        code: activeCode || '',
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
      toast({
        title: 'บันทึกไม่สำเร็จ',
        description: err.message.includes('STUDENT_NOT_FOUND')
          ? 'ไม่พบรหัสนักเรียน กรุณาตรวจสอบรหัสประจำตัว'
          : err.message,
        variant: 'destructive',
      });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const c = searchCode.trim();
    if (!c) return;
    setActiveCode(c);
    setEntryForm((prev) => ({ ...prev, code: c }));
  };

  const rawLeaderboard = leaderboardQuery.data?.data ?? [];
  const filteredLeaderboard = useMemo(() => {
    if (classFilter === 'all') return rawLeaderboard;
    return rawLeaderboard.filter((s) => s.class_name === classFilter);
  }, [rawLeaderboard, classFilter]);

  const top3 = useMemo(() => filteredLeaderboard.slice(0, 3), [filteredLeaderboard]);

  const totalStats = useMemo(() => {
    const totalBooks = rawLeaderboard.reduce((acc, s) => acc + (s.total_books || 0), 0);
    const totalPages = rawLeaderboard.reduce((acc, s) => acc + (s.total_pages || 0), 0);
    const totalReaders = rawLeaderboard.length;
    return { totalBooks, totalPages, totalReaders };
  }, [rawLeaderboard]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEOHead
        title="ธนาคารการอ่าน (Reading Bank) — โรงเรียนบ้านคำไผ่"
        description="ระบบบันทึกรักการอ่าน สะสมแต้มหน้าหนังสือ และพัฒนาตนเองไปพร้อมสัตว์เลี้ยงคู่หูทางปัญญา"
      />
      <SiteHeader />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* ─── Hero Section ────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-teal-950 text-white p-6 sm:p-10 shadow-2xl border border-teal-500/20">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/15 border border-teal-400/30 text-teal-300 text-xs font-bold tracking-wider uppercase">
              <BookOpen className="w-3.5 h-3.5" />
              ธนาคารการอ่านคำไผ่ · Reading Bank
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              เปิดโลกกว้าง <span className="text-amber-400">สร้างปัญญา</span>
              <br />
              สะสมแต้มหน้าหนังสือ <span className="text-teal-400">ทุกวัน</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              โครงการส่งเสริมนิสัยรักการอ่านโรงเรียนบ้านคำไผ่ บันทึกหนังสือที่อ่าน สะสมแต้มหน้าหนังสือ
              ปลดล็อกระดับนักอ่าน และเพิ่มพลังความผูกพันให้สัตว์เลี้ยงคู่หูเติบโตไปพร้อมกัน!
            </p>

            <div className="pt-2 flex flex-wrap gap-3 items-center">
              <Button
                onClick={() => {
                  setEntryForm((prev) => ({ ...prev, code: activeCode }));
                  setRecordDialogOpen(true);
                }}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg"
              >
                <Plus className="w-4 h-4 mr-1.5" /> บันทึกการอ่านใหม่
              </Button>
              <a
                href="#leaderboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition"
              >
                <Trophy className="w-4 h-4 text-amber-400" /> ทำเนียบยอดนักอ่าน
              </a>
            </div>
          </div>
        </section>

        {/* ─── School Overview Stats Counter ────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                <BookMarked className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">หนังสือที่อ่านแล้ว</p>
                <p className="text-2xl font-black text-foreground">
                  {totalStats.totalBooks.toLocaleString('th-TH')} <span className="text-sm font-normal text-muted-foreground">เล่ม</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">จำนวนหน้ารวมที่อ่านสะสม</p>
                <p className="text-2xl font-black text-foreground">
                  {totalPagesCount(totalStats.totalPages)} <span className="text-sm font-normal text-muted-foreground">หน้า</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                <Library className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">นักเรียนที่ร่วมบันทึก</p>
                <p className="text-2xl font-black text-foreground">
                  {totalStats.totalReaders.toLocaleString('th-TH')} <span className="text-sm font-normal text-muted-foreground">คน</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Search & Student Passport Section ────────────────────── */}
        <section className="space-y-4">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Search className="w-5 h-5 text-primary" />
                ตรวจสอบสมุดบันทึกการอ่านของฉัน (My Reading Passport)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
                <Input
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  placeholder="พิมพ์รหัสนักเรียน เช่น 10234..."
                  className="bg-background text-foreground"
                />
                <Button type="submit" className="shrink-0">
                  <Search className="w-4 h-4 mr-1.5" /> ค้นหา
                </Button>
              </form>

              {activeCode && studentQuery.isLoading && (
                <p className="text-sm text-muted-foreground animate-pulse">กำลังเปิดสมุดบันทึกการอ่าน...</p>
              )}

              {activeCode && !studentQuery.isLoading && !studentSummary && (
                <div className="p-4 rounded-xl bg-muted text-muted-foreground text-sm">
                  ไม่พบข้อมูลบันทึกการอ่านของรหัส "{activeCode}" หรือยังไม่เคยเริ่มบันทึกหนังสือ
                </div>
              )}

              {studentSummary && (
                <div className="pt-4 border-t border-border space-y-6">
                  {/* Student & Pet Banner */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-teal-500/10 via-amber-500/10 to-indigo-500/10 border border-border flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <PersonAvatar
                        name={studentSummary.full_name}
                        photoUrl={studentSummary.photo_url}
                        className="w-14 h-14 ring-2 ring-primary/20 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-lg text-foreground">{studentSummary.full_name}</h3>
                          <Badge variant="outline" className="font-semibold text-xs">
                            {studentSummary.class_name}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">รหัสประจำตัว: {studentSummary.student_code}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge className="bg-amber-500 text-slate-950 font-bold text-xs">
                            {studentSummary.reading_tier}
                          </Badge>
                          <span className="text-xs font-bold text-foreground">
                            {studentSummary.total_books} เล่ม · {studentSummary.total_pages} หน้า
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Companion pet cheerleader */}
                    {companion && (
                      <div className="flex items-center gap-3 bg-card/80 backdrop-blur p-2.5 rounded-xl border border-border">
                        <PetVisual
                          visualKey={companion.visual_key}
                          label={companion.display_name}
                          className="w-12 h-12 shrink-0"
                        />
                        <div className="text-xs space-y-0.5">
                          <p className="font-bold text-foreground flex items-center gap-1">
                            <PawPrint className="w-3.5 h-3.5 text-primary" /> {companion.display_name}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{companion.friendship?.title}</p>
                          <p className="text-[10px] text-teal-600 font-semibold">กำลังอ่านหนังสือด้วยกัน! ✨</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reading History */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" /> รายการหนังสือที่อ่านแล้ว ({studentHistory.length} เล่ม)
                    </h4>

                    {studentHistory.length === 0 ? (
                      <p className="text-xs text-muted-foreground">ยังไม่มีรายการหนังสือที่บันทึก</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {studentHistory.map((item) => (
                          <div
                            key={item.id}
                            className="p-3.5 rounded-xl border border-border bg-card space-y-2 hover:border-primary/40 transition"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-bold text-sm text-foreground">{item.book_title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.book_author ? `โดย ${item.book_author} · ` : ''}
                                  {item.book_category}
                                </p>
                              </div>
                              <span className="text-xs font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full shrink-0">
                                {item.pages_read} หน้า
                              </span>
                            </div>

                            {item.summary_notes && (
                              <p className="text-xs text-slate-700 bg-muted/60 p-2 rounded-lg italic">
                                "{item.summary_notes}"
                              </p>
                            )}

                            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                              <span className="flex items-center text-amber-500 font-semibold">
                                {'⭐'.repeat(item.rating || 5)}
                              </span>
                              <span>{formatThaiDateMedium(item.reading_date)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ─── Leaderboard Section ──────────────────────────────────── */}
        <section id="leaderboard" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                ทำเนียบยอดนักอ่านคำไผ่ (Top Readers)
              </h2>
              <p className="text-xs text-muted-foreground">จัดอันดับตามจำนวนหน้าที่อ่านสะสมและจำนวนเล่ม</p>
            </div>

            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-[140px] bg-background text-foreground">
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

          {/* Podium for Top 3 */}
          {top3.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl mx-auto pt-6 items-end">
              {/* 2nd Place */}
              {top3[1] && (
                <div className="flex flex-col items-center">
                  <PersonAvatar
                    name={top3[1].full_name}
                    photoUrl={top3[1].photo_url}
                    className="w-12 h-12 ring-2 ring-slate-300 shadow-md mb-2"
                  />
                  <div className="w-full bg-gradient-to-t from-slate-200 to-slate-100 rounded-t-2xl p-3 text-center border border-slate-300 h-28 flex flex-col justify-between">
                    <span className="text-xl">🥈</span>
                    <div>
                      <p className="font-bold text-xs truncate text-slate-800">{top3[1].full_name}</p>
                      <p className="text-[10px] text-slate-600">{top3[1].class_name}</p>
                      <p className="text-xs font-black text-slate-900">{top3[1].total_pages} หน้า</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {top3[0] && (
                <div className="flex flex-col items-center">
                  <PersonAvatar
                    name={top3[0].full_name}
                    photoUrl={top3[0].photo_url}
                    className="w-16 h-16 ring-4 ring-amber-400 shadow-lg mb-2"
                  />
                  <div className="w-full bg-gradient-to-t from-amber-200 to-yellow-100 rounded-t-2xl p-3 text-center border border-amber-300 h-36 flex flex-col justify-between">
                    <span className="text-2xl">🥇</span>
                    <div>
                      <p className="font-black text-xs sm:text-sm truncate text-amber-950">{top3[0].full_name}</p>
                      <p className="text-[10px] text-amber-800">{top3[0].class_name}</p>
                      <p className="text-sm font-black text-amber-950">{top3[0].total_pages} หน้า</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {top3[2] && (
                <div className="flex flex-col items-center">
                  <PersonAvatar
                    name={top3[2].full_name}
                    photoUrl={top3[2].photo_url}
                    className="w-11 h-11 ring-2 ring-amber-600 shadow-md mb-2"
                  />
                  <div className="w-full bg-gradient-to-t from-orange-200 to-orange-100 rounded-t-2xl p-3 text-center border border-orange-300 h-24 flex flex-col justify-between">
                    <span className="text-lg">🥉</span>
                    <div>
                      <p className="font-bold text-xs truncate text-orange-950">{top3[2].full_name}</p>
                      <p className="text-[10px] text-orange-800">{top3[2].class_name}</p>
                      <p className="text-xs font-black text-orange-950">{top3[2].total_pages} หน้า</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Leaderboard Table */}
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {filteredLeaderboard.map((item, idx) => (
                  <div
                    key={item.student_id}
                    className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-muted/40 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 text-center font-bold text-xs text-muted-foreground tabular-nums">
                        #{idx + 1}
                      </span>
                      <PersonAvatar
                        name={item.full_name}
                        photoUrl={item.photo_url}
                        className="w-9 h-9 shrink-0 ring-1 ring-border"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-foreground truncate">{item.full_name}</p>
                        <p className="text-xs text-muted-foreground">{item.class_name} · {item.reading_tier}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-extrabold text-sm text-foreground">{item.total_pages.toLocaleString()} หน้า</p>
                      <p className="text-xs text-muted-foreground">{item.total_books} เล่ม</p>
                    </div>
                  </div>
                ))}

                {filteredLeaderboard.length === 0 && (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    ยังไม่มีข้อมูลนักเรียนที่บันทึกการอ่านในชั้นเรียนนี้
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />

      {/* ─── Record Reading Entry Dialog ─────────────────────────── */}
      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent className="max-w-md w-full bg-card text-foreground border border-border p-6 shadow-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> บันทึกการอ่านหนังสือใหม่
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              กรอกข้อมูลหนังสือที่อ่านเพื่อสะสมแต้มและมอบ Bond XP ให้สัตว์เลี้ยงคู่หู
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!entryForm.code.trim()) {
                toast({ title: 'กรุณากรอกรหัสนักเรียน', variant: 'destructive' });
                return;
              }
              if (!entryForm.bookTitle.trim()) {
                toast({ title: 'กรุณากรอกชื่อหนังสือ', variant: 'destructive' });
                return;
              }
              recordMutation.mutate(entryForm);
            }}
            className="space-y-3.5 pt-2"
          >
            <div>
              <label className="text-xs font-bold text-foreground">รหัสนักเรียน *</label>
              <Input
                required
                value={entryForm.code}
                onChange={(e) => setEntryForm({ ...entryForm, code: e.target.value })}
                placeholder="เช่น 10234"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">ชื่อหนังสือ *</label>
              <Input
                required
                value={entryForm.bookTitle}
                onChange={(e) => setEntryForm({ ...entryForm, bookTitle: e.target.value })}
                placeholder="เช่น กระต่ายกับเต่า, วิทยาศาสตร์น่ารู้"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-foreground">ผู้แต่ง (ถ้ามี)</label>
                <Input
                  value={entryForm.bookAuthor}
                  onChange={(e) => setEntryForm({ ...entryForm, bookAuthor: e.target.value })}
                  placeholder="เช่น อีสป"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">จำนวนหน้าที่อ่าน *</label>
                <Input
                  type="number"
                  min="1"
                  max="1000"
                  required
                  value={entryForm.pagesRead}
                  onChange={(e) => setEntryForm({ ...entryForm, pagesRead: parseInt(e.target.value, 10) || 1 })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">หมวดหมู่หนังสือ</label>
              <Select
                value={entryForm.bookCategory}
                onValueChange={(val) => setEntryForm({ ...entryForm, bookCategory: val })}
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
              <label className="text-xs font-bold text-foreground">ข้อคิดหรือเรื่องย่อสั้นๆ</label>
              <Input
                value={entryForm.summaryNotes}
                onChange={(e) => setEntryForm({ ...entryForm, summaryNotes: e.target.value })}
                placeholder="เช่น ความพยายามอยู่ที่ไหน ความสำเร็จอยู่ที่นั่น"
                className="mt-1"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setRecordDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={recordMutation.isPending} className="font-bold">
                {recordMutation.isPending ? 'กำลังบันทึก...' : 'ยืนยันบันทึก'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function totalPagesCount(pages: number) {
  return pages.toLocaleString('th-TH');
}
