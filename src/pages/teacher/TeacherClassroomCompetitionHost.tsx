import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { CircleStop, Clock3, Pause, Play, RefreshCw, UserCheck, Wifi, WifiOff, XCircle } from 'lucide-react';
import { RolePortalLayout } from '@/components/portal/RolePortalLayout';
import { TEACHER_MENU } from './teacher-menu';
import { classroomCompetitionService, type CompetitionTeam } from '@/services/classroom-competition.service';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

function formatTime(seconds: number) {
  const safe = Math.max(0, seconds);
  return `${Math.floor(safe / 60).toString().padStart(2, '0')}:${(safe % 60).toString().padStart(2, '0')}`;
}

function TeamLane({ team, questionCount, online }: { team: CompetitionTeam; questionCount: number; online: boolean }) {
  const members = team.classroom_competition_members ?? [];
  return <Card className={cn('overflow-hidden border-2', team.color_key === 'navy' ? 'border-primary/40' : 'border-accent')}>
    <div className={cn('h-2', team.color_key === 'navy' ? 'bg-primary' : 'bg-accent')} />
    <CardHeader><div className="flex items-center justify-between"><CardTitle>{team.name}</CardTitle><Badge variant={online ? 'default' : 'secondary'}>{online ? <Wifi className="mr-1 h-3 w-3" /> : <WifiOff className="mr-1 h-3 w-3" />}{online ? 'ออนไลน์' : 'ออฟไลน์'}</Badge></div></CardHeader>
    <CardContent className="space-y-5">
      <div className="flex -space-x-2">{members.map((member) => <PersonAvatar key={member.students.id} name={member.students.name} photoUrl={member.students.photo_url} className="ring-2 ring-card" />)}</div>
      <div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-primary/10 p-3"><p className="text-3xl font-black">{team.score}</p><p className="text-xs text-muted-foreground">คะแนน</p></div><div className="rounded-xl bg-muted p-3"><p className="text-3xl font-black">{team.wrong_count}</p><p className="text-xs text-muted-foreground">ตอบผิด</p></div><div className="rounded-xl bg-muted p-3"><p className="text-3xl font-black">{team.locked_count}</p><p className="text-xs text-muted-foreground">ล็อก</p></div></div>
      <div><div className="mb-2 flex justify-between text-sm"><span>ข้อปัจจุบัน {Math.min(team.current_question_index + 1, questionCount)}</span><span>{Math.min(team.current_question_index, questionCount)}/{questionCount}</span></div><Progress value={Math.min(100, team.current_question_index / questionCount * 100)} /></div>
    </CardContent>
  </Card>;
}

