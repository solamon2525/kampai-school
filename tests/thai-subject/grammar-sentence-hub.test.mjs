import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const grammarHubDir = path.resolve('public/games/thai/thai-grammar-hub');
const grammarItemsDir = path.join(grammarHubDir, 'data', 'items');

const sentenceHubDir = path.resolve('public/games/thai/thai-sentence-hub');
const sentenceItemsDir = path.join(sentenceHubDir, 'data', 'items');

test('thai-grammar-hub: noun.json items have phonetic readings and clean meanings', () => {
  const nounPath = path.join(grammarItemsDir, 'noun.json');
  assert.ok(fs.existsSync(nounPath), 'noun.json must exist');
  const nouns = JSON.parse(fs.readFileSync(nounPath, 'utf8'));

  assert.ok(nouns.length > 0, 'noun.json must have items');
  for (const item of nouns) {
    assert.notEqual(item.reading, 'นาม', `Item "${item.word}" reading should not be generic 'นาม'`);
    assert.ok(item.reading && item.reading.trim().length > 0, `Item "${item.word}" must have a reading`);
    assert.ok(!item.meaning.includes('· ประโยค:'), `Item "${item.word}" meaning must not contain '· ประโยค:'`);
  }
});

test('thai-grammar-hub: verb.json items have phonetic readings and clean meanings', () => {
  const verbPath = path.join(grammarItemsDir, 'verb.json');
  assert.ok(fs.existsSync(verbPath), 'verb.json must exist');
  const verbs = JSON.parse(fs.readFileSync(verbPath, 'utf8'));

  assert.ok(verbs.length > 0, 'verb.json must have items');
  for (const item of verbs) {
    assert.notEqual(item.reading, 'กริยา', `Item "${item.word}" reading should not be generic 'กริยา'`);
    assert.ok(item.reading && item.reading.trim().length > 0, `Item "${item.word}" must have a reading`);
    assert.ok(!item.meaning.includes('· ประโยค:'), `Item "${item.word}" meaning must not contain '· ประโยค:'`);
  }
});

test('thai-grammar-hub: adjective.json items have phonetic readings and clean meanings', () => {
  const adjPath = path.join(grammarItemsDir, 'adjective.json');
  assert.ok(fs.existsSync(adjPath), 'adjective.json must exist');
  const adjs = JSON.parse(fs.readFileSync(adjPath, 'utf8'));

  assert.ok(adjs.length > 0, 'adjective.json must have items');
  for (const item of adjs) {
    assert.notEqual(item.reading, 'คุณศัพท์', `Item "${item.word}" reading should not be generic 'คุณศัพท์'`);
    assert.ok(item.reading && item.reading.trim().length > 0, `Item "${item.word}" must have a reading`);
    assert.ok(!item.meaning.includes('· ประโยค:'), `Item "${item.word}" meaning must not contain '· ประโยค:'`);
  }
});

test('thai-grammar-hub: all grammar items have clean meanings and no pos name as reading', () => {
  const files = fs.readdirSync(grammarItemsDir).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const items = JSON.parse(fs.readFileSync(path.join(grammarItemsDir, file), 'utf8'));
    for (const item of items) {
      assert.ok(!item.meaning.includes('· ประโยค:'), `File ${file} item "${item.word}" meaning must not contain '· ประโยค:'`);
      if (item.pos_label) {
        assert.notEqual(item.reading, item.pos_label, `File ${file} item "${item.word}" reading must not simply be pos_label "${item.pos_label}"`);
      }
    }
  }
});

test('thai-sentence-hub: subject.json items have distinct target words and valid readings', () => {
  const subPath = path.join(sentenceItemsDir, 'subject.json');
  assert.ok(fs.existsSync(subPath), 'subject.json must exist');
  const subjects = JSON.parse(fs.readFileSync(subPath, 'utf8'));

  assert.ok(subjects.length >= 5, 'subject.json must have at least 5 items');
  const words = new Set();
  for (const item of subjects) {
    assert.notEqual(item.word, 'ประธาน', `subject item word must not be 'ประธาน'`);
    assert.notEqual(item.reading, 'ประธาน', `subject item reading must not be 'ประธาน'`);
    assert.ok(!item.meaning.includes('· ประโยค:'), `subject item "${item.word}" meaning must not contain '· ประโยค:'`);
    assert.ok(!item.sentence.includes('โรงเรียนเปิดเว้าแรก'), `Typo 'โรงเรียนเปิดเว้าแรก' must be fixed to 'โรงเรียนเปิดวันแรก'`);
    words.add(item.word);
  }
  assert.ok(words.size >= 5, `subject.json must have at least 5 distinct words, found ${words.size}`);
});

test('thai-sentence-hub: verb.json items have distinct target words and valid readings', () => {
  const verbPath = path.join(sentenceItemsDir, 'verb.json');
  assert.ok(fs.existsSync(verbPath), 'verb.json must exist');
  const verbs = JSON.parse(fs.readFileSync(verbPath, 'utf8'));

  assert.ok(verbs.length >= 5, 'verb.json must have at least 5 items');
  const words = new Set();
  for (const item of verbs) {
    assert.notEqual(item.word, 'กริยา', `verb item word must not be 'กริยา'`);
    assert.notEqual(item.reading, 'กริยา', `verb item reading must not be 'กริยา'`);
    assert.ok(!item.meaning.includes('· ประโยค:'), `verb item "${item.word}" meaning must not contain '· ประโยค:'`);
    words.add(item.word);
  }
  assert.ok(words.size >= 5, `verb.json must have at least 5 distinct words, found ${words.size}`);
});

test('thai-sentence-hub: object.json items have distinct target words and valid readings', () => {
  const objPath = path.join(sentenceItemsDir, 'object.json');
  assert.ok(fs.existsSync(objPath), 'object.json must exist');
  const objects = JSON.parse(fs.readFileSync(objPath, 'utf8'));

  assert.ok(objects.length >= 5, 'object.json must have at least 5 items');
  const words = new Set();
  for (const item of objects) {
    assert.notEqual(item.word, 'กรรม', `object item word must not be 'กรรม'`);
    assert.notEqual(item.reading, 'กรรม', `object item reading must not be 'กรรม'`);
    assert.ok(!item.meaning.includes('· ประโยค:'), `object item "${item.word}" meaning must not contain '· ประโยค:'`);
    words.add(item.word);
  }
  assert.ok(words.size >= 5, `object.json must have at least 5 distinct words, found ${words.size}`);
});

test('thai-sentence-hub: all items have clean meanings and no raw component name as word/reading', () => {
  const files = fs.readdirSync(sentenceItemsDir).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const items = JSON.parse(fs.readFileSync(path.join(sentenceItemsDir, file), 'utf8'));
    for (const item of items) {
      assert.ok(!item.meaning.includes('· ประโยค:'), `File ${file} item "${item.word}" meaning must not contain '· ประโยค:'`);
      assert.ok(!item.sentence.includes('โรงเรียนเปิดเว้าแรก'), `File ${file} item sentence must not contain 'โรงเรียนเปิดเว้าแรก'`);
      if (item.pos_label && file !== 'compound.json') {
        assert.notEqual(item.word, item.pos_label, `File ${file} item "${item.word}" word must not simply be pos_label "${item.pos_label}"`);
        assert.notEqual(item.reading, item.pos_label, `File ${file} item "${item.word}" reading must not simply be pos_label "${item.pos_label}"`);
      }
    }
  }
});
