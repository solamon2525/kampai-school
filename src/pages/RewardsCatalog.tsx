import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BarChart3, Gift, Search, Sparkles, History, Clock, CheckCircle2, XCircle } from 'lucide-react';
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
import { rewardsService, rewardClaimsService } from '@/services/waste-bank.service';
import type { Reward, StudentBalanceLookup, StudentHistoryRow } from '@/services/waste-bank.service';
import { Badge } from '@/components/ui/badge';
import { RewardCard } from '@/components/rewards/RewardCard';
import { RewardClaimDialog } from '@/components/rewards/RewardClaimDialog';
import { cn } from '@/lib/utils';

export default function RewardsCatalog() {
  const [selected, setSelected] = useState<Reward | null>(null);
  const [claimOpen, setClaimOpen] = useState(false);
  const [balanceOpen, setBalanceOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

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

  // Filtered + sorted (points asc within filter)
  const filtered = useMemo(() => {
    const sorted = [...rewards].sort((a, b) => a.points_cost - b.points_cost);
    if (activeCategory === null) return sorted;
    return sorted.filter((r) => r.category === activeCategory);
  }, [rewards, activeCategory]);

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
                  className="border-white/40 text-white hover:bg-white/10 hover:text-white h-8"
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

      <RewardClaimDialog reward={selected} open={claimOpen} onOpenChange={setClaimOpen} />
      <BalanceCheckDialog open={balanceOpen} onOpenChange={setBalanceOpen} />
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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [code, setCode] = useState('');
  const [student, setStudent] = useState<StudentBalanceLookup | null>(null);
  const [history, setHistory] = useState<StudentHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const reset = () => {
    setCode('');
    setStudent(null);
    setHistory([]);
    setLoading(false);
    setErr(null);
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
          )}

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
                      <div className="shrink-0">
                        {h.status === 'pending' && (
                          <Badge variant="outline" className="gap-1 text-[10px] border-amber-300 text-amber-700 dark:text-amber-300">
                            <Clock className="w-3 h-3" /> รออนุมัติ
                          </Badge>
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
