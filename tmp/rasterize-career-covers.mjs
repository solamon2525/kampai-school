import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const PAIRS = [
  ['public/games/career/housework-craft-media-cover.svg', 'public/games/career/housework-craft-media-cover.png'],
  ['public/games/career/agriculture-basics-media-cover.svg', 'public/games/career/agriculture-basics-media-cover.png'],
  ['public/games/career/cooking-basics-media-cover.svg', 'public/games/career/cooking-basics-media-cover.png'],
];

let failed = 0;
for (const [svgPath, pngPath] of PAIRS) {
  const svg = await readFile(svgPath);
  await sharp(svg).resize(1280, 720, { fit: 'fill' }).png().toFile(pngPath);
  const meta = await sharp(pngPath).metadata();
  const ok = meta.width === 1280 && meta.height === 720;
  console.log(`${ok ? 'OK' : 'FAIL'} ${pngPath} ${meta.width}x${meta.height}`);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
console.log('Done');
