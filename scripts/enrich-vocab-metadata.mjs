#!/usr/bin/env node
/**
 * เติม metadata เฟส F: classifier_for, pair_id, synonym_group, origin_lang
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORDS_DIR = join(__dirname, '..', 'public/games/thai/thai-vocab-hub/data/words');

function enrichClassifiers(items) {
  items.forEach((item) => {
    if (item.classifier_for) return;
    const m = (item.meaning || '').match(/ของ(.+?)(\s|\(|$)/);
    item.classifier_for = m ? m[1].trim().slice(0, 80) : null;
  });
}

function enrichAntonyms(items) {
  for (let i = 0; i < items.length - 1; i += 2) {
    const a = items[i];
    const b = items[i + 1];
    const pid = `pair-${i / 2 + 1}`;
    if (!a.pair_id) a.pair_id = pid;
    if (!b.pair_id) b.pair_id = pid;
  }
}

function enrichSynonyms(items) {
  for (let i = 0; i < items.length - 1; i += 2) {
    const gid = `syn-${Math.floor(i / 2) + 1}`;
    if (!items[i].synonym_group) items[i].synonym_group = gid;
    if (!items[i + 1].synonym_group) items[i + 1].synonym_group = gid;
  }
}

function enrichLoanwords(items) {
  const hints = [
    ['คอม', 'en'], ['คอมพิวเตอร์', 'en'], ['ทีวี', 'en'], ['รถ', 'en'],
    ['ก๋วยเตี๋ยว', 'zh'], ['ตี๋', 'zh'], ['บะหมี่', 'zh'],
    ['พระ', 'pi'], ['ธรรม', 'pi'], ['สงฆ์', 'pi'],
  ];
  items.forEach((item) => {
    if (item.origin_lang) return;
    const hit = hints.find(([w]) => item.word.includes(w));
    item.origin_lang = hit ? hit[1] : 'other';
  });
}

const HANDLERS = {
  classifiers: enrichClassifiers,
  antonyms: enrichAntonyms,
  synonyms: enrichSynonyms,
  loanwords: enrichLoanwords,
};

for (const [slug, fn] of Object.entries(HANDLERS)) {
  const path = join(WORDS_DIR, `${slug}.json`);
  const items = JSON.parse(readFileSync(path, 'utf8'));
  fn(items);
  writeFileSync(path, JSON.stringify(items, null, 2) + '\n', 'utf8');
  console.log(`✅ enriched ${slug}`);
}

console.log('\nรัน pnpm build:vocab');
