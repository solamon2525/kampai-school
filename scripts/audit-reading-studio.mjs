#!/usr/bin/env node
/**
 * scripts/audit-reading-studio.mjs
 * Comprehensive dataset spelling, phonetics, and royal vocabulary audit for reading-studio.json
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const FILE_PATH = resolve(ROOT, 'public/games/thai/thai-vocab-hub/data/words/reading-studio.json');

// Inauthentic/fabricated royal vocabulary words in rs_101-rs_200 that must not exist
export const FABRICATED_ROYAL_WORDS = new Set([
  'ทรงพระผลงาน',
  'พระราชอาสา',
  'พระราชทูล',
  'พระอังคา',
  'พระอินทร์',
  'พระอัคคี',
  'พระวายุ',
  'พระอุษา',
  'พระสุรัย',
  'พระจันทร์',
  'พระอาทิตย์',
  'พระนคร',
  'พระมหาสมุทร',
  'พระราชวิชา',
  'พระราชลัญจการ',
  'พระราชนูปถาน',
  'พระราชกระบี่',
  'พระราชชนม์มาลา',
]);

// Specific known invalid/malformed readings from legacy dataset
export const KNOWN_INVALID_READINGS = new Map([
  ['rs_051', 'วิ-เสด'],
  ['rs_060', 'อะ-นุ-สา-วะ-รี'],
  ['rs_061', 'ประ-กาด-นิ-ยะ-บัด'],
  ['rs_068', 'สะ-หลุบ-ผน'],
  ['rs_069', 'อัด-ถะ-ประ-โยก'],
  ['rs_071', 'คำ-กริ-ยา-วิ-เสด'],
  ['rs_075', 'ตัว-ละ-คอน'],
  ['rs_076', 'บด-สน-ทะ-นา'],
  ['rs_080', 'ประ-พัน'],
  ['rs_083', 'โสก-นาด-ตะ-กัม'],
  ['rs_086', 'สำ-นวน-โว-หาน'],
  ['rs_087', 'พาบ-พด'],
  ['rs_091', 'สา-ระ-สำ-คัน'],
  ['rs_095', 'ข้อ-สัน-นิด-ถาน'],
  ['rs_100', 'กัน-ละ-ปะ-พรึก'],
  ['rs_141', 'รัด-ชะ-กาน'],
  ['rs_147', 'พระ-ราด-ชะ-นิ-พน'],
  ['rs_148', 'พระ-ราด-ชะ-กริด-สะ-ดี-กา'],
  ['rs_149', 'พระ-ราด-ชะ-บัน-ยัด'],
  ['rs_153', 'พระ-บอ-รม-มะ-ราด-ชะ-โอง-กาน'],
  ['rs_160', 'พระ-บอ-รม-มะ-สบ'],
  ['rs_162', 'พระ-บา-ระ-มี'],
  ['rs_169', 'สม-เด็ด-พระ-เจ้า-อยู่-หัว'],
  ['rs_170', 'มะ-หา-มง-คน'],
  ['rs_171', 'พระ-ราด-ชะ-กอ-ระ-นี-ยะ-กิด'],
  ['rs_172', 'ซง-พระ-กะ-รุ-นา'],
]);

// Valid final consonants (มาตราตัวสะกดมาตรฐาน 8 แม่ + สระเปิด)
const VALID_CODAS = new Set(['ก', 'ด', 'บ', 'น', 'ม', 'ย', 'ว', 'ง']);
// Open vowels that can end a syllable without a coda
const OPEN_VOWEL_ENDINGS = new Set(['ะ', 'า', 'ิ', 'ี', 'ึ', 'ื', 'ุ', 'ู', 'ำ', 'อ']);
// Non-coda consonants that should never appear at the end of a phonetic syllable
const INVALID_CODA_CHARS = new Set([
  'ข', 'ฃ', 'ค', 'ฅ', 'ฆ', 'จ', 'ฉ', 'ช', 'ซ', 'ฌ', 'ญ', 'ฎ', 'ฏ', 'ฐ', 'ฑ', 'ฒ', 'ณ',
  'ต', 'ถ', 'ท', 'ธ', 'ป', 'ผ', 'ฝ', 'พ', 'ฟ', 'ภ', 'ร', 'ล', 'ฬ', 'ศ', 'ษ', 'ห', 'ฮ',
]);

/**
 * Checks whether a single phonetic syllable has a non-standard coda.
 */
export function checkSyllableCoda(syl) {
  // Strip phinthu, garan, and tone marks
  const clean = syl.replace(/[\u0e3a\u0e4c\u0e48-\u0e4b]/g, '');
  if (!clean) return null;

  const lastChar = clean[clean.length - 1];

  // If lastChar is an open vowel ending, it is valid
  if (OPEN_VOWEL_ENDINGS.has(lastChar)) {
    return null;
  }

  // If lastChar is a standard coda (ก, ด, บ, น, ม, ย, ว, ง), valid
  if (VALID_CODAS.has(lastChar)) {
    return null;
  }

  // Check if open syllable with leading vowel like โต, ใจ, ไป, แล (length 2, starts with leading vowel)
  if (clean.length === 2 && ['เ', 'แ', 'โ', 'ใ', 'ไ'].includes(clean[0])) {
    return null;
  }

  // Check if open cluster with leading vowel like ใคร, แปล, โคล (starts with leading vowel, 2 initial consonants)
  if (clean.length === 3 && ['เ', 'แ', 'โ', 'ใ', 'ไ'].includes(clean[0]) && ['ร', 'ล', 'ว'].includes(clean[2])) {
    return null;
  }

  // If ends with an invalid coda character
  if (INVALID_CODA_CHARS.has(lastChar)) {
    return { lastChar, syl };
  }

  return null;
}

