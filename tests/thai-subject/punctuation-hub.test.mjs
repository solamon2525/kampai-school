import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const hubDir = path.resolve('public/games/thai/thai-punctuation-hub');
const dataDir = path.join(hubDir, 'data');
const itemsDir = path.join(dataDir, 'items');

test('categories.json has official Royal Society Thai grammatical terminology', () => {
  const categoriesPath = path.join(dataDir, 'categories.json');
  assert.ok(fs.existsSync(categoriesPath), 'categories.json must exist');
  const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));

  const findCat = (slug) => categories.find((c) => c.slug === slug);

  const periodCat = findCat('period');
  assert.ok(periodCat, 'period category must exist');
  assert.match(periodCat.title, /มหัพภาค/, 'period category title must use "มหัพภาค"');

  const commaCat = findCat('comma');
  assert.ok(commaCat, 'comma category must exist');
  assert.match(commaCat.title, /จุลภาค/, 'comma category title must use "จุลภาค"');

  const questionCat = findCat('question');
  assert.ok(questionCat, 'question category must exist');
  assert.match(questionCat.title, /ปรัศนี/, 'question category title must use "ปรัศนี"');

  const exclamationCat = findCat('exclamation');
  assert.ok(exclamationCat, 'exclamation category must exist');
  assert.match(exclamationCat.title, /อัศเจรีย์/, 'exclamation category title must use "อัศเจรีย์"');

  const parenCat = findCat('parentheses');
  assert.ok(parenCat, 'parentheses category must exist');
  assert.match(parenCat.title, /นขลิขิต/, 'parentheses category title must use "นขลิขิต"');

  const quotesCat = findCat('quotes');
  assert.ok(quotesCat, 'quotes category must exist');
  assert.match(quotesCat.title, /อัญประกาศ/, 'quotes category title must use "อัญประกาศ"');

  const dashCat = findCat('dash');
  assert.ok(dashCat, 'dash category must exist');
  assert.match(dashCat.title, /ยัติภังค์/, 'dash category title must use "ยัติภังค์"');

  const ellipsisCat = findCat('ellipsis');
  assert.ok(ellipsisCat, 'ellipsis category must exist');
  assert.match(ellipsisCat.title, /จุดไข่ปลา/, 'ellipsis category title must use "จุดไข่ปลา"');

  const maiyamokCat = findCat('maiyamok');
  assert.ok(maiyamokCat, 'maiyamok category must exist');
  assert.match(maiyamokCat.title, /ไม้ยมก/, 'maiyamok category title must use "ไม้ยมก"');

  const paiyanCat = findCat('paiyan');
  assert.ok(paiyanCat, 'paiyan category must exist');
  assert.match(paiyanCat.title, /ไปยาล/, 'paiyan category title must use "ไปยาล"');
});

test('period.json does NOT teach terminal periods on Thai sentences', () => {
  const periodPath = path.join(itemsDir, 'period.json');
  assert.ok(fs.existsSync(periodPath), 'period.json must exist');
  const items = JSON.parse(fs.readFileSync(periodPath, 'utf8'));

  assert.ok(items.length >= 6, 'period.json must have at least 6 items');

  for (const item of items) {
    assert.match(item.word, /มหัพภาค/, `item word must use "มหัพภาค": ${item.word}`);
    assert.doesNotMatch(item.meaning, /จบประโยค/, `item must not claim period ends Thai sentence: ${item.meaning}`);
    // Thai sentences do not end with terminal dot
    assert.doesNotMatch(item.sentence_answer, /^(นักเรียนอ่านหนังสือ\.|ตั้งใจเรียนให้ดี\.|พรุ่งนี้มีสอบ\.|แม่ทำอาหารเช้า\.|ดวงอาทิตย์ให้แสงสว่าง\.|โรงเรียนเลิกสามโมง\.)$/, `must not have terminal dot sentence answer: ${item.sentence_answer}`);
    // Check that items teach abbreviations, timestamps, lists, decimals
    const isAuthentic = /อักษรย่อ|เวลา|ทศนิยม|ลำดับ|หัวข้อ|ย่อคำ/i.test(item.meaning) ||
                        /[๐-๙\d]+\.[๐-๙\d]+|[ก-ฮ]\./.test(item.sentence_answer);
    assert.ok(isAuthentic, `period item must teach authentic Thai usage (abbrev, time, decimal, list): ${item.meaning} / ${item.sentence_answer}`);
  }
});

