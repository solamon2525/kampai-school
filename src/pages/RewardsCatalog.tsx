import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BarChart3, Gift, Search, Sparkles, History, Clock, CheckCircle2, XCircle, User, Globe2, QrCode } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import QRCode from 'react-qr-code';
import { rewardsService, rewardClaimsService } from '@/services/waste-bank.service';
import type { Reward, StudentBalanceLookup, StudentHistoryRow } from '@/services/waste-bank.service';
import { Badge } from '@/components/ui/badge';
import { RewardCard } from '@/components/rewards/RewardCard';
import { RewardClaimDialog } from '@/components/rewards/RewardClaimDialog';
import { cn } from '@/lib/utils';

function cleanThaiTitle(name: string | null): string | null {
  if (!name) return null;
  return name.trim().replace(/^(นาย|นางสาว|นาง|ดร\.|ครู|อาจารย์)\s*/, '');
}

export default function RewardsCatalog() {
  const [selected, setSelected] = useState<Reward | null>(null);
  const [claimOpen, setClaimOpen] = useState(false);
  const [balanceOpen, setBalanceOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTeacherId, setActiveTeacherId] = useState<string | null | 'central'>(null);
  const [selectedClaimQr, setSelectedClaimQr] = useState<string | null>(null);
  // pre-fill ให้ RewardClaimDialog เมื่อเปิดจาก BalanceCheckDialog (ข้าม lookup ซ้ำ)
  const [lookedUpCode, setLookedUpCode] = useState<string | null>(null);
  const [lookedUpStudent, setLookedUpStudent] = useState<StudentBalanceLookup | null>(null);

  const { data: rewards = [], isLoading } = useQuery({
    queryKey: ['rewards', 'active'],
    queryFn: async () => {
      const { data, error } = await rewardsService.getActive();
      if (error) throw error;
      return (data ?? []) as Reward[];
    },
  });

  // Distinct categories from active rewards (sorted alphabetically)
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const r of rewards) {
      if (r.category && r.category.trim()) set.add(r.category);
    }
    return Array.from(set).sort();
  }, [rewards]);

  const teachers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; photo_url: string | null }>();
    for (const r of rewards) {
      if (r.staff) {
        map.set(r.owner_staff_id!, { id: r.owner_staff_id!, name: r.staff.name, photo_url: r.staff.photo_url });
      } else if (r.administrators) {
        map.set(r.owner_administrator_id!, { id: r.owner_administrator_id!, name: r.administrators.name, photo_url: r.administrators.photo_url });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'th'));
  }, [rewards]);

  // Filtered + sorted (points asc within filter)
  const filtered = useMemo(() => {
    let list = [...rewards];
    if (activeCategory !== null) {
      list = list.filter((r) => r.category === activeCategory);
    }
    if (activeTeacherId === 'central') {
      list = list.filter((r) => !r.owner_staff_id && !r.owner_administrator_id);
    } else if (activeTeacherId !== null) {
      list = list.filter((r) => r.owner_staff_id === activeTeacherId || r.owner_administrator_id === activeTeacherId);
    }
    return list.sort((a, b) => a.points_cost - b.points_cost);
  }, [rewards, activeCategory, activeTeacherId]);

  const handleClaim = (reward: Reward) => {
    setSelected(reward);
    setClaimOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="แลกของรางวัล - ธนาคารขยะ"
        description="ใช้แต้มสะสมจากธนาคารขยะแลกของรางวัลจากทางโรงเรียน"
      />
      <SiteHeader />

      {/* max-w-7xl wrapper — Rule 14.11: ห้ามล้นกรอบ */}
      <div className="max-w-7xl mx-auto w-full bg-background flex-grow flex flex-col">
        {/* ── Compact Hero (Rule 14.10) ─────────────────────────────────── */}
        <section className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white py-5 md:py-7">
          <div className="px-4">
            <Link
              to="/waste-bank"
              className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-xs md:text-sm mb-2 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              กลับไปธนาคารขยะ
            </Link>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold leading-tight">
              <Gift className="inline w-5 h-5 md:w-6 md:h-6 mr-1.5 -mt-1" />
              แลกของรางวัลด้วยแต้มจากธนาคารขยะ
            </h1>
            <p className="text-xs md:text-sm text-white/85 mt-1.5 max-w-2xl">
              เก็บขยะ → สะสมแต้ม → แลกได้เอง · กรอกรหัสนักเรียนเพื่อตรวจแต้มและส่งคำขอ
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button
                size="sm"
                onClick={() => setBalanceOpen(true)}
                className="bg-white text-emerald-700 hover:bg-white/90 font-semibold h-8"
              >
                <Search className="w-3.5 h-3.5 mr-1.5" />
                ตรวจสอบแต้มของฉัน
              </Button>
              <Link to="/waste-bank/stats">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white h-8"
                >
                  <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                  ดูสถิติ
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Sticky Category chip filter ───────────────────────────────── */}
        <section className="sticky top-0 z-10 bg-background border-b border-border">
          <div
            className="px-4 py-2.5 overflow-x-auto"
            style={{ scrollbarWidth: 'none' }}
          >
            <div className="flex gap-2 min-w-max">
              <CategoryChip
                active={activeCategory === null}
                onClick={() => setActiveCategory(null)}
              >
                ทั้งหมด
              </CategoryChip>
              {categories.map((c) => (
                <CategoryChip
                  key={c}
                  active={activeCategory === c}
                  onClick={() => setActiveCategory(c)}
                >
                  {c}
                </CategoryChip>
              ))}
            </div>
          </div>
        </section>

        {/* ── Teacher Filter Chips ── */}
        <section className="bg-background border-b border-border pb-3 pt-2 px-4">
          <div className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-primary" /> คัดกรองตามครูผู้ดูแล:
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            <button
              onClick={() => setActiveTeacherId(null)}
              type="button"
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors border whitespace-nowrap',
                activeTeacherId === null
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card text-foreground hover:bg-muted/70 border-border',
              )}
            >
              <span>ครูทุกคน / ทั้งหมด</span>
            </button>
            <button
              onClick={() => setActiveTeacherId('central')}
              type="button"
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors border whitespace-nowrap',
                activeTeacherId === 'central'
                  ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                  : 'bg-card text-foreground hover:bg-muted/70 border-border',
              )}
            >
              <Globe2 className="w-3.5 h-3.5 text-sky-500" />
              <span>รางวัลกลาง</span>
            </button>
            {teachers.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTeacherId(t.id)}
                type="button"
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border shrink-0 whitespace-nowrap',
                  activeTeacherId === t.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-card text-foreground hover:bg-muted/70 border-border',
                )}
              >
                {t.photo_url ? (
                  <img src={t.photo_url} alt={t.name} className="w-4 h-4 rounded-full object-cover" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary">
                    {t.name.slice(0, 1)}
                  </div>
                )}
                <span>ครู{cleanThaiTitle(t.name)}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Single grid (sorted by points asc) ────────────────────────── */}
        <main className="flex-1 px-4 py-5 md:py-6">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Gift className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {activeCategory === null
                    ? 'ยังไม่มีของรางวัล กรุณากลับมาใหม่เร็วๆ นี้'
                    : `ยังไม่มีรางวัลในหมวด "${activeCategory}"`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filtered.map((r) => (
                <RewardCard key={r.id} reward={r} onClaim={handleClaim} />
              ))}
            </div>
          )}
        </main>
      </div>

      <Footer />

      <RewardClaimDialog
        reward={selected}
        open={claimOpen}
        onOpenChange={(v) => {
          setClaimOpen(v);
          if (!v) {
            // เคลียร์ pre-fill เมื่อปิด — ครั้งต่อไปเริ่มใหม่
            setLookedUpCode(null);
            setLookedUpStudent(null);
          }
        }}
        initialCode={lookedUpCode ?? undefined}
        initialStudent={lookedUpStudent}
      />
      <BalanceCheckDialog
        open={balanceOpen}
        onOpenChange={setBalanceOpen}
        rewards={rewards}
        onShowClaimQr={setSelectedClaimQr}
        onPickReward={(reward, code, student) => {
          setLookedUpCode(code);
          setLookedUpStudent(student);
          setSelected(reward);
          setBalanceOpen(false);
          setClaimOpen(true);
        }}
      />

      {/* Dialog for displaying QR Code for pending claim */}
      <Dialog open={!!selectedClaimQr} onOpenChange={(v) => !v && setSelectedClaimQr(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              รหัสอนุมัติของรางวัล
            </DialogTitle>
            <DialogDescription>
              ยื่นหน้าจอนี้ให้คุณครูสแกนเพื่ออนุมัติรับของรางวัลได้ทันที
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            {selectedClaimQr && (
              <div className="bg-card p-3.5 rounded-xl shadow-sm border border-border">
                <QRCode value={selectedClaimQr} size={180} />
              </div>
            )}
            <div className="text-xs text-muted-foreground text-center">
              * รหัสนี้ใช้สำหรับสแกนผ่านแอปพลิเคชันของคุณครูคำไผ่เท่านั้น
            </div>
          </div>
          <Button className="w-full" onClick={() => setSelectedClaimQr(null)}>
            ปิดหน้าต่าง
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── CategoryChip (inline) ──────────────────────────────────────────────────
function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        'flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs md:text-sm font-medium transition-colors whitespace-nowrap',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'bg-muted text-foreground hover:bg-muted/70 border border-border',
      )}
    >
      {children}
    </button>
  );
}

