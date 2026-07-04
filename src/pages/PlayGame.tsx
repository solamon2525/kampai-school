import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as LucideIcons from 'lucide-react';
import {
  ArrowLeft,
  Gamepad2,
  Loader2,
  Sparkles,
  Trophy,
  Lock,
  RotateCcw,
  Menu,
  Maximize,
  Minimize,
  X,
  Smartphone,
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { parseCharacterAnimationConfig, resolveCharacterAnimation } from '@/lib/character-animation';
import { parseCharacterColorConfig } from '@/lib/character-color';
import { parsePlatformerBlueprint } from '@/lib/game-blueprint';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

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
import { multiplyRaceService, type PerTableStats } from '@/services/multiply-race.service';
import { thaiVocabService } from '@/services/thai-vocab.service';
import { HonorWall } from '@/components/games/HonorWall';
import { DailyQuestPanel, dailyQuestQueryKey } from '@/components/games/DailyQuestPanel';
import { dailyQuestService, type DailyQuestStatus } from '@/services/daily-quest.service';
import { TIER_STYLES, type MedalTier } from '@/services/gamification.service';
import { studentsService } from '@/services/students.service';
import { versusMatchService } from '@/services/online-match.service';

// ─── Lucide icon resolver ────────────────────────────────────────────────────
type LucideMap = Record<string, React.ComponentType<{ className?: string }>>;
const Icons = LucideIcons as unknown as LucideMap;
const ICON = (name: string | null | undefined) =>
  (name && Icons[name]) || Sparkles;

// ─── Page state ──────────────────────────────────────────────────────────────
type Phase = 'lookup' | 'confirm' | 'pre-game' | 'playing';

/** ตรวจ landscape จาก top window — innerWidth/height ก่อน (สลับจริงเมื่อหมุน) */
function getParentLandscape(): boolean {
  const vv = window.visualViewport;
  const w = vv?.width ?? window.innerWidth;
  const h = vv?.height ?? window.innerHeight;
  if (w > h) return true;
  if (h > w * 1.05) return false;
  try {
    const t = screen.orientation?.type ?? '';
    if (t.startsWith('landscape')) return true;
    if (t.startsWith('portrait')) return false;
  } catch { /* */ }
  if (window.matchMedia?.('(orientation: landscape)')?.matches) return true;
  if (window.matchMedia?.('(orientation: portrait)')?.matches) return false;
  return w > h;
}

// ============================================================================
const PlayGame = () => {
  const { gameSlug: originalSlug = '' } = useParams<{ gameSlug: string }>();
  const gameSlug = originalSlug === 'multiply-rally' ? 'math-rally' : originalSlug;
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Redirect standalone React games/apps directly to their routes
  useEffect(() => {
    if (gameSlug === 'english-quest') {
      navigate('/english-quest', { replace: true });
    }
  }, [gameSlug, navigate]);

  const [phase, setPhase] = useState<Phase>('lookup');
  const [codeInput, setCodeInput] = useState('');
  const [student, setStudent] = useState<StudentLookup | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [result, setResult] = useState<RecordSessionResult | null>(null);
  const [prevLevel, setPrevLevel] = useState<LevelInfo | null>(null);
  const [showExitMenu, setShowExitMenu] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [deviceLandscape, setDeviceLandscape] = useState(() =>
    typeof window !== 'undefined' ? getParentLandscape() : false,
  );
  const [gameSessionStarted, setGameSessionStarted] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const gameContainerRef = useRef<HTMLDivElement | null>(null);
  const sessionSubmittedRef = useRef(false);
  const rtChannelRef = useRef<RealtimeChannel | null>(null);
  const prevQuestRef = useRef<DailyQuestStatus | null>(null);
  const inlineResultRef = useRef(false);   // เกมฝัง XP ลงจอจบเอง (ack 'resultShown') → ไม่เด้งการ์ดลอย

  // ─── fullscreen: ขยายเกมเต็มจอจริง (iframe มี allow="fullscreen" อยู่แล้ว) ───
  const toggleFullscreen = useCallback(() => {
    const el = gameContainerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.();
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches);
  }, []);

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

  const resolvedSlug = gameQuery.data?.game_slug || gameSlug;

  const isMathRunnerMobilePlay =
    phase === 'playing' && resolvedSlug === 'math-runner' && isTouchDevice;

  // per-student stats (loaded once we have a student)
  const statsQuery = useQuery({
    queryKey: ['game-stats', student?.id, resolvedSlug],
    queryFn: async () => {
      if (!student) return null;
      const { data } = await gameStatsService.getForStudent(student.id, resolvedSlug);
      return data;
    },
    enabled: !!student && !!resolvedSlug,
  });

  // badge catalog
  const catalogQuery = useQuery({
    queryKey: ['game-catalog', resolvedSlug],
    queryFn: async () => {
      const { data } = await gameAchievementsService.getCatalog(resolvedSlug);
      return data ?? [];
    },
    enabled: !!resolvedSlug,
  });

  // unlocked badges for this student
  const unlockedQuery = useQuery({
    queryKey: ['game-unlocked', student?.id, resolvedSlug],
    queryFn: async () => {
      if (!student) return [];
      const { data } = await gameAchievementsService.getUnlocked(student.id, resolvedSlug);
      return data ?? [];
    },
    enabled: !!student && !!resolvedSlug,
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

  // leaderboard for this game
  const leaderboardQuery = useQuery({
    queryKey: ['game-leaderboard', resolvedSlug],
    queryFn: async () => {
      return await gamePlayService.getLeaderboard(resolvedSlug, 10);
    },
    enabled: !!resolvedSlug,
  });

  // classmates in same class
  const classmatesQuery = useQuery({
    queryKey: ['classmates', student?.class_label],
    queryFn: async () => {
      if (!student?.class_label) return [];
      const { data, error } = await studentsService.getByClass(student.class_label);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!student && !!student.class_label,
  });

  // Daily Quest: สถานะเควสประจำวันของผู้เล่น (ข้ามเกม — key ที่ student code)
  const trimmedCode = codeInput.trim();
  const questQuery = useQuery({
    queryKey: dailyQuestQueryKey(trimmedCode),
    queryFn: () => dailyQuestService.getStatus(trimmedCode),
    enabled: !!student && !!trimmedCode,
  });

  // Phase 2: per-table mastery สำหรับ multiply-race (adaptive + badges)
  const masteryQuery = useQuery({
    queryKey: ['multiply-race-mastery', codeInput],
    queryFn: async () => {
      if (gameSlug !== 'multiply-race' || !codeInput) return [];
      return await multiplyRaceService.getStudentMastery(codeInput.trim());
    },
    enabled: gameSlug === 'multiply-race' && !!student && !!codeInput,
  });

  // Phase 3a: Daily Challenge สำหรับ multiply-race
  const dailyStatusQuery = useQuery({
    queryKey: ['multiply-race-daily-status', codeInput],
    queryFn: async () => {
      if (gameSlug !== 'multiply-race' || !codeInput) return null;
      return await multiplyRaceService.getDailyStatus(codeInput.trim());
    },
    enabled: gameSlug === 'multiply-race' && !!student && !!codeInput,
  });

  const dailyLeaderboardQuery = useQuery({
    queryKey: ['multiply-race-daily-lb', codeInput],
    queryFn: async () => {
      if (gameSlug !== 'multiply-race' || !codeInput) return [];
      return await multiplyRaceService.getDailyLeaderboard(codeInput.trim(), 'multiply-race', 10);
    },
    enabled: gameSlug === 'multiply-race' && !!student && !!codeInput,
  });

  const thaiVocabCatalogQuery = useQuery({
    queryKey: ['thai-vocab-catalog'],
    queryFn: async () => {
      if (resolvedSlug !== 'thai-vocab-hub') return null;
      const lazy = await thaiVocabService.getCatalogLazy();
      if (lazy?.categories?.length) {
        return { categories: lazy.categories, words: {}, lazy: true as const };
      }
      return await thaiVocabService.getCatalog();
    },
    enabled: resolvedSlug === 'thai-vocab-hub',
    staleTime: 5 * 60 * 1000,
  });

  const thaiVocabMissedQuery = useQuery({
    queryKey: ['thai-vocab-missed', codeInput],
    queryFn: async () => {
      if (resolvedSlug !== 'thai-vocab-hub' || !codeInput) return [];
      return await thaiVocabService.getMissedByCode(codeInput.trim());
    },
    enabled: resolvedSlug === 'thai-vocab-hub' && !!student && !!codeInput,
  });

  // ─── lookup handler ────────────────────────────────────────────────────────
  const handleLookup = useCallback(async (overrideCode?: string) => {
    const code = (overrideCode ?? codeInput).trim();
    if (!code) return;
    setLookupLoading(true);
    setLookupError(null);
    try {
      const found = await gamePlayService.lookupStudent(code);
      if (!found) {
        setLookupError('ไม่พบรหัสนักเรียนนี้ ลองใหม่อีกครั้ง');
        localStorage.removeItem('kampai_student_code');
        return;
      }
      setStudent(found);
      localStorage.setItem('kampai_student_code', code);
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
    prevQuestRef.current = questQuery.data ?? null;
    setResult(null);
    setShowReward(false);
    sessionSubmittedRef.current = false;
    setGameSessionStarted(false);
    setPhase('playing');
  }, [levelInfo, questQuery.data]);

  const postParentViewport = useCallback(() => {
    if (!iframeRef.current?.contentWindow || resolvedSlug !== 'math-runner') return;
    const landscape = getParentLandscape();
    setDeviceLandscape(landscape);
    const vv = window.visualViewport;
    iframeRef.current.contentWindow.postMessage(
      {
        type: 'parentViewport',
        width: vv?.width ?? window.innerWidth,
        height: vv?.height ?? window.innerHeight,
        screenW: window.screen.width,
        screenH: window.screen.height,
        landscape,
        parentHandlesOrientation: true,
        orientation: screen.orientation?.type ?? null,
      },
      '*',
    );
  }, [resolvedSlug]);

  useEffect(() => {
    const onRequest = (e: MessageEvent) => {
      if (e.data?.type !== 'requestParentViewport') return;
      const cw = iframeRef.current?.contentWindow;
      if (cw && e.source !== cw) return;
      postParentViewport();
    };
    window.addEventListener('message', onRequest);
    return () => window.removeEventListener('message', onRequest);
  }, [postParentViewport]);

  useEffect(() => {
    if (phase !== 'playing' || resolvedSlug !== 'math-runner') return;
    const isTouch = window.matchMedia?.('(pointer: coarse)')?.matches;
    if (isTouch) {
      requestAnimationFrame(() => {
        gameContainerRef.current?.requestFullscreen?.().catch(() => {});
      });
    }
  }, [phase, resolvedSlug]);

  useEffect(() => {
    if (phase !== 'playing' || resolvedSlug !== 'math-runner') return;
    const push = () => {
      postParentViewport();
      setTimeout(postParentViewport, 120);
      setTimeout(postParentViewport, 400);
    };
    push();
    window.addEventListener('resize', push);
    window.addEventListener('orientationchange', push);
    document.addEventListener('fullscreenchange', push);
    let mq: MediaQueryList | null = null;
    try {
      mq = window.matchMedia('(orientation: landscape)');
      (mq.addEventListener ? mq.addEventListener('change', push) : mq.addListener(push));
    } catch { /* */ }
    try {
      screen.orientation?.addEventListener?.('change', push);
    } catch { /* */ }
    const iv = window.setInterval(postParentViewport, 800);
    return () => {
      window.removeEventListener('resize', push);
      window.removeEventListener('orientationchange', push);
      document.removeEventListener('fullscreenchange', push);
      if (mq) (mq.removeEventListener ? mq.removeEventListener('change', push) : mq.removeListener(push));
      try { screen.orientation?.removeEventListener?.('change', push); } catch { /* */ }
      window.clearInterval(iv);
    };
  }, [phase, resolvedSlug, postParentViewport]);

  // math-runner มือถือ: ล็อก scroll ทั้งหน้า + sync landscape ตั้งแต่ pre-playing
  useEffect(() => {
    if (!isMathRunnerMobilePlay) return;
    const sync = () => setDeviceLandscape(getParentLandscape());
    sync();
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', sync);
    let mq: MediaQueryList | null = null;
    try {
      mq = window.matchMedia('(orientation: landscape)');
      (mq.addEventListener ? mq.addEventListener('change', sync) : mq.addListener(sync));
    } catch { /* */ }
    try { screen.orientation?.addEventListener?.('change', sync); } catch { /* */ }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', sync);
      if (mq) (mq.removeEventListener ? mq.removeEventListener('change', sync) : mq.removeListener(sync));
      try { screen.orientation?.removeEventListener?.('change', sync); } catch { /* */ }
      document.body.style.overflow = prevOverflow;
    };
  }, [isMathRunnerMobilePlay]);

  // ─── send init to iframe once loaded ───────────────────────────────────────
  // ส่งทั้ง studentCode (เดิม — เกมเก่าใช้ได้) + student/stats/leaderboard (ใหม่ — KAMPAI SDK
  // เอาไปโชว์ชื่อ/คะแนน/อันดับในหน้าเกม โดยไม่ต้องยิง Supabase เอง)
  const handleIframeLoad = useCallback(() => {
    setGameSessionStarted(false);
    if (resolvedSlug === 'math-runner') {
      requestAnimationFrame(() => postParentViewport());
      setTimeout(postParentViewport, 100);
      setTimeout(postParentViewport, 500);
    }
    if (!student || !iframeRef.current?.contentWindow) return;
    // เกม (re)load — รวมกรณีกดปุ่ม "🔄 เล่นอีกครั้ง" ในเกม (location.reload) → เริ่มรอบใหม่สะอาด
    setShowReward(false);
    setResult(null);
    sessionSubmittedRef.current = false;
    const s = statsQuery.data;
    iframeRef.current.contentWindow.postMessage(
      {
        type: 'init',
        studentCode: codeInput.trim(),
        student: {
          id: student.id,
          displayName: student.display_name,
          photoUrl: student.photo_url,
          classLabel: student.class_label,
        },
        stats: {
          playsCount: s?.plays_count ?? 0,
          personalBest: s?.personal_best ?? 0,
          totalXp: s?.total_xp ?? 0,
          level: levelInfo.level,
        },
        leaderboard: (leaderboardQuery.data ?? []).map((r, i) => ({
          rank: i + 1,
          studentId: r.student_id,
          displayName: r.display_name,
          photoUrl: r.photo_url,
          classLabel: r.class_label,
          personalBest: r.personal_best,
          isMe: r.student_id === student.id,
        })),
        classmates: (classmatesQuery.data ?? []).map(c => ({
          id: c.id,
          studentCode: c.student_code,
          displayName: c.name,
          photoUrl: c.photo_url,
          classNumber: c.class_number,
        })),
        // เพลงประกอบรายเกม (ตั้งจากหลังบ้าน) → KAMPAI.sound override default ของเกม
        // bgmUrl (mp3 อัปโหลด) มาก่อน synth preset
        audio: { bgm: gameQuery.data?.bgm_preset ?? null, bgmUrl: gameQuery.data?.bgm_url ?? null },
        character: gameQuery.data?.character_sheet_url
          ? {
              sheetUrl: gameQuery.data.character_sheet_url,
              sheetUrlP2: gameQuery.data.character_sheet_url_p2 ?? null,
              fw: gameQuery.data.character_frame_w ?? 128,
              fh: gameQuery.data.character_frame_h ?? 128,
              frames: gameQuery.data.character_frame_count ?? 12,
              anim: resolveCharacterAnimation(
                parseCharacterAnimationConfig(
                  (gameQuery.data as { character_animation_config?: unknown }).character_animation_config,
                ),
                gameQuery.data.character_frame_count,
              ),
              color: parseCharacterColorConfig(
                (gameQuery.data as { character_color_config?: unknown }).character_color_config,
              ),
            }
          : null,
        // Phase 2/3: per-game data (เกมตัดสินใจใช้หรือไม่)
        gameData: resolvedSlug === 'thai-vocab-hub'
          ? {
              vocab: thaiVocabCatalogQuery.data ?? null,
              missed: thaiVocabMissedQuery.data ?? [],
            }
          : gameSlug === 'multiply-race' ? {
          mastery: masteryQuery.data ?? [],
          daily: {
            status: dailyStatusQuery.data ?? null,
            leaderboard: dailyLeaderboardQuery.data ?? [],
          },
        } : undefined,
        blueprint: parsePlatformerBlueprint(
          (gameQuery.data as { blueprint_json?: unknown } | undefined)?.blueprint_json,
        ) ?? undefined,
      },
      '*',
    );
  }, [student, codeInput, statsQuery.data, levelInfo.level, leaderboardQuery.data, classmatesQuery.data, gameQuery.data?.bgm_preset, gameQuery.data?.bgm_url, gameQuery.data?.character_sheet_url, gameQuery.data?.character_sheet_url_p2, gameQuery.data?.character_frame_w, gameQuery.data?.character_frame_h, gameQuery.data?.character_frame_count, (gameQuery.data as { character_color_config?: unknown } | undefined)?.character_color_config, (gameQuery.data as { blueprint_json?: unknown } | undefined)?.blueprint_json, resolvedSlug, masteryQuery.data, dailyStatusQuery.data, dailyLeaderboardQuery.data, thaiVocabCatalogQuery.data, thaiVocabMissedQuery.data, postParentViewport]);

  // ─── auto-login จาก localStorage (ลดเวลากรอกรหัสเมื่อเปลี่ยนเกม) ────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const saved = localStorage.getItem('kampai_student_code');
    if (saved) {
      setCodeInput(saved);
      handleLookup(saved);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  // ─── receive `navigate` from iframe (exit / select-another-game buttons) ──
  // Not gated by phase — game can request navigation anytime (pause modal, etc.)
  useEffect(() => {
    const navHandler = (e: MessageEvent) => {
      const d = e.data as { type?: string; to?: string } | undefined;
      if (d?.type === 'navigate' && typeof d.to === 'string' && d.to.startsWith('/')) {
        navigate(d.to);
      }
    };
    window.addEventListener('message', navHandler);
    return () => window.removeEventListener('message', navHandler);
  }, [navigate]);

  // Thai Vocab Hub — lazy load คำทีละหมวดจาก DB (เฟส G)
  useEffect(() => {
    if (phase !== 'playing' || resolvedSlug !== 'thai-vocab-hub') return;
    const handler = async (e: MessageEvent) => {
      const d = e.data as { type?: string; slug?: string } | undefined;
      if (d?.type !== 'requestVocabWords' || typeof d.slug !== 'string') return;
      const cw = iframeRef.current?.contentWindow;
      if (cw && e.source !== cw) return;
      try {
        const words = await thaiVocabService.getWordsByCategory(d.slug);
        (e.source as Window | null)?.postMessage(
          { type: 'vocabWords', slug: d.slug, words },
          '*',
        );
      } catch (err) {
        console.warn('vocabWords fetch failed', err);
        (e.source as Window | null)?.postMessage(
          { type: 'vocabWords', slug: d.slug, words: [] },
          '*',
        );
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [phase, resolvedSlug]);

  // ─── receive gameEnd from iframe ───────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return;
    const handler = async (e: MessageEvent) => {
      const data = e.data as
        | { type?: string; score?: number; mode?: string; metadata?: Record<string, unknown> }
        | undefined;
      if (data?.type === 'gameStart') {
        setShowReward(false);
        sessionSubmittedRef.current = false;
        inlineResultRef.current = false;
        setGameSessionStarted(true);
        if (resolvedSlug === 'math-runner' && window.matchMedia?.('(pointer: coarse)')?.matches) {
          requestAnimationFrame(() => {
            gameContainerRef.current?.requestFullscreen?.().catch(() => {});
            try {
              void screen.orientation?.lock?.('landscape');
            } catch { /* iOS/PWA อาจไม่รองรับ */ }
            postParentViewport();
          });
        }
        return;
      }
      if (data?.type === 'resultShown') { inlineResultRef.current = true; return; }
      if (data?.type !== 'gameEnd') return;
      if (sessionSubmittedRef.current) return;
      setGameSessionStarted(false);
      sessionSubmittedRef.current = true;

      if (!student || typeof data.score !== 'number') {
        console.warn('[PlayGame] dropped gameEnd: missing student or invalid score', {
          hasStudent: !!student,
          scoreType: typeof data.score,
          data,
        });
        return;
      }
      try {
        const submitted = await gamePlayService.recordSession({
          studentCode: codeInput.trim(),
          gameSlug: resolvedSlug,
          score: data.score,
          mode: data.mode ?? null,
          durationSec:
            typeof data.metadata?.duration === 'number'
              ? (data.metadata.duration as number)
              : null,
          metadata: data.metadata ?? {},
        });
        setResult(submitted);
        // ส่งผล XP กลับเข้าเกม → SDK ฝังลงจอจบของเกม (จอเดียว); เกมที่ฝังเองจะ ack กัน RewardPopup ลอยซ้ำ
        try {
          const _nl = levelFromXp(submitted.total_xp);
          (e.source as Window | null)?.postMessage(
            { type: 'gameResult', result: submitted, level: _nl.level, leveledUp: !!prevLevel && _nl.level > prevLevel.level },
            '*',
          );
        } catch { /* */ }
        statsQuery.refetch();
        unlockedQuery.refetch();
        leaderboardQuery.refetch();
        // Phase 2: บันทึก per-table mastery (multiply-race)
        if (gameSlug === 'multiply-race' && Array.isArray(data.metadata?.perTable)) {
          const perTable = (data.metadata.perTable as PerTableStats[]) ?? [];
          try {
            await multiplyRaceService.updateMastery(codeInput.trim(), perTable);
            masteryQuery.refetch();
          } catch (e) { /* mastery บันทึกพลาดไม่กระทบเกม */ console.warn('mastery update failed', e); }
        }
        // Phase 3a: บันทึก Daily Challenge (multiply-race) — เฉพาะตอน mode='daily'
        if (gameSlug === 'multiply-race' && data.mode === 'daily') {
          const correct = typeof data.metadata?.correct === 'number' ? (data.metadata.correct as number) : 0;
          const durationSec = typeof data.metadata?.duration === 'number' ? (data.metadata.duration as number) : null;
          try {
            await multiplyRaceService.submitDailyScore(codeInput.trim(), data.score, correct, durationSec);
            dailyStatusQuery.refetch();
            dailyLeaderboardQuery.refetch();
          } catch (e) { console.warn('daily submit failed', e); }
        }
        // Phase D: บันทึกคำที่พลาด Thai Vocab Hub → DB
        if (resolvedSlug === 'thai-vocab-hub') {
          const categorySlug = typeof data.metadata?.categorySlug === 'string' ? data.metadata.categorySlug : '';
          const missed = Array.isArray(data.metadata?.missedWords) ? data.metadata.missedWords : [];
          if (categorySlug && missed.length > 0) {
            try {
              await thaiVocabService.recordMissedByCode(
                codeInput.trim(),
                categorySlug,
                missed as { word: string; reading: string; meaning: string }[],
              );
              thaiVocabMissedQuery.refetch();
            } catch (e) { console.warn('thai vocab missed sync failed', e); }
          }
          const indicatorCodes = Array.isArray(data.metadata?.indicatorCodes)
            ? (data.metadata.indicatorCodes as string[])
            : missed
                .map((w) => (w as { indicator_code?: string }).indicator_code)
                .filter((c): c is string => !!c);
          if (indicatorCodes.length > 0) {
            try {
              await thaiVocabService.recordMissedIndicatorsByCode(codeInput.trim(), indicatorCodes);
            } catch (e) { console.warn('vocab indicator events failed', e); }
          }
        }
        // Daily Quest: trigger ฝั่ง DB เครดิตเควสให้แล้วตอน insert session → refetch สถานะ + celebrate
        try {
          const before = prevQuestRef.current;
          const refreshed = await queryClient.fetchQuery({
            queryKey: dailyQuestQueryKey(codeInput.trim()),
            queryFn: () => dailyQuestService.getStatus(codeInput.trim()),
          });
          if (refreshed) {
            const beforeDone = new Set((before?.subjects ?? []).filter((s) => s.done).map((s) => s.key));
            const newlyDone = refreshed.subjects.filter((s) => s.done && !beforeDone.has(s.key));
            const justAllComplete = refreshed.all_complete && !before?.all_complete;
            if (justAllComplete) {
              confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 } });
              toast({
                title: '🎉 ครบทุกวิชาประจำวันแล้ว!',
                description: `รับ +${refreshed.bonus_points} แต้มพิเศษ · ทำต่อเนื่อง ${refreshed.streak_days} วัน 🔥`,
              });
            } else if (newlyDone.length > 0) {
              toast({
                title: `✅ ผ่านเควส ${newlyDone.map((s) => s.label).join(' + ')}!`,
                description: `เหลืออีก ${refreshed.required_count - refreshed.completed_count} วิชาวันนี้`,
              });
            }
          }
        } catch (e) {
          console.warn('daily quest refresh failed', e);
        }
        // เด้งการ์ด XP ลอยเฉพาะเกมที่ไม่ฝัง XP เองในจอจบ (ไม่ ack 'resultShown' ภายใน 600ms = เกมเก่า/ไม่มี slot)
        setTimeout(() => { if (!inlineResultRef.current) setShowReward(true); }, 600);
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
  }, [phase, student, codeInput, resolvedSlug, toast, statsQuery, unlockedQuery, leaderboardQuery, queryClient, postParentViewport]);

  // ─── โหมด 2 คน (Versus) — บันทึก 2 session + ส่ง head-to-head/แชมป์ห้องกลับเข้าเกม ──
  useEffect(() => {
    if (phase !== 'playing') return;
    // ส่งสถิติ (แชมป์ห้อง + head-to-head) กลับเข้า iframe
    const postVersusData = async (opponentId?: string | null) => {
      if (!student || !iframeRef.current?.contentWindow) return;
      try {
        const [champions, headToHead] = await Promise.all([
          versusMatchService.getLeaderboard(student.class_label, 90, 5),
          opponentId ? versusMatchService.getHeadToHead(student.id, opponentId) : Promise.resolve(null),
        ]);
        iframeRef.current.contentWindow.postMessage(
          {
            type: 'versusData',
            champions: champions.map((r) => ({ name: r.name, photo_url: r.photo_url, wins: r.wins, matches: r.matches })),
            headToHead,
          },
          '*',
        );
      } catch (err) {
        console.warn('versusData fetch failed', err);
      }
    };

    const handler = async (e: MessageEvent) => {
      const d = e.data as
        | {
            type?: string;
            room?: string;
            format?: string;
            opponentId?: string | null;
            opponentCode?: string | null;
            p1?: { score?: number; correct?: number; roundsWon?: number; perTable?: unknown };
            p2?: { score?: number; correct?: number; roundsWon?: number; perTable?: unknown };
          }
        | undefined;
      if (!d) return;

      if (d.type === 'versusRequest') {
        await postVersusData(d.opponentId);
        return;
      }

      if (d.type === 'versusEnd') {
        if (!student) return;
        const p1 = d.p1 ?? {};
        const p2 = d.p2 ?? {};
        const base = { room: d.room, format: d.format };
        try {
          await Promise.all([
            gamePlayService.recordSession({
              studentCode: codeInput.trim(),
              gameSlug: resolvedSlug,
              score: p1.score ?? 0,
              mode: 'versus',
              metadata: { ...base, correct: p1.correct ?? 0, roundsWon: p1.roundsWon ?? 0, opponent: d.opponentId, perTable: p1.perTable ?? [] },
            }),
            d.opponentCode
              ? gamePlayService.recordSession({
                  studentCode: String(d.opponentCode),
                  gameSlug: resolvedSlug,
                  score: p2.score ?? 0,
                  mode: 'versus',
                  metadata: { ...base, correct: p2.correct ?? 0, roundsWon: p2.roundsWon ?? 0, opponent: student.id, perTable: p2.perTable ?? [] },
                })
              : Promise.resolve(null),
          ]);
        } catch (err) {
          console.warn('versus record failed', err);
        }
        // trigger สร้างแมตช์เสร็จแล้ว → ดึง head-to-head + แชมป์ห้องล่าสุดกลับเข้าเกม
        await postVersusData(d.opponentId);
        return;
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [phase, student, codeInput, resolvedSlug]);

  // ─── realtime relay: ห้องออนไลน์ของเกม (broadcast + presence) ──────────────
  // เกมใน iframe ไม่มี anon key → wrapper เปิด channel ให้ แล้วรีเลย์ผ่าน postMessage
  // (KAMPAI.online.* ฝั่งเกม ↔ rtJoin/rtSend/rtLeave ↔ ช่องนี้)
  useEffect(() => {
    if (phase !== 'playing' || !student) return;

    const postToIframe = (obj: unknown) =>
      iframeRef.current?.contentWindow?.postMessage(obj, '*');

    const teardown = () => {
      if (rtChannelRef.current) {
        supabase.removeChannel(rtChannelRef.current);
        rtChannelRef.current = null;
      }
    };

    const relay = (e: MessageEvent) => {
      const d = e.data as
        | { type?: string; room?: string; meta?: Record<string, unknown>; event?: string; payload?: unknown }
        | undefined;
      if (!d?.type) return;

      if (d.type === 'rtJoin' && typeof d.room === 'string') {
        teardown(); // ออกจากห้องเก่าก่อน (ถ้ามี)
        const meta = { ...(d.meta ?? {}), id: student.id };
        const channel = supabase.channel(`live:${resolvedSlug}:${d.room}`, {
          config: { presence: { key: student.id }, broadcast: { self: false } },
        });
        channel
          .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState() as Record<string, Array<Record<string, unknown>>>;
            const members = Object.values(state).map((entries) => entries[0]).filter(Boolean);
            postToIframe({ type: 'rtPresence', members });
          })
          .on('broadcast', { event: 'msg' }, ({ payload }) => {
            const p = payload as { ev?: string; data?: unknown; from?: string };
            postToIframe({ type: 'rtEvent', event: p?.ev, payload: p?.data, fromKey: p?.from });
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              channel.track(meta);
              postToIframe({ type: 'rtJoined', room: d.room });
            }
          });
        rtChannelRef.current = channel;
      } else if (d.type === 'rtSend' && rtChannelRef.current) {
        rtChannelRef.current.send({
          type: 'broadcast',
          event: 'msg',
          payload: { ev: d.event, data: d.payload, from: student.id },
        });
      } else if (d.type === 'rtLeave') {
        teardown();
      }
    };

    window.addEventListener('message', relay);
    return () => {
      window.removeEventListener('message', relay);
      teardown();
    };
  }, [phase, student, resolvedSlug]);

  const handlePlayAgain = useCallback(() => {
    setResult(null);
    setShowReward(false);
    setPrevLevel(levelInfo);
    sessionSubmittedRef.current = false;
    setGameSessionStarted(false);
    setPhase('pre-game');
  }, [levelInfo]);

  const handleSwitchStudent = useCallback(() => {
    setStudent(null);
    setCodeInput('');
    setResult(null);
    setShowReward(false);
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
    // C1: ส่งต่อพารามิเตอร์ "ครูตั้งโจทย์" (grade/mode/practice) เข้าไปในเกม
    const extra = ['grade', 'mode', 'practice']
      .map((k) => { const v = searchParams.get(k); return v ? `&${k}=${encodeURIComponent(v)}` : ''; })
      .join('');
    return `${url}${sep}embed=1${extra}&t=${Date.now()}`;
  }, [gameQuery.data?.external_url, searchParams]);

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
        <p className="text-lg text-muted-foreground">
          {gameQuery.isError ? 'โหลดข้อมูลเกมไม่สำเร็จ — ลอง refresh' : 'ไม่พบเกมนี้ในระบบติดตาม'}
        </p>
        {gameQuery.isError && (
          <p className="text-xs text-muted-foreground max-w-md text-center">
            {(gameQuery.error as Error)?.message ?? 'query error'}
          </p>
        )}
        <Button asChild variant="outline">
          <Link to="/h/nattapong">
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับคลังสื่อ
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-background',
        isMathRunnerMobilePlay
          ? 'fixed inset-0 z-50 flex flex-col overflow-hidden'
          : phase === 'playing'
            ? 'flex h-[100dvh] flex-col overflow-hidden'
            : 'min-h-screen',
      )}
    >
      {/* math-runner มือถือ แนวตั้ง: overlay เฉพาะตอนเล่นจริง (จอเมนูเกมกดได้) */}
      {isMathRunnerMobilePlay && !deviceLandscape && gameSessionStarted && (
        <div
          className="fixed inset-0 z-[10001] flex flex-col items-center justify-center bg-foreground px-6 text-center text-background"
          aria-live="polite"
        >
          <Smartphone className="mb-4 h-16 w-16 animate-pulse text-primary" aria-hidden />
          <p className="text-xl font-bold">
            กรุณาหมุนเครื่องเป็น <span className="text-primary">แนวนอน</span>
          </p>
          <p className="mt-2 text-sm text-background/70">Math Runner เล่นได้เฉพาะแนวนอนเท่านั้น</p>
          <p className="mt-6 rounded-xl bg-background/10 px-4 py-2 text-sm font-semibold text-background/80">
            หมุนมือถือแล้วเกมจะเริ่มได้ทันที
          </p>
          <p className="mt-3 max-w-xs text-xs text-background/60">
            หมุนแล้วไม่เปลี่ยน? เปิดจาก Safari/Chrome โดยตรง (ไม่ใช่ไอคอนหน้าจอ) หรือกดปุ่มเต็มจอ ↗
          </p>
        </div>
      )}

      {/* header — math-runner ซ่อนตอนเล่นเพื่อให้ iframe ได้พื้นที่แนวนอนเต็มที่ */}
      {!(phase === 'playing' && resolvedSlug === 'math-runner') && (
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
                <Link to="/h/nattapong">
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
      )}

      <main className={cn('mx-auto w-full', phase === 'playing' ? 'min-h-0 flex-1 max-w-none p-0' : 'max-w-5xl p-4 sm:p-6')}>
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
          <div className="space-y-4">
            {/* โปรไฟล์ XP รวม + เหรียญล่าสุด (gamification กลาง) */}
            <HonorWall studentCode={codeInput} variant="compact" />
            {/* ภารกิจประจำวัน — เหลือเควสวิชาอะไรบ้างวันนี้ */}
            <DailyQuestPanel studentCode={codeInput} variant="full" />
            <PreGamePanel
              student={student}
              stats={statsQuery.data}
              levelInfo={levelInfo}
              catalog={catalogQuery.data ?? []}
              unlockedIds={unlockedIds}
              onStart={handleStart}
              leaderboard={leaderboardQuery.data}
              leaderboardLoading={leaderboardQuery.isLoading}
            />
          </div>
        )}

        {phase === 'playing' && iframeUrl && (
          <div
            ref={gameContainerRef}
            className={cn(
              'relative flex flex-col bg-background',
              isMathRunnerMobilePlay ? 'h-full min-h-0 flex-1' : 'h-full',
            )}
          >
            {/* Toolbar — math-runner มือถือแนวนอน: ปุ่มลอย ไม่กินแนวตั้ง */}
            {isMathRunnerMobilePlay && deviceLandscape ? (
              <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-end gap-2 p-2">
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="pointer-events-auto rounded-full bg-foreground/70 p-2 text-background backdrop-blur-sm transition-colors hover:bg-foreground/85"
                  title={isFullscreen ? 'ออกจากเต็มจอ' : 'เต็มจอ'}
                  aria-label={isFullscreen ? 'ออกจากเต็มจอ' : 'เต็มจอ'}
                >
                  {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setShowExitMenu(true)}
                  className="pointer-events-auto rounded-full bg-foreground/70 p-2 text-background backdrop-blur-sm transition-colors hover:bg-foreground/85"
                  title="เมนู / ออกจากเกม"
                  aria-label="เมนู / ออกจากเกม"
                >
                  <Menu className="h-4 w-4" />
                </button>
              </div>
            ) : !isMathRunnerMobilePlay ? (
            <div className="shrink-0 flex items-center justify-end gap-2 px-2 py-1.5 bg-black/60 backdrop-blur-sm border-b border-white/10">
              <button
                onClick={toggleFullscreen}
                className="rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20 transition-colors"
                title={isFullscreen ? 'ออกจากเต็มจอ' : 'เต็มจอ'}
                aria-label={isFullscreen ? 'ออกจากเต็มจอ' : 'เต็มจอ'}
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setShowExitMenu(true)}
                className="rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20 transition-colors"
                title="เมนู / ออกจากเกม"
                aria-label="เมนู / ออกจากเกม"
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
            ) : null}
            {/* iframe กินพื้นที่ที่เหลือ — math-runner แนวนอน = เต็มจอ */}
            <div className="relative min-h-0 flex-1">
              <PlayingPanel iframeRef={iframeRef} url={iframeUrl} onLoad={handleIframeLoad} />
            </div>

            {/* Exit Menu Dialog — 4 ตัวเลือก */}
            <Dialog open={showExitMenu} onOpenChange={setShowExitMenu}>
              <DialogContent className="sm:max-w-xs">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Menu className="h-4 w-4" /> เมนูเกม
                  </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-2 pt-1">
                  {/* 1. เล่นซ้ำ */}
                  <Button
                    variant="outline"
                    className="justify-start gap-3 h-12"
                    onClick={() => { setShowExitMenu(false); handlePlayAgain(); }}
                  >
                    <RotateCcw className="h-4 w-4 shrink-0" />
                    <span>เล่นซ้ำเกมนี้</span>
                  </Button>

                  {/* 2. เลือกเกมอื่น — keep session */}
                  <Button
                    variant="outline"
                    className="justify-start gap-3 h-12"
                    onClick={() => navigate('/h/nattapong')}
                  >
                    <Gamepad2 className="h-4 w-4 shrink-0" />
                    <div className="flex flex-col items-start">
                      <span>เลือกเกมอื่น</span>
                      <span className="text-[10px] text-muted-foreground font-normal">ไม่ต้องกรอกรหัสใหม่</span>
                    </div>
                  </Button>

                  {/* 3. เปลี่ยนผู้เล่น — clear session, stay on this game */}
                  <Button
                    variant="outline"
                    className="justify-start gap-3 h-12"
                    onClick={() => {
                      localStorage.removeItem('kampai_student_code');
                      setShowExitMenu(false);
                      handleSwitchStudent();
                    }}
                  >
                    <ArrowLeft className="h-4 w-4 shrink-0" />
                    <div className="flex flex-col items-start">
                      <span>เปลี่ยนผู้เล่น</span>
                      <span className="text-[10px] text-muted-foreground font-normal">กรอกรหัสใหม่ — เกมเดิม</span>
                    </div>
                  </Button>

                  {/* 4. กลับหน้าหลัก — clear session */}
                  <Button
                    variant="ghost"
                    className="justify-start gap-3 h-12 text-muted-foreground"
                    onClick={() => navigate('/h/nattapong')}
                  >
                    <ArrowLeft className="h-4 w-4 shrink-0" />
                    <span>กลับหน้าหลัก</span>
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* การ์ด XP ลอยมุมล่าง — ไม่บังจอเกม ไม่มี backdrop (เด้งหลังหน่วง / ออนไลน์ทันที) */}
            {showReward && student && result && (
              <RewardPopup
                student={student}
                result={result}
                prevLevel={prevLevel}
                onPlayAgain={() => { setShowReward(false); handlePlayAgain(); }}
                onExit={handleSwitchStudent}
                onClose={() => setShowReward(false)}
              />
            )}
          </div>
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

// ─── Web Audio API Sound Synthesizer ──────────────────────────────────────────
const playCelebrationSound = (type: 'levelUp' | 'personalBest') => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playNote = (freq: number, start: number, duration: number, vol = 0.12) => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      
      gainNode.gain.setValueAtTime(vol, start);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start(start);
      osc.stop(start + duration);
    };

    const now = audioCtx.currentTime;
    if (type === 'levelUp') {
      const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
      notes.forEach((freq, idx) => {
        playNote(freq, now + idx * 0.1, 0.45, 0.12);
      });
    } else if (type === 'personalBest') {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        playNote(freq, now + idx * 0.08, 0.55, 0.08);
      });
    }
  } catch (err) {
    console.warn('AudioContext blocked or unsupported:', err);
  }
};

