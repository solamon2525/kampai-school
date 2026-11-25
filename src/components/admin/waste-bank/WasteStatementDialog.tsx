import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  Download,
  Printer,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { downloadCSV } from '@/lib/export';
import { formatThaiDateFull, formatThaiDateMedium } from '@/lib/thaiDate';
import {
  rewardClaimsService,
  termService,
  wasteTransactionsService,
  type RewardClaim,
  type RewardClaimStatus,
  type WasteStudentSummary,
  type WasteTransaction,
} from '@/services/waste-bank.service';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type WasteTxRow = WasteTransaction & {
  academic_year?: string | null;
  semester?: string | null;
};

type WasteClaimRow = RewardClaim & {
  quantity?: number | null;
};

interface StatementTimelineItem {
  id: string;
  kind: 'earn' | 'redeem';
  sortDateKey: string;
  sortTime: number;
  dateIso: string;
  timeText: string;
  title: string;
  detail: string;
  pointsDelta: number;
  virtuePointsUsed: number;
  status: RewardClaimStatus | null;
  actor: string;
  termLabel: string;
}

interface WasteStatementDialogProps {
  student: WasteStudentSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CLAIM_STATUS_LABEL: Record<RewardClaimStatus, string> = {
  pending: 'รออนุมัติ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ปฏิเสธ (คืนสิทธิ์)',
};

const formatBangkokTime = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Bangkok',
  })} น.`;
};

export const WasteStatementDialog = ({
  student,
  open,
  onOpenChange,
}: WasteStatementDialogProps) => {
  const studentId = student?.student_id ?? null;

  const statementQuery = useQuery({
    queryKey: ['waste-student-statement', student?.student_id],
    enabled: open && Boolean(studentId),
    queryFn: async () => {
      if (!student?.student_id) {
        return { transactions: [] as WasteTxRow[], claims: [] as WasteClaimRow[], activeTerm: null };
      }
      const [txRes, claimsRes, activeTerm] = await Promise.all([
        wasteTransactionsService.getByStudent(student.student_id),
        rewardClaimsService.listForStudent(student.student_id),
        termService.getActive(),
      ]);
      if (txRes.error) throw txRes.error;
      if (claimsRes.error) throw claimsRes.error;
      return {
        transactions: (txRes.data ?? []) as WasteTxRow[],
        claims: (claimsRes.data ?? []) as WasteClaimRow[],
        activeTerm,
      };
    },
  });

  const timeline = useMemo<StatementTimelineItem[]>(() => {
    const txs = statementQuery.data?.transactions ?? [];
    const claims = statementQuery.data?.claims ?? [];

    const txItems: StatementTimelineItem[] = txs.map((tx) => {
      const dateIso = tx.transaction_date || (tx.created_at ? tx.created_at.slice(0, 10) : '');
      const sortDateKey = dateIso.slice(0, 10);
      const sortTime = new Date(tx.created_at || tx.transaction_date || 0).getTime() || 0;
      const catIcon = tx.waste_categories?.icon || '♻️';
      const catName = tx.waste_categories?.name || 'รับฝากขยะ';
      const qtyPart = tx.quantity > 0 ? `${tx.quantity.toLocaleString('th-TH')} ชิ้น` : 'โบนัสพิเศษ';
      const detail = tx.notes ? `${qtyPart} · ${tx.notes}` : qtyPart;
      const termLabel =
        tx.academic_year && tx.semester ? `เทอม ${tx.semester}/${tx.academic_year}` : '—';

      return {
        id: `tx-${tx.id}`,
        kind: 'earn',
        sortDateKey,
        sortTime,
        dateIso,
        timeText: formatBangkokTime(tx.created_at),
        title: `${catIcon} ${catName}`,
        detail,
        pointsDelta: Number(tx.points_earned ?? 0),
        virtuePointsUsed: 0,
        status: null,
        actor: tx.recorded_by || '—',
        termLabel,
      };
    });

    const claimItems: StatementTimelineItem[] = claims.map((claim) => {
      const dateIso = claim.claimed_at || '';
      const sortDateKey = dateIso.slice(0, 10);
      const sortTime = new Date(claim.claimed_at || 0).getTime() || 0;
      const qty = Number(claim.quantity ?? 1);
      const qtySuffix = qty > 1 ? ` ×${qty}` : '';
      const wasteUsed = Number(claim.waste_points_used ?? claim.points_used ?? 0);
      const virtueUsed = Number(claim.virtue_points_used ?? 0);
      const detailParts: string[] = [];
      if (virtueUsed > 0) detailParts.push(`ใช้คะแนนความดี ${virtueUsed} คะแนน`);
      if (claim.rejection_reason) detailParts.push(`เหตุผล: ${claim.rejection_reason}`);
      const termLabel =
        claim.academic_year && claim.semester
          ? `เทอม ${claim.semester}/${claim.academic_year}`
          : '—';

      return {
        id: `claim-${claim.id}`,
        kind: 'redeem',
        sortDateKey,
        sortTime,
        dateIso,
        timeText: formatBangkokTime(claim.claimed_at),
        title: `🎁 แลก${claim.reward_name}${qtySuffix}`,
        detail: detailParts.join(' · ') || 'คำขอแลกของรางวัล',
        pointsDelta: claim.status === 'rejected' || wasteUsed === 0 ? 0 : -wasteUsed,
        virtuePointsUsed: virtueUsed,
        status: claim.status,
        actor: claim.reviewed_by || (claim.status === 'pending' ? 'รออนุมัติ' : '—'),
        termLabel,
      };
    });

    return [...txItems, ...claimItems].sort(
      (a, b) =>
        b.sortDateKey.localeCompare(a.sortDateKey) ||
        b.sortTime - a.sortTime ||
        b.dateIso.localeCompare(a.dateIso),
    );
  }, [statementQuery.data]);

  const carriedOver = Number(student?.carried_over_points ?? 0);
  const currentTermEarned = Number(student?.current_term_points_earned ?? 0);
  const currentTermSpent = Number(student?.current_term_points_spent ?? 0);
  const availablePoints = Number(student?.available_points ?? 0);
  const totalEarnedAll = Number(student?.total_points_earned ?? 0);
  const totalSpentAll = Number(student?.total_points_spent ?? 0);
  const activeTerm = statementQuery.data?.activeTerm;
  const printedDateText = formatThaiDateFull(new Date().toISOString());

  const handleExportCSV = () => {
    if (!student) return;
    downloadCSV(
      `waste-statement-${student.student_code || student.student_id || 'student'}.csv`,
      ['วันที่', 'เวลา', 'ประเภท', 'รายการ', 'รายละเอียด', 'ภาคเรียน', 'แต้ม (+/-)', 'สถานะ', 'ผู้บันทึก/ผู้อนุมัติ'],
      timeline.map((item) => [
        formatThaiDateMedium(item.dateIso),
        item.timeText,
        item.kind === 'earn' ? 'รับฝากขยะ' : 'แลกรางวัล',
        item.title,
        item.detail,
        item.termLabel,
        String(item.pointsDelta),
        item.status ? CLAIM_STATUS_LABEL[item.status] : 'บันทึกแล้ว',
        item.actor,
      ]),
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <style>{`
          @media print {
            @page { size: A4 portrait; margin: 12mm; }
            #root { display: none !important; }
            [data-radix-portal] > div:first-child { display: none !important; }
            [data-radix-portal] [role="dialog"] {
              display: block !important;
              position: static !important;
              inset: auto !important;
              transform: none !important;
              max-width: none !important;
              max-height: none !important;
              width: 100% !important;
              overflow: visible !important;
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
            }
            [data-radix-portal] [role="dialog"] > button {
              display: none !important;
            }
          }
        `}</style>
      )}
      <DialogContent
        className={cn(
          'flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-4xl flex-col overflow-hidden p-3 sm:p-6 print:block print:static print:max-h-none print:max-w-none print:w-full print:overflow-visible print:border-0 print:shadow-none print:p-0',
        )}
      >
        <DialogHeader className={cn('pr-7 text-left print:hidden')}>
          <DialogTitle>ใบสรุปยอดและประวัติธนาคารขยะรายบุคคล</DialogTitle>
          <DialogDescription>
            ตรวจสอบประวัติรับฝากขยะ การแลกรางวัล และพิมพ์เอกสารขนาด A4
          </DialogDescription>
        </DialogHeader>

        {/* Action Toolbar (hidden when printing) */}
        <div className={cn('print:hidden flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3')}>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => window.print()}
              disabled={!student || statementQuery.isLoading}
              className="gap-1.5"
            >
              <Printer className="w-4 h-4" />
              พิมพ์สรุป A4 / PDF
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={!student || statementQuery.isLoading}
              className="gap-1.5"
            >
              <Download className="w-4 h-4" />
              CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void statementQuery.refetch()}
              disabled={statementQuery.isFetching}
              className="gap-1.5"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', statementQuery.isFetching && 'animate-spin')} />
              รีเฟรช
            </Button>
          </div>
          <DialogClose asChild>
            <Button type="button" variant="ghost" size="sm">
              ปิดหน้าต่าง
            </Button>
          </DialogClose>
        </div>

        {/* Scrollable / Printable Sheet */}
        <div className={cn('min-h-0 flex-1 overflow-y-auto space-y-5 pr-0.5 print:overflow-visible print:p-0')}>
          {!student ? (
            <p className="text-center py-8 text-sm text-muted-foreground">ไม่พบข้อมูลนักเรียน</p>
          ) : (
            <article className="space-y-4 print:p-0">
              {/* Official School Letterhead */}
              <header className="text-center border-b border-border pb-3 space-y-1">
                <p className="text-sm font-bold text-foreground">
                  โรงเรียนบ้านคำไผ่ สพป.อุดรธานี เขต 2
                </p>
                <h2 className="text-lg font-extrabold text-foreground">
                  ใบรายงานสรุปยอดแต้มและประวัติธนาคารขยะรายบุคคล
                </h2>
                <p className="text-xs text-muted-foreground">
                  {activeTerm ? `ภาคเรียนที่ ${activeTerm.sem}/${activeTerm.year} · ` : ''}
                  ออกรายงาน ณ วันที่ {printedDateText}
                </p>
              </header>

              {/* Student Profile Box */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <PersonAvatar
                    name={student.full_name ?? '?'}
                    photoUrl={student.photo_url}
                    size="md"
                    className="aspect-square shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-extrabold text-base text-foreground truncate">
                      {student.full_name ?? 'ไม่ระบุชื่อ'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ชั้น {student.class_name ?? '—'} · รหัสนักเรียน {student.student_code ?? '—'}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5 tabular-nums">
                  <p>
                    ส่งขยะรวม <strong className="text-foreground">{Number(student.total_transactions ?? 0).toLocaleString('th-TH')}</strong> ครั้ง ·{' '}
                    <strong className="text-foreground">{Number(student.total_items ?? 0).toLocaleString('th-TH')}</strong> ชิ้น
                  </p>
                  <p>
                    แต้มสะสมทั้งหมด <strong className="text-foreground">{totalEarnedAll.toLocaleString('th-TH')}</strong> แต้ม
                  </p>
                </div>
              </div>

              {/* 4 KPI Tiles */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-xs text-muted-foreground font-medium">ยกยอดจากเทอมก่อน</p>
                  <p className="text-lg font-extrabold text-foreground tabular-nums mt-0.5">
                    {carriedOver.toLocaleString('th-TH')}{' '}
                    <span className="text-xs font-normal text-muted-foreground">แต้ม</span>
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                  <p className="text-xs text-emerald-800 font-medium">ได้เทอมนี้</p>
                  <p className="text-lg font-extrabold text-emerald-700 tabular-nums mt-0.5">
                    +{currentTermEarned.toLocaleString('th-TH')}{' '}
                    <span className="text-xs font-normal text-emerald-700">แต้ม</span>
                  </p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
                  <p className="text-xs text-amber-800 font-medium">ใช้แลกแล้ว</p>
                  <p className="text-lg font-extrabold text-amber-700 tabular-nums mt-0.5">
                    {currentTermSpent.toLocaleString('th-TH')}{' '}
                    <span className="text-xs font-normal text-amber-700">แต้ม</span>
                  </p>
                  {totalSpentAll !== currentTermSpent && (
                    <p className="text-[10px] text-muted-foreground tabular-nums">
                      รวมทุกเทอม {totalSpentAll.toLocaleString('th-TH')} แต้ม
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
                  <p className="text-xs text-primary font-semibold">คงเหลือพร้อมแลก</p>
                  <p className="text-lg font-extrabold text-primary tabular-nums mt-0.5">
                    {availablePoints.toLocaleString('th-TH')}{' '}
                    <span className="text-xs font-normal text-primary/80">แต้ม</span>
                  </p>
                </div>
              </div>

              {/* Loading / Error / Timeline */}
              {statementQuery.isLoading ? (
                <div className="py-10 text-center text-muted-foreground space-y-2">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary" />
                  <p className="text-sm">กำลังโหลดประวัติการส่งขยะและการแลกรางวัล...</p>
                </div>
              ) : statementQuery.isError ? (
                <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-destructive">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>โหลดประวัติรายการไม่สำเร็จ</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {statementQuery.error instanceof Error
                      ? statementQuery.error.message
                      : 'กรุณาลองใหม่อีกครั้ง'}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void statementQuery.refetch()}
                  >
                    ลองใหม่
                  </Button>
                </div>
              ) : timeline.length === 0 ? (
                <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
                  ยังไม่มีประวัติการฝากขยะหรือแลกรางวัล
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      ประวัติรายการทั้งหมด ({timeline.length.toLocaleString('th-TH')} รายการ)
                    </span>
                    <span>เรียงจากรายการล่าสุด</span>
                  </div>

                  {/* Mobile Cards (< md, hidden on print) */}
                  <div className="md:hidden print:hidden space-y-2.5">
                    {timeline.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-border bg-card p-3 space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground break-words">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {formatThaiDateMedium(item.dateIso)}
                              {item.timeText ? ` · ${item.timeText}` : ''} · {item.termLabel}
                            </p>
                          </div>
                          <span
                            className={cn(
                              'text-sm font-extrabold tabular-nums shrink-0',
                              item.kind === 'earn'
                                ? 'text-emerald-700'
                                : item.status === 'rejected'
                                  ? 'text-muted-foreground line-through'
                                  : 'text-rose-700',
                            )}
                          >
                            {item.pointsDelta > 0 ? `+${item.pointsDelta}` : item.pointsDelta}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground break-words">{item.detail}</p>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                          <span>ผู้บันทึก/อนุมัติ: {item.actor}</span>
                          {item.status && (
                            <Badge variant="outline" className="text-[10px]">
                              {CLAIM_STATUS_LABEL[item.status]}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop & Print Table */}
                  <div className="hidden md:block print:block overflow-x-auto print:overflow-visible rounded-xl border border-border print:rounded-none">
                    <table className="w-full text-xs border-collapse">
                      <thead className="bg-muted/40 border-b border-border">
                        <tr>
                          <th className="p-2.5 text-left font-bold text-muted-foreground">วันที่ / เวลา</th>
                          <th className="p-2.5 text-left font-bold text-muted-foreground">รายการ</th>
                          <th className="p-2.5 text-left font-bold text-muted-foreground">ภาคเรียน</th>
                          <th className="p-2.5 text-right font-bold text-muted-foreground">แต้ม (+/-)</th>
                          <th className="p-2.5 text-left font-bold text-muted-foreground">ผู้บันทึก / สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/70">
                        {timeline.map((item) => (
                          <tr key={item.id} className="break-inside-avoid">
                            <td className="p-2.5 whitespace-nowrap align-top">
                              <div className="font-medium text-foreground">
                                {formatThaiDateMedium(item.dateIso)}
                              </div>
                              {item.timeText && (
                                <div className="text-[10px] text-muted-foreground">{item.timeText}</div>
                              )}
                            </td>
                            <td className="p-2.5 align-top">
                              <div className="font-semibold text-foreground">{item.title}</div>
                              <div className="text-[11px] text-muted-foreground break-words">
                                {item.detail}
                              </div>
                            </td>
                            <td className="p-2.5 whitespace-nowrap align-top text-muted-foreground">
                              {item.termLabel}
                            </td>
                            <td
                              className={cn(
                                'p-2.5 text-right font-extrabold tabular-nums whitespace-nowrap align-top',
                                item.kind === 'earn'
                                  ? 'text-emerald-700'
                                  : item.status === 'rejected'
                                    ? 'text-muted-foreground line-through'
                                    : 'text-rose-700',
                              )}
                            >
                              {item.pointsDelta > 0 ? `+${item.pointsDelta}` : item.pointsDelta}
                            </td>
                            <td className="p-2.5 align-top">
                              <div className="text-foreground">{item.actor}</div>
                              {item.status && (
                                <Badge variant="outline" className="text-[10px] mt-0.5">
                                  {CLAIM_STATUS_LABEL[item.status]}
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* A4 Official Signature Footer (visible on print) */}
              <footer className="hidden print:grid grid-cols-2 gap-10 pt-10 text-xs text-foreground">
                <div className="text-center space-y-1">
                  <div className="pt-8 border-b border-border w-56 mx-auto" />
                  <p className="pt-1 font-medium">ผู้จัดทำรายงาน</p>
                  <p className="text-muted-foreground">(ครูผู้รับผิดชอบธนาคารขยะ)</p>
                </div>
                <div className="text-center space-y-1">
                  <div className="pt-8 border-b border-border w-56 mx-auto" />
                  <p className="pt-1 font-medium">ผู้รับรอง</p>
                  <p className="text-muted-foreground">(ผู้อำนวยการโรงเรียนบ้านคำไผ่)</p>
                </div>
              </footer>
            </article>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
