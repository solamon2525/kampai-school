// ai-assist edge function — Claude API integration for Kampai School
// Modes: lesson_plan | exam_questions | report_comment | free
// Requires Supabase secret: ANTHROPIC_API_KEY (and optionally ANTHROPIC_MODEL_FAST / ANTHROPIC_MODEL_SMART)
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Anthropic from 'npm:@anthropic-ai/sdk@^0.35.0';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const MODEL_FAST = Deno.env.get('ANTHROPIC_MODEL_FAST') ?? 'claude-haiku-4-5';
const MODEL_SMART = Deno.env.get('ANTHROPIC_MODEL_SMART') ?? 'claude-sonnet-4-5';

type Mode = 'lesson_plan' | 'exam_questions' | 'report_comment' | 'free';

interface RequestBody {
  mode: Mode;
  input: Record<string, string>;
  notes?: string;
}

const SYSTEM_PROMPTS: Record<Mode, string> = {
  lesson_plan: `คุณคือ AI ช่วยออกแบบแผนการสอนสำหรับครูไทยระดับประถมศึกษาตามรูปแบบของ สพฐ. ตอบเป็น markdown มีหัวข้อ:
# แผนการสอน
## ข้อมูลทั่วไป
## มาตรฐาน/ตัวชี้วัด
## จุดประสงค์การเรียนรู้ (K-P-A)
## สาระการเรียนรู้
## กระบวนการเรียนรู้ (ขั้นนำ-สอน-สรุป)
## สื่อ/อุปกรณ์
## การวัดผลและประเมินผล
## บันทึกหลังสอน
ใช้ภาษาไทยที่เหมาะสมกับระดับชั้นของนักเรียน ห้าม hallucinate ข้อมูลตัวเลขที่ไม่มี`,
  exam_questions: `คุณคือ AI ออกข้อสอบปรนัยสำหรับครูไทยระดับประถมศึกษา ตอบเป็น markdown รูปแบบ:
## ข้อ 1.
(คำถาม)
ก. ...
ข. ...
ค. ...
ง. ...
**เฉลย: ข — อธิบายสั้นๆ**

ครอบคลุม Bloom's Taxonomy หลายระดับ (จำ-เข้าใจ-ประยุกต์-วิเคราะห์) และระบุ difficulty (ง่าย/ปานกลาง/ยาก) ต่อข้อ`,
  report_comment: `คุณคือ AI ช่วยครูเขียน "ความเห็นของครู" บนสมุดพกนักเรียนระดับประถมศึกษา ข้อความต้อง:
- ยาว 3-5 บรรทัด
- ภาษาสุภาพ เป็นบวก ให้กำลังใจ
- ระบุจุดเด่นเฉพาะตัว (จากข้อมูลที่ผู้ใช้ให้)
- แนะนำสิ่งที่ควรพัฒนาต่อ
- ห้ามใช้คำหยาบหรือเปรียบเทียบกับเพื่อน
Return ผลลัพธ์เป็นย่อหน้าเดียว (paragraph) ไม่ต้องมี markdown`,
  free: 'คุณคือ AI ผู้ช่วยครูระดับประถมศึกษาไทย ตอบภาษาไทยสุภาพ กระชับ-รัดกุม ตรงประเด็น',
};

function buildUserMessage(mode: Mode, input: Record<string, string>, notes?: string): string {
  const lines: string[] = [];
  switch (mode) {
    case 'lesson_plan':
      lines.push(`รายวิชา: ${input.subject ?? '-'}`);
      lines.push(`ระดับชั้น: ${input.grade ?? '-'}`);
      lines.push(`หัวข้อ: ${input.topic ?? '-'}`);
      lines.push(`ระยะเวลา (นาที): ${input.duration ?? '60'}`);
      break;
    case 'exam_questions':
      lines.push(`รายวิชา: ${input.subject ?? '-'}`);
      lines.push(`ระดับชั้น: ${input.grade ?? '-'}`);
      lines.push(`หัวข้อ/บทเรียน: ${input.topic ?? '-'}`);
      lines.push(`จำนวนข้อที่ต้องการ: ${input.count ?? '10'}`);
      lines.push(`ระดับความยาก: ${input.difficulty ?? 'ปานกลาง'}`);
      break;
    case 'report_comment':
      lines.push(`นักเรียน: ${input.studentName ?? '-'}`);
      lines.push(`ระดับชั้น: ${input.grade ?? '-'}`);
      lines.push(`ความสามารถเด่น: ${input.strengths ?? '-'}`);
      lines.push(`จุดที่ควรพัฒนา: ${input.improvements ?? '-'}`);
      lines.push(`ความประพฤติ/คุณลักษณะ: ${input.conduct ?? '-'}`);
      break;
    case 'free':
      lines.push(input.prompt ?? '');
      break;
  }
  if (notes) lines.push(`\nหมายเหตุเพิ่มเติม: ${notes}`);
  return lines.join('\n');
}

Deno.serve(async (req: Request) => {
  const startedAt = Date.now();
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), { status: 500 });
  }

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
  if (!body.mode || !body.input) {
    return new Response(JSON.stringify({ error: 'mode and input required' }), { status: 400 });
  }

  const systemPrompt = SYSTEM_PROMPTS[body.mode];
  if (!systemPrompt) return new Response(JSON.stringify({ error: 'unknown mode' }), { status: 400 });

  const userMessage = buildUserMessage(body.mode, body.input, body.notes);
  const model = body.mode === 'report_comment' ? MODEL_FAST : MODEL_SMART;

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  try {
    const resp = await client.messages.create({
      model,
      max_tokens: body.mode === 'exam_questions' ? 4000 : 2000,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userMessage }],
    });

    const text = resp.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('\n');

    const usage: any = resp.usage ?? {};
    await admin.from('ai_assist_log').insert({
      user_id: userResp.user.id,
      mode: body.mode,
      model,
      prompt_chars: userMessage.length,
      output_chars: text.length,
      input_tokens: usage.input_tokens ?? null,
      output_tokens: usage.output_tokens ?? null,
      cached_input_tokens: usage.cache_read_input_tokens ?? 0,
      duration_ms: Date.now() - startedAt,
    });

    return new Response(
      JSON.stringify({
        text,
        model,
        usage: {
          input_tokens: usage.input_tokens,
          output_tokens: usage.output_tokens,
          cached: usage.cache_read_input_tokens ?? 0,
        },
        duration_ms: Date.now() - startedAt,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (e: any) {
    await admin.from('ai_assist_log').insert({
      user_id: userResp.user.id,
      mode: body.mode,
      model,
      prompt_chars: userMessage.length,
      duration_ms: Date.now() - startedAt,
      error: e?.message ?? String(e),
    });
    return new Response(JSON.stringify({ error: e?.message ?? 'AI call failed' }), { status: 502 });
  }
});
