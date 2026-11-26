import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const HUB_DIR = path.join(REPO_ROOT, 'public/games/thai/thai-vocab-hub');

const ctx = { window: {} };
ctx.window = ctx;

const dataCode = fs.readFileSync(path.join(HUB_DIR, 'data.js'), 'utf8');
vm.runInNewContext(dataCode, ctx);

const quizEnginePath = path.join(HUB_DIR, 'quiz-engine.js');
const quizEngineCode = fs.readFileSync(quizEnginePath, 'utf8');
vm.runInNewContext(quizEngineCode, ctx);

const Quiz = ctx.window.ThaiVocabQuiz;
assert.ok(Quiz, 'window.ThaiVocabQuiz must be defined');

const GAME_DATA = ctx.window.GAME_DATA;
const misspelledPool = GAME_DATA.words.misspelled;
const homophonesPool = GAME_DATA.words.homophones;
const classifiersPool = GAME_DATA.words.classifiers;

// 1. createQuizDeck: 12 unique words on round 1, 12 different unique words on round 2 (24 unique total)
{
  const deck = Quiz.createQuizDeck(misspelledPool, 'misspelled', 12);
  const round1 = deck.nextRound();
  const round2 = deck.nextRound();

  assert.equal(round1.length, 12, 'round 1 should have 12 words');
  assert.equal(round2.length, 12, 'round 2 should have 12 words');

  const r1Words = new Set(round1.map((w) => w.word));
  const r2Words = new Set(round2.map((w) => w.word));
  assert.equal(r1Words.size, 12, 'round 1 words must be unique');
  assert.equal(r2Words.size, 12, 'round 2 words must be unique');

  const combined = new Set([...r1Words, ...r2Words]);
  assert.equal(combined.size, 24, 'round 1 and round 2 must yield 24 unique words total');

  // Clamps cleanly when pool.length < 12
  const smallPool = misspelledPool.slice(0, 5);
  const smallDeck = Quiz.createQuizDeck(smallPool, 'misspelled', 12);
  const smallRound = smallDeck.nextRound();
  assert.equal(smallRound.length, 5, 'small pool round should clamp to pool.length (5)');
  assert.equal(new Set(smallRound.map((w) => w.word)).size, 5, 'small pool round words must be unique');

  // Excludes quarantined and empty word/meaning items
  const dirtyPool = [
    ...misspelledPool.slice(0, 6),
    { word: 'คำกักกัน', meaning: 'ไม่ควรออก', content_status: 'quarantined' },
    { word: '', meaning: 'ไม่มีคำ' },
    { word: 'ไม่มีความหมาย', meaning: '' },
    { word: '   ', meaning: 'ช่องว่าง' },
  ];
  const cleanDeck = Quiz.createQuizDeck(dirtyPool, 'misspelled', 12);
  const cleanRound = cleanDeck.nextRound();
  assert.equal(cleanRound.length, 6, 'quarantined and empty items must be excluded');
  assert.ok(cleanRound.every((w) => w.content_status !== 'quarantined' && w.word.trim() && w.meaning.trim()));
}

// 2. buildChoiceQuestion: 4 unique options containing wordItem.meaning, cloze when example contains word
{
  const clozeItem = misspelledPool.find((w) => w.example && w.example.includes(w.word));
  assert.ok(clozeItem, 'expected a misspelled item with example containing word');

  const clozeQ = Quiz.buildChoiceQuestion(clozeItem, misspelledPool, 'misspelled');
  assert.equal(clozeQ.kind, 'cloze', 'should produce kind=cloze when example contains word');
  assert.ok(clozeQ.prompt.includes('_____'), 'cloze prompt must mask word with _____');
  assert.ok(!clozeQ.prompt.includes(clozeItem.word), 'cloze prompt must not leak target word');
  assert.equal(clozeQ.answer, clozeItem.meaning);
  assert.equal(clozeQ.options.length, 4, 'choice question must have 4 options');
  assert.equal(new Set(clozeQ.options).size, 4, 'choice options must be unique');
  assert.ok(clozeQ.options.includes(clozeItem.meaning), 'options must include target meaning');
  assert.ok(typeof clozeQ.badge === 'string' && clozeQ.badge.length > 0, 'badge must be non-empty string');

  // Fallback to meaning when example does not contain word
  const noExampleItem = {
    word: 'ทดสอบคำ',
    reading: 'ทด-สอบ-คำ',
    meaning: 'ความหมายทดสอบเฉพาะกิจ',
    example: 'ประโยคนี้ไม่มีคำเป้าหมายอยู่เลย',
  };
  const meaningQ = Quiz.buildChoiceQuestion(noExampleItem, misspelledPool, 'misspelled');
  assert.equal(meaningQ.kind, 'meaning', 'should fall back to kind=meaning when example lacks word');
  assert.ok(meaningQ.prompt.includes(noExampleItem.word), 'meaning prompt should show target word');
  assert.equal(meaningQ.answer, noExampleItem.meaning);
  assert.equal(meaningQ.options.length, 4);
  assert.equal(new Set(meaningQ.options).size, 4);
  assert.ok(meaningQ.options.includes(noExampleItem.meaning));

  // Classifier category
  if (Array.isArray(classifiersPool) && classifiersPool.length >= 4) {
    const clsItem = classifiersPool.find((w) => w.classifier_for && (!w.example || !w.example.includes(w.word))) || {
      word: classifiersPool[0].word,
      meaning: classifiersPool[0].meaning,
      classifier_for: classifiersPool[0].classifier_for || 'ช้าง',
      example: '',
    };
    const clsQ = Quiz.buildChoiceQuestion(clsItem, classifiersPool, 'classifiers');
    assert.equal(clsQ.kind, 'classifier', 'classifiers with classifier_for and no cloze should use kind=classifier');
    assert.equal(clsQ.answer, clsItem.meaning);
    assert.equal(clsQ.options.length, 4);
    assert.equal(new Set(clsQ.options).size, 4);
    assert.ok(clsQ.options.includes(clsItem.meaning));
  }
}

