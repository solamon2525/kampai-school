/**
 * multiply-race.service.ts
 * Phase 2: Adaptive difficulty + per-table mastery (Multiply Race)
 *
 * - getStudentMastery: ดึง stats ของนักเรียน (11 แถว แม่ 2..12) + weight สำหรับ weighted random
 * - updateMastery: บันทึก per-table stats หลังเล่นจบ (เกมส่งใน metadata.perTable)
 *
 * เรียกผ่าน RPC SECURITY DEFINER (anon-callable) — ใช้กับเกม HTML iframe ที่ไม่มี auth.uid
 */
import { supabase } from '@/integrations/supabase/client';

export type MultiplyRaceMasteryRow = {
  table_num: number;
  correct_count: number;
  wrong_count: number;
  fastest_avg_ms: number | null;
  badge_level: number;   // 0..3 (0=none, 1=🥉, 2=🥈, 3=🥇)
  weight: number;        // 1..9 — ใช้ใน weighted random table picker
};

export type PerTableStats = {
  table: number;
  correct: number;
  wrong: number;
  avgMs?: number;
};

// ─── Phase 3a: Daily Challenge ─────────────────────────────────────────────
export type DailyChallengeStatus = {
  challenge_date: string;
  played: boolean;
  score: number;
  correct_count: number;
};

export type DailyChallengeLeaderRow = {
  rank: number;
  student_id: string;
  display_name: string;
  photo_url: string | null;
  class_label: string | null;
  score: number;
  correct_count: number;
  duration_sec: number | null;
  completed_at: string;
  is_me: boolean;
};

export const multiplyRaceService = {
  getStudentMastery: async (studentCode: string): Promise<MultiplyRaceMasteryRow[]> => {
    const { data, error } = await supabase.rpc('get_multiply_race_mastery', { p_student_code: studentCode });
    if (error) throw error;
    return (data as unknown as MultiplyRaceMasteryRow[]) ?? [];
  },

  updateMastery: async (studentCode: string, perTable: PerTableStats[]): Promise<void> => {
    if (!perTable.length) return;
    const { error } = await supabase.rpc('update_multiply_race_mastery', {
      p_student_code: studentCode,
      p_per_table: perTable as never,
    });
    if (error) throw error;
  },

  // Daily Challenge — multiply-race เป็นเกมแรกที่ใช้, ออกแบบให้รองรับเกมอื่นได้
  getDailyStatus: async (studentCode: string, gameSlug = 'multiply-race'): Promise<DailyChallengeStatus | null> => {
    const { data, error } = await supabase.rpc('get_my_daily_status', { p_student_code: studentCode, p_game_slug: gameSlug });
    if (error) throw error;
    const rows = data as unknown as DailyChallengeStatus[] | null;
    return rows?.[0] ?? null;
  },

  submitDailyScore: async (
    studentCode: string,
    score: number,
    correct: number,
    durationSec: number | null,
    gameSlug = 'multiply-race',
  ): Promise<{ challenge_date: string; score: number; correct_count: number; was_first: boolean } | null> => {
    const { data, error } = await supabase.rpc('submit_daily_challenge_score', {
      p_student_code: studentCode,
      p_game_slug: gameSlug,
      p_score: score,
      p_correct: correct,
      p_total: 10,
      p_duration_sec: durationSec,
    });
    if (error) throw error;
    return (data as unknown as Array<{ challenge_date: string; score: number; correct_count: number; was_first: boolean }>)?.[0] ?? null;
  },

  getDailyLeaderboard: async (studentCode: string | null, gameSlug = 'multiply-race', limit = 10): Promise<DailyChallengeLeaderRow[]> => {
    const { data, error } = await supabase.rpc('get_daily_challenge_leaderboard', {
      p_game_slug: gameSlug,
      p_student_code: studentCode,
      p_limit: limit,
    });
    if (error) throw error;
    return (data as unknown as DailyChallengeLeaderRow[]) ?? [];
  },
};
