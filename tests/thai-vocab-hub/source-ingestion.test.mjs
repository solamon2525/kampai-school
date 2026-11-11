import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeThaiWord, extractAllRawWords } from '../../scripts/thai-vocab/ingest-sources.mjs';

test('normalizeThaiWord cleans whitespace, numbers, and abnormal zero-width spaces', () => {
  assert.equal(normalizeThaiWord(' ๑.  บ้าน \u200B'), 'บ้าน');
  assert.equal(normalizeThaiWord('12. บิดา'), 'บิดา');
  assert.equal(normalizeThaiWord('สึ นามิ'), 'สึนามิ');
  assert.equal(normalizeThaiWord(' ๑,๐๔๙ แฮนด์ '), 'แฮนด์');
});

test('extractAllRawWords loads entries across all 4 sources', () => {
  const words = extractAllRawWords();
  assert.ok(words.length >= 3500, `Expected >= 3500 words, got ${words.length}`);
  assert.ok(words.some(w => w.word === 'บ้าน'), 'Expected "บ้าน" in extracted words');
  assert.ok(words.some(w => w.word === 'กตัญญู'), 'Expected "กตัญญู" in extracted words');
  assert.ok(words.some(w => w.word === 'ธารลึก'), 'Expected "ธารลึก" in extracted words');
});
