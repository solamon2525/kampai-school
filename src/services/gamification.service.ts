/**
 * gamification.service.ts
 * ระบบคะแนน + เหรียญเกียรติยศกลาง (ทุกเกม) — Migration 155–157
 *
 * - Global XP (normalize ยุติธรรมข้ามเกม — คิดใน record_game_session ฝั่ง DB)
 * - Leaderboards: รวม / รายวิชา (math·thai·english) / รายสัปดาห์
 * - Honor profile: XP + level + streak + เหรียญทั้งหมด + catalog เหรียญสากล
 */
import { supabase } from '@/integrations/supabase/client';

export type MedalTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export type GlobalLeaderboardRow = {
  rank: number;
  student_id: string;
  display_name: string;
  photo_url: string | null;
  class_label: string | null;
  total_xp: number;
  games_played: number;
  medals_count: number;
  is_me: boolean;
};

export type SubjectLeaderboardRow = {
  rank: number;
  student_id: string;
  display_name: string;
  photo_url: string | null;
  class_label: string | null;
  xp: number;
  is_me: boolean;
};

export type WeeklyLeaderboardRow = {
  rank: number;
  student_id: string;
  display_name: string;
  photo_url: string | null;
  class_label: string | null;
  weekly_xp: number;
  weekly_plays: number;
  is_me: boolean;
};

export type HonorMedal = {
  code: string;
  title: string;
  icon: string | null;
  tier: MedalTier;
  game_slug: string | null;   // null = เหรียญสากล
  unlocked_at: string;
};

export type UniversalMedalDef = {
  code: string;
  title: string;
  description: string | null;
  icon: string | null;
  tier: MedalTier;
  kind: string;
  value: number;
  subject_key: string | null;
};

export type HonorProfile = {
  student: { id: string; name: string; photoUrl: string | null; classLabel: string | null };
  total_xp: number;
  games_played: number;
  plays_count: number;
  streak_days: number;
  subject_xp: Record<string, number>;
  aggregates: {
    games_distinct: number;
    online_plays: number;
    online_wins: number;
    tournament_wins: number;
    daily_plays: number;
    modes_distinct: number;
    subjects_distinct: number;
  };
  medals: HonorMedal[];
  universal_catalog: UniversalMedalDef[];
};

// ─── Global level curve (doubling เริ่ม 150 — แยกจาก per-game levelFromXp) ──
const GLOBAL_LEVEL_THRESHOLDS = [0, 150, 450, 1050, 2250, 4650, 9450, 19050, 38250, 76650];

export type GlobalLevelInfo = {
  level: number;
  xpInLevel: number;
  xpToNext: number;
  progress: number;   // 0..1
  isMaxLevel: boolean;
};

export const globalLevelFromXp = (totalXp: number | null | undefined): GlobalLevelInfo => {
  const xp = Math.max(0, Number(totalXp ?? 0));
  let level = 1;
  for (let i = GLOBAL_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= GLOBAL_LEVEL_THRESHOLDS[i]) { level = i + 1; break; }
  }
  const isMaxLevel = level >= GLOBAL_LEVEL_THRESHOLDS.length;
  const floor = GLOBAL_LEVEL_THRESHOLDS[level - 1];
  const ceil = isMaxLevel ? floor : GLOBAL_LEVEL_THRESHOLDS[level];
  const span = isMaxLevel ? 1 : ceil - floor;
  const xpInLevel = xp - floor;
  return {
    level,
    xpInLevel,
    xpToNext: isMaxLevel ? 0 : ceil - xp,
    progress: isMaxLevel ? 1 : xpInLevel / span,
    isMaxLevel,
  };
};

