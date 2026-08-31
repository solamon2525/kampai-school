import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type CompetitionRow = Database['public']['Tables']['classroom_competitions']['Row'];
type CompetitionTeamRow = Database['public']['Tables']['classroom_competition_teams']['Row'];
type CompetitionResultRow = Database['public']['Tables']['classroom_competition_results']['Row'];
type CompetitionQuestionRow = Database['public']['Tables']['classroom_competition_questions']['Row'];
type StudentRow = Database['public']['Tables']['students']['Row'];

export type CompetitionStatus = 'draft' | 'waiting_devices' | 'live' | 'paused' | 'tiebreak' | 'finished' | 'cancelled';
export type ActivityKey = 'math24' | 'improper_to_mixed' | 'mixed_to_improper' | 'fraction_add_sub' | 'mixed';

export type CompetitionStudent = Pick<StudentRow, 'id' | 'name' | 'photo_url' | 'class_number'>;

export type CompetitionTeam = Omit<Pick<CompetitionTeamRow,
  'id' | 'name' | 'color_key' | 'sort_order' | 'current_question_index' | 'score' |
  'wrong_count' | 'locked_count' | 'response_ms_total'
>, 'color_key'> & {
  color_key: 'navy' | 'gold';
  classroom_competition_members?: Array<{ roster_order: number; students: CompetitionStudent }>;
  members?: CompetitionStudent[];
  result?: CompetitionResult | null;
  classroom_competition_results?: CompetitionResult[];
};

export type CompetitionResult = Omit<Pick<CompetitionResultRow,
  'team_id' | 'rank' | 'outcome' | 'league_points' | 'final_score' | 'wrong_count' | 'locked_count'
>, 'team_id'> & { team_id?: CompetitionResultRow['team_id'] };

export type CompetitionRecord = Omit<Pick<CompetitionRow,
  'id' | 'room_code' | 'class_name' | 'grade_level' | 'subject_key' | 'activity_key' |
  'difficulty' | 'question_distribution' | 'question_count' | 'duration_seconds' | 'status' |
  'seed' | 'started_at' | 'ends_at' | 'paused_remaining_seconds' | 'finished_at' |
  'winner_team_id' | 'created_at'
>, 'subject_key' | 'activity_key' | 'difficulty' | 'question_distribution' | 'status'> & {
  subject_key: 'math';
  activity_key: ActivityKey;
  difficulty: 'easy' | 'medium' | 'hard';
  question_distribution: 'shared' | 'equivalent';
  status: CompetitionStatus;
  classroom_competition_teams?: CompetitionTeam[];
};

export type CompetitionQuestion = Omit<Pick<CompetitionQuestionRow,
  'id' | 'sequence_no' | 'activity_key' | 'prompt' | 'difficulty' | 'is_tiebreak'
>, 'activity_key' | 'prompt'> & {
  activity_key: ActivityKey;
  prompt: Record<string, unknown>;
};

export interface HostState {
  serverNow: string;
  competition: CompetitionRecord;
  teams: CompetitionTeam[];
  devices: Array<{ id: string; team_id: string | null; display_name: string; status: string; last_seen_at: string }>;
  attempts: Array<{ team_id: string; question_id: string; attempt_no: number; is_correct: boolean; response_ms: number; created_at: string }>;
  results: CompetitionResult[];
  currentQuestions: Array<{ teamId: string; question: CompetitionQuestion | null }>;
}

export interface TeamState {
  serverNow?: string;
  competition: CompetitionRecord;
  device: { id: string; displayName: string; status: string };
  team: (CompetitionTeam & { members: CompetitionStudent[]; result: CompetitionResult | null }) | null;
  question?: CompetitionQuestion | null;
  attemptsUsed?: number;
}

export interface SetupPayload {
  config: {
    className: string;
    activityKey: ActivityKey;
    difficulty: 'easy' | 'medium' | 'hard';
    questionDistribution: 'shared' | 'equivalent';
    questionCount: 10 | 20 | 30;
    durationSeconds: number;
    seed: number;
  };
  teams: Array<{ name: string; studentIds: string[] }>;
}

const DEVICE_TOKEN_KEY = 'kampai-classroom-competition-device-token';

async function invokeHost<T>(payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('classroom-competition-host', { body: payload });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as T;
}

async function invokeTeam<T>(payload: Record<string, unknown>, token?: string): Promise<T> {
  const resolvedToken = token ?? sessionStorage.getItem(DEVICE_TOKEN_KEY);
  const { data, error } = await supabase.functions.invoke('classroom-competition-team', {
    body: payload,
    headers: resolvedToken ? { 'x-device-token': resolvedToken } : undefined,
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export const classroomCompetitionService = {
  create: (payload: SetupPayload) => invokeHost<{ competition: CompetitionRecord; teams: CompetitionTeam[] }>({ action: 'create', ...payload }),
  getHostState: (competitionId: string) => invokeHost<HostState>({ action: 'state', competitionId }),
  hostAction: (action: string, competitionId: string, extra: Record<string, unknown> = {}) =>
    invokeHost<Record<string, unknown>>({ action, competitionId, ...extra }),
  getHistory: (filters: Record<string, string | undefined>) => invokeHost<{
    matches: CompetitionRecord[];
    individual: Array<{ student: CompetitionStudent; subjectKey: string; wins: number; losses: number; leaguePoints: number }>;
  }>({ action: 'history', filters }),
  join: async (roomCode: string, displayName: string) => {
    const response = await invokeTeam<{ token: string; deviceId: string; status: string }>({ action: 'join', roomCode, displayName }, '');
    sessionStorage.setItem(DEVICE_TOKEN_KEY, response.token);
    return response;
  },
  getTeamState: () => invokeTeam<TeamState>({ action: 'state' }),
  submitAnswer: (questionId: string, response: Record<string, unknown>, idempotencyKey: string) =>
    invokeTeam<{ result: { correct: boolean; remainingAttempts: number; locked: boolean; advanced: boolean }; state: TeamState }>({
      action: 'submit', questionId, response, idempotencyKey,
    }),
  hasDeviceToken: () => Boolean(sessionStorage.getItem(DEVICE_TOKEN_KEY)),
  clearDeviceToken: () => sessionStorage.removeItem(DEVICE_TOKEN_KEY),
  subscribeHost: (competitionId: string, onChange: () => void) => {
    const channel = supabase.channel(`classroom-competition:${competitionId}`, { config: { private: true } });
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'classroom_competitions', filter: `id=eq.${competitionId}` }, onChange);
    for (const table of ['classroom_competition_teams', 'classroom_competition_devices', 'classroom_competition_attempts', 'classroom_competition_results']) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `competition_id=eq.${competitionId}` }, onChange);
    }
    channel.subscribe();
    return () => { void supabase.removeChannel(channel); };
  },
};
