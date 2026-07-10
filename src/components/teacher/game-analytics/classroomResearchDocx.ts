import type { ClassroomResearchDocInput } from './printClassroomResearchDoc';
import { formatThaiDateFull, formatThaiDateMedium, formatThaiDateRange } from '@/lib/thaiDate';
import { researchPhaseLabel } from '@/services/game-research.service';
import { downloadBlob } from '@/lib/download';

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const PKG_NS = 'http://schemas.openxmlformats.org/package/2006/content-types';
const DOC_FONT = 'TH Sarabun New';
const A4_WIDTH = 11906;
const A4_HEIGHT = 16838;
const PAGE_MARGIN = 1440;
const USABLE_WIDTH = A4_WIDTH - PAGE_MARGIN * 2;

type Align = 'left' | 'center' | 'right' | 'justify';

type RunSpec = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  color?: string;
  size?: number;
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
  numId?: number;
  ilvl?: number;
  indentLeft?: number;
  hanging?: number;
};

type TableRowSpec = {
  cells: string[];
  header?: boolean;
  align?: Align[];
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

const fileBlob = (files: { name: string; content: string }[]) =>
  new Blob(
    [
      zipFiles(
        files.map((file) => ({
          name: file.name,
          data: utf8(file.content),
        })),
      ),
    ],
    { type: DOCX_MIME },
  );

const fileNameSafe = (value: string) =>
  value
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80) || 'classroom-research';

const toPt = (sizePt: number) => Math.round(sizePt * 2);

function runXml(spec: RunSpec) {
  const pieces = [
    '<w:r>',
    '<w:rPr>',
    spec.font || spec.size || spec.bold || spec.italic || spec.color || spec.underline
      ? `<w:rFonts w:ascii="${spec.font ?? DOC_FONT}" w:hAnsi="${spec.font ?? DOC_FONT}" w:eastAsia="${spec.font ?? DOC_FONT}"/>`
      : '',
    spec.size ? `<w:sz w:val="${toPt(spec.size)}"/><w:szCs w:val="${toPt(spec.size)}"/>` : '',
    spec.color ? `<w:color w:val="${hexColor(spec.color)}"/>` : '',
    spec.bold ? '<w:b/>' : '',
    spec.italic ? '<w:i/>' : '',
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
    spec.indentLeft != null || spec.hanging != null
      ? `<w:ind${spec.indentLeft != null ? ` w:left="${spec.indentLeft}"` : ''}${spec.hanging != null ? ` w:hanging="${spec.hanging}"` : ''}/>`
      : '',
    spec.numId != null
      ? `<w:numPr><w:ilvl w:val="${spec.ilvl ?? 0}"/><w:numId w:val="${spec.numId}"/></w:numPr>`
      : '',
  ].filter(Boolean).join('');

  return `<w:p>${pPr ? `<w:pPr>${pPr}</w:pPr>` : ''}${runList.map((run) => runXml({ font: DOC_FONT, size: spec.size, color: spec.color, bold: spec.bold, italic: spec.italic, ...run })).join('')}</w:p>`;
}

function headingXml(level: 1 | 2 | 3 | 4, text: string, pageBreakBefore = false) {
  const size = ({ 1: 18, 2: 16, 3: 14, 4: 13 } as const)[level];
  return paragraphXml(
    [{ text, size, bold: true, color: '#0F2744' }],
    {
      align: 'left',
      before: level === 1 ? 160 : 120,
      after: 90,
      keepNext: true,
      pageBreakBefore,
    },
  );
}

function titleParagraph(text: string) {
  return paragraphXml([{ text, size: 22, bold: true, color: '#0F2744' }], {
    align: 'center',
    before: 0,
    after: 120,
  });
}

function centeredMeta(text: string, size = 12) {
  return paragraphXml(text, {
    align: 'center',
    size,
    after: 60,
    line: 260,
  });
}

function normalParagraph(text: string, opts: ParagraphSpec = {}) {
  return paragraphXml(text, {
    size: opts.size ?? 11,
    align: opts.align ?? 'justify',
    before: opts.before ?? 0,
    after: opts.after ?? 90,
    line: opts.line ?? 260,
    color: opts.color,
    keepNext: opts.keepNext,
  });
}

