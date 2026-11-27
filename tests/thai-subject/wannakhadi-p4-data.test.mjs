import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const dataFilePath = path.resolve('public/games/thai/assets/wannakhadi-p4/wannakhadi-data.js');

test('Task 1: wannakhadi-data.js exists and exports window.WANNAKHADI_P4_DATA with 7 authentic chapters', () => {
  assert.ok(fs.existsSync(dataFilePath), 'wannakhadi-data.js must exist');

  const code = fs.readFileSync(dataFilePath, 'utf8');
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(code, context);

  const data = context.window.WANNAKHADI_P4_DATA;
  assert.ok(Array.isArray(data), 'WANNAKHADI_P4_DATA must be an array');
  assert.equal(data.length, 7, 'Must have exactly 7 chapters matching the textbook table of contents');

  const expectedChapters = [
    { num: 1, id: 'ch1-sud-sakorn', titleKeyword: 'สุดสาคร' },
    { num: 2, id: 'ch2-nam-phueng', titleKeyword: 'น้ำผึ้งหยดเดียว' },
    { num: 3, id: 'ch3-rabaam-saifah', titleKeyword: 'ระบำสายฟ้า' },
    { num: 4, id: 'ch4-ngao-pa', titleKeyword: 'พัทลุง' },
    { num: 5, id: 'ch5-duang-jan', titleKeyword: 'ลำเจียก' },
    { num: 6, id: 'ch6-khom-khwam-khit', titleKeyword: 'คมความคิด' },
    { num: 7, id: 'ch7-mueang-phra-ruang', titleKeyword: 'พระร่วง' },
  ];

  expectedChapters.forEach((exp, idx) => {
    const ch = data[idx];
    assert.equal(ch.chapterNum, exp.num, `Chapter ${exp.num} must have chapterNum ${exp.num}`);
    assert.equal(ch.id, exp.id, `Chapter ${exp.num} id must be ${exp.id}`);
    assert.ok(ch.title.includes(exp.titleKeyword), `Chapter ${exp.num} title must include ${exp.titleKeyword}`);
    assert.ok(ch.sourceWork && ch.sourceWork.length > 3, `Chapter ${exp.num} must specify authentic sourceWork`);
    assert.ok(ch.author && ch.author.length > 2, `Chapter ${exp.num} must specify author`);
    assert.ok(ch.summary && ch.summary.length > 10, `Chapter ${exp.num} must have educational summary`);

    // Stanzas and translations
    assert.ok(Array.isArray(ch.stanzas) && ch.stanzas.length >= 1, `Chapter ${exp.num} must contain stanzas`);
    ch.stanzas.forEach((st, sIdx) => {
      assert.ok(st.lines && st.lines.length >= 2, `Ch ${exp.num} stanza ${sIdx} must have at least 2 lines`);
      assert.ok(st.translation && st.translation.length >= 5, `Ch ${exp.num} stanza ${sIdx} must have translation`);
      st.lines.forEach((l) => {
        assert.ok(l.text && l.text.trim().length > 0, 'Line text must not be empty');
        assert.ok(Array.isArray(l.segments) && l.segments.length >= 2, 'Line must have rhythm segments (3-2-3 or similar)');
      });
    });

    // Vocabulary glossary
    assert.ok(Array.isArray(ch.vocabularies) && ch.vocabularies.length >= 4, `Chapter ${exp.num} must have >= 4 vocabulary items`);
    ch.vocabularies.forEach((v) => {
      assert.ok(v.word && v.word.length > 0, 'Vocab item must have word');
      assert.ok(v.reading && v.reading.length > 0, 'Vocab item must have reading');
      assert.ok(v.meaning && v.meaning.length > 0, 'Vocab item must have meaning');
      assert.ok(v.pos && v.pos.length > 0, 'Vocab item must have part of speech');
    });

    // Practice quizzes
    assert.ok(Array.isArray(ch.practiceQuizzes) && ch.practiceQuizzes.length >= 3, `Chapter ${exp.num} must have >= 3 practice questions`);
    ch.practiceQuizzes.forEach((q) => {
      assert.ok(q.question && q.question.length > 5, 'Quiz must have question');
      assert.ok(Array.isArray(q.options) && q.options.length >= 3, 'Quiz must have >= 3 options');
      assert.ok(q.answerIndex >= 0 && q.answerIndex < q.options.length, 'Quiz answerIndex must be valid');
      assert.ok(q.explanation && q.explanation.length > 5, 'Quiz must have educational explanation');
    });
  });

  // Expanded authentic poetry checks
  assert.ok(data[0].stanzas.length >= 5, 'Chapter 1 must include both catching Ma Nil Mangkon and main recitation');
  assert.ok(data[1].stanzas.length >= 4, 'Chapter 2 must include full sequence of Nam Phueng Yot Diao');
  assert.ok(data[2].stanzas.length >= 4, 'Chapter 3 must include authentic Bot Hae Klom Jab Rabam');
  assert.ok(data[3].stanzas.length >= 4, 'Chapter 4 must include expanded Ngao Pa verses');
  assert.ok(data[4].stanzas.length >= 4, 'Chapter 5 must include expanded Nirat Duean verses');
  assert.ok(data[5].stanzas.length >= 5, 'Chapter 6 must include Phruesapha Kason + 4 stanzas of Pak Pen Ek');
  assert.ok(data[6].stanzas.length >= 4, 'Chapter 7 must include Sayamanussati + Thai Ruam Kamlang Tang Man');

  const ch6Text = data[5].stanzas.map((s) => s.lines.map((l) => l.text).join(' ')).join(' ');
  assert.ok(ch6Text.includes('ปากเป็นเอก') && ch6Text.includes('เลขเป็นโท') && ch6Text.includes('หนังสือเป็นตรี') && ch6Text.includes('ชั่วดีเป็นตรา'),
    'Chapter 6 must contain all 4 parts of Pak Pen Ek');

  const ch7Text = data[6].stanzas.map((s) => s.lines.map((l) => l.text).join(' ')).join(' ');
  assert.ok(ch7Text.includes('ใครรานใครรุกด้าว') && ch7Text.includes('ไทยรวมกำลังตั้งมั่น'),
    'Chapter 7 must contain both Sayamanussati and Thai Ruam Kamlang Tang Man');
});
