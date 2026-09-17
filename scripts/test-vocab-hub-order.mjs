import assert from 'node:assert/strict';
import { CATEGORY_SLUGS, normalizeOrder, isOrderPayload, acceptsMessage } from '../public/games/english/vocab-hub-order.mjs';

assert.equal(CATEGORY_SLUGS.length, 29);
assert.deepEqual(normalizeOrder(null), CATEGORY_SLUGS);
assert.deepEqual(normalizeOrder(['birds', 'birds', 'removed', 'colors']),
  ['birds', 'colors', ...CATEGORY_SLUGS.filter(s => !['birds', 'colors'].includes(s))]);
assert.deepEqual(normalizeOrder({ bad: true }), CATEGORY_SLUGS);
assert.equal(isOrderPayload([...CATEGORY_SLUGS].reverse()), true);
for (const invalid of [null, {}, ['birds', 'birds'], ['removed'], [1], []]) {
  assert.equal(isOrderPayload(invalid), false);
}
const frame = {};
assert.equal(acceptsMessage({ origin: 'https://school.test', source: frame }, frame, 'https://school.test'), true);
assert.equal(acceptsMessage({ origin: 'https://evil.test', source: frame }, frame, 'https://school.test'), false);
assert.equal(acceptsMessage({ origin: 'https://school.test', source: {} }, frame, 'https://school.test'), false);
assert.equal(acceptsMessage({ origin: 'https://school.test', source: null }, null, 'https://school.test'), false);
console.log('PASS: category reconciliation, save validation, origin/source boundaries');
