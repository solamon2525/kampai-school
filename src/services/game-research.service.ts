/**
 * game-research.service.ts
 * โครงการวิจัยการเล่นเกมในชั้นเรียน (pre/post) — เจ้าของเกมจัดการ + ดูรายงาน
 */
import { supabase } from '@/integrations/supabase/client';

export type GameResearchStudy = {
  id: string;
  owner_staff_id: string;
  edu_hub_item_id: string | null;
  title: string;
  game_slug: string;
  game_mode: string;
  class_name: string;
  pretest_start: string;
  pretest_end: string;
  posttest_start: string;
  posttest_end: string;
  max_rounds_per_day: number;
  consent_confirmed: boolean;
  is_active: boolean;
  show_on_homepage: boolean;
  created_at: string;
  updated_at: string;
};

export type GameResearchStudyInsert = Omit<GameResearchStudy, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type ResearchSessionRow = {
  id: string;
  student_id: string;
  score: number;
  mode: string | null;
  duration_sec: number | null;
  created_at: string;
  research_study_id: string | null;
  students: {
    id: string;
    name: string;
    student_code: string | null;
    class: string | null;
    class_number: number | null;
    photo_url: string | null;
  };
};

export type ResearchRoundsToday = {
  ok: boolean;
  error?: string;
  played_today?: number;
  remaining?: number;
  max_rounds?: number;
  game_slug?: string;
  game_mode?: string;
  class_name?: string;
  title?: string;
};

/** โหมดที่เกมส่งเข้า game_sessions.mode (ไม่ใช่ชื่อในเมนูเกมเสมอ) */
export const GAME_MODE_OPTIONS: Record<string, { value: string; label: string }[]> = {
  'multiply-race': [
    { value: 'normal', label: 'แข่งเร็ว' },
    { value: 'endless', label: 'ไม่จบ' },
    { value: 'daily', label: 'ชาเลนจ์วันนี้' },
  ],
};

export const DEFAULT_GAME_MODES: { value: string; label: string }[] = [
  { value: 'normal', label: 'ปกติ' },
];

/** โหมดที่บันทึกใน game_sessions → พารามิเตอร์ URL ในเกม (เมนูในเกม) */
export const RESEARCH_SESSION_TO_URL_MODE: Record<string, Record<string, string>> = {
  'multiply-race': {
    normal: 'race',
    endless: 'endless',
    daily: 'daily',
  },
};

export function researchUrlMode(gameSlug: string, sessionMode: string): string {
  return RESEARCH_SESSION_TO_URL_MODE[gameSlug]?.[sessionMode] ?? sessionMode;
}

export function modeLabel(gameSlug: string, sessionMode: string): string {
  const opts = GAME_MODE_OPTIONS[gameSlug] ?? DEFAULT_GAME_MODES;
  return opts.find((o) => o.value === sessionMode)?.label ?? sessionMode;
}

export function buildResearchEntryUrl(studyId: string, origin?: string): string {
  const base = origin ?? (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/research/${studyId}`;
}

export function buildResearchPlayUrl(
  study: Pick<GameResearchStudy, 'id' | 'game_slug' | 'game_mode'>,
  origin?: string,
): string {
  const base = origin ?? (typeof window !== 'undefined' ? window.location.origin : '');
  const urlMode = researchUrlMode(study.game_slug, study.game_mode);
  const qs = new URLSearchParams({
    study: study.id,
    mode: urlMode,
    autostart: '1',
  });
  return `${base}/play/${study.game_slug}?${qs.toString()}`;
}

export type ResearchStudyPublic = {
  ok: boolean;
  error?: string;
  id?: string;
  title?: string;
  game_slug?: string;
  game_title?: string;
  game_mode?: string;
  class_name?: string;
  max_rounds_per_day?: number;
  pretest_start?: string;
  pretest_end?: string;
  posttest_start?: string;
  posttest_end?: string;
};

export type ResearchStudyPublicListItem = {
  id: string;
  title: string;
  game_slug: string;
  game_title: string;
  game_mode: string;
  class_name: string;
  max_rounds_per_day: number;
};

export type ResearchStudyForGame = ResearchStudyPublicListItem & {
  pretest_start: string;
  pretest_end: string;
  posttest_start: string;
  posttest_end: string;
};

export const gameResearchService = {
  listByOwner: (staffId: string) =>
    supabase
      .from('game_research_studies' as never)
      .select('*')
      .eq('owner_staff_id', staffId)
      .order('created_at', { ascending: false }),

  getById: (id: string) =>
    supabase
      .from('game_research_studies' as never)
      .select('*')
      .eq('id', id)
      .maybeSingle(),

  create: (row: Omit<GameResearchStudyInsert, 'id'>) =>
    supabase
      .from('game_research_studies' as never)
      .insert({ ...row, updated_at: new Date().toISOString() } as never)
      .select()
      .single(),

  update: (id: string, patch: Partial<GameResearchStudyInsert>) =>
    supabase
      .from('game_research_studies' as never)
      .update({ ...patch, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select()
      .single(),

  getSessions: (studyId: string, className: string) =>
    supabase
      .from('game_sessions')
      .select(
        'id, student_id, score, mode, duration_sec, created_at, research_study_id, students!inner(id, name, student_code, class, class_number, photo_url)',
      )
      .eq('research_study_id', studyId)
      .eq('students.class', className)
      .order('created_at', { ascending: true }),

  countRoundsToday: async (studyId: string, studentCode: string): Promise<ResearchRoundsToday> => {
    const { data, error } = await supabase.rpc('count_research_rounds_today' as never, {
      p_study_id: studyId,
      p_student_code: studentCode,
    } as never);
    if (error) throw error;
    return data as unknown as ResearchRoundsToday;
  },

  getStudyPublic: async (studyId: string): Promise<ResearchStudyPublic> => {
    const { data, error } = await supabase.rpc('get_research_study_public' as never, {
      p_study_id: studyId,
    } as never);
    if (error) throw error;
    return data as unknown as ResearchStudyPublic;
  },

  listPublic: async () => {
    const { data, error } = await supabase.rpc('list_research_studies_public' as never);
    if (error) throw error;
    return { data: (data as unknown as ResearchStudyPublicListItem[]) ?? [] };
  },

  listForGame: async (gameSlug: string, className?: string | null) => {
    const { data, error } = await supabase.rpc('list_research_studies_for_game' as never, {
      p_game_slug: gameSlug,
      p_class_name: className ?? null,
    } as never);
    if (error) return { data: [], error };
    return { data: (data as unknown as ResearchStudyForGame[]) ?? [], error: null };
  },
};
