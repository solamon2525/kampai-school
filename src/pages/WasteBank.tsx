import { useState, useEffect, useMemo } from 'react';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import {
  Search,
  Scale,
  Users,
  Banknote,
  Recycle,
  ClipboardList,
  Award,
  Clock,
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
  type WasteStudentSummary,
  type WasteTransaction,
} from '@/services';

// ─── Constants ────────────────────────────────────────────────────────────────

const CLASSES = ['อ.1', 'อ.2', 'อ.3', 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];

const HOW_IT_WORKS = [
  {
    icon: <Recycle className="w-8 h-8 text-green-600" />,
    step: '1',
    title: 'คัดแยกขยะ',
    desc: 'นักเรียนคัดแยกขยะรีไซเคิลที่บ้านหรือในโรงเรียน เช่น กระดาษ พลาสติก แก้ว โลหะ',
  },
  {
    icon: <Scale className="w-8 h-8 text-green-600" />,
    step: '2',
    title: 'นำมาชั่งน้ำหนัก',
    desc: 'นำขยะที่คัดแยกแล้วมาชั่งน้ำหนักกับเจ้าหน้าที่ธนาคารขยะของโรงเรียน',
  },
  {
    icon: <Award className="w-8 h-8 text-green-600" />,
    step: '3',
    title: 'รับเงินสะสม',
    desc: 'ได้รับเงินตามน้ำหนักและประเภทขยะ สะสมไว้ในบัญชีธนาคารขยะส่วนตัว',
  },
];

