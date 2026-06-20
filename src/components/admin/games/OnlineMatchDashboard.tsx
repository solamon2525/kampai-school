/**
 * OnlineMatchDashboard — แดชบอร์ดแอดมิน: สถิติแข่งออนไลน์ (Win/Loss)
 *
 * - วิเคราะห์เกม: ความนิยม/การมีส่วนร่วม/อัตราเล่นคนเดียว/ความสูสี + flag เกมควรปรับปรุง
 * - นักเรียน W/L: leaderboard + head-to-head รายคู่
 * - ประวัติแมตช์: match log + standings
 */
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { Swords, Trophy, Users, AlertTriangle, Crown, Monitor } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { cn } from '@/lib/utils';
import { th } from 'date-fns/locale';
import { format } from 'date-fns';
import {
  onlineMatchService,
  versusMatchService,
  type OnlineGameStat,
  type OnlineStudentRow,
} from '@/services/online-match.service';

const DAYS_OPTIONS = [
  { value: '7', label: '7 วัน' },
  { value: '30', label: '30 วัน' },
  { value: '90', label: '90 วัน' },
  { value: '3650', label: 'ทั้งหมด' },
];

// flag เกมควรปรับปรุง
const gameFlags = (g: OnlineGameStat): string[] => {
  const f: string[] = [];
  if (g.decisive_matches === 0) f.push('ยังไม่มีแมตช์จริง');
  if (g.solo_rate >= 40) f.push('คนเดียวบ่อย');
  if (g.blowout_rate >= 60) f.push('ไม่สูสี (ขาดลอย)');
  if (g.decisive_matches > 0 && (g.repeat_rate ?? 0) < 1.2) f.push('เล่นซ้ำน้อย');
  return f;
};

const StatCard = ({ label, value, icon: Icon, accent }: { label: string; value: string; icon: React.ComponentType<{ className?: string }>; accent?: boolean }) => (
  <Card>
    <CardContent className="flex items-center gap-3 p-4">
      <div className={cn('rounded-lg p-2.5', accent ? 'bg-primary/15' : 'bg-muted')}>
        <Icon className={cn('h-5 w-5', accent ? 'text-primary' : 'text-muted-foreground')} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
    </CardContent>
  </Card>
);

