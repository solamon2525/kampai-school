/**
 * GameDashboard.tsx — แดชบอดคะแนน/อันดับของเกม (แยกออกจากตัวเกม)
 * Route: /play/:gameSlug/dashboard  (เริ่มใช้กับ vocab-hub)
 *
 * นักเรียนระบุตัวด้วย "รหัสนักเรียน" (เหมือน /play) — ไม่ได้ล็อกอิน (anon)
 * จึงอ่านข้อมูลผ่าน RPC get_game_leaderboard เท่านั้น (SECURITY DEFINER, anon เรียกได้)
 * สถิติของฉัน = หา row ตัวเองจาก leaderboard (game_student_stats/game_sessions อ่านตรงไม่ได้เพราะ RLS)
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Gamepad2, Loader2, Trophy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { cn } from '@/lib/utils';
import {
  gamePlayService,
  levelFromXp,
  trackedGamesService,
  type StudentLookup,
} from '@/services/game-play.service';

const STUDENT_CODE_KEY = 'kampai_student_code';

const GameDashboard = () => {
  const { gameSlug = '' } = useParams<{ gameSlug: string }>();
  const navigate = useNavigate();

  const [codeInput, setCodeInput] = useState('');
  const [student, setStudent] = useState<StudentLookup | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // ชื่อเกม (educational_hub_items อ่าน published แบบ anon ได้ — เหมือน /play)
  const gameQuery = useQuery({
    queryKey: ['tracked-game', gameSlug],
    queryFn: async () => {
      const { data, error } = await trackedGamesService.getBySlug(gameSlug);
      if (error) throw error;
      return data;
    },
    enabled: !!gameSlug,
  });
  const resolvedSlug = gameQuery.data?.game_slug || gameSlug;
  const gameTitle = gameQuery.data?.title ?? 'เกม';

  // ─── lookup รหัสนักเรียน ─────────────────────────────────────────────────
  const handleLookup = useCallback(async (overrideCode?: string) => {
    const code = (overrideCode ?? codeInput).trim();
    if (!code) return;
    setLookupLoading(true);
    setLookupError(null);
    try {
      const found = await gamePlayService.lookupStudent(code);
      if (!found) {
        setLookupError('ไม่พบรหัสนักเรียนนี้ ลองใหม่อีกครั้ง');
        localStorage.removeItem(STUDENT_CODE_KEY);
        return;
      }
      setStudent(found);
      setCodeInput(code);
      localStorage.setItem(STUDENT_CODE_KEY, code);
    } catch {
      setLookupError('เกิดข้อผิดพลาด ลองใหม่อีกครั้ง');
    } finally {
      setLookupLoading(false);
    }
  }, [codeInput]);

  // auto-login จาก localStorage (เหมือน /play)
  useEffect(() => {
    const saved = localStorage.getItem(STUDENT_CODE_KEY);
    if (saved) {
      setCodeInput(saved);
      handleLookup(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── leaderboard (anon-safe RPC) — ใช้สร้างทั้งอันดับ + สถิติของฉัน ───────
  const leaderboardQuery = useQuery({
    queryKey: ['game-leaderboard', resolvedSlug, 50],
    queryFn: () => gamePlayService.getLeaderboard(resolvedSlug, 50),
    enabled: !!resolvedSlug,
  });
  const leaderboard = useMemo(() => leaderboardQuery.data ?? [], [leaderboardQuery.data]);

  const myIndex = useMemo(
    () => (student ? leaderboard.findIndex((r) => r.student_id === student.id) : -1),
    [leaderboard, student],
  );
  const myRow = myIndex >= 0 ? leaderboard[myIndex] : null;
  const myLevel = levelFromXp(myRow?.total_xp ?? 0).level;

  // ─── หน้ากรอกรหัส (ยังไม่ระบุตัว) ─────────────────────────────────────────
  if (!student) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader title={gameTitle} gameSlug={gameSlug} />
        <main className="mx-auto w-full max-w-5xl p-4 sm:p-6">
          <Card className="mx-auto mt-8 max-w-md">
            <CardContent className="space-y-5 p-6 sm:p-8">
              <div className="text-center">
                <h2 className="text-xl font-bold text-foreground">กรอกรหัสนักเรียน</h2>
                <p className="mt-1 text-sm text-muted-foreground">เพื่อดูคะแนนและอันดับของหนู</p>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLookup();
                }}
                className="space-y-3"
              >
                <Input
                  autoFocus
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="เช่น 1234"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.replace(/\s/g, ''))}
                  className="h-14 text-center text-2xl tracking-widest"
                  maxLength={20}
                />
                {lookupError && (
                  <p className="text-center text-sm text-destructive" role="alert">
                    {lookupError}
                  </p>
                )}
                <Button
                  type="submit"
                  className="h-12 w-full text-base"
                  disabled={!codeInput.trim() || lookupLoading}
                >
                  {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'ดูคะแนน'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // ─── หน้าแดชบอด ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title={gameTitle} gameSlug={gameSlug} />
      <main className="mx-auto w-full max-w-5xl space-y-4 p-4 sm:p-6">
        {/* สถิติของฉัน */}
        <Card>
          <CardContent className="flex flex-wrap items-center gap-4 p-5">
            <PersonAvatar
              name={student.display_name}
              photoUrl={student.photo_url}
              size="lg"
              className="h-16 w-16 text-xl ring-2 ring-primary/20"
            />
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold text-foreground">{student.display_name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {student.class_label && <Badge variant="secondary">{student.class_label}</Badge>}
                <Badge variant="outline">Lv. {myLevel}</Badge>
                {myRow && <Badge variant="outline">อันดับ #{myIndex + 1}</Badge>}
              </div>
            </div>
            {myRow ? (
              <div className="flex gap-5 text-center">
                <Stat label="คะแนนสูงสุด" value={myRow.personal_best.toLocaleString('th-TH')} />
                <Stat label="ครั้งที่เล่น" value={myRow.plays_count.toLocaleString('th-TH')} />
                <Stat label="XP รวม" value={myRow.total_xp.toLocaleString('th-TH')} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                ยังไม่มีคะแนน — เล่นเพื่อขึ้นอันดับ!
              </p>
            )}
          </CardContent>
        </Card>

        {/* อันดับสูงสุด */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-amber-500" />
              อันดับ — คะแนนสูงสุด
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboardQuery.isLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">กำลังโหลด...</p>
            ) : leaderboard.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                ยังไม่มีคะแนน — เป็นคนแรกสิ!
              </p>
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
                  {leaderboard.map((row, i) => {
                    const isMe = student.id === row.student_id;
                    return (
                      <TableRow key={row.student_id} className={cn(isMe && 'bg-primary/5')}>
                        <TableCell className="font-semibold text-muted-foreground">{i + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <PersonAvatar name={row.display_name} photoUrl={row.photo_url} size="sm" />
                            <span
                              className={cn(
                                'text-sm font-medium text-foreground',
                                isMe && 'font-bold text-primary',
                              )}
                            >
                              {row.display_name}
                              {isMe && ' (หนู)'}
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
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center pt-2">
          <Button onClick={() => navigate(`/play/${gameSlug}`)} className="gap-2">
            <Gamepad2 className="h-4 w-4" />
            กลับไปเล่นเกม
          </Button>
        </div>
      </main>
    </div>
  );
};

const DashboardHeader = ({ title, gameSlug }: { title: string; gameSlug: string }) => (
  <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur">
    <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3">
      <Button asChild variant="ghost" size="icon" className="shrink-0">
        <Link to={`/play/${gameSlug}`} aria-label="กลับไปหน้าเกม">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </Button>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">แดชบอด · คะแนนและอันดับ</p>
      </div>
    </div>
  </header>
);

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

export default GameDashboard;
