/**
 * english-quest.service.ts
 * English Quest — แอปเรียนศัพท์อังกฤษรายวันแบบเกม (migration 222–223)
 *
 * - หลักสูตร (worlds→lessons→words) = public read (ดึงเป็น tree call เดียว)
 * - progress ต่อนักเรียน = RPC SECURITY DEFINER (keyed student_code)
 * - XP/streak/อันดับ = engine กลาง (complete_lesson เรียก record_game_session ภายใน DB)
 * - ระบุนักเรียน = gamePlayService.lookupStudent (reuse — โมเดลเดียวกับ /play)
 */
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Tables = Database['public']['Tables'];
export type EqWorld = Tables['english_quest_worlds']['Row'];
export type EqLesson = Tables['english_quest_lessons']['Row'];
export type EqWord = Tables['english_quest_words']['Row'];

export type EqLessonWithWords = EqLesson & { words: EqWord[] };
export type EqWorldTree = EqWorld & { lessons: EqLessonWithWords[] };

export type EqState = {
  mascot_name: string | null;
  lesson_stars: Record<string, number>;   // { "<lesson_id>": 1..3 }
  current_world_id: string | null;
  total_xp: number;
};

export type EqUnlocked = { code: string; title: string; icon: string | null; xp_bonus: number };
export type EqCompleteResult = {
  score: number;
  stars: number;
  xp_earned: number;
  total_xp: number;
  unlocked: EqUnlocked[];
  xp_skipped?: string;
};

// รูปดิบจาก nested select (FK relationships ใน types.ts)
type RawWorld = EqWorld & {
  english_quest_lessons: (EqLesson & { english_quest_words: EqWord[] })[];
};

export const englishQuestService = {
  /** ดึงหลักสูตรทั้งต้นไม้ (worlds→lessons→words) เรียงตาม sort_order — call เดียว, cache ด้วย React Query */
  getCurriculum: async (): Promise<EqWorldTree[]> => {
    const { data, error } = await supabase
      .from('english_quest_worlds')
      .select('*, english_quest_lessons(*, english_quest_words(*))')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return ((data ?? []) as RawWorld[]).map((w) => ({
      ...w,
      lessons: [...(w.english_quest_lessons ?? [])]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((l) => ({
          ...l,
          words: [...(l.english_quest_words ?? [])].sort((a, b) => a.sort_order - b.sort_order),
        })),
    }));
  },

  /** สถานะนักเรียน (มาสคอต/ดาวต่อบท/XP รวม) — auto-สร้าง progress row ถ้ายังไม่มี */
  getState: async (studentCode: string): Promise<EqState> => {
    const { data, error } = await supabase.rpc('english_quest_get_state', { p_student_code: studentCode });
    if (error) throw error;
    return data as unknown as EqState;
  },

  /** เรียนจบ 1 บท → upsert ดาว + ยิง record_game_session (XP/streak/อันดับ ภาษาอังกฤษ) */
  completeLesson: async (
    studentCode: string, lessonId: string, correct: number, total: number,
  ): Promise<EqCompleteResult> => {
    const { data, error } = await supabase.rpc('english_quest_complete_lesson', {
      p_student_code: studentCode, p_lesson_id: lessonId, p_correct: correct, p_total: total,
    });
    if (error) throw error;
    return data as unknown as EqCompleteResult;
  },

  /** ตั้ง/เปลี่ยนชื่อมาสคอต */
  setMascot: async (studentCode: string, name: string): Promise<void> => {
    const { error } = await supabase.rpc('english_quest_set_mascot', { p_student_code: studentCode, p_name: name });
    if (error) throw error;
  },
};

// ─── helper: รวมดาว + นับบทที่เรียนจบ (ฝั่ง client จาก state.lesson_stars) ──────
export const eqTotalStars = (lessonStars: Record<string, number>): number =>
  Object.values(lessonStars ?? {}).reduce((a, b) => a + (Number(b) || 0), 0);

export const eqIsLessonDone = (lessonStars: Record<string, number>, lessonId: string): boolean =>
  Object.prototype.hasOwnProperty.call(lessonStars ?? {}, lessonId);