const MEDALS = ['🥇', '🥈', '🥉'];
const MEDAL_COLORS = [
  'border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-100',
  'border-slate-300 bg-gradient-to-br from-slate-50 to-gray-100',
  'border-orange-300 bg-gradient-to-br from-orange-50 to-amber-100',
];
const MEDAL_TEXT = ['text-amber-700', 'text-slate-600', 'text-orange-700'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StudentAvatar({
  photo_url,
  name,
  size = 48,
}: {
  photo_url: string | null;
  name: string;
  size?: number;
}) {
  const colors = [
    'from-green-400 to-emerald-600',
    'from-blue-400 to-cyan-600',
    'from-purple-400 to-violet-600',
    'from-amber-400 to-orange-600',
    'from-rose-400 to-pink-600',
  ];
  const color = colors[(name.charCodeAt(0) || 0) % colors.length];

  if (photo_url) {
    return (
      <img
        src={photo_url}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold flex-shrink-0 border-2 border-white shadow-sm`}
    >
      <span style={{ fontSize: size * 0.38 }}>{(name || '?').charAt(0)}</span>
    </div>
  );
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

const WasteBank = () => {
  const [summaries, setSummaries] = useState<WasteStudentSummary[]>([]);
  const [recentTx, setRecentTx] = useState<WasteTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rankTab, setRankTab] = useState<'amount' | 'weight' | 'count'>('amount');
  const [classTab, setClassTab] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchClass, setSearchClass] = useState('all');
  const [searchResults, setSearchResults] = useState<WasteStudentSummary[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Animated count-up stats
  const [displayStats, setDisplayStats] = useState({ students: 0, weight: 0, amount: 0 });

  useEffect(() => {
    window.scrollTo(0, 0);
    loadData();
  }, []);

  const loadData = async () => {
    const [summaryRes, txRes] = await Promise.all([
      wasteSummaryService.getAll(),
      wasteTransactionsService.getRecent(10),
    ]);
    if (summaryRes.data) setSummaries(summaryRes.data as WasteStudentSummary[]);
    if (txRes.data) setRecentTx(txRes.data as WasteTransaction[]);
    setIsLoading(false);
  };

  // Count-up animation when summaries load
  useEffect(() => {
    if (summaries.length === 0) return;
    const totalStudents = summaries.length;
    const totalWeight = summaries.reduce((a, s) => a + Number(s.total_weight ?? 0), 0);
    const totalAmount = summaries.reduce((a, s) => a + Number(s.total_amount ?? 0), 0);

    const duration = 1200;
    const steps = 40;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setDisplayStats({
        students: Math.round(totalStudents * progress),
        weight: totalWeight * progress,
        amount: totalAmount * progress,
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [summaries]);

  // Sorted rankings
  const byAmount = useMemo(
    () => [...summaries].sort((a, b) => Number(b.total_amount ?? 0) - Number(a.total_amount ?? 0)),
    [summaries],
  );
  const byWeight = useMemo(
    () => [...summaries].sort((a, b) => Number(b.total_weight ?? 0) - Number(a.total_weight ?? 0)),
    [summaries],
  );
  const byCount = useMemo(
    () =>
      [...summaries].sort(
        (a, b) => Number(b.total_transactions ?? 0) - Number(a.total_transactions ?? 0),
      ),
    [summaries],
  );

  const ranked = rankTab === 'amount' ? byAmount : rankTab === 'weight' ? byWeight : byCount;
  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3, 10);

  // Class filter
  const classes = useMemo(
    () =>
      Array.from(new Set(summaries.map((s) => s.student_class).filter(Boolean))).sort() as string[],
    [summaries],
  );
  useEffect(() => {
    if (classes.length > 0 && !classTab) setClassTab(classes[0]!);
  }, [classes]);
  const classRanked = useMemo(
    () => byAmount.filter((s) => s.student_class === classTab).slice(0, 5),
    [byAmount, classTab],
  );

  // Search
  const handleSearch = () => {
    setHasSearched(true);
    const filtered = summaries.filter((s) => {
      const matchName =
        !searchName.trim() || (s.student_name || '').includes(searchName.trim());
      const matchClass = searchClass === 'all' || s.student_class === searchClass;
      return matchName && matchClass;
    });
    setSearchResults(
      filtered.sort((a, b) => Number(b.total_amount ?? 0) - Number(a.total_amount ?? 0)),
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const rankValue = (s: WasteStudentSummary) => {
    if (rankTab === 'amount') return `฿${Number(s.total_amount ?? 0).toFixed(2)}`;
    if (rankTab === 'weight') return `${Number(s.total_weight ?? 0).toFixed(2)} กก.`;
    return `${s.total_transactions ?? 0} ครั้ง`;
  };

  const searchResultTotalWeight = searchResults.reduce(
    (a, s) => a + Number(s.total_weight ?? 0),
    0,
  );
  const searchResultTotalAmount = searchResults.reduce(
    (a, s) => a + Number(s.total_amount ?? 0),
    0,
  );

  // Podium order: rank 2 | rank 1 | rank 3
  const podiumOrder = [top3[1], top3[0], top3[2]];
  const podiumRankIdx = [1, 0, 2]; // original rank index for each podium position

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="ธนาคารขยะ" description="ระบบธนาคารขยะโรงเรียนบ้านคำไผ่" />
      <SiteHeader />

      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-green-800 via-green-700 to-emerald-600 text-white pt-28 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white" />
          <div className="absolute bottom-0 right-20 w-64 h-64 rounded-full bg-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-5">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-4 ring-white/30">
              <Recycle className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight tracking-tight">
            ธนาคารขยะโรงเรียนบ้านคำไผ่
          </h1>
          <p className="text-green-100 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            ส่งเสริมการคัดแยกขยะและสร้างรายได้ให้นักเรียน ร่วมสร้างโรงเรียนสีเขียวไปด้วยกัน
          </p>
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
                <Scale className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">น้ำหนักขยะรวม</p>
                <p className="text-2xl font-bold text-blue-700">
                  {isLoading ? '...' : displayStats.weight.toFixed(1)}
                  <span className="text-sm font-normal ml-1">กก.</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 border border-amber-100">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Banknote className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ยอดเงินสะสมรวม</p>
                <p className="text-2xl font-bold text-amber-700">
                  {isLoading ? '...' : displayStats.amount.toFixed(2)}
                  <span className="text-sm font-normal ml-1">บาท</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Hall of Fame ─────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto w-full px-4 py-10">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">🏆 อันดับนักเรียน</h2>
          <p className="text-muted-foreground text-sm mt-1">
            เสริมแรงทางบวก — ขยันส่งขยะ ได้รับการยกย่อง
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : summaries.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Recycle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>ยังไม่มีข้อมูล</p>
          </div>
        ) : (
          <Tabs
            value={rankTab}
            onValueChange={(v) => setRankTab(v as 'amount' | 'weight' | 'count')}
          >
            <TabsList className="w-full max-w-sm mx-auto mb-8 grid grid-cols-3">
              <TabsTrigger value="amount">ยอดเงิน</TabsTrigger>
              <TabsTrigger value="weight">น้ำหนัก</TabsTrigger>
              <TabsTrigger value="count">จำนวนครั้ง</TabsTrigger>
            </TabsList>

            {(['amount', 'weight', 'count'] as const).map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-0">
                {/* Podium — rank 2 | rank 1 | rank 3 */}
                {top3.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mb-6 items-end">
                    {podiumOrder.map((student, pos) => {
                      if (!student) return <div key={pos} />;
                      const rankIdx = podiumRankIdx[pos];
                      const isFirst = rankIdx === 0;
                      return (
                        <div
                          key={pos}
                          className={`
                            flex flex-col items-center text-center p-4 rounded-2xl border-2
                            ${MEDAL_COLORS[rankIdx]}
                            ${isFirst ? 'ring-2 ring-amber-300 shadow-lg scale-105 pb-6 pt-5' : 'shadow-sm'}
                            transition-all
                          `}
                        >
                          <span className={`text-3xl mb-2 ${isFirst ? 'text-4xl' : ''}`}>
                            {MEDALS[rankIdx]}
                          </span>
                          <StudentAvatar
                            photo_url={student.photo_url}
                            name={student.student_name || '?'}
                            size={isFirst ? 80 : 60}
                          />
                          <p
                            className={`font-semibold mt-2 leading-tight text-foreground ${isFirst ? 'text-base' : 'text-sm'}`}
                          >
                            {student.student_name || '—'}
                          </p>
                          {student.student_class && (
                            <Badge className="mt-1 bg-white/60 text-foreground border-0 text-xs">
                              {student.student_class}
                            </Badge>
                          )}
                          <p className={`mt-2 font-bold ${MEDAL_TEXT[rankIdx]} ${isFirst ? 'text-lg' : 'text-sm'}`}>
                            {rankTab === 'amount'
                              ? `฿${Number(student.total_amount ?? 0).toFixed(2)}`
                              : rankTab === 'weight'
                                ? `${Number(student.total_weight ?? 0).toFixed(2)} กก.`
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
                    <div className="divide-y divide-border">
                      {rest.map((s, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                        >
                          <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                            {i + 4}
                          </span>
                          <StudentAvatar
                            photo_url={s.photo_url}
                            name={s.student_name || '?'}
                            size={36}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{s.student_name || '—'}</p>
                            {s.student_class && (
                              <p className="text-xs text-muted-foreground">{s.student_class}</p>
                            )}
                          </div>
                          <span className="text-sm font-semibold text-green-700 whitespace-nowrap">
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
      </section>

      {/* ─── Class Rankings ───────────────────────────────────────────── */}
      {classes.length > 0 && (
        <section className="bg-green-50/60 border-t border-green-100 py-10 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-bold text-center text-foreground mb-6">
              อันดับรายชั้นเรียน
            </h2>
            <Tabs value={classTab} onValueChange={setClassTab}>
              <TabsList className="flex flex-wrap justify-center gap-1 h-auto mb-6 bg-transparent p-0">
                {classes.map((cls) => (
                  <TabsTrigger
                    key={cls}
                    value={cls}
                    className="data-[state=active]:bg-green-600 data-[state=active]:text-white rounded-full px-4 py-1.5 text-sm border border-green-200 bg-white"
                  >
                    {cls}
                  </TabsTrigger>
                ))}
              </TabsList>

              {classes.map((cls) => (
                <TabsContent key={cls} value={cls} className="mt-0">
                  <Card className="shadow-sm overflow-hidden max-w-lg mx-auto">
                    {classRanked.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        ไม่มีข้อมูลสำหรับชั้นนี้
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {classRanked.map((s, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                          >
                            <span className="text-lg w-7 text-center flex-shrink-0">
                              {i < 3 ? MEDALS[i] : `${i + 1}`}
                            </span>
                            <StudentAvatar
                              photo_url={s.photo_url}
                              name={s.student_name || '?'}
                              size={36}
                            />
                            <p className="flex-1 text-sm font-medium truncate">
                              {s.student_name || '—'}
                            </p>
                            <span className="text-sm font-semibold text-green-700 whitespace-nowrap">
                              ฿{Number(s.total_amount ?? 0).toFixed(2)}
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
        </section>
      )}

      {/* ─── Recent Activity ──────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto w-full px-4 py-10">
        <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
          <Clock className="w-5 h-5 text-green-600" />
          กิจกรรมล่าสุด
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : recentTx.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">ยังไม่มีรายการ</p>
          </div>
        ) : (
          <Card className="shadow-sm overflow-hidden">
            <div className="divide-y divide-border">
              {recentTx.map((tx) => {
                const cat = tx.waste_categories;
                const photoUrl = tx.students?.photo_url ?? null;
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                  >
                    {/* Category icon / color dot */}
                    <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-lg"
                      style={{ backgroundColor: cat?.color ? `${cat.color}22` : '#d1fae5' }}>
                      {cat?.icon ? (
                        <span>{cat.icon}</span>
                      ) : (
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat?.color || '#16a34a' }}
                        />
                      )}
                    </div>

                    {/* Avatar */}
                    <StudentAvatar photo_url={photoUrl} name={tx.student_name} size={32} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tx.student_name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {tx.student_class && (
                          <Badge className="bg-green-100 text-green-700 border-0 text-xs py-0 px-1.5">
                            {tx.student_class}
                          </Badge>
                        )}
                        {cat?.name && (
                          <span className="text-xs text-muted-foreground truncate">{cat.name}</span>
                        )}
                      </div>
                    </div>

                    {/* Values */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-green-700">
                        ฿{Number(tx.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Number(tx.weight_kg).toFixed(2)} กก. · {formatDate(tx.transaction_date)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </section>

      {/* ─── Search ───────────────────────────────────────────────────── */}
      <section className="bg-white border-t border-border py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-green-600" />
                ตรวจสอบยอดเงินสะสม
              </h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="ค้นหาชื่อนักเรียน..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
                <div className="w-full sm:w-44">
                  <Select value={searchClass} onValueChange={setSearchClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="ทุกชั้น" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทุกชั้น</SelectItem>
                      {CLASSES.map((cls) => (
                        <SelectItem key={cls} value={cls}>
                          {cls}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleSearch}
                  className="bg-green-600 hover:bg-green-700 text-white gap-2 min-w-[100px]"
                >
                  <Search className="w-4 h-4" />
                  ค้นหา
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Search Results */}
          {hasSearched && (
            <div className="mt-6">
              {searchResults.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>ไม่พบข้อมูลนักเรียน</p>
                  <p className="text-sm mt-1">ลองค้นหาด้วยชื่อหรือชั้นอื่น</p>
                </div>
              ) : (
                <Card className="shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-green-50 border-b border-green-100">
                          <th className="text-left px-4 py-3 font-semibold text-green-800">
                            ชื่อนักเรียน
                          </th>
                          <th className="text-left px-4 py-3 font-semibold text-green-800">ชั้น</th>
                          <th className="text-right px-4 py-3 font-semibold text-green-800">
                            จำนวนครั้ง
                          </th>
                          <th className="text-right px-4 py-3 font-semibold text-green-800">
                            น้ำหนักรวม (กก.)
                          </th>
                          <th className="text-right px-4 py-3 font-semibold text-green-800">
                            ยอดสะสม (บาท)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchResults.map((s, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-border hover:bg-green-50/40 transition-colors"
                          >
                            <td className="px-4 py-3 font-medium">{s.student_name || '—'}</td>
                            <td className="px-4 py-3">
                              <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                                {s.student_class}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right text-muted-foreground">
                              {s.total_transactions ?? 0}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {Number(s.total_weight ?? 0).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-green-600">
                              {Number(s.total_amount ?? 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {searchResults.length > 1 && (
                        <tfoot>
                          <tr className="bg-green-50 border-t-2 border-green-200 font-semibold">
                            <td className="px-4 py-3" colSpan={3}>
                              รวม ({searchResults.length} คน)
                            </td>
                            <td className="px-4 py-3 text-right">
                              {searchResultTotalWeight.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right text-green-700">
                              {searchResultTotalAmount.toFixed(2)}
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
      </section>

      {/* ─── How It Works ─────────────────────────────────────────────── */}
      <section className="bg-green-50 border-t border-green-100 py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-2">
            วิธีการเข้าร่วมโครงการ
          </h2>
          <p className="text-center text-muted-foreground mb-10">ง่ายแค่ 3 ขั้นตอน</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.step}
                className="bg-white rounded-2xl p-6 shadow-sm border border-green-100 text-center flex flex-col items-center"
              >
                <div className="w-14 h-14 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <div className="w-7 h-7 rounded-full bg-green-600 text-white text-sm font-bold flex items-center justify-center mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default WasteBank;
