import test from 'node:test';
import assert from 'node:assert/strict';
import { categorizeWord } from '../../scripts/thai-vocab/categorize-and-integrate.mjs';

test('categorizeWord assigns correct category by linguistic rules', () => {
  assert.equal(categorizeWord('กราบบังคมทูล'), 'royal');
  assert.equal(categorizeWord('กบในกะลาครอบ'), 'idioms');
  assert.equal(categorizeWord('คอมพิวเตอร์'), 'loanwords');
  assert.equal(categorizeWord('กะพริบ'), 'misspelled');
  assert.equal(categorizeWord('กระฉับกระเฉง'), 'reduplication');
  assert.equal(categorizeWord('ขวักไขว่'), 'blends');
  assert.equal(categorizeWord('ขมุกขมัว'), 'leading');
  assert.equal(categorizeWord('กติกา'), 'lesson');
});
