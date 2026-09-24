import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const PAIRS = [
  ['public/games/arts/visual-elements-media-cover.svg', 'public/games/arts/visual-elements-media-cover.png'],
  ['public/games/arts/music-rhythm-media-cover.svg', 'public/games/arts/music-rhythm-media-cover.png'],
  ['public/games/arts/thai-dance-media-cover.svg', 'public/games/arts/thai-dance-media-cover.png'],
];

for (const [svgPath, pngPath] of PAIRS) {
  const svg = await readFile(svgPath);
  await sharp(svg).resize(1280, 720, { fit: 'fill' }).png().toFile(pngPath);
  const meta = await sharp(pngPath).metadata();
  const ok = meta.width === 1280 && meta.height === 720;
  console.log(`${ok ? 'OK' : 'FAIL'} ${pngPath} ${meta.width}x${meta.height}`);
  if (!ok) process.exitCode = 1;
}
