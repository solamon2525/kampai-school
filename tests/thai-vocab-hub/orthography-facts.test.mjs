import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

test('no devanagari characters in synonyms', () => {
  const synonyms = JSON.parse(fs.readFileSync('public/games/thai/thai-vocab-hub/data/words/synonyms.json', 'utf8'));
  const hasDevanagari = synonyms.some(w => /[\u0900-\u097F]/.test(w.word));
  assert.equal(hasDevanagari, false, 'Devanagari script found in synonyms');
});

test('กะพริบ is spelled correctly in misspelled.json', () => {
  const misspelled = JSON.parse(fs.readFileSync('public/games/thai/thai-vocab-hub/data/words/misspelled.json', 'utf8'));
  const hasKaprip = misspelled.some(w => w.word === 'กะปริบ');
  assert.equal(hasKaprip, false, 'กะปริบ found instead of กะพริบ');
  const hasKaphrip = misspelled.some(w => w.word === 'กะพริบ');
  assert.equal(hasKaphrip, true, 'กะพริบ missing in misspelled');
});

test('spelling.json words with sara am, ai, ao belong to Mae Ko Ka', () => {
  const spelling = JSON.parse(fs.readFileSync('public/games/thai/thai-vocab-hub/data/words/spelling.json', 'utf8'));
  const amInKom = spelling.some(w => w.meaning.includes('แม่กม') && w.word.includes('ำ'));
  const aiInKoey = spelling.some(w => w.meaning.includes('แม่เกย') && (w.word.includes('ไ') || w.word.includes('ใ')));
  const aoInKoeo = spelling.some(w => w.meaning.includes('แม่เกอว') && (w.word.includes('เ') && w.word.includes('า')));
  assert.equal(amInKom, false, 'Sara Am wrongly categorized as Mae Kom');
  assert.equal(aiInKoey, false, 'Sara Ai wrongly categorized as Mae Koey');
  assert.equal(aoInKoeo, false, 'Sara Ao wrongly categorized as Mae Koeo');
});
