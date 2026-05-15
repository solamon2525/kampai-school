import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  Search,
  ArrowDownToLine,
  ArrowUpFromLine,
  PiggyBank,
  History,
  Users,
  Sparkles,
  Trophy,
  Award,
  Activity,
} from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  savingsLookupService,
  savingsSummaryService,
  savingsTransactionsService,
  getSaverTier,
  type StudentSavingsLookup,
  type SavingsHistoryRow,
  type SavingsStudentSummary,
  type SavingsTransaction,
} from '@/services/savings.service';
import { SaverTierBadge } from '@/components/savings/SaverTierBadge';
import { SaverPodium } from '@/components/savings/SaverPodium';

const CLASSES = ['อ.1', 'อ.2', 'อ.3', 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];

const HOW_IT_WORKS = [
  {
    icon: <PiggyBank className="w-8 h-8 text-amber-600" />,
    step: '1',
    title: 'ฝากเงินกับครู',
    desc: 'นำเงินมาฝากที่โรงเรียน — จำนวนใดก็ได้ ครูจะบันทึกธุรกรรมในระบบ',
  },
  {
    icon: <Wallet className="w-8 h-8 text-amber-600" />,
    step: '2',
    title: 'ตรวจสอบยอดได้',
    desc: 'ดูยอดเงินสะสมและประวัติฝาก/ถอน ด้วยรหัสนักเรียน',
  },
  {
    icon: <ArrowUpFromLine className="w-8 h-8 text-amber-600" />,
    step: '3',
    title: 'ถอนเมื่อจำเป็น',
    desc: 'ขอถอนเงินผ่านครู — เพื่อความปลอดภัยและสอนวินัยการออม',
  },
];

const fmtBaht = (n: number | null | undefined) => {
  if (n == null) return '0.00 ฿';
  return `${Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿`;
};

const StudentAvatar = ({
  name,
  photoUrl,
  size = 36,
}: {
  name: string;
  photoUrl?: string | null;
  size?: number;
}) => {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        loading="lazy"
        style={{ width: size, height: size }}
        className="rounded-full object-cover flex-shrink-0 border border-amber-200 dark:border-amber-800/40 bg-muted"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 flex items-center justify-center flex-shrink-0 font-bold border border-amber-200 dark:border-amber-800/40"
    >
      {(name || '?').charAt(0)}
    </div>
  );
};

