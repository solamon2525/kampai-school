/**
 * examDocxGenerator.ts
 * โมดูลส่งออกชุดข้อสอบเป็นไฟล์ Microsoft Word (.docx) มาตรฐานราชการ สพฐ.
 * ใช้ฟอนต์ TH Sarabun New, จัดหัวกระดาษตราโรงเรียน, ตารางกรอกชื่อนักเรียน, และเฉลยท้ายเล่ม
 * สร้างไฟล์ OpenXML DOCX โดยตรงแบบ Zero-Dependency (ต่อยอดจาก classroomResearchDocx)
 */

import type { ExamSetRow } from '@/services/exam.service';
import { generateExamVersion, type ExamQuestionInput } from '@/lib/exam/multiVersion';
import { downloadBlob } from '@/lib/download';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const PKG_NS = 'http://schemas.openxmlformats.org/package/2006/content-types';
const DOC_FONT = 'TH Sarabun New';
const A4_WIDTH = 11906; // dxa (210mm)
const A4_HEIGHT = 16838; // dxa (297mm)
const PAGE_MARGIN = 1440; // 1 inch (72pt = 1440 dxa)
const USABLE_WIDTH = A4_WIDTH - PAGE_MARGIN * 2;

type Align = 'left' | 'center' | 'right' | 'both';

type RunSpec = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  color?: string;
  size?: number; // pt
  font?: string;
  underline?: boolean;
};

type ParagraphSpec = {
  align?: Align;
  size?: number;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  before?: number;
  after?: number;
  line?: number;
  keepNext?: boolean;
  pageBreakBefore?: boolean;
};

const encoder = new TextEncoder();

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const hexColor = (value?: string) => (value ? value.replace('#', '').toUpperCase() : undefined);
const utf8 = (value: string) => encoder.encode(value);

const concatBytes = (parts: Uint8Array[]) => {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  parts.forEach((part) => {
    out.set(part, offset);
    offset += part.length;
  });
  return out;
};

const u16 = (value: number) => {
  const out = new Uint8Array(2);
  new DataView(out.buffer).setUint16(0, value, true);
  return out;
};

const u32 = (value: number) => {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, value >>> 0, true);
  return out;
};

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

