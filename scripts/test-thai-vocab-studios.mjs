import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const dataCode = fs.readFileSync(path.join(root, 'public/games/thai/thai-vocab-hub/data.js'), 'utf8');
const challengeCode = fs.readFileSync(path.join(root, 'public/games/thai/thai-vocab-hub/studio-challenge.js'), 'utf8');

const ctx = { window: {} };
vm.runInNewContext(dataCode, ctx);
vm.runInNewContext(challengeCode, ctx);

const api = ctx.window.ThaiStudioChallenge;
assert.ok(api, 'ThaiStudioChallenge must be defined on window');

// 1. Vowel Morph questions
const mockPresets = [
  {
    id: 'er',
    vowelName: 'สระ เ-อ + ตัวสะกด (แปลงเป็น เ-ิ)',
    ruleType: 'สระเปลี่ยนรูป',
    ruleDesc: 'อ แปลงเป็น ิ',
    examples: [
      { word: 'เกิด', init: 'ก', vowel: 'เ-อ', final: 'ด', reading: 'เกิด', equation: 'กอ-เออ-ดอ = เกิด' },
      { word: 'เดิน', init: 'ด', vowel: 'เ-อ', final: 'น', reading: 'เดิน', equation: 'ดอ-เออ-นอ = เดิน' },
      { word: 'เปิด', init: 'ป', vowel: 'เ-อ', final: 'ด', reading: 'เปิด', equation: 'ปอ-เออ-ดอ = เปิด' },
    ],
  },
  {
    id: 'ua',
    vowelName: 'สระ -ัว + ตัวสะกด (ลด ั เหลือ ว)',
    ruleType: 'สระลดรูป',
    ruleDesc: 'ไม้หันอากาศหายไป',
    examples: [
      { word: 'สวน', init: 'ส', vowel: '-ัว', final: 'น', reading: 'สวน', equation: 'สอ-อัว-นอ = สวน' },
      { word: 'รวย', init: 'ร', vowel: '-ัว', final: 'ย', reading: 'รวย', equation: 'รอ-อัว-ยอ = รวย' },
    ],
  },
  {
    id: 'o',
    vowelName: 'สระ โ-ะ + ตัวสะกด (ลดรูปหมด)',
    ruleType: 'สระลดรูป',
    ruleDesc: 'สระหายหมด',
    examples: [
      { word: 'มด', init: 'ม', vowel: 'โ-ะ', final: 'ด', reading: 'มด', equation: 'มอ-โอะ-ดอ = มด' },
      { word: 'กบ', init: 'ก', vowel: 'โ-ะ', final: 'บ', reading: 'กบ', equation: 'กอ-โอะ-บอ = กบ' },
    ],
  },
  {
    id: 'ae',
    vowelName: 'สระ แ-ะ + ตัวสะกด (แปลงเป็น แ-็)',
    ruleType: 'สระเปลี่ยนรูป',
    ruleDesc: 'ะ แปลงเป็น ็',
    examples: [
      { word: 'แข็ง', init: 'ข', vowel: 'แ-ะ', final: 'ง', reading: 'แข็ง', equation: 'ขอ-แอะ-งอ = แข็ง' },
      { word: 'แพ็ค', init: 'พ', vowel: 'แ-ะ', final: 'ก', reading: 'แพ็ก', equation: 'พอ-แอะ-กอ = แพ็ค' },
    ],
  },
];

const vmQs = api.buildVowelMorphQuestions(mockPresets, 10);
assert.equal(vmQs.length, 9, 'clamps cleanly to available examples when < 10');
vmQs.forEach((q) => {
  assert.equal(q.options.length, 4, 'vowel morph question must have 4 options');
  assert.equal(new Set(q.options).size, 4, 'vowel morph options must be unique');
  assert.ok(q.options.includes(q.answer), 'options must include answer');
});

// 2. Decoder questions
const decoderJson = JSON.parse(fs.readFileSync(path.join(root, 'public/games/thai/thai-vocab-hub/data/words/spelling-decoder.json'), 'utf8'));
const decoderWords = decoderJson.words || [];
const decQs = api.buildDecoderQuestions(decoderWords, 10);
assert.equal(decQs.length, 10, 'decoder challenge must produce 10 questions');
decQs.forEach((q) => {
  assert.equal(q.options.length, 4);
  assert.equal(new Set(q.options).size, 4);
  assert.ok(q.options.includes(q.answer));
});

// 3. Reading questions
const readingWords = ctx.window.GAME_DATA.words['reading-studio'] || [];
const readQs = api.buildReadingQuestions(readingWords, 10);
assert.equal(readQs.length, 10, 'reading challenge must produce 10 questions');
readQs.forEach((q) => {
  assert.equal(q.options.length, 4);
  assert.equal(new Set(q.options).size, 4);
  assert.ok(q.options.includes(q.answer));
});

console.log('✅ Studio Challenge unit tests passed!');
