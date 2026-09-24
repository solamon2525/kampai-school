#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

run('generator dry-run', 'scripts/create-game.mjs', ['--subject', 'math', '--slug', 'quality-fixture', '--type', 'standard', '--dry-run'], 0, /quality-fixture/);
run('generator rejects traversal', 'scripts/create-game.mjs', ['--subject', 'math', '--slug', '../escape', '--type', 'standard', '--dry-run'], 1, /kebab-case/);
run('verifier syntax', '--check', ['scripts/verify-game.mjs'], 0);
run('browser verifier syntax', '--check', ['scripts/verify-game-browser.mjs'], 0);
run('all-gate syntax', '--check', ['scripts/verify-game-all.mjs'], 0);

const templates = [
  'public/games/_template-folder/index.html',
  'public/games/_template-versus.html',
  'public/games/_template-orient/index.html',
  'public/games/_template-ar/index.html',
  'public/games/_template-ar-hands/index.html',
];
for (const template of templates) {
  const path = join(root, template);
  const source = readFileSync(path, 'utf8') + siblingGame(path);
  requirePattern(template, source, /data-kampai-action=["']start["']/, 'start hook');
  requirePattern(template, source, /data-kampai-action=["']finish-test["']/, 'finish-test hook');
  requirePattern(template, source, /data-kampai-action=["']restart["']/, 'restart hook');
  requirePattern(template, source, /KAMPAI\s*\.\s*beginRound\s*\(/, 'beginRound lifecycle');
  requirePattern(template, source, /prefers-reduced-motion\s*:\s*reduce/, 'reduced motion');
  requirePattern(template, source, /:focus-visible/, 'focus visibility');
  if (/location\s*\.\s*reload/.test(source)) failures.push(`${template}: reload restart regression`);
}

const verifier = readFileSync(join(root, 'scripts/verify-game.mjs'), 'utf8');
for (const [label, pattern] of [
  ['runtime crash', /renderSmokeTest/],
  ['global shadow', /global-shadow/],
  ['round lifecycle', /begin-round/],
  ['AR restart', /hands=null/],
  ['cover ratio', /16\s*\/\s*9/],
  ['duplicate controls', /duplicate-hooks/],
]) requirePattern('verify-game.mjs', verifier, pattern, label);

if (failures.length) {
  console.error(failures.map((failure) => `❌ ${failure}`).join('\n'));
  process.exit(1);
}
console.log(`✅ game tooling regression checks passed (${templates.length} templates + 6 bug classes)`);

function run(label, script, args, expectedStatus, outputPattern) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8' });
  const output = `${result.stdout || ''}${result.stderr || ''}`;
  if (result.status !== expectedStatus) failures.push(`${label}: exit ${result.status}, expected ${expectedStatus}\n${output}`);
  if (outputPattern && !outputPattern.test(output)) failures.push(`${label}: output did not match ${outputPattern}`);
}

function siblingGame(htmlPath) {
  if (!htmlPath.endsWith('index.html')) return '';
  try { return readFileSync(join(dirname(htmlPath), 'game.js'), 'utf8') + readFileSync(join(dirname(htmlPath), 'style.css'), 'utf8'); }
  catch { return ''; }
}

function requirePattern(file, source, pattern, label) {
  if (!pattern.test(source)) failures.push(`${file}: missing ${label}`);
}
