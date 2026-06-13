import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Recycle,
  TrendingUp,
  Trophy,
  BarChart3,
  Users,
  ArrowLeft,
} from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import {
  wasteSummaryService,
  wasteTransactionsService,
  wasteCategoriesService,
  studentsService,
  type WasteCategory,
  type WasteStudentSummary,
} from '@/services';

// ─── Constants ────────────────────────────────────────────────────────────────

const BADGES = [
  { pts: 500, icon: '👑', label: 'ราชาขยะ', color: 'text-rose-600' },
  { pts: 300, icon: '🏆', label: 'แชมป์', color: 'text-amber-600' },
  { pts: 100, icon: '🌳', label: 'เพชรเขียว', color: 'text-cyan-600' },
  { pts: 50, icon: '🌿', label: 'นักเก็บ', color: 'text-emerald-600' },
  { pts: 10, icon: '🌱', label: 'มือใหม่', color: 'text-green-600' },
] as const;

const MEDALS = ['🥇', '🥈', '🥉'];
const MEDAL_BG = [
  'border-amber-300 bg-amber-50',
  'border-slate-300 bg-slate-50',
  'border-orange-300 bg-orange-50',
];
const MEDAL_TEXT = ['text-amber-700', 'text-slate-600', 'text-orange-700'];

const RANK_ICONS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
const TH_DOW = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

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
    'from-teal-400 to-teal-600',
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
          // If image fails, hide it so the parent layout stays clean.
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

function findBadge(pts: number) {
  return BADGES.find((b) => pts >= b.pts) ?? null;
}

