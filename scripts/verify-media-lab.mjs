import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const topics = [
  ['tech', 'ai-data-literacy'],
  ['arts', 'thai-instruments'],
  ['arts', 'art-critique'],
  ['career', 'budget-planning'],
  ['career', 'workplace-safety'],
  ['health', 'emotional-wellbeing'],
  ['health', 'safety-help'],
];
const runtime = path.join(root, 'public', 'games', 'media-lab-runtime.js');
const asset = path.join(root, 'public', 'games', 'media-lab-assets', 'learning-scene.svg');
const failures = [];
const runtimeSource = fs.existsSync(runtime) ? fs.readFileSync(runtime, 'utf8') : '';

if (!fs.existsSync(runtime)) failures.push('missing media-lab-runtime.js');
if (!fs.existsSync(asset)) failures.push('missing local 16:9 illustration asset');

for (const [subject, slug] of topics) {
  const mediaPath = path.join(root, 'public', 'games', subject, `${slug}-media.html`);
  const worksheetPath = path.join(root, 'public', 'games', subject, `${slug}-worksheet.html`);
  const media = fs.existsSync(mediaPath) ? fs.readFileSync(mediaPath, 'utf8') : '';
  const mediaWithRuntime = `${media}\n${runtimeSource}`;
  const worksheet = fs.existsSync(worksheetPath) ? fs.readFileSync(worksheetPath, 'utf8') : '';
  const label = `${subject}/${slug}`;
  if (!media) failures.push(`${label}: missing media`);
  for (const [name, pattern] of [
    ['media slug', /const MEDIA_SLUG=/],
    ['learn mode', /data-mode="learn"/],
    ['practice mode', /data-mode="practice"/],
    ['TTS fallback', /KAMPAI\.sound|speechSynthesis/],
    ['reduced motion', /prefers-reduced-motion/],
    ['local image', /media-lab-assets\/learning-scene\.svg/],
    ['no score submit', (source) => !/submitScore\s*\(/.test(source)],
  ]) if (!((typeof pattern === 'function' ? pattern(mediaWithRuntime) : pattern.test(mediaWithRuntime)))) failures.push(`${label}: ${name}`);
  if (!worksheet) failures.push(`${label}: missing worksheet`);
  for (const [name, pattern] of [
    ['source media metadata', /worksheet-source-media/],
    ['indicator metadata', /curriculum-indicators/],
    ['worksheet topic runtime', /worksheet-topic\.js/],
    ['A4 print', /KampaiWorksheet\.printA4/],
  ]) if (!pattern.test(worksheet)) failures.push(`${label}: worksheet ${name}`);
}

if (failures.length) {
  console.error(`media lab verification failed (${failures.length} checks):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`media lab verification passed (${topics.length} media + ${topics.length} worksheets)`);
