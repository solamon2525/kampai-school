import test from 'node:test';
import assert from 'node:assert/strict';
import { enrichWordItem, validateEnrichedItem } from '../../scripts/thai-vocab/enrich-pedagogy.mjs';

test('enrichWordItem creates complete pedagogical payload without placeholders', () => {
  const item = enrichWordItem('กติกา', 'lesson');
  assert.equal(item.word, 'กติกา');
  assert.equal(item.reading, 'กะ-ติ-กา');
  assert.ok(item.meaning && item.meaning.length >= 5);
  assert.equal(item.pos, 'คำนาม');
  assert.ok(item.emoji);
  assert.ok(item.example && item.example.includes('กติกา'));
  assert.ok(!item.example.includes('คุณครูสอนให้นักเรียนเข้าใจความหมายของ'));
  assert.equal(item.content_status, 'approved');
});

test('validateEnrichedItem enforces strict schema rules', () => {
  const valid = enrichWordItem('เนรมิต', 'difficult');
  const res = validateEnrichedItem(valid);
  assert.equal(res.isValid, true);
  assert.equal(res.errors.length, 0);

  const invalid = {
    word: 'ทดสอบ',
    example: 'คุณครูสอนให้นักเรียนเข้าใจความหมายของคำว่า ทดสอบ'
  };
  const invalidRes = validateEnrichedItem(invalid);
  assert.equal(invalidRes.isValid, false);
  assert.ok(invalidRes.errors.some(e => e.includes('placeholder')));
});
