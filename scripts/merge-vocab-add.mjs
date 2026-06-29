#!/usr/bin/env node
/** รวม words/<slug>.json + words/<slug>.add.json → words/<slug>.json */
import { readFileSync, writeFileSync, readdirSync, unlinkSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORDS_DIR = join(__dirname, '..', 'public/games/thai/thai-vocab-hub/data/words');

const addFiles = readdirSync(WORDS_DIR).filter((f) => f.endsWith('.add.json'));

if (addFiles.length === 0) {
  console.log('No .add.json files to merge.');
  process.exit(0);
}

for (const addFile of addFiles) {
  const slug = addFile.replace(/\.add\.json$/, '');
  const basePath = join(WORDS_DIR, `${slug}.json`);
  const addPath = join(WORDS_DIR, addFile);

  if (!existsSync(basePath)) {
    console.error(`❌ Missing base: ${slug}.json`);
    process.exit(1);
  }

  const base = JSON.parse(readFileSync(basePath, 'utf8'));
  const add = JSON.parse(readFileSync(addPath, 'utf8'));
  const merged = [...base, ...add];

  const seen = new Set();
  for (const item of merged) {
    const key = `${item.word}\0${item.reading || ''}`;
    if (seen.has(key)) {
      console.error(`❌ Duplicate after merge in ${slug}: "${item.word}" [${item.reading}]`);
      process.exit(1);
    }
    seen.add(key);
  }

  writeFileSync(basePath, JSON.stringify(merged, null, 2) + '\n', 'utf8');
  unlinkSync(addPath);
  console.log(`✅ ${slug}: ${base.length} + ${add.length} = ${merged.length}`);
}

console.log(`\nMerged ${addFiles.length} categories.`);
