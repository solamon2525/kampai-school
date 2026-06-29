#!/usr/bin/env node
/**
 * ตัดพื้นหลัง sprite sheet ใน git (bundled assets)
 * Usage: node scripts/process-sprite-background.mjs [path...]
 */
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { removeBackgroundFromRgba } from './lib/sprite-background.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

const DEFAULT_PATHS = [
    'public/games/thai/assets/thai-sara-run/bunny-blue-sheet.png',
    'public/games/thai/assets/thai-sara-run/bunny-white-sheet.png',
];

const paths = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_PATHS;
const TOLERANCE = Number(process.env.SPRITE_BG_TOLERANCE || 36);

async function processOne(relPath) {
    const abs = resolve(REPO_ROOT, relPath);
    if (!existsSync(abs)) {
        console.warn('skip (missing):', relPath);
        return;
    }
    const { data, info } = await sharp(abs).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const cleaned = removeBackgroundFromRgba(data, info.width, info.height, { tolerance: TOLERANCE, mode: 'auto' });
    await sharp(cleaned, { raw: { width: info.width, height: info.height, channels: 4 } })
        .png()
        .toFile(abs);
    let transparent = 0;
    for (let i = 3; i < cleaned.length; i += 4) if (cleaned[i] < 16) transparent++;
    const pct = ((transparent / (info.width * info.height)) * 100).toFixed(1);
    console.log(`✓ ${relPath} — ${info.width}×${info.height} · โปร่งใส ${pct}%`);
}

async function main() {
    console.log(`\n🎨 ตัดพื้นหลัง sprite (tolerance=${TOLERANCE})\n`);
    for (const p of paths) await processOne(p);
    console.log('');
}

main().catch((e) => {
    console.error('✗', e.message);
    process.exit(1);
});
