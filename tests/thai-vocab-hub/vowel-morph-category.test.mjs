import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const hubDir = path.resolve(__dirname, '../../public/games/thai/thai-vocab-hub');

// 1. Verify categories.json has vowel-morph category
const categories = JSON.parse(fs.readFileSync(path.join(hubDir, 'data/categories.json'), 'utf8'));
assert.ok(categories.length >= 17, `Must have at least 17 categories, got ${categories.length}`);
const vmCat = categories.find(c => c.slug === 'vowel-morph');
assert.ok(vmCat, 'vowel-morph category must exist in categories.json');
assert.equal(vmCat.icon, '✨');
assert.equal(vmCat.title, 'สระแปลงร่างและสระลดรูป');

// 2. Verify data/words/vowel-morph.json exists and has 200 approved words
const wordsPath = path.join(hubDir, 'data/words/vowel-morph.json');
assert.ok(fs.existsSync(wordsPath), 'data/words/vowel-morph.json must exist');
const words = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
assert.equal(words.length, 200, `Must have exactly 200 approved words, got ${words.length}`);

// 3. Verify words have valid fields (word, reading, meaning, pos, grade, ruleId)
const validRules = ['er_to_i', 'er_to_y', 'a_to_han', 'e_to_taikhu', 'ae_to_taikhu', 'o_reduce', 'ua_reduce', 'or_reduce'];
const ruleCounts = {};
for (const r of validRules) ruleCounts[r] = 0;

for (const w of words) {
  assert.ok(w.word, 'word must exist');
  assert.ok(w.reading, `reading must exist on word "${w.word}"`);
  assert.ok(w.meaning, `meaning must exist on word "${w.word}"`);
  assert.ok(w.pos, `pos must exist on word "${w.word}"`);
  assert.ok(w.grade, `grade must exist on word "${w.word}"`);
  assert.ok(w.ruleId, `ruleId must exist on word "${w.word}"`);
  assert.ok(validRules.includes(w.ruleId), `ruleId "${w.ruleId}" must be valid on word "${w.word}"`);
  assert.equal(w.content_status, 'approved', `word "${w.word}" must be approved`);
  ruleCounts[w.ruleId]++;
}

for (const r of validRules) {
  assert.ok(ruleCounts[r] >= 10, `Rule ${r} must have at least 10 words, got ${ruleCounts[r]}`);
}

console.log('✅ All vowel-morph schema assertions passed!');
console.log('Rule distribution:', ruleCounts);
