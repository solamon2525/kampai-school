import { formatThaiDateFull, formatThaiDateRange } from '@/lib/thaiDate';

interface ResearchStudentRow {
    name: string;
    studentCode: string | null;
    classNumber: number | null;
    pretestMean: number | null;
    posttestMean: number | null;
    gain: number | null;
}

interface ResearchStats {
    n: number;
    meanPretest: number;
    meanPosttest: number;
    meanGain: number;
    sdPretest: number;
    sdPosttest: number;
    percentImproved: number;
}

interface SchoolInfo {
    name: string;
    logoUrl?: string | null;
    academicYear: string;
}

export interface ClassroomResearchDocInput {
    title: string;
    problemStatement: string;
    objectives: string[];
    conclusion: string;
    teacherName: string;
    className: string;
    gameTitle: string;
    pretestRange: { start: string; end: string };
    posttestRange: { start: string; end: string };
    rows: ResearchStudentRow[];
    stats: ResearchStats;
    school: SchoolInfo;
}

/**
 * printClassroomResearchDoc — เปิด window ใหม่พิมพ์ A4 ของวิจัยในชั้นเรียน 5 บท
 * รูปแบบ: ใช้ print-to-PDF ของเบราว์เซอร์ (เหมือน printTranscript ใน TrainingTranscriptPDF.tsx)
 */
