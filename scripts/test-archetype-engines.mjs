import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const ENGINE_DIR = path.join(REPO_ROOT, 'public/games/engine');

const QUIZ_PATH = path.join(ENGINE_DIR, 'vocab-quiz-engine.js');
const MATCH_PATH = path.join(ENGINE_DIR, 'connect-match-engine.js');
const CLASSIFY_PATH = path.join(ENGINE_DIR, 'classify-bucket-engine.js');

// Load all 3 IIFE engines into a shared VM context simulating browser window
const ctx = {
  window: {},
  console,
  Math,
  Date,
  Set,
  Map,
  Array,
  Object,
  Number,
  String,
  Boolean,
  RegExp,
  Intl,
  setTimeout,
  clearTimeout,
};
ctx.window = ctx;
ctx.globalThis = ctx;

for (const filePath of [QUIZ_PATH, MATCH_PATH, CLASSIFY_PATH]) {
  const code = fs.readFileSync(filePath, 'utf8');
  assert.ok(!/submitScore/.test(code), `${path.basename(filePath)} must NOT contain literal string "submitScore"`);
  vm.runInNewContext(code, ctx, { filename: filePath });
}

const Engines = ctx.window.KampaiEngines;
assert.ok(Engines, 'window.KampaiEngines must be defined');
assert.ok(Engines.Quiz, 'window.KampaiEngines.Quiz must be defined');
assert.ok(Engines.ConnectMatch, 'window.KampaiEngines.ConnectMatch must be defined');
assert.ok(Engines.ClassifyBucket, 'window.KampaiEngines.ClassifyBucket must be defined');

