import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to encode string to Base64 (needed for Resend attachment payload in Edge Functions)
function toBase64(str: string): string {
  const codeUnits = new Uint16Array(str.length);
  for (let i = 0; i < str.length; i++) {
    codeUnits[i] = str.charCodeAt(i);
  }
  const charCodes = new Uint8Array(codeUnits.buffer);
  let binary = '';
  for (let i = 0; i < charCodes.byteLength; i++) {
    binary += String.fromCharCode(charCodes[i]);
  }
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const json = (body: any, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const FROM_EMAIL = Deno.env.get('NOTIFICATION_FROM_EMAIL') || 'news@school.ac.th';

    if (!RESEND_API_KEY) {
      throw new Error('Missing environment variable: RESEND_API_KEY');
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // 1. Fetch backup settings from school_settings
    const { data: settings } = await adminClient
      .from('school_settings')
      .select('key, value')
      .in('key', ['savings_backup_enabled', 'savings_backup_teacher_email']);

    const settingsMap = Object.fromEntries((settings || []).map(s => [s.key, s.value]));
    const enabled = settingsMap['savings_backup_enabled'] !== 'false';
    const email = settingsMap['savings_backup_teacher_email'];

    if (!enabled) {
      return json({ success: true, message: 'ระบบสำรองข้อมูลอัตโนมัติถูกปิดอยู่ (savings_backup_enabled = false)' });
    }

    if (!email) {
      return json({ success: false, message: 'ไม่ได้ตั้งค่าอีเมลผู้รับสำรองข้อมูล (savings_backup_teacher_email)' }, 400);
    }

    // 2. Fetch all student savings summaries
    const { data: summaries, error: fetchErr } = await adminClient
      .from('savings_student_summary')
      .select('*')
      .order('class_name', { ascending: true })
      .order('full_name', { ascending: true });

    if (fetchErr) throw fetchErr;
    if (!summaries || summaries.length === 0) {
      return json({ success: true, message: 'ไม่มีข้อมูลนักเรียนที่มียอดบัญชีเงินออม' });
    }

    // 3. Compute KPI Statistics
    const totalBalance = summaries.reduce((sum, s) => sum + Number(s.current_balance ?? 0), 0);
    const totalSavers = summaries.filter(s => Number(s.current_balance ?? 0) > 0).length;
    const totalDeposits = summaries.reduce((sum, s) => sum + Number(s.total_deposits ?? 0), 0);
    const totalWithdrawals = summaries.reduce((sum, s) => sum + Number(s.total_withdrawals ?? 0), 0);

    // 4. Generate CSV string (Thai headers + BOM for Excel)
    const csvHeaders = ['รหัสประจำตัวนักเรียน', 'ชื่อ-นามสกุล', 'ชั้นเรียน', 'ยอดฝากรวม (บาท)', 'ยอดถอนรวม (บาท)', 'ยอดเงินคงเหลือ (บาท)', 'จำนวนรายการสะสม'];
    const csvRows = summaries.map(s => [
      s.student_code || '—',
      s.full_name || '—',
      s.class_name || '—',
      Number(s.total_deposits ?? 0).toFixed(2),
      Number(s.total_withdrawals ?? 0).toFixed(2),
      Number(s.current_balance ?? 0).toFixed(2),
      String(s.total_transactions ?? 0)
    ]);
    const BOM = '\uFEFF';
    const csvContent = BOM + [csvHeaders, ...csvRows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');

    // 5. Generate beautiful HTML report for all classes
    const rowsHtml = summaries.map((s, idx) => `
      <tr>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px;">${idx + 1}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px;">${s.student_code || '—'}</td>
        <td style="font-weight: 600; border: 1px solid #cbd5e1; padding: 8px;">${s.full_name || '—'}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px;">${s.class_name || '—'}</td>
        <td style="text-align: right; border: 1px solid #cbd5e1; padding: 8px; font-family: monospace;">${Number(s.total_deposits ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td style="text-align: right; border: 1px solid #cbd5e1; padding: 8px; font-family: monospace;">${Number(s.total_withdrawals ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td style="text-align: right; border: 1px solid #cbd5e1; padding: 8px; font-family: monospace; font-weight: 700;">${Number(s.current_balance ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px;">${s.total_transactions ?? 0}</td>
      </tr>
    `).join('');

    const todayStr = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
    const emailHtml = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: 'Sarabun', -apple-system, sans-serif; padding: 20px; color: #1e293b; background: #ffffff; line-height: 1.5; }
    .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 25px; text-align: center; }
    h1 { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 5px 0; }
    .subtitle { font-size: 13px; color: #64748b; font-weight: 500; }
    .kpi-container { display: table; width: 100%; border-spacing: 12px; margin-bottom: 25px; }
    .kpi-card { display: table-cell; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc; text-align: center; width: 25%; }
    .kpi-card.hero { background: #fffbeb; border-color: #fde68a; }
    .kpi-label { font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
    .kpi-value { font-size: 16px; font-weight: 800; color: #0f172a; }
    .kpi-value .unit { font-size: 11px; font-weight: 500; color: #64748b; margin-left: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 11px; }
    th { border: 1px solid #cbd5e1; padding: 8px; background: #f1f5f9; font-weight: 700; color: #334155; text-align: center; }
    .signatures { display: table; width: 100%; margin-top: 40px; }
    .sig-block { display: table-cell; width: 50%; text-align: center; font-size: 12px; }
    .sig-line { margin-bottom: 6px; color: #64748b; }
    .sig-title { font-weight: 600; color: #334155; }
    .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 10px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🐷 รายงานสารสนเทศยอดเงินออมสะสม ธนาคารพอเพียง (ทุกห้องเรียน)</h1>
    <div class="subtitle">โรงเรียนบ้านคำไผ่ · รายงานข้อมูลสำรองอัตโนมัติ ณ วันที่ ${todayStr}</div>
  </div>

  <div class="kpi-container">
    <div class="kpi-card">
      <div class="kpi-label">จำนวนผู้ออมทั้งหมด</div>
      <div class="kpi-value">${totalSavers}<span class="unit">คน</span></div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">ยอดเงินฝากรวม</div>
      <div class="kpi-value">${totalDeposits.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<span class="unit">฿</span></div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">ยอดเงินถอนรวม</div>
      <div class="kpi-value">${totalWithdrawals.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<span class="unit">฿</span></div>
    </div>
    <div class="kpi-card hero">
      <div class="kpi-label" style="color: #92400e;">ยอดเงินออมคงเหลือสุทธิ</div>
      <div class="kpi-value" style="color: #92400e;">${totalBalance.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<span class="unit" style="color: #92400e;">฿</span></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 40px; border: 1px solid #cbd5e1; padding: 8px;">ลำดับ</th>
        <th style="width: 90px; border: 1px solid #cbd5e1; padding: 8px;">รหัสนักเรียน</th>
        <th style="border: 1px solid #cbd5e1; padding: 8px;">ชื่อ-นามสกุล</th>
        <th style="width: 70px; border: 1px solid #cbd5e1; padding: 8px;">ชั้นเรียน</th>
        <th style="width: 110px; border: 1px solid #cbd5e1; padding: 8px;">ยอดฝากรวม (บาท)</th>
        <th style="width: 110px; border: 1px solid #cbd5e1; padding: 8px;">ยอดถอนรวม (บาท)</th>
        <th style="width: 120px; border: 1px solid #cbd5e1; padding: 8px;">ยอดคงเหลือสุทธิ (บาท)</th>
        <th style="width: 80px; border: 1px solid #cbd5e1; padding: 8px;">จำนวนธุรกรรม</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="signatures">
    <div class="sig-block">
      <div class="sig-line">ลงชื่อ............................................................ ผู้จัดทำรายงาน</div>
      <div class="sig-title">(ครูผู้บันทึกข้อมูล)</div>
    </div>
    <div class="sig-block">
      <div class="sig-line">ลงชื่อ............................................................ ผู้อนุมัติรายงาน</div>
      <div class="sig-title">(ผู้อำนวยการโรงเรียนบ้านคำไผ่)</div>
    </div>
  </div>

  <div class="footer">
    พิมพ์ด้วยระบบอัตโนมัติธนาคารพอเพียง · ส่งเมื่อ: ${new Date().toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'medium' })} น.
  </div>
</body>
</html>`;

    // 6. Trigger Resend API to send the email with attachment
    const base64Csv = toBase64(csvContent);
    const dateStamp = new Date().toISOString().split('T')[0];

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: `🐷 [ธนาคารพอเพียง] รายงานสารสนเทศและไฟล์สำรองข้อมูลอัตโนมัติ — ประจำวันที่ ${todayStr}`,
        html: emailHtml,
        attachments: [
          {
            filename: `สำรองยอดฝากสะสมธนาคารพอเพียง_${dateStamp}.csv`,
            content: base64Csv,
          }
        ]
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(result)}`);
    }

    return json({ success: true, message: 'ส่งรายงานสำรองข้อมูลอัตโนมัติเรียบร้อยแล้ว', result });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
