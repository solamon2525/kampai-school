import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
import sharp from 'sharp';

const base = path.resolve('public/games/science');
const context = { window: {} };
vm.runInNewContext(await fs.readFile(path.join(base, 'plant-parts-data.js'), 'utf8'), context);
const data = context.window.PLANT_PARTS_CONTENT;
assert.equal(data.parts.length, 6);
assert.equal(data.parts.filter(p => p.core).length, 4);
const paths = [data.overview];
for (const part of data.parts) {
  for (const key of ['id', 'nameTh', 'functionTh', 'image', 'imageAlt', 'question', 'answer', 'funFact']) assert.ok(part[key]?.trim(), key);
  assert.ok(part.steps.length >= 2 && part.steps.length <= 3);
  assert.ok(part.steps.every(s => s.trim()));
  assert.ok(part.examples.length);
  if (part.hotspot) for (const n of Object.values(part.hotspot)) assert.ok(n > 0 && n < 100);
  paths.push(part.image);
}
assert.equal(new Set(paths).size, 7);
assert.equal((await fs.readdir(path.join(base, 'plant-parts-assets'))).filter(p => p.endsWith('.webp')).length, 7);
for (const file of paths) {
  assert.ok(path.resolve(base, file).startsWith(base + path.sep));
  const image = sharp(path.join(base, file));
  const meta = await image.metadata();
  assert.equal(meta.format, 'webp');
  assert.equal(meta.width, file === data.overview ? 1280 : 1024);
  assert.equal(meta.height, file === data.overview ? 720 : 1024);
  await image.raw().toBuffer();
}
const html = await fs.readFile(path.join(base, 'plant-parts-media.html'), 'utf8');
assert.ok(!html.includes('<svg'));
assert.ok(!html.includes('speak(p.nameTh)'));
assert.ok(data.sources.every(s => s.url.startsWith('https://')));
console.log('PASS: six parts, four core topics, seven unique decodable WebP assets, content and sources.');
