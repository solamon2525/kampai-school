import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const dataCode = fs.readFileSync(path.join(root, 'public/games/thai/thai-vocab-hub/data.js'), 'utf8');
const matchCode = fs.readFileSync(path.join(root, 'public/games/thai/thai-vocab-hub/match-engine.js'), 'utf8');

const ctx = { window: {} };
vm.runInNewContext(dataCode, ctx);
vm.runInNewContext(matchCode, ctx);

const api = ctx.window.ThaiVocabMatch;
assert.ok(api, 'ThaiVocabMatch must be defined on window');

// 1. buildWavePairs on misspelled must use meaning (not [reading]) and deduplicate identical meanings
const misspelledPool = ctx.window.GAME_DATA.words.misspelled.filter(w => w && w.content_status !== 'quarantined');
const pairs = api.buildWavePairs(misspelledPool.slice(0, 8), 'misspelled', misspelledPool);
assert.equal(pairs.length, 8);
pairs.forEach((p) => {
  assert.ok(p.rightText && !p.rightText.startsWith('['), `rightText must be meaning, got: ${p.rightText}`);
  assert.equal(p.rightText, p.wordItem.meaning.trim());
});

// 2. buildWavePairs on antonyms pairs word <-> partner.word via pair_id
const antonymPool = ctx.window.GAME_DATA.words.antonyms.filter(w => w && w.content_status !== 'quarantined');
const antonymDeck = api.createMatchDeck(antonymPool, 'antonyms');
const antonymWave = antonymDeck.drawWave(6);
assert.equal(antonymWave.length, 6);
antonymWave.forEach((p) => {
  assert.notEqual(p.leftText, p.rightText, 'antonym pair must match word with its opposite word');
});

// 3. Non-repeating deck across 3 waves of 6 pairs = 18 unique words
const deck = api.createMatchDeck(misspelledPool, 'misspelled');
const w1 = deck.drawWave(6);
const w2 = deck.drawWave(6);
const w3 = deck.drawWave(6);
assert.equal(w1.length, 6);
assert.equal(w2.length, 6);
assert.equal(w3.length, 6);
const all18 = new Set([...w1, ...w2, ...w3].map(p => p.leftText));
assert.equal(all18.size, 18, '3 waves of 6 pairs must yield 18 unique words');

// 4. Exhausting a small pool reshuffles cleanly without undefined
const smallDeck = api.createMatchDeck(misspelledPool.slice(0, 10), 'misspelled');
const s1 = smallDeck.drawWave(6);
const s2 = smallDeck.drawWave(6);
assert.equal(s1.length, 6);
assert.equal(s2.length, 6);

// 5. Combo multiplier points
assert.equal(api.computeComboPoints(10, 1).points, 10);
assert.equal(api.computeComboPoints(10, 1).multiplier, 1);
assert.equal(api.computeComboPoints(10, 3).points, 15);
assert.equal(api.computeComboPoints(10, 3).multiplier, 1.5);
assert.equal(api.computeComboPoints(10, 5).points, 20);
assert.equal(api.computeComboPoints(10, 5).multiplier, 2);

console.log('✅ Task 1 matching unit tests passed!');
