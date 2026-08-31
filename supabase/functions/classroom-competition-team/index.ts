import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { validateAnswer } from '../_shared/classroom-competition-engine.mjs';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

function rateLimited(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > limit;
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function createToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function authorizeDevice(token: string | null) {
  if (!token || token.length !== 64) return null;
  const tokenHash = await sha256(token);
  const { data } = await admin.from('classroom_competition_devices')
    .select('*').eq('token_hash', tokenHash).gt('expires_at', new Date().toISOString()).maybeSingle();
  return data;
}

async function canonicalState(device: Record<string, unknown>) {
  const competitionId = String(device.competition_id);
  const { data: competition } = await admin.from('classroom_competitions')
    .select('id, room_code, status, activity_key, difficulty, question_count, duration_seconds, started_at, ends_at, paused_remaining_seconds, finished_at, winner_team_id')
    .eq('id', competitionId).single();
  if (!competition) throw new Error('competition_not_found');

  if (competition.status === 'live' && competition.ends_at && new Date(competition.ends_at).getTime() <= Date.now()) {
    await admin.rpc('finalize_classroom_competition', { p_competition_id: competitionId, p_force: true });
    const { data: refreshed } = await admin.from('classroom_competitions')
      .select('id, room_code, status, activity_key, difficulty, question_count, duration_seconds, started_at, ends_at, paused_remaining_seconds, finished_at, winner_team_id')
      .eq('id', competitionId).single();
    Object.assign(competition, refreshed);
  }

  if (!device.team_id) return { competition, device: { id: device.id, displayName: device.display_name, status: device.status }, team: null };
  const { data: team } = await admin.from('classroom_competition_teams')
    .select('id, name, color_key, sort_order, current_question_index, score, wrong_count, locked_count')
    .eq('id', device.team_id).single();
  const { data: members } = await admin.from('classroom_competition_members')
    .select('roster_order, students(id, name, photo_url, class_number)')
    .eq('team_id', device.team_id).order('roster_order');
  const { data: result } = await admin.from('classroom_competition_results')
    .select('rank, outcome, league_points, final_score, wrong_count, locked_count')
    .eq('competition_id', competitionId).eq('team_id', device.team_id).maybeSingle();
  let question = null;
  let attemptsUsed = 0;
  if (team && ['live', 'tiebreak'].includes(competition.status)) {
    const { data } = await admin.from('classroom_competition_questions')
      .select('id, sequence_no, activity_key, prompt, difficulty, is_tiebreak')
      .eq('competition_id', competitionId)
      .eq('sequence_no', team.current_question_index)
      .or(`team_id.is.null,team_id.eq.${device.team_id}`)
      .limit(1)
      .maybeSingle();
    question = data;
    if (question) {
      const { count } = await admin.from('classroom_competition_attempts')
        .select('id', { count: 'exact', head: true }).eq('question_id', question.id).eq('team_id', device.team_id);
      attemptsUsed = count ?? 0;
    }
  }
  return {
    serverNow: new Date().toISOString(),
    competition,
    device: { id: device.id, displayName: device.display_name, status: device.status },
    team: team ? { ...team, members: (members ?? []).map((member) => member.students), result } : null,
    question,
    attemptsUsed,
  };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  try {
    const body = await request.json();
    const action = body.action;

    if (action === 'join') {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
      if (rateLimited(`join:${ip}`, 8, 60_000)) return json({ error: 'rate_limited' }, 429);
      const roomCode = String(body.roomCode ?? '').trim().toUpperCase();
      const displayName = String(body.displayName ?? '').trim();
      if (!/^[A-Z0-9]{6}$/.test(roomCode) || displayName.length < 1 || displayName.length > 60) {
        return json({ error: 'invalid_join_request' }, 400);
      }
      const { data: competition } = await admin.from('classroom_competitions')
        .select('id, status').eq('room_code', roomCode).in('status', ['waiting_devices', 'live', 'paused']).maybeSingle();
      if (!competition) return json({ error: 'room_not_found' }, 404);
      const { count } = await admin.from('classroom_competition_devices')
        .select('id', { count: 'exact', head: true }).eq('competition_id', competition.id).in('status', ['pending', 'approved']);
      if ((count ?? 0) >= 8) return json({ error: 'room_device_limit' }, 409);
      const token = createToken();
      const { data: device, error } = await admin.from('classroom_competition_devices').insert({
        competition_id: competition.id,
        display_name: displayName,
        token_hash: await sha256(token),
        expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      }).select('id, status').single();
      if (error) throw error;
      return json({ token, deviceId: device.id, status: device.status });
    }

    const token = request.headers.get('x-device-token');
    if (rateLimited(`device:${token ?? 'missing'}`, 15, 1000)) return json({ error: 'rate_limited' }, 429);
    const device = await authorizeDevice(token);
    if (!device) return json({ error: 'invalid_or_expired_device_token' }, 401);
    await admin.from('classroom_competition_devices').update({ last_seen_at: new Date().toISOString() }).eq('id', device.id);

    if (action === 'state') return json(await canonicalState(device));
    if (action !== 'submit') return json({ error: 'unknown_action' }, 400);
    if (device.status !== 'approved' || !device.team_id) return json({ error: 'device_not_approved' }, 403);
    if (!/^[0-9a-f-]{36}$/i.test(String(body.idempotencyKey ?? ''))) return json({ error: 'invalid_idempotency_key' }, 400);

    const { data: question } = await admin.from('classroom_competition_questions')
      .select('id, competition_id, team_id, prompt, answer_key')
      .eq('id', body.questionId).eq('competition_id', device.competition_id)
      .or(`team_id.is.null,team_id.eq.${device.team_id}`).maybeSingle();
    if (!question) return json({ error: 'question_not_found' }, 404);
    const isCorrect = validateAnswer({ prompt: question.prompt, answerKey: question.answer_key }, body.response);
    const { data, error } = await admin.rpc('record_classroom_competition_attempt', {
      p_competition_id: device.competition_id,
      p_team_id: device.team_id,
      p_device_id: device.id,
      p_question_id: question.id,
      p_response: body.response,
      p_is_correct: isCorrect,
      p_idempotency_key: body.idempotencyKey,
    });
    if (error) {
      const status = error.message.includes('attempt_limit') || error.message.includes('question_not_current') ? 409 : 400;
      return json({ error: error.message }, status);
    }
    return json({ result: data, state: await canonicalState(device) });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null
        ? JSON.stringify(error)
        : String(error ?? 'unknown_error');
    return json({ error: message }, 500);
  }
});