const crc32 = (bytes: Uint8Array) => {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    c = crcTable[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
};

const zipFiles = (entries: { name: string; data: Uint8Array }[]) => {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  entries.forEach((entry) => {
    const nameBytes = utf8(entry.name);
    const data = entry.data;
    const crc = crc32(data);
    const localHeader = concatBytes([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(nameBytes.length),
      u16(0),
      nameBytes,
    ]);
    localParts.push(localHeader, data);

    const centralHeader = concatBytes([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(nameBytes.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      nameBytes,
    ]);
    centralParts.push(centralHeader);
    offset += localHeader.length + data.length;
  });

  const centralDirectory = concatBytes(centralParts);
  const endRecord = concatBytes([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(entries.length),
    u16(entries.length),
    u32(centralDirectory.length),
    u32(offset),
    u16(0),
  ]);

  return concatBytes([...localParts, centralDirectory, endRecord]);
};

const toPt = (sizePt: number) => Math.round(sizePt * 2);

function runXml(spec: RunSpec) {
  const pieces = [
    '<w:r>',
    '<w:rPr>',
    spec.font || spec.size || spec.bold || spec.italic || spec.color || spec.underline
      ? `<w:rFonts w:ascii="${spec.font ?? DOC_FONT}" w:hAnsi="${spec.font ?? DOC_FONT}" w:eastAsia="${spec.font ?? DOC_FONT}" w:cs="${spec.font ?? DOC_FONT}"/>`
      : '',
    spec.size ? `<w:sz w:val="${toPt(spec.size)}"/><w:szCs w:val="${toPt(spec.size)}"/>` : '',
    spec.color ? `<w:color w:val="${hexColor(spec.color)}"/>` : '',
    spec.bold ? '<w:b/><w:bCs/>' : '',
    spec.italic ? '<w:i/><w:iCs/>' : '',
    spec.underline ? '<w:u w:val="single"/>' : '',
    '</w:rPr>',
    `<w:t xml:space="preserve">${escapeXml(spec.text)}</w:t>`,
    '</w:r>',
  ];
  return pieces.join('');
}

function paragraphXml(runs: RunSpec[] | string, spec: ParagraphSpec = {}) {
  const runList = typeof runs === 'string' ? [{ text: runs, size: spec.size, color: spec.color, bold: spec.bold, italic: spec.italic }] : runs;
  const pPr = [
    spec.align ? `<w:jc w:val="${spec.align}"/>` : '',
    spec.keepNext ? '<w:keepNext/>' : '',
    spec.pageBreakBefore ? '<w:pageBreakBefore/>' : '',
    spec.before != null || spec.after != null || spec.line != null
      ? `<w:spacing${spec.before != null ? ` w:before="${spec.before}"` : ''}${spec.after != null ? ` w:after="${spec.after}"` : ''}${spec.line != null ? ` w:line="${spec.line}" w:lineRule="auto"` : ''}/>`
      : '',
  ].filter(Boolean).join('');

  return `<w:p>${pPr ? `<w:pPr>${pPr}</w:pPr>` : ''}${runList.map((run) => runXml({ font: DOC_FONT, size: spec.size ?? 14, color: spec.color, bold: spec.bold, italic: spec.italic, ...run })).join('')}</w:p>`;
}

const CHOICE_LABELS = ['ก', 'ข', 'ค', 'ง', 'จ', 'ฉ'];

export interface ExportExamDocxOptions {
  schoolName?: string;
  officeName?: string;
  version?: 'A' | 'B';
  includeAnswerKey?: boolean;
}

/**
 * สร้างไฟล์ Word (.docx) สำหรับชุดข้อสอบ
 */
export function generateExamDocxBlob(examSet: ExamSetRow, options: ExportExamDocxOptions = {}): Blob {
  const schoolName = options.schoolName || 'โรงเรียนบ้านคำไผ่';
  const officeName = options.officeName || 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษายโสธร เขต 1';
  const version = options.version || 'A';
  const includeAnswerKey = options.includeAnswerKey ?? true;

  const rawQuestions = Array.isArray(examSet.questions) ? (examSet.questions as ExamQuestionInput[]) : [];
  const versionData = generateExamVersion(rawQuestions, version, examSet.id || examSet.title);
  const questions = versionData.questions;

  const totalPoints = questions.reduce((sum, q: any) => {
    const pts = Number(q.points) > 0 ? Number(q.points) : (q.rubric?.full_score || 1);
    return sum + pts;
  }, 0) || questions.length;

  const bodyXml: string[] = [];

  // 1. Header (ตรา / ชื่อโรงเรียน / สำนักงานเขต)
  bodyXml.push(paragraphXml(schoolName, { align: 'center', size: 18, bold: true, after: 40 }));
  bodyXml.push(paragraphXml(officeName, { align: 'center', size: 13, color: '#4B5563', after: 80 }));
  bodyXml.push(
    paragraphXml(
      [
        { text: `แบบทดสอบวัดผลการเรียนรู้: ${examSet.title} `, bold: true, size: 16 },
        { text: `[${versionData.title}]`, bold: true, size: 14, color: '#047857' },
      ],
      { align: 'center', after: 60 }
    )
  );

  // Subject and details
  bodyXml.push(
    paragraphXml(
      `กลุ่มสาระการเรียนรู้: ${examSet.subject}    ระดับชั้น: ${examSet.grade}    เวลาสอบ: ${examSet.time_limit_minutes} นาที    คะแนนเต็ม: ${totalPoints} คะแนน`,
      { align: 'center', size: 13, bold: true, after: 140 }
    )
  );

  // Student Box
  bodyXml.push(
    paragraphXml(
      'ชื่อ-นามสกุล: ............................................................................ ชั้น: .............. เลขที่: .......... ห้อง: ....... คะแนนที่ได้: [ ....... / ' +
        totalPoints +
        ' ]',
      { align: 'center', size: 13, before: 60, after: 120 }
    )
  );

  // Instructions
  bodyXml.push(
    paragraphXml(
      'คำชี้แจง: ให้นักเรียนเลือกคำตอบที่ถูกต้องที่สุดเพียงข้อเดียว แล้วทำเครื่องหมายลงในกระดาษคำตอบ หรือทำในแบบทดสอบตามที่ระบุ',
      { align: 'left', size: 12, italic: true, color: '#374151', before: 60, after: 160 }
    )
  );

  // Horizontal divider
  bodyXml.push(
    `<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="9CA3AF"/></w:pBdr></w:pPr></w:p>`
  );

  // 2. Questions List
  questions.forEach((q, idx) => {
    const qNum = idx + 1;
    const qType = q.question_type || q.type || 'mcq';
    const text = q.question_text || q.question || '';
    const pts = Number(q.points) > 0
      ? Number(q.points)
      : (qType === 'essay' ? ((q.rubric as any)?.full_score || 5) : (qType === 'fillin' ? 2 : 1));

    const stemRuns: RunSpec[] = [
      { text: `${qNum}. `, bold: true, size: 14 },
      { text, size: 14 },
      { text: ` (${pts} คะแนน)`, italic: true, size: 12, color: '#4B5563' },
    ];

    if (q.indicator_code) {
      stemRuns.push({ text: ` [ตัวชี้วัด: ${q.indicator_code}]`, size: 11, color: '#6B7280' });
    }

    if (q.media_title) {
      stemRuns.push({ text: ` (สื่อประกอบ: ${q.media_title})`, italic: true, size: 11, color: '#2563EB' });
    }

    // Question Stem
    bodyXml.push(
      paragraphXml(stemRuns, { align: 'left', before: 100, after: 40 })
    );

    // MCQ Choices
    if (qType === 'mcq' && Array.isArray(q.options)) {
      const opts = q.options;
      if (opts.length === 4) {
        // Line 1: ก and ข
        bodyXml.push(
          paragraphXml(
            [
              { text: `    ก. ${opts[0]}`, size: 13 },
              { text: `            ข. ${opts[1]}`, size: 13 },
            ],
            { align: 'left', after: 20 }
          )
        );
        // Line 2: ค and ง
        bodyXml.push(
          paragraphXml(
            [
              { text: `    ค. ${opts[2]}`, size: 13 },
              { text: `            ง. ${opts[3]}`, size: 13 },
            ],
            { align: 'left', after: 60 }
          )
        );
      } else {
        opts.forEach((opt, oIdx) => {
          const label = CHOICE_LABELS[oIdx] || `${oIdx + 1}`;
          bodyXml.push(
            paragraphXml(`    ${label}. ${opt}`, { align: 'left', size: 13, after: 20 })
          );
        });
      }
    } else if (qType === 'truefalse') {
      bodyXml.push(
        paragraphXml('    [   ] ถูก (True)          [   ] ผิด (False)', {
          align: 'left',
          size: 13,
          after: 60,
        })
      );
    } else if (qType === 'fillin') {
      bodyXml.push(
        paragraphXml('    ตอบ: ......................................................................................................................', {
          align: 'left',
          size: 13,
          after: 60,
        })
      );
    } else if (qType === 'essay') {
      const fullScore = (q.rubric as any)?.full_score || 5;
      bodyXml.push(
        paragraphXml(`    (แสดงวิธีทำหรือเขียนอธิบายเหตุผลอย่างละเอียด · คะแนนเต็ม ${fullScore} คะแนน)`, {
          align: 'left',
          size: 12,
          italic: true,
          color: '#4B5563',
          after: 30,
        })
      );
      bodyXml.push(
        paragraphXml('    ....................................................................................................................................................', {
          align: 'left',
          size: 13,
          after: 30,
        })
      );
      bodyXml.push(
        paragraphXml('    ....................................................................................................................................................', {
          align: 'left',
          size: 13,
          after: 30,
        })
      );
      bodyXml.push(
        paragraphXml('    ....................................................................................................................................................', {
          align: 'left',
          size: 13,
          after: 60,
        })
      );
    } else if (qType === 'matching' && Array.isArray(q.pairs)) {
      q.pairs.forEach((p, pIdx) => {
        const rLabel = CHOICE_LABELS[pIdx] || `${pIdx + 1}`;
        bodyXml.push(
          paragraphXml(`    (${pIdx + 1}) ${p.left}    <--->    ${rLabel}. ${p.right}`, {
            align: 'left',
            size: 13,
            after: 20,
          })
        );
      });
    }
  });

  // Footer of Exam
  bodyXml.push(
    paragraphXml(`- สิ้นสุดแบบทดสอบ (${questions.length} ข้อ) -`, {
      align: 'center',
      size: 12,
      italic: true,
      color: '#6B7280',
      before: 180,
      after: 100,
    })
  );

  // 3. Optional Teacher Answer Key Page
  if (includeAnswerKey) {
    bodyXml.push(
      paragraphXml('เฉลยแบบทดสอบและคำอธิบาย (สำหรับครูผู้สอน)', {
        align: 'center',
        size: 16,
        bold: true,
        pageBreakBefore: true,
        after: 80,
      })
    );
    bodyXml.push(
      paragraphXml(`${examSet.title} [${versionData.title}] — จำนวน ${questions.length} ข้อ`, {
        align: 'center',
        size: 13,
        color: '#4B5563',
        after: 140,
      })
    );

    questions.forEach((q, idx) => {
      const qNum = idx + 1;
      const qType = q.question_type || q.type || 'mcq';

      let ansDisplay = '';
      if (qType === 'mcq') {
        const ansIdx = Number(q.answer);
        const ansLabel = CHOICE_LABELS[ansIdx] || `${ansIdx + 1}`;
        const optText = Array.isArray(q.options) && q.options[ansIdx] ? q.options[ansIdx] : '';
        ansDisplay = `ตอบ ${ansLabel}. ${optText}`;
      } else if (qType === 'truefalse') {
        ansDisplay = `ตอบ ${q.answer ? 'ถูก (True)' : 'ผิด (False)'}`;
      } else if (qType === 'fillin') {
        const alts = Array.isArray(q.accepted_answers) && q.accepted_answers.length > 0 
          ? ` (ยอมรับ: ${q.accepted_answers.join(', ')})` 
          : '';
        ansDisplay = `ตอบ: ${String(q.answer || '')}${alts}`;
      } else if (qType === 'essay') {
        const fullScore = (q.rubric as any)?.full_score || 5;
        const keySol = (q.rubric as any)?.key_solution || String(q.answer || '-');
        ansDisplay = `[อัตนัย เต็ม ${fullScore} คะแนน] แนวคำตอบ: ${keySol}`;
      } else {
        ansDisplay = `ตอบ: ${String(q.answer || '')}`;
      }

      const keyRuns: RunSpec[] = [
        { text: `ข้อ ${qNum}: `, bold: true, size: 13 },
        { text: ansDisplay, bold: true, size: 13, color: '#047857' },
      ];
      if (q.indicator_code) {
        keyRuns.push({ text: ` [${q.indicator_code}]`, size: 11, color: '#6B7280' });
      }

      bodyXml.push(
        paragraphXml(keyRuns, { align: 'left', before: 40, after: 20 })
      );

      if (q.explanation) {
        bodyXml.push(
          paragraphXml(`  • คำอธิบาย: ${q.explanation}`, {
            align: 'left',
            size: 12,
            italic: true,
            color: '#4B5563',
            after: 40,
          })
        );
      }
    });
  }

  // XML Documents Package
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="${PKG_NS}">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="${REL_NS}">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="${REL_NS}"/>`;

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${WORD_NS}">
  <w:body>
    ${bodyXml.join('')}
    <w:sectPr>
      <w:pgSz w:w="${A4_WIDTH}" w:h="${A4_HEIGHT}"/>
      <w:pgMar w:top="${PAGE_MARGIN}" w:right="${PAGE_MARGIN}" w:bottom="${PAGE_MARGIN}" w:left="${PAGE_MARGIN}" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const zipData = zipFiles([
    { name: '[Content_Types].xml', data: utf8(contentTypesXml) },
    { name: '_rels/.rels', data: utf8(rootRelsXml) },
    { name: 'word/_rels/document.xml.rels', data: utf8(docRelsXml) },
    { name: 'word/document.xml', data: utf8(documentXml) },
  ]);

  return new Blob([zipData], { type: DOCX_MIME });
}

/**
 * ดาวน์โหลดชุดข้อสอบเป็นไฟล์ .docx ลงเครื่องของผู้ใช้
 */
export function downloadExamDocx(examSet: ExamSetRow, options: ExportExamDocxOptions = {}) {
  const version = options.version || 'A';
  const blob = generateExamDocxBlob(examSet, options);
  const cleanTitle = (examSet.title || 'แบบทดสอบ').replace(/[\\/:*?"<>|]+/g, '_');
  const filename = `${cleanTitle}_Form_${version}.docx`;
  downloadBlob(blob, filename);
}
