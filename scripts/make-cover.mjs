/**
 * make-cover.mjs — แปลงภาพ AI (1024x1024) → ปกเกม 1280×720 (16:9)
 *
 * วิธีใช้:
 *   node scripts/make-cover.mjs <input.png> <output.png>
 *
 * ตัวอย่าง:
 *   node scripts/make-cover.mjs ~/Desktop/ai_cover.png public/games/math/math-runner/cover.png
 *
 * หลักการ (full-bleed):
 *   ใช้ fit:'cover' → ภาพเต็มขอบทุกด้าน ไม่มีพื้นที่ว่าง
 *
 *   ⚠️  SAFE-ZONE สำหรับ AI Prompt:
 *   Source 1024×1024 → scale ×1.25 → 1280×1280 → crop top/bottom 280px
 *   ดังนั้นองค์ประกอบสำคัญต้องอยู่ใน vertical zone 27%–73% ของภาพต้นฉบับ
 *   (พื้นที่บน 27% และล่าง 27% จะถูกตัดออก)
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const TARGET_W = 1280;
const TARGET_H = 720;

async function makeCover(inputPath, outputPath) {
    console.log(`📥  Input  : ${inputPath}`);
    console.log(`📤  Output : ${outputPath}`);
    console.log(`🎯  Target : ${TARGET_W}×${TARGET_H} (16:9) — full-bleed`);

    const meta = await sharp(inputPath).metadata();
    console.log(`📐  Source : ${meta.width}×${meta.height}`);

    // full-bleed: scale กว้างเต็ม แล้ว crop กลางตามความสูง
    await sharp(inputPath)
        .resize(TARGET_W, TARGET_H, { fit: 'cover', position: 'centre' })
        .png({ compressionLevel: 8 })
        .toFile(outputPath);

    const out = await sharp(outputPath).metadata();
    const sizeKB = Math.round(fs.statSync(outputPath).size / 1024);
    console.log(`✅  Done   : ${out.width}×${out.height} px  (${sizeKB} KB)`);
    console.log(`📌  Safe zone used: vertical 27%–73% of source`);
}

const [,, inputArg, outputArg] = process.argv;
if (!inputArg || !outputArg) {
    console.error('❌  Usage: node scripts/make-cover.mjs <input.png> <output.png>');
    process.exit(1);
}
makeCover(
    path.resolve(inputArg),
    path.resolve(outputArg),
).catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
