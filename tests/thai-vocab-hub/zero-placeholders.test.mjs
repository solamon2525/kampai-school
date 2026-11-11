import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

test('antonyms do not contain generic template definitions', () => {
  const antonyms = JSON.parse(fs.readFileSync('public/games/thai/thai-vocab-hub/data/words/antonyms.json', 'utf8'));
  const generic = antonyms.filter(w => w.meaning && w.meaning.startsWith('คำตรงข้าม:'));
  assert.equal(generic.length, 0, `Found ${generic.length} antonym entries with generic template definitions`);
});

test('no category contains placeholder example sentences', () => {
  const cats = JSON.parse(fs.readFileSync('public/games/thai/thai-vocab-hub/data/categories.json', 'utf8'));
  const placeholderMatches = [];

  cats.forEach(cat => {
    const data = JSON.parse(fs.readFileSync('public/games/thai/thai-vocab-hub/data/words/' + cat.slug + '.json', 'utf8'));
    data.forEach((w, i) => {
      if (w.example && (w.example.includes('คุณครูสอนให้นักเรียนเข้าใจความหมายของคำว่า') || w.example.includes('เด็กๆ ฝึกสังเกตการใช้'))) {
        placeholderMatches.push({ cat: cat.slug, index: i + 1, word: w.word, example: w.example });
      }
    });
  });

  assert.equal(placeholderMatches.length, 0, `Found ${placeholderMatches.length} placeholder example sentences across categories`);
});