function numberedParagraph(text: string, numId = 1, opts: ParagraphSpec = {}) {
  return paragraphXml(text, {
    size: opts.size ?? 11,
    align: opts.align ?? 'justify',
    before: opts.before ?? 0,
    after: opts.after ?? 60,
    line: opts.line ?? 260,
    numId,
    ilvl: opts.ilvl ?? 0,
    indentLeft: opts.indentLeft ?? 720,
    hanging: opts.hanging ?? 360,
  });
}

function pageBreak() {
  return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
}

function tableCellXml(
  text: string,
  width: number,
  opts: { header?: boolean; align?: Align; bold?: boolean; size?: number; shading?: string } = {},
) {
  const body = paragraphXml(text, {
    size: opts.size ?? 10.5,
    bold: opts.bold,
    align: opts.align ?? 'left',
    color: opts.header ? '#FFFFFF' : undefined,
    before: 0,
    after: 0,
    line: 240,
  });
  return `
    <w:tc>
      <w:tcPr>
        <w:tcW w:w="${width}" w:type="dxa"/>
        <w:vAlign w:val="center"/>
        <w:tcMar>
          <w:top w:w="72" w:type="dxa"/>
          <w:left w:w="96" w:type="dxa"/>
          <w:bottom w:w="72" w:type="dxa"/>
          <w:right w:w="96" w:type="dxa"/>
        </w:tcMar>
        ${opts.shading ? `<w:shd w:val="clear" w:color="auto" w:fill="${hexColor(opts.shading)}"/>` : ''}
      </w:tcPr>
      ${body}
    </w:tc>`;
}

function tableXml(rows: TableRowSpec[], widths: number[]) {
  const tableWidth = widths.reduce((sum, width) => sum + width, 0);
  const grid = widths.map((width) => `<w:gridCol w:w="${width}"/>`).join('');
  const body = rows
    .map((row) => {
      const cells = row.cells
        .map((cell, idx) =>
          tableCellXml(cell, widths[idx] ?? widths[widths.length - 1], {
            header: row.header,
            align: row.align?.[idx] ?? (idx === 0 ? 'left' : 'center'),
            bold: row.header,
            size: row.header ? 10.5 : 10.2,
            shading: row.header ? '#0F2744' : undefined,
          }),
        )
        .join('');
      return `
        <w:tr>
          ${row.header ? '<w:trPr><w:tblHeader w:val="true"/></w:trPr>' : ''}
          ${cells}
        </w:tr>`;
    })
    .join('');

  return `
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="${tableWidth}" w:type="dxa"/>
        <w:tblInd w:w="0" w:type="dxa"/>
        <w:tblLayout w:type="fixed"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="8" w:space="0" w:color="D1D5DB"/>
          <w:left w:val="single" w:sz="8" w:space="0" w:color="D1D5DB"/>
          <w:bottom w:val="single" w:sz="8" w:space="0" w:color="D1D5DB"/>
          <w:right w:val="single" w:sz="8" w:space="0" w:color="D1D5DB"/>
          <w:insideH w:val="single" w:sz="8" w:space="0" w:color="D1D5DB"/>
          <w:insideV w:val="single" w:sz="8" w:space="0" w:color="D1D5DB"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tblGrid>${grid}</w:tblGrid>
      ${body}
    </w:tbl>`;
}

function kvTable(rows: [string, string][], widths: [number, number]) {
  return tableXml(
    [
      { cells: ['รายการ', 'รายละเอียด'], header: true, align: ['center', 'center'] },
      ...rows.map(([a, b]) => ({ cells: [a, b], align: ['left', 'left'] })),
    ],
    widths,
  );
}

function listBlock(items: string[], numId = 1) {
  return items.map((item) => numberedParagraph(item, numId)).join('');
}

function defaultAbstract(input: ClassroomResearchDocInput) {
  const pre = formatThaiDateRange(input.pretestRange.start, input.pretestRange.end);
  const post = formatThaiDateRange(input.posttestRange.start, input.posttestRange.end);
  return `การวิจัยในชั้นเรียนครั้งนี้มีวัตถุประสงค์เพื่อศึกษาผลของการใช้เกมการศึกษา "${input.gameTitle}" กับนักเรียนชั้น ${input.className} จำนวน ${input.stats.n} คน โดยเปรียบเทียบคะแนนก่อนเรียนและหลังเรียนในช่วง ${pre} และ ${post} ผลการวิจัยพบว่าคะแนนเฉลี่ยหลังเรียนสูงกว่าก่อนเรียน ${input.stats.meanGain.toFixed(1)} คะแนน และมีนักเรียน ${input.stats.percentImproved.toFixed(0)}% ที่มีพัฒนาการดีขึ้น`;
}

