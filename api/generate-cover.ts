// api/generate-cover.ts — Vercel Node function: สร้าง "ภาพประกอบปกเกม" ด้วย Pollinations (ฟรี)
//
// flow: หลังบ้าน GamesTab กดปุ่ม "ปก AI" → POST มาที่นี่ → ตรวจสิทธิ admin/teacher
// → สร้าง prompt มาตรฐาน (ภาพล้วน ไม่มีตัวหนังสือ ดู public/COVER-PROMPT.md)
// → เรียก Pollinations (Flux, ฟรี ไม่ต้องมี API key) → คืน base64
//   ให้ client เอาไป overlay ชื่อเกม + อัปขึ้น storage เอง (ดู GameCoverAiDialog.tsx)
//
// เปลี่ยนจาก Gemini มา Pollinations เพราะ Gemini image ต้องเปิด billing (free tier limit=0)

export const config = { maxDuration: 60 }; // image gen อาจใช้เวลา 15–40 วิ

const SUPABASE_URL = 'https://lkpqssbqxxpasidfqhpb.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrcHFzc2JxeHhwYXNpZGZxaHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjUyMjgsImV4cCI6MjA5MTI0MTIyOH0.X7YsSlrgYl9ifLWvgyZI04PtebK572pacadfNlmNO-A';
const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt';

// Flux เข้าใจ prompt อังกฤษดีกว่า — เราวาดเฉพาะภาพประกอบ (ตัวหนังสือ overlay ฝั่ง client)
//
// ส่วน "ครีเอทีฟ" มาจาก checklist ฝั่ง client (parts[] — ดู coverPresets.ts) แต่ invariant
// (16:9 + ห้ามมีตัวอักษร + เว้นที่ด้านบน) ครอบที่นี่เสมอ กัน preset ผิดพลาดทำกฎหลุด
function buildPrompt(opts: { subject?: string; parts?: string[]; scene?: string; colors?: string }): string {
  const HEADER =
    'High-quality illustration for a Thai elementary-school educational game cover, 16:9 wide aspect, full frame.';
  const FOOTER =
    'STRICT: absolutely no text, no letters, no words, no numbers, no logos anywhere in the image. ' +
    'Leave the TOP area of the image empty/clear (a title will be added later). Keep main elements in the center-bottom, full 16:9 frame.';

  let middle: string;
  if (opts.parts && opts.parts.length) {
    const subj = opts.subject ? `Subject theme: ${opts.subject}.` : '';
    middle = [subj, opts.parts.join('. ') + '.'].filter(Boolean).join(' ');
  } else {
    // legacy path (subject/scene/colors แบบเดิม)
    const { subject = '', scene = '', colors = '' } = opts;
    middle = [
      'Cute chibi cartoon illustration, flat design, clean lines, bright cheerful colors, kawaii style for young kids.',
      'Main character: a cute chibi Thai student (big head, white school shirt, navy-blue Thai school uniform), smiling.',
      `Subject theme: ${subject || 'general learning'}. Background: bright gradient with sparkles and subject icons.`,
      `Main scene (the gameplay): ${scene || `a child happily learning about ${subject || 'this subject'}`}.`,
      `Main color tone: ${colors || 'cheerful colors that match the subject'}.`,
    ].join(' ');
  }
  return [HEADER, middle, FOOTER].join(' ');
}

async function callPollinations(prompt: string) {
  const seed = Math.floor(Math.random() * 1_000_000);
  const url =
    `${POLLINATIONS_BASE}/${encodeURIComponent(prompt)}` +
    `?width=1280&height=720&nologo=true&model=flux&seed=${seed}`;
  const res = await fetch(url, { headers: { Accept: 'image/*' } });
  if (!res.ok) throw new Error(`Pollinations HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const mimeType = res.headers.get('content-type') || 'image/jpeg';
  if (!mimeType.startsWith('image/')) throw new Error('Pollinations ไม่ได้คืนรูปภาพ (อาจกำลังคิวหนัก ลองใหม่)');
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) throw new Error('ภาพที่ได้เล็กผิดปกติ — ลองใหม่อีกครั้ง');
  return { imageBase64: buf.toString('base64'), mimeType };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  // ── ตรวจสิทธิ admin/teacher ผ่าน auth_role() (RLS helper) ──
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'ต้องเข้าสู่ระบบ' });
  try {
    const roleRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/auth_role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
      body: '{}',
    });
    const role = (await roleRes.json().catch(() => null)) as string | null;
    if (!roleRes.ok || (role !== 'admin' && role !== 'teacher')) {
      return res.status(403).json({ error: 'เฉพาะผู้ดูแล/ครูเท่านั้น' });
    }
  } catch {
    return res.status(403).json({ error: 'ตรวจสิทธิ์ไม่สำเร็จ' });
  }

  try {
    const { subject = '', scene = '', colors = '', parts } = (req.body ?? {}) as {
      subject?: string; scene?: string; colors?: string; parts?: string[];
    };
    const safeParts = Array.isArray(parts) ? parts.filter((p) => typeof p === 'string' && p.trim()) : undefined;
    const out = await callPollinations(buildPrompt({ subject, scene, colors, parts: safeParts }));
    return res.status(200).json(out);
  } catch (err: any) {
    return res.status(502).json({ error: err?.message || 'สร้างภาพไม่สำเร็จ' });
  }
}
