import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import {
  Search,
  Package,
  Users,
  Sparkles,
  Recycle,
  ClipboardList,
  Clock,
  Gift,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  wasteSummaryService,
  wasteTransactionsService,
  studentsService,
  type WasteStudentSummary,
  type WasteTransaction,
} from '@/services';
import { formatThaiDateFull } from '@/lib/thaiDate';

// ─── Constants ────────────────────────────────────────────────────────────────

const CLASSES = ['อ.1', 'อ.2', 'อ.3', 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];

const HOW_IT_WORKS = [
  {
    icon: <Recycle className="w-8 h-8 text-green-600" />,
    step: '1',
    title: 'คัดแยกขยะ',
    desc: 'นักเรียนเก็บขวดพลาสติก ขวดแก้ว กระป๋อง จากที่บ้านหรือในโรงเรียน',
  },
  {
    icon: <Package className="w-8 h-8 text-green-600" />,
    step: '2',
    title: 'นำมาส่งครู',
    desc: 'โชว์ QR นักเรียน → ครูสแกน → นับจำนวนชิ้น → ได้รับแต้มสะสมอัตโนมัติ',
  },
  {
    icon: <Gift className="w-8 h-8 text-green-600" />,
    step: '3',
    title: 'แลกรางวัล',
    desc: 'ใช้แต้มสะสมแลกรางวัลจากทางโรงเรียน — ของใช้ ขนม หรือของรางวัลพิเศษ',
  },
];

