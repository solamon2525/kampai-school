/**
 * game-play.service.ts
 * Supabase queries for ระบบติดตามการเล่นเกมการศึกษา + XP/Level/Badge
 * Pilot: pizza-master-chef (วิชาคณิตศาสตร์)
 */
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Tables = Database['public']['Tables'];
type Views = Database['public']['Views'];

export type GameSession = Tables['game_sessions']['Row'];
export type GameSessionInsert = Tables['game_sessions']['Insert'];
export type GameAchievement = Tables['game_achievements_catalog']['Row'];
export type GameStudentAchievement = Tables['game_student_achievements']['Row'];
export type GameStudentStats = Views['game_student_stats']['Row'];

export type StudentLookup = {
  id: string;
  display_name: string;
  photo_url: string | null;
  class_label: string | null;
};

export type LeaderboardRow = {
  student_id: string;
  display_name: string;
  photo_url: string | null;
  class_label: string | null;
  personal_best: number;
  plays_count: number;
  total_xp: number;
  last_played_at: string;
};

export type UnlockedBadge = {
  code: string;
  title: string;
  icon: string | null;
  xp_bonus: number;
};

export type RecordSessionResult = {
  session_id: string;
  xp_earned: number;
  total_xp: number;
  unlocked: UnlockedBadge[];
  subject: string | null;
};

export type RecordSessionParams = {
  studentCode: string;
  gameSlug: string;
  score: number;
  mode?: string | null;
  durationSec?: number | null;
  metadata?: Record<string, unknown>;
};

// ─── Level curve (doubling: L(n) = 100 * (2^(n-1) - 1)) ──────────────────────
const LEVEL_THRESHOLDS = [0, 100, 300, 700, 1500, 3100, 6300, 12700, 25500, 51100];

export type LevelInfo = {
  level: number;
  xpInLevel: number;
  xpToNext: number;
  progress: number;
  isMaxLevel: boolean;
};

export const levelFromXp = (totalXp: number | null | undefined): LevelInfo => {
  const xp = Math.max(0, Number(totalXp ?? 0));
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  const isMaxLevel = level >= LEVEL_THRESHOLDS.length;
  const floor = LEVEL_THRESHOLDS[level - 1];
  const ceil = isMaxLevel ? floor : LEVEL_THRESHOLDS[level];
  const span = isMaxLevel ? 1 : ceil - floor;
  const xpInLevel = xp - floor;
  const xpToNext = isMaxLevel ? 0 : ceil - xp;
  const progress = isMaxLevel ? 1 : xpInLevel / span;
  return { level, xpInLevel, xpToNext, progress, isMaxLevel };
};

// ─── RPC: anon-callable ──────────────────────────────────────────────────────
export const gamePlayService = {
  lookupStudent: async (code: string) => {
    const { data, error } = await supabase
      .rpc('lookup_student_for_game', { p_student_code: code });
    if (error) throw error;
    const row = (data as StudentLookup[] | null)?.[0] ?? null;
    return row;
  },

  recordSession: async (p: RecordSessionParams): Promise<RecordSessionResult> => {
    const { data, error } = await supabase.rpc('record_game_session', {
      p_student_code: p.studentCode,
      p_game_slug: p.gameSlug,
      p_score: p.score,
      p_mode: p.mode ?? null,
      p_duration_sec: p.durationSec ?? null,
      p_metadata: (p.metadata ?? {}) as never,
    });
    if (error) throw error;
    return data as unknown as RecordSessionResult;
  },

  getLeaderboard: async (gameSlug: string, limit = 10) => {
    const { data, error } = await supabase
      .rpc('get_game_leaderboard', { p_game_slug: gameSlug, p_limit: limit });
    if (error) throw error;
    return (data as unknown as LeaderboardRow[]) ?? [];
  },

  adminResetGameSessions: async (gameSlug: string, studentId?: string) => {
    const { data, error } = await supabase.rpc('admin_reset_game_sessions', {
      p_game_slug: gameSlug,
      p_student_id: studentId ?? null,
    });
    if (error) throw error;
    return data as { sessions_deleted: number; achievements_deleted: number };
  },

  pushToScoreRecord: async (params: {
    sessionId: string;
    scoreType: 'เก็บ' | 'กลางภาค' | 'ปลายภาค';
    maxScore: number;
    normalizedScore: number;
    semester: '1' | '2';
    academicYear: string;
  }) => {
    const { data, error } = await supabase.rpc('push_game_session_to_score_records', {
      p_session_id: params.sessionId,
      p_score_type: params.scoreType,
      p_max_score: params.maxScore,
      p_normalized_score: params.normalizedScore,
      p_semester: params.semester,
      p_academic_year: params.academicYear,
    });
    if (error) throw error;
    return data as unknown as string;
  },
};

// ─── Read-only table/view queries (requires auth or self) ────────────────────
export const gameStatsService = {
  getForStudent: (studentId: string, gameSlug: string) =>
    supabase
      .from('game_student_stats')
      .select('*')
      .eq('student_id', studentId)
      .eq('game_slug', gameSlug)
      .maybeSingle(),

  getStudentsForGame: (gameSlug: string) =>
    supabase
      .from('game_student_stats')
      .select('*')
      .eq('game_slug', gameSlug)
      .order('personal_best', { ascending: false, nullsFirst: false }),
};

export const gameSessionsService = {
  getByStudent: (studentId: string, gameSlug: string, limit = 50) =>
    supabase
      .from('game_sessions')
      .select('*')
      .eq('student_id', studentId)
      .eq('game_slug', gameSlug)
      .order('created_at', { ascending: false })
      .limit(limit),

  getRecent: (gameSlug: string | null, limit = 100) => {
    let q = supabase
      .from('game_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (gameSlug) q = q.eq('game_slug', gameSlug);
    return q;
  },

  getInDateRange: (gameSlug: string | null, startISO: string, endISO: string) => {
    let q = supabase
      .from('game_sessions')
      .select('id, game_slug, score, mode, duration_sec, xp_earned, created_at, student_id')
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .order('created_at', { ascending: false });
    if (gameSlug) q = q.eq('game_slug', gameSlug);
    return q;
  },
};

export const gameAchievementsService = {
  getCatalog: (gameSlug: string) =>
    supabase
      .from('game_achievements_catalog')
      .select('*')
      .eq('game_slug', gameSlug)
      .order('sort_order', { ascending: true }),

  getUnlocked: (studentId: string, gameSlug: string) =>
    supabase
      .from('game_student_achievements')
      .select('*, game_achievements_catalog!inner(*)')
      .eq('student_id', studentId)
      .eq('game_achievements_catalog.game_slug', gameSlug)
      .order('unlocked_at', { ascending: false }),
};

// ─── Find tracked game by slug (used by wrapper page) ────────────────────────
export const trackedGamesService = {
  getBySlug: (gameSlug: string) =>
    supabase
      .from('educational_hub_items')
      .select('id, title, external_url, subject, game_slug, tracked_game, thumbnail_url, bgm_preset, bgm_url')
      .eq('game_slug', gameSlug)
      .eq('tracked_game', true)
      .eq('is_published', true)
      .maybeSingle(),

  listTracked: () =>
    supabase
      .from('educational_hub_items')
      .select('id, title, external_url, subject, game_slug, thumbnail_url')
      .eq('tracked_game', true)
      .eq('is_published', true)
      .order('title'),
};
