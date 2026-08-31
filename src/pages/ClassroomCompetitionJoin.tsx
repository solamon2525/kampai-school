import { useEffect, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock3, Loader2, LogIn, RotateCcw, Trophy, WifiOff } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { CompetitionPrompt, CompetitionQuestionForm } from '@/components/classroom-competition/CompetitionQuestionForm';
import { classroomCompetitionService, type TeamState } from '@/services/classroom-competition.service';
import type { CompetitionStudent } from '@/services/classroom-competition.service';
import type { ReactNode } from 'react';
import { toast } from 'sonner';

const joinSchema = z.object({
  roomCode: z.string().trim().length(6, 'รหัสห้องมี 6 ตัว').transform((value) => value.toUpperCase()),
  displayName: z.string().trim().min(1, 'กรุณาตั้งชื่อเครื่อง').max(60),
});
type JoinValues = z.infer<typeof joinSchema>;

function formatTime(seconds: number) {
  const safe = Math.max(0, seconds);
  return `${Math.floor(safe / 60).toString().padStart(2, '0')}:${(safe % 60).toString().padStart(2, '0')}`;
}

export default function ClassroomCompetitionJoin() {
  const queryClient = useQueryClient();
  const [hasToken, setHasToken] = useState(classroomCompetitionService.hasDeviceToken());
  const [stateOverride, setStateOverride] = useState<TeamState | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const form = useForm<JoinValues>({ resolver: zodResolver(joinSchema), defaultValues: { roomCode: '', displayName: '' } });
  const stateQuery = useQuery({
    queryKey: ['classroom-competition', 'team-state'],
    queryFn: classroomCompetitionService.getTeamState,
    enabled: hasToken,
    refetchInterval: (query) => query.state.error ? 5000 : 1000,
    retry: 3,
  });
  const state = stateOverride ?? stateQuery.data;
  useEffect(() => { if (stateQuery.data) setStateOverride(null); }, [stateQuery.data]);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const join = useMutation({
    mutationFn: ({ roomCode, displayName }: JoinValues) => classroomCompetitionService.join(roomCode, displayName),
    onSuccess: () => { setHasToken(true); void queryClient.invalidateQueries({ queryKey: ['classroom-competition', 'team-state'] }); },
    onError: (error) => toast.error(error.message),
  });
  const submit = useMutation({
    mutationFn: (response: Record<string, unknown>) => {
      if (!state?.question) throw new Error('question_not_ready');
      return classroomCompetitionService.submitAnswer(state.question.id, response, crypto.randomUUID());
    },
    onSuccess: ({ result, state: nextState }) => {
      setFeedback(result.correct ? 'ถูกต้อง! +1 คะแนน' : result.locked ? 'ผิดครบ 2 ครั้ง ข้อนี้ถูกล็อก' : `ยังไม่ถูก เหลือ ${result.remainingAttempts} ครั้ง`);
      setStateOverride(nextState);
      window.setTimeout(() => setFeedback(null), 1800);
      void queryClient.invalidateQueries({ queryKey: ['classroom-competition', 'team-state'] });
    },
    onError: (error) => toast.error(error.message),
  });

  if (!hasToken) return <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.18),_transparent_52%)] p-4"><Card className="w-full max-w-md border-2"><CardContent className="p-7"><div className="mb-7 text-center"><div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Trophy className="h-8 w-8" /></div><h1 className="text-3xl font-black">เข้าแข่งขัน</h1><p className="mt-2 text-muted-foreground">กรอกรหัสจากจอครู แล้วรอครูอนุมัติเครื่อง</p></div><Form {...form}><form className="space-y-5" onSubmit={form.handleSubmit((values) => join.mutate(values))}><FormField control={form.control} name="roomCode" render={({ field }) => <FormItem><FormLabel>รหัสห้อง 6 ตัว</FormLabel><FormControl><Input {...field} maxLength={6} autoCapitalize="characters" className="h-16 text-center text-3xl font-black uppercase tracking-[0.3em]" /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name="displayName" render={({ field }) => <FormItem><FormLabel>ชื่อเครื่อง</FormLabel><FormControl><Input {...field} className="h-12" placeholder="เช่น คอมทีมหน้าต่าง" /></FormControl><FormMessage /></FormItem>} /><Button className="h-14 w-full text-lg" disabled={join.isPending}>{join.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}ส่งคำขอเข้า</Button></form></Form></CardContent></Card></main>;

  if (stateQuery.isError && !state) return <StatusScreen icon={<WifiOff className="h-10 w-10" />} title="การเชื่อมต่อขัดข้อง" detail="ระบบจะลองเชื่อมต่อใหม่อัตโนมัติ" action={() => stateQuery.refetch()} />;
  if (!state) return <StatusScreen icon={<Loader2 className="h-10 w-10 animate-spin" />} title="กำลังเชื่อมต่อห้อง" detail="รอสักครู่" />;
  if (state.device.status === 'pending') return <StatusScreen icon={<Loader2 className="h-10 w-10 animate-spin" />} title="รอครูอนุมัติ" detail={`เครื่อง ${state.device.displayName} ส่งคำขอแล้ว`} />;
  if (['rejected', 'revoked'].includes(state.device.status)) return <StatusScreen icon={<RotateCcw className="h-10 w-10" />} title="เครื่องนี้ไม่ได้รับอนุมัติ" detail="ล้างข้อมูลแล้วขอเข้าห้องใหม่" action={() => { classroomCompetitionService.clearDeviceToken(); setHasToken(false); }} />;
  if (!state.team) return <StatusScreen icon={<Loader2 className="h-10 w-10 animate-spin" />} title="กำลังกำหนดทีม" detail="รอครูเลือกทีมให้เครื่องนี้" />;
  if (state.competition.status === 'waiting_devices') return <StatusScreen icon={<Trophy className="h-10 w-10" />} title={`${state.team.name} พร้อมแล้ว`} detail="รออีกทีมและรอครูกดเริ่ม" members={state.team.members} />;
  if (state.competition.status === 'paused') return <StatusScreen icon={<Clock3 className="h-10 w-10" />} title="พักการแข่งขัน" detail={`เหลือเวลา ${formatTime(state.competition.paused_remaining_seconds ?? 0)}`} members={state.team.members} />;
  if (state.competition.status === 'cancelled') return <StatusScreen icon={<RotateCcw className="h-10 w-10" />} title="การแข่งขันถูกยกเลิก" detail="ผลรอบนี้ไม่ถูกนำไปคำนวณสถิติ" />;
  if (state.competition.status === 'finished') return <ResultScreen state={state} />;

  const remaining = state.competition.ends_at ? Math.ceil((new Date(state.competition.ends_at).getTime() - now) / 1000) : 0;
  return <main className="min-h-screen bg-[linear-gradient(135deg,_hsl(var(--background)),_hsl(var(--primary)/0.08))] p-3 sm:p-6"><div className="mx-auto max-w-3xl space-y-4"><header className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm"><div><Badge>{state.team.name}</Badge><p className="mt-1 text-sm text-muted-foreground">ข้อ {Math.min(state.team.current_question_index + 1, state.competition.question_count)} / {state.competition.question_count}</p></div><div className="text-right"><p className="text-3xl font-black tabular-nums">{formatTime(remaining)}</p><p className="text-sm text-muted-foreground">คะแนน {state.team.score}</p></div></header>{feedback && <div className="rounded-2xl bg-primary p-4 text-center text-xl font-bold text-primary-foreground">{feedback}</div>}{state.question ? <Card className="border-2"><CardContent className="space-y-7 p-5 sm:p-8"><div className="text-center"><CompetitionPrompt question={state.question} /><p className="mt-2 text-sm text-muted-foreground">ตอบได้อีก {Math.max(0, 2 - (state.attemptsUsed ?? 0))} ครั้ง</p></div><CompetitionQuestionForm key={state.question.id} question={state.question} disabled={submit.isPending || Boolean(feedback)} onSubmit={(response) => submit.mutate(response)} /></CardContent></Card> : <StatusScreen icon={<Loader2 className="h-10 w-10 animate-spin" />} title={state.competition.status === 'tiebreak' ? 'รอครูเปิดข้อชี้ขาด' : 'ทำครบแล้ว'} detail="รอผลจากอีกทีม" />}</div></main>;
}

