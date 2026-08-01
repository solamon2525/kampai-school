/**
 * Minimal DOCX export for Digital Ops reduce-workload report.
 * Uses same store-only ZIP approach as classroomResearchDocx.
 */
import { downloadBlob } from '@/lib/download';

export type DigitalOpsReportPayload = {
  schoolName: string;
  fiscalYearBe: number;
  generatedAt: string;
  kpi: {
    digitalSystemsInUse: number;
    leaveRequests: number;
    letters: number;
    teacherUploaders: number;
    homeworkSubmissions: number;
    surveyResponses: number;
    avgTimeSavedPct: number | null;
    adoptionPct: number;
    activeTeachers: number;
    staffTotal: number;
    sinceDays: number;
  };
  baselines: Array<{
    workflow_label: string;
    minutes_before: number;
    minutes_after: number;
  }>;
  models: Array<{ name: string; badges: string[]; score: number }>;
};

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const PKG_NS = 'http://schemas.openxmlformats.org/package/2006/content-types';

const utf8 = (s: string) => new TextEncoder().encode(s);
const u16 = (n: number) => {
  const b = new Uint8Array(2);
  new DataView(b.buffer).setUint16(0, n, true);
  return b;
};
const u32 = (n: number) => {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n, true);
  return b;
};
const concatBytes = (parts: Uint8Array[]) => {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
};

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

const crc32 = (bytes: Uint8Array) => {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) c = crcTable[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const zipFiles = (entries: { name: string; data: Uint8Array }[]) => {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;
  for (const entry of entries) {
    const nameBytes = utf8(entry.name);
    const data = entry.data;
    const crc = crc32(data);
    const localHeader = concatBytes([
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0), nameBytes,
    ]);
    localParts.push(localHeader, data);
    centralParts.push(concatBytes([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length),
      u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), nameBytes,
    ]));
    offset += localHeader.length + data.length;
  }
  const centralDirectory = concatBytes(centralParts);
  return concatBytes([
    ...localParts,
    centralDirectory,
    concatBytes([
      u32(0x06054b50), u16(0), u16(0), u16(entries.length), u16(entries.length),
      u32(centralDirectory.length), u32(offset), u16(0),
    ]),
  ]);
};

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const p = (text: string, opts?: { bold?: boolean; size?: number }) => {
  const size = opts?.size ?? 28;
  const bold = opts?.bold ? '<w:b/>' : '';
  return `<w:p><w:pPr><w:spacing w:after="120"/></w:pPr><w:r><w:rPr>${bold}<w:sz w:val="${size}"/><w:szCs w:val="${size}"/><w:rFonts w:ascii="TH Sarabun New" w:hAnsi="TH Sarabun New"/></w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
};

function buildDocumentXml(data: DigitalOpsReportPayload) {
  const { kpi } = data;
  const baselineLines = data.baselines.length
    ? data.baselines
        .map((b) => {
          const pct =
            Number(b.minutes_before) > 0
              ? Math.round((1 - Number(b.minutes_after) / Number(b.minutes_before)) * 100)
              : 0;
          return p(`• ${b.workflow_label}: ${b.minutes_before} → ${b.minutes_after} นาที (−${pct}%)`);
        })
        .join('')
    : p('• ยังไม่มีข้อมูล baseline');

  const modelLines = data.models.length
    ? data.models
        .map((m, i) => p(`${i + 1}. ${m.name} — ${m.badges.join(', ')} (คะแนน ${m.score})`))
        .join('')
    : p('• ยังไม่มีข้อมูล adoption');

  const body = [
    p('รายงานผลการดำเนินงานลดภาระงานครูของสถานศึกษา', { bold: true, size: 36 }),
    p('ด้วยนวัตกรรม และ/หรือ เทคโนโลยีดิจิทัล', { bold: true, size: 32 }),
    p(`ประจำปีงบประมาณ ${data.fiscalYearBe}`),
    p(data.schoolName, { bold: true }),
    p('ชื่อผลงาน Kampai Smart Office — ปรับกระบวนการ พลิกงานเอกสาร สู่ระบบดิจิทัล'),
    p('๑. หลักการและเหตุผล', { bold: true, size: 30 }),
    p('สถานศึกษานำนโยบายลดภาระงานครูของ สพฐ. มาสู่การปฏิบัติ โดยบูรณาการระบบดิจิทัลบนเว็บไซต์โรงเรียน เพื่อลดงานเอกสารซ้ำซ้อน คืนเวลาให้ครูจัดการเรียนรู้และดูแลผู้เรียน'),
    p('๒. วัตถุประสงค์', { bold: true, size: 30 }),
    p('๒.๑ พัฒนาระบบงานเอกสารและธุรการให้เป็น Digital Workflow'),
    p('๒.๒ ลดระยะเวลาและภาระงานเชิงธุรการของครู'),
    p('๒.๓ สร้างเสริมทักษะดิจิทัลและวัฒนธรรมองค์กรที่ยั่งยืน'),
    p('๓. เป้าหมายเชิงปริมาณ (สถานะปัจจุบัน)', { bold: true, size: 30 }),
    p(`• ระบบงานดิจิทัลหลัก: ${kpi.digitalSystemsInUse} ระบบ`),
    p(`• การลาออนไลน์ ${kpi.sinceDays} วัน: ${kpi.leaveRequests} รายการ`),
    p(`• หนังสือสารบรรณ ${kpi.sinceDays} วัน: ${kpi.letters} ฉบับ`),
    p(`• ครูอัปสื่อ: ${kpi.teacherUploaders} คน`),
    p(`• ครูที่มี adoption: ${kpi.activeTeachers}/${kpi.staffTotal} คน (${kpi.adoptionPct}%)`),
    p(`• ส่งงานการบ้าน: ${kpi.homeworkSubmissions} ชิ้น`),
    p(`• ความพึงพอใจ: ${kpi.surveyResponses} ตอบกลับ`),
    p(`• เวลาเฉลี่ยที่ลดได้: ${kpi.avgTimeSavedPct != null ? `${kpi.avgTimeSavedPct}%` : 'ยังไม่บันทึก'}`),
    p('๔. วิธีการดำเนินงาน (PDCA)', { bold: true, size: 30 }),
    p('Plan → Do (5 ระบบงาน) → Check (Digital Ops + แบบสำรวจ) → Act (Role Model / PLC)'),
    p('๕. ตัวชี้วัด Time-Saving', { bold: true, size: 30 }),
    baselineLines,
    p('๖. Digital Role Model', { bold: true, size: 30 }),
    modelLines,
    p('๗. การเผยแพร่', { bold: true, size: 30 }),
    p('เผยแพร่ผ่านเว็บไซต์โรงเรียน เพจเฟซบุ๊ก และ LINE ผู้ปกครอง'),
    p(`สร้างอัตโนมัติจากระบบเมื่อ ${data.generatedAt}`),
  ].join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${WORD_NS}">
  <w:body>
    ${body}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

export function downloadDigitalOpsReportDocx(data: DigitalOpsReportPayload) {
  const files = [
    {
      name: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="${PKG_NS}">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
    },
    {
      name: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="${REL_NS}">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
    },
    { name: 'word/document.xml', content: buildDocumentXml(data) },
  ];
  const blob = new Blob(
    [zipFiles(files.map((f) => ({ name: f.name, data: utf8(f.content) })))],
    { type: DOCX_MIME },
  );
  downloadBlob(blob, `รายงานลดภาระครู-${new Date().toISOString().slice(0, 10)}.docx`);
}
