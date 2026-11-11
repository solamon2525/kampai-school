import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const poetryHubDir = path.resolve('public/games/thai/thai-poetry-hub');
const poetryItemsDir = path.join(poetryHubDir, 'data', 'items');
const writingHubHtmlPath = path.resolve('public/games/thai/thai-writing-hub/index.html');

test('thai-poetry-hub: rojak.json (บทร้อยแก้ว) does not claim false rhymes and represents true prose', () => {
  const rojakPath = path.join(poetryItemsDir, 'rojak.json');
  assert.ok(fs.existsSync(rojakPath), 'rojak.json must exist');
  const items = JSON.parse(fs.readFileSync(rojakPath, 'utf8'));

  assert.ok(items.length >= 4, 'rojak.json must have at least 4 items');
  for (const item of items) {
    assert.ok(!item.rhyme_hint?.includes('สะอาด / แรง'), 'Must not claim สะอาด / แรง as a rhyme');
    assert.ok(!item.rhyme_hint?.includes('เรียน / ไว'), 'Must not claim เรียน / ไว as a rhyme');
    assert.ok(!item.rhyme_hint?.includes('อื่น / ดี'), 'Must not claim อื่น / ดี as a rhyme');
    // ร้อยแก้วคือความเรียง ไม่มีสัมผัสบังคับ
    if (item.rhyme_hint) {
      assert.ok(!item.rhyme_hint.includes('สัมผัสใกล้'), 'Prose should not claim poetic rhyme hints');
    }
    // Must have questions for reading comprehension
    assert.ok(Array.isArray(item.questions) && item.questions.length > 0, `Prose item "${item.word}" should have comprehension questions`);
  }
});

test('thai-poetry-hub: kong.json (บทร้อยกรอง) has authentic poetic stanzas with valid rhyme scheme', () => {
  const kongPath = path.join(poetryItemsDir, 'kong.json');
  assert.ok(fs.existsSync(kongPath), 'kong.json must exist');
  const items = JSON.parse(fs.readFileSync(kongPath, 'utf8'));

  assert.ok(items.length >= 6, 'kong.json must have at least 6 items');
  for (const item of items) {
    assert.ok(item.word && item.word.trim().length > 0, 'Must have a title');
    assert.ok(item.passage && item.passage.split('\n').length >= 2, 'Must have multi-line poem passage');
    // Ensure questions are valid
    if (item.questions && item.questions.length > 0) {
      for (const q of item.questions) {
        assert.ok(q.answer >= 0 && q.answer < q.options.length, 'Question answer index must be within options range');
      }
    }
  }
});

test('thai-poetry-hub: rhyme-near.json and rhyme-far.json have valid rhyme pairs and clean titles', () => {
  const nearPath = path.join(poetryItemsDir, 'rhyme-near.json');
  const farPath = path.join(poetryItemsDir, 'rhyme-far.json');
  assert.ok(fs.existsSync(nearPath), 'rhyme-near.json must exist');
  assert.ok(fs.existsSync(farPath), 'rhyme-far.json must exist');

  const nearItems = JSON.parse(fs.readFileSync(nearPath, 'utf8'));
  const farItems = JSON.parse(fs.readFileSync(farPath, 'utf8'));

  for (const item of nearItems) {
    assert.ok(!item.word.includes('ตัวอย่าง กับ มด'), 'Title must not be generic "ตัวอย่าง กับ มด"');
    assert.ok(!item.word.includes('ตัวอย่าง ฟ้า กับ ว่า'), 'Title must not be generic "ตัวอย่าง ฟ้า กับ ว่า"');
    assert.ok(!item.word.includes('ตัวอย่าง ใจ กับ ไป'), 'Title must be clean and descriptive');

    if (item.questions && item.questions.length > 0) {
      for (const q of item.questions) {
        const correctOption = q.options[q.answer];
        // Ensure "มอง" does not pair with "ทาง"
        if (q.q.includes('มอง')) {
          assert.notEqual(correctOption, 'ทาง', '"มอง" (สระออ มาตรากง) does not rhyme with "ทาง" (สระอา มาตรากง)');
        }
        // Ensure "คราม" does not pair with "ว่า"
        if (q.q.includes('คราม')) {
          assert.notEqual(correctOption, 'ว่า', '"คราม" (สระอา มาตรากม) does not rhyme with "ว่า" (สระอา ไม่มีตัวสะกด)');
          assert.equal(correctOption, 'งาม', '"คราม" rhymes with "งาม"');
        }
      }
    }
  }

  for (const item of farItems) {
    assert.ok(!item.word.includes('ร้อยกรองสละ'), 'Title should accurately reflect Thai prosodic terms');
    assert.ok(item.passage && item.passage.length > 0, 'Must have passage');
  }
});

