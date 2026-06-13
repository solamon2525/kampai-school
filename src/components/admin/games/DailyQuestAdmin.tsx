/**
 * DailyQuestAdmin — แดชบอร์ดแอดมิน: ภารกิจประจำวัน (เดลี่เควส)
 *
 * - ภาพรวม: ใครเข้ามาทำเควสแล้วบ้าง / เสร็จหรือยัง / เหลือกี่วิชา (เลือกวัน + กรองชั้น)
 * - แนวโน้ม + อันดับ streak
 * - ตั้งค่า: เปิด/ปิดวิชาแกน, โบนัสตอนทำครบ, เกณฑ์คะแนนขั้นต่ำต่อเกม
 */
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { Target, Users, CheckCircle2, Flame, Loader2, Save, Search } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  dailyQuestService,
  dailyQuestAdminService,
  type QuestConfig,
} from '@/services/daily-quest.service';

const today = () => new Date().toISOString().slice(0, 10);

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

export const DailyQuestAdmin = () => {
  const [date, setDate] = useState(today());
  const [classFilter, setClassFilter] = useState<string>('all');

  const overviewQuery = useQuery({
    queryKey: ['dq-admin-overview', date],
    queryFn: () => dailyQuestService.getOverview(date),
  });
  const participationQuery = useQuery({
    queryKey: ['dq-admin-participation', date],
    queryFn: () => dailyQuestService.getParticipation(date),
  });
  const trendQuery = useQuery({
    queryKey: ['dq-admin-trend', 30],
    queryFn: () => dailyQuestService.getTrend(30),
  });
  const streakQuery = useQuery({
    queryKey: ['dq-admin-streak', 20],
    queryFn: () => dailyQuestService.getStreakLeaderboard(20),
  });

  const overview = overviewQuery.data;
  const participation = participationQuery.data ?? [];

  const classes = useMemo(
    () => Array.from(new Set(participation.map((p) => p.class).filter(Boolean))).sort() as string[],
    [participation],
  );
  const filtered = useMemo(
    () => (classFilter === 'all' ? participation : participation.filter((p) => p.class === classFilter)),
    [participation, classFilter],
  );

  const trendData = useMemo(
    () => (trendQuery.data ?? []).map((r) => ({ date: r.d.slice(5), 'เข้าร่วม': r.participants, 'ทำครบ': r.all_complete_count })),
    [trendQuery.data],
  );

  return (
    <div className="space-y-6 p-6 sm:p-8">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Target className="h-6 w-6 text-primary" />
          ภารกิจประจำวัน · Daily Quest
        </h1>
        <p className="text-sm text-muted-foreground">
          ติดตามว่าใครเข้ามาทำเควสแล้วบ้าง ทำครบหรือยัง — และตั้งค่าระบบเควส
        </p>
      </header>

      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">วันนี้/รายวัน</TabsTrigger>
          <TabsTrigger value="trend">แนวโน้ม + streak</TabsTrigger>
          <TabsTrigger value="config">ตั้งค่า</TabsTrigger>
        </TabsList>

        {/* ─── รายวัน ─── */}
        <TabsContent value="today" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs">วันที่</Label>
              <Input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} className="w-44" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">ชั้น</Label>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกชั้น</SelectItem>
                  {classes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="เข้าร่วม" value={(overview?.total_participants ?? 0).toLocaleString('th-TH')} icon={Users} />
            <StatCard label="ทำครบทุกวิชา" value={(overview?.all_complete_count ?? 0).toLocaleString('th-TH')} icon={CheckCircle2} accent />
            <StatCard label="วิชาแกน" value={(overview?.required_count ?? 0).toLocaleString('th-TH')} icon={Target} />
            <StatCard label="ยังทำไม่ครบ" value={((overview?.total_participants ?? 0) - (overview?.all_complete_count ?? 0)).toLocaleString('th-TH')} icon={Flame} />
          </div>

          {/* per subject */}
          <div className="flex flex-wrap gap-2">
            {(overview?.subjects ?? []).map((s) => (
              <div key={s.subject_key} className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
                <span>{s.icon ?? '📚'}</span>
                <span className="text-sm font-medium">{s.label}</span>
                <Badge variant="secondary">{s.completed_students} คน</Badge>
              </div>
            ))}
          </div>

          {/* participation table */}
          <Card>
            <CardHeader><CardTitle className="text-base">รายชื่อผู้ทำภารกิจ ({filtered.length} คน)</CardTitle></CardHeader>
            <CardContent>
              {participationQuery.isLoading ? (
                <p className="py-6 text-center text-sm text-muted-foreground">กำลังโหลด…</p>
              ) : filtered.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">ยังไม่มีใครทำเควสในวันนี้</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>นักเรียน</TableHead>
                      <TableHead>ชั้น</TableHead>
                      <TableHead>วิชาที่ผ่าน</TableHead>
                      <TableHead className="text-right">ความคืบหน้า</TableHead>
                      <TableHead className="text-right">สถานะ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p) => (
                      <TableRow key={p.student_id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <PersonAvatar name={p.name} photoUrl={p.photo_url} size="sm" />
                            <span className="text-sm font-medium">{p.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.class ?? '—'}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(overview?.subjects ?? []).map((s) => {
                              const done = p.subjects_done.includes(s.subject_key);
                              return (
                                <span key={s.subject_key} className={cn('rounded px-1.5 py-0.5 text-[11px]', done ? 'bg-emerald-500/15 text-emerald-700' : 'bg-muted text-muted-foreground line-through')}>
                                  {s.icon} {s.label}
                                </span>
                              );
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm">{p.completed_count}/{p.required_count}</TableCell>
                        <TableCell className="text-right">
                          {p.all_complete
                            ? <Badge className="bg-emerald-600">ครบ ✓</Badge>
                            : <Badge variant="outline">เหลือ {p.required_count - p.completed_count}</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── แนวโน้ม + streak ─── */}
        <TabsContent value="trend" className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">ผู้เข้าร่วม vs ทำครบ (30 วัน)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trendData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }} />
                  <Line type="monotone" dataKey="เข้าร่วม" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="ทำครบ" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">อันดับ streak + คะแนนพิเศษสะสม</CardTitle></CardHeader>
            <CardContent className="space-y-1.5">
              {(streakQuery.data ?? []).length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">ยังไม่มีข้อมูล</p>
              ) : (streakQuery.data ?? []).map((s, i) => (
                <div key={s.student_id} className="flex items-center gap-3 rounded-md border border-border px-3 py-1.5">
                  <span className="w-5 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>
                  <PersonAvatar name={s.name} photoUrl={s.photo_url} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <p className="text-[11px] text-muted-foreground">{s.class ?? '—'}</p>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-bold text-amber-600">
                    {s.current_streak > 0 && <Flame className="h-3.5 w-3.5" />}{s.current_streak} วัน
                  </span>
                  <span className="w-20 text-right text-xs text-muted-foreground">{s.total_points.toLocaleString('th-TH')} แต้ม</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── ตั้งค่า ─── */}
        <TabsContent value="config" className="mt-4 space-y-4">
          <ConfigSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
const ConfigSection = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const subjectsQuery = useQuery({ queryKey: ['dq-cfg-subjects'], queryFn: dailyQuestAdminService.listSubjects });
  const configQuery = useQuery({ queryKey: ['dq-cfg-config'], queryFn: dailyQuestAdminService.getConfig });
  const gamesQuery = useQuery({ queryKey: ['dq-cfg-games'], queryFn: dailyQuestAdminService.listGameMinScores });

  const [cfg, setCfg] = useState<QuestConfig | null>(null);
  const effectiveCfg = cfg ?? configQuery.data ?? null;

  const toggleSubject = useMutation({
    mutationFn: ({ key, active }: { key: string; active: boolean }) => dailyQuestAdminService.setSubjectActive(key, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dq-cfg-subjects'] });
      toast({ title: 'บันทึกแล้ว' });
    },
    onError: (e) => toast({ title: 'ผิดพลาด', description: (e as Error).message, variant: 'destructive' }),
  });

  const saveConfig = useMutation({
    mutationFn: (c: QuestConfig) => dailyQuestAdminService.updateConfig(c),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dq-cfg-config'] });
      toast({ title: 'บันทึกโบนัสแล้ว' });
    },
    onError: (e) => toast({ title: 'ผิดพลาด', description: (e as Error).message, variant: 'destructive' }),
  });

  const saveMinScore = useMutation({
    mutationFn: ({ id, value }: { id: string; value: number | null }) => dailyQuestAdminService.setGameMinScore(id, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dq-cfg-games'] });
      toast({ title: 'บันทึกเกณฑ์แล้ว' });
    },
    onError: (e) => toast({ title: 'ผิดพลาด', description: (e as Error).message, variant: 'destructive' }),
  });

  const games = useMemo(() => {
    const list = gamesQuery.data ?? [];
    const q = search.trim().toLowerCase();
    return q ? list.filter((g) => g.title.toLowerCase().includes(q) || (g.subject ?? '').toLowerCase().includes(q)) : list;
  }, [gamesQuery.data, search]);

  return (
    <>
      {/* วิชาแกน */}
      <Card>
        <CardHeader><CardTitle className="text-base">วิชาแกน (เควสประจำวัน)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {subjectsQuery.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (subjectsQuery.data ?? []).map((s) => (
            <div key={s.subject_key} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <span className="text-sm font-medium">{s.icon} {s.label_th} <span className="text-xs text-muted-foreground">({s.subject_key})</span></span>
              <Switch checked={s.is_active} onCheckedChange={(v) => toggleSubject.mutate({ key: s.subject_key, active: v })} />
            </div>
          ))}
          <p className="text-xs text-muted-foreground">ปิดวิชา = นักเรียนไม่ต้องทำวิชานั้นเพื่อให้ครบ (ปรับจำนวนวิชาที่ต้องทำอัตโนมัติ)</p>
        </CardContent>
      </Card>

      {/* โบนัส */}
      <Card>
        <CardHeader><CardTitle className="text-base">คะแนนพิเศษเมื่อทำครบทุกวิชา</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs">แต้มพิเศษ (เก็บแยก)</Label>
            <Input type="number" min={0} className="w-32"
              value={effectiveCfg?.all_complete_points ?? ''}
              onChange={(e) => setCfg({ all_complete_points: Number(e.target.value), all_complete_xp: effectiveCfg?.all_complete_xp ?? 0 })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">โบนัส XP (เข้าระบบเดิม)</Label>
            <Input type="number" min={0} className="w-32"
              value={effectiveCfg?.all_complete_xp ?? ''}
              onChange={(e) => setCfg({ all_complete_points: effectiveCfg?.all_complete_points ?? 0, all_complete_xp: Number(e.target.value) })} />
          </div>
          <Button disabled={!effectiveCfg || saveConfig.isPending} onClick={() => effectiveCfg && saveConfig.mutate(effectiveCfg)}>
            {saveConfig.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
            บันทึก
          </Button>
        </CardContent>
      </Card>

      {/* เกณฑ์ต่อเกม */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base">เกณฑ์คะแนนขั้นต่ำต่อเกม</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="ค้นหาเกม…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 w-48 pl-8 text-sm" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-xs text-muted-foreground">เว้นว่าง = ใช้เกณฑ์อัตโนมัติ (50% ของคะแนนกลางของเกม)</p>
          <div className="max-h-[420px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เกม</TableHead>
                  <TableHead>วิชา</TableHead>
                  <TableHead className="w-48 text-right">เกณฑ์ขั้นต่ำ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {games.map((g) => <MinScoreRow key={g.id} game={g} onSave={(v) => saveMinScore.mutate({ id: g.id, value: v })} saving={saveMinScore.isPending} />)}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

const MinScoreRow = ({ game, onSave, saving }: {
  game: { id: string; title: string; subject: string | null; quest_min_score: number | null };
  onSave: (value: number | null) => void;
  saving: boolean;
}) => {
  const [val, setVal] = useState(game.quest_min_score == null ? '' : String(game.quest_min_score));
  const dirty = (game.quest_min_score == null ? '' : String(game.quest_min_score)) !== val.trim();
  return (
    <TableRow>
      <TableCell className="text-sm font-medium">{game.title}</TableCell>
      <TableCell className="text-xs text-muted-foreground">{game.subject ?? '—'}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Input type="number" min={0} placeholder="auto" value={val}
            onChange={(e) => setVal(e.target.value)} className="h-8 w-24 text-right text-sm" />
          <Button size="sm" variant="outline" className="h-8" disabled={!dirty || saving}
            onClick={() => onSave(val.trim() === '' ? null : Number(val))}>
            บันทึก
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default DailyQuestAdmin;