test('comma.json answers contain actual commas and no trailing sentence periods', () => {
  const commaPath = path.join(itemsDir, 'comma.json');
  assert.ok(fs.existsSync(commaPath), 'comma.json must exist');
  const items = JSON.parse(fs.readFileSync(commaPath, 'utf8'));

  assert.ok(items.length >= 6, 'comma.json must have at least 6 items');

  for (const item of items) {
    assert.ok(item.sentence_answer.includes(','), `sentence_answer must contain actual comma: ${item.sentence_answer}`);
    assert.ok(item.sentence.includes('___'), `sentence must contain blank ___: ${item.sentence}`);
    assert.doesNotMatch(item.sentence_answer, /\.$/, `sentence_answer must not have trailing period: ${item.sentence_answer}`);
  }
});

test('dash.json does not teach compound word hyphenation like รถ-ไฟ', () => {
  const dashPath = path.join(itemsDir, 'dash.json');
  assert.ok(fs.existsSync(dashPath), 'dash.json must exist');
  const items = JSON.parse(fs.readFileSync(dashPath, 'utf8'));

  assert.ok(items.length >= 6, 'dash.json must have at least 6 items');

  for (const item of items) {
    assert.match(item.word, /ยัติภังค์/, `item word must use "ยัติภังค์": ${item.word}`);
    assert.doesNotMatch(item.sentence_answer, /รถ-ไฟ/, 'must not teach รถ-ไฟ');
    assert.doesNotMatch(item.meaning, /รถ-ไฟ/, 'must not mention รถ-ไฟ');
  }
});

test('maiyamok.json exists with valid schema and >= 8 items', () => {
  const maiyamokPath = path.join(itemsDir, 'maiyamok.json');
  assert.ok(fs.existsSync(maiyamokPath), 'maiyamok.json must exist');
  const items = JSON.parse(fs.readFileSync(maiyamokPath, 'utf8'));

  assert.ok(items.length >= 8, `maiyamok.json must have >= 8 items, got ${items.length}`);

  for (const item of items) {
    assert.ok(item.word && item.word.includes('ไม้ยมก'), `word must mention ไม้ยมก: ${item.word}`);
    assert.ok(item.reading, 'reading must exist');
    assert.ok(item.meaning, 'meaning must exist');
    assert.ok(item.sentence && item.sentence.includes('___'), `sentence must have blank: ${item.sentence}`);
    assert.ok(item.sentence_answer && item.sentence_answer.includes('ๆ'), `sentence_answer must contain ๆ: ${item.sentence_answer}`);
  }
});

test('paiyan.json exists with valid schema and >= 8 items', () => {
  const paiyanPath = path.join(itemsDir, 'paiyan.json');
  assert.ok(fs.existsSync(paiyanPath), 'paiyan.json must exist');
  const items = JSON.parse(fs.readFileSync(paiyanPath, 'utf8'));

  assert.ok(items.length >= 8, `paiyan.json must have >= 8 items, got ${items.length}`);

  const hasPaiyanNoi = items.some((i) => i.sentence_answer.includes('ฯ') && !i.sentence_answer.includes('ฯลฯ'));
  const hasPaiyanYai = items.some((i) => i.sentence_answer.includes('ฯลฯ'));

  assert.ok(hasPaiyanNoi, 'paiyan.json must include ไปยาลน้อย (ฯ) examples');
  assert.ok(hasPaiyanYai, 'paiyan.json must include ไปยาลใหญ่ (ฯลฯ) examples');

  for (const item of items) {
    assert.ok(item.word && /ไปยาล/.test(item.word), `word must mention ไปยาล: ${item.word}`);
    assert.ok(item.reading, 'reading must exist');
    assert.ok(item.meaning, 'meaning must exist');
    assert.ok(item.sentence && item.sentence.includes('___'), `sentence must have blank: ${item.sentence}`);
    assert.ok(item.sentence_answer && /ฯ/.test(item.sentence_answer), `sentence_answer must contain ฯ: ${item.sentence_answer}`);
  }
});

test('parentheses.json and quotes.json use authentic Thai terminology', () => {
  const parenPath = path.join(itemsDir, 'parentheses.json');
  const quotesPath = path.join(itemsDir, 'quotes.json');

  const parenItems = JSON.parse(fs.readFileSync(parenPath, 'utf8'));
  for (const item of parenItems) {
    assert.match(item.word, /นขลิขิต/, `parentheses item must use "นขลิขิต": ${item.word}`);
  }

  const quotesItems = JSON.parse(fs.readFileSync(quotesPath, 'utf8'));
  for (const item of quotesItems) {
    assert.match(item.word, /อัญประกาศ/, `quotes item must use "อัญประกาศ": ${item.word}`);
  }
});
