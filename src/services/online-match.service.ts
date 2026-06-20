/**
 * online-match.service.ts
 * สถิติแข่งออนไลน์ (Win/Loss) — Migration 162
 *
 * แมตช์ reconstruct จาก game_sessions (mode='online') จับกลุ่ม (game_slug, room, ≤30 นาที)
 * จัดอันดับด้วย score → online_matches + online_match_participants (เติมด้วย trigger + backfill).
 * RPC ทั้งหมด public (leaderboard/สังเวียนสาธารณะ เหมือน game leaderboard เดิม).
 */
import { supabase } from '@/integrations/supabase/client';

export type OnlineOverview = {
  total_matches: number;
  decisive_matches: number;
  distinct_players: number;
  distinct_games: number;
  avg_players_per_match: number;
  solo_rate: number;
  most_popular_game: string | null;
};

export type OnlineGameStat = {
  game_slug: string;
  title: string;
  matches: number;
  decisive_matches: number;
  unique_players: number;
  total_participants: number;
  avg_players: number;
  solo_rate: number;
  avg_score_spread: number;
  blowout_rate: number;
  repeat_rate: number | null;
  last_played_at: string | null;
};

export type OnlineStudentRow = {
  student_id: string;
  name: string;
  class: string | null;
  photo_url: string | null;
  matches: number;
  wins: number;
  losses: number;
  win_rate: number | null;
  distinct_opponents: number;
  last_played: string | null;
};

export type HeadToHeadRow = {
  opponent_id: string;
  name: string;
  class: string | null;
  photo_url: string | null;
  matches: number;
  wins: number;
  losses: number;
};

export type MatchStanding = {
  name: string;
  class: string | null;
  photo_url: string | null;
  rank: number;
  score: number;
  is_winner: boolean;
};

export type MatchLogRow = {
  match_id: string;
  game_slug: string;
  title: string;
  room_code: string;
  player_count: number;
  is_decisive: boolean;
  is_tournament: boolean;
  finished_at: string;
  standings: MatchStanding[] | null;
};

export const onlineMatchService = {
  getOverview: async (days = 30): Promise<OnlineOverview | null> => {
    const { data, error } = await supabase.rpc('get_online_overview', { p_days: days });
    if (error) throw error;
    return (data as unknown as OnlineOverview) ?? null;
  },

  getGameStats: async (days = 30): Promise<OnlineGameStat[]> => {
    const { data, error } = await supabase.rpc('get_online_game_stats', { p_days: days });
    if (error) throw error;
    return (data as unknown as OnlineGameStat[]) ?? [];
  },

  getStudentLeaderboard: async (days = 30, limit = 20): Promise<OnlineStudentRow[]> => {
    const { data, error } = await supabase.rpc('get_online_student_leaderboard', { p_days: days, p_limit: limit });
    if (error) throw error;
    return (data as unknown as OnlineStudentRow[]) ?? [];
  },

  getHeadToHead: async (studentId: string): Promise<HeadToHeadRow[]> => {
    const { data, error } = await supabase.rpc('get_online_head_to_head', { p_student_id: studentId });
    if (error) throw error;
    return (data as unknown as HeadToHeadRow[]) ?? [];
  },

  getMatchLog: async (gameSlug: string | null = null, limit = 50): Promise<MatchLogRow[]> => {
    const { data, error } = await supabase.rpc('get_online_match_log', { p_game_slug: gameSlug ?? undefined, p_limit: limit });
    if (error) throw error;
    return (data as unknown as MatchLogRow[]) ?? [];
  },
};

// ─── Local Versus (2 คนจอเดียว) — migration 207, source='local' ──────────────
// RPC ใหม่ยังไม่อยู่ใน generated types → เรียกผ่าน alias loosely-typed (cast รวมที่นี่ที่เดียว)
const sb = supabase as unknown as {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
};

export type VersusOverview = {
  total_matches: number;
  decisive_matches: number;
  distinct_players: number;
  last_played_at: string | null;
};

export type VersusStudentRow = {
  student_id: string;
  name: string;
  class: string | null;
  photo_url: string | null;
  matches: number;
  wins: number;
  losses: number;
  win_rate: number | null;
  last_played: string | null;
};

export type VersusHeadToHead = { matches: number; wins: number; losses: number };

export type VersusStanding = {
  name: string;
  class: string | null;
  photo_url: string | null;
  rank: number;
  score: number;
  rounds_won: number | null;
  is_winner: boolean;
};

export type VersusMatchLogRow = {
  match_id: string;
  game_slug: string;
  title: string;
  player_count: number;
  finished_at: string;
  standings: VersusStanding[] | null;
};

export const versusMatchService = {
  getOverview: async (days = 30): Promise<VersusOverview | null> => {
    const { data, error } = await sb.rpc('get_versus_overview', { p_days: days });
    if (error) throw error;
    return (data as VersusOverview) ?? null;
  },

  getLeaderboard: async (className: string | null = null, days = 90, limit = 20): Promise<VersusStudentRow[]> => {
    const { data, error } = await sb.rpc('get_versus_student_leaderboard', { p_class: className, p_days: days, p_limit: limit });
    if (error) throw error;
    return (data as VersusStudentRow[]) ?? [];
  },

  getHeadToHead: async (studentA: string, studentB: string): Promise<VersusHeadToHead | null> => {
    const { data, error } = await sb.rpc('get_versus_head_to_head', { p_a: studentA, p_b: studentB });
    if (error) throw error;
    const rows = (data as VersusHeadToHead[]) ?? [];
    return rows[0] ?? null;
  },

  getMatchLog: async (days = 30, limit = 50): Promise<VersusMatchLogRow[]> => {
    const { data, error } = await sb.rpc('get_versus_match_log', { p_days: days, p_limit: limit });
    if (error) throw error;
    return (data as VersusMatchLogRow[]) ?? [];
  },
};
