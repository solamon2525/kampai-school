import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const mediaFilePath = path.resolve('public/games/thai/wannakhadi-p4-media.html');

test('Task 2: wannakhadi-p4-media.html satisfies MEDIA.md and teaching media contracts', () => {
  assert.ok(fs.existsSync(mediaFilePath), 'wannakhadi-p4-media.html must exist');
  const html = fs.readFileSync(mediaFilePath, 'utf8');

  // Slug check
  const hasSlug = /setSlug\s*\(\s*['"`]wannakhadi-p4-media['"`]\s*\)/.test(html) ||
                  /MEDIA_SLUG\s*=\s*['"`]wannakhadi-p4-media['"`]/.test(html);
  assert.ok(hasSlug, 'Must declare MEDIA_SLUG or setSlug("wannakhadi-p4-media")');

  // Modes check
  assert.ok(/data-mode\s*=\s*["']learn["']/.test(html), 'Must have learn mode');
  assert.ok(/data-mode\s*=\s*["']practice["']/.test(html), 'Must have practice mode');

  // Navigation and SDK check
  assert.ok(html.includes('KAMPAI.goHome'), 'Must implement KAMPAI.goHome navigation');
  assert.ok(html.includes('/games/kampai-sdk.js'), 'Must load kampai-sdk.js');
  assert.ok(html.includes('wannakhadi-data.js'), 'Must load wannakhadi-data.js');

  // Teaching media meta check
  assert.ok(/<meta\s+name=["']kampai-content-kind["']\s+content=["']teaching-media["']/i.test(html),
    'Must declare teaching-media metadata');

  // Zero competitive score check
  assert.ok(!/submitScore\s*\(/.test(html), 'Teaching media must not submit competitive score');

  // Light-only style checks
  assert.ok(!html.includes('dark:'), 'Must not contain dark: classes (Light-only rule)');
  assert.ok(html.includes('Sarabun'), 'Must use Sarabun font');
});
