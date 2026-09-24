import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  ENGINE_VERSION,
  evaluateMath24Ast,
  generateQuestionSet,
  validateAnswer,
} from '../supabase/functions/_shared/classroom-competition-engine.mjs';

const activities = ['math24', 'improper_to_mixed', 'mixed_to_improper', 'fraction_add_sub', 'mixed'];
const difficulties = ['easy', 'medium', 'hard'];
let generated = 0;

for (let seed = 1; seed <= 1200; seed += 1) {
  for (const difficulty of difficulties) {
    for (const activityKey of activities) {
      const first = generateQuestionSet({ activityKey, difficulty, count: 10, seed });
      const second = generateQuestionSet({ activityKey, difficulty, count: 10, seed });
      assert.deepEqual(first, second, `seed ${seed} must be deterministic`);
      assert.equal(new Set(first.map((question) => question.canonicalKey)).size, first.length, `seed ${seed} contains duplicates`);
      for (const question of first) {
        assert.ok(question.canonicalKey, 'canonical key required');
        if (question.prompt.kind === 'math24') {
          assert.equal(evaluateMath24Ast(question.answerKey.solution, question.prompt.numbers), 24);
          assert.equal(validateAnswer(question, { ast: question.answerKey.solution }), true);
        } else if (question.answerKey.kind === 'mixed_number') {
          assert.equal(validateAnswer(question, question.answerKey), true);
          assert.equal(validateAnswer(question, { ...question.answerKey, whole: question.answerKey.whole + 1 }), false);
        } else {
          assert.equal(validateAnswer(question, question.answerKey), true);
          assert.equal(validateAnswer(question, { numerator: question.answerKey.numerator + 1, denominator: question.answerKey.denominator }), false);
        }
      }
      generated += first.length;
    }
  }
}

const source = [1, 2, 3, 4];
assert.throws(() => evaluateMath24Ast({ type: 'number', index: 0, value: 1 }, source), /source_numbers_not_used_once/);
assert.throws(() => evaluateMath24Ast({
  type: 'operation', op: '*',
  left: { type: 'number', index: 0, value: 1 },
  right: { type: 'number', index: 0, value: 1 },
}, source), /neutral_operation|source_numbers_not_used_once/);
assert.throws(() => evaluateMath24Ast({
  type: 'operation', op: '*',
  left: { type: 'number', index: 0, value: 1 },
  right: {
    type: 'operation', op: '*',
    left: { type: 'number', index: 1, value: 2 },
    right: {
      type: 'operation', op: '*',
      left: { type: 'number', index: 2, value: 3 },
      right: { type: 'number', index: 3, value: 4 },
    },
  },
}, source), /neutral_operation/);
assert.throws(() => evaluateMath24Ast({
  type: 'operation', op: '/',
  left: { type: 'number', index: 2, value: 3 },
  right: { type: 'number', index: 1, value: 2 },
}, source), /non_integer_division/);

console.log(`classroom competition engine ${ENGINE_VERSION}: ${generated.toLocaleString()} generated questions verified`);
console.log('determinism, uniqueness, answer keys, fraction forms, and strict Game 24 rules: PASS');

const migration = await readFile(new URL('../supabase/migrations/477_classroom_competitions.sql', import.meta.url), 'utf8');
const tables = [
  'classroom_competitions', 'classroom_competition_teams', 'classroom_competition_members',
  'classroom_competition_devices', 'classroom_competition_questions',
  'classroom_competition_attempts', 'classroom_competition_results',
];
for (const table of tables) {
  assert.match(migration, new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`));
}
assert.match(migration, /SECURITY INVOKER/g);
assert.match(migration, /REVOKE ALL ON FUNCTION public\.record_classroom_competition_attempt[\s\S]+FROM PUBLIC, anon, authenticated/);
assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.record_classroom_competition_attempt[\s\S]+TO service_role/);
assert.match(migration, /REVOKE ALL ON TABLE[\s\S]+FROM anon/);
assert.doesNotMatch(await readFile(new URL('../supabase/functions/_shared/classroom-competition-engine.mjs', import.meta.url), 'utf8'), /\beval\s*\(/);
console.log('RLS, service-role-only RPC, anon revocation, and no-eval guards: PASS');
