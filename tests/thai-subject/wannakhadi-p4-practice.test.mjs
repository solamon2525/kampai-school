import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const htmlPath = path.resolve('public/games/thai/wannakhadi-p4-media.html');
const dataPath = path.resolve('public/games/thai/assets/wannakhadi-p4/wannakhadi-data.js');

test('Task 3: Vocabulary Explorer and Practice Quiz engine meet educational standards', () => {
  assert.ok(fs.existsSync(htmlPath), 'wannakhadi-p4-media.html must exist');
  assert.ok(fs.existsSync(dataPath), 'wannakhadi-data.js must exist');

  const html = fs.readFileSync(htmlPath, 'utf8');
  const dataCode = fs.readFileSync(dataPath, 'utf8');

  // Verify dataset practice quizzes
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(dataCode, context);
  const data = context.window.WANNAKHADI_P4_DATA;

  let totalQuizzes = 0;
  data.forEach((ch) => {
    assert.ok(Array.isArray(ch.practiceQuizzes), `Chapter ${ch.chapterNum} must have practiceQuizzes`);
    assert.ok(ch.practiceQuizzes.length >= 3, `Chapter ${ch.chapterNum} must have at least 3 practice questions`);
    totalQuizzes += ch.practiceQuizzes.length;

    ch.practiceQuizzes.forEach((q) => {
      assert.ok(q.question.length > 5, 'Question text must be substantive');
      assert.ok(q.options.length >= 3, 'Must have at least 3 options');
      assert.ok(q.answerIndex >= 0 && q.answerIndex < q.options.length, 'Answer index must be valid');
      assert.ok(q.explanation.length > 5, 'Explanation must be educational');
    });
  });
  assert.ok(totalQuizzes >= 21, 'Must have at least 21 practice quizzes across 7 chapters');

  // Verify UI has explorer and practice elements
  assert.ok(html.includes('vocab-search-input'), 'Must have search input for vocabulary');
  assert.ok(html.includes('vocab-filter-select'), 'Must have chapter filter for vocabulary');
  assert.ok(html.includes('quiz-option-btn'), 'Must have quiz option buttons');
  assert.ok(html.includes('quiz-feedback'), 'Must have quiz feedback box');
  assert.ok(html.includes('handleQuizAnswer'), 'Must have handleQuizAnswer logic');
  assert.ok(html.includes('show-retry'), 'Must support retry feedback for growth mindset');
});
