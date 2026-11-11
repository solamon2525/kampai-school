import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

test('Thai Vocab Hub catalog has expanded beyond 4,500 total words', () => {
  const dir = 'public/games/thai/thai-vocab-hub/data/words';
  let totalWords = 0;
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.json') && x !== 'spelling-decoder.json')) {
    const list = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    totalWords += list.length;
  }
  assert.ok(totalWords >= 4500, `Expected total words >= 4500, got ${totalWords}`);
});