const MEDALS = ['🥇', '🥈', '🥉'];
const MEDAL_COLORS = [
  'border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-100',
  'border-slate-300 bg-gradient-to-br from-slate-50 to-gray-100',
  'border-orange-300 bg-gradient-to-br from-orange-50 to-amber-100',
];
const MEDAL_TEXT = ['text-amber-900', 'text-slate-800', 'text-orange-900'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StudentAvatar({
  name,
  size = 48,
  photoUrl,
  className,
}: {
  name: string;
  size?: number;
  photoUrl?: string | null;
  className?: string;
}) {
  const colors = [
    'from-green-400 to-emerald-600',
    'from-blue-400 to-cyan-600',
    'from-emerald-400 to-emerald-600',
    'from-amber-400 to-orange-600',
    'from-amber-300 to-amber-500',
  ];
  const color = colors[(name.charCodeAt(0) || 0) % colors.length];

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        loading="lazy"
        className={cn("rounded-full object-cover flex-shrink-0 border-2 border-white shadow-sm bg-muted", className)}
        style={className ? undefined : { width: size, height: size }}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  return (
    <div
      className={cn(`rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold flex-shrink-0 border-2 border-white shadow-sm`, className)}
      style={className ? undefined : { width: size, height: size }}
    >
      <span style={className ? undefined : { fontSize: size * 0.38 }}>{(name || '?').charAt(0)}</span>
    </div>
  );
}

function formatDate(dateStr: string) {
  return formatThaiDateFull(dateStr);
}

// ─── Component ────────────────────────────────────────────────────────────────

const WasteBank = () => {
  const [summaries, setSummaries] = useState<WasteStudentSummary[]>([]);
  const [recentTx, setRecentTx] = useState<WasteTransaction[]>([]);
  const [photoMap, setPhotoMap] = useState<Map<string, string | null>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [rankTab, setRankTab] = useState<'points' | 'items' | 'count'>('points');
  const [classTab, setClassTab] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchClass, setSearchClass] = useState('all');
  const [searchResults, setSearchResults] = useState<WasteStudentSummary[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Animated count-up stats
  const [displayStats, setDisplayStats] = useState({ students: 0, items: 0, points: 0 });

  useEffect(() => {
    window.scrollTo(0, 0);
    loadData();
  }, []);

  const loadData = async () => {
    const [summaryRes, txRes, studentsRes] = await Promise.all([
      wasteSummaryService.getAll(),
      wasteTransactionsService.getRecent(10),
      studentsService.getActive(),
    ]);
    if (summaryRes.data) {
      // Only show students with at least 1 transaction in rankings
      const active = (summaryRes.data as WasteStudentSummary[]).filter(
        (s) => Number(s.total_transactions ?? 0) > 0,
      );
      setSummaries(active);
    }
    if (txRes.data) setRecentTx(txRes.data as WasteTransaction[]);
    if (studentsRes.data) {
      const m = new Map<string, string | null>();
      for (const s of studentsRes.data as Array<{ id: string; photo_url: string | null }>) {
        m.set(s.id, s.photo_url);
      }
      setPhotoMap(m);
    }
    setIsLoading(false);
  };

  // Count-up animation when summaries load
  useEffect(() => {
    if (summaries.length === 0) return;
    const totalStudents = summaries.length;
    const totalItems = summaries.reduce((a, s) => a + Number(s.total_items ?? 0), 0);
    const totalPoints = summaries.reduce((a, s) => a + Number(s.total_points_earned ?? 0), 0);

    const duration = 1200;
    const steps = 40;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setDisplayStats({
        students: Math.round(totalStudents * progress),
        items: Math.round(totalItems * progress),
        points: Math.round(totalPoints * progress),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [summaries]);

  // Sorted rankings
  const byPoints = useMemo(
    () => [...summaries].sort((a, b) => Number(b.total_points_earned ?? 0) - Number(a.total_points_earned ?? 0)),
    [summaries],
  );
  const byItems = useMemo(
    () => [...summaries].sort((a, b) => Number(b.total_items ?? 0) - Number(a.total_items ?? 0)),
    [summaries],
  );
  const byCount = useMemo(
    () =>
      [...summaries].sort(
        (a, b) => Number(b.total_transactions ?? 0) - Number(a.total_transactions ?? 0),
      ),
    [summaries],
  );

  const ranked = rankTab === 'points' ? byPoints : rankTab === 'items' ? byItems : byCount;
  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3, 10);

  // Class filter
  const classes = useMemo(
    () =>
      Array.from(new Set(summaries.map((s) => s.class_name).filter(Boolean))).sort() as string[],
    [summaries],
  );
  useEffect(() => {
    if (classes.length > 0 && !classTab) setClassTab(classes[0]!);
  }, [classes]);
  const classRanked = useMemo(
    () => byPoints.filter((s) => s.class_name === classTab).slice(0, 5),
    [byPoints, classTab],
  );

  // Search
  const handleSearch = () => {
    setHasSearched(true);
    const filtered = summaries.filter((s) => {
      const matchName =
        !searchName.trim() || (s.full_name || '').includes(searchName.trim());
      const matchClass = searchClass === 'all' || s.class_name === searchClass;
      return matchName && matchClass;
    });
    setSearchResults(
      filtered.sort((a, b) => Number(b.total_points_earned ?? 0) - Number(a.total_points_earned ?? 0)),
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const rankValue = (s: WasteStudentSummary) => {
    if (rankTab === 'points') return `${Number(s.total_points_earned ?? 0)} แต้ม`;
    if (rankTab === 'items') return `${Number(s.total_items ?? 0)} ชิ้น`;
    return `${s.total_transactions ?? 0} ครั้ง`;
  };

  const searchResultTotalItems = searchResults.reduce(
    (a, s) => a + Number(s.total_items ?? 0),
    0,
  );
  const searchResultTotalPoints = searchResults.reduce(
    (a, s) => a + Number(s.total_points_earned ?? 0),
    0,
  );

  // Podium order: rank 2 | rank 1 | rank 3
  const podiumOrder = [top3[1], top3[0], top3[2]];
  const podiumRankIdx = [1, 0, 2];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="ธนาคารขยะ" description="ระบบธนาคารขยะโรงเรียนบ้านคำไผ่ — สะสมแต้มจากการเก็บขยะ แลกรางวัล" />
      <SiteHeader />
      <div className="max-w-7xl mx-auto w-full bg-background flex-grow flex flex-col">

      {/* Hero — Compact */}
      <section className="bg-primary py-6 md:py-8">
        <div className="container mx-auto px-4 text-center">
          <span className="inline-block text-xs md:text-sm font-semibold uppercase tracking-wider text-primary-foreground/70 mb-1.5">
            ธนาคารขยะ
          </span>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-primary-foreground mb-1.5">
            <Recycle className="inline w-5 h-5 md:w-6 md:h-6 mr-1.5 -mt-1" />
            ธนาคารขยะโรงเรียนบ้านคำไผ่
          </h1>
          <p className="text-xs md:text-sm text-primary-foreground/75 max-w-2xl mx-auto">
            ส่งเสริมการคัดแยกขยะ สะสมแต้มแลกรางวัล ร่วมสร้างโรงเรียนสีเขียวไปด้วยกัน
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            <Link
              to="/waste-bank/rewards"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs md:text-sm font-semibold transition shadow-sm"
            >
              <Gift className="w-4 h-4" />
              ดูรางวัลที่แลกได้
            </Link>
            <Link
              to="/waste-bank/stats"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-primary-foreground text-xs md:text-sm font-medium transition"
            >
              <BarChart3 className="w-4 h-4" />
              ดูสถิติแบบละเอียด
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Animated Stats ───────────────────────────────────────────── */}
      <section className="bg-white border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-green-50 border border-green-100">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">นักเรียนที่ร่วมโครงการ</p>
                <p className="text-2xl font-bold text-green-700">
                  {isLoading ? '...' : displayStats.students}
                  <span className="text-sm font-normal ml-1">คน</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ขยะรวม</p>
                <p className="text-2xl font-bold text-blue-700">
                  {isLoading ? '...' : displayStats.items.toLocaleString()}
                  <span className="text-sm font-normal ml-1">ชิ้น</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 border border-amber-100">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">แต้มสะสมรวม</p>
                <p className="text-2xl font-bold text-amber-700">
                  {isLoading ? '...' : displayStats.points.toLocaleString()}
                  <span className="text-sm font-normal ml-1">แต้ม</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Leaderboards Grid ────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto w-full px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Hall of Fame (Student Leaderboard) - 7 cols */}
          <div className="lg:col-span-7 space-y-4">
            <div className="text-center lg:text-left mb-2">
              <h2 className="text-xl font-bold text-foreground">🏆 อันดับนักเรียน</h2>
              <p className="text-muted-foreground text-xs mt-0.5">
                ขยันเก็บขยะ ได้รับการยกย่อง
              </p>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : summaries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-white rounded-xl border border-border">
                <Recycle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>ยังไม่มีข้อมูล</p>
              </div>
            ) : (
              <Tabs
                value={rankTab}
                onValueChange={(v) => setRankTab(v as 'points' | 'items' | 'count')}
              >
                <TabsList className="w-full max-w-[280px] mx-auto lg:mx-0 mb-4 grid grid-cols-3">
                  <TabsTrigger value="points" className="text-xs">แต้มสะสม</TabsTrigger>
                  <TabsTrigger value="items" className="text-xs">ชิ้น</TabsTrigger>
                  <TabsTrigger value="count" className="text-xs">ครั้ง</TabsTrigger>
                </TabsList>

                {(['points', 'items', 'count'] as const).map((tab) => (
                  <TabsContent key={tab} value={tab} className="mt-0">
                    {/* Podium */}
                    {top3.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mb-4 items-end max-w-2xl mx-auto">
                        {podiumOrder.map((student, pos) => {
                          if (!student) return <div key={pos} />;
                          const rankIdx = podiumRankIdx[pos];
                          const isFirst = rankIdx === 0;
                          return (
                            <div
                              key={pos}
                              className={`
                                flex flex-col items-center text-center p-1.5 xs:p-2.5 md:p-4 rounded-2xl border-2
                                ${MEDAL_COLORS[rankIdx]}
                                ${isFirst ? 'ring-2 ring-amber-300 shadow-md scale-105 pb-2.5 pt-2 md:pb-4 md:pt-3' : 'shadow-sm'}
                                transition-all
                              `}
                            >
                              <span className={`text-lg xs:text-2xl mb-1 ${isFirst ? 'text-2xl xs:text-3xl' : ''}`}>
                                {MEDALS[rankIdx]}
                              </span>
                              <StudentAvatar
                                name={student.full_name || '?'}
                                className={isFirst ? "w-12 h-12 xs:w-16 xs:h-16 md:w-20 md:h-20" : "w-9 h-9 xs:w-12 xs:h-12 md:w-14 md:h-14"}
                                photoUrl={student.student_id ? photoMap.get(student.student_id) : null}
                              />
                              <p
                                className={`font-semibold mt-1.5 leading-tight text-foreground truncate max-w-full text-[10px] xs:text-xs md:text-base`}
                              >
                                {student.full_name || '—'}
                              </p>
                              {student.class_name && (
                                <Badge className="mt-0.5 bg-white/60 text-foreground border-0 text-[9px] py-0 px-1">
                                  {student.class_name}
                                </Badge>
                              )}
                              <p className={`mt-1 font-bold ${MEDAL_TEXT[rankIdx]} text-[10px] xs:text-xs sm:text-sm md:text-base`}>
                                {rankTab === 'points'
                                  ? `${Number(student.total_points_earned ?? 0)} แต้ม`
                                  : rankTab === 'items'
                                    ? `${Number(student.total_items ?? 0)} ชิ้น`
                                    : `${student.total_transactions ?? 0} ครั้ง`}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Rank 4–10 */}
                    {rest.length > 0 && (
                      <Card className="shadow-sm overflow-hidden">
                        <div className="divide-y divide-border max-h-[220px] overflow-y-auto">
                          {rest.map((s, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 px-3 py-1.5 hover:bg-muted/40 transition-colors"
                            >
                              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground flex-shrink-0">
                                {i + 4}
                              </span>
                              <StudentAvatar
                                name={s.full_name || '?'}
                                size={28}
                                photoUrl={s.student_id ? photoMap.get(s.student_id) : null}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{s.full_name || '—'}</p>
                                {s.class_name && (
                                  <p className="text-[10px] text-muted-foreground">{s.class_name}</p>
                                )}
                              </div>
                              <span className="text-xs font-bold text-foreground whitespace-nowrap">
                                {rankValue(s)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </div>

          {/* Class Rankings - 5 cols */}
          {classes.length > 0 && (
            <div className="lg:col-span-5 space-y-4 bg-green-50/40 border border-green-100/80 rounded-2xl p-4 md:p-5">
              <div className="text-center lg:text-left mb-2">
                <h2 className="text-lg md:text-xl font-bold text-foreground">🏫 อันดับรายชั้นเรียน</h2>
                <p className="text-muted-foreground text-xs mt-0.5">
                  ดูผลงานแต่ละระดับชั้นเรียน
                </p>
              </div>

              <Tabs value={classTab} onValueChange={setClassTab}>
                <TabsList className="flex flex-wrap justify-center lg:justify-start gap-1 h-auto mb-4 bg-transparent p-0">
                  {classes.map((cls) => (
                    <TabsTrigger
                      key={cls}
                      value={cls}
                      className="data-[state=active]:bg-green-600 data-[state=active]:text-white rounded-full px-2.5 py-1 text-xs border border-green-200 bg-white"
                    >
                      {cls}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {classes.map((cls) => (
                  <TabsContent key={cls} value={cls} className="mt-0">
                    <Card className="shadow-sm overflow-hidden w-full mx-auto">
                      {classRanked.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-xs">
                          ไม่มีข้อมูลสำหรับชั้นนี้
                        </div>
                      ) : (
                        <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
                          {classRanked.map((s, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 px-3 py-1.5 hover:bg-muted/40 transition-colors"
                            >
                              <span className="text-sm w-5 text-center flex-shrink-0">
                                {i < 3 ? MEDALS[i] : `${i + 1}`}
                              </span>
                              <StudentAvatar
                                name={s.full_name || '?'}
                                size={28}
                                photoUrl={s.student_id ? photoMap.get(s.student_id) : null}
                              />
                              <p className="flex-1 text-xs font-medium truncate">
                                {s.full_name || '—'}
                              </p>
                              <span className="text-xs font-bold text-foreground whitespace-nowrap">
                                {Number(s.total_points_earned ?? 0)} แต้ม
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}
        </div>
      </section>

      {/* ─── Activity & Search Grid ───────────────────────────────────── */}
      <section className="max-w-5xl mx-auto w-full px-4 py-6 border-t border-border">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Recent Activity - 6 cols */}
          <div className="lg:col-span-6 space-y-4">
            <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-600" />
              กิจกรรมล่าสุด
            </h2>

            {isLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : recentTx.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-white rounded-xl border border-border">
                <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-xs">ยังไม่มีรายการ</p>
              </div>
            ) : (
              <Card className="shadow-sm overflow-hidden">
                <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
                  {recentTx.map((tx) => {
                    const cat = tx.waste_categories;
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-muted/30 transition-colors"
                      >
                        {/* Category icon */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-base"
                          style={{ backgroundColor: cat?.color ? `${cat.color}22` : '#d1fae5' }}>
                          {cat?.icon ? (
                            <span>{cat.icon}</span>
                          ) : (
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: cat?.color || '#16a34a' }}
                            />
                          )}
                        </div>

                        <StudentAvatar
                          name={tx.student_name}
                          size={28}
                          photoUrl={
                            tx.students?.photo_url ??
                            (tx.student_id ? photoMap.get(tx.student_id) : null)
                          }
                        />

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{tx.student_name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {tx.student_class && (
                              <Badge className="bg-green-100 text-green-700 border-0 text-[9px] py-0 px-1">
                                {tx.student_class}
                              </Badge>
                            )}
                            {cat?.name && (
                              <span className="text-[10px] text-muted-foreground truncate">{cat.name}</span>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-bold text-foreground">
                            +{tx.points_earned} แต้ม
                          </p>
                          <p className="text-[9px] text-muted-foreground">
                            {tx.quantity} ชิ้น · {formatDate(tx.transaction_date)} {tx.created_at ? ' · ' + new Date(tx.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' }) + ' น.' : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>

          {/* Search/Check Points - 6 cols */}
          <div className="lg:col-span-6 space-y-4">
            <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
              <Search className="w-4 h-4 text-green-600" />
              ตรวจสอบแต้มสะสม
            </h2>

            <Card className="shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="ค้นหาชื่อนักเรียน..."
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="text-xs h-9"
                    />
                  </div>
                  <div className="w-full sm:w-32">
                    <Select value={searchClass} onValueChange={setSearchClass}>
                      <SelectTrigger className="text-xs h-9">
                        <SelectValue placeholder="ทุกชั้น" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">ทุกชั้น</SelectItem>
                        {CLASSES.map((cls) => (
                          <SelectItem key={cls} value={cls} className="text-xs">
                            {cls}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleSearch}
                    className="bg-green-600 hover:bg-green-700 text-white gap-1.5 h-9 text-xs"
                  >
                    <Search className="w-3.5 h-3.5" />
                    ค้นหา
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            {hasSearched && (
              <div className="mt-3">
                {searchResults.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground bg-white rounded-xl border border-border">
                    <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">ไม่พบข้อมูลนักเรียน</p>
                    <p className="text-[10px] mt-0.5">ลองค้นหาด้วยชื่อหรือชั้นอื่น</p>
                  </div>
                ) : (
                  <Card className="shadow-sm overflow-hidden">
                    <div className="overflow-x-auto max-h-[220px] overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-green-50 border-b border-green-100 sticky top-0 z-10">
                            <th className="text-left px-3 py-2 font-semibold text-green-800">
                              ชื่อนักเรียน
                            </th>
                            <th className="text-left px-3 py-2 font-semibold text-green-800">ชั้น</th>
                            <th className="text-right px-3 py-2 font-semibold text-green-800">
                              แต้มคงเหลือ
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchResults.map((s, idx) => (
                            <tr
                              key={idx}
                              className="border-b border-border hover:bg-green-50/40 transition-colors"
                            >
                              <td className="px-3 py-2 font-medium">{s.full_name || '—'}</td>
                              <td className="px-3 py-2">
                                <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 text-[10px] py-0 px-1">
                                  {s.class_name}
                                </Badge>
                              </td>
                              <td className="px-3 py-2 text-right font-semibold text-amber-600">
                                {Number(s.available_points ?? 0)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        {searchResults.length > 1 && (
                          <tfoot className="sticky bottom-0 bg-green-50 border-t border-green-200">
                            <tr className="font-semibold">
                              <td className="px-3 py-2" colSpan={2}>
                                รวม ({searchResults.length} คน)
                              </td>
                              <td className="px-3 py-2 text-right text-amber-700">
                                {searchResults.reduce((a, s) => a + Number(s.available_points ?? 0), 0)}
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────────────────── */}
      <section className="bg-green-50 border-t border-green-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-center text-foreground mb-1">
            วิธีการเข้าร่วมโครงการ
          </h2>
          <p className="text-center text-muted-foreground text-xs mb-6">ง่ายแค่ 3 ขั้นตอน</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.step}
                className="bg-white rounded-xl p-4 shadow-sm border border-green-100 text-center flex flex-col items-center"
              >
                <div className="w-10 h-10 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mb-2 text-green-600">
                  {item.icon}
                </div>
                <div className="w-5 h-5 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center mb-2">
                  {item.step}
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      </div>
    </div>
  );
};

export default WasteBank;