// ─── Inline subcomponent: balance check (read-only lookup, no claim) ────────
function BalanceCheckDialog({
  open,
  onOpenChange,
  rewards,
  onShowClaimQr,
  onPickReward,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rewards: Reward[];
  onShowClaimQr: (qrValue: string) => void;
  /** เมื่อคลิก "แลกเลย" ใน eligible grid → เปิด RewardClaimDialog พร้อมข้ามขั้น lookup */
  onPickReward: (reward: Reward, code: string, student: StudentBalanceLookup) => void;
}) {
  const [code, setCode] = useState('');
  const [student, setStudent] = useState<StudentBalanceLookup | null>(null);
  const [history, setHistory] = useState<StudentHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [goal, setGoal] = useState<{ rewardId: string; rewardName: string; pointsCost: number; imageUrl: string | null } | null>(null);
  const [showGoalSelector, setShowGoalSelector] = useState(false);

  const reset = () => {
    setCode('');
    setStudent(null);
    setHistory([]);
    setLoading(false);
    setErr(null);
    setGoal(null);
    setShowGoalSelector(false);
  };

  const handleLookup = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setLoading(true);
    setErr(null);
    setStudent(null);
    setHistory([]);
    const { data, error } = await rewardClaimsService.lookupStudent(trimmed);
    if (error) {
      setLoading(false);
      setErr(error.message ?? 'เกิดข้อผิดพลาด');
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || !row.student_id) {
      setLoading(false);
      setErr('ไม่พบนักเรียนที่ใช้รหัสนี้');
      return;
    }
    setStudent(row as StudentBalanceLookup);

    // โหลดเป้าหมาย
    const savedGoal = localStorage.getItem(`kampai-goal:${trimmed}`);
    if (savedGoal) {
      setGoal(JSON.parse(savedGoal));
    } else {
      setGoal(null);
    }

    // โหลดประวัติแลกในพื้นหลัง
    const { data: hist } = await rewardClaimsService.getStudentHistory(trimmed, 30);
    setHistory((hist as StudentHistoryRow[]) ?? []);
    setLoading(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            ตรวจสอบแต้มของฉัน
          </DialogTitle>
          <DialogDescription>กรอกรหัสนักเรียนเพื่อดูแต้มคงเหลือ</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="balance-code">รหัสนักเรียน</Label>
            <div className="flex gap-2">
              <Input
                id="balance-code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setErr(null);
                  setStudent(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                placeholder="เช่น 1234"
                autoFocus
              />
              <Button onClick={handleLookup} disabled={!code.trim() || loading}>
                {loading ? '...' : 'ตรวจ'}
              </Button>
            </div>
          </div>

          {student && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-3">
                  {student.photo_url ? (
                    <img
                      src={student.photo_url}
                      alt={student.full_name}
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-emerald-400"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-lg">
                      {student.full_name.slice(0, 1)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{student.full_name}</div>
                    <div className="text-sm text-muted-foreground">{student.class_name ?? '—'}</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">แต้มคงเหลือ</span>
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-2xl font-bold">{student.available_points}</span>
                    <span className="text-sm text-muted-foreground">แต้ม</span>
                  </div>
                </div>
              </div>

              {/* Goal Progress Section */}
              {goal ? (
                <div className="p-3.5 rounded-xl border border-dashed border-amber-300 dark:border-amber-800 bg-amber-500/5 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex gap-2">
                      {goal.imageUrl ? (
                        <img src={goal.imageUrl} alt={goal.rewardName} className="w-9 h-9 rounded object-cover shrink-0 border border-border" />
                      ) : (
                        <div className="w-9 h-9 rounded bg-muted flex items-center justify-center shrink-0">
                          <Gift className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <div className="text-[10px] text-muted-foreground">เป้าหมายสะสม</div>
                        <div className="text-xs font-semibold text-foreground line-clamp-1">{goal.rewardName}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        localStorage.removeItem(`kampai-goal:${code.trim()}`);
                        setGoal(null);
                      }}
                      className="text-[10px] text-muted-foreground hover:text-destructive underline"
                    >
                      ยกเลิก
                    </button>
                  </div>

                  {/* Progress bar */}
                  {(() => {
                    const percent = Math.min(100, Math.round((student.available_points / goal.pointsCost) * 100));
                    const isGoalMet = student.available_points >= goal.pointsCost;
                    return (
                      <div className="space-y-1">
                        <div className="w-full bg-muted dark:bg-muted/30 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all duration-500",
                              isGoalMet ? "bg-emerald-500" : "bg-amber-500"
                            )}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-muted-foreground tabular-nums">
                            {student.available_points} / {goal.pointsCost} แต้ม ({percent}%)
                          </span>
                          <span className={cn("font-semibold", isGoalMet ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
                            {isGoalMet ? '🎉 แต้มถึงแล้ว แลกได้เลย!' : `ขาดอีก ${goal.pointsCost - student.available_points} แต้ม`}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="space-y-2">
                  {showGoalSelector ? (
                    <div className="p-3 rounded-lg border border-border bg-card space-y-2">
                      <Label className="text-xs">เลือกเป้าหมายรางวัลของคุณ</Label>
                      <Select
                        onValueChange={(val) => {
                          const selectedReward = rewards.find(r => r.id === val);
                          if (selectedReward) {
                            const goalData = {
                              rewardId: selectedReward.id,
                              rewardName: selectedReward.name,
                              pointsCost: selectedReward.points_cost,
                              imageUrl: selectedReward.image_url,
                            };
                            localStorage.setItem(`kampai-goal:${code.trim()}`, JSON.stringify(goalData));
                            setGoal(goalData);
                            setShowGoalSelector(false);
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="เลือกของรางวัล..." />
                        </SelectTrigger>
                        <SelectContent>
                          {rewards.map(r => (
                            <SelectItem key={r.id} value={r.id} className="text-xs">
                              {r.name} ({r.points_cost} แต้ม)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="ghost" className="w-full text-xs h-7" onClick={() => setShowGoalSelector(false)}>
                        ยกเลิก
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowGoalSelector(true)}
                      className="w-full py-2 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors flex items-center justify-center gap-1"
                    >
                      🎯 ตั้งเป้าหมายสะสมของรางวัล
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {student && (() => {
            const eligible = rewards
              .filter(
                (r) =>
                  r.is_active &&
                  r.points_cost <= student.available_points &&
                  (r.stock === null || r.stock === undefined || r.stock > 0),
              )
              .sort((a, b) => a.points_cost - b.points_cost);
            return (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Gift className="w-4 h-4 text-emerald-600" />
                  🎁 รางวัลที่คุณแลกได้เลย ({eligible.length})
                </div>
                {eligible.length === 0 ? (
                  <div className="text-xs text-center text-muted-foreground py-3 border border-dashed border-border rounded-lg">
                    ตอนนี้ยังไม่มีรางวัลที่แต้มของคุณแลกได้ — เก็บขยะเพิ่มอีกหน่อยนะ!
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-[40vh] overflow-y-auto">
                    {eligible.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => onPickReward(r, code.trim(), student)}
                        className="flex flex-col p-2 rounded-lg border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 dark:border-emerald-800 transition-colors text-left active:scale-95"
                      >
                        {r.image_url ? (
                          <img
                            src={r.image_url}
                            alt={r.name}
                            className="w-full aspect-square rounded object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full aspect-square rounded bg-muted flex items-center justify-center">
                            <Gift className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="text-xs font-medium truncate mt-1.5" title={r.name}>
                          {r.name}
                        </div>
                        <div className="flex items-center justify-between gap-1 mt-1">
                          <span className="text-[11px] text-amber-700 dark:text-amber-300 font-bold tabular-nums">
                            {r.points_cost} แต้ม
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-600 text-white rounded font-semibold">
                            แลกเลย
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {student && (
            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <History className="w-4 h-4 text-primary" />
                ประวัติการแลก ({history.length})
              </div>
              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3 text-center">
                  ยังไม่มีการแลกรางวัล
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {history.map((h) => (
                    <li
                      key={h.claim_id}
                      className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card"
                    >
                      {h.reward_image ? (
                        <img src={h.reward_image} alt={h.reward_name} className="w-9 h-9 rounded object-cover shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded bg-muted flex items-center justify-center shrink-0">
                          <Gift className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{h.reward_name}</div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span>−{h.points_used} แต้ม</span>
                          {h.balance_after !== null && (
                            <span>· เหลือ {h.balance_after}</span>
                          )}
                          {h.academic_year && h.semester && (
                            <span>· เทอม {h.semester}/{h.academic_year}</span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-1">
                        {h.status === 'pending' && (
                          <>
                            <Badge variant="outline" className="gap-1 text-[10px] border-amber-300 text-amber-700 dark:text-amber-300 animate-pulse">
                              <Clock className="w-3 h-3" /> รออนุมัติ
                            </Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-7 h-7 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-950/40"
                              onClick={() => onShowClaimQr(`kampai-claim:${h.claim_id}`)}
                              title="แสดง QR Code อนุมัติ"
                            >
                              <QrCode className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {h.status === 'approved' && (
                          <Badge variant="outline" className="gap-1 text-[10px] border-emerald-300 text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" /> สำเร็จ
                          </Badge>
                        )}
                        {h.status === 'rejected' && (
                          <Badge variant="outline" className="gap-1 text-[10px] border-rose-300 text-rose-700 dark:text-rose-300">
                            <XCircle className="w-3 h-3" /> ปฏิเสธ
                          </Badge>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {err && (
            <div className="text-sm text-rose-700 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-300 px-3 py-2 rounded-lg">
              {err}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
