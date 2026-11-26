import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  HeartHandshake,
  PiggyBank,
  Recycle,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { rewardClaimsService } from '@/services/waste-bank.service';
import { savingsSummaryService } from '@/services/savings.service';

interface StudentThreeBanksCardProps {
  studentCode: string;
  className?: string;
}

export const StudentThreeBanksCard = ({
  studentCode,
  className,
}: StudentThreeBanksCardProps) => {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['student-three-banks', studentCode],
    enabled: Boolean(studentCode.trim()),
    queryFn: async () => {
      const [pointsRes, savingsRes] = await Promise.all([
        rewardClaimsService.lookupStudent(studentCode),
        savingsSummaryService.getForStudentCode(studentCode),
      ]);
      if (pointsRes.error) throw pointsRes.error;
      if (savingsRes.error) throw savingsRes.error;

      const pointsRow = (pointsRes.data ?? [])[0] ?? null;
      const savingsData = savingsRes.data;

      return {
        wastePoints: Number(pointsRow?.waste_points_available ?? 0),
        virtuePoints: Number(pointsRow?.virtue_points_available ?? 0),
        savingsBalance: Number(savingsData?.current_balance ?? 0),
        activeGoal: savingsData?.activeGoal ?? null,
      };
    },
    staleTime: 30_000,
  });

  if (isPending) {
    return (
      <Card className={cn('border-border bg-card', className)}>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className={cn('border-border bg-card', className)}>
        <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              กระเป๋า 3 ธนาคารของฉัน
            </h3>
            <p className="text-sm text-destructive" role="alert">
              โหลดข้อมูลยอดธนาคารไม่สำเร็จในขณะนี้
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
            <RefreshCw className="w-4 h-4 mr-1.5" />
            ลองใหม่
          </Button>
        </CardContent>
      </Card>
    );
  }

  const wastePoints = data?.wastePoints ?? 0;
  const virtuePoints = data?.virtuePoints ?? 0;
  const savingsBalance = data?.savingsBalance ?? 0;
  const activeGoal = data?.activeGoal ?? null;
  const targetAmount = Number(activeGoal?.target_amount ?? 0);
  const goalPercent =
    activeGoal && targetAmount > 0
      ? Math.min(100, Math.round((savingsBalance / targetAmount) * 100))
      : 0;

  return (
    <Card className={cn('border-border bg-card', className)}>
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary shrink-0" />
            <h3 className="text-lg font-bold text-foreground">กระเป๋า 3 ธนาคารของฉัน</h3>
          </div>
          <p className="text-xs text-muted-foreground">แตะที่การ์ดเพื่อเปิดดูแต่ละธนาคาร</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link
            to="/waste-bank"
            className={cn(
              'group flex flex-col justify-between gap-3 rounded-xl border p-4 transition',
              'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60 hover:bg-emerald-500/10 hover:shadow-sm',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="p-2 rounded-lg bg-emerald-500/15 text-emerald-700 shrink-0">
                  <Recycle className="w-4 h-4" />
                </span>
                <span className="text-sm font-bold text-foreground truncate">ธนาคารขยะ</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>

            <div className="min-w-0">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tabular-nums leading-tight break-words">
                {wastePoints.toLocaleString()}
              </div>
              <div className="text-xs font-semibold text-muted-foreground mt-0.5">
                แต้มพร้อมแลก
              </div>
            </div>

            <div className="text-xs font-medium text-emerald-800">ดูรางวัลและประวัติสะสมขยะ</div>
          </Link>

          <Link
            to={`/virtue-bank/${studentCode}`}
            className={cn(
              'group flex flex-col justify-between gap-3 rounded-xl border p-4 transition',
              'border-sky-500/30 bg-sky-500/5 hover:border-sky-500/60 hover:bg-sky-500/10 hover:shadow-sm',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="p-2 rounded-lg bg-sky-500/15 text-sky-700 shrink-0">
                  <HeartHandshake className="w-4 h-4" />
                </span>
                <span className="text-sm font-bold text-foreground truncate">ธนาคารความดี</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>

            <div className="min-w-0">
              <div className="text-2xl sm:text-3xl font-extrabold text-sky-700 tabular-nums leading-tight break-words">
                {virtuePoints.toLocaleString()}
              </div>
              <div className="text-xs font-semibold text-muted-foreground mt-0.5">
                คะแนนพร้อมแลก
              </div>
            </div>

            <div className="text-xs font-medium text-sky-800">ดูความดีและแลกคูปองสิทธิ์พิเศษ</div>
          </Link>

          <Link
            to="/savings-bank"
            className={cn(
              'group flex flex-col justify-between gap-3 rounded-xl border p-4 transition',
              'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60 hover:bg-amber-500/10 hover:shadow-sm',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="p-2 rounded-lg bg-amber-500/15 text-amber-700 shrink-0">
                  <PiggyBank className="w-4 h-4" />
                </span>
                <span className="text-sm font-bold text-foreground truncate">ธนาคารพอเพียง</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>

            <div className="min-w-0">
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 tabular-nums leading-tight break-words">
                {savingsBalance.toLocaleString('th-TH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                บาท
              </div>

              {activeGoal ? (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-foreground truncate">
                      เป้าหมาย: {activeGoal.title}
                    </span>
                    <span className="font-bold text-amber-800 tabular-nums shrink-0">
                      {goalPercent}%
                    </span>
                  </div>
                  <Progress value={goalPercent} className="h-2" />
                </div>
              ) : (
                <div className="text-xs font-medium text-amber-800 mt-1">
                  ตั้งเป้าหมายออมเงินใหม่ที่ธนาคารพอเพียง
                </div>
              )}
            </div>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
