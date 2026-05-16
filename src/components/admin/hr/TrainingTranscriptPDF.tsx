import type { TrainingRecord } from '@/services/training.service';

interface TranscriptStaff {
    id: string;
    name: string;
    position: string | null;
    photo_url?: string | null;
}

interface SchoolInfo {
    name: string;
    logo_url?: string | null;
    academic_year?: string | null;
}

const formatThaiDate = (iso: string) => {
    try {
        const d = new Date(iso);
        return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return iso;
    }
};

/**
 * printTranscript — เปิด window ใหม่พิมพ์ A4 ของรายการอบรมรายบุคคล
 * รูปแบบ: ใช้สำหรับยื่นเอกสาร ก.ค.ศ. / นำเสนอ supervisor
 */
export function printTranscript(
    staff: TranscriptStaff,
    records: TrainingRecord[],
    school: SchoolInfo,
) {
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;

    const totalHours = records.reduce((sum, r) => sum + Number(r.hours || 0), 0);
    const totalBudget = records.reduce((sum, r) => sum + Number(r.budget || 0), 0);
    const today = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

    const rowsHtml = records
        .filter((r) => r.status === 'ผ่านการอบรม')
        .map((r, i) => `
            <tr>
                <td class="num">${i + 1}</td>
                <td>${r.course_name}</td>
                <td>${r.provider || '-'}</td>
                <td class="ctr">${r.training_type}</td>
                <td class="ctr">${formatThaiDate(r.start_date)}</td>
                <td class="ctr num">${r.hours}</td>
                <td class="ctr num">${Number(r.budget || 0).toLocaleString('th-TH')}</td>
            </tr>
        `).join('');

    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
    <title>เอกสารยืนยันการพัฒนาตนเอง — ${staff.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
      *{margin:0;padding:0;box-sizing:border-box;}
      body{font-family:'Sarabun',sans-serif;background:white;color:#111;padding:24px;font-size:13px;line-height:1.5;}
      @page{size:A4 portrait;margin:14mm;}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;padding:0;}}
      .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0f172a;padding-bottom:14px;margin-bottom:18px;}
      .header-left{display:flex;gap:14px;align-items:center;}
      .header-left img{width:64px;height:64px;object-fit:contain;}
      .header h1{font-size:18px;font-weight:700;color:#0f172a;}
      .header .school-meta{font-size:11px;color:#64748b;margin-top:2px;}
      .header-right{text-align:right;font-size:10px;color:#64748b;}
      .header-right .ref{font-weight:600;color:#0f172a;font-size:11px;}

      .title{text-align:center;margin:8px 0 18px;}
      .title h2{font-size:20px;font-weight:700;color:#0f172a;}
      .title p{font-size:12px;color:#64748b;margin-top:4px;}

      .summary{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:18px;}
      .summary .box{border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;text-align:center;}
      .summary .box .label{font-size:10px;color:#64748b;font-weight:500;}
      .summary .box .value{font-size:18px;color:#0f172a;font-weight:700;margin-top:2px;}

      .staff-box{background:#f8fafc;border-left:3px solid #7c3aed;padding:10px 14px;border-radius:4px;margin-bottom:14px;}
      .staff-box .name{font-size:16px;font-weight:700;color:#0f172a;}
      .staff-box .position{font-size:11px;color:#64748b;margin-top:2px;}

      table{width:100%;border-collapse:collapse;margin-bottom:16px;}
      th{background:#0f172a;color:white;font-weight:600;padding:8px 6px;font-size:11px;text-align:left;border:1px solid #0f172a;}
      td{padding:6px;font-size:11px;border:1px solid #e2e8f0;vertical-align:top;}
      td.ctr,th.ctr{text-align:center;}
      td.num,th.num{text-align:right;font-variant-numeric:tabular-nums;}
      tr:nth-child(even) td{background:#f8fafc;}

      .totals{display:flex;justify-content:flex-end;gap:24px;margin-bottom:18px;font-size:12px;font-weight:600;}
      .totals .item{color:#0f172a;}
      .totals .item .label{color:#64748b;font-weight:500;margin-right:6px;}

      .signoff{display:grid;grid-template-columns:1fr 1fr;gap:60px;margin-top:32px;font-size:11px;}
      .signoff .slot{text-align:center;}
      .signoff .line{border-top:1px solid #94a3b8;padding-top:6px;color:#64748b;}
      .signoff .role{font-weight:600;color:#0f172a;margin-top:14px;}

      .footer{margin-top:24px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:9px;color:#94a3b8;text-align:center;}
      .footer .qr{margin-top:4px;}
    </style></head><body>
        <div class="header">
            <div class="header-left">
                ${school.logo_url ? `<img src="${school.logo_url}" alt="logo"/>` : ''}
                <div>
                    <h1>${school.name}</h1>
                    <div class="school-meta">เอกสารยืนยันการพัฒนาตนเอง (Faculty Development Transcript)${school.academic_year ? ` · ปีการศึกษา ${school.academic_year}` : ''}</div>
                </div>
            </div>
            <div class="header-right">
                <div class="ref">เลขที่อ้างอิง</div>
                <div>FDR-${staff.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase().slice(-4)}</div>
                <div style="margin-top:6px;">ออกเมื่อ ${today}</div>
            </div>
        </div>

        <div class="title">
            <h2>สรุปการพัฒนาบุคลากร</h2>
            <p>รายการอบรม / สัมมนา / ศึกษาดูงาน ที่ผ่านการรับรอง</p>
        </div>

        <div class="staff-box">
            <div class="name">${staff.name}</div>
            <div class="position">${staff.position || 'บุคลากรของโรงเรียน'}</div>
        </div>

        <div class="summary">
            <div class="box">
                <div class="label">จำนวนรายการ</div>
                <div class="value">${records.filter(r => r.status === 'ผ่านการอบรม').length}</div>
            </div>
            <div class="box">
                <div class="label">ชั่วโมงรวม</div>
                <div class="value">${totalHours.toLocaleString('th-TH')}</div>
            </div>
            <div class="box">
                <div class="label">งบประมาณ (บาท)</div>
                <div class="value">${totalBudget.toLocaleString('th-TH')}</div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th class="ctr" style="width:30px;">#</th>
                    <th>หลักสูตร</th>
                    <th style="width:140px;">หน่วยงาน</th>
                    <th class="ctr" style="width:80px;">ประเภท</th>
                    <th class="ctr" style="width:80px;">วันที่</th>
                    <th class="ctr num" style="width:50px;">ชม.</th>
                    <th class="ctr num" style="width:70px;">งบ (บาท)</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml || '<tr><td colspan="7" style="text-align:center;padding:20px;color:#94a3b8;">ยังไม่มีรายการที่ผ่านการอบรม</td></tr>'}
            </tbody>
        </table>

        <div class="totals">
            <div class="item"><span class="label">ชั่วโมงรวมทั้งสิ้น</span>${totalHours.toLocaleString('th-TH')} ชม.</div>
            <div class="item"><span class="label">งบประมาณรวม</span>${totalBudget.toLocaleString('th-TH')} บาท</div>
        </div>

        <div class="signoff">
            <div class="slot">
                <div class="line">ลงชื่อ</div>
                <div class="role">บุคลากร / ผู้รับการอบรม</div>
            </div>
            <div class="slot">
                <div class="line">ลงชื่อ</div>
                <div class="role">ผู้อำนวยการสถานศึกษา</div>
            </div>
        </div>

        <div class="footer">
            เอกสารฉบับนี้ออกโดยระบบของ ${school.name} เพื่อใช้ประกอบการประเมินผลการพัฒนาตนเอง (ก.ค.ศ.) ไม่ใช่เอกสารทางราชการต้นฉบับ
        </div>
    </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 500);
}
