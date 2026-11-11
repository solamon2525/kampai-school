import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

test('initHubGrid renders visible word count badge on category cards', () => {
  const gameJs = fs.readFileSync('public/games/thai/thai-vocab-hub/game.js', 'utf8');
  assert.ok(gameJs.includes('hc-count-badge'), 'Expected dedicated count badge class in hub cards');

  const styleCss = fs.readFileSync('public/games/thai/thai-vocab-hub/style.css', 'utf8');
  assert.ok(styleCss.includes('.hc-count-badge'), 'Expected CSS styling for category count badge');
});