// ═══════════════════════════════════════════════════════════════
// 1. KampaiEngines.Quiz (English en-US, Thai th-TH, Science, Social)
// ═══════════════════════════════════════════════════════════════
{
  const Quiz = Engines.Quiz;

  const englishSciencePool = [
    {
      term: 'photosynthesis',
      reading: 'foh-toh-SIN-thuh-sis',
      meaning: 'กระบวนการสร้างอาหารของพืชด้วยแสง',
      example: 'Plants use photosynthesis to make glucose from sunlight.',
      locale: 'en-US',
    },
    {
      term: 'evaporation',
      reading: 'ih-vap-uh-RAY-shun',
      meaning: 'การระเหยของน้ำกลายเป็นไอ',
      example: 'Heat from the sun speeds up evaporation from the ocean.',
      locale: 'en-US',
    },
    {
      term: 'gravity',
      reading: 'GRAV-ih-tee',
      meaning: 'แรงโน้มถ่วงของโลก',
      example: 'Earth pulls objects downward because of gravity.',
      locale: 'en-US',
    },
    {
      term: 'habitat',
      reading: 'HAB-ih-tat',
      meaning: 'ถิ่นที่อยู่อาศัยตามธรรมชาติของสิ่งมีชีวิต',
      example: 'A coral reef is a rich marine habitat.',
      locale: 'en-US',
    },
    {
      term: 'orbit',
      reading: 'OR-bit',
      meaning: 'วงโคจรรอบดาวฤกษ์หรือดาวเคราะห์',
      example: 'The Moon travels in an orbit around Earth.',
      locale: 'en-US',
    },
    {
      term: 'ecosystem',
      reading: 'EE-koh-sis-tum',
      meaning: 'ระบบนิเวศที่สิ่งมีชีวิตสัมพันธ์กับสิ่งแวดล้อม',
      example: 'Forests and ponds are each a distinct ecosystem.',
      locale: 'en-US',
    },
    {
      term: 'quarantined_word',
      reading: 'bad',
      meaning: 'ไม่ควรถูกสุ่มออกมา',
      content_status: 'quarantined',
    },
    {
      term: '',
      meaning: 'invalid empty term',
    },
  ];

  // 1a. createDeck: draws non-repeating rounds and clamps cleanly when items.length < roundSize
  const deck = Quiz.createDeck(englishSciencePool, 4);
  assert.equal(deck.total(), 6, 'quarantined and empty items must be excluded');
  const round1 = deck.nextRound();
  const round2 = deck.nextRound();
  assert.equal(round1.length, 4, 'round 1 must have 4 items');
  assert.equal(round2.length, 4, 'round 2 must have 4 items');
  const r1Terms = new Set(round1.map((i) => i.term));
  const r2Terms = new Set(round2.map((i) => i.term));
  assert.equal(r1Terms.size, 4, 'round 1 items must be unique');
  assert.equal(r2Terms.size, 4, 'round 2 items must be unique');
  // At least the remaining 2 unseen items must appear in round 2 before reshuffle
  const combined = new Set([...r1Terms, ...r2Terms]);
  assert.equal(combined.size, 6, 'all 6 items should be covered across round 1 and round 2 without premature duplicates');

  // Clamping when items.length < roundSize
  const smallDeck = Quiz.createDeck(englishSciencePool.slice(0, 3), 10);
  const smallRound = smallDeck.nextRound();
  assert.equal(smallRound.length, 3, 'roundSize > items.length must clamp cleanly to 3');
  assert.equal(new Set(smallRound.map((i) => i.term)).size, 3);

  // 1b. buildChoiceQuestion with generic { term, reading, meaning, example } + cloze masking
  const photoItem = englishSciencePool[0];
  const clozeQ = Quiz.buildChoiceQuestion(photoItem, englishSciencePool);
  assert.equal(clozeQ.kind, 'cloze', 'should produce cloze when example contains term');
  assert.ok(clozeQ.prompt.includes('_____'), 'cloze prompt must mask term with _____');
  assert.ok(!clozeQ.prompt.toLowerCase().includes('photosynthesis'), 'cloze prompt must not leak target term');
  assert.equal(clozeQ.answer, photoItem.meaning);
  assert.equal(clozeQ.options.length, 4, 'choice question must have 4 options');
  assert.equal(new Set(clozeQ.options).size, 4, 'choice options must be unique');
  assert.ok(clozeQ.options.includes(photoItem.meaning), 'choice options must include answer');

  // Case-insensitive masking check when term appears capitalized in example
  const capItem = {
    term: 'democracy',
    reading: 'dih-MOK-ruh-see',
    meaning: 'ระบอบประชาธิปไตย',
    example: 'Democracy gives citizens a voice in choosing leaders.',
  };
  const capQ = Quiz.buildChoiceQuestion(capItem, englishSciencePool);
  assert.equal(capQ.kind, 'cloze');
  assert.ok(capQ.prompt.includes('_____'));
  assert.ok(!capQ.prompt.toLowerCase().includes('democracy'));

  // Non-cloze fallback (meaning question) when example does not contain term
  const thaiArtsItem = {
    term: 'ระนาดเอก',
    reading: 'ระ-นาด-เอก',
    meaning: 'เครื่องดนตรีไทยประเภทเครื่องตีทำด้วยไม้',
    example: 'วงปี่พาทย์บรรเลงเพลงไทยเดิมอย่างไพเราะ',
  };
  const meaningQ = Quiz.buildChoiceQuestion(thaiArtsItem, englishSciencePool);
  assert.equal(meaningQ.kind, 'meaning');
  assert.ok(meaningQ.prompt.includes('ระนาดเอก'));
  assert.equal(meaningQ.answer, thaiArtsItem.meaning);
  assert.equal(meaningQ.options.length, 4);
  assert.equal(new Set(meaningQ.options).size, 4);

  // 1c. buildListenQuestion returns 4 unique options
  const listenQ = Quiz.buildListenQuestion(englishSciencePool[1], englishSciencePool);
  assert.equal(listenQ.answer, 'evaporation');
  assert.equal(listenQ.options.length, 4, 'listen question must have 4 unique options');
  assert.equal(new Set(listenQ.options).size, 4, 'listen options must be unique');
  assert.ok(listenQ.options.includes('evaporation'));
  assert.equal(listenQ.clue, englishSciencePool[1].meaning);

  // 1d. mode: 'media' vs mode: 'game'
  const mediaSession = Quiz.createSession({
    items: englishSciencePool,
    mode: 'media',
    locale: 'en-US',
    roundSize: 4,
  });
  const mediaState = mediaSession.getState();
  assert.equal(mediaState.mode, 'media');
  assert.equal(mediaState.lives, null, 'media mode must have no lives');
  assert.equal(mediaState.timerEnabled, false, 'media mode must have no timer');
  assert.equal(mediaState.scoreEnabled, false, 'media mode must have no score submission');

  // Wrong answer in media mode never kills session
  const q0 = mediaSession.currentQuestion();
  assert.ok(q0, 'mediaSession must provide currentQuestion()');
  const wrongOpt = q0.options.find((o) => o !== q0.answer);
  const wrongRes = mediaSession.submitAnswer(wrongOpt);
  assert.equal(wrongRes.isCorrect, false);
  assert.equal(wrongRes.livesRemaining, null);
  assert.equal(mediaSession.getState().isGameOver, false, 'media mode must never game-over on wrong answers');

  const gameSession = Quiz.createSession({
    items: englishSciencePool,
    mode: 'game',
    lives: 2,
    timerSeconds: 45,
    roundSize: 4,
  });
  const gameState = gameSession.getState();
  assert.equal(gameState.mode, 'game');
  assert.equal(gameState.lives, 2);
  assert.equal(gameState.timerEnabled, true);
  assert.equal(gameState.scoreEnabled, true);

  const gq0 = gameSession.currentQuestion();
  const gWrong = gq0.options.find((o) => o !== gq0.answer);
  const gRes1 = gameSession.submitAnswer(gWrong);
  assert.equal(gRes1.isCorrect, false);
  assert.equal(gRes1.livesRemaining, 1);
  gameSession.next();
  const gq1 = gameSession.currentQuestion();
  const gRes2 = gameSession.submitAnswer(gq1.options.find((o) => o !== gq1.answer));
  assert.equal(gRes2.livesRemaining, 0);
  assert.equal(gameSession.getState().isGameOver, true);
}