function defaultProblem(input: ClassroomResearchDocInput) {
  return input.problemStatement?.trim() ||
    `การจัดการเรียนรู้เรื่อง ${input.gameTitle} ต้องอาศัยการฝึกซ้ำและการเห็นผลย้อนกลับอย่างต่อเนื่อง นักเรียนชั้น ${input.className} มักต้องการกิจกรรมที่ช่วยให้เห็นความก้าวหน้าของตนเองอย่างชัดเจน งานวิจัยในชั้นเรียนฉบับนี้จึงนำเกมการศึกษาในระบบ Kampai School มาใช้เป็นเครื่องมือหลักเพื่อศึกษาการเปลี่ยนแปลงของผลสัมฤทธิ์และความสม่ำเสมอของการฝึกฝน`;
}

function defaultObjectives(input: ClassroomResearchDocInput) {
  return input.objectives.length > 0
    ? input.objectives
    : [
        `เพื่อเปรียบเทียบผลสัมฤทธิ์ทางการเรียนของนักเรียนชั้น ${input.className} ก่อนและหลังใช้เกม "${input.gameTitle}"`,
        `เพื่อศึกษาการเปลี่ยนแปลงของคะแนนเฉลี่ยและแนวโน้มพัฒนาการของผู้เรียน`,
      ];
}

function defaultHypotheses(input: ClassroomResearchDocInput) {
  return [
    `คะแนนเฉลี่ยหลังเรียนของนักเรียนชั้น ${input.className} สูงกว่าก่อนเรียนอย่างมีนัยสำคัญทางการศึกษา`,
    `นักเรียนส่วนใหญ่ในกลุ่มตัวอย่างมีคะแนนเพิ่มขึ้นจากการฝึกด้วยเกม "${input.gameTitle}"`,
  ];
}

function defaultBenefits(input: ClassroomResearchDocInput) {
  return [
    'ครูมีข้อมูลจริงจากระบบเพื่อใช้ตัดสินใจปรับการสอน',
    'นักเรียนได้รับกิจกรรมฝึกซ้ำที่สนุกและตรวจสอบผลได้ทันที',
    'โรงเรียนมีเอกสารรายงานที่นำไปใช้ประกอบการพัฒนาผู้เรียนได้',
  ];
}

function defaultTheory(input: ClassroomResearchDocInput) {
  return [
    `Gamification คือการนำองค์ประกอบของเกม เช่น คะแนน ระดับ ความท้าทาย และการสะท้อนผลทันที มาใช้กับกิจกรรมการเรียนรู้เพื่อกระตุ้นแรงจูงใจ`,
    `การฝึกทักษะ ${input.gameTitle} ด้วยกิจกรรมสั้น ๆ ซ้ำหลายครั้ง ช่วยให้ผู้เรียนจดจำรูปแบบคำตอบได้ดีขึ้น และลดความกดดันจากการทำแบบฝึกแบบเดิม`,
    `ระบบ Kampai School ทำหน้าที่เก็บข้อมูลการเล่นจริงของผู้เรียน ทำให้ครูสามารถติดตามความก้าวหน้ารายวันและสรุปผลจากข้อมูลเชิงประจักษ์ได้`,
  ];
}

function conceptualFrameworkParagraph(input: ClassroomResearchDocInput) {
  return `กรอบแนวคิดของการวิจัยครั้งนี้อธิบายได้ว่า การใช้เกมการศึกษา "${input.gameTitle}" เป็นตัวแปรต้น จะส่งผลผ่านกิจกรรมการเล่น การฝึกซ้ำ และการรับ feedback ทันที ไปสู่ตัวแปรตามคือคะแนนก่อนเรียน–หลังเรียนและแนวโน้มพัฒนาการของผู้เรียน`;
}

