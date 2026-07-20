#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gamesRoot = path.join(root, 'public', 'games');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(target);
    return [target];
  });
}

function toUrl(filePath) {
  return '/' + path.relative(path.join(root, 'public'), filePath).replaceAll('\\', '/');
}

function fileExists(url) {
  return fs.existsSync(path.join(root, 'public', url.replace(/^\//, '')));
}

const allHtml = walk(gamesRoot).filter((f) => f.endsWith('.html'));
const worksheets = allHtml.filter((f) => f.endsWith('-worksheet.html') && !f.includes('_template'));

const pairedSources = new Set();
for (const file of worksheets) {
  const source = fs.readFileSync(file, 'utf8');
  const match = source.match(/name=["']worksheet-source-media["']\s+content=["']([^"']+)["']/i);
  if (match) pairedSources.add(match[1]);
}

const migrationText = fs
  .readdirSync(path.join(root, 'supabase', 'migrations'))
  .filter((name) => name.endsWith('.sql'))
  .map((name) => fs.readFileSync(path.join(root, 'supabase', 'migrations', name), 'utf8'))
  .join('\n');

// Teaching media from indicator maps + media seed URLs (exclude worksheets/games that are clearly score games)
const mediaCandidates = new Set();

for (const match of migrationText.matchAll(/'(\/games\/[^']+\.html)'/g)) {
  const url = match[1];
  if (url.includes('worksheet')) continue;
  if (url.includes('_template')) continue;
  mediaCandidates.add(url);
}

for (const file of allHtml) {
  const url = toUrl(file);
  if (
    url.includes('-media.html')
    || url.includes('thinking-media.html')
    || /\/[a-z0-9-]+-hub\/index\.html$/.test(url)
  ) {
    mediaCandidates.add(url);
  }
}

// Keep only files that exist and look like teaching media (not arcade game folders with Kampai score)
const remaining = [...mediaCandidates]
  .filter((url) => fileExists(url))
  .filter((url) => !pairedSources.has(url))
  .filter((url) => {
    // Exclude pure game play pages under deep game folders unless they are hubs/media
    if (url.includes('-media.html') || url.includes('thinking-media.html')) return true;
    if (/\/[a-z0-9-]+-hub\/index\.html$/.test(url)) return true;
    // Keep flat media-style pages that were seeded as media in indicator maps
    const basename = path.basename(url);
    const mediaLike = [
      'fact-opinion.html',
      'fraction-pieces.html',
      'thai-word-types.html',
      'sentence-structure.html',
      'thailand-map.html',
      'sukhothai-timeline.html',
      'states-of-matter.html',
      'vertebrate-sort.html',
      'water-cycle.html',
      'phonics-chart.html',
      'sight-words-p4.html',
      'follow-instructions.html',
      'grammar-mini.html',
      'bar-chart-media.html',
    ];
    return mediaLike.includes(basename) || basename.endsWith('-media.html');
  })
  .sort();

console.log(JSON.stringify({
  worksheetsDone: worksheets.length,
  pairedSourceMedia: pairedSources.size,
  remainingCount: remaining.length,
  remaining,
}, null, 2));