// 3. buildListenQuestion: 4 unique word options, preferring same-reading for homophones & same-initial-char
{
  // Find a reading group in homophones with >= 4 words (or >= 2 words)
  const byReading = new Map();
  for (const item of homophonesPool) {
    if (!item.reading || item.content_status === 'quarantined') continue;
    if (!byReading.has(item.reading)) byReading.set(item.reading, []);
    byReading.get(item.reading).push(item);
  }
  const largeGroup = [...byReading.values()].find((g) => g.length >= 4) || [...byReading.values()].find((g) => g.length >= 2);
  assert.ok(largeGroup && largeGroup.length >= 2, 'expected homophones with shared reading');

  const target = largeGroup[0];
  const listenQ = Quiz.buildListenQuestion(target, homophonesPool, 'homophones');
  assert.equal(listenQ.answer, target.word);
  assert.equal(listenQ.options.length, 4, 'listen question must have 4 options');
  assert.equal(new Set(listenQ.options).size, 4, 'listen options must be unique');
  assert.ok(listenQ.options.includes(target.word), 'listen options must include target word');
  assert.ok(typeof listenQ.prompt === 'string' && listenQ.prompt.length > 0);
  assert.ok(typeof listenQ.clue === 'string' && listenQ.clue.length > 0);

  // Verify same-reading decoys are preferred when available
  const sameReadingSet = new Set(largeGroup.map((w) => w.word));
  const sameReadingInOptions = listenQ.options.filter((opt) => sameReadingSet.has(opt)).length;
  const expectedSameReadingCount = Math.min(4, sameReadingSet.size);
  assert.equal(
    sameReadingInOptions,
    expectedSameReadingCount,
    `homophones listen question should prefer same-reading decoys (expected ${expectedSameReadingCount}, got ${sameReadingInOptions})`
  );

  // Verify same-initial-char preference when available (e.g. non-homophone pool)
  const syntheticTarget = { word: 'กานดา', reading: 'กาน-ดา', meaning: 'หญิงสาวที่น่ารัก' };
  const syntheticPool = [
    syntheticTarget,
    { word: 'การุณย์', reading: 'กา-รุน', meaning: 'ความเอ็นดู' },
    { word: 'กิริยา', reading: 'กิ-ริ-ยา', meaning: 'อาการที่แสดงออก' },
    { word: 'กุศล', reading: 'กุ-สน', meaning: 'ความดี บุญ' },
    { word: 'ขยัน', reading: 'ขะ-หยัน', meaning: 'หมั่นเพียร' },
    { word: 'คณิต', reading: 'คะ-นิด', meaning: 'วิชาคำนวณ' },
  ];
  const initialQ = Quiz.buildListenQuestion(syntheticTarget, syntheticPool, 'misspelled');
  assert.equal(initialQ.options.length, 4);
  assert.equal(new Set(initialQ.options).size, 4);
  assert.ok(initialQ.options.includes('กานดา'));
  const gCount = initialQ.options.filter((w) => w.startsWith('ก')).length;
  assert.equal(gCount, 4, 'should prefer same-initial-char decoys when 3+ are available');
}

// 4. computeQuizCombo: streak 1-2 -> 10 (x1), streak 3-4 -> 15 (x1.5), streak 5+ -> 20 (x2)
{
  const c1 = Quiz.computeQuizCombo(10, 1);
  assert.equal(c1.points, 10);
  assert.equal(c1.multiplier, 1);

  const c2 = Quiz.computeQuizCombo(10, 2);
  assert.equal(c2.points, 10);
  assert.equal(c2.multiplier, 1);

  const c3 = Quiz.computeQuizCombo(10, 3);
  assert.equal(c3.points, 15);
  assert.equal(c3.multiplier, 1.5);

  const c4 = Quiz.computeQuizCombo(10, 4);
  assert.equal(c4.points, 15);
  assert.equal(c4.multiplier, 1.5);

  const c5 = Quiz.computeQuizCombo(10, 5);
  assert.equal(c5.points, 20);
  assert.equal(c5.multiplier, 2);

  const c8 = Quiz.computeQuizCombo(10, 8);
  assert.equal(c8.points, 20);
  assert.equal(c8.multiplier, 2);
}

// 5. computeSpellingDiff & maskHint
{
  const exact = Quiz.computeSpellingDiff('กะเพรา', 'กะเพรา');
  assert.equal(exact.isExact, true);
  assert.equal(exact.targetSlots.every((s) => s.status === 'ok'), true);

  const wrong = Quiz.computeSpellingDiff('กระเพรา', 'กะเพรา');
  assert.equal(wrong.isExact, false);
  assert.equal(wrong.targetSlots[0].status, 'ok');
  assert.ok(wrong.targetSlots.some((s) => s.status === 'wrong' || s.status === 'missing'));
  assert.ok(wrong.maskHint.startsWith('ก '), `maskHint must start with first grapheme, got: ${wrong.maskHint}`);
}

console.log('PASS: all ThaiVocabQuiz unit tests passed.');