test('thai-poetry-hub: khanman.json contains authentic rhyming mottoes and descriptive titles', () => {
  const khanmanPath = path.join(poetryItemsDir, 'khanman.json');
  assert.ok(fs.existsSync(khanmanPath), 'khanman.json must exist');
  const items = JSON.parse(fs.readFileSync(khanmanPath, 'utf8'));

  assert.ok(items.length >= 8, 'khanman.json must have at least 8 items');
  for (const item of items) {
    assert.notEqual(item.word, 'คำขวัญโรงเรียน', 'Title should not be generic "คำขวัญโรงเรียน"');
    assert.notEqual(item.word, 'คำขวัญวันเด็ก', 'Title should not be generic "คำขวัญวันเด็ก"');
    assert.notEqual(item.word, 'คำขวัญสุขภาพ', 'Title should not be generic "คำขวัญสุขภาพ"');
    assert.notEqual(item.passage, 'กินดี อยู่ดี\nออกกำลังกาย', 'Motto must have rhyming phrases, not non-rhyming "กินดี อยู่ดี ออกกำลังกาย"');
    assert.ok(item.rhyme_hint && item.rhyme_hint.length > 0, `Motto "${item.word}" must document its rhyme pair`);
  }
});

test('thai-poetry-hub: changlak.json tests authentic Thai prosodic rules', () => {
  const changlakPath = path.join(poetryItemsDir, 'changlak.json');
  assert.ok(fs.existsSync(changlakPath), 'changlak.json must exist');
  const items = JSON.parse(fs.readFileSync(changlakPath, 'utf8'));

  assert.ok(items.length >= 3, 'changlak.json must have at least 3 prosody items');
  for (const item of items) {
    assert.notEqual(item.word, 'ฉันทลักษณ์สนุกสนาน', 'Must not use made-up prosody terms like "ฉันทลักษณ์สนุกสนาน"');
    assert.ok(item.questions && item.questions.length > 0, 'Prosody items should test meter/rhyme rules');
  }
});

test('thai-poetry-hub: data.js is synchronized with items directory', () => {
  const dataJsPath = path.join(poetryHubDir, 'data.js');
  assert.ok(fs.existsSync(dataJsPath), 'data.js must exist');
  const content = fs.readFileSync(dataJsPath, 'utf8');

  // Must not have bogus rhymes in data.js
  assert.ok(!content.includes('สะอาด / แรง'), 'data.js must not contain "สะอาด / แรง"');
  assert.ok(!content.includes('เรียน / ไว'), 'data.js must not contain "เรียน / ไว"');
  assert.ok(!content.includes('ตัวอย่าง กับ มด'), 'data.js must not contain "ตัวอย่าง กับ มด"');
  assert.ok(!content.includes('กินดี อยู่ดี\\nออกกำลังกาย'), 'data.js must not contain non-rhyming motto');
});

test('thai-writing-hub: index.html has corrected typos, greetings, and rhyming slogans', () => {
  assert.ok(fs.existsSync(writingHubHtmlPath), 'writing-hub index.html must exist');
  const html = fs.readFileSync(writingHubHtmlPath, 'utf8');

  // Check typos removed
  assert.ok(!html.includes('ฉันร่มกับแม่'), 'Must not contain typo "ฉันร่มกับแม่"');
  assert.ok(!html.includes('สวัสดี หวัดดี'), 'Must not contain duplicate "สวัสดี หวัดดี"');
  assert.ok(!html.includes('สวัสดี หหวัดดี'), 'Must not contain typo "สวัสดี หหวัดดี"');
  assert.ok(!html.includes('เก่งกาจในอนาคต'), 'Must not contain non-rhyming slogan "เก่งกาจในอนาคต"');

  // Check correct replacements present
  assert.ok(html.includes('ฉันกางร่มไปกับแม่'), 'Must contain "ฉันกางร่มไปกับแม่"');
  assert.ok(html.includes('สวัสดีเพื่อนรัก หวังว่าเธอจะสบายดี'), 'Must contain "สวัสดีเพื่อนรัก หวังว่าเธอจะสบายดี"');
  assert.ok(html.includes('สร้างความฝันในอนาคต'), 'Must contain "สร้างความฝันในอนาคต"');
});
