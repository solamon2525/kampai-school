/**
 * DailyQuestStats — หน้าสาธารณะจอใหญ่: สถิติภารกิจประจำวัน (เดลี่เควส)
 *
 * KPI วันนี้ (เข้าร่วม/ทำครบ/ต่อวิชา) + อันดับ streak + แนวโน้มรายวัน (recharts)
 * โครงตาม WasteBankStats — refetch อัตโนมัติทุก 30 วิ
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { Sparkles, Flame, Trophy, CheckCircle2, Users } from 'lucide-react';

import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { cn } from '@/lib/utils';
import { dailyQuestService } from '@/services/daily-quest.service';

const MEDALS = ['🥇', '🥈', '🥉'];
const MEDAL_BG = ['border-amber-300 bg-amber-50', 'border-slate-300 bg-slate-50', 'border-orange-300 bg-orange-50'];

const KpiTile = ({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) => (
  <Card className={cn('overflow-hidden', accent && 'border-primary/30')}>
    <CardContent className="p-3.5 md:p-4">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {icon}{label}
      </div>
      <p className={cn('mt-1 text-2xl md:text-3xl font-extrabold tabular-nums', accent ? 'text-primary' : 'text-foreground')}>
        {value}
      </p>
    </CardContent>
  </Card>
);

const DailyQuestStats = () => {
  const overviewQuery = useQuery({
    queryKey: ['dq-overview'],
    queryFn: () => dailyQuestService.getOverview(),
    refetchInterval: 30_000,
  });
  const trendQuery = useQuery({
    queryKey: ['dq-trend', 14],
    queryFn: () => dailyQuestService.getTrend(14),
    refetchInterval: 60_000,
  });
  const streakQuery = useQuery({
    queryKey: ['dq-streak', 20],
    queryFn: () => dailyQuestService.getStreakLeaderboard(20),
    refetchInterval: 30_000,
  });

  const overview = overviewQuery.data;
  const trend = trendQuery.data ?? [];
  const streak = streakQuery.data ?? [];

  const trendData = useMemo(
    () => trend.map((r) => ({
      date: r.d.slice(5),           // MM-DD
      'เข้าร่วม': r.participants,
      'ทำครบ': r.all_complete_count,
    })),
    [trend],
  );

  const subjectData = useMemo(
    () => (overview?.subjects ?? []).map((s) => ({
      name: `${s.icon ?? ''} ${s.label}`,
      'ผ่านแล้ว': s.completed_students,
    })),
    [overview],
  );

  const podium = streak.filter((s) => s.current_streak > 0).slice(0, 3);
  const rest = streak.slice(podium.length);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="สถิติภารกิจประจำวัน — Daily Quest" description="ใครเข้ามาทำภารกิจเควสประจำวันแล้วบ้าง ทำครบหรือยัง — สถิติเรียลไทม์" />
      <SiteHeader />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-5 md:py-7 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/15 mb-3">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-1">ภารกิจประจำวัน · Daily Quest</h1>
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
            เล่นเกมเก็บคะแนนให้ครบทุกวิชาแกน (คณิต · ไทย · อังกฤษ) ทุกวัน รับคะแนนพิเศษ + สะสม streak 🔥
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-4 md:py-6 space-y-4">
        {/* KPI วันนี้ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiTile icon={<Users className="h-3.5 w-3.5" />} label="เข้าร่วมวันนี้" value={(overview?.total_participants ?? 0).toLocaleString('th-TH')} />
          <KpiTile icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="ทำครบทุกวิชา" value={(overview?.all_complete_count ?? 0).toLocaleString('th-TH')} accent />
          <KpiTile icon={<Trophy className="h-3.5 w-3.5" />} label="จำนวนวิชาแกน" value={(overview?.required_count ?? 0).toLocaleString('th-TH')} />
          <KpiTile icon={<Flame className="h-3.5 w-3.5" />} label="streak สูงสุด" value={(streak[0]?.current_streak ?? 0).toLocaleString('th-TH')} />
        </div>

        {/* per-subject วันนี้ */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-foreground mb-3">ผ่านเควสแต่ละวิชาวันนี้</h3>
            <div className="flex flex-wrap gap-2">
              {(overview?.subjects ?? []).map((s) => (
                <div key={s.subject_key} className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
                  <span>{s.icon ?? '📚'}</span>
                  <span className="text-sm font-medium text-foreground">{s.label}</span>
                  <Badge variant="secondary" className="font-bold">{s.completed_students.toLocaleString('th-TH')} คน</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="streak">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="streak" className="gap-1.5"><Flame className="h-4 w-4" /> อันดับ streak</TabsTrigger>
            <TabsTrigger value="trend" className="gap-1.5"><Trophy className="h-4 w-4" /> แนวโน้ม</TabsTrigger>
          </TabsList>

          {/* Streak leaderboard */}
          <TabsContent value="streak" className="mt-4 space-y-3">
            {streak.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">ยังไม่มีใครทำภารกิจครบ</CardContent></Card>
            ) : (
              <>
                {podium.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 md:gap-3 items-end max-w-2xl mx-auto">
                    {podium.map((s, idx) => (
                      <div key={s.student_id} className={cn('flex flex-col items-center text-center p-2 md:p-3 rounded-2xl border-2', MEDAL_BG[idx])}>
                        <span className="mb-1 text-xl">{MEDALS[idx]}</span>
                        <PersonAvatar name={s.name} photoUrl={s.photo_url} size="lg" className="ring-2 ring-offset-2 ring-offset-background ring-primary/20" />
                        <p className="font-semibold text-sm mt-1.5 leading-tight">{s.name}</p>
                        {s.class && <Badge variant="outline" className="mt-1 text-[10px]">{s.class}</Badge>}
                        <p className="mt-1 flex items-center gap-1 font-bold text-amber-600"><Flame className="h-3.5 w-3.5" />{s.current_streak} วัน</p>
                        <p className="text-[11px] text-muted-foreground">{s.total_points.toLocaleString('th-TH')} แต้มพิเศษ</p>
                      </div>
                    ))}
                  </div>
                )}
                {rest.length > 0 && (
                  <Card className="max-w-2xl mx-auto">
                    <CardContent className="p-0 divide-y divide-border">
                      {rest.map((s, i) => (
                        <div key={s.student_id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/40">
                          <span className="w-6 text-center text-sm font-bold text-muted-foreground">{podium.length + i + 1}</span>
                          <PersonAvatar name={s.name} photoUrl={s.photo_url} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{s.name}</p>
                            <p className="text-[11px] text-muted-foreground">{s.class ?? '—'}</p>
                          </div>
                          <div className="text-right">
                            <p className="flex items-center gap-1 justify-end text-sm font-bold text-amber-600">
                              {s.current_streak > 0 && <Flame className="h-3.5 w-3.5" />}{s.current_streak} วัน
                            </p>
                            <p className="text-[11px] text-muted-foreground">{s.total_points.toLocaleString('th-TH')} แต้ม</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Trend charts */}
          <TabsContent value="trend" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-bold text-foreground mb-3">ผู้เข้าร่วม vs ทำครบ (14 วัน)</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={trendData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="เข้าร่วม" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="ทำครบ" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-bold text-foreground mb-3">ผ่านเควสแต่ละวิชาวันนี้</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={subjectData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
                      <Tooltip />
                      <Bar dataKey="ผ่านแล้ว" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <p className="text-center text-xs text-muted-foreground pb-2">
          อัปเดตอัตโนมัติ · {overview?.date ?? ''}
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default DailyQuestStats;
