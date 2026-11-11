import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const literatureHubDir = path.resolve('public/games/thai/thai-literature-hub');
const literatureItemsDir = path.join(literatureHubDir, 'data', 'items');

const scriptHubDir = path.resolve('public/games/thai/thai-script-hub');
const scriptItemsDir = path.join(scriptHubDir, 'data', 'items');

test('thai-literature-hub: akhayarn.json contains authentic classical Thai memorized verses without synthetic fake prose', () => {
  const akhayarnPath = path.join(literatureItemsDir, 'akhayarn.json');
  assert.ok(fs.existsSync(akhayarnPath), 'akhayarn.json must exist');
  const items = JSON.parse(fs.readFileSync(akhayarnPath, 'utf8'));

  assert.ok(items.length >= 8, 'akhayarn.json must have at least 8 authentic poems');

  const titles = items.map((it) => it.word);

  // Must not have synthetic fake prose or placeholder titles
  assert.ok(!titles.includes('อาขยาน 1 คำ (ตัวอย่าง)'), 'Must not have fake "อาขยาน 1 คำ (ตัวอย่าง)"');
  assert.ok(!titles.includes('นิราศภูเขาทอง (ย่อ)'), 'Must not have fake prose labeled "นิราศภูเขาทอง (ย่อ)"');
  assert.ok(!titles.includes('อาขยานชีวิตเด็ก'), 'Must not have fake prose "อาขยานชีวิตเด็ก"');
  assert.ok(!titles.includes('อาขยานธรรมชาติ'), 'Must not have fake prose "อาขยานธรรมชาติ"');

  // Must contain canonical Thai memorized poems (บทอาขยานหลักและอาขยานเลือก สพฐ.)
  const requiredTitles = [
    'พฤษภกาสร',
    'นิราศภูเขาทอง',
    'ตนเป็นที่พึ่งแห่งตน',
    'ขุนช้างขุนแผน',
    'สยามมานุสติ',
    'วิชาเหมือนสินค้า',
    'เด็กน้อย',
  ];

  for (const req of requiredTitles) {
    const found = items.find((it) => it.word.includes(req));
    assert.ok(found, `Must contain canonical poem: ${req}`);
    assert.ok(found.passage && found.passage.length > 30, `Poem ${req} must have passage text`);
    assert.ok(found.reading && found.reading !== 'บทอาขยาน', `Poem ${req} reading should be phonetic reading, not generic 'บทอาขยาน'`);
    assert.ok(Array.isArray(found.questions) && found.questions.length > 0, `Poem ${req} must have comprehension questions`);
  }

  // Check authentic verses content
  const phruesapha = items.find((it) => it.word.includes('พฤษภกาสร'));
  assert.ok(phruesapha.passage.includes('อีกกุญชรอันปลดปลง') && phruesapha.passage.includes('โททนต์เสน่ห์คง'), 'พฤษภกาสร must contain authentic verse');

  const nirat = items.find((it) => it.word.includes('นิราศภูเขาทอง'));
  assert.ok(nirat.passage.includes('ถึงบางพูดพูดดีเป็นศรีศักดิ์') && nirat.passage.includes('มีคนรักรสถ้อยอร่อยจิต'), 'นิราศภูเขาทอง must contain ถึงบางพูด verse');

  const ton = items.find((it) => it.word.includes('ตนเป็นที่พึ่งแห่งตน'));
  assert.ok(ton.passage.includes('เราเกิดมาทั้งทีชีวิตหนึ่ง') && ton.passage.includes('อย่าหมายพึ่งผู้ใดให้เขาหยัน'), 'ตนเป็นที่พึ่งแห่งตน must contain authentic verse');

  const khunChang = items.find((it) => it.word.includes('ขุนช้างขุนแผน'));
  assert.ok(khunChang.passage.includes('แม่รักลูกลูกก็รู้อยู่ว่ารัก') && khunChang.passage.includes('คนอื่นสักหมื่นแสนไม่แม้นเหมือน'), 'ขุนช้างขุนแผน must contain กำเนิดพลายงาม verse');

  const siam = items.find((it) => it.word.includes('สยามมานุสติ'));
  assert.ok(siam.passage.includes('ใครรานใครรุกด้าว') && siam.passage.includes('ไทยรบจนสุดใจ'), 'สยามมานุสติ must contain authentic verse');
});

