import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const worksheetPath = path.resolve('public/games/thai/wannakhadi-p4-media-worksheet.html');

test('Task 4: wannakhadi-p4-media-worksheet.html meets worksheet standard', () => {
  assert.ok(fs.existsSync(worksheetPath), 'wannakhadi-p4-media-worksheet.html must exist');
  const html = fs.readFileSync(worksheetPath, 'utf8');

  // Metadata checks
  assert.ok(html.includes('worksheet-source-media'), 'Must define worksheet-source-media');
  assert.ok(html.includes('/games/thai/wannakhadi-p4-media.html'), 'Must point to paired media');
  assert.ok(html.includes('curriculum-indicators'), 'Must declare curriculum-indicators');

  // UI Structure checks
  assert.ok(html.includes('toolbar-ctrls'), 'Must contain toolbar-ctrls');
  assert.ok(html.includes('selStyle'), 'Must contain selStyle');
  assert.ok(html.includes('selPageCount'), 'Must contain selPageCount');
  assert.ok(html.includes('pages'), 'Must contain pages');
  assert.ok(html.includes('sheet'), 'Must contain sheet');
  assert.ok(html.includes('questions'), 'Must contain questions');

  // Print support
  assert.ok(html.includes('A4 portrait'), 'Must specify A4 portrait');
  assert.ok(html.includes('KampaiWorksheet.printA4'), 'Must call KampaiWorksheet.printA4()');

  // Shared runtimes
  assert.ok(html.includes('worksheet-runtime.js?v='), 'Must load worksheet-runtime.js with version');
  assert.ok(html.includes('worksheet-modes.css?v='), 'Must load worksheet-modes.css with version');
  assert.ok(html.includes('worksheet-topic.js?v='), 'Must load worksheet-topic.js with version');
});
