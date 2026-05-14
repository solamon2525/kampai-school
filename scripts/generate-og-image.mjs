import { readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const svgPath = resolve(__dirname, 'og-image-template.svg');
const outPath = resolve(root, 'public', 'og-image.png');

const svg = readFileSync(svgPath);

const png = await sharp(svg, { density: 144 })
    .resize(1200, 630, { fit: 'cover' })
    .png({ quality: 90, compressionLevel: 9 })
    .toBuffer();

await writeFile(outPath, png);

const sizeKB = (png.byteLength / 1024).toFixed(1);
console.log(`✓ og-image.png written (${sizeKB} KB → ${outPath})`);
