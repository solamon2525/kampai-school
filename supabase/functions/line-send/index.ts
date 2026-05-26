// line-send — outbound LINE push messages from Kampai to linked users.
// Required secret: LINE_CHANNEL_ACCESS_TOKEN
// Request: { user_ids?: uuid[], line_user_ids?: string[], text: string, url?: string }
// Auth: admin or teacher role required.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');

interface RequestBody {
  user_ids?: string[];
  line_user_ids?: string[];
  text: string;
  url?: string;
}

async function pushToLine(lineUserId: string, text: string): Promise<{ ok: boolean; error?: string; status?: number }> {
  if (!LINE_CHANNEL_ACCESS_TOKEN) return { ok: false, error: 'LINE_CHANNEL_ACCESS_TOKEN not configured' };
  try {
    const r = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [{ type: 'text', text }],
      }),
    });
    if (!r.ok) {
      const errText = await r.text();
      return { ok: false, status: r.status, error: errText };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e) };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const authHeader = req.headers.get('Authorization') ?? '';
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userResp } = await sb.auth.getUser();
  if (!userResp?.user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });

  const { data: roleRow } = await sb
    .from('user_roles')
    .select('role')
    .eq('user_id', userResp.user.id)
    .maybeSingle();
  const role = (roleRow as { role?: string } | null)?.role;
  if (role !== 'admin' && role !== 'teacher') {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid json' }), { status: 400 });
  }
  if (!body.text) {
    return new Response(JSON.stringify({ error: 'text required' }), { status: 400 });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const targets = new Set<string>(body.line_user_ids ?? []);
  if (body.user_ids?.length) {
    const { data: rows } = await admin.rpc('line_ids_for_users', { p_user_ids: body.user_ids });
    for (const r of (rows as any[] | null) ?? []) targets.add(r.line_user_id);
  }

  const targetList = Array.from(targets);
  if (!targetList.length) {
    return new Response(JSON.stringify({ sent: 0, total: 0, note: 'no linked LINE users' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const messageText = body.url ? `${body.text}\n\nดูรายละเอียด: ${body.url}` : body.text;

  let sent = 0;
  let failed = 0;
  await Promise.all(
    targetList.map(async (lineUserId) => {
      const result = await pushToLine(lineUserId, messageText);
      if (result.ok) sent++;
      else failed++;
      await admin.from('line_message_logs').insert({
        line_user_id: lineUserId,
        direction: 'out',
        message_type: 'text',
        payload: { text: messageText, url: body.url ?? null },
        status: result.ok ? 'ok' : 'error',
        error: result.error ?? null,
      });
    }),
  );

  return new Response(JSON.stringify({ sent, failed, total: targetList.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