const LeaderboardCard = ({
  leaderboard,
  loading,
  currentStudentId,
}: {
  leaderboard: any[] | undefined;
  loading: boolean;
  currentStudentId: string;
}) => {
  return (
    <Card className="h-full border border-border bg-card">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <Trophy className="h-5 w-5 text-amber-500 animate-pulse" />
          <div>
            <h3 className="text-sm font-bold text-foreground">10 อันดับเกียรติยศ</h3>
            <p className="text-[10px] text-muted-foreground">ทำเนียบสถิติสูงสุดประจำเกม</p>
          </div>
        </div>

        {loading ? (
          <div className="flex py-10 items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">กำลังโหลด...</span>
          </div>
        ) : !leaderboard || leaderboard.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground italic">ยังไม่มีใครทำสถิติเกมนี้</p>
        ) : (
          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
            {leaderboard.map((row, index) => {
              const isSelf = row.student_id === currentStudentId;
              const rank = index + 1;
              let medalIcon = null;
              let rankBg = 'bg-muted/40 text-muted-foreground';
              let rankBorder = 'border-transparent';

              if (rank === 1) {
                medalIcon = '🥇';
                rankBg = 'bg-amber-500/15 text-amber-500 border-amber-500/30';
              } else if (rank === 2) {
                medalIcon = '🥈';
                rankBg = 'bg-slate-400/15 text-slate-400 border-slate-400/30';
              } else if (rank === 3) {
                medalIcon = '🥉';
                rankBg = 'bg-amber-700/15 text-amber-700 border-amber-700/30';
              }

              return (
                <div
                  key={row.student_id}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border p-2 transition-all duration-200',
                    isSelf 
                      ? 'border-primary/40 bg-primary/10 shadow-[0_0_10px_rgba(59,130,246,0.12)] scale-[1.01]' 
                      : 'border-border/40 hover:border-border bg-card/40'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-[11px] font-bold',
                      rankBg,
                      rankBorder
                    )}
                  >
                    {medalIcon ? medalIcon : rank}
                  </div>

                  <PersonAvatar
                    name={row.display_name}
                    photoUrl={row.photo_url}
                    size="sm"
                    className="h-7 w-7 ring-1 ring-border"
                  />

                  <div className="flex-1 min-w-0">
                    <p className={cn('text-xs font-semibold truncate', isSelf ? 'text-primary' : 'text-foreground')}>
                      {row.display_name}
                    </p>
                    <p className="text-[9px] text-muted-foreground truncate">
                      ชั้น {row.class_label ?? '—'} · Lv.{levelFromXp(row.total_xp).level}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">
                      {row.personal_best.toLocaleString('th-TH')}
                    </p>
                    <p className="text-[9px] text-muted-foreground leading-none">
                      {row.plays_count} ครั้ง
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const PreGamePanel = ({
  student,
  stats,
  levelInfo,
  catalog,
  unlockedIds,
  onStart,
  leaderboard,
  leaderboardLoading,
}: {
  student: StudentLookup;
  stats: { plays_count: number | null; personal_best: number | null; total_xp: number | null } | null | undefined;
  levelInfo: LevelInfo;
  catalog: Array<{ id: string; code: string; title_th: string; description_th: string | null; icon: string | null; threshold_kind: string }>;
  unlockedIds: Set<string>;
  onStart: () => void;
  leaderboard: any[] | undefined;
  leaderboardLoading: boolean;
}) => (
  <div className="grid gap-6 md:grid-cols-3 items-start">
    <div className="md:col-span-2 space-y-5">
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
              <p className="text-xs text-muted-foreground">{(stats?.total_xp ?? 0).toLocaleString('th-TH')} XP ในเกมนี้</p>
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

    <div className="md:col-span-1">
      <LeaderboardCard
        leaderboard={leaderboard}
        loading={leaderboardLoading}
        currentStudentId={student.id}
      />
    </div>
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
          // เหรียญใหม่ (migration 156+) icon เป็น emoji — เหรียญเก่าเป็นชื่อ lucide
          const isEmoji = !!a.icon && !/^[A-Za-z]/.test(a.icon);
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
              {!unlocked ? (
                <Lock className="h-7 w-7 text-muted-foreground" />
              ) : isEmoji ? (
                <span className="text-[26px] leading-7">{a.icon}</span>
              ) : (
                <Icon className="h-7 w-7 text-primary" />
              )}
              <p className="text-xs font-medium leading-tight text-foreground">{a.title_th}</p>
            </div>
          );
        })}
      </div>
    </CardContent>
  </Card>
);

/**
 * PlayingPanel — โหลด HTML game ผ่าน fetch → Blob URL
 * เพื่อแก้ปัญหา Supabase Storage serve Content-Type: text/plain
 * (ทำให้ iframe แสดง source code แทนที่จะ render เป็นเกม)
 */
const PlayingPanel = ({
  iframeRef,
  url,
  onLoad,
}: {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  url: string;
  onLoad: () => void;
}) => {
  const [iframeSrc, setIframeSrc] = useState('');

  useEffect(() => {
    // If it's a legacy local game (served from the local public/games folder),
    // load it directly so that its query params (like ?embed=1) are preserved in the iframe URL search.
    // Storage-based games (/edu-hub-games/) will still use the fetch -> Blob URL flow to solve content-type issues.
    if (!url.includes('/edu-hub-games/')) {
      setIframeSrc(url);
      return;
    }

    let blobUrl: string | null = null;
    setIframeSrc('');

    fetch(url, { mode: 'cors' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((html) => {
        // สร้าง Blob URL พร้อม Content-Type: text/html ถูกต้อง
        const blob = new Blob([html], { type: 'text/html' });
        blobUrl = URL.createObjectURL(blob);
        setIframeSrc(blobUrl);
      })
      .catch(() => {
        // Fallback: ใช้ URL ตรงๆ ถ้า fetch ไม่ได้
        setIframeSrc(url);
      });

    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [url]);

  if (!iframeSrc) {
    return (
      <Card className="h-full overflow-hidden rounded-none border-0">
        <div className="flex h-full items-center justify-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">กำลังโหลดเกม...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-hidden rounded-none border-0">
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        onLoad={onLoad}
        title="game"
        className="block h-full w-full border-0"
        sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-modals"
        allow="pointer-lock; fullscreen; autoplay; cross-origin-isolated; camera; microphone"
      />
    </Card>
  );
};

/**
 * RewardPopup — การ์ด XP เล็ก ๆ ลอยมุมล่าง บนจอจบเกมของเกมเอง
 * ไม่ใช่ shadcn Dialog (เลี่ยง backdrop ทึบที่บังจอเกม) — เป็น Card ลอยล้วน
 * ค้างไว้จนผู้เล่นกดปิด/เล่นซ้ำ/ออก (ไม่ auto-hide)
 */
const RewardPopup = ({
  student,
  result,
  prevLevel,
  onPlayAgain,
  onExit,
  onClose,
}: {
  student: StudentLookup;
  result: RecordSessionResult;
  prevLevel: LevelInfo | null;
  onPlayAgain: () => void;
  onExit: () => void;
  onClose: () => void;
}) => {
  const newLevel = useMemo(() => levelFromXp(result.total_xp), [result.total_xp]);
  const leveledUp = !!prevLevel && newLevel.level > prevLevel.level;

  // celebrate ตอนการ์ดโผล่ (จังหวะตรงกับที่ผู้เล่นเห็น XP)
  useEffect(() => {
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.65 } });
    if (result.unlocked.length > 0 || leveledUp) {
      setTimeout(() => confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } }), 300);
    }
    if (leveledUp) playCelebrationSound('levelUp');
    else if (result.xp_earned > 0) playCelebrationSound('personalBest');
  }, [result, leveledUp]);

  return (
    <div className="absolute bottom-4 left-1/2 z-20 w-[min(94vw,420px)] -translate-x-1/2 sm:bottom-6">
      <Card className="relative border-primary/30 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={onClose}
          className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="ปิด"
        >
          <X className="h-4 w-4" />
        </button>
        <CardContent className="space-y-3 p-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <PersonAvatar
              name={student.display_name}
              photoUrl={student.photo_url}
              size="sm"
              className="h-11 w-11 ring-2 ring-primary/20"
            />
            <div className="text-left">
              <p className="text-2xl font-bold leading-none text-primary">
                +{result.xp_earned.toLocaleString('th-TH')} XP
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                รวม {result.total_xp.toLocaleString('th-TH')} XP · Lv.{newLevel.level}
              </p>
            </div>
          </div>

          {leveledUp && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-2 animate-pulse">
              <p className="text-sm font-semibold text-primary">🎉 เลเวลอัพ! → Lv.{newLevel.level}</p>
            </div>
          )}

          {result.unlocked.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {result.unlocked.map((u: UnlockedBadge) => {
                // เหรียญใหม่ (155+) icon เป็น emoji + มี tier — เหรียญเก่าเป็นชื่อ lucide
                const isEmoji = !!u.icon && !/^[A-Za-z]/.test(u.icon);
                const Icon = ICON(u.icon);
                const tierStyle = TIER_STYLES[(u.tier as MedalTier) ?? 'bronze'] ?? TIER_STYLES.bronze;
                return (
                  <div
                    key={u.code}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border border-primary/30 px-2.5 py-1 animate-bounce ring-2',
                      tierStyle.bg, tierStyle.ring,
                    )}
                  >
                    {isEmoji ? (
                      <span className="text-sm leading-none">{u.icon}</span>
                    ) : (
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    )}
                    <span className="text-[11px] font-medium text-foreground">{u.title}</span>
                    {u.xp_bonus > 0 && (
                      <span className="text-[11px] text-muted-foreground">+{u.xp_bonus}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-2">
            <Button className="h-10 flex-1 text-sm" onClick={onPlayAgain}>
              <RotateCcw className="mr-1.5 h-4 w-4" />
              เล่นซ้ำ
            </Button>
            <Button variant="outline" className="h-10 flex-1 text-sm" onClick={onExit}>
              ออก
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
