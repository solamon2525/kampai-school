import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

test('getApprovedWords does not clamp words to 150', () => {
  const gameJs = fs.readFileSync('public/games/thai/thai-vocab-hub/game.js', 'utf8');
  assert.ok(!gameJs.includes('list.slice(0, 150)'), 'Should not contain hardcoded list.slice(0, 150)');
  assert.ok(
    gameJs.includes('word.content_status !== \'quarantined\'') ||
    gameJs.includes('word?.content_status !== \'quarantined\''),
    'Should filter out quarantined words'
  );
});
