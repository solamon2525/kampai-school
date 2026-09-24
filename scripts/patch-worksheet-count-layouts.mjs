/**
 * One-shot: apply 5/10 question layout controls across worksheets.
 * Run: node scripts/patch-worksheet-count-layouts.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('public/games');
const VERSION = '1.175.10';
const COUNT_SELECT = [
  '<select class="t-select" id="selCount" aria-label="จำนวนข้อต่อหน้า" title="5 ข้อ = แถวสูง มีที่เขียนวิธีทำ · 10 ข้อ = ฝึกเร็ว 2 คอลัมน์">',
  '<option value="5" selected>5 ข้อ / หน้า (มีที่เขียนวิธีทำ)</option>',
  '<option value="10">10 ข้อ / หน้า (ฝึกเร็ว)</option>',
  '</select>',
].join('');

const COUNT_SELECT_COMPACT = '<select class="t-select" id="selCount" aria-label="จำนวนข้อ"><option value="5" selected>5 ข้อ / หน้า</option><option value="10">10 ข้อ / หน้า</option></select>';

const COUNT5_CSS = [
  '.questions.count-5,.questions.worksheet-mode-five{grid-template-columns:1fr;grid-template-rows:repeat(5,1fr);gap:3mm}',
  '.questions.count-5 .q,.questions.worksheet-mode-five .q{padding:3.5mm 3mm;min-height:44mm}',
  '.count-5 .q-work-block,.worksheet-mode-five .q-work-block{min-height:20mm;gap:2mm}',
  '.count-5 .work-line,.worksheet-mode-five .work-line{min-height:10mm;height:10mm;font-size:9.5pt}',
  '.count-5 .eng-word,.count-5 .sci-word,.count-5 .thai-word,.count-5 .code-word{font-size:16pt}',
  '.count-5 .ans,.worksheet-mode-five .ans{margin-top:3mm;font-size:10.5pt}',
].join('');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('worksheet.html') || entry.name === '_template-worksheet.html') out.push(full);
  }
  return out;
}

function bumpVersions(html) {
  return html
    .replace(/worksheet-runtime\.js\?v=1\.175\.[0-9]+/g, `worksheet-runtime.js?v=${VERSION}`)
    .replace(/worksheet-topic\.js\?v=1\.175\.[0-9]+/g, `worksheet-topic.js?v=${VERSION}`)
    .replace(/worksheet-topic\.css\?v=1\.175\.[0-9]+/g, `worksheet-topic.css?v=${VERSION}`)
    .replace(/worksheet-modes\.js\?v=1\.175\.[0-9]+/g, `worksheet-modes.js?v=${VERSION}`)
    .replace(/worksheet-modes\.css\?v=1\.175\.[0-9]+/g, `worksheet-modes.css?v=${VERSION}`);
}

function replaceSelCountOptions(html) {
  // Compact topic-engine pattern (single-line toolbar)
  let next = html.replace(
    /<select class="t-select" id="selCount" aria-label="จำนวนข้อ"><option value="10">10 ข้อ<\/option><option value="5">5 ข้อ<\/option><\/select>/g,
    COUNT_SELECT_COMPACT,
  );
  // Multiline / labeled variants already present
  next = next.replace(
    /<select class="t-select" id="selCount"[^>]*>[\s\S]*?<\/select>/g,
    (block) => {
      if (/data-fixed-count/.test(block)) return block; // division stays fixed
      if (/id="selCount"/.test(block) && /value="5"/.test(block) && /value="10"/.test(block)) {
        // Normalize to spacious default-5 labels when not already fixed
        if (/มีที่เขียนวิธีทำ/.test(block) || /5 ข้อ \/ หน้า/.test(block)) return block;
        return COUNT_SELECT;
      }
      return block;
    },
  );
  return next;
}

function patchStandaloneMissingCount(html, filePath) {
  const rel = filePath.replace(/\\/g, '/');
  const targets = [
    'english/grammar-vocab-worksheet.html',
    'science/science-explorer-worksheet.html',
    'tech/coding-social-worksheet.html',
    'thai/vocab-grammar-worksheet.html',
  ];
  if (!targets.some((t) => rel.endsWith(t))) return html;
  if (/id=["']selCount["']/.test(html)) return html;

  let next = html;
  if (!/\.questions\.count-5/.test(next)) {
    next = next.replace(
      '.questions.count-10{grid-template-columns:1fr 1fr;grid-template-rows:repeat(5,1fr);gap:1.5mm 3mm}\n    .questions.count-10 .q{padding:2mm 2.5mm;min-height:36.5mm}',
      '.questions.count-10{grid-template-columns:1fr 1fr;grid-template-rows:repeat(5,1fr);gap:1.5mm 3mm}\n    .questions.count-10 .q{padding:2mm 2.5mm;min-height:36.5mm}\n    ' + COUNT5_CSS,
    );
  }

  next = next.replace(
    /(<select class="t-select" id="selTopic">[\s\S]*?<\/select>)/,
    `$1\n      ${COUNT_SELECT}`,
  );

  next = next.replace(
    /function renderSingleSheet\(([^)]*)\)\{/,
    'function renderSingleSheet($1){\n  const count = Number(document.getElementById(\'selCount\')?.value) === 10 ? 10 : 5;',
  );

  next = next.replace(/for\(let i=1; i<=10; i\+\+\)\{/g, 'for(let i=1; i<=count; i++){');
  next = next.replace(/for\(let i=1; i<=10; i\+\+\)\{/g, 'for(let i=1; i<=count; i++){');
  // thai vocab uses newline form
  next = next.replace(/for\(let i=1; i<=10; i\+\+\)\{\n/g, 'for(let i=1; i<=count; i++){\n');
  next = next.replace(
    /<div class="questions count-10">'\+qs\+'<\/div>/g,
    '<div class="questions count-\'+count+\'">\'+qs+\'</div>',
  );

  if (!/getElementById\('selCount'\)\.onchange/.test(next)) {
    next = next.replace(
      "document.getElementById('selPageCount').onchange = render;",
      "document.getElementById('selPageCount').onchange = render;\ndocument.getElementById('selCount').onchange = render;",
    );
  }
  return next;
}

function patchMultiplicationDefault(html, filePath) {
  if (!filePath.replace(/\\/g, '/').endsWith('math/multiplication-worksheet.html')) return html;
  return html.replace(
    /<select class="t-select" id="selCount">\s*<option value="10" selected>10 ข้อ\/หน้า \(โจทย์ใหญ่ ตัวเต็มช่อง\)<\/option>\s*<option value="5">5 ข้อ\/หน้า \(โจทย์ใหญ่พิเศษ\)<\/option>\s*<\/select>/,
    [
      '<select class="t-select" id="selCount" aria-label="จำนวนข้อต่อหน้า" title="5 ข้อ = แถวสูง มีที่เขียนวิธีทำ · 10 ข้อ = ฝึกเร็ว 2 คอลัมน์">',
      '        <option value="5" selected>5 ข้อ/หน้า (มีที่เขียนวิธีทำ)</option>',
      '        <option value="10">10 ข้อ/หน้า (ฝึกเร็ว)</option>',
      '      </select>',
    ].join('\n'),
  );
}

function patchTemplate(html, filePath) {
  if (!filePath.replace(/\\/g, '/').endsWith('_template-worksheet.html')) return html;
  return replaceSelCountOptions(html);
}

const files = walk(root);
let changed = 0;
for (const file of files) {
  const before = fs.readFileSync(file, 'utf8');
  let next = before;
  next = bumpVersions(next);
  next = replaceSelCountOptions(next);
  next = patchStandaloneMissingCount(next, file);
  next = patchMultiplicationDefault(next, file);
  next = patchTemplate(next, file);
  if (next !== before) {
    fs.writeFileSync(file, next);
    changed += 1;
    console.log('updated', path.relative(process.cwd(), file));
  }
}
console.log(`done: ${changed}/${files.length} files`);
