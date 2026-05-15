import { useEffect, useState } from 'react';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, History, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { NoDataIllustration } from '@/components/ui/empty-illustrations';
import { savingsSummaryService, savingsTransactionsService } from '@/services';
import type {
  SavingsStudentSummary,
  SavingsTransaction,
} from '@/services/savings.service';

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

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'ภาพรวม', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'history', label: 'ประวัติธุรกรรม', icon: <History className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <Card className="bg-gradient-to-br from-amber-500/15 via-amber-500/10 to-emerald-500/15 border-amber-500/30">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 text-sm font-semibold">
            <Wallet className="w-4 h-4" /> ยอดเงินสะสมของ {studentName ?? summary?.full_name ?? 'นักเรียน'}
          </div>
          <div className="text-center py-2">
            <div className="text-4xl md:text-5xl font-bold text-amber-900 dark:text-amber-200 tabular-nums">
              {fmtBaht(balance)}
            </div>
            <div className="text-xs text-amber-800 dark:text-amber-300 mt-1 font-medium">ยอดคงเหลือปัจจุบัน</div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-amber-500/20">
            <Stat
              label="ฝากสะสม"
              value={fmtBaht(deposits)}
              icon={<ArrowDownToLine className="w-3.5 h-3.5" />}
              color="text-emerald-900 dark:text-emerald-300"
            />
            <Stat
              label="ถอนสะสม"
              value={fmtBaht(withdrawals)}
              icon={<ArrowUpFromLine className="w-3.5 h-3.5" />}
              color="text-orange-900 dark:text-orange-300"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">เกี่ยวกับธนาคารพอเพียง</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>ธนาคารพอเพียงคือระบบฝากเงินสำหรับนักเรียน — สอนวินัยการออมตามหลักปรัชญาเศรษฐกิจพอเพียง</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>ฝากเงินกับครูที่โรงเรียน — จำนวนใดก็ได้</li>
              <li>ถอนเงินผ่านครู เมื่อจำเป็น</li>
              <li>ดูยอดและประวัติได้ตลอดเวลา</li>
            </ul>
          </CardContent>
        </Card>
      )}

      {tab === 'history' && (
        <Card>
          <CardContent className="p-0">
            {transactions.length === 0 ? (
              <div className="py-10">
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
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">วันที่</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">ประเภท</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">จำนวน</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">คงเหลือ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id} className="border-b border-border">
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {t.transaction_date}
                        </td>
                        <td className="px-4 py-3">
                          {t.transaction_type === 'deposit' ? (
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
                          className={`px-4 py-3 text-right font-semibold tabular-nums ${
                            t.transaction_type === 'deposit'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-orange-700 dark:text-orange-400'
                          }`}
                        >
                          {t.transaction_type === 'deposit' ? '+' : '−'}
                          {fmtBaht(Number(t.amount))}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {fmtBaht(Number(t.balance_after))}
                        </td>
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
  );
};

const Stat = ({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  color: string;
}) => (
  <div className="text-center">
    <div className={`text-lg font-bold tabular-nums ${color} flex items-center justify-center gap-1`}>
      {icon}
      {value}
    </div>
    <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
  </div>
);
