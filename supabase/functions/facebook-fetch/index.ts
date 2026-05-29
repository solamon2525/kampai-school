// facebook-fetch — pulls recent posts from a Facebook Page via Graph API
// and upserts them into public.facebook_posts. Updates last_status on
// public.facebook_feed_config.
//
// Auth: admin only. Reads token from DB (service role bypass), so no secret
// needs to be configured at the edge function level.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GRAPH_VERSION = 'v19.0';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface GraphPost {
  id: string;
  message?: string;
  created_time: string;
  full_picture?: string;
  permalink_url?: string;
  attachments?: unknown;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const authHeader = req.headers.get('Authorization') ?? '';
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userResp } = await sb.auth.getUser();
  if (!userResp?.user) return json({ error: 'unauthorized' }, 401);

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: roleRow } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', userResp.user.id)
    .maybeSingle();
  if ((roleRow as { role?: string } | null)?.role !== 'admin') {
    return json({ error: 'forbidden' }, 403);
  }

  const { data: config, error: cfgErr } = await admin
    .from('facebook_feed_config')
    .select('id, page_id, access_token, posts_count, enabled')
    .limit(1)
    .maybeSingle();

  if (cfgErr) return json({ error: 'config_read_failed', detail: cfgErr.message }, 500);
  if (!config) return json({ error: 'config_missing', detail: 'No facebook_feed_config row.' }, 400);
  if (!config.enabled) return json({ ok: true, skipped: 'disabled' });

  const fields = 'id,message,created_time,full_picture,permalink_url,attachments';
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(config.page_id)}/posts`
    + `?fields=${fields}&limit=${config.posts_count}&access_token=${encodeURIComponent(config.access_token)}`;

  let graphRes: Response;
  try {
    graphRes = await fetch(url);
  } catch (e) {
    await admin.from('facebook_feed_config').update({
      last_status: 'error',
      last_error: `network: ${(e as Error)?.message ?? String(e)}`,
    }).eq('id', config.id);
    return json({ ok: false, status: 'error', error: 'network_failure' }, 502);
  }

  const bodyText = await graphRes.text();
  let payload: { data?: GraphPost[]; error?: { message?: string; code?: number; type?: string } } = {};
  try {
    payload = JSON.parse(bodyText);
  } catch {
    await admin.from('facebook_feed_config').update({
      last_status: 'error',
      last_error: `non_json_response: ${bodyText.slice(0, 200)}`,
    }).eq('id', config.id);
    return json({ ok: false, status: 'error', error: 'non_json_response' }, 502);
  }

  if (!graphRes.ok || payload.error) {
    const fbErr = payload.error;
    const code = fbErr?.code;
    // 190 = invalid token, 102 = session expired, 463 = expired access token
    const isTokenIssue = code === 190 || code === 102 || code === 463
      || (fbErr?.type === 'OAuthException');
    const status = isTokenIssue ? 'token_expired' : 'error';
    await admin.from('facebook_feed_config').update({
      last_status: status,
      last_error: fbErr?.message ?? `http_${graphRes.status}`,
    }).eq('id', config.id);
    return json({
      ok: false,
      status,
      error: fbErr?.message ?? 'graph_error',
      code: code ?? graphRes.status,
    }, 200);
  }

  const posts = payload.data ?? [];
  let upsertedCount = 0;

  if (posts.length) {
    const rows = posts.map((p) => ({
      id: p.id,
      message: p.message ?? null,
      created_time: p.created_time,
      full_picture: p.full_picture ?? null,
      permalink_url: p.permalink_url ?? `https://www.facebook.com/${p.id}`,
      attachments: (p.attachments as unknown) ?? null,
      fetched_at: new Date().toISOString(),
    }));
    const { error: upErr } = await admin.from('facebook_posts').upsert(rows, { onConflict: 'id' });
    if (upErr) {
      await admin.from('facebook_feed_config').update({
        last_status: 'error',
        last_error: `upsert: ${upErr.message}`,
      }).eq('id', config.id);
      return json({ ok: false, status: 'error', error: upErr.message }, 500);
    }
    upsertedCount = rows.length;

    // Trim cache: keep only the most-recent N posts (matches posts_count).
    const keepIds = posts.map((p) => p.id);
    await admin.from('facebook_posts').delete().not('id', 'in', `(${keepIds.map((i) => `"${i}"`).join(',')})`);
  }

  await admin.from('facebook_feed_config').update({
    last_status: 'ok',
    last_error: null,
    last_fetched_at: new Date().toISOString(),
  }).eq('id', config.id);

  return json({ ok: true, status: 'ok', fetched_count: upsertedCount });
});
