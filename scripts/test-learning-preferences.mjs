#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skillRoot = join(root, '.agents', 'skills', 'kampai-worksheet-builder');
const read = (path) => readFileSync(join(root, path), 'utf8');
const skill = read('.agents/skills/kampai-worksheet-builder/SKILL.md');
const evidence = read('.agents/skills/kampai-worksheet-builder/references/preference-evidence.md');
const worksheet = read('.agents/skills/kampai-worksheet-builder/references/worksheet-preferences.md');
const media = read('.agents/skills/kampai-worksheet-builder/references/media-preferences.md');
const worksheetContract = read('WORKSHEET.md');
const mediaContract = read('MEDIA.md');
const compare = read('scripts/compare-learning-artifact.mjs');

assert.ok(skillRoot.endsWith('kampai-worksheet-builder'));
for (const status of ['candidate', 'proposed', 'approved', 'rejected', 'superseded']) assert.match(evidence, new RegExp(`\\b${status}\\b`));
for (const scope of ['shared', 'media-only', 'worksheet-only', 'subject/activity-specific']) assert.match(evidence, new RegExp(scope.replace('/', '\\/')));
assert.match(skill, /correctness, safety, curriculum validity, and accessibility;[\s\S]*WORKSHEET\.md[\s\S]*approved preferences[\s\S]*template defaults/);
assert.match(skill, /One independent task creates a candidate; the second creates a proposal; only user approval promotes it/);
assert.match(evidence, /repeated edits within one task do not increment occurrence count/);
assert.match(evidence, /Experiments, exceptions/);
assert.match(worksheet, /No historical candidate is approved automatically/);
assert.match(media, /No historical candidate is approved automatically/);
assert.match(worksheetContract, /Preference learning protocol/);
assert.match(mediaContract, /Preference learning protocol/);
for (const viewport of ['360', '768', '1280']) assert.match(compare, new RegExp(`width: ${viewport}`));
for (const mode of ['a4-screen', 'a4-print']) assert.match(compare, new RegExp(mode));
assert.match(compare, /git', \['show'/);
assert.match(compare, /sha256/);
assert.match(compare, /blend: 'difference'/);
for (const metric of ['viewportWhitespaceRatio', 'overlappingImportantPairs', 'minTextPx', 'smallControls', 'deterministicReload']) assert.match(compare, new RegExp(metric));

const forwardTests = [
  ['สร้างใบงานใหม่', worksheet.includes('Working design baseline') && skill.includes('worksheet-preferences.md')],
  ['แก้ layout ตาม feedback', skill.includes('preference-evidence.md') && skill.includes('Compare')],
  ['สร้างสื่อคู่ใบงาน', skill.includes('paired dual-track') && skill.includes('media-preferences.md') && skill.includes('worksheet-preferences.md')],
  ['ความชอบใหม่ขัดกับกฎเดิม', skill.includes('correctness, safety, curriculum validity') && skill.includes('A narrow preference never overrides a hard contract')],
];
for (const [prompt, passed] of forwardTests) {
  assert.equal(passed, true, `forward-test route failed: ${prompt}`);
  console.log(`✅ forward-test route: ${prompt}`);
}

console.log('✅ preference policy regression tests passed (promotion, scope, authority, comparison evidence)');