export default function TeacherClassroomCompetitionHost() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [now, setNow] = useState(Date.now());
  const queryKey = ['classroom-competition', id, 'host'];
  const { data: state, isLoading } = useQuery({ queryKey, queryFn: () => classroomCompetitionService.getHostState(id), enabled: Boolean(id), refetchInterval: 5000 });
  useEffect(() => classroomCompetitionService.subscribeHost(id, () => {
    void queryClient.invalidateQueries({ queryKey: ['classroom-competition', id, 'host'] });
  }), [id, queryClient]);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const action = useMutation({
    mutationFn: ({ name, extra }: { name: string; extra?: Record<string, unknown> }) => classroomCompetitionService.hostAction(name, id, extra),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey }),
    onError: (error) => toast.error(error.message),
  });
  if (isLoading || !state) return <div className="min-h-screen bg-background p-8">กำลังเปิดจอ Host...</div>;
  const { competition, teams, devices, results } = state;
  const remaining = competition.status === 'paused' ? competition.paused_remaining_seconds ?? 0 : competition.ends_at ? Math.ceil((new Date(competition.ends_at).getTime() - now) / 1000) : competition.duration_seconds;
  const onlineCutoff = now - 15_000;
  const teamOnline = (teamId: string) => devices.some((device) => device.team_id === teamId && device.status === 'approved' && new Date(device.last_seen_at).getTime() >= onlineCutoff);
  const canStart = competition.status === 'waiting_devices' && teams.every((team) => teamOnline(team.id));
  const tiebreakQuestionOpen = state.currentQuestions.some(({ question }) => question?.is_tiebreak);

  return <RolePortalLayout title="จอ Host การแข่งขัน" subtitle={`รหัสห้อง ${competition.room_code}`} menu={TEACHER_MENU} accent="teacher">
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.12),_transparent_45%)] p-4 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-border bg-card p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm text-muted-foreground">ให้นักเรียนเข้า</p><p className="text-4xl font-black tracking-[0.25em]">{competition.room_code}</p><p className="text-sm text-muted-foreground">/classroom-competition/join</p></div><div className="text-center"><Badge className="mb-2">{competition.status}</Badge><div className="flex items-center gap-2 text-5xl font-black tabular-nums"><Clock3 className="h-9 w-9" />{formatTime(remaining)}</div></div></div></header>

        {competition.status === 'waiting_devices' && <Card><CardHeader><CardTitle>คำขอเข้าเครื่องทีม</CardTitle></CardHeader><CardContent className="space-y-3">{devices.length === 0 && <p className="text-muted-foreground">กำลังรอเครื่องทีมกรอกรหัสห้อง...</p>}{devices.map((device) => <div key={device.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"><div><p className="font-bold">{device.display_name}</p><p className="text-xs text-muted-foreground">{device.status}</p></div>{device.status === 'pending' && <div className="flex gap-2">{teams.map((team) => <Button key={team.id} size="sm" variant="outline" onClick={() => action.mutate({ name: 'approveDevice', extra: { deviceId: device.id, teamId: team.id } })}><UserCheck className="mr-1 h-4 w-4" />{team.name}</Button>)}<Button size="sm" variant="ghost" onClick={() => action.mutate({ name: 'rejectDevice', extra: { deviceId: device.id } })}>ปฏิเสธ</Button></div>}</div>)}</CardContent></Card>}

        <div className="grid gap-5 md:grid-cols-2">{teams.map((team) => <TeamLane key={team.id} team={team} questionCount={competition.question_count} online={teamOnline(team.id)} />)}</div>

        {competition.status === 'finished' && <Card><CardContent className="p-6 text-center"><TrophyResult teams={teams} results={results} winnerTeamId={competition.winner_team_id} /></CardContent></Card>}

        <div className="sticky bottom-4 flex flex-wrap justify-center gap-2 rounded-2xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur">
          {competition.status === 'waiting_devices' && <Button disabled={!canStart || action.isPending} onClick={() => action.mutate({ name: 'start' })}><Play className="mr-2 h-4 w-4" />เริ่มแข่งขัน</Button>}
          {competition.status === 'live' && <Button variant="secondary" onClick={() => action.mutate({ name: 'pause' })}><Pause className="mr-2 h-4 w-4" />พัก</Button>}
          {competition.status === 'paused' && <Button onClick={() => action.mutate({ name: 'resume' })}><Play className="mr-2 h-4 w-4" />เล่นต่อ</Button>}
          {competition.status === 'tiebreak' && !tiebreakQuestionOpen && <Button onClick={() => action.mutate({ name: 'nextTiebreak' })}><RefreshCw className="mr-2 h-4 w-4" />เปิดข้อชี้ขาด</Button>}
          {['live', 'paused'].includes(competition.status) && <Button variant="outline" onClick={() => action.mutate({ name: 'finish' })}><CircleStop className="mr-2 h-4 w-4" />จบก่อนเวลา</Button>}
          {!['finished', 'cancelled'].includes(competition.status) && <Button variant="destructive" onClick={() => action.mutate({ name: 'cancel' })}><XCircle className="mr-2 h-4 w-4" />ยกเลิก</Button>}
          {['finished', 'cancelled'].includes(competition.status) && <Button variant="outline" onClick={() => navigate('/teacher/classroom-competitions')}>กลับหน้าประวัติ</Button>}
        </div>
      </div>
    </main>
  </RolePortalLayout>;
}

function TrophyResult({ teams, results, winnerTeamId }: { teams: CompetitionTeam[]; results: Array<{ team_id?: string; league_points: number }>; winnerTeamId: string | null }) {
  const winner = teams.find((team) => team.id === winnerTeamId);
  return <><p className="text-sm text-muted-foreground">ทีมชนะ</p><h2 className="mt-1 text-4xl font-black">{winner?.name ?? 'รอผลตัดสิน'}</h2><div className="mt-4 flex justify-center gap-4">{teams.map((team) => <Badge key={team.id} variant={team.id === winnerTeamId ? 'default' : 'secondary'}>{team.name} +{results.find((result) => result.team_id === team.id)?.league_points ?? 0} แต้มลีก</Badge>)}</div></>;
}