export function printClassroomResearchDoc(input: ClassroomResearchDocInput) {
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;

    const today = formatThaiDateFull(new Date().toISOString().split('T')[0]);
    const pretestLabel = formatThaiDateRange(input.pretestRange.start, input.pretestRange.end);
    const posttestLabel = formatThaiDateRange(input.posttestRange.start, input.posttestRange.end);

    const objectivesHtml = input.objectives
        .map((o, i) => `<li>${o}</li>`)
        .join('');

    const rowsHtml = input.rows
        .map((r, i) => {
            const hasBoth = r.pretestMean !== null && r.posttestMean !== null;
            const gainText = hasBoth
                ? `${r.gain! >= 0 ? '+' : ''}${r.gain!.toFixed(1)}`
                : '—';
            return `
            <tr>
                <td class="num">${i + 1}</td>
                <td class="ctr">${r.classNumber ?? '-'}</td>
                <td>${r.name}</td>
                <td class="ctr num">${r.pretestMean !== null ? r.pretestMean.toFixed(1) : '—'}</td>
                <td class="ctr num">${r.posttestMean !== null ? r.posttestMean.toFixed(1) : '—'}</td>
                <td class="ctr num">${gainText}</td>
            </tr>`;
        })
        .join('');

    const paragraphsHtml = (text: string) =>
        text
            .split('\n')
            .map((p) => p.trim())
            .filter(Boolean)
            .map((p) => `<p>${p}</p>`)
            .join('') || '<p style="color:#94a3b8;">(ยังไม่ได้กรอก)</p>';

    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
    <title>วิจัยในชั้นเรียน — ${input.title || 'ไม่มีชื่อเรื่อง'}</title>
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
      *{margin:0;padding:0;box-sizing:border-box;}
      body{font-family:'Sarabun',sans-serif;background:white;color:#111;padding:24px;font-size:13px;line-height:1.65;}
      @page{size:A4 portrait;margin:16mm;}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;padding:0;} .page-break{page-break-before:always;}}

      .cover{text-align:center;padding:80px 20px 40px;}
      .cover .school{font-size:14px;color:#64748b;margin-bottom:40px;}
      .cover h1{font-size:24px;font-weight:700;color:#0f172a;margin:0 auto 60px;max-width:480px;}
      .cover .meta{font-size:13px;color:#334155;margin-top:8px;}
      .cover .meta b{color:#0f172a;}

      .chapter{margin-top:18px;}
      .chapter h2{font-size:16px;font-weight:700;color:#0f172a;border-bottom:2px solid #0f172a;padding-bottom:6px;margin-bottom:12px;}
      .chapter p{margin-bottom:8px;color:#1e293b;}
      .chapter ol{margin:8px 0 8px 22px;color:#1e293b;}
      .chapter ol li{margin-bottom:4px;}

      .meta-box{background:#f8fafc;border-left:3px solid #7c3aed;padding:10px 14px;border-radius:4px;margin-bottom:14px;font-size:12px;}
      .meta-box .row{display:flex;gap:8px;margin-bottom:3px;}
      .meta-box .row .label{color:#64748b;min-width:130px;}
      .meta-box .row .value{color:#0f172a;font-weight:600;}

      .summary{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:16px;}
      .summary .box{border:1px solid #e2e8f0;border-radius:6px;padding:8px 10px;text-align:center;}
      .summary .box .label{font-size:9.5px;color:#64748b;font-weight:500;}
      .summary .box .value{font-size:16px;color:#0f172a;font-weight:700;margin-top:2px;}

      table{width:100%;border-collapse:collapse;margin-bottom:16px;}
      th{background:#0f172a;color:white;font-weight:600;padding:7px 6px;font-size:11px;text-align:left;border:1px solid #0f172a;}
      td{padding:5px 6px;font-size:11px;border:1px solid #e2e8f0;vertical-align:top;}
      td.ctr,th.ctr{text-align:center;}
      td.num,th.num{text-align:right;font-variant-numeric:tabular-nums;}
      tr:nth-child(even) td{background:#f8fafc;}

      .signoff{display:grid;grid-template-columns:1fr 1fr;gap:60px;margin-top:36px;font-size:11px;}
      .signoff .slot{text-align:center;}
      .signoff .line{border-top:1px solid #94a3b8;padding-top:6px;color:#64748b;}
      .signoff .role{font-weight:600;color:#0f172a;margin-top:14px;}

      .footer{margin-top:24px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:9px;color:#94a3b8;text-align:center;}
    </style></head><body>

        <div class="cover">
            ${input.school.logoUrl ? `<img src="${input.school.logoUrl}" alt="logo" style="width:72px;height:72px;object-fit:contain;margin-bottom:14px;"/>` : ''}
            <div class="school">${input.school.name} · ปีการศึกษา ${input.school.academicYear}</div>
            <h1>${input.title || '(ยังไม่ได้กรอกชื่อเรื่องวิจัย)'}</h1>
            <div class="meta">ผู้วิจัย <b>${input.teacherName}</b></div>
            <div class="meta">ชั้นเรียน <b>${input.className}</b> · เครื่องมือที่ใช้ <b>${input.gameTitle}</b></div>
            <div class="meta" style="margin-top:30px;color:#94a3b8;">จัดทำเมื่อ ${today}</div>
        </div>

        <div class="page-break"></div>

        <div class="chapter">
            <h2>บทที่ 1 ความสำคัญและที่มาของปัญหา</h2>
            ${paragraphsHtml(input.problemStatement)}
        </div>

        <div class="chapter">
            <h2>บทที่ 2 วัตถุประสงค์ของการวิจัย</h2>
            ${input.objectives.length > 0
                ? `<ol>${objectivesHtml}</ol>`
                : '<p style="color:#94a3b8;">(ยังไม่ได้กรอก)</p>'}
        </div>

        <div class="chapter">
            <h2>บทที่ 3 วิธีดำเนินการวิจัย</h2>
            <div class="meta-box">
                <div class="row"><span class="label">เครื่องมือที่ใช้ในการวิจัย</span><span class="value">เกมการศึกษา "${input.gameTitle}" (Kampai SDK)</span></div>
                <div class="row"><span class="label">กลุ่มเป้าหมาย</span><span class="value">นักเรียนชั้น ${input.className} จำนวน ${input.stats.n} คน (ที่มีข้อมูลครบทั้งก่อนและหลัง)</span></div>
                <div class="row"><span class="label">ช่วงเวลาเก็บข้อมูลก่อนเรียน</span><span class="value">${pretestLabel}</span></div>
                <div class="row"><span class="label">ช่วงเวลาเก็บข้อมูลหลังเรียน</span><span class="value">${posttestLabel}</span></div>
                <div class="row"><span class="label">วิธีเก็บข้อมูล</span><span class="value">ระบบบันทึกคะแนนการเล่นเกมอัตโนมัติของ Kampai School (เฉลี่ยคะแนนรายบุคคลในแต่ละช่วง)</span></div>
            </div>
        </div>

        <div class="page-break"></div>

        <div class="chapter">
            <h2>บทที่ 4 ผลการวิจัย</h2>
            <div class="summary">
                <div class="box"><div class="label">คะแนนเฉลี่ยก่อนเรียน</div><div class="value">${input.stats.meanPretest.toFixed(1)}</div></div>
                <div class="box"><div class="label">คะแนนเฉลี่ยหลังเรียน</div><div class="value">${input.stats.meanPosttest.toFixed(1)}</div></div>
                <div class="box"><div class="label">ผลต่างเฉลี่ย</div><div class="value">${input.stats.meanGain >= 0 ? '+' : ''}${input.stats.meanGain.toFixed(1)}</div></div>
                <div class="box"><div class="label">% นักเรียนที่ดีขึ้น</div><div class="value">${input.stats.percentImproved.toFixed(0)}%</div></div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th class="ctr" style="width:26px;">#</th>
                        <th class="ctr" style="width:40px;">เลขที่</th>
                        <th>ชื่อ-สกุล</th>
                        <th class="ctr num" style="width:90px;">ก่อนเรียน</th>
                        <th class="ctr num" style="width:90px;">หลังเรียน</th>
                        <th class="ctr num" style="width:80px;">ผลต่าง</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml || '<tr><td colspan="6" style="text-align:center;padding:20px;color:#94a3b8;">ไม่มีข้อมูล</td></tr>'}
                </tbody>
            </table>
            <p style="font-size:11px;color:#64748b;">ส่วนเบี่ยงเบนมาตรฐาน: ก่อนเรียน ${input.stats.sdPretest.toFixed(1)} · หลังเรียน ${input.stats.sdPosttest.toFixed(1)} (n=${input.stats.n})</p>
        </div>

        <div class="chapter">
            <h2>บทที่ 5 สรุปและข้อเสนอแนะ</h2>
            ${paragraphsHtml(input.conclusion)}
        </div>

        <div class="signoff">
            <div class="slot">
                <div class="line">ลงชื่อ</div>
                <div class="role">ผู้วิจัย / ครูผู้สอน</div>
            </div>
            <div class="slot">
                <div class="line">ลงชื่อ</div>
                <div class="role">ผู้อำนวยการสถานศึกษา</div>
            </div>
        </div>

        <div class="footer">
            เอกสารฉบับนี้สร้างจากข้อมูลการเล่นเกมจริงของระบบ ${input.school.name} เพื่อใช้ประกอบการทำวิจัยในชั้นเรียน — กรุณาตรวจทานความถูกต้องก่อนใช้งานจริง
        </div>
    </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 500);
}
