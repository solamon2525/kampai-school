import { useMemo } from 'react';
import {
  Wallet,
  PiggyBank,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowDownToLine,
  ArrowUpFromLine,
  Award,
} from 'lucide-react';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { SaverTierBadge } from './SaverTierBadge';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatThaiDateMedium } from '@/lib/thaiDate';
import type { StudentSavingsLookup, SavingsHistoryRow } from '@/services/savings.service';

interface Props {
  student: StudentSavingsLookup;
  history: SavingsHistoryRow[];
  studentDepositCount: number | null;
}

const fmtBaht = (n: number | null | undefined) => {
  if (n == null) return '0.00 ฿';
  return `${Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿`;
};

export const DigitalPassbook = ({ student, history, studentDepositCount }: Props) => {
  const currentBalance = Number(student.current_balance ?? 0);

  // Take recent 6 transactions for passbook page
  const displayHistory = useMemo(() => {
    return history.slice(0, 8);
  }, [history]);

  return (
    <div className="rounded-3xl border-2 border-amber-300/60 bg-gradient-to-b from-amber-500/10 via-card to-card p-4 sm:p-6 md:p-8 shadow-xl relative overflow-hidden space-y-6">
      {/* Passbook Ribbon & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-600 flex items-center justify-center text-2xl shadow-xs">
            🏦
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-300">
                สมุดคู่ฝากดิจิทัล
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                ธนาคารพอเพียง
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-black text-foreground tracking-tight">
              โรงเรียนบ้านคำไผ่ สพป.ยโสธร เขต 2
            </h3>
          </div>
        </div>

        {/* Account ID / Code */}
        <div className="text-right">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            เลขที่บัญชีเงินฝาก
          </span>
          <span className="text-base font-black text-foreground tracking-widest font-mono">
            {student.student_code || 'KP-0000'}
          </span>
        </div>
      </div>

      {/* Account Owner Card */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="relative">
            <PersonAvatar
              name={student.full_name}
              photoUrl={student.photo_url}
              size="lg"
            />
            <div className="absolute -bottom-1 -right-1">
              <SaverTierBadge depositCount={studentDepositCount} size="sm" />
            </div>
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-black text-foreground">
              {student.full_name}
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              ชั้น {student.class_name ?? '—'} · ฝากสะสม {studentDepositCount ?? 0} ครั้ง
            </p>
          </div>
        </div>

        {/* Current Balance Display */}
        <div className="w-full sm:w-auto bg-amber-500/15 border border-amber-300/60 rounded-xl px-5 py-3 text-center sm:text-right shadow-inner">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
            ยอดเงินคงเหลือปัจจุบัน
          </span>
          <span className="text-2xl sm:text-3xl font-black text-amber-700 tabular-nums tracking-tight">
            {fmtBaht(currentBalance)}
          </span>
        </div>
      </div>

      {/* Passbook Lines (Simulated Bank Statement Rows) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            รายการในสมุดคู่ฝากล่าสุด
          </h5>
          <span className="text-[11px] text-muted-foreground">
            มีตราประทับรับรองการฝาก
          </span>
        </div>

        {displayHistory.length === 0 ? (
          <div className="p-8 text-center bg-muted/20 border border-dashed border-border rounded-2xl">
            <PiggyBank className="w-8 h-8 mx-auto text-muted-foreground mb-2 opacity-50" />
            <p className="text-xs font-semibold text-muted-foreground">ยังไม่มีรายการบันทึกในสมุดคู่ฝาก</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-xs">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 border-b border-border text-[11px] font-bold text-muted-foreground">
                <tr>
                  <th className="px-3.5 py-2.5 text-left w-28">วันที่</th>
                  <th className="px-3.5 py-2.5 text-center w-20">ประเภท</th>
                  <th className="px-3.5 py-2.5 text-right w-28">จำนวนเงิน</th>
                  <th className="px-3.5 py-2.5 text-right w-32">ยอดคงเหลือ</th>
                  <th className="px-3.5 py-2.5 text-center w-36">ตราประทับ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono text-xs">
                {displayHistory.map((h, i) => {
                  const isDeposit = h.transaction_type === 'deposit';
                  return (
                    <tr key={i} className="hover:bg-muted/15 transition-colors">
                      <td className="px-3.5 py-2.5 text-foreground font-medium font-sans">
                        {formatThaiDateMedium(h.transaction_date)}
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        {isDeposit ? (
                          <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 border-amber-300 font-sans">
                            <ArrowDownToLine className="w-3 h-3 mr-0.5" /> ฝาก
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/30 font-sans">
                            <ArrowUpFromLine className="w-3 h-3 mr-0.5" /> ถอน
                          </Badge>
                        )}
                      </td>
                      <td className={cn(
                        "px-3.5 py-2.5 text-right font-bold tabular-nums",
                        isDeposit ? "text-amber-700" : "text-destructive"
                      )}>
                        {isDeposit ? `+${fmtBaht(h.amount)}` : `-${fmtBaht(h.amount)}`}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-foreground tabular-nums">
                        {fmtBaht(h.balance_after)}
                      </td>
                      <td className="px-3.5 py-2 text-center">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-[10px] font-sans font-bold shadow-2xs">
                          <CheckCircle2 className="w-3 h-3 text-primary" />
                          <span>รับฝากแล้ว</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Passbook Footer Seal */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground pt-3 border-t border-border/60">
        <div className="flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>วินัยการออมเพื่อความพอเพียง เป็นรากฐานสู่ความมั่นคง</span>
        </div>
        <div className="font-semibold text-foreground">
          ธนาคารโรงเรียนบ้านคำไผ่
        </div>
      </div>
    </div>
  );
};