// ═══════════════════════════════════════════════════════════════
// 2. KampaiEngines.ConnectMatch (left/right & term/meaning)
// ═══════════════════════════════════════════════════════════════
{
  const Match = Engines.ConnectMatch;

  // 2a. Generic { left, right } Social / Health / Career dataset
  const socialPairs = [
    { left: 'เชียงใหม่', right: 'ภาคเหนือ' },
    { left: 'ขอนแก่น', right: 'ภาคตะวันออกเฉียงเหนือ' },
    { left: 'ภูเก็ต', right: 'ภาคใต้' },
    { left: 'ชลบุรี', right: 'ภาคตะวันออก' },
    { left: 'พระนครศรีอยุธยา', right: 'ภาคกลาง' },
    { left: 'ตาก', right: 'ภาคตะวันตก' },
    { left: 'duplicate_left', right: 'ภาคเหนือ' }, // duplicate right should be skipped safely
  ];

  const builtSocial = Match.buildWavePairs(socialPairs);
  assert.equal(builtSocial.length, 6, 'duplicate rightText must be deduplicated');
  builtSocial.forEach((p) => {
    assert.ok(p.id, 'pair must have id');
    assert.ok(p.leftText, 'pair must have leftText');
    assert.ok(p.rightText, 'pair must have rightText');
  });

  // 2b. Generic { term, meaning } English/Health dataset
  const healthTerms = [
    { term: 'Carbohydrate', reading: 'คาร์โบไฮเดรต', meaning: 'ให้พลังงานหลักแก่ร่างกาย' },
    { term: 'Protein', reading: 'โปรตีน', meaning: 'ช่วยซ่อมแซมส่วนที่สึกหรอ' },
    { term: 'Vitamin C', reading: 'วิตามินซี', meaning: 'ป้องกันโรคเลือดออกตามไรฟัน' },
    { term: 'Calcium', reading: 'แคลเซียม', meaning: 'เสริมสร้างกระดูกและฟันให้แข็งแรง' },
    { term: 'Fiber', reading: 'ใยอาหาร', meaning: 'ช่วยระบบขับถ่ายให้ทำงานปกติ' },
    { term: 'Iron', reading: 'ธาตุเหล็ก', meaning: 'ช่วยสร้างเม็ดเลือดแดง' },
  ];

  const deck = Match.createDeck(healthTerms);
  assert.equal(deck.total(), 6);
  const w1 = deck.drawWave(4);
  const w2 = deck.drawWave(4);
  assert.equal(w1.length, 4);
  assert.equal(w2.length, 4);
  const seenTerms = new Set([...w1, ...w2].map((p) => p.leftText));
  assert.equal(seenTerms.size, 6, 'drawing across waves covers all 6 unique pairs');
  w1.forEach((p) => {
    assert.ok(p.id && p.leftText && p.rightText);
  });

  // 2c. computeComboPoints scales x1, x1.5, x2
  const c0 = Match.computeComboPoints(10, 0);
  const c2 = Match.computeComboPoints(10, 2);
  const c3 = Match.computeComboPoints(10, 3);
  const c4 = Match.computeComboPoints(10, 4);
  const c5 = Match.computeComboPoints(10, 5);
  const c7 = Match.computeComboPoints(20, 7);
  assert.equal(c0.points, 10);
  assert.equal(c0.multiplier, 1);
  assert.equal(c2.points, 10);
  assert.equal(c2.multiplier, 1);
  assert.equal(c3.points, 15);
  assert.equal(c3.multiplier, 1.5);
  assert.equal(c4.points, 15);
  assert.equal(c4.multiplier, 1.5);
  assert.equal(c5.points, 20);
  assert.equal(c5.multiplier, 2);
  assert.equal(c7.points, 40);
  assert.equal(c7.multiplier, 2);
}

