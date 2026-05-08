import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Gift, Recycle, Search, Sparkles } from 'lucide-react';
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
import type { Reward, StudentBalanceLookup } from '@/services/waste-bank.service';
import { RewardCard } from '@/components/rewards/RewardCard';
import { RewardClaimDialog } from '@/components/rewards/RewardClaimDialog';
import { TIERS, tierFor } from '@/components/rewards/tier';
import { cn } from '@/lib/utils';

export default function RewardsCatalog() {
  const [selected, setSelected] = useState<Reward | null>(null);
  const [claimOpen, setClaimOpen] = useState(false);
  const [balanceOpen, setBalanceOpen] = useState(false);

  const { data: rewards = [], isLoading } = useQuery({
    queryKey: ['rewards', 'active'],
    queryFn: async () => {
      const { data, error } = await rewardsService.getActive();
      if (error) throw error;
      return (data ?? []) as Reward[];
    },
  });

  // Group rewards by auto-bucket tier
  const grouped = useMemo(() => {
    const map: Record<string, Reward[]> = { starter: [], good: [], great: [], elite: [] };
    for (const r of rewards) {
      const t = tierFor(r.points_cost);
      map[t.key].push(r);
    }
    // Sort each tier by points_cost asc
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.points_cost - b.points_cost);
    }
    return map;
  }, [rewards]);

  const handleClaim = (reward: Reward) => {
    setSelected(reward);
    setClaimOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead title="แลกของรางวัล - ธนาคารขยะ" description="ใช้แต้มสะสมจากธนาคารขยะแลกของรางวัลจากทางโรงเรียน" />
      <SiteHeader />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.15),_transparent_60%)]" />
        <div className="container mx-auto px-4 py-16 md:py-20 relative">
          <Link
            to="/waste-bank"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับไปธนาคารขยะ
          </Link>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1.5 text-sm mb-4">
              <Gift className="w-4 h-4" />
              ห้องของรางวัล
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              แลกของรางวัล
              <br />
              ด้วยแต้มจากธนาคารขยะ
            </h1>
            <p className="text-lg text-white/90 max-w-2xl">
              เก็บขยะ → สะสมแต้ม → แลกของรางวัลได้เอง
              <br />
              กรอกรหัสนักเรียนเพื่อตรวจแต้มและส่งคำขอ ครูจะอนุมัติให้
            </p>

            <div className="flex flex-wrap gap-3 mt-6">
              <Button
                size="lg"
                onClick={() => setBalanceOpen(true)}
                className="bg-white text-emerald-700 hover:bg-white/90 font-semibold"
              >
                <Search className="w-5 h-5 mr-2" />
                ตรวจสอบแต้มของฉัน
              </Button>
              <Link to="/waste-bank">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/40 text-white hover:bg-white/10 hover:text-white"
                >
                  <Recycle className="w-5 h-5 mr-2" />
                  ดูสถิติธนาคารขยะ
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tier overview ─────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TIERS.map((t) => (
              <a
                key={t.key}
                href={`#tier-${t.key}`}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border border-border bg-card',
                  'hover:shadow-md hover:-translate-y-0.5 transition-all',
                )}
              >
                <span className="text-2xl">{t.emoji}</span>
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{t.label}</div>
                  <div className="text-xs text-muted-foreground">{t.range}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tier sections ─────────────────────────────────────────────────── */}
      <main className="flex-1 container mx-auto px-4 py-8 space-y-12">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : rewards.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Gift className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">ยังไม่มีของรางวัล กรุณากลับมาใหม่เร็วๆ นี้</p>
            </CardContent>
          </Card>
        ) : (
          TIERS.map((tier) => {
            const items = grouped[tier.key] ?? [];
            return (
              <section key={tier.key} id={`tier-${tier.key}`} className="scroll-mt-20">
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{tier.emoji}</span>
                      <h2 className="text-2xl font-bold text-foreground">{tier.label}</h2>
                    </div>
                    <p className="text-sm text-muted-foreground ml-11">{tier.range}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {items.length} {items.length === 1 ? 'รางวัล' : 'รางวัล'}
                  </span>
                </div>

                {items.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                    <Sparkles className="w-6 h-6 mx-auto opacity-40 mb-2" />
                    ยังไม่มีรางวัลในระดับนี้
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {items.map((r) => (
                      <RewardCard key={r.id} reward={r} onClaim={handleClaim} />
                    ))}
                  </div>
                )}
              </section>
            );
          })
        )}
      </main>

      <Footer />

      {/* ── Claim dialog ──────────────────────────────────────────────────── */}
      <RewardClaimDialog reward={selected} open={claimOpen} onOpenChange={setClaimOpen} />

      {/* ── Balance check dialog ──────────────────────────────────────────── */}
      <BalanceCheckDialog open={balanceOpen} onOpenChange={setBalanceOpen} />
    </div>
  );
}

// ─── Inline subcomponent: balance check (read-only lookup, no claim) ─────────
function BalanceCheckDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [code, setCode] = useState('');
  const [student, setStudent] = useState<StudentBalanceLookup | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const reset = () => {
    setCode('');
    setStudent(null);
    setLoading(false);
    setErr(null);
  };

  const handleLookup = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setLoading(true);
    setErr(null);
    setStudent(null);
    const { data, error } = await rewardClaimsService.lookupStudent(trimmed);
    setLoading(false);
    if (error) {
      setErr(error.message ?? 'เกิดข้อผิดพลาด');
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || !row.student_id) {
      setErr('ไม่พบนักเรียนที่ใช้รหัสนี้');
      return;
    }
    setStudent(row as StudentBalanceLookup);
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
