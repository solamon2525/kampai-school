/**
 * OnlineArena — หน้าสาธารณะ "สังเวียนแชมป์": สถิติแข่งออนไลน์ระหว่างนักเรียน (Win/Loss)
 *
 * KPI + แชมป์ (leaderboard wins/win-rate + podium) + แมตช์ล่าสุด + ความนิยมเกม (recharts)
 * โครงตาม DailyQuestStats — refetch อัตโนมัติ
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Swords, Users, Trophy, Crown } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { cn } from '@/lib/utils';
import { onlineMatchService } from '@/services/online-match.service';

const MEDALS = ['🥇', '🥈', '🥉'];
const MEDAL_BG = ['border-amber-300 bg-amber-50', 'border-slate-300 bg-slate-50', 'border-orange-300 bg-orange-50'];

const KpiTile = ({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) => (
  <Card className={cn('overflow-hidden', accent && 'border-primary/30')}>
    <CardContent className="p-3.5 md:p-4">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{icon}{label}</div>
      <p className={cn('mt-1 text-2xl md:text-3xl font-extrabold tabular-nums', accent ? 'text-primary' : 'text-foreground')}>{value}</p>
    </CardContent>
  </Card>
);

const OnlineArena = () => {
  const overviewQuery = useQuery({ queryKey: ['arena-overview'], queryFn: () => onlineMatchService.getOverview(3650), refetchInterval: 30_000 });
  const lbQuery = useQuery({ queryKey: ['arena-lb'], queryFn: () => onlineMatchService.getStudentLeaderboard(3650, 20), refetchInterval: 30_000 });
  const gamesQuery = useQuery({ queryKey: ['arena-games'], queryFn: () => onlineMatchService.getGameStats(3650), refetchInterval: 60_000 });
  const logQuery = useQuery({ queryKey: ['arena-log'], queryFn: () => onlineMatchService.getMatchLog(null, 30), refetchInterval: 30_000 });

  const overview = overviewQuery.data;
  const lb = lbQuery.data ?? [];
  const podium = lb.slice(0, 3);
  const rest = lb.slice(3);

  const popularityData = useMemo(
    () => (gamesQuery.data ?? []).filter((g) => g.decisive_matches > 0).map((g) => ({ name: g.title, แมตช์: g.decisive_matches, ผู้เล่น: g.unique_players })),
    [gamesQuery.data],
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="สังเวียนแชมป์ — แข่งเกมออนไลน์" description="ใครคือแชมป์แข่งเกมออนไลน์ของโรงเรียน — สถิติแพ้ชนะระหว่างนักเรียนทุกเกม" />
      <SiteHeader />

      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-5 md:py-7 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/15 mb-3">
            <Swords className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-1">สังเวียนแชมป์ · แข่งออนไลน์</h1>
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto">แข่งเกมกับเพื่อนต่างเครื่อง — ใครชนะมากสุดคือแชมป์ของโรงเรียน 🏆</p>
        </div>
      </section>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-4 md:py-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiTile icon={<Swords className="h-3.5 w-3.5" />} label="แมตช์ทั้งหมด" value={(overview?.decisive_matches ?? 0).toLocaleString('th-TH')} accent />
          <KpiTile icon={<Users className="h-3.5 w-3.5" />} label="นักสู้" value={(overview?.distinct_players ?? 0).toLocaleString('th-TH')} />
          <KpiTile icon={<Trophy className="h-3.5 w-3.5" />} label="เกมที่แข่ง" value={(overview?.distinct_games ?? 0).toLocaleString('th-TH')} />
          <KpiTile icon={<Crown className="h-3.5 w-3.5" />} label="แชมป์อันดับ 1" value={lb[0]?.name ? `${lb[0].wins} ชนะ` : '—'} />
        </div>

        <Tabs defaultValue="champions">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="champions" className="gap-1.5"><Crown className="h-4 w-4" /> แชมป์</TabsTrigger>
            <TabsTrigger value="matches" className="gap-1.5"><Swords className="h-4 w-4" /> แมตช์ล่าสุด</TabsTrigger>
            <TabsTrigger value="games" className="gap-1.5"><Trophy className="h-4 w-4" /> เกมยอดนิยม</TabsTrigger>
          </TabsList>

          {/* แชมป์ */}
          <TabsContent value="champions" className="mt-4 space-y-3">
            {lb.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">ยังไม่มีการแข่งออนไลน์</CardContent></Card>
            : (
              <>
                {podium.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 md:gap-3 items-end max-w-2xl mx-auto">
                    {podium.map((s, idx) => (
                      <div key={s.student_id} className={cn('flex flex-col items-center text-center p-2 md:p-3 rounded-2xl border-2', MEDAL_BG[idx])}>
                        <span className="mb-1 text-xl">{MEDALS[idx]}</span>
                        <PersonAvatar name={s.name} photoUrl={s.photo_url} size="lg" className="ring-2 ring-offset-2 ring-offset-background ring-primary/20" />
                        <p className="font-semibold text-sm mt-1.5 leading-tight">{s.name}</p>
                        {s.class && <Badge variant="outline" className="mt-1 text-[10px]">{s.class}</Badge>}
                        <p className="mt-1 font-bold text-emerald-600">{s.wins} ชนะ</p>
                        <p className="text-[11px] text-muted-foreground">ชนะ {s.win_rate ?? 0}% · {s.matches} แมตช์</p>
                      </div>
                    ))}
                  </div>
                )}
                {rest.length > 0 && (
                  <Card className="max-w-2xl mx-auto">
                    <CardContent className="p-0 divide-y divide-border">
                      {rest.map((s, i) => (
                        <div key={s.student_id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/40">
                          <span className="w-6 text-center text-sm font-bold text-muted-foreground">{i + 4}</span>
                          <PersonAvatar name={s.name} photoUrl={s.photo_url} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{s.name}</p>
                            <p className="text-[11px] text-muted-foreground">{s.class ?? '—'} · {s.matches} แมตช์</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold"><span className="text-emerald-600">{s.wins}W</span> · <span className="text-rose-600">{s.losses}L</span></p>
                            <p className="text-[11px] text-muted-foreground">ชนะ {s.win_rate ?? 0}%</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* แมตช์ล่าสุด */}
          <TabsContent value="matches" className="mt-4 space-y-2 max-w-3xl mx-auto">
            {(logQuery.data ?? []).filter((m) => m.is_decisive).length === 0
              ? <Card><CardContent className="py-12 text-center text-muted-foreground">ยังไม่มีแมตช์</CardContent></Card>
              : (logQuery.data ?? []).filter((m) => m.is_decisive).map((mt) => (
                <Card key={mt.match_id}>
                  <CardContent className="p-3">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{mt.title}</span>
                        {mt.is_tournament && <Badge className="bg-amber-600 text-[10px]">ลีก</Badge>}
                      </div>
                      <span className="text-[11px] text-muted-foreground">{format(new Date(mt.finished_at), 'd MMM HH:mm', { locale: th })}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(mt.standings ?? []).map((p, idx) => (
                        <div key={idx} className={cn('flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs',
                          p.is_winner ? 'border-amber-400 bg-amber-50 font-semibold' : 'border-border')}>
                          <span className="text-muted-foreground">{p.rank}.</span>
                          <PersonAvatar name={p.name} photoUrl={p.photo_url} size="xs" />
                          <span>{p.name}</span>
                          <span className="text-muted-foreground">{p.score}</span>
                          {p.is_winner && <span>👑</span>}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          {/* เกมยอดนิยม */}
          <TabsContent value="games" className="mt-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-bold text-foreground mb-3">เกมที่แข่งออนไลน์มากที่สุด</h3>
                {popularityData.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">ยังไม่มีข้อมูล</p>
                : (
                  <ResponsiveContainer width="100%" height={Math.max(160, popularityData.length * 42)}>
                    <BarChart data={popularityData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }} />
                      <Bar dataKey="แมตช์" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                      <Bar dataKey="ผู้เล่น" fill="#10b981" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="text-center text-xs text-muted-foreground pb-2">อัปเดตอัตโนมัติ</p>
      </main>
      <Footer />
    </div>
  );
};

export default OnlineArena;
