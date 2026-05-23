import { useEffect, useMemo, useState } from 'react';
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
  ChevronRight,
} from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatThaiDateMedium } from '@/lib/thaiDate';
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
    step: '01',
    title: 'ฝากเงินกับครู',
    desc: 'นำเงินมาฝากที่โรงเรียน จำนวนใดก็ได้ ครูจะบันทึกธุรกรรมในระบบทันที',
    icon: PiggyBank,
  },
  {
    step: '02',
    title: 'ตรวจสอบยอดได้ตลอดเวลา',
    desc: 'ดูยอดเงินสะสมและประวัติฝาก/ถอนของตนเองได้ด้วยรหัสนักเรียน',
    icon: Wallet,
  },
  {
    step: '03',
    title: 'ถอนเงินเมื่อจำเป็น',
    desc: 'ขอถอนผ่านครู เพื่อความปลอดภัยและฝึกวินัยการวางแผนใช้จ่าย',
    icon: ArrowUpFromLine,
  },
];

const fmtBaht = (n: number | null | undefined) => {
  if (n == null) return '0.00 ฿';
  return `${Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿`;
};

const fmtCount = (n: number | null | undefined) =>
  Number(n ?? 0).toLocaleString('th-TH');

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
        className="rounded-full object-cover flex-shrink-0 ring-2 ring-white shadow-sm bg-slate-100"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 font-bold ring-2 ring-white shadow-sm"
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

  // Derived data
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
    <div className="min-h-screen flex flex-col bg-white">
      <SEOHead
        title="ธนาคารพอเพียง — โรงเรียนคำไผ่"
        description="ระบบฝาก/ถอนเงินสำหรับนักเรียน สอนวินัยการออมตามหลักปรัชญาเศรษฐกิจพอเพียง"
      />
      <SiteHeader />

      <main className="flex-1 max-w-7xl mx-auto w-full bg-white flex flex-col">
        {/* ─── HERO (asymmetric split, dark slate + gold accent) ──────────── */}
        <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
          {/* Subtle pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4 md:gap-6 items-center">
              {/* LEFT: Copy */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 ring-1 ring-amber-400/30 text-amber-300 text-[10px] font-bold uppercase tracking-[0.12em]">
                  <PiggyBank className="w-3 h-3" />
                  ธนาคารพอเพียง
                </div>
                <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white leading-[1.15]">
                  ออม <span className="text-amber-400">วันละนิด</span>
                  <br />
                  สร้างวินัย <span className="italic font-bold text-slate-300">ทั้งชีวิต</span>
                </h1>
                <p className="text-xs md:text-sm text-slate-300 max-w-xl leading-relaxed">
                  ระบบฝาก/ถอนเงินสำหรับนักเรียน
                  สอนวินัยการออมตามหลักปรัชญาเศรษฐกิจพอเพียง
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href="#leaderboard"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 active:translate-y-px text-amber-950 text-xs font-bold transition shadow-md shadow-amber-500/10"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    ดูอันดับนักออม
                    <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="#lookup"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 active:translate-y-px text-white text-xs font-bold transition ring-1 ring-white/20"
                  >
                    <Search className="w-3.5 h-3.5" />
                    ตรวจสอบยอดของฉัน
                  </a>
                </div>
              </div>

              {/* RIGHT: Floating amber stat panel */}
              <div className="relative transform-gpu">
                <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-xl p-4 md:p-5 shadow-xl shadow-amber-500/20 ring-1 ring-amber-300/40">
                  <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-950/80 mb-0.5">
                    Hall of Savers
                  </div>
                  <div className="text-xs font-semibold text-amber-950 mb-3">
                    นักเรียนที่ร่วมโครงการ
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl md:text-4xl font-extrabold tabular-nums text-amber-950 leading-none tracking-tight">
                      {isLoading ? '—' : fmtCount(stats.savers)}
                    </span>
                    <span className="text-xs font-bold text-amber-900">คน</span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-amber-900/15 flex items-center justify-between text-amber-950">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider opacity-75">
                        ครั้งฝากรวม
                      </div>
                      <div className="text-xl font-extrabold tabular-nums">
                        {isLoading ? '—' : fmtCount(stats.totalDeposits)}
                      </div>
                    </div>
                    <Sparkles className="w-6 h-6 opacity-30" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── STATS STRIP (asymmetric 4 cards) ───────────────────────────── */}
        <section className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <StatCard
                label="นักเรียนที่ร่วมออม"
                value={fmtCount(stats.savers)}
                unit="คน"
                icon={<Users className="w-5 h-5" />}
                accent="amber"
                isFeatured
              />
              <StatCard
                label="ครั้งฝากรวม"
                value={fmtCount(stats.totalDeposits)}
                unit="ครั้ง"
                icon={<ArrowDownToLine className="w-5 h-5" />}
                accent="slate"
              />
              <StatCard
                label="ระดับ Gold ขึ้นไป"
                value={fmtCount(stats.goldPlus)}
                unit="คน"
                icon={<Award className="w-5 h-5" />}
                accent="slate"
              />
              <StatCard
                label="ใช้งานล่าสุด"
                value={recent[0]?.transaction_date ? formatThaiDateMedium(recent[0].transaction_date) : '—'}
                unit=""
                icon={<Activity className="w-5 h-5" />}
                accent="slate"
                isDate
              />
            </div>
          </div>
        </section>

        {/* ─── HALL OF SAVERS ─────────────────────────────────────────────── */}
        <section id="leaderboard" className="bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <div className="text-center mb-6">
              <div className="text-xs font-bold uppercase tracking-[0.15em] text-amber-600 mb-1.5">
                Hall of Savers
              </div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
                อันดับนักออม
              </h2>
              <p className="text-xs md:text-sm text-slate-500 font-medium mt-1.5 max-w-xl mx-auto">
                จัดอันดับตามจำนวนครั้งที่ฝาก — รางวัลของวินัย ไม่ใช่ความรวย
              </p>
            </div>

            {/* Class filter chips */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <ClassChip active={classFilter === 'all'} onClick={() => setClassFilter('all')}>
                รวมทุกชั้น
              </ClassChip>
              {CLASSES.map((c) => (
                <ClassChip key={c} active={classFilter === c} onClick={() => setClassFilter(c)}>
                  {c}
                </ClassChip>
              ))}
            </div>

            {isLoading ? (
              <div className="space-y-3 max-w-3xl mx-auto">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-slate-200 animate-pulse" />
                ))}
              </div>
            ) : filteredSummaries.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <PiggyBank className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">ยังไม่มีข้อมูล</p>
              </div>
            ) : (
              <>
                {/* Top 3 podium */}
                <SaverPodium entries={filteredSummaries.slice(0, 3) as never} />

                {/* Rank 4-10 timeline list */}
                {filteredSummaries.length > 3 && (
                  <div className="mt-6 md:mt-8 max-w-3xl mx-auto">
                    <div className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 mb-2 text-center">
                      อันดับ 4 — 10
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      {filteredSummaries.slice(3, 10).map((s, idx) => (
                        <div
                          key={s.student_id ?? idx}
                          className="flex items-center gap-3 px-3.5 py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition"
                        >
                          <div className="w-9 h-9 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center text-sm font-extrabold flex-shrink-0 tabular-nums">
                            {idx + 4}
                          </div>
                          <StudentAvatar
                            name={s.full_name ?? '?'}
                            photoUrl={s.photo_url}
                            size={40}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">
                              {s.full_name ?? '—'}
                            </p>
                            <p className="text-xs text-slate-600 font-medium">
                              {s.class_name ?? ''}
                            </p>
                          </div>
                          <SaverTierBadge depositCount={s.deposit_count} size="sm" />
                          <div className="text-right">
                            <div className="text-base font-extrabold text-slate-900 tabular-nums">
                              {fmtCount(s.deposit_count)}
                            </div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              ครั้ง
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* ─── RECENT ACTIVITY (timeline) ─────────────────────────────────── */}
        <section className="bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <div className="mb-5">
              <div className="text-xs font-bold uppercase tracking-[0.15em] text-amber-600 mb-1.5">
                Live Activity
              </div>
              <h2 className="text-lg md:text-xl font-bold tracking-tight text-slate-900">
                ความเคลื่อนไหวล่าสุด
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                แสดงเฉพาะรายการธุรกรรม ไม่เปิดเผยจำนวนเงิน
              </p>
            </div>

            {isLoading ? (
              <div className="p-6 text-center text-sm text-slate-500 font-medium">
                กำลังโหลด...
              </div>
            ) : recent.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500 font-medium">
                ยังไม่มีรายการ
              </div>
            ) : (
              <div className="max-h-[240px] overflow-y-auto pr-1">
                <ol className="relative border-l-2 border-slate-200 ml-3 space-y-3.5">
                  {recent.map((t) => (
                    <li key={t.id} className="ml-6">
                      <span
                        className={cn(
                          'absolute -left-[9px] flex items-center justify-center w-4 h-4 rounded-full ring-4 ring-white',
                          t.transaction_type === 'deposit' ? 'bg-amber-500' : 'bg-rose-500',
                        )}
                      />
                      <div className="flex items-center gap-3">
                        <StudentAvatar
                          name={t.student_name}
                          photoUrl={t.students?.photo_url}
                          size={32}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {t.student_name}
                          </p>
                          <p className="text-xs text-slate-600 font-medium">
                            {t.student_class ?? ''} · {formatThaiDateMedium(t.transaction_date)}
                          </p>
                        </div>
                        {t.transaction_type === 'deposit' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-xs font-bold shadow-sm">
                            <ArrowDownToLine className="w-3 h-3" /> ฝาก
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500 text-white text-xs font-bold shadow-sm">
                            <ArrowUpFromLine className="w-3 h-3" /> ถอน
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </section>

        {/* ─── LOOKUP (private balance check) ─────────────────────────────── */}
        <section id="lookup" className="bg-slate-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <div className="bg-white rounded-2xl shadow-lg ring-1 ring-slate-200 overflow-hidden">
              <div className="bg-slate-900 px-4 md:px-6 py-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-400 mb-0.5">
                  Account Lookup
                </div>
                <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-1.5">
                  <Search className="w-4 h-4" /> ตรวจสอบยอดเงินของฉัน
                </h2>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  กรอกรหัสนักเรียนเพื่อดูยอดเงินสะสม + ประวัติธุรกรรม
                </p>
              </div>

              <div className="p-4 md:p-6 space-y-4">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="เช่น 12345"
                    className="flex-1 text-base font-medium border-slate-300 focus-visible:ring-amber-500"
                  />
                  <Button
                    type="submit"
                    disabled={searching || !code.trim()}
                    className="bg-amber-500 hover:bg-amber-400 active:translate-y-px text-amber-950 font-bold shadow-md"
                  >
                    {searching ? 'กำลังค้นหา...' : 'ค้นหา'}
                  </Button>
                </form>

                {student && (
                  <div className="pt-4 border-t border-slate-200 space-y-4">
                    {/* Student header */}
                    <div className="flex items-center gap-3">
                      <StudentAvatar
                        name={student.full_name}
                        photoUrl={student.photo_url}
                        size={48}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-slate-900 truncate text-sm md:text-base">
                          {student.full_name}
                        </p>
                        <p className="text-xs text-slate-600 font-medium">
                          {student.class_name ?? '—'}
                        </p>
                      </div>
                      <SaverTierBadge depositCount={studentDepositCount} size="sm" />
                    </div>

                    {/* Balance hero — only place $ shown publicly */}
                    <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-xl p-4 md:p-5 text-center shadow-md shadow-amber-500/10">
                      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-950/80">
                        ยอดเงินคงเหลือ
                      </div>
                      <div className="text-2xl md:text-3xl font-extrabold text-amber-950 tabular-nums tracking-tight mt-1">
                        {fmtBaht(Number(student.current_balance ?? 0))}
                      </div>
                    </div>

                    {/* History table */}
                    {history.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <History className="w-3.5 h-3.5 text-slate-700" />
                          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            ประวัติธุรกรรม
                          </h3>
                        </div>
                        <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-[220px] overflow-y-auto">
                          <table className="w-full text-xs">
                            <thead className="bg-slate-100 sticky top-0 z-10">
                              <tr>
                                <th className="text-left px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100">
                                  วันที่
                                </th>
                                <th className="text-center px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100">
                                  ประเภท
                                </th>
                                <th className="text-right px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100">
                                  จำนวน
                                </th>
                                <th className="text-right px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100">
                                  คงเหลือ
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {history.map((h) => (
                                <tr
                                  key={h.txn_id}
                                  className="border-t border-slate-100 hover:bg-slate-50/50"
                                >
                                  <td className="px-3 py-1.5 text-slate-700 font-medium whitespace-nowrap">
                                    {formatThaiDateMedium(h.transaction_date)}
                                  </td>
                                  <td className="px-3 py-1.5 text-center">
                                    {h.transaction_type === 'deposit' ? (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                                        <ArrowDownToLine className="w-2.5 h-2.5" /> ฝาก
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                                        <ArrowUpFromLine className="w-2.5 h-2.5" /> ถอน
                                      </span>
                                    )}
                                  </td>
                                  <td
                                    className={cn(
                                      'px-3 py-1.5 text-right tabular-nums font-extrabold',
                                      h.transaction_type === 'deposit'
                                        ? 'text-amber-700'
                                        : 'text-rose-700',
                                    )}
                                  >
                                    {h.transaction_type === 'deposit' ? '+' : '−'}
                                    {fmtBaht(Number(h.amount))}
                                  </td>
                                  <td className="px-3 py-1.5 text-right tabular-nums text-slate-700 font-semibold">
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
              </div>
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS (asymmetric zigzag, not equal cards) ──────────── */}
        <section className="bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 md:py-6">
            <div className="text-center mb-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-600 mb-1">
                How It Works
              </div>
              <h2 className="text-base md:text-lg font-bold tracking-tight text-slate-900">
                ขั้นตอนการใช้งาน
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {HOW_IT_WORKS.map((s) => {
                const IconComponent = s.icon;
                return (
                  <div
                    key={s.step}
                    className="relative bg-slate-50/70 rounded-xl p-3.5 border border-slate-100 hover:border-amber-400/30 hover:shadow-md hover:shadow-amber-500/5 hover:-translate-y-0.5 transition duration-300 flex flex-col items-center text-center md:items-start md:text-left group"
                  >
                    {/* Top row: Number and icon */}
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className="text-xl font-black tracking-tight text-amber-500/80 leading-none group-hover:text-amber-500 transition duration-300">
                        {s.step}
                      </div>
                      <div className="text-amber-500 bg-amber-500/10 p-1.5 rounded-lg group-hover:bg-amber-500/15 transition duration-300">
                        <IconComponent className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-xs font-bold text-slate-900">
                        {s.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 leading-normal font-normal">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const StatCard = ({
  label,
  value,
  unit,
  icon,
  accent,
  isFeatured,
  isDate,
}: {
  label: string;
  value: string;
  unit: string;
  icon?: React.ReactNode;
  accent: 'amber' | 'slate';
  isFeatured?: boolean;
  isDate?: boolean;
}) => {
  if (isFeatured) {
    return (
      <div className="col-span-2 md:col-span-1 bg-slate-900 rounded-xl p-3.5 md:p-4 shadow-md ring-1 ring-amber-500/20">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-400 mb-1.5">
          <span className="[&>svg]:w-4 [&>svg]:h-4">{icon}</span>
          {label}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold text-white tabular-nums tracking-tight">
            {value}
          </span>
          {unit && <span className="text-xs font-bold text-slate-400">{unit}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-3.5 md:p-4 ring-1 ring-slate-200 border-l-4 border-slate-900 hover:border-amber-500 hover:shadow-sm transition">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600 mb-1.5">
        <span className="[&>svg]:w-4 [&>svg]:h-4">{icon}</span>
        {label}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            'tabular-nums tracking-tight font-extrabold text-slate-900',
            isDate ? 'text-sm' : 'text-xl',
          )}
        >
          {value}
        </span>
        {unit && <span className="text-xs font-bold text-slate-600">{unit}</span>}
      </div>
    </div>
  );
};

const ClassChip = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={cn(
      'px-4 py-2 rounded-full text-sm font-bold transition active:translate-y-px',
      active
        ? 'bg-slate-900 text-white shadow-md'
        : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100',
    )}
  >
    {children}
  </button>
);
