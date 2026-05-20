import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as LucideIcons from 'lucide-react';
import {
  ArrowLeft,
  Gamepad2,
  Loader2,
  Sparkles,
  Trophy,
  Lock,
  RotateCcw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import {
  gamePlayService,
  gameStatsService,
  gameAchievementsService,
  trackedGamesService,
  levelFromXp,
  type StudentLookup,
  type RecordSessionResult,
  type UnlockedBadge,
  type LevelInfo,
} from '@/services/game-play.service';

// ─── Lucide icon resolver ────────────────────────────────────────────────────
type LucideMap = Record<string, React.ComponentType<{ className?: string }>>;
const Icons = LucideIcons as unknown as LucideMap;
const ICON = (name: string | null | undefined) =>
  (name && Icons[name]) || Sparkles;

// ─── Page state ──────────────────────────────────────────────────────────────
type Phase = 'lookup' | 'confirm' | 'pre-game' | 'playing' | 'result';

// ============================================================================
const PlayGame = () => {
  const { gameSlug = '' } = useParams<{ gameSlug: string }>();
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>('lookup');
  const [codeInput, setCodeInput] = useState('');
  const [student, setStudent] = useState<StudentLookup | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [result, setResult] = useState<RecordSessionResult | null>(null);
  const [prevLevel, setPrevLevel] = useState<LevelInfo | null>(null);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const sessionSubmittedRef = useRef(false);

  // game metadata
  const gameQuery = useQuery({
    queryKey: ['tracked-game', gameSlug],
    queryFn: async () => {
      const { data, error } = await trackedGamesService.getBySlug(gameSlug);
      if (error) throw error;
      return data;
    },
    enabled: !!gameSlug,
  });

  // per-student stats (loaded once we have a student)
  const statsQuery = useQuery({
    queryKey: ['game-stats', student?.id, gameSlug],
    queryFn: async () => {
      if (!student) return null;
      const { data } = await gameStatsService.getForStudent(student.id, gameSlug);
      return data;
    },
    enabled: !!student && !!gameSlug,
  });

  // badge catalog
  const catalogQuery = useQuery({
    queryKey: ['game-catalog', gameSlug],
    queryFn: async () => {
      const { data } = await gameAchievementsService.getCatalog(gameSlug);
      return data ?? [];
    },
    enabled: !!gameSlug,
  });

  // unlocked badges for this student
  const unlockedQuery = useQuery({
    queryKey: ['game-unlocked', student?.id, gameSlug],
    queryFn: async () => {
      if (!student) return [];
      const { data } = await gameAchievementsService.getUnlocked(student.id, gameSlug);
      return data ?? [];
    },
    enabled: !!student && !!gameSlug,
  });

  const unlockedIds = useMemo(() => {
    const set = new Set<string>();
    (unlockedQuery.data ?? []).forEach((row) => {
      const ach = (row as { game_achievements_catalog?: { id?: string } | null })
        .game_achievements_catalog;
      if (ach?.id) set.add(ach.id);
    });
    return set;
  }, [unlockedQuery.data]);

  const levelInfo = useMemo(
    () => levelFromXp(statsQuery.data?.total_xp ?? 0),
    [statsQuery.data?.total_xp],
  );

  // ─── lookup handler ────────────────────────────────────────────────────────
  const handleLookup = useCallback(async () => {
    const code = codeInput.trim();
    if (!code) return;
    setLookupLoading(true);
    setLookupError(null);
    try {
      const found = await gamePlayService.lookupStudent(code);
      if (!found) {
        setLookupError('ไม่พบรหัสนักเรียนนี้ ลองใหม่อีกครั้ง');
        return;
      }
      setStudent(found);
      setPhase('confirm');
    } catch {
      setLookupError('เกิดข้อผิดพลาด โปรดลองใหม่');
    } finally {
      setLookupLoading(false);
    }
  }, [codeInput]);

  // ─── start game ────────────────────────────────────────────────────────────
  const handleStart = useCallback(() => {
    setPrevLevel(levelInfo);
    setResult(null);
    sessionSubmittedRef.current = false;
    setPhase('playing');
  }, [levelInfo]);

  // ─── send init to iframe once loaded ───────────────────────────────────────
  const handleIframeLoad = useCallback(() => {
    if (!student || !iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      { type: 'init', studentCode: codeInput.trim() },
      '*',
    );
  }, [student, codeInput]);

  // ─── receive gameEnd from iframe ───────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return;
    const handler = async (e: MessageEvent) => {
      const data = e.data as
        | { type?: string; score?: number; mode?: string; metadata?: Record<string, unknown> }
        | undefined;
      if (data?.type !== 'gameEnd') return;
      if (sessionSubmittedRef.current) return;
      sessionSubmittedRef.current = true;

      if (!student || typeof data.score !== 'number') return;
      try {
        const submitted = await gamePlayService.recordSession({
          studentCode: codeInput.trim(),
          gameSlug,
          score: data.score,
          mode: data.mode ?? null,
          durationSec:
            typeof data.metadata?.duration === 'number'
              ? (data.metadata.duration as number)
              : null,
          metadata: data.metadata ?? {},
        });
        setResult(submitted);
        statsQuery.refetch();
        unlockedQuery.refetch();
        setPhase('result');
      } catch (err) {
        const msg = (err as Error).message ?? '';
        if (msg.includes('rate_limited')) {
          toast({
            title: 'เล่นเร็วเกินไป',
            description: 'รอสักครู่แล้วลองใหม่นะคะ',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'บันทึกคะแนนไม่สำเร็จ',
            description: msg || 'โปรดลองใหม่',
            variant: 'destructive',
          });
        }
        setPhase('pre-game');
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [phase, student, codeInput, gameSlug, toast, statsQuery, unlockedQuery]);

  const handlePlayAgain = useCallback(() => {
    setResult(null);
    setPrevLevel(levelInfo);
    sessionSubmittedRef.current = false;
    setPhase('pre-game');
  }, [levelInfo]);

  const handleSwitchStudent = useCallback(() => {
    setStudent(null);
    setCodeInput('');
    setResult(null);
    setLookupError(null);
    setPhase('lookup');
  }, []);

  // ─── derive iframe url (append ?embed=1 + cache-buster) ───────────────────
  // cache-buster t= บังคับ fresh fetch ทุก mount — bypass browser/edge cache เก่า
  // ที่อาจเก็บ header X-Frame-Options: DENY ของ Pizza HTML ก่อน hotfix vercel.json
  const iframeUrl = useMemo(() => {
    const url = gameQuery.data?.external_url;
    if (!url) return null;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}embed=1&t=${Date.now()}`;
  }, [gameQuery.data?.external_url]);

  // ─── early returns: 404 / loading ─────────────────────────────────────────
  if (gameQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!gameQuery.data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6">
        <Gamepad2 className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg text-muted-foreground">ไม่พบเกมนี้ในระบบติดตาม</p>
        <Button asChild variant="outline">
          <Link to="/educational-hub">
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับคลังสื่อ
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <Gamepad2 className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-bold text-foreground">{gameQuery.data.title}</h1>
              <p className="text-xs text-muted-foreground">
                {gameQuery.data.subject ?? 'เกมการศึกษา'} · ติดตามคะแนนนักเรียน
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {phase !== 'playing' && (
              <Button asChild variant="outline" size="sm">
                <Link to="/educational-hub">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  กลับไปเลือกเกมอื่น
                </Link>
              </Button>
            )}
            {student && phase !== 'playing' && (
              <Button variant="ghost" size="sm" onClick={handleSwitchStudent}>
                เปลี่ยนนักเรียน
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-4 sm:p-6">
        {phase === 'lookup' && (
          <LookupPanel
            value={codeInput}
            onChange={setCodeInput}
            onSubmit={handleLookup}
            loading={lookupLoading}
            error={lookupError}
          />
        )}

        {phase === 'confirm' && student && (
          <ConfirmPanel
            student={student}
            onConfirm={() => setPhase('pre-game')}
            onRetry={handleSwitchStudent}
          />
        )}

        {phase === 'pre-game' && student && (
          <PreGamePanel
            student={student}
            stats={statsQuery.data}
            levelInfo={levelInfo}
            catalog={catalogQuery.data ?? []}
            unlockedIds={unlockedIds}
            onStart={handleStart}
          />
        )}

        {phase === 'playing' && iframeUrl && (
          <PlayingPanel iframeRef={iframeRef} url={iframeUrl} onLoad={handleIframeLoad} />
        )}

        {phase === 'result' && student && result && (
          <ResultPanel
            student={student}
            result={result}
            prevLevel={prevLevel}
            onPlayAgain={handlePlayAgain}
            onExit={handleSwitchStudent}
          />
        )}
      </main>
    </div>
  );
};

export default PlayGame;

// ============================================================================
// Sub-panels
// ============================================================================

const LookupPanel = ({
  value,
  onChange,
  onSubmit,
  loading,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
}) => (
  <Card className="mx-auto mt-8 max-w-md">
    <CardContent className="space-y-5 p-6 sm:p-8">
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">กรอกรหัสนักเรียน</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          เพื่อบันทึกคะแนนเกมของหนู
        </p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-3"
      >
        <Input
          autoFocus
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="เช่น 1234"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\s/g, ''))}
          className="h-14 text-center text-2xl tracking-widest"
          maxLength={20}
        />
        {error && (
          <p className="text-center text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" className="h-12 w-full text-base" disabled={!value.trim() || loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'ตรวจสอบ'}
        </Button>
      </form>
    </CardContent>
  </Card>
);

const ConfirmPanel = ({
  student,
  onConfirm,
  onRetry,
}: {
  student: StudentLookup;
  onConfirm: () => void;
  onRetry: () => void;
}) => (
  <Card className="mx-auto mt-8 max-w-md">
    <CardContent className="space-y-5 p-6 text-center sm:p-8">
      <p className="text-sm text-muted-foreground">นี่ใช่หนูหรือเปล่า?</p>
      <div className="flex justify-center">
        <PersonAvatar
          name={student.display_name}
          photoUrl={student.photo_url}
          size="lg"
          className="h-28 w-28 text-2xl ring-4 ring-primary/20"
        />
      </div>
      <div>
        <p className="text-xl font-bold text-foreground">{student.display_name}</p>
        {student.class_label && (
          <Badge variant="secondary" className="mt-2">
            ชั้น {student.class_label}
          </Badge>
        )}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button className="h-12 flex-1 text-base" onClick={onConfirm}>
          ใช่ฉัน
        </Button>
        <Button variant="outline" className="h-12 flex-1 text-base" onClick={onRetry}>
          ไม่ใช่ ลองอีกครั้ง
        </Button>
      </div>
    </CardContent>
  </Card>
);

const PreGamePanel = ({
  student,
  stats,
  levelInfo,
  catalog,
  unlockedIds,
  onStart,
}: {
  student: StudentLookup;
  stats: { plays_count: number | null; personal_best: number | null; total_xp: number | null } | null | undefined;
  levelInfo: LevelInfo;
  catalog: Array<{ id: string; code: string; title_th: string; description_th: string | null; icon: string | null; threshold_kind: string }>;
  unlockedIds: Set<string>;
  onStart: () => void;
}) => (
  <div className="space-y-5">
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-4">
          <PersonAvatar
            name={student.display_name}
            photoUrl={student.photo_url}
            size="lg"
            className="h-16 w-16"
          />
          <div className="flex-1">
            <p className="text-lg font-bold text-foreground">{student.display_name}</p>
            <p className="text-xs text-muted-foreground">ชั้น {student.class_label ?? '—'}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-primary">Lv.{levelInfo.level}</p>
            <p className="text-xs text-muted-foreground">{(stats?.total_xp ?? 0).toLocaleString('th-TH')} XP</p>
          </div>
        </div>
        <div className="space-y-1">
          <Progress value={levelInfo.progress * 100} className="h-2.5" />
          <p className="text-right text-xs text-muted-foreground">
            {levelInfo.isMaxLevel
              ? 'เลเวลสูงสุดแล้ว 🎉'
              : `อีก ${levelInfo.xpToNext.toLocaleString('th-TH')} XP เลื่อนเป็น Lv.${levelInfo.level + 1}`}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 border-t border-border pt-3 text-center">
          <Stat label="ครั้งที่เล่น" value={(stats?.plays_count ?? 0).toLocaleString('th-TH')} />
          <Stat label="คะแนนสูงสุด" value={(stats?.personal_best ?? 0).toLocaleString('th-TH')} />
          <Stat label="ป้ายสะสม" value={`${unlockedIds.size}/${catalog.length}`} />
        </div>
      </CardContent>
    </Card>

    <BadgeGrid catalog={catalog} unlockedIds={unlockedIds} />

    <Button className="h-14 w-full text-lg" onClick={onStart}>
      <Gamepad2 className="mr-2 h-5 w-5" />
      เริ่มเล่นเกม
    </Button>
  </div>
);

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

const BadgeGrid = ({
  catalog,
  unlockedIds,
}: {
  catalog: Array<{ id: string; code: string; title_th: string; description_th: string | null; icon: string | null; threshold_kind: string }>;
  unlockedIds: Set<string>;
}) => (
  <Card>
    <CardContent className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-foreground">ป้ายความสำเร็จ</h3>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {catalog.map((a) => {
          const Icon = ICON(a.icon);
          const unlocked = unlockedIds.has(a.id);
          return (
            <div
              key={a.id}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-colors',
                unlocked
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-border bg-muted/40 opacity-60',
              )}
              title={a.description_th ?? ''}
            >
              {unlocked ? (
                <Icon className="h-7 w-7 text-primary" />
              ) : (
                <Lock className="h-7 w-7 text-muted-foreground" />
              )}
              <p className="text-xs font-medium leading-tight text-foreground">{a.title_th}</p>
            </div>
          );
        })}
      </div>
    </CardContent>
  </Card>
);

const PlayingPanel = ({
  iframeRef,
  url,
  onLoad,
}: {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  url: string;
  onLoad: () => void;
}) => (
  <Card className="overflow-hidden">
    <iframe
      ref={iframeRef}
      src={url}
      onLoad={onLoad}
      title="game"
      className="block h-[80vh] w-full border-0"
      // allow-pointer-lock: required for FPS-style games (e.g. attack-on-noun mouse look)
      // allow-modals: future-proof for in-game confirm() / alert()
      sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-modals"
      allow="pointer-lock; fullscreen; autoplay; cross-origin-isolated"
    />
  </Card>
);

const ResultPanel = ({
  student,
  result,
  prevLevel,
  onPlayAgain,
  onExit,
}: {
  student: StudentLookup;
  result: RecordSessionResult;
  prevLevel: LevelInfo | null;
  onPlayAgain: () => void;
  onExit: () => void;
}) => {
  const newLevel = useMemo(() => levelFromXp(result.total_xp), [result.total_xp]);
  const leveledUp = !!prevLevel && newLevel.level > prevLevel.level;

  return (
    <Card className="mx-auto mt-4 max-w-lg">
      <CardContent className="space-y-5 p-6 text-center sm:p-8">
        <div className="flex justify-center">
          <PersonAvatar
            name={student.display_name}
            photoUrl={student.photo_url}
            size="lg"
            className="h-20 w-20 ring-4 ring-primary/20"
          />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">เก่งมาก {student.display_name}!</p>
          <p className="mt-1 text-4xl font-bold text-primary">+{result.xp_earned.toLocaleString('th-TH')} XP</p>
          <p className="mt-1 text-sm text-muted-foreground">
            รวม {result.total_xp.toLocaleString('th-TH')} XP · Lv.{newLevel.level}
          </p>
        </div>

        {leveledUp && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
            <p className="text-sm font-semibold text-primary">🎉 เลเวลอัพ! → Lv.{newLevel.level}</p>
          </div>
        )}

        {result.unlocked.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">ปลดล็อกป้ายใหม่</p>
            <div className="flex flex-wrap justify-center gap-2">
              {result.unlocked.map((u: UnlockedBadge) => {
                const Icon = ICON(u.icon);
                return (
                  <div
                    key={u.code}
                    className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5"
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-foreground">{u.title}</span>
                    {u.xp_bonus > 0 && (
                      <span className="text-xs text-muted-foreground">+{u.xp_bonus}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="h-12 flex-1 text-base" onClick={onPlayAgain}>
            <RotateCcw className="mr-2 h-4 w-4" />
            เล่นอีกรอบ
          </Button>
          <Button variant="outline" className="h-12 flex-1 text-base" onClick={onExit}>
            ออก
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
