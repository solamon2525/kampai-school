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
};
