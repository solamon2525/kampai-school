// api/generate-cover.ts — Vercel Node function: สร้าง "ภาพประกอบปกเกม" ด้วย Gemini
//
// flow: หลังบ้าน GamesTab กดปุ่ม "ปก AI" → POST มาที่นี่ → ตรวจสิทธิ admin/teacher
// → สร้าง prompt มาตรฐาน (ภาพล้วน ไม่มีตัวหนังสือ ดู public/COVER-PROMPT.md)
// → เรียก Gemini image model → คืน base64 ให้ client เอาไป overlay ชื่อเกม + อัปขึ้น storage เอง
//
// ตรรกะ Gemini ลอกจาก scripts/gen-cover.mjs (resize/ตัวหนังสือทำฝั่ง client ด้วย canvas แทน sharp)
// env: GEMINI_API_KEY (ต้องตั้งใน Vercel)

const SUPABASE_URL = 'https://lkpqssbqxxpasidfqhpb.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrcHFzc2JxeHhwYXNpZGZxaHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjUyMjgsImV4cCI6MjA5MTI0MTIyOH0.X7YsSlrgYl9ifLWvgyZI04PtebK572pacadfNlmNO-A';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const MODEL = 'gemini-2.5-flash-image-preview';

function buildPrompt(subject: string, scene: string, colors: string): string {
  return [
    'สร้างภาพประกอบปกเกมการศึกษาสำหรับนักเรียนประถม อัตราส่วน 16:9 (กว้างกว่าสูง)',
    'สไตล์การ์ตูน chibi น่ารัก ลายเส้นสะอาดตา flat design สีสันสดใส เหมาะกับเด็กประถม',
    '',
    'สิ่งที่ต้องมีในภาพ:',
    `- โทนสีสดใสร่าเริง พื้นหลังไล่เฉดสว่าง มีประกายดาว/ไอคอนธีมของวิชา "${subject || 'ทั่วไป'}"`,
    '- เด็กนักเรียนไทย chibi หัวโตน่ารัก ใส่ชุดนักเรียนไทย (เสื้อเชิ้ตขาว กางเกง/กระโปรงสีกรมท่า) ยิ้มแย้ม เป็นตัวเอก',
    `- ฉากเด่นกลางภาพ: ${scene || 'เด็กกำลังเรียนรู้/เล่นเกมเกี่ยวกับวิชานี้'} — สื่อ gameplay ให้เดาได้ทันทีว่าเกมเกี่ยวกับอะไร`,
    `- โทนสีหลัก: ${colors || 'เลือกให้เข้ากับวิชา'}`,
    '',
    'ข้อกำหนดสำคัญ (ห้ามพลาด):',
    '- ⛔ ห้ามใส่ตัวอักษร ข้อความ ตัวเลข หรือโลโก้ใด ๆ ลงในภาพเด็ดขาด — เป็นภาพประกอบล้วน ไม่มี text',
    '- เว้นพื้นที่แถบบนของภาพให้โล่ง (ไว้ใส่หัวเรื่องภายหลัง) อย่าวางวัตถุสำคัญชิดขอบบน',
    '- จัดองค์ประกอบหลักไว้กลาง-ล่างของภาพ เต็มเฟรม 16:9',
  ].join('\n');
}

async function callGemini(key: string, prompt: string) {
  const body: {
    contents: { parts: { text: string }[] }[];
    generationConfig: { responseModalities: string[] };
  } = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['IMAGE'] },
  };
  const url = `${GEMINI_BASE}/models/${MODEL}:generateContent?key=${key}`;
  let res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  // บางโมเดลต้องการ TEXT+IMAGE — ลองใหม่ถ้าโดน reject เรื่อง responseModalities
  if (!res.ok) {
    const t = await res.text();
    if (/responseModalities|modal/i.test(t)) {
      body.generationConfig.responseModalities = ['TEXT', 'IMAGE'];
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    } else {
      throw new Error(`Gemini HTTP ${res.status}: ${t.slice(0, 300)}`);
    }
  }
  const json = await res.json();
  const parts = json?.candidates?.[0]?.content?.parts ?? [];
  const img = parts.find((p: { inlineData?: unknown; inline_data?: unknown }) => p.inlineData || p.inline_data);
  const inline = img?.inlineData || img?.inline_data;
  if (!inline?.data) throw new Error('Gemini ไม่คืนรูปภาพ (อาจติด safety filter หรือ key ไม่รองรับ image)');
  return { imageBase64: inline.data as string, mimeType: (inline.mimeType || inline.mime_type || 'image/png') as string };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'GEMINI_API_KEY ยังไม่ได้ตั้งใน Vercel' });

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
    const { subject = '', scene = '', colors = '' } = (req.body ?? {}) as {
      subject?: string; scene?: string; colors?: string;
    };
    const out = await callGemini(key, buildPrompt(subject, scene, colors));
    return res.status(200).json(out);
  } catch (err: any) {
    return res.status(502).json({ error: err?.message || 'สร้างภาพไม่สำเร็จ' });
  }
}
