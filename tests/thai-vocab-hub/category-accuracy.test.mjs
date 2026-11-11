import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

test('blends only contain valid Thai consonant clusters', () => {
  const blends = JSON.parse(fs.readFileSync('public/games/thai/thai-vocab-hub/data/words/blends.json', 'utf8'));
  const invalid = ['โศกา', 'มลาสา', 'โศก'];
  assert.equal(blends.some(w => invalid.includes(w.word)), false, 'Invalid non-cluster words found in blends');
});

test('leading consonants only contain genuine leading consonant words', () => {
  const leading = JSON.parse(fs.readFileSync('public/games/thai/thai-vocab-hub/data/words/leading.json', 'utf8'));
  const invalid = ['สกปรก', 'สคราญ', 'ขโมย', 'เผชิญ', 'ผสม'];
  assert.equal(leading.some(w => invalid.includes(w.word)), false, 'Non-leading words found in leading');
});

test('classifiers do not contain verbs or non-classifier nouns', () => {
  const classifiers = JSON.parse(fs.readFileSync('public/games/thai/thai-vocab-hub/data/words/classifiers.json', 'utf8'));
  const invalid = ['ตอนกิ่ง', 'ใบงาน'];
  assert.equal(classifiers.some(w => invalid.includes(w.word)), false, 'Verbs or nouns found in classifiers');
});

test('homophones contain accurate root word forms', () => {
  const homophones = JSON.parse(fs.readFileSync('public/games/thai/thai-vocab-hub/data/words/homophones.json', 'utf8'));
  const invalid = ['หัวกรี', 'กะรีช้าง', 'เซ็นชื่อ', 'วิถีเซน', 'ทศกันต์'];
  assert.equal(homophones.some(w => invalid.includes(w.word)), false, 'Malformed homophone entries found');
});
