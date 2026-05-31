// facebook-fetch — pulls recent posts from a Facebook Page via Graph API
// and upserts them into public.facebook_posts. Updates last_status on
// public.facebook_feed_config.
//
// Auth: admin session OR a cron shared-secret (x-cron-secret). Reads token
// from DB (service role bypass), so no Facebook secret is configured here.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GRAPH_VERSION = 'v19.0';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
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

const NEWS_CATEGORY = 'ข่าวจาก Facebook';
const NEWS_BUCKET = 'school-images';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Title from the first non-empty line of the message, capped at 80 chars. */
function buildTitle(message: string | null, createdTime: string): string {
  const firstLine = (message ?? '')
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (firstLine) {
    return firstLine.length > 80 ? `${firstLine.slice(0, 80).trimEnd()}…` : firstLine;
  }
  let dateLabel = createdTime;
  try {
    dateLabel = new Date(createdTime).toLocaleDateString('th-TH', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch { /* keep ISO fallback */ }
  return `โพสต์จาก Facebook · ${dateLabel}`;
}

/** Plain text → ~200 char single-line excerpt. */
function buildExcerpt(message: string | null): string {
  const flat = (message ?? '').replace(/\s+/g, ' ').trim();
  return flat.length > 200 ? `${flat.slice(0, 200).trimEnd()}…` : flat;
}

/** Message → safe HTML paragraphs (newlines preserved, no raw HTML injection). */
function buildContent(message: string | null): string {
  const text = (message ?? '').trim();
  if (!text) return '';
  return text
    .split(/\n{2,}/)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

/**
 * Facebook CDN URLs (full_picture) carry an expiring signature, so they break
 * on long-lived news rows. Download once and re-host in our own bucket.
 * Returns a stable public URL, or the original URL as a best-effort fallback.
 */
async function rehostCover(
  admin: ReturnType<typeof createClient>,
  fullPicture: string | undefined,
  postId: string,
): Promise<string | null> {
  if (!fullPicture) return null;
  try {
    const res = await fetch(fullPicture);
    if (!res.ok) return fullPicture;
    const contentType = res.headers.get('content-type') ?? 'image/jpeg';
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
    const bytes = new Uint8Array(await res.arrayBuffer());
    const path = `facebook/${postId.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
    const { error } = await admin.storage
      .from(NEWS_BUCKET)
      .upload(path, bytes, { contentType, upsert: true });
    if (error) return fullPicture;
    const { data } = admin.storage.from(NEWS_BUCKET).getPublicUrl(path);
    return data?.publicUrl ?? fullPicture;
  } catch {
    return fullPicture;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Cron path: a server-side scheduler (Vercel cron → /api/sync-facebook) calls
  // this with a shared secret instead of an admin session. Everything else must
  // be an authenticated admin.
  const cronSecret = req.headers.get('x-cron-secret');
  const isCron = !!cronSecret && cronSecret === Deno.env.get('CRON_SECRET');

  if (!isCron) {
    const authHeader = req.headers.get('Authorization') ?? '';
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userResp } = await sb.auth.getUser();
    if (!userResp?.user) return json({ error: 'unauthorized' }, 401);

    const { data: roleRow } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userResp.user.id)
      .maybeSingle();
    if ((roleRow as { role?: string } | null)?.role !== 'admin') {
      return json({ error: 'forbidden' }, 403);
    }
  }

  const { data: config, error: cfgErr } = await admin
    .from('facebook_feed_config')
    .select('id, page_id, access_token, posts_count, enabled, sync_to_news')
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
  let createdNewsCount = 0;

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

    // Convert posts into published news rows (opt-in). Idempotent via the
    // news_synced marker — a deleted news row will not be recreated.
    if (config.sync_to_news) {
      const { data: unsynced } = await admin
        .from('facebook_posts')
        .select('id, message, created_time, full_picture, permalink_url')
        .eq('news_synced', false)
        .order('created_time', { ascending: true });

      for (const post of (unsynced ?? []) as GraphPost[]) {
        try {
          const cover = await rehostCover(admin, post.full_picture, post.id);
          const { error: insErr } = await admin.from('news').insert({
            title: buildTitle(post.message ?? null, post.created_time),
            excerpt: buildExcerpt(post.message ?? null),
            content: buildContent(post.message ?? null),
            category: NEWS_CATEGORY,
            cover_image_url: cover,
            published: true,
            published_at: post.created_time,
            external_links: [{ title: 'ดูบน Facebook', url: post.permalink_url }],
            source: 'facebook',
            source_fb_post_id: post.id,
          });
          if (insErr) {
            // 23505 = unique violation (row already exists) → just mark synced.
            if (insErr.code !== '23505') continue;
          }
          await admin.from('facebook_posts').update({ news_synced: true }).eq('id', post.id);
          if (!insErr) createdNewsCount += 1;
        } catch {
          // Skip this post; the rest of the batch still proceeds.
        }
      }
    }

    // Trim cache: keep only the most-recent N posts (matches posts_count).
    const keepIds = posts.map((p) => p.id);
    await admin.from('facebook_posts').delete().not('id', 'in', `(${keepIds.map((i) => `"${i}"`).join(',')})`);
  }

  await admin.from('facebook_feed_config').update({
    last_status: 'ok',
    last_error: null,
    last_fetched_at: new Date().toISOString(),
  }).eq('id', config.id);

  return json({ ok: true, status: 'ok', fetched_count: upsertedCount, created_news_count: createdNewsCount });
});
