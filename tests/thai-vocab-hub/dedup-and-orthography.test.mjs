import test from 'node:test';
import assert from 'node:assert/strict';
import { dedupAndAuditWords, ORTHOGRAPHY_FIXES } from '../../scripts/thai-vocab/dedup-and-correct.mjs';

test('dedupAndAuditWords skips existing words and tags them with existing category', () => {
  const sample = [
    { word: 'กตัญญู', source: 'doc1' },
    { word: 'เกษตรกร', source: 'doc1' },
    { word: 'คำแปลกใหม่ที่ไม่เคยมี', source: 'doc1' }
  ];
  const existingMap = new Map([
    ['กตัญญู', new Set(['lesson'])],
    ['เกษตรกร', new Set(['lesson'])]
  ]);
  const result = dedupAndAuditWords(sample, existingMap);

  assert.equal(result.skippedWords.length, 2);
  assert.equal(result.newCandidates.length, 1);
  assert.equal(result.newCandidates[0].word, 'คำแปลกใหม่ที่ไม่เคยมี');
  assert.equal(result.skippedWords[0].word, 'กตัญญู');
  assert.ok(result.skippedWords[0].existingCategories.includes('lesson'));
});

test('ORTHOGRAPHY_FIXES contains Royal Society fixes for OCR and common typos', () => {
  assert.equal(ORTHOGRAPHY_FIXES['กบในกะลำครอบ'], 'กบในกะลาครอบ');
  assert.equal(ORTHOGRAPHY_FIXES['กิ้งกำไดท้อง'], 'กิ้งก่าได้ทอง');
  assert.equal(ORTHOGRAPHY_FIXES['กำ ดดั'], 'กำจัด');
  assert.equal(ORTHOGRAPHY_FIXES['กำ นลั'], 'กำนัล');
  assert.equal(ORTHOGRAPHY_FIXES['จำ้ละหวนั่'], 'จ้าละหวั่น');
  assert.equal(ORTHOGRAPHY_FIXES['ฌำณ'], 'ฌาน');
  assert.equal(ORTHOGRAPHY_FIXES['อภิปาย'], 'อภิปราย');
  assert.equal(ORTHOGRAPHY_FIXES['สปาเก็ตตี้'], 'สปาเกตตี');
  assert.equal(ORTHOGRAPHY_FIXES['ปลำยปล้ืม'], 'ปลาบปลื้ม');
  assert.equal(ORTHOGRAPHY_FIXES['ตกั๊แตน'], 'ตั๊กแตน');
  assert.equal(ORTHOGRAPHY_FIXES['ผดำักนัรุก ผลดักนัรับ'], 'ผลัดกันรุกผลัดกันรับ');
});