export const OnlineMatchDashboard = () => {
  const [days, setDays] = useState('30');
  const [selectedStudent, setSelectedStudent] = useState<OnlineStudentRow | null>(null);
  const d = Number(days);

  const overviewQuery = useQuery({ queryKey: ['om-overview', d], queryFn: () => onlineMatchService.getOverview(d) });
  const gamesQuery = useQuery({ queryKey: ['om-games', d], queryFn: () => onlineMatchService.getGameStats(d) });
  const lbQuery = useQuery({ queryKey: ['om-lb', d], queryFn: () => onlineMatchService.getStudentLeaderboard(d, 30) });
  const logQuery = useQuery({ queryKey: ['om-log'], queryFn: () => onlineMatchService.getMatchLog(null, 80) });
  const h2hQuery = useQuery({
    queryKey: ['om-h2h', selectedStudent?.student_id],
    queryFn: () => onlineMatchService.getHeadToHead(selectedStudent!.student_id),
    enabled: !!selectedStudent,
  });

  // ─── Local Versus (2 คนจอเดียว) — source='local' ───
  const vsOverviewQuery = useQuery({ queryKey: ['vs-overview', d], queryFn: () => versusMatchService.getOverview(d) });
  const vsLbQuery = useQuery({ queryKey: ['vs-lb', d], queryFn: () => versusMatchService.getLeaderboard(null, d, 30) });
  const vsLogQuery = useQuery({ queryKey: ['vs-log', d], queryFn: () => versusMatchService.getMatchLog(d, 80) });
  const vsOverview = vsOverviewQuery.data;

  const overview = overviewQuery.data;
  const games = gamesQuery.data ?? [];

  const popularityData = useMemo(
    () => games.map((g) => ({ name: g.title, แมตช์: g.decisive_matches, ผู้เล่น: g.unique_players })),
    [games],
  );

  return (
    <div className="space-y-6 p-6 sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Swords className="h-6 w-6 text-primary" />
            สถิติแข่งออนไลน์ · Win/Loss
          </h1>
          <p className="text-sm text-muted-foreground">วิเคราะห์ความนิยม/คุณภาพเกม + ผลแพ้ชนะระหว่างนักเรียน</p>
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>{DAYS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="แมตช์จริง (≥2 คน)" value={(overview?.decisive_matches ?? 0).toLocaleString('th-TH')} icon={Swords} accent />
        <StatCard label="ผู้เล่นออนไลน์" value={(overview?.distinct_players ?? 0).toLocaleString('th-TH')} icon={Users} />
        <StatCard label="เฉลี่ยผู้เล่น/แมตช์" value={String(overview?.avg_players_per_match ?? 0)} icon={Trophy} />
        <StatCard label="อัตราเล่นคนเดียว" value={`${overview?.solo_rate ?? 0}%`} icon={AlertTriangle} />
      </div>

      <Tabs defaultValue="games">
        <TabsList>
          <TabsTrigger value="games">วิเคราะห์เกม</TabsTrigger>
          <TabsTrigger value="students">นักเรียน W/L</TabsTrigger>
          <TabsTrigger value="log">ประวัติแมตช์</TabsTrigger>
          <TabsTrigger value="local">ในห้อง (2 คน)</TabsTrigger>
        </TabsList>

        {/* ─── วิเคราะห์เกม ─── */}
        <TabsContent value="games" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">ความนิยม / การมีส่วนร่วม</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(160, popularityData.length * 42)}>
                <BarChart data={popularityData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }} />
                  <Bar dataKey="แมตช์" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                  <Bar dataKey="ผู้เล่น" fill="#10b981" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">ตารางวิเคราะห์รายเกม</CardTitle></CardHeader>
            <CardContent>
              {gamesQuery.isLoading ? <p className="py-6 text-center text-sm text-muted-foreground">กำลังโหลด…</p>
              : games.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">ยังไม่มีการแข่งออนไลน์</p>
              : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>เกม</TableHead>
                      <TableHead className="text-right">แมตช์จริง</TableHead>
                      <TableHead className="text-right">ผู้เล่น</TableHead>
                      <TableHead className="text-right" title="แมตช์เฉลี่ยต่อผู้เล่น 1 คน">เล่นซ้ำ</TableHead>
                      <TableHead className="text-right" title="แมตช์ที่ไม่มีคู่แข่ง">คนเดียว</TableHead>
                      <TableHead className="text-right" title="ผู้ชนะทิ้งห่าง ≥2 เท่า">ขาดลอย</TableHead>
                      <TableHead>สถานะ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {games.map((g) => {
                      const flags = gameFlags(g);
                      return (
                        <TableRow key={g.game_slug}>
                          <TableCell className="text-sm font-medium">{g.title}</TableCell>
                          <TableCell className="text-right font-bold">{g.decisive_matches}</TableCell>
                          <TableCell className="text-right text-sm">{g.unique_players}</TableCell>
                          <TableCell className="text-right text-sm">{g.repeat_rate ?? '—'}</TableCell>
                          <TableCell className="text-right text-sm">{g.solo_rate}%</TableCell>
                          <TableCell className="text-right text-sm">{g.blowout_rate}%</TableCell>
                          <TableCell>
                            {flags.length === 0
                              ? <Badge className="bg-emerald-600">ดี</Badge>
                              : <div className="flex flex-wrap gap-1">{flags.map((f) => <Badge key={f} variant="outline" className="border-amber-400 text-amber-600 text-[10px]">{f}</Badge>)}</div>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── นักเรียน W/L ─── */}
        <TabsContent value="students" className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">อันดับนักเรียน (กดเพื่อดูตัวต่อตัว)</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {(lbQuery.data ?? []).length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">ยังไม่มีข้อมูล</p>
              : (lbQuery.data ?? []).map((s, i) => (
                <button key={s.student_id} onClick={() => setSelectedStudent(s)}
                  className={cn('flex w-full items-center gap-3 rounded-md border px-3 py-1.5 text-left transition-colors',
                    selectedStudent?.student_id === s.student_id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40')}>
                  <span className="w-5 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>
                  <PersonAvatar name={s.name} photoUrl={s.photo_url} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <p className="text-[11px] text-muted-foreground">{s.class ?? '—'} · พบ {s.distinct_opponents} คน</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">{s.wins}<span className="text-muted-foreground font-normal">W</span> · {s.losses}<span className="text-muted-foreground font-normal">L</span></p>
                    <p className="text-[11px] text-muted-foreground">ชนะ {s.win_rate ?? 0}%</p>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                {selectedStudent ? `ตัวต่อตัว · ${selectedStudent.name}` : 'เลือกนักเรียนเพื่อดูสถิติตัวต่อตัว'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedStudent ? <p className="py-6 text-center text-sm text-muted-foreground">← กดชื่อนักเรียนทางซ้าย</p>
              : h2hQuery.isLoading ? <p className="py-6 text-center text-sm text-muted-foreground">กำลังโหลด…</p>
              : (h2hQuery.data ?? []).length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">ยังไม่เคยเจอคู่แข่ง</p>
              : (
                <div className="space-y-1.5">
                  {(h2hQuery.data ?? []).map((o) => (
                    <div key={o.opponent_id} className="flex items-center gap-3 rounded-md border border-border px-3 py-1.5">
                      <PersonAvatar name={o.name} photoUrl={o.photo_url} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{o.name}</p>
                        <p className="text-[11px] text-muted-foreground">{o.class ?? '—'} · {o.matches} แมตช์</p>
                      </div>
                      <p className="text-sm font-bold">
                        <span className="text-emerald-600">{o.wins} ชนะ</span>
                        <span className="text-muted-foreground"> · </span>
                        <span className="text-rose-600">{o.losses} แพ้</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── ประวัติแมตช์ ─── */}
        <TabsContent value="log" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">แมตช์ล่าสุด</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(logQuery.data ?? []).length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">ยังไม่มีแมตช์</p>
              : (logQuery.data ?? []).map((mt) => (
                <div key={mt.match_id} className="rounded-lg border border-border p-3">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{mt.title}</span>
                      <Badge variant="secondary" className="text-[10px]">ห้อง {mt.room_code}</Badge>
                      {mt.is_tournament && <Badge className="bg-amber-600 text-[10px]">ลีก</Badge>}
                      {!mt.is_decisive && <Badge variant="outline" className="text-[10px]">คนเดียว</Badge>}
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
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── ในห้อง (2 คนจอเดียว) — Local Versus ─── */}
        <TabsContent value="local" className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="แมตช์ในห้อง (≥2 คน)" value={(vsOverview?.decisive_matches ?? 0).toLocaleString('th-TH')} icon={Monitor} accent />
            <StatCard label="ผู้เล่น" value={(vsOverview?.distinct_players ?? 0).toLocaleString('th-TH')} icon={Users} />
            <StatCard label="แมตช์ทั้งหมด" value={(vsOverview?.total_matches ?? 0).toLocaleString('th-TH')} icon={Swords} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Crown className="h-4 w-4 text-amber-500" /> แชมป์ห้อง (ชนะมากสุด)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {(vsLbQuery.data ?? []).length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">ยังไม่มีแมตช์ในห้อง</p>
                : (vsLbQuery.data ?? []).map((s, i) => (
                  <div key={s.student_id} className="flex w-full items-center gap-3 rounded-md border border-border px-3 py-1.5">
                    <span className="w-5 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>
                    <PersonAvatar name={s.name} photoUrl={s.photo_url} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      <p className="text-[11px] text-muted-foreground">{s.class ?? '—'} · {s.matches} แมตช์</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600">{s.wins}<span className="text-muted-foreground font-normal">W</span> · {s.losses}<span className="text-muted-foreground font-normal">L</span></p>
                      <p className="text-[11px] text-muted-foreground">ชนะ {s.win_rate ?? 0}%</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">แมตช์ในห้องล่าสุด</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(vsLogQuery.data ?? []).length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">ยังไม่มีแมตช์</p>
                : (vsLogQuery.data ?? []).map((mt) => (
                  <div key={mt.match_id} className="rounded-lg border border-border p-3">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{mt.title}</span>
                      <span className="text-[11px] text-muted-foreground">{format(new Date(mt.finished_at), 'd MMM HH:mm', { locale: th })}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(mt.standings ?? []).map((p, idx) => (
                        <div key={idx} className={cn('flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs',
                          p.is_winner ? 'border-amber-400 bg-amber-50 font-semibold' : 'border-border')}>
                          <span className="text-muted-foreground">{p.rank}.</span>
                          <PersonAvatar name={p.name} photoUrl={p.photo_url} size="xs" />
                          <span>{p.name}</span>
                          <span className="text-muted-foreground">{p.rounds_won != null ? `${p.rounds_won} ยก` : p.score}</span>
                          {p.is_winner && <span>👑</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OnlineMatchDashboard;
