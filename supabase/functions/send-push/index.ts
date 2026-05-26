// send-push edge function
// Receives { user_ids: string[], topic: string, title, body, url? } and dispatches Web Push
// via VAPID. Requires Supabase secrets: VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY, VAPID_SUBJECT.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@kampai-school.vercel.app';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

interface PushPayload {
  user_ids?: string[];
  topic?: string;
  title: string;
  body: string;
  url?: string;
  icon?: string;
  tag?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Only admins (or service-role calls) may broadcast
  const authHeader = req.headers.get('Authorization') ?? '';
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userResp } = await supabase.auth.getUser();
  if (!userResp?.user) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userResp.user.id)
    .maybeSingle();
  if (roleRow?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 });
  }

  const payload = (await req.json()) as PushPayload;
  if (!payload.title || !payload.body) {
    return new Response(JSON.stringify({ error: 'title and body required' }), { status: 400 });
  }

  // Use service role for the actual subscription lookup (bypass RLS for fanout)
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  let query = admin.from('push_subscriptions').select('id, user_id, endpoint, p256dh, auth_key');
  if (payload.user_ids?.length) query = query.in('user_id', payload.user_ids);
  if (payload.topic) query = query.contains('topics', [payload.topic]);
  const { data: subs, error } = await query;
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const notification = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? '/',
    icon: payload.icon,
    tag: payload.tag,
  });

  let sent = 0;
  let failed = 0;
  const pruned: string[] = [];

  await Promise.all(
    (subs ?? []).map(async (s: any) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth_key } },
          notification,
        );
        sent++;
        await admin
          .from('push_subscriptions')
          .update({ last_used_at: new Date().toISOString(), failed_count: 0 })
          .eq('id', s.id);
      } catch (e: any) {
        failed++;
        const status = e?.statusCode ?? 0;
        if (status === 404 || status === 410) {
          // Endpoint gone — delete
          pruned.push(s.id);
        } else {
          await admin
            .from('push_subscriptions')
            .update({ failed_count: (s.failed_count ?? 0) + 1 })
            .eq('id', s.id);
        }
      }
    }),
  );

  if (pruned.length) {
    await admin.from('push_subscriptions').delete().in('id', pruned);
  }

  return new Response(JSON.stringify({ sent, failed, pruned: pruned.length, total: subs?.length ?? 0 }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