function StatusScreen({ icon, title, detail, action, members }: { icon: ReactNode; title: string; detail: string; action?: () => void; members?: CompetitionStudent[] }) {
  return <main className="flex min-h-screen items-center justify-center bg-background p-4"><div className="max-w-lg text-center"><div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">{icon}</div><h1 className="text-3xl font-black">{title}</h1><p className="mt-2 text-muted-foreground">{detail}</p>{members && <div className="mt-6 flex justify-center -space-x-2">{members.map((member) => <PersonAvatar key={member.id} name={member.name} photoUrl={member.photo_url} className="ring-2 ring-background" />)}</div>}{action && <Button className="mt-6" onClick={action}>ลองใหม่</Button>}</div></main>;
}

function ResultScreen({ state }: { state: TeamState }) {
  const won = state.team?.result?.outcome === 'winner';
  return <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.2),_transparent_55%)] p-4"><Card className="w-full max-w-xl"><CardContent className="p-8 text-center"><Trophy className="mx-auto h-16 w-16 text-primary" /><p className="mt-4 text-muted-foreground">ผลการแข่งขัน</p><h1 className="text-4xl font-black">{won ? 'ชนะ!' : 'ทำได้ดีมาก'}</h1><p className="mt-2 text-xl font-bold">{state.team?.name} · {state.team?.score} คะแนน</p><Badge className="mt-4">+{state.team?.result?.league_points ?? 0} แต้มลีก</Badge><div className="mt-6 flex justify-center -space-x-2">{state.team?.members.map((member) => <PersonAvatar key={member.id} name={member.name} photoUrl={member.photo_url} className="ring-2 ring-card" />)}</div></CardContent></Card></main>;
}
