#!/usr/bin/env node
/** Expand every Thai Vocab Hub category to 200 entries with a P.4 review set. */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'public/games/thai/thai-vocab-hub/data/words');
const TARGET = 200;
const indicators = {
  misspelled:'ท 4.1 ป.4/1', homophones:'ท 4.1 ป.4/1', classifiers:'ท 4.1 ป.4/2',
  royal:'ท 4.1 ป.4/3', idioms:'ท 4.1 ป.4/6', blends:'ท 4.1 ป.4/1',
  leading:'ท 4.1 ป.4/1', lesson:'ท 1.1 ป.4/2', 'p5-focus':'ท 1.1 ป.4/2',
  difficult:'ท 4.1 ป.4/1', loanwords:'ท 4.1 ป.4/5', spelling:'ท 4.1 ป.4/1',
  synonyms:'ท 4.1 ป.4/2', antonyms:'ท 4.1 ป.4/2', livedead:'ท 4.1 ป.4/1',
  reduplication:'ท 4.1 ป.4/4',
};
const sourceOrder = {
  misspelled:['difficult','loanwords','lesson'], homophones:['misspelled','lesson','difficult'],
  classifiers:['lesson','p5-focus','spelling'], royal:['lesson','difficult','p5-focus'],
  idioms:['reduplication','lesson','antonyms'], blends:['spelling','misspelled','lesson'],
  leading:['spelling','lesson','misspelled'], lesson:['p5-focus','difficult','loanwords'],
  'p5-focus':['lesson','difficult','loanwords'], difficult:['misspelled','loanwords','lesson'],
  loanwords:['difficult','lesson','misspelled'], spelling:['misspelled','blends','leading'],
  synonyms:['antonyms','lesson','reduplication'], antonyms:['synonyms','lesson','reduplication'],
  livedead:['spelling','blends','leading'], reduplication:['idioms','synonyms','antonyms'],
};
const files = readdirSync(DIR).filter((f) => f.endsWith('.json'));
const bySlug = Object.fromEntries(files.map((f) => [f.slice(0,-5), JSON.parse(readFileSync(join(DIR,f),'utf8'))]));
const readingGroups = new Map();
for (const items of Object.values(bySlug)) for (const item of items) {
  const key = item.reading?.trim();
  if (!key) continue;
  if (!readingGroups.has(key)) readingGroups.set(key, []);
  readingGroups.get(key).push(item);
}

for (const [slug, items] of Object.entries(bySlug)) {
  const seen = new Set(items.map((x) => x.word.trim()));
  let pool = sourceOrder[slug].flatMap((s) => bySlug[s] || []);
  if (slug === 'homophones') {
    pool = [...readingGroups.values()].filter((g) => new Set(g.map((x) => x.word)).size > 1).flat().concat(pool);
  } else if (slug === 'royal') {
    pool = Object.values(bySlug).flat().filter((x) => /พระ|ทรง|ราช|ถวาย|เสวย|บรรทม|ประทับ/.test(x.word)).concat(pool);
  } else if (slug === 'blends') {
    pool = Object.values(bySlug).flat().filter((x) => /^(กร|กล|กว|ขร|ขล|ขว|คร|คล|คว|ตร|ปร|ปล|พร|พล|ผล|ทร|ศร|สร|สล)/.test(x.word)).concat(pool);
  } else if (slug === 'leading') {
    pool = Object.values(bySlug).flat().filter((x) => /^(หง|หน|หม|หย|หร|หล|หว|อย)/.test(x.word)).concat(pool);
  }
  for (const source of pool) {
    if (items.length >= TARGET) break;
    const word = source.word?.trim();
    if (!word || seen.has(word)) continue;
    items.push({
      ...source, grade:'ป.4', difficulty:1, indicator_code:indicators[slug],
      tags:[...new Set([...(source.tags || []),'ชุดเสริม ป.4'])],
      note: source.note || 'คำเสริมสำหรับฝึกวิเคราะห์ในบริบทของหมวดนี้ระดับ ป.4',
    });
    seen.add(word);
  }
  if (items.length !== TARGET) throw new Error(`${slug}: ได้ ${items.length}/${TARGET} คำ`);
  writeFileSync(join(DIR, `${slug}.json`), JSON.stringify(items,null,2)+'\n');
  console.log(`✅ ${slug}: ${items.length}`);
}
