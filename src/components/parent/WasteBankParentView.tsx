import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import QRCode from 'react-qr-code';
import {
  Recycle,
  QrCode,
  Gift,
  History,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { NoDataIllustration } from '@/components/ui/empty-illustrations';
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { useActiveChild } from '@/hooks/useActiveChild';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { RewardCostDisplay } from '@/components/rewards/RewardCostDisplay';
import { canAffordDualWalletReward } from '@/lib/wasteBankHelpers';
import { cn } from '@/lib/utils';
import {
  wasteSummaryService,
  wasteTransactionsService,
  rewardsService,
  rewardClaimsService,
  wasteCategoriesService,
} from '@/services/waste-bank.service';
import type {
  WasteStudentSummary,
  WasteTransaction,
  Reward,
  RewardClaim,
  WasteCategory,
  StudentBalanceLookup,
} from '@/services/waste-bank.service';
import { formatThaiDateFull } from '@/lib/thaiDate';

interface Props {
  studentId: string;
  studentName?: string | null;
}

type TabId = 'overview' | 'rewards' | 'history' | 'claims';

type ParentRewardClaim = Omit<RewardClaim, 'rewards'> & {
  rewards?: { image_url: string | null } | null;
};

const CLAIM_ERROR_MAP: Record<string, string> = {
  STUDENT_NOT_FOUND: 'ไม่พบข้อมูลรหัสนักเรียนในระบบ กรุณาติดต่อคุณครูประจำชั้น',
  REWARD_UNAVAILABLE: 'รางวัลนี้ปิดให้บริการชั่วคราว',
  INSUFFICIENT_POINTS: 'แต้มไม่เพียงพอสำหรับแลกรางวัลนี้',
  INSUFFICIENT_WASTE_POINTS: 'แต้มธนาคารขยะไม่เพียงพอสำหรับแลกรางวัลนี้',
  INSUFFICIENT_VIRTUE_POINTS: 'คะแนนความดีพร้อมแลกไม่เพียงพอสำหรับแลกรางวัลนี้',
  OUT_OF_STOCK: 'ของรางวัลหมดสต็อกแล้ว',
  INVALID_QUANTITY: 'จำนวนที่ต้องการแลกไม่ถูกต้อง',
};

function mapClaimError(message: string | undefined): string {
  if (!message) return 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
  for (const key of Object.keys(CLAIM_ERROR_MAP)) {
    if (message.includes(key)) return CLAIM_ERROR_MAP[key];
  }
  return message;
}

export const WasteBankParentView = ({ studentId, studentName }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { activeChild } = useActiveChild();
  const [tab, setTab] = useState<TabId>('overview');
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimTarget, setClaimTarget] = useState<Reward | null>(null);

  const query = useQuery({
    queryKey: ['waste-bank', 'parent', studentId],
    queryFn: async () => {
      const [s, t, r, c, cats] = await Promise.all([
        wasteSummaryService.getForStudent(studentId),
        wasteTransactionsService.getByStudent(studentId),
        rewardsService.getActive(),
        rewardClaimsService.listForStudent(studentId),
        wasteCategoriesService.getActive(),
      ]);
      return {
        summary: (s.data as WasteStudentSummary | null) ?? null,
        transactions: (t.data as WasteTransaction[] | null) ?? [],
        rewards: (r.data as Reward[] | null) ?? [],
        claims: (c.data as ParentRewardClaim[] | null) ?? [],
        categories: (cats.data as WasteCategory[] | null) ?? [],
      };
    },
    enabled: Boolean(studentId),
  });

  const summary = query.data?.summary ?? null;
  const transactions = query.data?.transactions ?? [];
  const rewards = query.data?.rewards ?? [];
  const claims = query.data?.claims ?? [];
  const categories = query.data?.categories ?? [];

  const matchedChild = activeChild?.id === studentId ? activeChild : null;
  const studentCode = (matchedChild?.student_code ?? summary?.student_code ?? '').trim();
  const hasStudentCode = studentCode.length > 0;
  const displayName = studentName ?? matchedChild?.name ?? summary?.full_name ?? 'นักเรียน';
  const displayPhotoUrl = matchedChild?.photo_url ?? summary?.photo_url ?? null;

  const balanceQuery = useQuery({
    queryKey: ['parent-waste-balance', studentCode],
    queryFn: async () => {
      const { data, error } = await rewardClaimsService.lookupStudent(studentCode);
      if (error) throw error;
      if (!data) return null;
      const row = Array.isArray(data) ? data[0] : data;
      return (row as StudentBalanceLookup | undefined) ?? null;
    },
    enabled: hasStudentCode,
  });

  const dualBalance = balanceQuery.data ?? null;
  const wasteAvailable = dualBalance?.waste_points_available ?? summary?.available_points ?? 0;
  const virtueAvailable = dualBalance?.virtue_points_available ?? 0;
  const hasDualBalance = Boolean(dualBalance);

  const claimMutation = useMutation({
    mutationFn: async (r: Reward) => {
      if (!studentCode) {
        throw new Error('STUDENT_NOT_FOUND');
      }
      setClaimingId(r.id);
      const { error } = await rewardClaimsService.claimByCode(studentCode, r.id, 1);
      if (error) throw error;
      return r;
    },
    onSuccess: (r) => {
      setClaimingId(null);
      toast({ title: 'ส่งคำขอแลกแล้ว', description: `ขอแลก "${r.name}" เรียบร้อย รอครูอนุมัติ` });
      queryClient.invalidateQueries({ queryKey: ['waste-bank', 'parent', studentId] });
      queryClient.invalidateQueries({ queryKey: ['parent-waste-balance'] });
      queryClient.invalidateQueries({ queryKey: ['waste-student-summaries'] });
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      queryClient.invalidateQueries({ queryKey: ['top-heroes'] });
    },
    onError: (error: Error) => {
      setClaimingId(null);
      toast({
        title: 'ส่งคำขอไม่สำเร็จ',
        description: mapClaimError(error.message),
        variant: 'destructive',
      });
    },
  });

  const qrValue = `kampai-student:${studentId}`;

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'ภาพรวม', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'rewards', label: 'รางวัล', icon: <Gift className="w-4 h-4" /> },
    { id: 'history', label: 'ประวัติฝากขยะ', icon: <History className="w-4 h-4" /> },
    { id: 'claims', label: 'ประวัติแลกรางวัล', icon: <Clock className="w-4 h-4" /> },
  ];

  const missingCodeNotice = !query.isLoading && !hasStudentCode ? (
    <div className="flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900">
      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
      <span>
        นักเรียนคนนี้ยังไม่มีรหัสนักเรียนในระบบ กรุณาติดต่อคุณครูประจำชั้นเพื่อกำหนดรหัสนักเรียนก่อนทำรายการแลกรางวัล
      </span>
    </div>
  ) : null;

  const balanceUnavailableNotice =
    hasStudentCode && !balanceQuery.isLoading && (balanceQuery.isError || (balanceQuery.isFetched && !hasDualBalance)) ? (
      <div className="flex items-start gap-2.5 rounded-xl border border-rose-300 bg-rose-50 p-3.5 text-xs text-rose-900">
        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-700 mt-0.5" />
        <span>
          ไม่สามารถตรวจสอบยอดแต้มขยะและคะแนนความดีพร้อมแลกได้ในขณะนี้ กรุณาลองใหม่อีกครั้งหรือติดต่อคุณครู
        </span>
      </div>
    ) : null;

  return (
    <div className="space-y-6">
      {/* Hero: QR + Dual-Wallet Points */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <QrCode className="w-4 h-4" /> QR นักเรียน
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            <div className="bg-card border border-border p-3 rounded-lg">
              <QRCode value={qrValue} size={160} />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              ให้ครูสแกนเพื่อฝากขยะหรือบันทึกรายการ
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-amber-500/10 border-emerald-500/20">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-muted-foreground text-sm min-w-0">
                <PersonAvatar
                  name={displayName}
                  photoUrl={displayPhotoUrl}
                  size="md"
                  className="ring-2 ring-emerald-500/30 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-medium text-foreground truncate">
                    <Recycle className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="truncate">สรุปสำหรับ {displayName}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {hasStudentCode ? `รหัสนักเรียน ${studentCode}` : 'ยังไม่มีรหัสนักเรียน'}
                  </div>
                </div>
              </div>
              {dualBalance?.virtue_academic_year && (
                <Badge variant="outline" className="bg-card text-foreground border-border text-xs">
                  ปีการศึกษา {dualBalance.virtue_academic_year}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="ขยะรวม" value={`${summary?.total_items ?? 0} ชิ้น`} color="text-sky-700" />
              <Stat
                label="แต้มขยะสะสม"
                value={`${dualBalance?.waste_points_earned ?? summary?.total_points_earned ?? 0}`}
                color="text-foreground"
              />
              <Stat
                label="ขยะพร้อมแลก"
                value={`${wasteAvailable}`}
                color="text-emerald-800"
                highlight
              />
              <Stat
                label="ความดีพร้อมแลก"
                value={hasStudentCode ? (balanceQuery.isLoading ? '...' : `${virtueAvailable}`) : '—'}
                color="text-amber-800"
                highlight
              />
            </div>

            {dualBalance && (
              <p className="text-xs text-muted-foreground">
                คะแนนความดีสะสมเกียรติยศ {dualBalance.virtue_points_earned} คะแนน — การแลกรางวัลจะใช้เฉพาะคะแนนความดีพร้อมแลก โดยไม่ลดอันดับเกียรติยศ
              </p>
            )}
            {missingCodeNotice}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto whitespace-nowrap scrollbar-none gap-2 border-b border-border -mx-4 px-4 sm:mx-0 sm:px-0 flex-nowrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px flex-shrink-0',
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <Card>
            <CardContent className="p-6 space-y-3">
              <h3 className="font-semibold">วิธีใช้งาน</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>นำขยะไปให้ครู → โชว์ QR จากหน้านี้</li>
                <li>ครูสแกน QR → บันทึกจำนวนและประเภทขยะ → แต้มเพิ่มอัตโนมัติ</li>
                <li>เลือกแลกรางวัลในแท็บ &quot;รางวัล&quot; → รอครูอนุมัติ</li>
              </ol>
            </CardContent>
          </Card>

          {categories.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                  <Recycle className="w-4 h-4 text-emerald-700" />
                  คะแนนขยะแต่ละประเภท
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2"
                    >
                      {cat.icon && <span className="text-lg leading-none">{cat.icon}</span>}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium truncate">{cat.name}</div>
                        <div className="text-xs text-foreground font-bold">
                          {cat.points_per_item} แต้ม/ชิ้น
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {tab === 'rewards' && (
        <div className="space-y-4">
          {missingCodeNotice}
          {balanceUnavailableNotice}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.length === 0 ? (
              <div className="col-span-full">
                <EmptyState
                  variant="inline"
                  illustration={<NoDataIllustration />}
                  title="ยังไม่มีรางวัล"
                  description="รอครูเพิ่มรางวัลใหม่"
                />
              </div>
            ) : (
              rewards.map((r) => {
                const wasteCost = Number(r.waste_points_cost ?? r.points_cost ?? 0);
                const virtueCost = Number(r.virtue_points_cost ?? 0);
                const eligibility = canAffordDualWalletReward(
                  { wasteAvailable, virtueAvailable },
                  {
                    points_cost: r.points_cost,
                    waste_points_cost: wasteCost,
                    virtue_points_cost: virtueCost,
                    stock: r.stock,
                    is_active: r.is_active,
                  },
                  1,
                );
                const isClaimingThis = claimingId === r.id;
                const buttonDisabled =
                  !hasStudentCode ||
                  balanceQuery.isLoading ||
                  !hasDualBalance ||
                  !eligibility.eligible ||
                  claimMutation.isPending;

                let buttonLabel = 'แลกเลย';
                if (!hasStudentCode && !query.isLoading) {
                  buttonLabel = 'ต้องมีรหัสนักเรียน';
                } else if (balanceQuery.isLoading) {
                  buttonLabel = 'กำลังตรวจสอบแต้ม...';
                } else if (!hasDualBalance) {
                  buttonLabel = 'ไม่สามารถตรวจแต้มได้';
                } else if (isClaimingThis) {
                  buttonLabel = 'กำลังส่ง...';
                } else if (eligibility.reason === 'out_of_stock') {
                  buttonLabel = 'สินค้าหมด';
                } else if (eligibility.reason === 'inactive') {
                  buttonLabel = 'ปิดการแลก';
                } else if (eligibility.reason === 'insufficient_both') {
                  buttonLabel = `ขาดขยะ ${eligibility.missingWaste} · ความดี ${eligibility.missingVirtue}`;
                } else if (eligibility.reason === 'insufficient_waste') {
                  buttonLabel = `ขาดแต้มขยะอีก ${eligibility.missingWaste}`;
                } else if (eligibility.reason === 'insufficient_virtue') {
                  buttonLabel = `ขาดความดีอีก ${eligibility.missingVirtue}`;
                }

                return (
                  <Card key={r.id}>
                    <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                      {r.image_url ? (
                        <img src={r.image_url} alt={r.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Gift className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <h4 className="font-semibold text-foreground">{r.name}</h4>
                      {r.description && <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>}
                      <div className="flex items-center justify-between gap-2">
                        <RewardCostDisplay waste={wasteCost} virtue={virtueCost} />
                        <span className="text-xs text-muted-foreground shrink-0">
                          {r.stock === null ? 'ไม่จำกัด' : `คงเหลือ ${r.stock}`}
                        </span>
                      </div>
                      <Button
                        className="w-full"
                        disabled={buttonDisabled}
                        onClick={() => setClaimTarget(r)}
                      >
                        {buttonLabel}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">วันที่</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">ประเภท</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">จำนวน</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">แต้ม</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-muted-foreground">
                        ยังไม่มีประวัติ
                      </td>
                    </tr>
                  ) : (
                    transactions.map((t) => (
                      <tr key={t.id} className="border-b border-border">
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          <div>{formatThaiDateFull(t.transaction_date)}</div>
                          <div className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                            {t.created_at
                              ? `${new Date(t.created_at).toLocaleTimeString('th-TH', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false,
                                  timeZone: 'Asia/Bangkok',
                                })} น.`
                              : '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {t.waste_categories?.icon && <span className="mr-1">{t.waste_categories.icon}</span>}
                          {t.waste_categories?.name ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-right">{t.quantity} ชิ้น</td>
                        <td className="px-4 py-3 text-right font-bold text-foreground">+{t.points_earned}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'claims' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">วันที่</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">รางวัล</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">แต้มที่ใช้</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-muted-foreground">
                        ยังไม่เคยแลกรางวัล
                      </td>
                    </tr>
                  ) : (
                    claims.map((c) => {
                      const wasteUsed = Number(c.waste_points_used ?? c.points_used ?? 0);
                      const virtueUsed = Number(c.virtue_points_used ?? 0);
                      return (
                        <tr key={c.id} className="border-b border-border">
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                            {formatThaiDateFull(c.claimed_at)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {c.rewards?.image_url && (
                                <img src={c.rewards.image_url} alt={c.reward_name} className="w-8 h-8 rounded object-cover" />
                              )}
                              <span>{c.reward_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <RewardCostDisplay waste={wasteUsed} virtue={virtueUsed} className="justify-end text-xs" />
                          </td>
                          <td className="px-4 py-3">
                            {c.status === 'pending' && (
                              <Badge className="bg-amber-500/15 text-amber-800 hover:bg-amber-500/20 gap-1">
                                <Clock className="w-3 h-3" />
                                รออนุมัติ
                              </Badge>
                            )}
                            {c.status === 'approved' && (
                              <Badge className="bg-emerald-500/15 text-emerald-800 hover:bg-emerald-500/20 gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                อนุมัติแล้ว
                              </Badge>
                            )}
                            {c.status === 'rejected' && (
                              <Badge className="bg-rose-500/15 text-rose-800 hover:bg-rose-500/20 gap-1">
                                <XCircle className="w-3 h-3" />
                                ปฏิเสธ
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={Boolean(claimTarget)}
        onOpenChange={(open) => {
          if (!open) setClaimTarget(null);
        }}
        variant="default"
        title="ยืนยันการขอแลกรางวัล"
        description={
          claimTarget
            ? `ยืนยันส่งคำขอแลก "${claimTarget.name}" (แต้มขยะ ${Number(
                claimTarget.waste_points_cost ?? claimTarget.points_cost ?? 0,
              )} + คะแนนความดี ${Number(claimTarget.virtue_points_cost ?? 0)}) สำหรับ ${displayName}?`
            : ''
        }
        confirmText="ยืนยันแลกรางวัล"
        cancelText="ยกเลิก"
        onConfirm={() => {
          if (!claimTarget || !studentCode) return;
          const target = claimTarget;
          setClaimTarget(null);
          claimMutation.mutate(target);
        }}
      />
    </div>
  );
};

const Stat = ({
  label,
  value,
  color,
  highlight,
}: {
  label: string;
  value: string;
  color: string;
  highlight?: boolean;
}) => (
  <div className={cn('text-center', highlight && 'bg-card border border-border rounded-lg p-2')}>
    <div className={cn('text-2xl font-bold tabular-nums', color)}>{value}</div>
    <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
  </div>
);
