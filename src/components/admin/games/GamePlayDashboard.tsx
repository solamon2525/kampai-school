import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Gamepad2, Trophy, Users, Sparkles, Calendar } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import {
  gameSessionsService,
  gamePlayService,
  trackedGamesService,
} from '@/services/game-play.service';

const PIZZA_SLUG = 'pizza-master-chef';

export const GamePlayDashboard = () => {
  // tracked games list
  const gamesQuery = useQuery({
    queryKey: ['tracked-games'],
    queryFn: async () => {
      const { data } = await trackedGamesService.listTracked();
      return data ?? [];
    },
  });

  // recent sessions (last 30 days, all tracked games)
  const sessionsQuery = useQuery({
    queryKey: ['game-sessions-recent'],
    queryFn: async () => {
      const startISO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endISO = new Date().toISOString();
      const { data } = await gameSessionsService.getInDateRange(null, startISO, endISO);
      return data ?? [];
    },
  });

  // pilot leaderboard (Pizza)
  const leaderboardQuery = useQuery({
    queryKey: ['game-leaderboard', PIZZA_SLUG],
    queryFn: () => gamePlayService.getLeaderboard(PIZZA_SLUG, 10),
  });

  const stats = useMemo(() => {
    const sessions = sessionsQuery.data ?? [];
    const todayKey = new Date().toISOString().slice(0, 10);
    const unique = new Set<string>();
    let xpToday = 0;
    let playsToday = 0;
    sessions.forEach((s) => {
      if (s.student_id) unique.add(s.student_id);
      const dayKey = (s.created_at ?? '').slice(0, 10);
      if (dayKey === todayKey) {
        playsToday += 1;
        xpToday += s.xp_earned ?? 0;
      }
    });
    return {
      total: sessions.length,
      unique: unique.size,
      playsToday,
      xpToday,
    };
  }, [sessionsQuery.data]);

  // plays per day (last 14 days)
  const playsPerDay = useMemo(() => {
    const sessions = sessionsQuery.data ?? [];
    const map = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const k = d.toISOString().slice(0, 10);
      map.set(k, 0);
    }
    sessions.forEach((s) => {
      const k = (s.created_at ?? '').slice(0, 10);
      if (map.has(k)) map.set(k, (map.get(k) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([k, v]) => ({
      day: k.slice(5).replace('-', '/'),
      plays: v,
    }));
  }, [sessionsQuery.data]);

  // plays per game
  const playsPerGame = useMemo(() => {
    const sessions = sessionsQuery.data ?? [];
    const map = new Map<string, number>();
    sessions.forEach((s) => {
      map.set(s.game_slug, (map.get(s.game_slug) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([slug, count]) => ({ slug, count }));
  }, [sessionsQuery.data]);

  return (
    <div className="space-y-6 p-6 sm:p-8">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Gamepad2 className="h-6 w-6 text-primary" />
          Dashboard เกมการศึกษา
        </h1>
        <p className="text-sm text-muted-foreground">
          ติดตามการเล่นเกมและพัฒนาการของนักเรียน (ช่วง 30 วันล่าสุด)
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="จำนวนครั้งที่เล่น (30 วัน)" value={stats.total.toLocaleString('th-TH')} icon={Gamepad2} />
        <StatCard label="นักเรียนที่เล่น" value={stats.unique.toLocaleString('th-TH')} icon={Users} />
        <StatCard label="เล่นวันนี้" value={stats.playsToday.toLocaleString('th-TH')} icon={Calendar} />
        <StatCard label="XP แจกวันนี้" value={stats.xpToday.toLocaleString('th-TH')} icon={Sparkles} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">เล่นต่อวัน (14 วันล่าสุด)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={playsPerDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Bar dataKey="plays" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">เกมที่เล่นมากที่สุด</CardTitle>
          </CardHeader>
          <CardContent>
            {playsPerGame.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                ยังไม่มีการเล่นในช่วงนี้
              </p>
            ) : (
              <div className="space-y-2">
                {playsPerGame
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 8)
                  .map((row) => {
                    const game = gamesQuery.data?.find((g) => g.game_slug === row.slug);
                    return (
                      <div
                        key={row.slug}
                        className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2"
                      >
                        <span className="text-sm font-medium text-foreground">
                          {game?.title ?? row.slug}
                        </span>
                        <Badge variant="secondary">{row.count.toLocaleString('th-TH')} ครั้ง</Badge>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-amber-500" />
            อันดับสูงสุด — Pizza Master Chef
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaderboardQuery.isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">กำลังโหลด...</p>
          ) : (leaderboardQuery.data ?? []).length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">ยังไม่มีคะแนน</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>นักเรียน</TableHead>
                  <TableHead>ชั้น</TableHead>
                  <TableHead className="text-right">คะแนนสูงสุด</TableHead>
                  <TableHead className="text-right">ครั้งที่เล่น</TableHead>
                  <TableHead className="text-right">XP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(leaderboardQuery.data ?? []).map((row, i) => (
                  <TableRow key={row.student_id}>
                    <TableCell className="font-semibold text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <PersonAvatar
                          name={row.display_name}
                          photoUrl={row.photo_url}
                          size="sm"
                        />
                        <span className="text-sm font-medium text-foreground">
                          {row.display_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.class_label ?? '—'}
                    </TableCell>
                    <TableCell className="text-right font-bold text-foreground">
                      {row.personal_best.toLocaleString('th-TH')}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {row.plays_count.toLocaleString('th-TH')}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {row.total_xp.toLocaleString('th-TH')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const StatCard = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) => (
  <Card>
    <CardContent className="flex items-center gap-3 p-5">
      <div className="rounded-lg bg-primary/10 p-2.5">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
    </CardContent>
  </Card>
);
