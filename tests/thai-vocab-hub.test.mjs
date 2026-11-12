import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readdirSync } from 'node:fs';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const suiteDir = resolve(rootDir, 'tests/thai-vocab-hub');

const testFiles = readdirSync(suiteDir)
  .filter((f) => f.endsWith('.test.mjs'))
  .map((f) => `tests/thai-vocab-hub/${f}`);

const result = spawnSync('node', ['--test', ...testFiles], {
  cwd: rootDir,
  stdio: 'inherit',
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
