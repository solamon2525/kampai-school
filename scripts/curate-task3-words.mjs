#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { misspelledWords } from './curation-data/cat1-misspelled.mjs';
import { homophonesWords } from './curation-data/cat2-homophones.mjs';
import { classifiersWords } from './curation-data/cat3-classifiers.mjs';
import { royalWords } from './curation-data/cat4-royal.mjs';
import { idiomsWords } from './curation-data/cat5-idioms.mjs';
import { blendsWords } from './curation-data/cat6-blends.mjs';
import { leadingWords } from './curation-data/cat7-leading.mjs';
import { lessonWords } from './curation-data/cat8-lesson.mjs';
import { p5FocusWords } from './curation-data/cat9-p5-focus.mjs';
import { difficultWords } from './curation-data/cat10-difficult.mjs';
import { loanwordsWords } from './curation-data/cat11-loanwords.mjs';
import { spellingWords } from './curation-data/cat12-spelling.mjs';
import { synonymsWords } from './curation-data/cat13-synonyms.mjs';
import { antonymsWords } from './curation-data/cat14-antonyms.mjs';
import { livedeadWords } from './curation-data/cat15-livedead.mjs';
import { reduplicationWords } from './curation-data/cat16-reduplication.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const WORDS_DIR = join(ROOT, 'public/games/thai/thai-vocab-hub/data/words');

const curatedPacks = {
  misspelled: misspelledWords,
  homophones: homophonesWords,
  classifiers: classifiersWords,
  royal: royalWords,
  idioms: idiomsWords,
  blends: blendsWords,
  leading: leadingWords,
  lesson: lessonWords,
  'p5-focus': p5FocusWords,
  difficult: difficultWords,
  loanwords: loanwordsWords,
  spelling: spellingWords,
  synonyms: synonymsWords,
  antonyms: antonymsWords,
  livedead: livedeadWords,
  reduplication: reduplicationWords
};

console.log('Validating curated packs...');

const requiredFields = [
  'word',
  'reading',
  'meaning',
  'emoji',
  'grade',
  'indicator_code',
  'content_status',
  'category_evidence',
  'pos',
  'example'
];

let hasErrors = false;

for (const [slug, pack] of Object.entries(curatedPacks)) {
  if (!Array.isArray(pack) || pack.length !== 50) {
    console.error(`❌ ${slug} pack does not have 50 items (got ${pack?.length})`);
    hasErrors = true;
    continue;
  }

  const existingFile = join(WORDS_DIR, `${slug}.json`);
  const existingItems = JSON.parse(readFileSync(existingFile, 'utf8'));
  const approvedOriginal = existingItems.slice(0, 150);
  const existingWords = new Set(approvedOriginal.map((x) => x.word));

  const seenInPack = new Set();

  pack.forEach((item, idx) => {
    // Check required fields
    for (const field of requiredFields) {
      if (!item[field] || typeof item[field] !== 'string') {
        console.error(`❌ [${slug} #${idx}] missing or invalid field "${field}":`, item);
        hasErrors = true;
      }
    }

    if (item.content_status !== 'approved') {
      console.error(`❌ [${slug} #${idx}] content_status must be 'approved', got '${item.content_status}'`);
      hasErrors = true;
    }

    if (!['ป.4', 'ป.5', 'ป.6'].includes(item.grade)) {
      console.error(`❌ [${slug} #${idx}] invalid grade '${item.grade}'`);
      hasErrors = true;
    }

    // Specific field checks
    if (slug === 'classifiers' && (!item.classifier_for || typeof item.classifier_for !== 'string')) {
      console.error(`❌ [${slug} #${idx}] missing classifier_for`);
      hasErrors = true;
    }
    if (slug === 'loanwords' && (!item.origin_lang || typeof item.origin_lang !== 'string')) {
      console.error(`❌ [${slug} #${idx}] missing origin_lang`);
      hasErrors = true;
    }
    if (slug === 'synonyms' && (!item.synonym_group || typeof item.synonym_group !== 'string')) {
      console.error(`❌ [${slug} #${idx}] missing synonym_group`);
      hasErrors = true;
    }
    if (slug === 'antonyms' && (!item.pair_id || typeof item.pair_id !== 'string')) {
      console.error(`❌ [${slug} #${idx}] missing pair_id`);
      hasErrors = true;
    }

    // Check duplicate within pack (allow homographs only if intentional, but best unique)
    if (seenInPack.has(item.word)) {
      // Homophones can have identical spelling with different meanings if needed, otherwise warn
      if (slug !== 'homophones') {
        console.warn(`⚠️ [${slug}] duplicate word within pack: ${item.word}`);
      }
    }
    seenInPack.add(item.word);

    // Check duplicate with existing 150 items
    if (existingWords.has(item.word)) {
      // In homophones or specific categories check
      console.warn(`⚠️ [${slug}] word "${item.word}" already exists in the first 150 items!`);
    }
  });
}

if (hasErrors) {
  console.error('Validation failed. Aborting write.');
  process.exit(1);
}

console.log('✓ All 16 packs passed structure validation.');
console.log('Writing updated JSON files...');

for (const [slug, pack] of Object.entries(curatedPacks)) {
  const filePath = join(WORDS_DIR, `${slug}.json`);
  const existingItems = JSON.parse(readFileSync(filePath, 'utf8'));

  // Keep items 0-149, replace 150-199 with pack
  const newItems = [...existingItems.slice(0, 150), ...pack];
  if (newItems.length !== 200) {
    console.error(`❌ Resulting array length for ${slug} is ${newItems.length}, expected 200`);
    process.exit(1);
  }

  writeFileSync(filePath, JSON.stringify(newItems, null, 2) + '\n', 'utf8');
  console.log(`✓ Updated ${slug}.json (200 items, 0 quarantined)`);
}

console.log('\n🎉 Successfully updated all 16 category files with 800 authentic approved curriculum words!');