export default function SavingsBank() {
  const { toast } = useToast();

  // Lookup state
  const [code, setCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [student, setStudent] = useState<StudentSavingsLookup | null>(null);
  const [studentDepositCount, setStudentDepositCount] = useState<number | null>(null);
  const [history, setHistory] = useState<SavingsHistoryRow[]>([]);

  // Public data
  const [summaries, setSummaries] = useState<SavingsStudentSummary[]>([]);
  const [recent, setRecent] = useState<SavingsTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [classFilter, setClassFilter] = useState<string>('all');

  useEffect(() => {
    (async () => {
      const [s, r] = await Promise.all([
        savingsSummaryService.getAll(),
        savingsTransactionsService.getRecent(10),
      ]);
      if (s.data) setSummaries(s.data as unknown as SavingsStudentSummary[]);
      if (r.data) setRecent(r.data as unknown as SavingsTransaction[]);
      setIsLoading(false);
    })();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const c = code.trim();
    if (!c) return;
    setSearching(true);
    setStudent(null);
    setHistory([]);
    setStudentDepositCount(null);

    const { data, error } = await savingsLookupService.lookupStudent(c);
    if (error) {
      toast({ title: 'ค้นหาไม่สำเร็จ', description: error.message, variant: 'destructive' });
      setSearching(false);
      return;
    }
    const row = (data as StudentSavingsLookup[] | null)?.[0];
    if (!row) {
      toast({ title: 'ไม่พบนักเรียน', description: 'กรุณาตรวจสอบรหัสนักเรียน', variant: 'destructive' });
      setSearching(false);
      return;
    }
    setStudent(row);

    const { data: histData } = await savingsLookupService.getStudentHistory(c, 50);
    const histRows = (histData as SavingsHistoryRow[] | null) ?? [];
    setHistory(histRows);
    setStudentDepositCount(histRows.filter((h) => h.transaction_type === 'deposit').length);
    setSearching(false);
  };

  // ─── Derived public data ─────────────────────────────────────────────────
  const publicSummaries = useMemo(
    () => summaries.filter((s) => Number(s.deposit_count ?? 0) > 0),
    [summaries],
  );

  const filteredSummaries = useMemo(() => {
    const sorted = [...publicSummaries].sort(
      (a, b) =>
        Number(b.deposit_count ?? 0) - Number(a.deposit_count ?? 0) ||
        Number(b.total_transactions ?? 0) - Number(a.total_transactions ?? 0),
    );
    if (classFilter === 'all') return sorted;
    return sorted.filter((s) => s.class_name === classFilter);
  }, [publicSummaries, classFilter]);

  const stats = useMemo(() => {
    const savers = publicSummaries.length;
    const totalDeposits = publicSummaries.reduce(
      (acc, s) => acc + Number(s.deposit_count ?? 0),
      0,
    );
    const goldPlus = publicSummaries.filter((s) => {
      const t = getSaverTier(s.deposit_count);
      return t === 'Diamond' || t === 'Platinum' || t === 'Gold';
    }).length;
    return { savers, totalDeposits, goldPlus };
  }, [publicSummaries]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="ธนาคารพอเพียง — โรงเรียนคำไผ่"
        description="ระบบฝาก/ถอนเงินสำหรับนักเรียน สอนวินัยการออมตามหลักปรัชญาเศรษฐกิจพอเพียง"
      />
      <SiteHeader />

      <main className="flex-1">
        {/* ─── Hero ───────────────────────────────────────────────────────── */}
        <section className="bg-gradient-to-br from-amber-50 via-background to-emerald-50/40 dark:from-amber-950/20 dark:to-emerald-950/10 py-12 md:py-16">
          <div className="container max-w-5xl mx-auto px-4 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-xs font-medium">
              <PiggyBank className="w-3.5 h-3.5" /> เศรษฐกิจพอเพียง
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">ธนาคารพอเพียง</h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              ระบบฝาก/ถอนเงินสำหรับนักเรียน สอนวินัยการออมตามหลักปรัชญาเศรษฐกิจพอเพียง
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <a
                href="#leaderboard"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs md:text-sm font-semibold transition shadow-sm"
              >
                <Trophy className="w-4 h-4" />
                ดูอันดับนักออม
              </a>
              <a
                href="#lookup"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-700/10 hover:bg-amber-700/20 text-amber-800 dark:text-amber-300 text-xs md:text-sm font-medium transition"
              >
                <Search className="w-4 h-4" />
                ตรวจสอบยอดของฉัน
              </a>
            </div>
          </div>
        </section>

        {/* ─── Stats Row (ไม่มีตัวเลขเงิน) ───────────────────────────────── */}
        <section className="bg-card border-b border-border shadow-sm">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-amber-700 dark:text-amber-300" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">นักเรียนที่ร่วมออม</p>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 tabular-nums">
                    {isLoading ? '...' : stats.savers.toLocaleString('th-TH')}
                    <span className="text-sm font-normal ml-1">คน</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                  <ArrowDownToLine className="w-6 h-6 text-emerald-700 dark:text-emerald-300" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">จำนวนครั้งฝากรวม</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                    {isLoading ? '...' : stats.totalDeposits.toLocaleString('th-TH')}
                    <span className="text-sm font-normal ml-1">ครั้ง</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40">
                <div className="w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-sky-700 dark:text-sky-300" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ระดับ Gold ขึ้นไป</p>
                  <p className="text-2xl font-bold text-sky-700 dark:text-sky-300 tabular-nums">
                    {isLoading ? '...' : stats.goldPlus.toLocaleString('th-TH')}
                    <span className="text-sm font-normal ml-1">คน</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Hall of Savers ─────────────────────────────────────────────── */}
        <section id="leaderboard" className="max-w-5xl mx-auto w-full px-4 py-10">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6 text-amber-600" /> อันดับนักออม
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              จัดอันดับตามจำนวนครั้งที่ฝาก — รางวัลวินัย ไม่ใช่ความรวย
            </p>
          </div>

          <Tabs value={classFilter} onValueChange={setClassFilter} className="w-full">
            <TabsList className="w-full flex flex-wrap h-auto">
              <TabsTrigger value="all" className="flex-1 min-w-20">รวมทุกชั้น</TabsTrigger>
              {CLASSES.map((c) => (
                <TabsTrigger key={c} value={c} className="flex-1 min-w-14">{c}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="mt-6">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : filteredSummaries.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <PiggyBank className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>ยังไม่มีข้อมูล</p>
              </div>
            ) : (
              <>
                {/* Top 3 podium */}
                <SaverPodium entries={filteredSummaries.slice(0, 3) as never} />

                {/* Rank 4-10 */}
                {filteredSummaries.length > 3 && (
                  <div className="mt-6 space-y-2">
                    {filteredSummaries.slice(3, 10).map((s, idx) => (
                      <div
                        key={s.student_id ?? idx}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted/30 transition"
                      >
                        <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-semibold flex-shrink-0">
                          {idx + 4}
                        </div>
                        <StudentAvatar
                          name={s.full_name ?? '?'}
                          photoUrl={s.photo_url}
                          size={36}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{s.full_name ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">{s.class_name ?? ''}</p>
                        </div>
                        <SaverTierBadge depositCount={s.deposit_count} size="sm" />
                        <div className="text-sm font-bold text-amber-700 dark:text-amber-300 tabular-nums flex-shrink-0">
                          ฝาก {Number(s.deposit_count ?? 0).toLocaleString('th-TH')} ครั้ง
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* ─── Recent Activity (ไม่แสดงจำนวนเงิน) ────────────────────────── */}
        <section className="max-w-5xl mx-auto w-full px-4 pb-12">
          <Card>
            <CardContent className="p-0">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-semibold">ความเคลื่อนไหวล่าสุด</h3>
                <span className="text-xs text-muted-foreground ml-auto">
                  (แสดงเฉพาะการทำรายการ ไม่เปิดเผยจำนวนเงิน)
                </span>
              </div>
              {isLoading ? (
                <div className="p-6 text-center text-sm text-muted-foreground">กำลังโหลด...</div>
              ) : recent.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">ยังไม่มีรายการ</div>
              ) : (
                <ul className="divide-y divide-border">
                  {recent.map((t) => (
                    <li key={t.id} className="px-4 py-3 flex items-center gap-3">
                      <StudentAvatar
                        name={t.student_name}
                        photoUrl={t.students?.photo_url}
                        size={32}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.student_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.student_class ?? ''} · {t.transaction_date}
                        </p>
                      </div>
                      {t.transaction_type === 'deposit' ? (
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 gap-1">
                          <ArrowDownToLine className="w-3 h-3" /> ฝาก
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-300 hover:bg-orange-500/20 gap-1">
                          <ArrowUpFromLine className="w-3 h-3" /> ถอน
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ─── Lookup (เฉพาะตัวเด็ก/ผู้ปกครอง) ────────────────────────────── */}
        <section id="lookup" className="container max-w-3xl mx-auto px-4 pb-12">
          <Card className="shadow-lg">
            <CardContent className="p-6 md:p-8 space-y-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Search className="w-5 h-5" /> ตรวจสอบยอดเงินสะสมของฉัน
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  กรอกรหัสนักเรียนเพื่อดูยอดเงินและประวัติธุรกรรมของตัวเอง
                </p>
              </div>
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="เช่น 12345"
                  className="flex-1"
                />
                <Button type="submit" disabled={searching || !code.trim()}>
                  {searching ? 'กำลังค้นหา...' : 'ค้นหา'}
                </Button>
              </form>

              {student && (
                <div className="pt-4 border-t border-border space-y-4">
                  <div className="flex items-center gap-3">
                    <StudentAvatar
                      name={student.full_name}
                      photoUrl={student.photo_url}
                      size={56}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{student.full_name}</p>
                      <p className="text-xs text-muted-foreground">{student.class_name ?? '—'}</p>
                    </div>
                    <SaverTierBadge depositCount={studentDepositCount} size="md" />
                  </div>
                  <div className="bg-gradient-to-br from-amber-500/10 to-emerald-500/10 rounded-lg p-4 text-center">
                    <div className="text-xs text-muted-foreground">ยอดเงินคงเหลือ</div>
                    <div className="text-3xl md:text-4xl font-bold text-amber-700 dark:text-amber-300 tabular-nums mt-1">
                      {fmtBaht(Number(student.current_balance ?? 0))}
                    </div>
                  </div>

                  {history.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold flex items-center gap-1 mb-2">
                        <History className="w-4 h-4" /> ประวัติธุรกรรม
                      </h3>
                      <div className="overflow-x-auto rounded border border-border">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/40 text-muted-foreground">
                            <tr>
                              <th className="text-left p-2">วันที่</th>
                              <th className="text-center p-2">ประเภท</th>
                              <th className="text-right p-2">จำนวน</th>
                              <th className="text-right p-2">คงเหลือ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {history.map((h) => (
                              <tr key={h.txn_id} className="border-t border-border">
                                <td className="p-2 text-muted-foreground whitespace-nowrap">
                                  {h.transaction_date}
                                </td>
                                <td className="p-2 text-center">
                                  {h.transaction_type === 'deposit' ? (
                                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 gap-1">
                                      <ArrowDownToLine className="w-3 h-3" /> ฝาก
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-300 hover:bg-orange-500/20 gap-1">
                                      <ArrowUpFromLine className="w-3 h-3" /> ถอน
                                    </Badge>
                                  )}
                                </td>
                                <td
                                  className={cn(
                                    'p-2 text-right tabular-nums font-medium',
                                    h.transaction_type === 'deposit'
                                      ? 'text-emerald-700 dark:text-emerald-400'
                                      : 'text-orange-700 dark:text-orange-400',
                                  )}
                                >
                                  {h.transaction_type === 'deposit' ? '+' : '−'}
                                  {fmtBaht(Number(h.amount))}
                                </td>
                                <td className="p-2 text-right tabular-nums text-muted-foreground">
                                  {fmtBaht(Number(h.balance_after))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ─── How it works ───────────────────────────────────────────────── */}
        <section className="container max-w-5xl mx-auto px-4 pb-16">
          <h2 className="text-2xl font-bold text-center mb-8">ขั้นตอนการใช้งาน</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {HOW_IT_WORKS.map((s) => (
              <Card key={s.step}>
                <CardContent className="p-6 space-y-3 text-center">
                  <div className="flex justify-center">{s.icon}</div>
                  <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">ขั้นที่ {s.step}</div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
