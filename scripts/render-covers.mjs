// Rasterize hand-authored SVG game covers (scripts/covers/<slug>.svg) → PNG 1280×720
// into public/games/<path>. Usage: node scripts/render-covers.mjs [slug ...]
import sharp from 'sharp';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// slug -> output PNG path (relative to repo root)
const OUT = {
  'handwash-order': 'public/games/health/handwash-order-cover.png',
  'veggie-garden':  'public/games/career/veggie-garden/cover.png',
  'sink-float':     'public/games/science/sink-float/cover.png',
  'food-chain':     'public/games/science/food-chain-cover.png',
  'logic-gates':    'public/games/tech/logic-gates-cover.png',
  'binary-bits':    'public/games/tech/binary-bits-cover.png',
  'debug-it':       'public/games/tech/debug-it-cover.png',
  'online-safety':  'public/games/tech/online-safety-cover.png',
  'robot-path':     'public/games/tech/robot-path-cover.png',
  'coord-3d':       'public/games/math/coord-3d-cover.png',
};

const slugs = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(OUT);

for (const slug of slugs) {
  const src = resolve(root, 'scripts/covers', `${slug}.svg`);
  const out = OUT[slug];
  if (!out) { console.error(`! no output mapping for ${slug}`); continue; }
  if (!existsSync(src)) { console.error(`! missing source ${src}`); continue; }
  const svg = readFileSync(src);
  await sharp(svg, { density: 192 })
    .resize(1280, 720, { fit: 'fill' })
    .png({ quality: 92, compressionLevel: 9 })
    .toFile(resolve(root, out));
  console.log(`✓ ${slug} → ${out}`);
}
