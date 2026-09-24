#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
if (!target) {
  console.error('Usage: pnpm verify:game:all -- <game-path>');
  process.exit(1);
}

for (const [script, args] of [
  ['scripts/verify-game.mjs', [target, '--strict', '--report=.artifacts/game-verify/static.json']],
  ['scripts/verify-game-browser.mjs', [target, '--report=.artifacts/game-verify/browser.json']],
]) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: repoRoot, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log('✅ verify:game:all ผ่าน static + browser gates');
