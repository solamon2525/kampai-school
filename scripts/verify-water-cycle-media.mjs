import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const htmlPath = path.join(root, 'public', 'games', 'science', 'water-cycle-media.html');
const assetDir = path.join(root, 'public', 'games', 'science', 'water-cycle-media-assets');
const html = fs.readFileSync(htmlPath, 'utf8');

const checks = [
  ['has five illustrated scenes plus practice scene', (source) => (source.match(/image:'0[1-5]-[a-z-]+\.webp'/g) || []).length === 5 && /practice-stage/.test(source)],
  ['has visual scene mode', (source) => /data-mode="visual"/.test(source) && /visualStage/.test(source)],
  ['has narration controls', (source) => /KAMPAI\.sound\.speak|speechSynthesis/.test(source)],
  ['does not autoplay narration', (source) => !/speak\([^)]*\)\s*;?\s*\/\/\s*autoplay/i.test(source)],
  ['has image fallback', (source) => /image-error|visualFallback/.test(source)],
  ['keeps practice mode', (source) => /data-mode="practice"/.test(source) && /orderList/.test(source)],
  ['has responsive visual frame', (source) => /aspect-ratio\s*:\s*16\/9/.test(source) && /@media/.test(source)],
];

const failures = checks.filter(([, check]) => !check(html));
const expectedAssets = [
  '01-introduction.webp',
  '02-evaporation.webp',
  '03-condensation.webp',
  '04-precipitation.webp',
  '05-collection.webp',
];
for (const asset of expectedAssets) {
  checks.push([`has ${asset}`, () => fs.existsSync(path.join(assetDir, asset))]);
}

const assetFailures = checks.slice(-expectedAssets.length).filter(([, check]) => !check());
const allFailures = [...failures, ...assetFailures];
if (allFailures.length) {
  console.error(`water-cycle-media verification failed (${allFailures.length} checks):`);
  for (const [label] of allFailures) console.error(`- ${label}`);
  process.exit(1);
}

console.log(`water-cycle-media verification passed (${checks.length} checks)`);
