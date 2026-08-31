import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';

if (!process.argv.includes('--production')) {
  throw new Error('Refusing to run without --production. This test creates and then deletes isolated production test data.');
}

function loadEnv() {
  const values = {};
  for (const name of ['.env', '.env.local']) {
    const file = path.resolve(name);
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!match) continue;
      values[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  }
  return values;
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = process.env.CLASSROOM_COMPETITION_APP_URL || 'http://127.0.0.1:8080';
assert.ok(supabaseUrl && anonKey && serviceRoleKey, 'Supabase test credentials are required');

const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
const hostClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
const createdCompetitionIds = [];
let testUserId = null;
let browser = null;

async function hostAction(action, payload = {}) {
  const { data: sessionData, error: sessionError } = await hostClient.auth.getSession();
  if (sessionError || !sessionData.session?.access_token) throw sessionError || new Error('host session required');
  const response = await fetch(`${supabaseUrl}/functions/v1/classroom-competition-host`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${sessionData.session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await response.json();
  if (!response.ok || data?.error) throw new Error(`host ${action} failed (${response.status}): ${data?.error || JSON.stringify(data)}`);
  return data;
}

async function teamRequest(token, body) {
  const response = await fetch(`${supabaseUrl}/functions/v1/classroom-competition-team`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      ...(token ? { 'x-device-token': token } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return { status: response.status, data };
}

function answerResponse(answerKey) {
  if (answerKey.kind === 'mixed_number') {
    return { whole: answerKey.whole, numerator: answerKey.numerator, denominator: answerKey.denominator };
  }
  if (answerKey.kind === 'fraction') {
    return { numerator: answerKey.numerator, denominator: answerKey.denominator };
  }
  return { ast: answerKey.solution };
}

async function currentAnswer(teamState) {
  const { data, error } = await admin.from('classroom_competition_questions')
    .select('answer_key').eq('id', teamState.question.id).single();
  if (error) throw error;
  return answerResponse(data.answer_key);
}

try {
  const suffix = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const email = `kampai-competition-${suffix}@example.com`;
  const password = `Kp!${crypto.randomUUID()}9a`;
  const { data: createdUser, error: userError } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
  });
  if (userError || !createdUser.user) throw userError || new Error('test user creation failed');
  testUserId = createdUser.user.id;
  const { error: roleError } = await admin.from('user_roles').insert({ user_id: testUserId, role: 'teacher' });
  if (roleError) throw roleError;
  const { error: signInError } = await hostClient.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;

  const { data: students, error: studentsError } = await admin.from('students')
    .select('id, name').eq('is_active', true).ilike('class', 'ป.4%').order('class_number').limit(4);
  if (studentsError || !students || students.length < 4) throw studentsError || new Error('four active P4 students required');

  const created = await hostAction('create', {
    config: {
      className: 'ป.4', activityKey: 'improper_to_mixed', difficulty: 'medium',
      questionDistribution: 'shared', questionCount: 10, durationSeconds: 60, seed: 24681357,
    },
    teams: [
      { name: 'ทีมทดสอบน้ำเงิน', studentIds: students.slice(0, 2).map((student) => student.id) },
      { name: 'ทีมทดสอบทอง', studentIds: students.slice(2, 4).map((student) => student.id) },
    ],
  });
  const competition = created.competition;
  const teams = [...created.teams].sort((a, b) => a.sort_order - b.sort_order);
  createdCompetitionIds.push(competition.id);

  browser = await chromium.launch({ headless: true });
  const hostContext = await browser.newContext();
  const teamAContext = await browser.newContext();
  const teamBContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const teamAPage = await teamAContext.newPage();
  const teamBPage = await teamBContext.newPage();
  const browserErrors = [];
  for (const page of [hostPage, teamAPage, teamBPage]) {
    page.on('console', (message) => {
      if (message.type() === 'error' && !message.text().includes('ERR_NETWORK_ACCESS_DENIED')) browserErrors.push(message.text());
    });
  }

  await Promise.all([teamAPage, teamBPage].map((page) => page.goto(`${appUrl}/classroom-competition/join`, { waitUntil: 'networkidle' })));
  for (const [page, deviceName] of [[teamAPage, 'E2E Team A'], [teamBPage, 'E2E Team B']]) {
    await page.locator('input').nth(0).fill(competition.room_code);
    await page.locator('input').nth(1).fill(deviceName);
    await page.getByRole('button', { name: 'ส่งคำขอเข้า' }).click();
    await page.getByRole('heading', { name: 'รอครูอนุมัติ', exact: true }).waitFor({ timeout: 15_000 });
    assert.ok(await page.evaluate(() => sessionStorage.getItem('kampai-classroom-competition-device-token')), `${deviceName} must receive a device token`);
  }

  let devices = [];
  let devicesError = null;
  for (let retry = 0; retry < 10; retry += 1) {
    const result = await admin.from('classroom_competition_devices')
      .select('id, display_name, status').eq('competition_id', competition.id).order('display_name');
    devices = result.data ?? [];
    devicesError = result.error;
    if (devices.length === 2 || devicesError) break;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (devicesError || devices.length !== 2) {
    throw devicesError || new Error(`two pending devices required: ${JSON.stringify(devices)}`);
  }
  const deviceA = devices.find((device) => device.display_name === 'E2E Team A');
  const deviceB = devices.find((device) => device.display_name === 'E2E Team B');
  await hostAction('approveDevice', { competitionId: competition.id, deviceId: deviceA.id, teamId: teams[0].id });
  await hostAction('approveDevice', { competitionId: competition.id, deviceId: deviceB.id, teamId: teams[1].id });
  await Promise.all([
    teamAPage.getByText('ทีมทดสอบน้ำเงิน พร้อมแล้ว').waitFor({ timeout: 15_000 }),
    teamBPage.getByText('ทีมทดสอบทอง พร้อมแล้ว').waitFor({ timeout: 15_000 }),
  ]);

  await hostPage.goto(`${appUrl}/admin?redirect=${encodeURIComponent(`/teacher/classroom-competitions/${competition.id}/host`)}`, { waitUntil: 'networkidle' });
  await hostPage.locator('input[type="email"]').fill(email);
  await hostPage.locator('input[type="password"]').fill(password);
  await hostPage.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await hostPage.getByText(competition.room_code, { exact: true }).waitFor({ timeout: 20_000 });

  await hostAction('start', { competitionId: competition.id });
  await Promise.all([
    teamAPage.getByText(/ข้อ 1 \/ 10/).waitFor({ timeout: 15_000 }),
    teamBPage.getByText(/ข้อ 1 \/ 10/).waitFor({ timeout: 15_000 }),
  ]);

  const tokenA = await teamAPage.evaluate(() => sessionStorage.getItem('kampai-classroom-competition-device-token'));
  const tokenB = await teamBPage.evaluate(() => sessionStorage.getItem('kampai-classroom-competition-device-token'));
  assert.ok(tokenA && tokenB, 'both browser contexts must hold device tokens');
  const stateA0 = await teamRequest(tokenA, { action: 'state' });
  const correctA0 = await currentAnswer(stateA0.data);
  await teamAPage.getByLabel('จำนวนเต็ม').fill(String(correctA0.whole));
  await teamAPage.getByLabel('ตัวเศษ').fill(String(correctA0.numerator));
  await teamAPage.getByLabel('ตัวส่วน').fill(String(correctA0.denominator));
  await teamAPage.getByRole('button', { name: 'ส่งคำตอบ' }).click();
  await teamAPage.getByText('ถูกต้อง! +1 คะแนน').waitFor();

  for (let attempt = 0; attempt < 2; attempt += 1) {
    await teamBPage.getByLabel('จำนวนเต็ม').fill('0');
    await teamBPage.getByLabel('ตัวเศษ').fill('0');
    await teamBPage.getByLabel('ตัวส่วน').fill('1');
    await teamBPage.getByRole('button', { name: 'ส่งคำตอบ' }).click();
    await teamBPage.waitForTimeout(1900);
  }
  await teamBPage.getByText(/ข้อ 2 \/ 10/).waitFor({ timeout: 10_000 });

  await hostAction('pause', { competitionId: competition.id });
  await Promise.all([teamAPage.getByText('พักการแข่งขัน').waitFor(), teamBPage.getByText('พักการแข่งขัน').waitFor()]);
  await hostAction('resume', { competitionId: competition.id });
  await Promise.all([teamAPage.getByText(/ข้อ 2 \/ 10/).waitFor(), teamBPage.getByText(/ข้อ 2 \/ 10/).waitFor()]);

  const stateA1 = (await teamRequest(tokenA, { action: 'state' })).data;
  const idempotencyKey = crypto.randomUUID();
  const submitBody = { action: 'submit', questionId: stateA1.question.id, response: await currentAnswer(stateA1), idempotencyKey };
  const firstSubmit = await teamRequest(tokenA, submitBody);
  const duplicateSubmit = await teamRequest(tokenA, submitBody);
  assert.equal(firstSubmit.data.result.correct, true);
  assert.equal(duplicateSubmit.data.result.duplicate, true);

  const [stateA2, stateB1] = await Promise.all([
    teamRequest(tokenA, { action: 'state' }).then((result) => result.data),
    teamRequest(tokenB, { action: 'state' }).then((result) => result.data),
  ]);
  const [concurrentA, concurrentB] = await Promise.all([
    teamRequest(tokenA, { action: 'submit', questionId: stateA2.question.id, response: await currentAnswer(stateA2), idempotencyKey: crypto.randomUUID() }),
    teamRequest(tokenB, { action: 'submit', questionId: stateB1.question.id, response: await currentAnswer(stateB1), idempotencyKey: crypto.randomUUID() }),
  ]);
  assert.equal(concurrentA.data.result.correct, true);
  assert.equal(concurrentB.data.result.correct, true);

  await admin.from('classroom_competitions').update({ ends_at: new Date(Date.now() - 1000).toISOString() }).eq('id', competition.id);
  await teamRequest(tokenA, { action: 'state' });
  const { data: results, error: resultsError } = await admin.from('classroom_competition_results')
    .select('team_id, outcome, league_points').eq('competition_id', competition.id).order('rank');
  if (resultsError) throw resultsError;
  assert.deepEqual(results.map((result) => result.league_points), [3, 1]);
  assert.equal(results[0].team_id, teams[0].id);

  await hostPage.getByText('ทีมชนะ').waitFor({ timeout: 15_000 });
  const history = await hostAction('history', { filters: {} });
  assert.ok(history.matches.some((match) => match.id === competition.id));
  assert.ok(history.individual.filter((row) => students.some((student) => student.id === row.student.id)).length >= 4);

  await admin.from('classroom_competition_devices').update({ expires_at: new Date(Date.now() - 1000).toISOString() }).eq('id', deviceB.id);
  const expiredState = await teamRequest(tokenB, { action: 'state' });
  assert.equal(expiredState.status, 401);
  assert.equal(browserErrors.length, 0, browserErrors.join('\n'));

  console.log(JSON.stringify({
    status: 'PASS', contexts: 3, roomCode: competition.room_code,
    checks: ['join/approve', 'host auth', 'wrong 1/2 lock', 'pause/resume', 'idempotency', 'concurrent submit', 'server expiry', 'league 3/1', 'history stats', 'token expiry'],
  }, null, 2));
} finally {
  if (browser) await browser.close().catch(() => {});
  for (const competitionId of createdCompetitionIds) {
    await admin.from('classroom_competitions').delete().eq('id', competitionId);
  }
  if (testUserId) await admin.auth.admin.deleteUser(testUserId);
}
