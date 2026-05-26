// line-webhook — receives LINE Messaging API events.
// Configure this URL in LINE Developers Console > Messaging API > Webhook URL.
// Required Supabase Edge Function secrets:
//   LINE_CHANNEL_SECRET       (for signature verification)
//   LINE_CHANNEL_ACCESS_TOKEN (for fetching user profile + sending welcome)
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const LINE_CHANNEL_SECRET = Deno.env.get('LINE_CHANNEL_SECRET');
const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');

async function verifyLineSignature(body: string, signatureB64: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));
  if (expected.length !== signatureB64.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signatureB64.charCodeAt(i);
  return diff === 0;
}

async function fetchLineProfile(lineUserId: string) {
  if (!LINE_CHANNEL_ACCESS_TOKEN) return null;
  try {
    const r = await fetch(`https://api.line.me/v2/bot/profile/${lineUserId}`, {
      headers: { Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}` },
    });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

async function replyMessage(replyToken: string, text: string) {
  if (!LINE_CHANNEL_ACCESS_TOKEN) return;
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: 'text', text }],
    }),
  }).catch(() => {});
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('ok', { status: 200 });

  if (!LINE_CHANNEL_SECRET) {
    console.error('LINE_CHANNEL_SECRET not configured');
    return new Response('not configured', { status: 500 });
  }

  const signature = req.headers.get('x-line-signature');
  const body = await req.text();
  if (!signature || !(await verifyLineSignature(body, signature, LINE_CHANNEL_SECRET))) {
    return new Response('invalid signature', { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response('invalid json', { status: 400 });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const events: any[] = payload.events ?? [];

  for (const ev of events) {
    const lineUserId = ev.source?.userId;
    if (!lineUserId) continue;

    if (ev.type === 'follow') {
      const profile = await fetchLineProfile(lineUserId);
      await admin.from('line_user_links').upsert(
        {
          line_user_id: lineUserId,
          display_name: profile?.displayName ?? null,
          picture_url: profile?.pictureUrl ?? null,
          language: profile?.language ?? null,
          is_followed: true,
          followed_at: new Date().toISOString(),
          unfollowed_at: null,
        },
        { onConflict: 'line_user_id' },
      );
      await admin.from('line_message_logs').insert({
        line_user_id: lineUserId,
        direction: 'in',
        message_type: 'follow',
        payload: ev,
        status: 'ok',
      });
      if (ev.replyToken) {
        const welcome =
          'ยินดีต้อนรับสู่ระบบแจ้งเตือนของโรงเรียนบ้านคำไผ่ 🟢\n\nกรุณาล็อกอินเข้า Portal ผู้ปกครองและขอให้ผู้ดูแลระบบผูกบัญชี LINE ของท่านเข้ากับบัญชี Kampai เพื่อรับข่าวสาร';
        await replyMessage(ev.replyToken, welcome);
      }
    } else if (ev.type === 'unfollow') {
      await admin
        .from('line_user_links')
        .update({ is_followed: false, unfollowed_at: new Date().toISOString() })
        .eq('line_user_id', lineUserId);
      await admin.from('line_message_logs').insert({
        line_user_id: lineUserId,
        direction: 'in',
        message_type: 'unfollow',
        payload: ev,
        status: 'ok',
      });
    } else if (ev.type === 'message') {
      await admin.from('line_message_logs').insert({
        line_user_id: lineUserId,
        direction: 'in',
        message_type: ev.message?.type ?? 'unknown',
        payload: ev,
        status: 'ok',
      });
      if (ev.message?.type === 'text' && ev.replyToken) {
        await replyMessage(
          ev.replyToken,
          'ขอบคุณสำหรับข้อความค่ะ ขณะนี้ระบบยังไม่รองรับการตอบกลับผ่าน LINE ติดต่อครูประจำชั้นหรือบัตรรรักษาของโรงเรียนได้โดยตรงค่ะ',
        );
      }
    }
  }

  return new Response('ok', { status: 200 });
});
