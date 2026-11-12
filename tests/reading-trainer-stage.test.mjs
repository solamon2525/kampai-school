import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

test('style.css and reading-trainer.js contain warning box styles and category badges', () => {
  const css = readFileSync(resolve('public/games/thai/thai-vocab-hub/style.css'), 'utf8');
  const js = readFileSync(resolve('public/games/thai/thai-vocab-hub/reading-trainer.js'), 'utf8');

  // 1. Warning box styles
  assert.ok(css.includes('.reading-warning-box'), 'Missing .reading-warning-box in style.css');
  assert.ok(css.includes('#fffbeb'), 'Missing soft amber background (#fffbeb) for warning box');
  assert.ok(css.includes('#fde68a'), 'Missing warning box border (#fde68a)');
  assert.ok(css.includes('#92400e'), 'Missing warning box text color (#92400e)');
  assert.ok(css.includes('border-radius: 14px;'), 'Missing 14px border radius for warning box');

  // 2. Category badge themes
  assert.ok(css.includes('.badge-mispronounced'), 'Missing .badge-mispronounced in style.css');
  assert.ok(css.includes('#ffe4e6'), 'Missing #ffe4e6 for mispronounced badge');
  assert.ok(css.includes('#9f1239'), 'Missing #9f1239 for mispronounced badge text');

  assert.ok(css.includes('.badge-complex'), 'Missing .badge-complex in style.css');
  assert.ok(css.includes('#ede9fe'), 'Missing #ede9fe for complex badge');
  assert.ok(css.includes('#5b21b6'), 'Missing #5b21b6 for complex badge text');

  assert.ok(css.includes('.badge-pseudo'), 'Missing .badge-pseudo in style.css');
  assert.ok(css.includes('#e0f2fe'), 'Missing #e0f2fe for pseudo clusters badge');
  assert.ok(css.includes('#0369a1'), 'Missing #0369a1 for pseudo clusters badge text');

  assert.ok(css.includes('.badge-irregular'), 'Missing .badge-irregular in style.css');
  assert.ok(css.includes('#dcfce7'), 'Missing #dcfce7 for irregular badge');
  assert.ok(css.includes('#166534'), 'Missing #166534 for irregular badge text');

  assert.ok(css.includes('.badge-diff'), 'Missing .badge-diff in style.css');
  assert.ok(css.includes('#e0e7ff'), 'Missing #e0e7ff for diff badge');
  assert.ok(css.includes('#3730a3'), 'Missing #3730a3 for diff badge text');

  assert.ok(css.includes('.badge-royal'), 'Missing .badge-royal in style.css');
  assert.ok(css.includes('#fef3c7'), 'Missing #fef3c7 for royal badge');
  assert.ok(css.includes('#92400e'), 'Missing #92400e for royal badge text');

  // 3. Filter bar and search input
  assert.ok(css.includes('.reading-filter-bar'), 'Missing .reading-filter-bar');
  assert.ok(css.includes('overflow-x: auto;'), 'Missing overflow-x: auto on filter bar');
  assert.ok(css.includes('-webkit-overflow-scrolling: touch;'), 'Missing -webkit-overflow-scrolling');
  assert.ok(css.includes('.reading-search-input'), 'Missing .reading-search-input in style.css');
  assert.ok(css.includes('.reading-search-input:focus'), 'Missing focus state for search input');

  // 4. Markup in reading-trainer.js
  assert.ok(js.includes('reading-warning-box'), 'Missing warning box markup in reading-trainer.js');
  assert.ok(js.includes('warning-icon'), 'Missing warning-icon span in reading-trainer.js');
  assert.ok(js.includes('warning-text'), 'Missing warning-text span in reading-trainer.js');
  assert.ok(js.includes('item.warning_hint'), 'Missing item.warning_hint check in reading-trainer.js');
  assert.ok(js.includes('BADGE_CLASS_MAP'), 'Missing BADGE_CLASS_MAP in reading-trainer.js');
  assert.ok(js.includes('badge-mispronounced'), 'Missing badge-mispronounced map in reading-trainer.js');
  assert.ok(js.includes('badge-complex'), 'Missing badge-complex map in reading-trainer.js');
  assert.ok(js.includes('badge-pseudo'), 'Missing badge-pseudo map in reading-trainer.js');
  assert.ok(js.includes('badge-irregular'), 'Missing badge-irregular map in reading-trainer.js');

  // 5. Light mode compliance (no dark: classes)
  assert.ok(!js.includes('dark:'), 'Found dark: class in reading-trainer.js');
  const readingTheaterCss = css.slice(css.indexOf('reading-theater-card'));
  assert.ok(!readingTheaterCss.includes('dark:'), 'Found dark: class in reading theater styles');
});
