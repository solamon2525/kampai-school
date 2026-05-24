import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { Recycle, QrCode, Gift, History, Sparkles, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { NoDataIllustration } from '@/components/ui/empty-illustrations';
import { useToast } from '@/hooks/use-toast';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
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
} from '@/services/waste-bank.service';
import { formatThaiDateFull } from '@/lib/thaiDate';

interface Props {
  studentId: string;
  studentName?: string | null;
}

type TabId = 'overview' | 'rewards' | 'history' | 'claims';

export const WasteBankParentView = ({ studentId, studentName }: Props) => {
  const { toast } = useToast();
  const [tab, setTab] = useState<TabId>('overview');
  const [summary, setSummary] = useState<WasteStudentSummary | null>(null);
  const [transactions, setTransactions] = useState<WasteTransaction[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [claims, setClaims] = useState<RewardClaim[]>([]);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [categories, setCategories] = useState<WasteCategory[]>([]);

  const fetchAll = async () => {
    const [s, t, r, c, cats] = await Promise.all([
      wasteSummaryService.getForStudent(studentId),
      wasteTransactionsService.getByStudent(studentId),
      rewardsService.getActive(),
      rewardClaimsService.listForStudent(studentId),
      wasteCategoriesService.getActive(),
    ]);
    if (s.data) setSummary(s.data as WasteStudentSummary);
    if (t.data) setTransactions(t.data as WasteTransaction[]);
    if (r.data) setRewards(r.data as Reward[]);
    if (c.data) setClaims(c.data as RewardClaim[]);
    if (cats.data) setCategories(cats.data as WasteCategory[]);
  };

  useEffect(() => { fetchAll(); }, [studentId]);

  const available = summary?.available_points ?? 0;
  const qrValue = `kampai-student:${studentId}`;

  const handleClaim = async (r: Reward) => {
    if (available < r.points_cost) {
      toast({ title: 'แต้มไม่พอ', description: `ต้องการ ${r.points_cost} แต้ม มี ${available}`, variant: 'destructive' });
      return;
    }
    if (!confirm(`ยืนยันแลก "${r.name}" ด้วย ${r.points_cost} แต้ม?`)) return;
    setClaimingId(r.id);
    const { error } = await rewardClaimsService.create({
      student_id: studentId,
      reward_id: r.id,
      reward_name: r.name,
      points_used: r.points_cost,
    });
    setClaimingId(null);
    if (error) {
      toast({ title: 'ส่งคำขอไม่สำเร็จ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'ส่งคำขอแลกแล้ว', description: 'รอครูอนุมัติ' });
      fetchAll();
    }
  };

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'ภาพรวม', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'rewards', label: 'รางวัล', icon: <Gift className="w-4 h-4" /> },
    { id: 'history', label: 'ประวัติฝากขยะ', icon: <History className="w-4 h-4" /> },
    { id: 'claims', label: 'ประวัติแลกรางวัล', icon: <Clock className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Hero: QR + Points */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <QrCode className="w-4 h-4" /> QR นักเรียน
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            <div className="bg-white p-3 rounded-lg">
              <QRCode value={qrValue} size={160} />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              ให้ครูสแกนเพื่อฝากขยะหรือบันทึกรายการ
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-amber-500/10 border-emerald-500/20">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3 text-muted-foreground text-sm">
              <PersonAvatar
                name={studentName ?? summary?.full_name ?? 'นักเรียน'}
                photoUrl={summary?.photo_url}
                size="md"
                className="ring-2 ring-emerald-500/30"
              />
              <div className="flex items-center gap-2">
                <Recycle className="w-4 h-4" /> สรุปสำหรับ {studentName ?? summary?.full_name ?? 'นักเรียน'}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Stat label="ขยะรวม" value={`${summary?.total_items ?? 0} ชิ้น`} color="text-blue-600 dark:text-blue-400" />
              <Stat label="แต้มสะสม" value={`${summary?.total_points_earned ?? 0}`} color="text-foreground dark:text-foreground" />
              <Stat label="แต้มคงเหลือ" value={`${available}`} color="text-amber-600 dark:text-amber-400" highlight />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto whitespace-nowrap scrollbar-none gap-2 border-b border-border -mx-4 px-4 sm:mx-0 sm:px-0 flex-nowrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px flex-shrink-0 ${
              tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
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
                  <Recycle className="w-4 h-4 text-emerald-600" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.length === 0 ? (
            <div className="col-span-full">
              <EmptyState variant="inline" illustration={<NoDataIllustration />} title="ยังไม่มีรางวัล" description="รอครูเพิ่มรางวัลใหม่" />
            </div>
          ) : (
            rewards.map((r) => {
              const canClaim = available >= r.points_cost && (r.stock === null || (r.stock ?? 0) > 0);
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
                    <h4 className="font-semibold">{r.name}</h4>
                    {r.description && <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>}
                    <div className="flex items-center justify-between">
                      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20">
                        {r.points_cost} แต้ม
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {r.stock === null ? 'ไม่จำกัด' : `คงเหลือ ${r.stock}`}
                      </span>
                    </div>
                    <Button
                      className="w-full"
                      disabled={!canClaim || claimingId === r.id}
                      onClick={() => handleClaim(r)}
                    >
                      {!canClaim && available < r.points_cost ? `ต้องการอีก ${r.points_cost - available} แต้ม` : (claimingId === r.id ? 'กำลังส่ง...' : 'แลกเลย')}
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
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
                    <tr><td colSpan={4} className="text-center py-10 text-muted-foreground">ยังไม่มีประวัติ</td></tr>
                  ) : (
                    transactions.map((t) => (
                      <tr key={t.id} className="border-b border-border">
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatThaiDateFull(t.transaction_date)}</td>
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
                    <tr><td colSpan={4} className="text-center py-10 text-muted-foreground">ยังไม่เคยแลกรางวัล</td></tr>
                  ) : (
                    claims.map((c) => (
                      <tr key={c.id} className="border-b border-border">
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                          {formatThaiDateFull(c.claimed_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {c.rewards?.image_url && <img src={c.rewards.image_url} alt="" className="w-8 h-8 rounded object-cover" />}
                            {c.reward_name}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-amber-600 dark:text-amber-400">-{c.points_used}</td>
                        <td className="px-4 py-3">
                          {c.status === 'pending' && <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 gap-1"><Clock className="w-3 h-3" />รออนุมัติ</Badge>}
                          {c.status === 'approved' && <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 gap-1"><CheckCircle2 className="w-3 h-3" />อนุมัติแล้ว</Badge>}
                          {c.status === 'rejected' && <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 gap-1"><XCircle className="w-3 h-3" />ปฏิเสธ</Badge>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const Stat = ({ label, value, color, highlight }: { label: string; value: string; color: string; highlight?: boolean }) => (
  <div className={`text-center ${highlight ? 'bg-white/60 dark:bg-black/20 rounded-lg p-2' : ''}`}>
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
    <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
  </div>
);
