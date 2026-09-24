import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { ENGINE_VERSION, generateQuestionSet } from '../_shared/classroom-competition-engine.mjs';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

function roomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}

function questionRows(competitionId: string, teamId: string | null, questions: ReturnType<typeof generateQuestionSet>) {
  return questions.map((question) => ({
    competition_id: competitionId,
    team_id: teamId,
    sequence_no: question.sequenceNo,
    activity_key: question.activityKey,
    prompt: question.prompt,
    answer_key: question.answerKey,
    validator_version: ENGINE_VERSION,
    difficulty: question.difficulty,
    canonical_key: question.canonicalKey,
  }));
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization) return json({ error: 'unauthorized' }, 401);

    const caller = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authorization } },
    });
    const { data: authData, error: authError } = await caller.auth.getUser();
    if (authError || !authData.user) return json({ error: 'unauthorized' }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: role } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', authData.user.id)
      .in('role', ['teacher', 'admin'])
      .limit(1)
      .maybeSingle();
    if (!role) return json({ error: 'teacher_or_admin_required' }, 403);

    const body = await request.json();
    const action = body.action;

    if (action === 'create') {
      const config = body.config;
      const teams = body.teams;
      if (!config || !Array.isArray(teams) || teams.length !== 2) return json({ error: 'invalid_setup' }, 400);
      if (![10, 20, 30].includes(config.questionCount)) return json({ error: 'invalid_question_count' }, 400);
      if (!['shared', 'equivalent'].includes(config.questionDistribution)) return json({ error: 'invalid_distribution' }, 400);
      if (teams.some((team: { studentIds?: string[] }) => !Array.isArray(team.studentIds) || team.studentIds.length === 0)) {
        return json({ error: 'each_team_requires_members' }, 400);
      }
      const allStudentIds = teams.flatMap((team: { studentIds: string[] }) => team.studentIds);
      if (new Set(allStudentIds).size !== allStudentIds.length) return json({ error: 'duplicate_student' }, 400);

      let createdCompetition = null;
      let createError = null;
      for (let attempt = 0; attempt < 5 && !createdCompetition; attempt += 1) {
        const result = await admin.from('classroom_competitions').insert({
          owner_user_id: authData.user.id,
          room_code: roomCode(),
          class_name: config.className,
          grade_level: 'ป.4',
          subject_key: 'math',
          activity_key: config.activityKey,
          difficulty: config.difficulty,
          question_distribution: config.questionDistribution,
          question_count: config.questionCount,
          duration_seconds: config.durationSeconds,
          seed: config.seed,
          engine_version: ENGINE_VERSION,
          settings: { indicator: config.indicator ?? null },
          status: 'waiting_devices',
        }).select().single();
        createdCompetition = result.data;
        createError = result.error;
        if (result.error && result.error.code !== '23505') break;
      }
      if (!createdCompetition) return json({ error: createError?.message ?? 'room_code_generation_failed' }, 500);

      try {
        const { data: createdTeams, error: teamsError } = await admin.from('classroom_competition_teams').insert([
          { competition_id: createdCompetition.id, name: teams[0].name || 'ทีมน้ำเงิน', color_key: 'navy', sort_order: 1 },
          { competition_id: createdCompetition.id, name: teams[1].name || 'ทีมทอง', color_key: 'gold', sort_order: 2 },
        ]).select();
        if (teamsError || !createdTeams) throw teamsError ?? new Error('team_creation_failed');
        createdTeams.sort((a, b) => a.sort_order - b.sort_order);

        const members = createdTeams.flatMap((team, teamIndex) =>
          teams[teamIndex].studentIds.map((studentId: string, rosterOrder: number) => ({
            competition_id: createdCompetition.id,
            team_id: team.id,
            student_id: studentId,
            roster_order: rosterOrder,
          })),
        );
        const { error: membersError } = await admin.from('classroom_competition_members').insert(members);
        if (membersError) throw membersError;

        const count = config.questionCount;
        const baseSeed = BigInt(config.seed);
        let rows;
        if (config.questionDistribution === 'shared') {
          rows = questionRows(createdCompetition.id, null, generateQuestionSet({
            activityKey: config.activityKey, difficulty: config.difficulty, count, seed: baseSeed,
          }));
        } else {
          rows = createdTeams.flatMap((team, index) => questionRows(createdCompetition.id, team.id, generateQuestionSet({
            activityKey: config.activityKey,
            difficulty: config.difficulty,
            count,
            seed: baseSeed + BigInt((index + 1) * 1000003),
          })));
        }
        const { error: questionsError } = await admin.from('classroom_competition_questions').insert(rows);
        if (questionsError) throw questionsError;
        return json({ competition: createdCompetition, teams: createdTeams });
      } catch (error) {
        await admin.from('classroom_competitions').delete().eq('id', createdCompetition.id);
        throw error;
      }
    }

    const competitionId = body.competitionId;
    if (action === 'history') {
      let query = admin.from('classroom_competitions')
        .select('*, classroom_competition_teams:classroom_competition_teams!classroom_competition_teams_competition_id_fkey(*, classroom_competition_members(roster_order, students(id, name, photo_url, class_number)))')
        .neq('status', 'cancelled').order('created_at', { ascending: false }).limit(100);
      if (role.role !== 'admin') query = query.eq('owner_user_id', authData.user.id);
      if (body.filters?.className) query = query.eq('class_name', body.filters.className);
      if (body.filters?.activityKey) query = query.eq('activity_key', body.filters.activityKey);
      if (body.filters?.dateFrom) query = query.gte('created_at', body.filters.dateFrom);
      if (body.filters?.dateTo) query = query.lte('created_at', body.filters.dateTo);
      const { data, error } = await query;
      if (error) throw error;
      const matchIds = (data ?? []).map((match) => match.id);
      let results: Array<Record<string, unknown>> = [];
      if (matchIds.length > 0) {
        const { data: resultRows, error: resultsError } = await admin.from('classroom_competition_results')
          .select('*').in('competition_id', matchIds);
        if (resultsError) throw resultsError;
        results = resultRows ?? [];
      }
      const resultsByTeam = new Map(results.map((result) => [result.team_id, result]));
      const matches = (data ?? []).map((match) => ({
        ...match,
        classroom_competition_teams: (match.classroom_competition_teams ?? []).map((team) => ({
          ...team,
          classroom_competition_results: resultsByTeam.has(team.id) ? [resultsByTeam.get(team.id)] : [],
        })),
      }));
      const individual = new Map<string, { student: unknown; subjectKey: string; wins: number; losses: number; leaguePoints: number }>();
      for (const match of matches) {
        if (match.status !== 'finished') continue;
        for (const team of match.classroom_competition_teams ?? []) {
          const result = team.classroom_competition_results?.[0];
          if (!result) continue;
          for (const member of team.classroom_competition_members ?? []) {
            const student = member.students;
            if (!student) continue;
            const key = `${student.id}:${match.subject_key}`;
            const current = individual.get(key) ?? { student, subjectKey: match.subject_key, wins: 0, losses: 0, leaguePoints: 0 };
            if (result.outcome === 'winner') current.wins += 1;
            else current.losses += 1;
            current.leaguePoints += result.league_points;
            individual.set(key, current);
          }
        }
      }
      return json({ matches, individual: Array.from(individual.values()) });
    }
    if (!competitionId) return json({ error: 'competition_id_required' }, 400);
    const { data: competition } = await admin.from('classroom_competitions').select('*').eq('id', competitionId).maybeSingle();
    if (!competition) return json({ error: 'competition_not_found' }, 404);
    if (role.role !== 'admin' && competition.owner_user_id !== authData.user.id) return json({ error: 'forbidden' }, 403);

    if (action !== 'state' && action !== 'finish' && competition.status === 'live'
      && competition.ends_at && new Date(competition.ends_at).getTime() <= Date.now()) {
      await admin.rpc('finalize_classroom_competition', { p_competition_id: competitionId, p_force: true });
      return json({ error: 'competition_finished' }, 409);
    }

    if (action === 'state') {
      if (competition.status === 'live' && competition.ends_at && new Date(competition.ends_at).getTime() <= Date.now()) {
        await admin.rpc('finalize_classroom_competition', { p_competition_id: competitionId, p_force: true });
      }
      const [competitionResult, teamsResult, devicesResult, attemptsResult, resultsResult] = await Promise.all([
        admin.from('classroom_competitions').select('*').eq('id', competitionId).single(),
        admin.from('classroom_competition_teams')
          .select('*, classroom_competition_members(roster_order, students(id, name, photo_url, class_number))')
          .eq('competition_id', competitionId).order('sort_order'),
        admin.from('classroom_competition_devices').select('id, team_id, display_name, status, last_seen_at, approved_at, created_at')
          .eq('competition_id', competitionId).order('created_at'),
        admin.from('classroom_competition_attempts').select('team_id, question_id, attempt_no, is_correct, response_ms, created_at')
          .eq('competition_id', competitionId).order('created_at', { ascending: false }).limit(20),
        admin.from('classroom_competition_results').select('*').eq('competition_id', competitionId),
      ]);
      const currentQuestions = await Promise.all((teamsResult.data ?? []).map(async (team) => {
        const { data } = await admin.from('classroom_competition_questions')
          .select('id, team_id, sequence_no, activity_key, prompt, difficulty, is_tiebreak')
          .eq('competition_id', competitionId).eq('sequence_no', team.current_question_index)
          .or(`team_id.is.null,team_id.eq.${team.id}`).limit(1).maybeSingle();
        return { teamId: team.id, question: data };
      }));
      return json({
        serverNow: new Date().toISOString(), competition: competitionResult.data,
        teams: teamsResult.data ?? [], devices: devicesResult.data ?? [], attempts: attemptsResult.data ?? [],
        results: resultsResult.data ?? [], currentQuestions,
      });
    }

    if (action === 'approveDevice') {
      const { data: team } = await admin.from('classroom_competition_teams')
        .select('id').eq('id', body.teamId).eq('competition_id', competitionId).maybeSingle();
      if (!team) return json({ error: 'team_not_found' }, 404);
      await admin.from('classroom_competition_devices').update({
        status: 'approved', team_id: body.teamId, approved_by: authData.user.id, approved_at: new Date().toISOString(),
      }).eq('id', body.deviceId).eq('competition_id', competitionId).eq('status', 'pending');
      return json({ success: true });
    }

    if (action === 'rejectDevice' || action === 'revokeDevice') {
      const nextStatus = action === 'rejectDevice' ? 'rejected' : 'revoked';
      await admin.from('classroom_competition_devices').update({ status: nextStatus })
        .eq('id', body.deviceId).eq('competition_id', competitionId);
      return json({ success: true });
    }

    if (action === 'start') {
      const onlineCutoff = new Date(Date.now() - 15_000).toISOString();
      const { data: approved } = await admin.from('classroom_competition_devices')
        .select('team_id, last_seen_at').eq('competition_id', competitionId).eq('status', 'approved').gte('last_seen_at', onlineCutoff);
      const onlineTeams = new Set((approved ?? []).map((device) => device.team_id).filter(Boolean));
      if (onlineTeams.size !== 2) return json({ error: 'two_online_approved_teams_required' }, 409);
      const now = new Date();
      const endsAt = new Date(now.getTime() + competition.duration_seconds * 1000);
      const { error } = await admin.from('classroom_competitions').update({
        status: 'live', started_at: now.toISOString(), ends_at: endsAt.toISOString(), paused_at: null,
      }).eq('id', competitionId).eq('status', 'waiting_devices');
      if (error) throw error;
      await admin.from('classroom_competition_teams').update({ question_started_at: now.toISOString() }).eq('competition_id', competitionId);
      return json({ success: true, endsAt: endsAt.toISOString() });
    }

    if (action === 'pause') {
      if (competition.status !== 'live' || !competition.ends_at) return json({ error: 'competition_not_live' }, 409);
      const remaining = Math.max(0, Math.ceil((new Date(competition.ends_at).getTime() - Date.now()) / 1000));
      await admin.from('classroom_competitions').update({
        status: 'paused', paused_at: new Date().toISOString(), paused_remaining_seconds: remaining, ends_at: null,
      }).eq('id', competitionId).eq('status', 'live');
      return json({ success: true, remainingSeconds: remaining });
    }

    if (action === 'resume') {
      if (competition.status !== 'paused') return json({ error: 'competition_not_paused' }, 409);
      const remaining = competition.paused_remaining_seconds ?? 0;
      const now = new Date();
      await admin.from('classroom_competitions').update({
        status: 'live', paused_at: null, paused_remaining_seconds: null,
        ends_at: new Date(now.getTime() + remaining * 1000).toISOString(),
      }).eq('id', competitionId).eq('status', 'paused');
      await admin.from('classroom_competition_teams').update({ question_started_at: now.toISOString() }).eq('competition_id', competitionId);
      return json({ success: true });
    }

    if (action === 'finish') {
      const { data, error } = await admin.rpc('finalize_classroom_competition', {
        p_competition_id: competitionId, p_force: true,
      });
      if (error) throw error;
      return json(data);
    }

    if (action === 'cancel') {
      await admin.from('classroom_competitions').update({
        status: 'cancelled', cancelled_at: new Date().toISOString(), ends_at: null,
      }).eq('id', competitionId).in('status', ['draft', 'waiting_devices', 'live', 'paused', 'tiebreak']);
      return json({ success: true });
    }

    if (action === 'nextTiebreak') {
      if (competition.status !== 'tiebreak') return json({ error: 'competition_not_in_tiebreak' }, 409);
      const { data: teams } = await admin.from('classroom_competition_teams')
        .select('id, current_question_index').eq('competition_id', competitionId);
      const sequenceNo = Math.max(competition.question_count, ...(teams ?? []).map((team) => team.current_question_index));
      const [question] = generateQuestionSet({
        activityKey: competition.activity_key,
        difficulty: competition.difficulty,
        count: 1,
        seed: BigInt(competition.seed) + BigInt(9000001 + sequenceNo),
      });
      const { error } = await admin.from('classroom_competition_questions').insert({
        ...questionRows(competitionId, null, [{ ...question, sequenceNo }])[0], is_tiebreak: true,
      });
      if (error) throw error;
      await admin.from('classroom_competition_teams').update({
        current_question_index: sequenceNo, question_started_at: new Date().toISOString(),
      }).eq('competition_id', competitionId);
      return json({ success: true });
    }

    return json({ error: 'unknown_action' }, 400);
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null
        ? JSON.stringify(error)
        : String(error ?? 'unknown_error');
    return json({ error: message }, 500);
  }
});