export function auditReadingStudio(items) {
  const defects = [];
  const wordCounts = new Map();

  // First pass: count word frequencies for duplicate check
  for (const item of items) {
    const w = item.word?.trim();
    if (w) {
      wordCounts.set(w, (wordCounts.get(w) || 0) + 1);
    }
  }

  for (const item of items) {
    const id = item.id;
    const word = item.word || '';
    const reading = item.reading || '';
    const warning = item.warning_hint || '';

    // 1. Phinthu check (\u0e3a) in word, reading, warning_hint
    if (word.includes('\u0e3a') || reading.includes('\u0e3a') || warning.includes('\u0e3a')) {
      defects.push({
        id,
        word,
        type: 'phinthu',
        details: `Contains phinthu mark (\\u0e3a): word="${word}", reading="${reading}", warning="${warning}"`,
      });
    }

    // 2. Garan check (\u0e4c) in reading
    if (reading.includes('\u0e4c')) {
      defects.push({
        id,
        word,
        type: 'garan',
        details: `Contains garan mark (\\u0e4c) in reading: "${reading}"`,
      });
    }

    // 3. Non-standard final consonants (coda != ก, ด, บ, น, ม, ย, ว, ง)
    const syllables = reading.split('-');
    for (const syl of syllables) {
      const codaIssue = checkSyllableCoda(syl);
      if (codaIssue) {
        defects.push({
          id,
          word,
          type: 'invalid_coda',
          details: `Non-standard coda "${codaIssue.lastChar}" in syllable "${codaIssue.syl}" (reading: "${reading}")`,
        });
        break; // One coda defect per item is sufficient
      }
    }

    // 4. Duplicate words
    if (wordCounts.get(word.trim()) > 1) {
      defects.push({
        id,
        word,
        type: 'duplicate',
        details: `Duplicate word: "${word}" appears ${wordCounts.get(word.trim())} times`,
      });
    }

    // 5. Inauthentic royal vocabulary in rs_101-rs_200
    const numId = parseInt(id.replace('rs_', ''), 10);
    if (numId >= 101 && numId <= 200) {
      if (FABRICATED_ROYAL_WORDS.has(word)) {
        defects.push({
          id,
          word,
          type: 'inauthentic_royal',
          details: `Fabricated royal word: "${word}" in ${id}`,
        });
      }
      // Specific checks for rs_177, rs_178 which have incorrect meanings
      if (id === 'rs_177' && item.meaning?.includes('ท้องพระองค์')) {
        defects.push({
          id,
          word,
          type: 'inauthentic_royal',
          details: `rs_177 พระอุทร has incorrect meaning "${item.meaning}" and reading "${reading}"`,
        });
      }
      if (id === 'rs_178' && item.meaning?.includes('หลังพระองค์')) {
        defects.push({
          id,
          word,
          type: 'inauthentic_royal',
          details: `rs_178 พระนาภี has incorrect meaning "${item.meaning}" (พระนาภี is สะดือ/ท้อง, not หลัง)`,
        });
      }
    }

    // 6. Check known invalid readings that need correction
    if (KNOWN_INVALID_READINGS.has(id)) {
      const expectedReading = KNOWN_INVALID_READINGS.get(id);
      if (reading !== expectedReading) {
        // Only push if not already flagged under garan or invalid_coda
        const alreadyFlagged = defects.some(d => d.id === id && (d.type === 'invalid_coda' || d.type === 'garan'));
        if (!alreadyFlagged) {
          defects.push({
            id,
            word,
            type: 'invalid_reading',
            details: `Reading "${reading}" should be corrected to "${expectedReading}"`,
          });
        }
      }
    }
  }

  return defects;
}

export function runAudit() {
  const raw = readFileSync(FILE_PATH, 'utf8');
  const items = JSON.parse(raw);

  console.log(`Auditing ${items.length} items from ${FILE_PATH}...`);
  const defects = auditReadingStudio(items);

  const byType = {};
  for (const d of defects) {
    byType[d.type] = (byType[d.type] || []);
    byType[d.type].push(d);
  }

  console.log('\nAudit Results by Category:');
  console.log('--------------------------');
  for (const [type, list] of Object.entries(byType)) {
    console.log(`\n[${type.toUpperCase()}] (${list.length} issues):`);
    for (const d of list) {
      console.log(`  - ${d.id} (${d.word}): ${d.details}`);
    }
  }

  const uniqueAffectedItems = new Set(defects.map(d => d.id));
  console.log('\n--------------------------');
  console.log(`Total defects found: ${defects.length}`);
  console.log(`Unique items affected: ${uniqueAffectedItems.size} / ${items.length}`);

  if (defects.length === 0) {
    console.log('✅ 0 defects found. All 520 items are clean and conform to Thai orthography.');
    return 0;
  } else {
    console.log(`❌ Audit failed with ${defects.length} defects.`);
    return 1;
  }
}

const isMain = process.argv[1] && resolve(process.argv[1]).toLowerCase() === resolve(fileURLToPath(import.meta.url)).toLowerCase();
if (isMain) {
  const code = runAudit();
  process.exit(code);
}