// ═══════════════════════════════════════════════════════════════
// 3. KampaiEngines.ClassifyBucket (Science / Career / Health / English)
// ═══════════════════════════════════════════════════════════════
{
  const Classify = Engines.ClassifyBucket;

  const buckets = [
    { id: 'solid', label: 'ของแข็ง', icon: '🧊' },
    { id: 'liquid', label: 'ของเหลว', icon: '💧' },
    { id: 'gas', label: 'แก๊ส', icon: '💨' },
  ];

  const items = [
    {
      id: 'ice',
      label: 'ก้อนน้ำแข็ง',
      bucketId: 'solid',
      reason: 'อนุภาคเรียงชิดติดกัน คงรูปร่างและปริมาตรได้เอง',
    },
    {
      id: 'water',
      label: 'น้ำดื่ม',
      bucketId: 'liquid',
      reason: 'อนุภาคเคลื่อนที่ผ่านกันได้ ไหลและเปลี่ยนรูปร่างตามภาชนะ',
    },
    {
      id: 'oxygen',
      label: 'แก๊สออกซิเจน',
      bucketId: 'gas',
      reason: 'อนุภาคอยู่ห่างกันมาก ฟุ้งกระจายเต็มภาชนะที่บรรจุ',
    },
    {
      id: 'rock',
      label: 'ก้อนหิน',
      bucketId: 'solid',
      reason: 'มีรูปร่างและปริมาตรคงที่ ไม่ไหลตามภาชนะ',
    },
    {
      id: 'bad',
      label: 'ของกักกัน',
      bucketId: 'solid',
      reason: 'ไม่ควรแสดง',
      content_status: 'quarantined',
    },
  ];

  const mediaSession = Classify.createSession(items, buckets, { mode: 'media' });
  const initState = mediaSession.getState();
  assert.equal(initState.mode, 'media');
  assert.equal(initState.total, 4, 'quarantined items must be filtered out');
  assert.equal(initState.lives, null, 'media mode must have no lives');
  assert.equal(initState.timerEnabled, false, 'media mode must have no timer');
  assert.equal(initState.scoreEnabled, false, 'media mode must have no score submission');

  const current = mediaSession.currentItem();
  assert.ok(current, 'session must have a current item');

  // Wrong answer returns educational reasoning & correctBucket without deducting lives
  const wrongBucket = buckets.find((b) => b.id !== current.bucketId);
  const wrongFeedback = mediaSession.checkAnswer(current, wrongBucket.id);
  assert.equal(wrongFeedback.isCorrect, false);
  assert.equal(wrongFeedback.reason, current.reason);
  assert.equal(wrongFeedback.correctBucket.id, current.bucketId);
  assert.equal(wrongFeedback.correctBucket.label, buckets.find((b) => b.id === current.bucketId).label);
  assert.equal(wrongFeedback.livesRemaining, null);

  // Correct answer returns isCorrect: true + reason + correctBucket
  const rightFeedback = mediaSession.checkAnswer(current, current.bucketId);
  assert.equal(rightFeedback.isCorrect, true);
  assert.equal(rightFeedback.reason, current.reason);
  assert.equal(rightFeedback.correctBucket.id, current.bucketId);

  // Advance through remaining items (4 items total: 3 next() -> index 3, 4th next() -> complete)
  mediaSession.next();
  mediaSession.next();
  mediaSession.next();
  assert.equal(mediaSession.getState().index, 3);
  assert.equal(mediaSession.getState().isComplete, false);
  mediaSession.next();
  assert.equal(mediaSession.getState().isComplete, true, 'after advancing past all 4 items, session is complete');

  // Game mode deducts lives on wrong answers
  const gameSession = Classify.createSession(items, buckets, { mode: 'game', lives: 2 });
  assert.equal(gameSession.getState().lives, 2);
  assert.equal(gameSession.getState().scoreEnabled, true);
  const gItem = gameSession.currentItem();
  const gWrongBucket = buckets.find((b) => b.id !== gItem.bucketId);
  const gf1 = gameSession.checkAnswer(gItem, gWrongBucket.id);
  assert.equal(gf1.isCorrect, false);
  assert.equal(gf1.livesRemaining, 1);
}

console.log('✅ All KampaiEngines archetype unit tests passed!');
