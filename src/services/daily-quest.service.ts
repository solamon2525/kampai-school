/**
 * daily-quest.service.ts
 * ระบบ Daily Quest (เดลี่เควส) — Migration 161
 *
 * ภารกิจประจำวันแยกตามวิชาแกน (คณิต/ไทย/อังกฤษ): เล่นเกมในวิชานั้นให้ได้คะแนนถึงเกณฑ์
 * → ผ่านเควส. ครบทุกวิชา/วัน = คะแนนพิเศษเก็บแยก + streak + โบนัส XP.
 * Credit อัตโนมัติฝั่ง DB (trigger บน game_sessions) รวม mode online (2 คนได้ทั้งคู่).
 */
import { supabase } from '@/integrations/supabase/client';

export type QuestSubjectStatus = {
  key: string;
  label: string;
  icon: string | null;
  done: boolean;
  score: number | null;
};

export type DailyQuestStatus = {
  subjects: QuestSubjectStatus[];
  completed_count: number;
  required_count: number;
  all_complete: boolean;
  bonus_points: number;   // โบนัสของ "วันนี้" (ถ้าครบ)
  bonus_xp: number;
  streak_days: number;
  total_points: number;   // คะแนนพิเศษสะสมทั้งหมด
  target_points: number;  // ค่าโบนัสเป้าหมายเมื่อทำครบ (จาก config)
  target_xp: number;
};

export type QuestOverviewSubject = {
  subject_key: string;
  label: string;
  icon: string | null;
  completed_students: number;
};

export type DailyQuestOverview = {
  date: string;
  subjects: QuestOverviewSubject[];
  total_participants: number;
  all_complete_count: number;
  required_count: number;
};

export type QuestTrendRow = {
  d: string;
  participants: number;
  all_complete_count: number;
};

export type QuestParticipationRow = {
  student_id: string;
  name: string;
  class: string | null;
  photo_url: string | null;
  subjects_done: string[];
  completed_count: number;
  required_count: number;
  all_complete: boolean;
};

export type QuestStreakRow = {
  student_id: string;
  name: string;
  class: string | null;
  photo_url: string | null;
  current_streak: number;
  total_points: number;
};

const EMPTY_STATUS: DailyQuestStatus = {
  subjects: [],
  completed_count: 0,
  required_count: 0,
  all_complete: false,
  bonus_points: 0,
  bonus_xp: 0,
  streak_days: 0,
  total_points: 0,
  target_points: 0,
  target_xp: 0,
};

export const dailyQuestService = {
  /** สถานะเควสวันนี้ของผู้เล่น (anon ผ่าน student_code) */
  getStatus: async (studentCode: string): Promise<DailyQuestStatus> => {
    const { data, error } = await supabase.rpc('get_daily_quest_status', {
      p_student_code: studentCode,
    });
    if (error) throw error;
    return { ...EMPTY_STATUS, ...((data as unknown as DailyQuestStatus) ?? {}) };
  },

  /** ภาพรวมวันนี้ (non-PII) — KPI/จอใหญ่ */
  getOverview: async (date?: string): Promise<DailyQuestOverview | null> => {
    const { data, error } = await supabase.rpc('get_daily_quest_overview', {
      p_date: date ?? undefined,
    });
    if (error) throw error;
    return (data as unknown as DailyQuestOverview) ?? null;
  },

  /** แนวโน้มรายวัน (กราฟ) */
  getTrend: async (days = 14): Promise<QuestTrendRow[]> => {
    const { data, error } = await supabase.rpc('get_daily_quest_trend', { p_days: days });
    if (error) throw error;
    return (data as unknown as QuestTrendRow[]) ?? [];
  },

  /** รายชื่อ participation (ครู/แอดมินเท่านั้น — RPC เช็ก is_teacher) */
  getParticipation: async (date?: string): Promise<QuestParticipationRow[]> => {
    const { data, error } = await supabase.rpc('get_daily_quest_participation', {
      p_date: date ?? undefined,
    });
    if (error) throw error;
    return (data as unknown as QuestParticipationRow[]) ?? [];
  },

  /** Leaderboard streak + คะแนนพิเศษสะสม */
  getStreakLeaderboard: async (limit = 10): Promise<QuestStreakRow[]> => {
    const { data, error } = await supabase.rpc('get_daily_quest_streak_leaderboard', {
      p_limit: limit,
    });
    if (error) throw error;
    return (data as unknown as QuestStreakRow[]) ?? [];
  },
};

// ─── Admin config (RLS = admin only) ────────────────────────────────────────
export type QuestSubjectConfig = {
  subject_key: string;
  label_th: string;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
};

export type QuestConfig = {
  all_complete_points: number;
  all_complete_xp: number;
};

export type QuestGameMinScore = {
  id: string;
  title: string;
  subject: string | null;
  game_slug: string | null;
  quest_min_score: number | null;
};

export const dailyQuestAdminService = {
  getConfig: async (): Promise<QuestConfig> => {
    const { data, error } = await supabase
      .from('daily_quest_config')
      .select('all_complete_points, all_complete_xp')
      .eq('id', true)
      .maybeSingle();
    if (error) throw error;
    return data ?? { all_complete_points: 50, all_complete_xp: 30 };
  },

  updateConfig: async (cfg: QuestConfig): Promise<void> => {
    const { error } = await supabase
      .from('daily_quest_config')
      .update({ all_complete_points: cfg.all_complete_points, all_complete_xp: cfg.all_complete_xp, updated_at: new Date().toISOString() })
      .eq('id', true);
    if (error) throw error;
  },

  listSubjects: async (): Promise<QuestSubjectConfig[]> => {
    const { data, error } = await supabase
      .from('daily_quest_subjects')
      .select('subject_key, label_th, icon, is_active, sort_order')
      .order('sort_order');
    if (error) throw error;
    return (data as QuestSubjectConfig[]) ?? [];
  },

  setSubjectActive: async (subjectKey: string, isActive: boolean): Promise<void> => {
    const { error } = await supabase
      .from('daily_quest_subjects')
      .update({ is_active: isActive })
      .eq('subject_key', subjectKey);
    if (error) throw error;
  },

  /** เกม tracked ทั้งหมด + เกณฑ์คะแนนเควสต่อเกม */
  listGameMinScores: async (): Promise<QuestGameMinScore[]> => {
    const { data, error } = await supabase
      .from('educational_hub_items')
      .select('id, title, subject, game_slug, quest_min_score')
      .eq('tracked_game', true)
      .not('game_slug', 'is', null)
      .order('subject')
      .order('title');
    if (error) throw error;
    return (data as QuestGameMinScore[]) ?? [];
  },

  setGameMinScore: async (id: string, value: number | null): Promise<void> => {
    const { error } = await supabase
      .from('educational_hub_items')
      .update({ quest_min_score: value })
      .eq('id', id);
    if (error) throw error;
  },
};
