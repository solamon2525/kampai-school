import { useEffect, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Users2, Wallet } from 'lucide-react';
import { savingsRecorderService, type SavingsRecorderSummary } from '@/services/savings.service';
import { KpiRibbon, type KpiTile } from '@/components/admin/docs-hub/KpiRibbon';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

const fmtBaht = (n: number) =>
  n.toLocaleString('th-TH', { maximumFractionDigits: 0 }) + ' ฿';

export const TeacherSummaryTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SavingsRecorderSummary[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await savingsRecorderService.getSummary();
      if (error) {
        toast({ title: 'โหลดข้อมูลไม่สำเร็จ', variant: 'destructive' });
      } else {
        setRows(data ?? []);
      }
      setLoading(false);
    })();
  }, [toast]);

  const totals = rows.reduce(
    (acc, r) => ({
      teachers: acc.teachers + 1,
      deposits: acc.deposits + r.deposit_count,
      withdrawals: acc.withdrawals + r.withdraw_count,
      amount: acc.amount + r.total_deposits + r.total_withdrawals,
    }),
    { teachers: 0, deposits: 0, withdrawals: 0, amount: 0 },
  );

  const tiles: KpiTile[] = [
    {
      key: 'teachers',
      label: 'ครูผู้บันทึก',
      value: totals.teachers,
      icon: Users2,
      tone: 'primary',
    },
    {
      key: 'deposits',
      label: 'รายการฝากรวม',
      value: totals.deposits.toLocaleString('th-TH'),
      icon: ArrowDownToLine,
      tone: 'success',
    },
    {
      key: 'withdrawals',
      label: 'รายการถอนรวม',
      value: totals.withdrawals.toLocaleString('th-TH'),
      icon: ArrowUpFromLine,
      tone: 'warning',
    },
    {
      key: 'amount',
      label: 'ยอดรวมที่ประมวล',
      value: fmtBaht(totals.amount),
      icon: Wallet,
      tone: 'info',
    },
  ];

  return (
    <div className="space-y-5">
      <KpiRibbon tiles={tiles} loading={loading} className="lg:grid-cols-4" />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">สรุปการบันทึกธุรกรรมรายครู</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-center py-12 text-muted-foreground text-sm">กำลังโหลด…</p>
          ) : rows.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground text-sm">
              ยังไม่มีรายการที่บันทึกโดยครู
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8 text-center">#</TableHead>
                    <TableHead>ครูผู้บันทึก</TableHead>
                    <TableHead className="text-right">ครั้งฝาก</TableHead>
                    <TableHead className="text-right">ยอดฝากรวม</TableHead>
                    <TableHead className="text-right">ครั้งถอน</TableHead>
                    <TableHead className="text-right">ยอดถอนรวม</TableHead>
                    <TableHead className="text-right">รวมทั้งหมด</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, idx) => {
                    const totalTxn = r.deposit_count + r.withdraw_count;
                    const totalAmount = r.total_deposits + r.total_withdrawals;
                    return (
                      <TableRow key={r.recorded_by_staff_id ?? r.recorder_name}>
                        <TableCell className="text-center text-muted-foreground text-xs">
                          {idx + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <PersonAvatar
                              name={r.recorder_name}
                              photoUrl={r.photo_url}
                              size="sm"
                            />
                            <span className="font-medium text-sm">{r.recorder_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {r.deposit_count.toLocaleString('th-TH')}
                        </TableCell>
                        <TableCell className="text-right text-sm text-emerald-700 font-medium">
                          {fmtBaht(r.total_deposits)}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {r.withdraw_count.toLocaleString('th-TH')}
                        </TableCell>
                        <TableCell className="text-right text-sm text-rose-600 font-medium">
                          {fmtBaht(r.total_withdrawals)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className="font-semibold tabular-nums">
                            {totalTxn.toLocaleString('th-TH')} ครั้ง · {fmtBaht(totalAmount)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
