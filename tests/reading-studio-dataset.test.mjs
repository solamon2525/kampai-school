import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

test('reading-studio.json contains >= 500 approved words across 6 categories', () => {
  const filePath = resolve('public/games/thai/thai-vocab-hub/data/words/reading-studio.json');
  const items = JSON.parse(readFileSync(filePath, 'utf8'));

  assert.ok(items.length >= 500, `Expected >= 500 items, got ${items.length}`);

  const counts = {};
  items.forEach((item, idx) => {
    assert.ok(item.word && typeof item.word === 'string', `Item ${idx} missing word`);
    assert.ok(item.reading && item.reading.includes('-') || item.reading.length > 0, `Item ${idx} (${item.word}) invalid reading`);
    assert.ok(item.meaning && item.meaning.length >= 4, `Item ${idx} (${item.word}) meaning too short`);
    assert.ok(['ป.4', 'ป.5', 'ป.6'].includes(item.grade), `Item ${idx} (${item.word}) invalid grade: ${item.grade}`);
    assert.equal(item.content_status, 'approved', `Item ${idx} (${item.word}) not approved`);
    counts[item.sub_category] = (counts[item.sub_category] || 0) + 1;
  });

  const expectedSubs = ['difficult', 'royal', 'mispronounced', 'complex-spelling', 'pseudo-clusters', 'irregular-spelling'];
  for (const sub of expectedSubs) {
    assert.ok(counts[sub] >= 50, `Sub-category ${sub} has fewer than 50 words (${counts[sub]})`);
  }
});
