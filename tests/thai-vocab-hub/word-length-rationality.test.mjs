import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

test('lesson and p5-focus do not contain long curriculum competency slogans', () => {
  const lesson = JSON.parse(fs.readFileSync('public/games/thai/thai-vocab-hub/data/words/lesson.json', 'utf8'));
  const p5 = JSON.parse(fs.readFileSync('public/games/thai/thai-vocab-hub/data/words/p5-focus.json', 'utf8'));

  const invalidSlogans = [
    'การคิดอย่างมีวิจารณญาณ',
    'การคิดเชิงเหตุผล',
    'การคิดเชิงระบบ',
    'การรู้เท่าทันสื่อ',
    'ความปลอดภัยออนไลน์',
    'การเรียนรู้จากข้อผิดพลาด',
    'ความรับผิดชอบต่อส่วนรวม',
    'การใช้เหตุผลเชิงจริยธรรม',
    'การแก้ปัญหาอย่างสร้างสรรค์',
    'การใช้ชีวิตอย่างมีสติ',
    'การอยู่ร่วมกันอย่างสันติ',
    'ความปลอดภัยทางถนน'
  ];

  const allWords = [...lesson.map(w => w.word), ...p5.map(w => w.word)];
  const found = invalidSlogans.filter(s => allWords.includes(s));

  assert.deepEqual(found, [], 'Found long competency slogans that should be rationalized into vocabulary words');
});