test('thai-literature-hub: folktale.json contains genuine Thai folklore, no European/Aesop tales', () => {
  const folktalePath = path.join(literatureItemsDir, 'folktale.json');
  assert.ok(fs.existsSync(folktalePath), 'folktale.json must exist');
  const items = JSON.parse(fs.readFileSync(folktalePath, 'utf8'));

  assert.ok(items.length >= 8, 'folktale.json must have at least 8 Thai folktales');

  const titles = items.map((it) => it.word);

  // Must NOT contain European / Aesop tales
  assert.ok(!titles.includes('ชาวประมงกับปลาทอง'), 'Must remove Aesop/European tale "ชาวประมงกับปลาทอง"');
  assert.ok(!titles.includes('กระต่ายกับเต่า'), 'Must remove Aesop tale "กระต่ายกับเต่า"');
  assert.ok(!titles.includes('ลิงกับจระเข้'), 'Must remove generic tale "ลิงกับจระเข้"');

  // Must contain authentic Thai folktales & regional legends
  const expectedTales = [
    'ปลาบู่ทอง',
    'สังข์ทอง',
    'ไกรทอง',
    'โสนน้อยเรือนงาม',
    'พิกุลทอง',
    'จันทโครพ',
    'เกาะหนูเกาะแมว',
    'ตาม่องล่าย',
  ];

  for (const tale of expectedTales) {
    const found = items.find((it) => it.word.includes(tale));
    assert.ok(found, `Must contain authentic Thai folktale: ${tale}`);
    assert.ok(found.passage && found.passage.length > 40, `Folktale ${tale} must have descriptive passage`);
    assert.ok(found.reading && found.reading !== 'นิทาน', `Folktale ${tale} reading should be phonetic reading, not generic 'นิทาน'`);
    assert.ok(Array.isArray(found.questions) && found.questions.length > 0, `Folktale ${tale} must have comprehension questions`);
  }
});

test('thai-literature-hub: character.json contains canonical Thai literature characters', () => {
  const charPath = path.join(literatureItemsDir, 'character.json');
  assert.ok(fs.existsSync(charPath), 'character.json must exist');
  const items = JSON.parse(fs.readFileSync(charPath, 'utf8'));

  assert.ok(items.length >= 6, 'character.json must have at least 6 canonical characters');

  const titles = items.map((it) => it.word);
  assert.ok(!titles.includes('กระต่ายในนิทาน'), 'Must not have generic "กระต่ายในนิทาน"');
  assert.ok(!titles.includes('เต่าในนิทาน'), 'Must not have generic "เต่าในนิทาน"');

  const expectedChars = [
    'สุดสาคร',
    'ม้านิลมังกร',
    'พระอภัยมณี',
    'ชาละวัน',
    'นางรจนา',
    'พระสังข์',
  ];

  for (const ch of expectedChars) {
    const found = items.find((it) => it.word.includes(ch));
    assert.ok(found, `Must contain canonical character: ${ch}`);
    assert.ok(found.reading && found.reading !== 'ตัวละคร', `Character ${ch} reading should be phonetic reading, not generic 'ตัวละคร'`);
  }
});

test('thai-literature-hub: proverb.json and saying.json have authentic phonetic readings', () => {
  const proverbPath = path.join(literatureItemsDir, 'proverb.json');
  const sayingPath = path.join(literatureItemsDir, 'saying.json');
  assert.ok(fs.existsSync(proverbPath), 'proverb.json must exist');
  assert.ok(fs.existsSync(sayingPath), 'saying.json must exist');

  const proverbs = JSON.parse(fs.readFileSync(proverbPath, 'utf8'));
  const sayings = JSON.parse(fs.readFileSync(sayingPath, 'utf8'));

  for (const item of proverbs) {
    assert.notEqual(item.reading, 'สุภาษิต', `Proverb "${item.word}" reading should not be generic 'สุภาษิต'`);
    assert.ok(item.reading && item.reading.trim().length > 0, `Proverb "${item.word}" must have phonetic reading`);
  }

  for (const item of sayings) {
    assert.notEqual(item.reading, 'คำพังเพย', `Saying "${item.word}" reading should not be generic 'คำพังเพย'`);
    assert.ok(item.reading && item.reading.trim().length > 0, `Saying "${item.word}" must have phonetic reading`);
    // Ensure no fake fabricated sayings like 'ผักบุ้งโก่' or 'ปลาหมอกินเวียน'
    assert.ok(!item.word.includes('ผักบุ้งโก่'), 'No fake saying "น้ำท่วมทุ่ง ผักบุ้งโก่"');
    assert.ok(!item.word.includes('ปลาหมอกินเวียน'), 'No fake saying "ปลาหมอกินเวียน"');
  }
});

