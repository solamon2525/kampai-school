import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, LogOut, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { gamePlayService, type StudentLookup } from '@/services/game-play.service';
import { dailyQuestService } from '@/services/daily-quest.service';
import {
  englishQuestService, eqTotalStars,
  type EqWorldTree, type EqLessonWithWords, type EqCompleteResult,
} from '@/services/english-quest.service';
import { QuestHeader } from '@/components/english-quest/QuestHeader';
import { MascotCompanion, type MascotMood } from '@/components/english-quest/MascotCompanion';
import { WorldMap } from '@/components/english-quest/WorldMap';
import { LessonFlashcards } from '@/components/english-quest/LessonFlashcards';
import { LessonQuiz } from '@/components/english-quest/LessonQuiz';

type Phase = 'code' | 'mascot-setup' | 'home' | 'flashcards' | 'quiz' | 'result';
const CODE_KEY = 'eq:student-code';

export default function EnglishQuest() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [code, setCode] = useState<string | null>(() => localStorage.getItem(CODE_KEY));
  const [student, setStudent] = useState<StudentLookup | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [looking, setLooking] = useState(false);
  const [phase, setPhase] = useState<Phase>('code');
  const [activeLesson, setActiveLesson] = useState<EqLessonWithWords | null>(null);
  const [mood, setMood] = useState<MascotMood>('idle');
  const [result, setResult] = useState<EqCompleteResult | null>(null);
  const [mascotInput, setMascotInput] = useState('');

  // resume จากรหัสที่จำไว้
  useEffect(() => {
    if (!code) { setStudent(null); setPhase('code'); return; }
    let cancelled = false;
    gamePlayService.lookupStudent(code)
      .then((s) => {
        if (cancelled) return;
        if (s) setStudent(s);
        else { localStorage.removeItem(CODE_KEY); setCode(null); setPhase('code'); }
      })
      .catch(() => { if (!cancelled) setPhase('code'); });
    return () => { cancelled = true; };
  }, [code]);

  const curriculumQ = useQuery({ queryKey: ['eq-curriculum'], queryFn: englishQuestService.getCurriculum, staleTime: 5 * 60 * 1000 });
  const stateQ = useQuery({ queryKey: ['eq-state', code], queryFn: () => englishQuestService.getState(code!), enabled: !!code && !!student });
  const dailyQ = useQuery({ queryKey: ['eq-daily', code], queryFn: () => dailyQuestService.getStatus(code!), enabled: !!code && !!student });

  const lessonStars = (stateQ.data?.lesson_stars ?? {}) as Record<string, number>;

  // โหลดเสร็จครั้งแรก → ตั้งชื่อมาสคอต หรือเข้าหน้าหลัก
  useEffect(() => {
    if (student && stateQ.data && phase === 'code') {
      setPhase(stateQ.data.mascot_name ? 'home' : 'mascot-setup');
    }
  }, [student, stateQ.data, phase]);

  const submitCode = async () => {
    const c = codeInput.trim();
    if (!c) return;
    setLooking(true);
    try {
      const s = await gamePlayService.lookupStudent(c);
      if (!s) { toast({ title: 'ไม่พบรหัสนักเรียนนี้', variant: 'destructive' }); return; }
      localStorage.setItem(CODE_KEY, c);
      setStudent(s); setCode(c); setPhase('code'); // effect จะพาไป mascot-setup/home
    } catch (e) {
      toast({ title: 'เกิดข้อผิดพลาด', description: String(e), variant: 'destructive' });
    } finally { setLooking(false); }
  };

  const mascotMut = useMutation({
    mutationFn: (name: string) => englishQuestService.setMascot(code!, name),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['eq-state', code] }); setPhase('home'); },
    onError: (e) => toast({ title: 'บันทึกชื่อไม่สำเร็จ', description: String(e), variant: 'destructive' }),
  });

  const completeMut = useMutation({
    mutationFn: (p: { lessonId: string; correct: number; total: number }) =>
      englishQuestService.completeLesson(code!, p.lessonId, p.correct, p.total),
    onSuccess: (res) => {
      setResult(res);
      setMood(res.stars >= 2 ? 'celebrate' : res.stars >= 1 ? 'happy' : 'sad');
      setPhase('result');
      qc.invalidateQueries({ queryKey: ['eq-state', code] });
      qc.invalidateQueries({ queryKey: ['eq-daily', code] });
    },
    onError: (e) => toast({ title: 'บันทึกไม่สำเร็จ', description: String(e), variant: 'destructive' }),
  });

  const logout = () => { localStorage.removeItem(CODE_KEY); setCode(null); setStudent(null); setPhase('code'); };

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-md px-4 py-5">{children}</div>
    </div>
  );

  // ── จอกรอกรหัส ──
  if (phase === 'code' && !student) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-4 pt-10 text-center">
          <MascotCompanion mood="wave" size={140} />
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">English Quest</h1>
            <p className="mt-1 text-sm text-muted-foreground">ผจญภัยเรียนศัพท์อังกฤษ · เก็บดาว · สะสม XP</p>
          </div>
          <div className="w-full rounded-2xl border border-border bg-card p-4 shadow-sm">
            <label className="text-sm font-medium text-foreground">กรอกรหัสนักเรียน</label>
            <Input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitCode()}
              placeholder="เช่น 1234"
              inputMode="numeric"
              className="mt-2 text-center text-lg"
            />
            <Button className="mt-3 w-full" onClick={submitCode} disabled={looking || !codeInput.trim()}>
              {looking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'เริ่มผจญภัย'}
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  // ── โหลด ──
  if (!student || stateQ.isLoading || curriculumQ.isLoading) {
    return <Shell><div className="flex justify-center pt-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></Shell>;
  }

  const worlds: EqWorldTree[] = curriculumQ.data ?? [];
  const totalXp = stateQ.data?.total_xp ?? 0;
  const streak = dailyQ.data?.streak_days ?? 0;
  const mascotName = stateQ.data?.mascot_name ?? null;

  // ── ตั้งชื่อมาสคอต (ครั้งแรก) ──
  if (phase === 'mascot-setup') {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-4 pt-8 text-center">
          <MascotCompanion mood="happy" size={150} />
          <h1 className="text-xl font-extrabold text-foreground">นี่คือเพื่อนของหนู! 🦊</h1>
          <p className="text-sm text-muted-foreground">ตั้งชื่อให้เพื่อนจิ้งจอกที่จะผจญภัยไปด้วยกัน</p>
          <div className="w-full rounded-2xl border border-border bg-card p-4 shadow-sm">
            <Input
              value={mascotInput}
              onChange={(e) => setMascotInput(e.target.value)}
              placeholder="ตั้งชื่อ เช่น น้องส้ม"
              maxLength={20}
              className="text-center text-lg"
            />
            <Button
              className="mt-3 w-full"
              onClick={() => mascotMut.mutate(mascotInput.trim() || 'จิ้งจอกน้อย')}
              disabled={mascotMut.isPending}
            >
              {mascotMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'เริ่มผจญภัย!'}
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  // ── เรียน (flashcards) ──
  if (phase === 'flashcards' && activeLesson) {
    return (
      <Shell>
        <LessonFlashcards lesson={activeLesson} onBack={() => setPhase('home')} onDone={() => setPhase('quiz')} />
      </Shell>
    );
  }

  // ── แบบทดสอบ ──
  if (phase === 'quiz' && activeLesson) {
    return (
      <Shell>
        <div className="relative">
          <div className="pointer-events-none absolute -top-2 right-0 z-10">
            <MascotCompanion mood={mood} size={64} />
          </div>
          <LessonQuiz
            lesson={activeLesson}
            onBack={() => setPhase('home')}
            onAnswer={(ok) => setMood(ok ? 'happy' : 'sad')}
            onComplete={(correct, total) => completeMut.mutate({ lessonId: activeLesson.id, correct, total })}
          />
        </div>
      </Shell>
    );
  }

  // ── ผลลัพธ์ ──
  if (phase === 'result' && result) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3 pt-8 text-center">
          <MascotCompanion mood={mood} size={150} />
          <h1 className="text-2xl font-extrabold text-foreground">
            {result.stars >= 2 ? 'เก่งมาก!' : result.stars >= 1 ? 'ดีมาก!' : 'พยายามอีกนิด!'}
          </h1>
          <div className="flex gap-1">
            {[1, 2, 3].map((i) => (
              <Star key={i} className={cn('h-9 w-9', i <= result.stars ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />
            ))}
          </div>
          <div className="w-full rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div><div className="text-2xl font-bold text-foreground">{result.score}%</div><div className="text-xs text-muted-foreground">คะแนน</div></div>
              <div><div className="text-2xl font-bold text-primary">+{result.xp_earned}</div><div className="text-xs text-muted-foreground">XP ที่ได้</div></div>
            </div>
            {streak > 0 && <div className="mt-2 text-sm text-muted-foreground">🔥 เรียนต่อเนื่อง {streak} วัน</div>}
          </div>
          <div className="flex w-full gap-2">
            <Button variant="outline" className="flex-1" onClick={() => { setActiveLesson(activeLesson); setPhase('flashcards'); }}>
              ทบทวนอีกครั้ง
            </Button>
            <Button className="flex-1" onClick={() => { setResult(null); setMood('idle'); setPhase('home'); }}>
              กลับแผนที่
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  // ── หน้าหลัก (แผนที่โลก) ──
  return (
    <Shell>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-extrabold text-foreground">English Quest</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="gap-1 text-muted-foreground">
            <LogOut className="h-4 w-4" /> ออก
          </Button>
        </div>

        <QuestHeader
          studentName={student.display_name}
          studentPhotoUrl={student.photo_url}
          classLabel={student.class_label}
          totalXp={totalXp}
          streakDays={streak}
          totalStars={eqTotalStars(lessonStars)}
        />

        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
          <MascotCompanion mood="idle" size={56} />
          <p className="text-sm text-foreground">
            {mascotName ? <><b>{mascotName}</b> พร้อมผจญภัยแล้ว!</> : 'เลือกโลกแล้วเริ่มเรียนกันเลย!'}
            <span className="block text-xs text-muted-foreground">เลือกบทเรียน → เรียนคำศัพท์ → ทำแบบทดสอบ เก็บดาว</span>
          </p>
        </div>

        <WorldMap
          worlds={worlds}
          lessonStars={lessonStars}
          onPickLesson={(lesson) => { setActiveLesson(lesson); setMood('idle'); setPhase('flashcards'); }}
        />
      </div>
    </Shell>
  );
}
