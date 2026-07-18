import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type PixelForestHeroClass = 'swordsman' | 'ranger' | 'mage';
export type PixelForestZone = 'village' | 'mosswood' | 'swamp' | 'ruins';

export type PixelForestSaveState = {
  schema_version: number;
  hero_class: PixelForestHeroClass | null;
  hero_level: number;
  hero_xp: number;
  skill_points: number;
  gold: number;
  gems: number;
  chapter: number;
  zone: PixelForestZone;
  unlocked_zones: PixelForestZone[];
  quest: Record<string, unknown>;
  equipment: Record<string, unknown>;
  inventory: Record<string, number>;
  runes: string[];
  bosses: Record<string, boolean>;
  play_seconds: number;
  [key: string]: unknown;
};

export type PixelForestRpgState = {
  state_version: number;
  save_state: PixelForestSaveState;
  saved_at: string;
  replayed?: boolean;
};

export type PixelForestBalanceEvent = {
  type: string;
  value?: number;
  metadata?: Record<string, unknown>;
};

export const pixelForestRpgQueryKey = (studentCode: string) => [
  'pixel-forest-rpg',
  studentCode.trim(),
];

export const pixelForestRpgService = {
  async getState(studentCode: string): Promise<PixelForestRpgState> {
    const { data, error } = await supabase.rpc('get_pixel_forest_rpg_state', {
      p_student_code: studentCode.trim(),
    });
    if (error) throw error;
    return data as unknown as PixelForestRpgState;
  },

  async saveState(params: {
    studentCode: string;
    expectedVersion: number;
    idempotencyKey: string;
    state: PixelForestSaveState;
    events?: PixelForestBalanceEvent[];
  }): Promise<PixelForestRpgState> {
    const { data, error } = await supabase.rpc('save_pixel_forest_rpg_state', {
      p_student_code: params.studentCode.trim(),
      p_expected_version: params.expectedVersion,
      p_idempotency_key: params.idempotencyKey,
      p_state: params.state as unknown as Json,
      p_events: (params.events ?? []) as unknown as Json,
    });
    if (error) throw error;
    return data as unknown as PixelForestRpgState;
  },
};