function chapterTwoRelatedStudies(input: ClassroomResearchDocInput) {
  return [
    `งานวิจัยที่เกี่ยวข้องกับการจัดการเรียนรู้แบบเกมพบว่า เมื่อผู้เรียนมีเป้าหมายที่ชัดเจนและได้รับรางวัลเชิงสัญลักษณ์อย่างต่อเนื่อง ผู้เรียนจะมุ่งมั่นฝึกทักษะมากขึ้น`,
    `ในบริบทการคูณเลขของนักเรียนประถมศึกษา การฝึกทบทวนอย่างสม่ำเสมอร่วมกับกิจกรรมที่ให้ผลย้อนกลับทันที ช่วยสร้างความคุ้นเคยและความมั่นใจในการตอบคำถาม`,
    `จากข้อมูลการใช้งานจริงในระบบของโรงเรียน การติดตามรอบการเล่นและผลคะแนนรายบุคคลทำให้ครูสามารถออกแบบกิจกรรมเสริมได้ตรงจุดมากขึ้น`,
  ];
}

function defaultDiscussion(input: ClassroomResearchDocInput) {
  return `ผลการวิจัยสะท้อนว่าการใช้เกม "${input.gameTitle}" ช่วยให้ผู้เรียนมีส่วนร่วมในการฝึกซ้ำมากขึ้น และเห็นความก้าวหน้าของตนเองอย่างเป็นรูปธรรม เมื่อคะแนนหลังเรียนสูงกว่าก่อนเรียนอย่างสม่ำเสมอ จึงสนับสนุนแนวคิดว่าเกมการศึกษาสามารถเป็นเครื่องมือเสริมการเรียนรู้ได้จริงในชั้นเรียน ${input.className}`;
}

function defaultLimitations(input: ClassroomResearchDocInput) {
  return [
    `ข้อมูลที่ใช้วิเคราะห์มาจากนักเรียนชั้น ${input.className} ในช่วงเวลาที่กำหนดของโครงการเดียว`,
    'ผลการวิจัยพึ่งพาคะแนนจากระบบเกมเป็นหลัก จึงสะท้อนความสามารถเฉพาะทักษะที่เกมวัดได้',
    'หากมีช่วงวันที่ขาดข้อมูล จะทำให้ภาพรวมรายวันไม่สมบูรณ์เท่ากรณีที่เล่นครบทุกวัน',
  ];
}

function defaultRecommendations(input: ClassroomResearchDocInput) {
  return input.recommendations?.trim()
    ? input.recommendations
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
    : [
        `ควรนำเกม "${input.gameTitle}" ไปใช้ฝึกซ้ำในช่วงระยะเวลาต่อเนื่อง เพื่อให้ผู้เรียนมีโอกาสทบทวนหลายครั้ง`,
        'ควรติดตามนักเรียนที่ยังมีคะแนนก่อนเรียนต่ำและจัดกิจกรรมเสริมเฉพาะจุด',
        'ควรเก็บข้อมูลรายวันอย่างสม่ำเสมอ เพื่อให้การวิเคราะห์แนวโน้มและการสรุปผลในเล่มวิจัยชัดเจนยิ่งขึ้น',
      ];
}

function defaultReferences(input: ClassroomResearchDocInput) {
  return input.references?.trim()
    ? input.references
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
    : [
        `ข้อมูลผลการเล่นเกมในระบบ Kampai School ของโรงเรียน ${input.school.name}`,
        'บันทึกการจัดการเรียนรู้และแผนการสอนของครูผู้วิจัย',
        `คู่มือการใช้เกมการศึกษา "${input.gameTitle}" สำหรับการจัดการเรียนรู้ในชั้นเรียน`,
      ];
}

