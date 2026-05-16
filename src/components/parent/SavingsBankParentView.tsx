import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, History, Sparkles, QrCode } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { NoDataIllustration } from '@/components/ui/empty-illustrations';
import { cn } from '@/lib/utils';
import { savingsSummaryService, savingsTransactionsService } from '@/services';
import type {
  SavingsStudentSummary,
  SavingsTransaction,
} from '@/services/savings.service';
import { SaverTierBadge } from '@/components/savings/SaverTierBadge';
import { PersonAvatar } from '@/components/shared/PersonAvatar';

interface Props {
  studentId: string;
  studentName?: string | null;
}

type TabId = 'overview' | 'history';

const fmtBaht = (n: number | null | undefined) => {
  if (n == null) return '0.00 ฿';
  return `${Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿`;
};

export const SavingsBankParentView = ({ studentId, studentName }: Props) => {
  const [tab, setTab] = useState<TabId>('overview');
  const [summary, setSummary] = useState<SavingsStudentSummary | null>(null);
  const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);

  useEffect(() => {
    (async () => {
      const [s, t] = await Promise.all([
        savingsSummaryService.getForStudent(studentId),
        savingsTransactionsService.getByStudent(studentId),
      ]);
      if (s.data) setSummary(s.data as unknown as SavingsStudentSummary);
      if (t.data) setTransactions(t.data as unknown as SavingsTransaction[]);
    })();
  }, [studentId]);

  const balance = Number(summary?.current_balance ?? 0);
  const deposits = Number(summary?.total_deposits ?? 0);
  const withdrawals = Number(summary?.total_withdrawals ?? 0);
  const depositCount = Number(summary?.deposit_count ?? 0);

  return (
    <div className="space-y-6">
      {/* ─── HERO — Premium dark slate + gold ─────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 p-6 md:p-8 shadow-xl ring-1 ring-amber-500/20">
        {/* Subtle pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <PersonAvatar
                name={studentName ?? summary?.full_name ?? 'นักเรียน'}
                photoUrl={summary?.photo_url}
                size="lg"
                className="ring-2 ring-amber-400/40"
              />
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.15em] text-amber-400 mb-1">
                  ยอดเงินสะสมของ
                </div>
                <div className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  {studentName ?? summary?.full_name ?? 'นักเรียน'}
                </div>
              </div>
            </div>
            <SaverTierBadge depositCount={depositCount} size="lg" />
          </div>

          {/* Balance — massive */}
          <div className="py-4">
            <div className="text-5xl md:text-6xl font-extrabold text-amber-400 tabular-nums tracking-tight leading-none">
              {fmtBaht(balance)}
            </div>
            <div className="text-xs md:text-sm font-semibold text-amber-200/80 uppercase tracking-wider mt-2">
              ยอดคงเหลือปัจจุบัน
            </div>
          </div>

          {/* Sub stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 mt-4 border-t border-amber-500/20">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 mb-1">
                <ArrowDownToLine className="w-3.5 h-3.5" />
                ฝากสะสม
              </div>
              <div className="text-lg md:text-xl font-extrabold text-white tabular-nums">
                {fmtBaht(deposits)}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-300 mb-1">
                <ArrowUpFromLine className="w-3.5 h-3.5" />
                ถอนสะสม
              </div>
              <div className="text-lg md:text-xl font-extrabold text-white tabular-nums">
                {fmtBaht(withdrawals)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── QR Card สำหรับให้ครูสแกน ───────────────────────────────── */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-50 to-amber-50/40 p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="bg-white p-3 rounded-lg ring-1 ring-amber-200 self-center md:self-auto flex-shrink-0">
            <QRCode value={`kampai-student:${studentId}`} size={120} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm mb-1">
              <QrCode className="w-4 h-4" />
              QR สำหรับฝาก/ถอนเงิน
            </div>
            <p className="text-xs md:text-sm text-foreground/75 leading-relaxed">
              ให้ครูสแกนเพื่อบันทึกการฝาก/ถอนเงิน
              <br />
              <span className="text-amber-800 font-semibold">QR ใบเดียวใช้ได้กับธนาคารขยะด้วย</span> —
              ไม่ต้องพิมพ์แยก
            </p>
          </div>
        </div>
      </div>

      {/* ─── Tabs (pill) ────────────────────────────────────────────── */}
      <div className="inline-flex p-1 bg-slate-100 rounded-xl">
        <PillTab
          active={tab === 'overview'}
          onClick={() => setTab('overview')}
          icon={<Sparkles className="w-4 h-4" />}
        >
          ภาพรวม
        </PillTab>
        <PillTab
          active={tab === 'history'}
          onClick={() => setTab('history')}
          icon={<History className="w-4 h-4" />}
        >
          ประวัติธุรกรรม
        </PillTab>
      </div>

      {tab === 'overview' && (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-6 space-y-4">
          <h3 className="text-lg font-extrabold text-slate-900">เกี่ยวกับธนาคารพอเพียง</h3>
          <p className="text-slate-700 font-medium leading-relaxed">
            ธนาคารพอเพียงคือระบบฝากเงินสำหรับนักเรียน — สอนวินัยการออมตามหลักปรัชญาเศรษฐกิจพอเพียง
          </p>
          <ul className="space-y-2 text-slate-700 font-medium">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-amber-950 text-xs font-extrabold flex items-center justify-center">
                1
              </span>
              ฝากเงินกับครูที่โรงเรียน — จำนวนใดก็ได้
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-amber-950 text-xs font-extrabold flex items-center justify-center">
                2
              </span>
              ถอนเงินผ่านครู เมื่อจำเป็น
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-amber-950 text-xs font-extrabold flex items-center justify-center">
                3
              </span>
              ดูยอดและประวัติได้ตลอดเวลา
            </li>
          </ul>
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
          {transactions.length === 0 ? (
            <div className="py-12">
              <EmptyState
                variant="inline"
                illustration={<NoDataIllustration />}
                title="ยังไม่มีประวัติ"
                description="ยังไม่มีรายการฝาก/ถอน"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                      วันที่
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                      ประเภท
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                      จำนวน
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                      คงเหลือ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t, idx) => (
                    <tr
                      key={t.id}
                      className={cn('border-t border-slate-100', idx % 2 === 1 && 'bg-slate-50/40')}
                    >
                      <td className="px-4 py-3 text-slate-700 font-medium whitespace-nowrap">
                        {t.transaction_date}
                      </td>
                      <td className="px-4 py-3">
                        {t.transaction_type === 'deposit' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-amber-950 text-xs font-bold shadow-sm">
                            <ArrowDownToLine className="w-3 h-3" /> ฝาก
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500 text-white text-xs font-bold shadow-sm">
                            <ArrowUpFromLine className="w-3 h-3" /> ถอน
                          </span>
                        )}
                      </td>
                      <td
                        className={cn(
                          'px-4 py-3 text-right tabular-nums font-extrabold',
                          t.transaction_type === 'deposit' ? 'text-amber-700' : 'text-rose-700',
                        )}
                      >
                        {t.transaction_type === 'deposit' ? '+' : '−'}
                        {fmtBaht(Number(t.amount))}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700 font-semibold">
                        {fmtBaht(Number(t.balance_after))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PillTab = ({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={cn(
      'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition active:translate-y-px',
      active ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900',
    )}
  >
    {icon}
    {children}
  </button>
);