test('thai-script-hub: spelling-mattra.json has correct Mae Ko Ka definition and no typo ยาวน์', () => {
  const mattraPath = path.join(scriptItemsDir, 'spelling-mattra.json');
  assert.ok(fs.existsSync(mattraPath), 'spelling-mattra.json must exist');
  const mattras = JSON.parse(fs.readFileSync(mattraPath, 'utf8'));

  const maeKoKa = mattras.find((m) => m.word.includes('แม่ ก กา'));
  assert.ok(maeKoKa, 'แม่ ก กา must exist');
  assert.equal(maeKoKa.mattra_final, null, 'แม่ ก กา must have mattra_final: null (no final consonant)');
  assert.equal(maeKoKa.reading, 'ไม่มีตัวสะกด', 'แม่ ก กา reading must be ไม่มีตัวสะกด');
  assert.ok(!maeKoKa.reading.includes('ลงท้าย ก'), 'แม่ ก กา must NOT claim ลงท้าย ก');
  assert.ok(maeKoKa.meaning.includes('ไม่มีพยัญชนะสะกด'), 'แม่ ก กา meaning must explain no final consonant');

  const maeKong = mattras.find((m) => m.word.includes('แม่กง'));
  assert.ok(maeKong, 'แม่กง must exist');
  assert.ok(!maeKong.meaning.includes('ยาวน์'), 'แม่กง must not have non-existent typo word ยาวน์');
  assert.ok(maeKong.meaning.includes('ทอง') || maeKong.meaning.includes('กว้าง') || maeKong.meaning.includes('ช้าง'), 'แม่กง should have genuine examples');

  // Verify entire spelling-mattra.json does not have ยาวน์
  const rawJson = fs.readFileSync(mattraPath, 'utf8');
  assert.ok(!rawJson.includes('ยาวน์'), 'Raw JSON must not contain ยาวน์');
});

test('hub data synchronization: data.js matches item JSON sources', () => {
  // Check thai-literature-hub data.js
  const litDataJsPath = path.join(literatureHubDir, 'data.js');
  assert.ok(fs.existsSync(litDataJsPath), 'thai-literature-hub/data.js must exist');
  const litContent = fs.readFileSync(litDataJsPath, 'utf8');
  assert.ok(!litContent.includes('อาขยาน 1 คำ (ตัวอย่าง)'), 'thai-literature-hub/data.js must not contain fake prose');
  assert.ok(!litContent.includes('ชาวประมงกับปลาทอง'), 'thai-literature-hub/data.js must not contain Aesop tale');
  assert.ok(litContent.includes('พฤษภกาสร'), 'thai-literature-hub/data.js must contain พฤษภกาสร');
  assert.ok(litContent.includes('ปลาบู่ทอง'), 'thai-literature-hub/data.js must contain ปลาบู่ทอง');

  // Check thai-script-hub data.js
  const scriptDataJsPath = path.join(scriptHubDir, 'data.js');
  assert.ok(fs.existsSync(scriptDataJsPath), 'thai-script-hub/data.js must exist');
  const scriptContent = fs.readFileSync(scriptDataJsPath, 'utf8');
  assert.ok(!scriptContent.includes('ยาวน์'), 'thai-script-hub/data.js must not contain ยาวน์');
  assert.ok(scriptContent.includes('ไม่มีตัวสะกด'), 'thai-script-hub/data.js must reflect แม่ ก กา ไม่มีตัวสะกด');
});
