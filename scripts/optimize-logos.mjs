import { readFile, writeFile, unlink, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const logosDir = resolve(__dirname, '..', 'public', 'logos');
const logos = ['garuda', 'moe', 'obec'];

console.log('Converting PNG → WebP...\n');

for (const name of logos) {
    const pngPath = resolve(logosDir, `${name}.png`);
    const webpPath = resolve(logosDir, `${name}.webp`);
    const svgPath = resolve(logosDir, `${name}.svg`);

    const pngBuffer = await readFile(pngPath);
    const webp = await sharp(pngBuffer)
        .webp({ quality: 88, alphaQuality: 90, effort: 6 })
        .toBuffer();
    await writeFile(webpPath, webp);

    const before = pngBuffer.byteLength;
    const after = webp.byteLength;
    const savings = (((before - after) / before) * 100).toFixed(0);
    console.log(`  ${name}: ${(before / 1024).toFixed(1)} KB → ${(after / 1024).toFixed(1)} KB (−${savings}%)`);

    try {
        await stat(svgPath);
        await unlink(svgPath);
        console.log(`  ${name}: removed broken SVG stub`);
    } catch {
        // SVG ไม่มี — ผ่าน
    }
}

console.log('\n✓ Done');