function findNextBadge(pts: number) {
  return [...BADGES].reverse().find((b) => pts < b.pts) ?? null;
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function todayISO() {
  return isoDate(new Date());
}

function daysAgoISO(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDate(d);
}

// ─── Types ────────────────────────────────────────────────────────────────────

type DatedTx = {
  id: string;
  category_id: string | null;
  quantity: number;
  transaction_date: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

const WasteBankStats = () => {
  const [summaries, setSummaries] = useState<WasteStudentSummary[]>([]);
  const [categories, setCategories] = useState<WasteCategory[]>([]);
  const [recentTx, setRecentTx] = useState<DatedTx[]>([]);
  const [photoMap, setPhotoMap] = useState<Map<string, string | null>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(false);

  // Animated count-ups
  const [animTotals, setAnimTotals] = useState({ items: 0, points: 0, students: 0 });

  useEffect(() => {
    window.scrollTo(0, 0);
    void loadData();

    const channel = supabase
      .channel('waste_bank_stats_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'waste_transactions' },
        () => void loadData(),
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    const startISO = daysAgoISO(89); // last 90 days for category chips + chart
    const endISO = todayISO();
    const [summaryRes, categoriesRes, txRes, studentsRes] = await Promise.all([
      wasteSummaryService.getAll(),
      wasteCategoriesService.getActive(),
      wasteTransactionsService.getInDateRange(startISO, endISO),
      studentsService.getActive(),
    ]);
    if (summaryRes.data) {
      const active = (summaryRes.data as WasteStudentSummary[]).filter(
        (s) => Number(s.total_transactions ?? 0) > 0,
      );
      setSummaries(active);
    }
    if (categoriesRes.data) setCategories(categoriesRes.data as WasteCategory[]);
    if (txRes.data) setRecentTx(txRes.data as DatedTx[]);
    if (studentsRes.data) {
      const m = new Map<string, string | null>();
      for (const s of studentsRes.data as Array<{ id: string; photo_url: string | null }>) {
        m.set(s.id, s.photo_url);
      }
      setPhotoMap(m);
    }
    setUpdatedAt(new Date());
    setIsLoading(false);
  };

  // Animated count-ups
  useEffect(() => {
    const totalItems = summaries.reduce((s, x) => s + Number(x.total_items ?? 0), 0);
    const totalPoints = summaries.reduce((s, x) => s + Number(x.total_points_earned ?? 0), 0);
    const totalStudents = summaries.length;

    if (totalItems === 0 && totalPoints === 0 && totalStudents === 0) {
      setAnimTotals({ items: 0, points: 0, students: 0 });
      return;
    }

    const duration = 900;
    const steps = 30;
    const interval = duration / steps;
    let step = 0;
    const start = animTotals;
    const t = setInterval(() => {
      step++;
      const p = step / steps;
      setAnimTotals({
        items: Math.round(start.items + (totalItems - start.items) * p),
        points: Math.round(start.points + (totalPoints - start.points) * p),
        students: Math.round(start.students + (totalStudents - start.students) * p),
      });
      if (step >= steps) clearInterval(t);
    }, interval);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summaries]);

  // ─── Derived data ─────────────────────────────────────────────────────────

  const ranked = useMemo(
    () =>
      [...summaries].sort(
        (a, b) => Number(b.total_points_earned ?? 0) - Number(a.total_points_earned ?? 0),
      ),
    [summaries],
  );

  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3, 10);
  const maxPts = Math.max(1, ...ranked.map((s) => Number(s.total_points_earned ?? 0)));

  // Class aggregation (from summary view)
  const classRanking = useMemo(() => {
    const map = new Map<string, { name: string; total: number; students: number; tx: number }>();
    for (const s of summaries) {
      const cls = s.class_name ?? '—';
      const cur = map.get(cls) ?? { name: cls, total: 0, students: 0, tx: 0 };
      cur.total += Number(s.total_items ?? 0);
      cur.students += 1;
      cur.tx += Number(s.total_transactions ?? 0);
      map.set(cls, cur);
    }
    return Array.from(map.values())
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [summaries]);

  const maxClassTotal = Math.max(1, ...classRanking.map((c) => c.total));

  // 7-day chart from recentTx
  const chart7d = useMemo(() => {
    const days: { day: string; total: number; dow: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = daysAgoISO(i);
      const dow = new Date(day + 'T12:00:00').getDay();
      const total = recentTx
        .filter((t) => (t.transaction_date ?? '').slice(0, 10) === day)
        .reduce((s, t) => s + Number(t.quantity ?? 0), 0);
      days.push({ day, total, dow });
    }
    return days;
  }, [recentTx]);

  const chartMax = Math.max(1, ...chart7d.map((d) => d.total));

  // Category breakdown (last 90 days, by category_id)
  const categoryTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of recentTx) {
      if (!t.category_id) continue;
      map.set(t.category_id, (map.get(t.category_id) ?? 0) + Number(t.quantity ?? 0));
    }
    return categories.map((c) => ({
      ...c,
      total: map.get(c.id) ?? 0,
    }));
  }, [recentTx, categories]);

  const todayTotal = useMemo(() => {
    const t = todayISO();
    return recentTx
      .filter((tx) => (tx.transaction_date ?? '').slice(0, 10) === t)
      .reduce((s, tx) => s + Number(tx.quantity ?? 0), 0);
  }, [recentTx]);

  const totalAllTx = summaries.reduce((s, x) => s + Number(x.total_transactions ?? 0), 0);
  const top1 = ranked[0];
  const topClass = classRanking[0];

  // Podium order: 2 | 1 | 3
  const podiumOrder = [top3[1], top3[0], top3[2]];
  const podiumRankIdx = [1, 0, 2];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="สถิติธนาคารขยะ"
        description="สถิติและอันดับนักเรียนธนาคารขยะโรงเรียนบ้านคำไผ่ — อัปเดตเรียลไทม์"
      />
      <SiteHeader />

      <div className="max-w-7xl mx-auto w-full bg-background flex-grow flex flex-col">
        {/* ─── Hero ────────────────────────────────────────────────────── */}
        <section className="bg-primary py-6 md:py-8">
          <div className="container mx-auto px-4 text-center">
            <span className="inline-block text-xs md:text-sm font-semibold uppercase tracking-wider text-primary-foreground/70 mb-1.5">
              ธนาคารขยะ
            </span>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-primary-foreground mb-2">
              <BarChart3 className="inline w-5 h-5 md:w-6 md:h-6 mr-1.5 -mt-1" />
              สถิติและอันดับ
            </h1>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Link
                to="/waste-bank"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-primary-foreground text-xs font-medium transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                กลับธนาคารขยะ
              </Link>
              {isLive && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/40 text-emerald-50 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  LIVE
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ─── Grand Total + Category Chips ───────────────────────────── */}
        <section className="px-4 pt-6 pb-4">
          <Card className="border-2 border-green-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-green-50 to-white p-5 md:p-6 text-center">
              <p className="text-xs md:text-sm font-semibold text-green-700 uppercase tracking-wider mb-1">
                🌍 ขยะที่เก็บได้รวม
              </p>
              <p className="text-4xl md:text-5xl font-extrabold text-green-700 leading-tight">
                {isLoading ? '…' : animTotals.items.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                ชิ้น · จาก {totalAllTx.toLocaleString()} ครั้งบันทึก ·{' '}
                {animTotals.students.toLocaleString()} คน · {animTotals.points.toLocaleString()} แต้ม
              </p>

              {/* Category chips (last 90 days) */}
              {categoryTotals.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {categoryTotals.map((c) => (
                    <div
                      key={c.id}
                      className="px-3 py-1.5 rounded-full bg-card border border-green-100 text-xs md:text-sm font-medium text-foreground shadow-sm flex items-center gap-1.5"
                      title={`${c.name} (90 วันล่าสุด)`}
                    >
                      <span className="text-base leading-none">{c.icon ?? '♻️'}</span>
                      <span className="text-muted-foreground">{c.name}</span>
                      <span className="font-bold text-green-700">{c.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
              {categoryTotals.length > 0 && (
                <p className="text-[10px] text-muted-foreground mt-2">
                  * แยกตามประเภท คิดจากการบันทึก 90 วันล่าสุด
                </p>
              )}
            </div>
          </Card>
        </section>

        {/* ─── 3-Tab View ──────────────────────────────────────────────── */}
        <section className="px-4 pb-10">
          <Tabs defaultValue="students">
            <TabsList className="w-full max-w-md mx-auto grid grid-cols-3 mb-4">
              <TabsTrigger value="students" className="gap-1.5">
                <Trophy className="w-4 h-4" />
                นักเรียน
              </TabsTrigger>
              <TabsTrigger value="classes" className="gap-1.5">
                <Users className="w-4 h-4" />
                ห้องเรียน
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-1.5">
                <TrendingUp className="w-4 h-4" />
                สถิติ
              </TabsTrigger>
            </TabsList>

            {/* ── Tab 1: Students ───────────────────────────────────── */}
            <TabsContent value="students" className="mt-0">
              {isLoading ? (
                <SkeletonList />
              ) : ranked.length === 0 ? (
                <EmptyState message="ยังไม่มีนักเรียนที่บันทึกขยะ" />
              ) : (
                <>
                  {/* Podium 2-1-3 */}
                  {top3.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 md:gap-3 mb-4 items-end max-w-2xl mx-auto">
                      {podiumOrder.map((s, pos) => {
                        if (!s) return <div key={pos} />;
                        const idx = podiumRankIdx[pos];
                        const isFirst = idx === 0;
                        const badge = findBadge(Number(s.total_points_earned ?? 0));
                        return (
                          <div
                            key={pos}
                            className={`flex flex-col items-center text-center p-1.5 xs:p-2.5 md:p-4 rounded-2xl border-2 ${MEDAL_BG[idx]} ${
                              isFirst ? 'shadow-md scale-105 pt-3.5 pb-4 md:pt-5 md:pb-6' : 'shadow-sm'
                            } transition-all`}
                          >
                            <span className={`mb-1.5 ${isFirst ? 'text-2xl xs:text-4xl' : 'text-xl xs:text-3xl'}`}>
                              {MEDALS[idx]}
                            </span>
                            <StudentAvatar
                              name={s.full_name || '?'}
                              className={isFirst ? "w-12 h-12 xs:w-16 xs:h-16 md:w-20 md:h-20" : "w-9 h-9 xs:w-12 xs:h-12 md:w-14 md:h-14"}
                              photoUrl={s.student_id ? photoMap.get(s.student_id) : null}
                            />
                            <p
                              className={`font-semibold mt-1.5 leading-tight text-foreground truncate max-w-full text-[10px] xs:text-xs md:text-base`}
                            >
                              {s.full_name || '—'}
                            </p>
                            {s.class_name && (
                              <Badge className="mt-0.5 bg-white/70 text-foreground border-0 text-[9px] py-0 px-1">
                                {s.class_name}
                              </Badge>
                            )}
                            <p
                              className={`mt-1 font-bold ${MEDAL_TEXT[idx]} text-[10px] xs:text-xs sm:text-sm md:text-base`}
                            >
                              {Number(s.total_points_earned ?? 0).toLocaleString()} แต้ม
                            </p>
                            {badge && (
                              <p className="text-[9px] xs:text-[10px] text-muted-foreground mt-0.5 hidden xs:block">
                                {badge.icon} {badge.label}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Rest 4–10 */}
                  {rest.length > 0 && (
                    <Card className="shadow-sm overflow-hidden max-w-2xl mx-auto">
                      <div className="divide-y divide-border max-h-[360px] overflow-y-auto">
                        {rest.map((s, i) => {
                          const rank = i + 4;
                          const pts = Number(s.total_points_earned ?? 0);
                          const badge = findBadge(pts);
                          const next = findNextBadge(pts);
                          const pct = (pts / maxPts) * 100;
                          return (
                            <div key={s.student_id ?? i} className="px-3 py-1.5 hover:bg-muted/40 transition-colors">
                              <div className="flex items-center gap-3">
                                <span className="w-6 text-center text-sm font-bold flex-shrink-0 text-muted-foreground">
                                  {RANK_ICONS[rank - 1] ?? rank}
                                </span>
                                <StudentAvatar
                                  name={s.full_name || '?'}
                                  size={28}
                                  photoUrl={s.student_id ? photoMap.get(s.student_id) : null}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-baseline gap-1.5">
                                    <p className="text-xs font-semibold truncate text-foreground">
                                      {s.full_name || '—'}
                                    </p>
                                    {s.class_name && (
                                      <Badge className="bg-green-100 text-green-700 border-0 text-[9px] py-0 px-1">
                                        {s.class_name}
                                      </Badge>
                                    )}
                                    {badge && (
                                      <span className={`text-[9px] font-medium ${badge.color}`}>
                                        {badge.icon} {badge.label}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Compact Progress Bar & Label */}
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <div className="w-16 h-1 rounded-full bg-muted overflow-hidden flex-shrink-0">
                                      <div
                                        className="h-full bg-green-500 rounded-full transition-all"
                                        style={{ width: `${Math.min(100, pct).toFixed(1)}%` }}
                                      />
                                    </div>
                                    <span className="text-[9px] text-muted-foreground truncate">
                                      {next
                                        ? `ถัดไป: ${next.icon} (${pts}/${next.pts})`
                                        : '🏆 สูงสุดแล้ว!'}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <span className="text-xs font-bold text-green-700">
                                    {pts.toLocaleString()} แต้ม
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            {/* ── Tab 2: Classes ────────────────────────────────────── */}
            <TabsContent value="classes" className="mt-0">
              {isLoading ? (
                <SkeletonList />
              ) : classRanking.length === 0 ? (
                <EmptyState message="ยังไม่มีข้อมูลห้องเรียน" />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
                  {classRanking.map((c, i) => {
                    const pct = (c.total / maxClassTotal) * 100;
                    return (
                      <Card key={c.name} className="p-4 text-center shadow-sm">
                        <div className="text-2xl mb-1">{RANK_ICONS[i] ?? '🎖️'}</div>
                        <p className="font-bold text-foreground text-sm mb-1">{c.name}</p>
                        <p className="text-2xl font-extrabold text-green-700">
                          {c.total.toLocaleString()}
                        </p>
                        <p className="text-[11px] text-muted-foreground">ชิ้น</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {c.students} คน · {c.tx} ครั้ง
                        </p>
                        <div className="h-1 rounded-full bg-muted overflow-hidden mt-2">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${pct.toFixed(1)}%` }}
                          />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* ── Tab 3: Stats / 7-day Chart ────────────────────────── */}
            <TabsContent value="stats" className="mt-0 max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                {/* Bar chart - 7 cols */}
                <Card className="p-4 shadow-sm md:col-span-7 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      📅 จำนวนขยะ 7 วันย้อนหลัง (ชิ้น)
                    </p>
                  </div>
                  {isLoading ? (
                    <div className="h-32 rounded-lg bg-muted animate-pulse" />
                  ) : (
                    <div className="flex items-end gap-1.5 md:gap-2 h-32 mt-2">
                      {chart7d.map((d) => {
                        const pct = Math.max(4, (d.total / chartMax) * 100);
                        return (
                          <div
                            key={d.day}
                            className="flex-1 flex flex-col items-center gap-1"
                          >
                            <span className="text-[10px] font-bold text-green-700">
                              {d.total > 0 ? d.total : ''}
                            </span>
                            <div
                              className="w-full bg-gradient-to-b from-green-400 to-green-600 rounded-t-md transition-all"
                              style={{ height: `${pct}%` }}
                            />
                            <span className="text-[10px] text-muted-foreground text-center leading-tight">
                              {TH_DOW[d.dow]}
                              <br />
                              <span className="text-[9px] text-slate-400">{d.day.slice(5)}</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

                {/* Summary rows - 5 cols */}
                <Card className="shadow-sm overflow-hidden md:col-span-5 flex flex-col justify-between">
                  <div className="divide-y divide-border text-xs">
                    <SummaryRow
                      icon="🌍"
                      label="ขยะทั้งหมด"
                      value={`${animTotals.items.toLocaleString()} ชิ้น`}
                    />
                    <SummaryRow
                      icon="📅"
                      label="วันนี้"
                      value={`${todayTotal.toLocaleString()} ชิ้น`}
                    />
                    <SummaryRow
                      icon="📋"
                      label="จำนวนครั้งบันทึก"
                      value={totalAllTx.toLocaleString()}
                    />
                    <SummaryRow
                      icon="👤"
                      label="จำนวนนักเรียน"
                      value={`${animTotals.students.toLocaleString()} คน`}
                    />
                    <SummaryRow
                      icon="✨"
                      label="แต้มสะสมรวม"
                      value={`${animTotals.points.toLocaleString()} แต้ม`}
                    />
                    <SummaryRow
                      icon="🏆"
                      label="นักเรียนอันดับ 1"
                      value={
                        top1
                          ? `${top1.full_name ?? '—'} (${Number(top1.total_points_earned ?? 0)} แต้ม)`
                          : '—'
                      }
                    />
                    <SummaryRow
                      icon="🏫"
                      label="ห้องอันดับ 1"
                      value={topClass ? `${topClass.name} (${topClass.total} ชิ้น)` : '—'}
                    />
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        <p className="text-center text-xs text-muted-foreground pb-6">
          {updatedAt
            ? `อัปเดตล่าสุด: ${updatedAt.toLocaleTimeString('th-TH')}`
            : 'กำลังโหลดข้อมูล…'}
        </p>
      </div>

      <Footer />
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonList() {
  return (
    <div className="space-y-2 max-w-3xl mx-auto">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Recycle className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-muted/20 transition-colors">
      <span className="text-base flex-shrink-0">{icon}</span>
      <div className="flex-1 text-xs text-muted-foreground">{label}</div>
      <div className="text-xs font-semibold text-foreground text-right">{value}</div>
    </div>
  );
}

export default WasteBankStats;
