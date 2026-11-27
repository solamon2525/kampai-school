import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const sandbox = { window: undefined, globalThis: {} };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
runInNewContext(
  readFileSync(new URL('../public/games/thai/thai-mario-vocab/rules.js', import.meta.url), 'utf8'),
  sandbox
);
const rules = sandbox.ThaiMarioRules;

const CFG = {
  LIVES: 5,
  MAX_LIVES: 5,
  CORRECT_WORD_POINTS: 100,
  STREAK_BONUS: 25,
  COIN_POINTS: 20,
  STOMP_POINTS: 50,
  STAGE_CLEAR_BONUS: 250,
  HEART_BONUS_POINTS: 80,
  STAR_THRESHOLDS: [600, 1500, 2600],
};

test('initializes with 5 hearts and zero score', () => {
  const s = rules.createRoundState(CFG);
  assert.equal(s.lives, 5);
  assert.equal(s.score, 0);
  assert.equal(s.isGameOver, false);
});

test('correct words increment score and streak bonus', () => {
  const s = rules.createRoundState(CFG);
  const r1 = rules.applyCorrectWord(s, { correct: 'กะเพรา', hint: 'ok' }, CFG);
  const r2 = rules.applyCorrectWord(s, { correct: 'กะทิ', hint: 'ok' }, CFG);
  assert.equal(r1.pointsAdded, 100);
  assert.equal(r2.pointsAdded, 125);
  assert.equal(s.score, 225);
  assert.equal(s.correct, 2);
  assert.equal(s.streak, 2);
});

test('wrong word reduces 1 heart, resets streak, and triggers game over at 0', () => {
  const s = rules.createRoundState(CFG);
  rules.applyCorrectWord(s, { correct: 'กะเพรา' }, CFG);
  assert.equal(s.streak, 1);

  for (let i = 1; i <= 4; i++) {
    const res = rules.applyWrongWord(s, { correct: 'กะเพรา', wrong: 'กระเพรา', hint: 'ไม่มี ร' });
    assert.equal(res.lives, 5 - i);
    assert.equal(res.isGameOver, false);
    assert.equal(s.streak, 0);
  }

  const finalRes = rules.applyWrongWord(s, { correct: 'อนุญาต', wrong: 'อนุญาติ', hint: 'ไม่มีสระอิ' });
  assert.equal(finalRes.lives, 0);
  assert.equal(finalRes.isGameOver, true);
  assert.equal(s.isGameOver, true);
});

test('extra heart caps at 5 and awards bonus when full', () => {
  const s = rules.createRoundState(CFG);
  const full = rules.applyExtraHeart(s, CFG);
  assert.equal(full.gained, false);
  assert.equal(full.lives, 5);
  assert.equal(s.score, 80);

  rules.applyHazardHit(s);
  assert.equal(s.lives, 4);
  const healed = rules.applyExtraHeart(s, CFG);
  assert.equal(healed.gained, true);
  assert.equal(s.lives, 5);
});

test('buildStageWordSlots is deterministic with same seed', () => {
  const world = {
    wordZones: [
      { tileX: 10, highY: 5.8, lowY: 10.6 },
      { tileX: 20, highY: 8.2, lowY: 10.6 },
      { tileX: 30, highY: 5.8, lowY: 10.6 },
    ],
    pairs: [
      { correct: 'กะเพรา', wrong: 'กระเพรา', hint: 'h1' },
      { correct: 'อนุญาต', wrong: 'อนุญาติ', hint: 'h2' },
      { correct: 'สังเกต', wrong: 'สังเกตุ', hint: 'h3' },
    ],
  };
  const a = rules.buildStageWordSlots(world, rules.createRng(4242));
  const b = rules.buildStageWordSlots(world, rules.createRng(4242));
  assert.deepEqual(a, b);
});