// ─── tier → สี (Tailwind classes — ใช้ตรงกันทุกที่) ─────────────────────
export const TIER_STYLES: Record<MedalTier, { ring: string; bg: string; label: string }> = {
  bronze:  { ring: 'ring-amber-600/60',   bg: 'bg-amber-50',   label: 'ทองแดง' },
  silver:  { ring: 'ring-slate-400/70',   bg: 'bg-slate-50',   label: 'เงิน' },
  gold:    { ring: 'ring-yellow-500/70',  bg: 'bg-yellow-50',  label: 'ทอง' },
  diamond: { ring: 'ring-cyan-400/70',    bg: 'bg-cyan-50',    label: 'เพชร' },
};

export const SUBJECT_LABELS: Record<string, string> = {
  math: 'คณิตศาสตร์',
  thai: 'ภาษาไทย',
  english: 'ภาษาอังกฤษ',
  other: 'วิชาอื่น ๆ',
};

// ─── RPC wrappers ───────────────────────────────────────────────────────
export const gamificationService = {
  getGlobalLeaderboard: async (limit = 10, studentCode: string | null = null): Promise<GlobalLeaderboardRow[]> => {
    const { data, error } = await supabase.rpc('get_global_xp_leaderboard', {
      p_limit: limit, p_student_code: studentCode,
    });
    if (error) throw error;
    return (data as unknown as GlobalLeaderboardRow[]) ?? [];
  },

  getSubjectLeaderboard: async (subjectKey: string, limit = 10, studentCode: string | null = null): Promise<SubjectLeaderboardRow[]> => {
    const { data, error } = await supabase.rpc('get_subject_leaderboard', {
      p_subject_key: subjectKey, p_limit: limit, p_student_code: studentCode,
    });
    if (error) throw error;
    return (data as unknown as SubjectLeaderboardRow[]) ?? [];
  },

  getWeeklyLeaderboard: async (limit = 10, studentCode: string | null = null): Promise<WeeklyLeaderboardRow[]> => {
    const { data, error } = await supabase.rpc('get_weekly_xp_leaderboard', {
      p_limit: limit, p_student_code: studentCode,
    });
    if (error) throw error;
    return (data as unknown as WeeklyLeaderboardRow[]) ?? [];
  },

  getHonorProfile: async (studentCode: string): Promise<HonorProfile | null> => {
    const { data, error } = await supabase.rpc('get_student_honor_profile', {
      p_student_code: studentCode,
    });
    if (error) throw error;
    return (data as unknown as HonorProfile) ?? null;
  },
};

// ─── "ใกล้ปลดล็อก" — คำนวณ client-side จาก aggregates + catalog ──────────
export type NextMedalProgress = {
  medal: UniversalMedalDef;
  current: number;
  target: number;
  progress: number;   // 0..1
};

export const computeNextMedals = (profile: HonorProfile, count = 3): NextMedalProgress[] => {
  const unlocked = new Set(profile.medals.map((m) => m.code));
  const agg = profile.aggregates;
  const currentOf = (m: UniversalMedalDef): number | null => {
    switch (m.kind) {
      case 'games_distinct_gte': return agg.games_distinct;
      case 'global_xp_gte': return profile.total_xp;
      case 'subject_xp_gte': return profile.subject_xp[m.subject_key ?? ''] ?? 0;
      case 'subjects_distinct_gte': return agg.subjects_distinct;
      case 'streak_days_global': return profile.streak_days;
      case 'online_plays_gte': return agg.online_plays;
      case 'online_wins_gte': return agg.online_wins;
      case 'tournament_wins_gte': return agg.tournament_wins;
      case 'daily_plays_gte': return agg.daily_plays;
      case 'modes_distinct_gte': return agg.modes_distinct;
      default: return null;
    }
  };
  return profile.universal_catalog
    .filter((m) => !unlocked.has(m.code))
    .map((m) => {
      const current = currentOf(m);
      if (current == null || !m.value) return null;
      return { medal: m, current, target: m.value, progress: Math.min(1, current / m.value) };
    })
    .filter((x): x is NextMedalProgress => x !== null)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, count);
};
