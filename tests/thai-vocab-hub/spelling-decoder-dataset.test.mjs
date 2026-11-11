import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.resolve(__dirname, '../../public/games/thai/thai-vocab-hub/data/words/spelling-decoder.json');

assert.ok(fs.existsSync(dataPath), `spelling-decoder.json must exist at ${dataPath}`);
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

assert.ok(Array.isArray(data.words), 'data.words must be an array');
assert.strictEqual(data.words.length >= 200, true, `Expected >= 200 words, got ${data.words.length}`);

// Verify sections breakdown and schema
const sections = { kod: 0, kon: 0, kob: 0, kok: 0 };
const sectionNames = {
  kod: 'แม่กด',
  kon: 'แม่กน',
  kob: 'แม่กบ',
  kok: 'แม่กก'
};
const soundConsonants = {
  kod: 'ด',
  kon: 'น',
  kob: 'บ',
  kok: 'ก'
};

const seenWords = new Set();

data.words.forEach((w, idx) => {
  assert.ok(w.word && typeof w.word === 'string', `Word at [${idx}] must have string word`);
  assert.ok(!seenWords.has(w.word), `Duplicate word found: "${w.word}" at [${idx}]`);
  seenWords.add(w.word);

  assert.ok(w.reading && typeof w.reading === 'string', `Word "${w.word}" must have string reading`);
  assert.ok(['kod', 'kon', 'kob', 'kok'].includes(w.targetSection), `Invalid targetSection "${w.targetSection}" in "${w.word}"`);
  assert.strictEqual(w.sectionName, sectionNames[w.targetSection], `sectionName in "${w.word}" must be "${sectionNames[w.targetSection]}"`);
  assert.ok(w.surfaceConsonant && typeof w.surfaceConsonant === 'string', `Word "${w.word}" must have string surfaceConsonant`);
  assert.strictEqual(w.soundConsonant, soundConsonants[w.targetSection], `soundConsonant in "${w.word}" must be "${soundConsonants[w.targetSection]}"`);

  assert.ok(w.meaning && typeof w.meaning === 'string', `Word "${w.word}" must have string meaning`);
  assert.ok(w.emoji && typeof w.emoji === 'string', `Word "${w.word}" must have string emoji`);

  // Phonics decomposition validation
  const pd = w.phonicsDecomposition;
  assert.ok(pd && typeof pd === 'object', `Word "${w.word}" must have object phonicsDecomposition`);
  assert.ok(pd.initial && typeof pd.initial === 'string', `Word "${w.word}" phonicsDecomposition.initial must exist`);
  assert.ok(pd.initialName && typeof pd.initialName === 'string', `Word "${w.word}" phonicsDecomposition.initialName must exist`);
  assert.ok(pd.vowel && typeof pd.vowel === 'string', `Word "${w.word}" phonicsDecomposition.vowel must exist`);
  assert.ok(pd.vowelName && typeof pd.vowelName === 'string', `Word "${w.word}" phonicsDecomposition.vowelName must exist`);
  assert.ok(pd.finalSurface && typeof pd.finalSurface === 'string', `Word "${w.word}" phonicsDecomposition.finalSurface must exist`);
  assert.ok(pd.finalSound && typeof pd.finalSound === 'string', `Word "${w.word}" phonicsDecomposition.finalSound must exist`);
  assert.strictEqual(pd.finalSound, soundConsonants[w.targetSection], `Word "${w.word}" phonicsDecomposition.finalSound must match section sound`);
  assert.ok(pd.phonicsSpelling && typeof pd.phonicsSpelling === 'string', `Word "${w.word}" phonicsDecomposition.phonicsSpelling must exist`);

  sections[w.targetSection]++;
});

assert.ok(sections.kod >= 70, `kod words must be >= 70, got ${sections.kod}`);
assert.ok(sections.kon >= 45, `kon words must be >= 45, got ${sections.kon}`);
assert.ok(sections.kob >= 35, `kob words must be >= 35, got ${sections.kob}`);
assert.ok(sections.kok >= 25, `kok words must be >= 25, got ${sections.kok}`);

console.log('✅ Dataset test passed with total words:', data.words.length);
console.log('Section counts:', sections);