function buildDocumentXml(input: ClassroomResearchDocInput) {
  const today = formatThaiDateFull(new Date().toISOString().split('T')[0]);
  const pretestLabel = formatThaiDateRange(input.pretestRange.start, input.pretestRange.end);
  const posttestLabel = formatThaiDateRange(input.posttestRange.start, input.posttestRange.end);
  const objectives = defaultObjectives(input);
  const hypotheses = defaultHypotheses(input);
  const benefits = defaultBenefits(input);
  const theory = defaultTheory(input);
  const relatedStudies = chapterTwoRelatedStudies(input);
  const recommendations = defaultRecommendations(input);
  const references = defaultReferences(input);
  const abstractText = input.abstract?.trim() || defaultAbstract(input);
  const problemText = defaultProblem(input);
  const discussionText = input.conclusion?.trim() || defaultDiscussion(input);
  const coverage = input.coverage;
  const dailyRows = input.dailySummaries ?? [];
  const studentRows = input.rows ?? [];
  const scopeRows: [string, string][] = [
    ['ประชากร', `นักเรียนชั้น ${input.className} ที่เข้าร่วมโครงการวิจัย`],
    ['กลุ่มตัวอย่าง', `${input.className} จำนวน ${input.stats.n} คน`],
    ['เนื้อหา', `ทักษะการคูณและการฝึกด้วยเกม "${input.gameTitle}"`],
    ['ระยะเวลา', `${pretestLabel} ถึง ${posttestLabel}`],
    ['สถานที่', 'ห้องเรียนและหน้าเว็บ kampai-school'],
    ['เครื่องมือ', `เกม "${input.gameTitle}" · แดชบอร์ดครู · ระบบบันทึกคะแนนอัตโนมัติ`],
  ];

  const definitionsRows: [string, string][] = [
    ['Gamification', 'การนำองค์ประกอบของเกมมาใช้ในบริบทการเรียนรู้'],
    ['Pretest', 'ข้อมูลคะแนนก่อนใช้กิจกรรมหรือก่อนช่วงสอน'],
    ['Posttest', 'ข้อมูลคะแนนหลังการใช้กิจกรรมหรือหลังช่วงสอน'],
    ['ผลต่างเฉลี่ย', 'คะแนนเฉลี่ยหลังเรียนลบคะแนนเฉลี่ยก่อนเรียน'],
  ];

  const methodologyRows: [string, string][] = [
    ['รูปแบบการวิจัย', 'One-Group Pretest–Posttest Design'],
    ['กลุ่มเป้าหมาย', `นักเรียนชั้น ${input.className}`],
    ['เครื่องมือวิจัย', `เกม "${input.gameTitle}" และข้อมูลจากระบบ Kampai School`],
    ['การวิเคราะห์', 'ค่าเฉลี่ย ส่วนเบี่ยงเบนมาตรฐาน ผลต่างเฉลี่ย และร้อยละของผู้ที่พัฒนาขึ้น'],
    ['จริยธรรม', 'เก็บข้อมูลเฉพาะผู้เข้าร่วมที่ได้รับความยินยอม และใช้เพื่อการพัฒนาการเรียนรู้เท่านั้น'],
  ];

  const chapterFourSummaryRows: TableRowSpec[] = [
    { cells: ['รายการ', 'ก่อนเรียน', 'หลังเรียน', 'ผลต่าง', '% ดีขึ้น'], header: true, align: ['center', 'center', 'center', 'center', 'center'] },
    {
      cells: [
        'สรุปภาพรวม',
        input.stats.meanPretest.toFixed(1),
        input.stats.meanPosttest.toFixed(1),
        `${input.stats.meanGain >= 0 ? '+' : ''}${input.stats.meanGain.toFixed(1)}`,
        `${input.stats.percentImproved.toFixed(0)}%`,
      ],
      align: ['left', 'center', 'center', 'center', 'center'],
    },
  ];

  const studentTableRows: TableRowSpec[] = [
    {
      cells: ['เลขที่', 'นักเรียน', 'รอบก่อน', 'ก่อนเรียน', 'รอบหลัง', 'หลังเรียน', 'ผลต่าง'],
      header: true,
      align: ['center', 'center', 'center', 'center', 'center', 'center', 'center'],
    },
    ...studentRows.map((row, index) => ({
      cells: [
        String(row.classNumber ?? index + 1),
        row.name,
        String(row.preRounds ?? '—'),
        row.pretestMean !== null ? row.pretestMean.toFixed(1) : '—',
        String(row.postRounds ?? '—'),
        row.posttestMean !== null ? row.posttestMean.toFixed(1) : '—',
        row.gain !== null ? `${row.gain >= 0 ? '+' : ''}${row.gain.toFixed(1)}` : '—',
      ],
      align: ['center', 'left', 'center', 'center', 'center', 'center', 'center'],
    })),
  ];

  const dailyTableRows: TableRowSpec[] = [
    {
      cells: ['วันที่', 'ช่วง', 'รอบ', 'นักเรียน', 'เฉลี่ย'],
      header: true,
      align: ['center', 'center', 'center', 'center', 'center'],
    },
    ...dailyRows.map((row) => ({
      cells: [
        formatThaiDateMedium(row.date),
        researchPhaseLabel(row.phase),
        String(row.sessions),
        String(row.uniqueStudents),
        row.meanScore !== null ? row.meanScore.toFixed(1) : '—',
      ],
      align: ['center', 'center', 'center', 'center', 'center'],
    })),
  ];

  const conceptualFramework = tableXml(
    [
      {
        cells: ['ตัวแปรต้น', 'กระบวนการ', 'ตัวแปรตาม'],
        header: true,
        align: ['center', 'center', 'center'],
      },
      {
        cells: [
          `การใช้เกม "${input.gameTitle}"`,
          'ฝึกซ้ำ · feedback ทันที · ความสนุก',
          'คะแนนก่อน/หลัง · ความก้าวหน้า · ความมั่นใจ',
        ],
        align: ['center', 'center', 'center'],
      },
    ],
    [2800, 4400, 2800],
  );

  const bodyParts = [
    titleParagraph(input.title || 'รายงานวิจัยในชั้นเรียนฉบับสมบูรณ์'),
    centeredMeta(input.school.name, 12.5),
    centeredMeta(`ผู้วิจัย: ${input.teacherName}`, 12.5),
    centeredMeta(`ชั้นเรียน: ${input.className} · เครื่องมือที่ใช้: ${input.gameTitle}`, 12.5),
    centeredMeta(`จัดทำเมื่อ ${today}`, 12),
    pageBreak(),
    headingXml(1, 'บทคัดย่อ'),
    normalParagraph(abstractText),
    kvTable(
      [
        ['ชื่อเรื่อง', input.title || 'รายงานวิจัยในชั้นเรียนฉบับสมบูรณ์'],
        ['กลุ่มตัวอย่าง', `${input.className} จำนวน ${input.stats.n} คน`],
        ['ช่วงก่อนเรียน', pretestLabel],
        ['ช่วงหลังเรียน', posttestLabel],
      ],
      [2400, USABLE_WIDTH - 2400],
    ),
    normalParagraph(`คำสำคัญ: Gamification, การคูณ, ผลสัมฤทธิ์, แรงจูงใจ, ${input.gameTitle}`, {
      size: 10.5,
      color: '#4B5563',
      after: 60,
    }),
    pageBreak(),
    headingXml(1, 'บทที่ 1 บทนำ'),
    headingXml(2, '1.1 ความเป็นมาและความสำคัญของปัญหา'),
    normalParagraph(problemText),
    headingXml(2, '1.2 วัตถุประสงค์การวิจัย'),
    listBlock(objectives),
    headingXml(2, '1.3 สมมติฐานการวิจัย'),
    listBlock(hypotheses),
    headingXml(2, '1.4 ขอบเขตการวิจัย'),
    kvTable(scopeRows, [2200, USABLE_WIDTH - 2200]),
    headingXml(2, '1.5 นิยามศัพท์เฉพาะ'),
    kvTable(definitionsRows, [2200, USABLE_WIDTH - 2200]),
    headingXml(2, '1.6 ประโยชน์ที่คาดว่าจะได้รับ'),
    listBlock(benefits),
    pageBreak(),
    headingXml(1, 'บทที่ 2 เอกสารและงานวิจัยที่เกี่ยวข้อง'),
    headingXml(2, '2.1 แนวคิด Gamification'),
    normalParagraph(theory[0]),
    headingXml(2, '2.2 การเรียนรู้สูตรคูณในระดับประถมศึกษา'),
    normalParagraph(theory[1]),
    headingXml(2, '2.3 ระบบ Kampai School กับการเก็บข้อมูล'),
    normalParagraph(theory[2]),
    headingXml(2, '2.4 งานวิจัยที่เกี่ยวข้อง'),
    listBlock(relatedStudies),
    headingXml(2, '2.5 กรอบแนวคิดการวิจัย'),
    normalParagraph(conceptualFrameworkParagraph(input)),
    conceptualFramework,
    pageBreak(),
    headingXml(1, 'บทที่ 3 วิธีดำเนินการวิจัย'),
    headingXml(2, '3.1 รูปแบบการวิจัย'),
    normalParagraph(
      `การวิจัยครั้งนี้เป็นการวิจัยเชิงปฏิบัติการ รูปแบบ One-Group Pretest–Posttest Design ใช้ข้อมูลคะแนนจากระบบเกมในช่วงก่อนเรียนและหลังเรียนเพื่อเปรียบเทียบผลสัมฤทธิ์ของผู้เรียน`,
    ),
    headingXml(2, '3.2 ประชากรและกลุ่มตัวอย่าง'),
    kvTable(
      [
        ['ประชากร', `นักเรียนชั้น ${input.className} ที่เข้าร่วมโครงการ`],
        ['กลุ่มตัวอย่าง', `${input.className} จำนวน ${input.stats.n} คน ที่มีข้อมูลครบทั้งก่อนและหลัง`],
        ['วิธีได้มาของกลุ่มตัวอย่าง', 'เลือกจากผู้เรียนที่เข้าเรียนและเข้าร่วมกิจกรรมในช่วงกำหนด'],
      ],
      [2600, USABLE_WIDTH - 2600],
    ),
    headingXml(2, '3.3 เครื่องมือวิจัย'),
    kvTable(methodologyRows, [2600, USABLE_WIDTH - 2600]),
    headingXml(2, '3.4 ขั้นตอนการดำเนินการ'),
    listBlock([
      'สร้างโครงการวิจัยในระบบ กำหนดช่วงก่อนเรียนและหลังเรียนให้ชัดเจน',
      'ส่งลิงก์หรือลิงก์ QR ให้นักเรียนเข้าเล่นเกมตามโหมดที่กำหนด',
      'เก็บคะแนนก่อนเรียนและหลังเรียนจากระบบอัตโนมัติของ Kampai School',
      'วิเคราะห์ผลโดยใช้ค่าเฉลี่ย ส่วนเบี่ยงเบนมาตรฐาน ผลต่างเฉลี่ย และร้อยละของผู้ที่พัฒนาขึ้น',
    ]),
    headingXml(2, '3.5 การเก็บรวบรวมข้อมูล'),
    normalParagraph(
      `ระบบบันทึกข้อมูลจากการเล่นจริงของผู้เรียนในช่วง ${pretestLabel} และ ${posttestLabel} จากนั้นนำมาคัดกรองเฉพาะรอบที่ตรงกับช่วงวิจัยและสรุปเป็นรายบุคคล รายวัน และรายช่วง`,
    ),
    headingXml(2, '3.6 การวิเคราะห์ข้อมูล'),
    normalParagraph(
      'ใช้ค่าเฉลี่ย (Mean) ส่วนเบี่ยงเบนมาตรฐาน (S.D.) ผลต่างเฉลี่ยระหว่างก่อนเรียนและหลังเรียน รวมถึงร้อยละของนักเรียนที่มีคะแนนเพิ่มขึ้น เพื่อสรุปแนวโน้มพัฒนาการของผู้เรียน',
    ),
    headingXml(2, '3.7 จริยธรรมการวิจัย'),
    normalParagraph(
      'การเก็บข้อมูลใช้เฉพาะผู้เรียนที่อยู่ในชั้นและช่วงเวลาที่กำหนด โดยแจ้งวัตถุประสงค์ของการใช้ข้อมูลเพื่อพัฒนาการเรียนรู้และจำกัดการเข้าถึงเฉพาะครูผู้รับผิดชอบ',
    ),
    pageBreak(),
    headingXml(1, 'บทที่ 4 ผลการวิจัย'),
    headingXml(2, '4.1 ผลการวิเคราะห์ผลสัมฤทธิ์'),
    tableXml(chapterFourSummaryRows, [2600, 1900, 1900, 1700, 1500]),
    headingXml(2, '4.2 ผลการวิเคราะห์รายบุคคล'),
    tableXml(studentTableRows, [700, 2500, 900, 900, 900, 900, 900]),
    headingXml(2, '4.3 ผลการเก็บข้อมูลรายวัน'),
    tableXml(dailyTableRows, [1800, 1400, 900, 1200, 1000]),
    headingXml(2, '4.4 สรุปผลจากระบบ Kampai School'),
    normalParagraph(
      `จากข้อมูลรายวันพบว่ามีวันมีข้อมูล ${coverage ? `${coverage.totalDaysWithData}/${coverage.totalDaysExpected}` : '—'} วัน และมีรอบบันทึกทั้งหมด ${coverage ? coverage.totalSessions : input.rows.length} รอบ ซึ่งช่วยยืนยันความครบถ้วนของข้อมูลที่ใช้วิเคราะห์`,
    ),
    headingXml(2, '4.5 สรุปผลตามสมมติฐาน'),
    normalParagraph(
      `ผลการวิจัยสนับสนุนสมมติฐานที่ตั้งไว้ว่า คะแนนเฉลี่ยหลังเรียนของนักเรียนชั้น ${input.className} สูงกว่าก่อนเรียน และผู้เรียนส่วนใหญ่มีผลการเรียนรู้ที่ดีขึ้นหลังใช้เกม "${input.gameTitle}"`,
    ),
    pageBreak(),
    headingXml(1, 'บทที่ 5 อภิปรายผล สรุป และข้อเสนอแนะ'),
    headingXml(2, '5.1 อภิปรายผลการวิจัย'),
    normalParagraph(discussionText),
    headingXml(2, '5.2 ข้อจำกัดของการวิจัย'),
    listBlock(defaultLimitations(input)),
    headingXml(2, '5.3 ข้อเสนอแนะ'),
    listBlock(recommendations),
    headingXml(2, '5.4 สรุปผลโดยย่อ'),
    normalParagraph(
      `โดยสรุป การใช้เกม "${input.gameTitle}" ในการเรียนรู้ช่วยให้ผู้เรียนมีการฝึกซ้ำอย่างต่อเนื่อง มีแรงจูงใจมากขึ้น และสะท้อนผลลัพธ์เชิงตัวเลขที่ตรวจสอบได้จากระบบ`,
    ),
    pageBreak(),
    headingXml(1, 'เอกสารอ้างอิง'),
    listBlock(references),
    headingXml(1, 'ภาคผนวก'),
    normalParagraph(
      'ภาคผนวกนี้สามารถแนบภาพหน้าจอจากระบบ แผนการสอน ใบยินยอมผู้ปกครอง หรือข้อมูลประกอบอื่น ๆ ตามความเหมาะสมของหน่วยงาน',
    ),
  ].join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${WORD_NS}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${bodyParts}
    <w:sectPr>
      <w:pgSz w:w="${A4_WIDTH}" w:h="${A4_HEIGHT}"/>
      <w:pgMar w:top="${PAGE_MARGIN}" w:right="${PAGE_MARGIN}" w:bottom="${PAGE_MARGIN}" w:left="${PAGE_MARGIN}" w:header="708" w:footer="708" w:gutter="0"/>
      <w:cols w:space="708"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

function numberingXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="${WORD_NS}">
  <w:abstractNum w:abstractNumId="0">
    <w:multiLevelType w:val="singleLevel"/>
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/>
      <w:numFmt w:val="decimal"/>
      <w:lvlText w:val="%1."/>
      <w:lvlJc w:val="left"/>
      <w:pPr>
        <w:ind w:left="720" w:hanging="360"/>
      </w:pPr>
    </w:lvl>
  </w:abstractNum>
  <w:num w:numId="1">
    <w:abstractNumId w:val="0"/>
  </w:num>
</w:numbering>`;
}

function contentTypesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="${PKG_NS}">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
</Types>`;
}

function rootRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="${REL_NS}">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
}

function buildClassroomResearchDocxBlob(input: ClassroomResearchDocInput) {
  const files = [
    { name: '[Content_Types].xml', content: contentTypesXml() },
    { name: '_rels/.rels', content: rootRelsXml() },
    { name: 'word/document.xml', content: buildDocumentXml(input) },
    { name: 'word/numbering.xml', content: numberingXml() },
  ];
  return fileBlob(files);
}

export function downloadClassroomResearchDocx(input: ClassroomResearchDocInput) {
  const filename = `research-report-${fileNameSafe(input.title || input.gameTitle)}.docx`;
  const blob = buildClassroomResearchDocxBlob(input);
  downloadBlob(blob, filename);
}
