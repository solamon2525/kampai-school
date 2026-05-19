import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as LucideIcons from 'lucide-react';
import { Lock, Trophy, TrendingUp, ChevronUpCircle, Send, Gamepad2 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthProvider';
import {
  gameStatsService,
  gameSessionsService,
  gameAchievementsService,
  gamePlayService,
  trackedGamesService,
  levelFromXp,
} from '@/services/game-play.service';
import { cn } from '@/lib/utils';

type LucideMap = Record<string, React.ComponentType<{ className?: string }>>;
const Icons = LucideIcons as unknown as LucideMap;
const resolveIcon = (name: string | null) =>
  (name && Icons[name]) || LucideIcons.Sparkles;

interface Props {
  studentId: string;
}

export const GamesSummary = ({ studentId }: Props) => {
  const [selectedGame, setSelectedGame] = useState<string>('pizza-master-chef');

  const tracked = useQuery({
    queryKey: ['tracked-games'],
    queryFn: async () => (await trackedGamesService.listTracked()).data ?? [],
  });

  const sessions = useQuery({
    queryKey: ['student-game-sessions', studentId, selectedGame],
    queryFn: async () =>
      (await gameSessionsService.getByStudent(studentId, selectedGame, 30)).data ?? [],
    enabled: !!studentId && !!selectedGame,
  });

  const stats = useQuery({
    queryKey: ['student-game-stats', studentId, selectedGame],
    queryFn: async () =>
      (await gameStatsService.getForStudent(studentId, selectedGame)).data,
    enabled: !!studentId && !!selectedGame,
  });

  const catalog = useQuery({
    queryKey: ['game-catalog', selectedGame],
    queryFn: async () => (await gameAchievementsService.getCatalog(selectedGame)).data ?? [],
    enabled: !!selectedGame,
  });

  const unlocked = useQuery({
    queryKey: ['student-game-unlocked', studentId, selectedGame],
    queryFn: async () =>
      (await gameAchievementsService.getUnlocked(studentId, selectedGame)).data ?? [],
    enabled: !!studentId && !!selectedGame,
  });

  const unlockedIds = useMemo(() => {
    const set = new Set<string>();
    (unlocked.data ?? []).forEach((row) => {
      const a = (row as { game_achievements_catalog?: { id?: string } | null })
        .game_achievements_catalog;
      if (a?.id) set.add(a.id);
    });
    return set;
  }, [unlocked.data]);

  const levelInfo = levelFromXp(stats.data?.total_xp ?? 0);
  const improvement = useMemo(() => {
    const f = Number(stats.data?.first_5_avg ?? 0);
    const l = Number(stats.data?.last_5_avg ?? 0);
    if (!f || !stats.data || (stats.data.plays_count ?? 0) < 6) return null;
    return (l / f - 1) * 100;
  }, [stats.data]);

  const trendData = useMemo(() => {
    const rows = (sessions.data ?? []).slice().reverse();
    return rows.map((s, i) => ({ idx: i + 1, score: s.score }));
  }, [sessions.data]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Gamepad2 className="h-4 w-4 text-primary" />
          การเล่นเกมการศึกษา
        </h3>
        <Select value={selectedGame} onValueChange={setSelectedGame}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(tracked.data ?? []).map((g) => (
              <SelectItem key={g.game_slug ?? g.id} value={g.game_slug ?? ''}>
                {g.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="ครั้งที่เล่น" value={(stats.data?.plays_count ?? 0).toLocaleString('th-TH')} />
          <Stat label="คะแนนสูงสุด" value={(stats.data?.personal_best ?? 0).toLocaleString('th-TH')} />
          <Stat
            label={`Level (${(stats.data?.total_xp ?? 0).toLocaleString('th-TH')} XP)`}
            value={`Lv.${levelInfo.level}`}
          />
          <Stat
            label="พัฒนาการ"
            value={improvement === null ? '—' : `${improvement >= 0 ? '+' : ''}${improvement.toFixed(0)}%`}
            valueClass={improvement === null ? 'text-muted-foreground' : improvement >= 0 ? 'text-green-600' : 'text-destructive'}
            icon={improvement !== null && improvement > 0 ? TrendingUp : undefined}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">แนวโน้มคะแนน</CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">ยังไม่มีข้อมูล</p>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="idx" tick={{ fontSize: 10 }} label={{ value: 'ครั้งที่', fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4 text-amber-500" />
              ป้ายความสำเร็จ ({unlockedIds.size}/{(catalog.data ?? []).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(catalog.data ?? []).map((a) => {
                const Icon = resolveIcon(a.icon);
                const isUnlocked = unlockedIds.has(a.id);
                return (
                  <div
                    key={a.id}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-lg border p-2 text-center',
                      isUnlocked ? 'border-primary/30 bg-primary/5' : 'border-border opacity-50',
                    )}
                    title={a.description_th ?? ''}
                  >
                    {isUnlocked ? (
                      <Icon className="h-5 w-5 text-primary" />
                    ) : (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    )}
                    <p className="text-[10px] font-medium leading-tight text-foreground">
                      {a.title_th}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <SessionsTable sessions={sessions.data ?? []} studentId={studentId} gameSlug={selectedGame} />
    </div>
  );
};

const Stat = ({
  label,
  value,
  valueClass,
  icon: Icon,
}: {
  label: string;
  value: string;
  valueClass?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={cn('mt-0.5 flex items-center gap-1 text-2xl font-bold text-foreground', valueClass)}>
      {Icon && <Icon className="h-5 w-5" />}
      {value}
    </p>
  </div>
);

// ─── Sessions table + push-to-score-records dialog ──────────────────────────
type SessionRow = {
  id: string;
  game_slug: string;
  score: number;
  mode: string | null;
  duration_sec: number | null;
  xp_earned: number;
  pushed_to_score_record_id: string | null;
  created_at: string;
};

const SessionsTable = ({
  sessions,
  studentId,
  gameSlug,
}: {
  sessions: SessionRow[];
  studentId: string;
  gameSlug: string;
}) => {
  const { role } = useAuth();
  const canPush = role === 'admin' || role === 'teacher';
  const [pushSession, setPushSession] = useState<SessionRow | null>(null);

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          ยังไม่มีประวัติการเล่น
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">ประวัติการเล่นล่าสุด ({sessions.length} ครั้ง)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2">วันที่</th>
                  <th className="py-2">โหมด</th>
                  <th className="py-2 text-right">คะแนน</th>
                  <th className="py-2 text-right">XP</th>
                  <th className="py-2 text-right">เวลา</th>
                  <th className="py-2 text-right">การส่งเข้าคะแนน</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} className="border-b border-border/50">
                    <td className="py-2 text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleString('th-TH', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="py-2 text-xs">{s.mode ?? '—'}</td>
                    <td className="py-2 text-right font-semibold">
                      {s.score.toLocaleString('th-TH')}
                    </td>
                    <td className="py-2 text-right text-xs text-muted-foreground">
                      +{s.xp_earned}
                    </td>
                    <td className="py-2 text-right text-xs text-muted-foreground">
                      {s.duration_sec ? `${s.duration_sec}s` : '—'}
                    </td>
                    <td className="py-2 text-right">
                      {s.pushed_to_score_record_id ? (
                        <Badge variant="outline" className="gap-1 text-[10px]">
                          <ChevronUpCircle className="h-3 w-3" />
                          ส่งแล้ว
                        </Badge>
                      ) : canPush ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => setPushSession(s)}
                        >
                          <Send className="mr-1 h-3 w-3" />
                          ส่งเข้าคะแนน
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <PushDialog
        session={pushSession}
        studentId={studentId}
        gameSlug={gameSlug}
        onClose={() => setPushSession(null)}
      />
    </>
  );
};

const PushDialog = ({
  session,
  studentId,
  gameSlug,
  onClose,
}: {
  session: SessionRow | null;
  studentId: string;
  gameSlug: string;
  onClose: () => void;
}) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [scoreType, setScoreType] = useState<'เก็บ' | 'กลางภาค' | 'ปลายภาค'>('เก็บ');
  const [maxScore, setMaxScore] = useState('10');
  const [normalized, setNormalized] = useState('');
  const [semester, setSemester] = useState<'1' | '2'>(
    new Date().getMonth() < 5 ? '2' : '1',
  );
  const [academicYear, setAcademicYear] = useState(
    String(new Date().getFullYear() + 543 - (new Date().getMonth() < 4 ? 1 : 0)),
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!session) return;
    const max = Number(maxScore);
    const score = normalized.trim() === '' ? max : Number(normalized);
    if (!Number.isFinite(max) || max <= 0) {
      toast({ title: 'คะแนนเต็มต้องมากกว่า 0', variant: 'destructive' });
      return;
    }
    if (!Number.isFinite(score) || score < 0 || score > max) {
      toast({ title: 'คะแนนต้องอยู่ระหว่าง 0 ถึงคะแนนเต็ม', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await gamePlayService.pushToScoreRecord({
        sessionId: session.id,
        scoreType,
        maxScore: max,
        normalizedScore: score,
        semester,
        academicYear,
      });
      toast({ title: 'บันทึกคะแนนเรียบร้อย' });
      qc.invalidateQueries({ queryKey: ['student-game-sessions', studentId, gameSlug] });
      onClose();
    } catch (err) {
      const msg = (err as Error).message ?? '';
      toast({
        title: 'ส่งคะแนนไม่สำเร็จ',
        description: msg.includes('already_pushed') ? 'บันทึกนี้ส่งไปแล้ว' : msg,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!session} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ส่งคะแนนเข้าสมุดคะแนน</DialogTitle>
        </DialogHeader>
        {session && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <p>
                คะแนนจากเกม: <span className="font-semibold">{session.score.toLocaleString('th-TH')}</span>
                {session.mode && <span className="text-muted-foreground"> · โหมด {session.mode}</span>}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>ประเภทคะแนน</Label>
                <Select value={scoreType} onValueChange={(v) => setScoreType(v as typeof scoreType)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="เก็บ">คะแนนเก็บ</SelectItem>
                    <SelectItem value="กลางภาค">กลางภาค</SelectItem>
                    <SelectItem value="ปลายภาค">ปลายภาค</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>ภาคเรียน</Label>
                <Select value={semester} onValueChange={(v) => setSemester(v as '1' | '2')}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>คะแนนเต็ม</Label>
                <Input
                  type="number"
                  min="1"
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>คะแนนที่ได้ (เว้นว่าง = คะแนนเต็ม)</Label>
                <Input
                  type="number"
                  min="0"
                  value={normalized}
                  onChange={(e) => setNormalized(e.target.value)}
                  placeholder={`เช่น ${maxScore}`}
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label>ปีการศึกษา (พ.ศ.)</Label>
                <Input
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            ยกเลิก
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'กำลังบันทึก…' : 'บันทึก'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
