/**
 * make-cover.mjs — แปลงภาพ AI (1024x1024) → ปกเกม 1280×720 (16:9)
 *
 * วิธีใช้:
 *   node scripts/make-cover.mjs <input.png> <output.png>
 *
 * ตัวอย่าง:
 *   node scripts/make-cover.mjs ~/Desktop/ai_cover.png public/games/math/math-runner/cover.png
 *
 * หลักการ:
 *   ใช้ fit:'contain' (ภาพไม่โดนตัด) แล้วเติมพื้นที่ว่างด้วย dominant color
 *   ของภาพ (blur ขยายออก) ทำให้ดูเนียนไม่มีขอบดำ
 */

import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const TARGET_W = 1280;
const TARGET_H = 720;

async function makeCover(inputPath, outputPath) {
    console.log(`📥  Input  : ${inputPath}`);
    console.log(`📤  Output : ${outputPath}`);
    console.log(`🎯  Target : ${TARGET_W}×${TARGET_H} (16:9)`);

    // ── 1. อ่านขนาดต้นฉบับ ──────────────────────────────────────────────────
    const meta = await sharp(inputPath).metadata();
    console.log(`📐  Source : ${meta.width}×${meta.height}`);

    // ── 2. สร้าง blurred background (scale เต็ม cover แล้ว blur มาก) ──────
    const bgBuffer = await sharp(inputPath)
        .resize(TARGET_W, TARGET_H, { fit: 'cover', position: 'centre' })
        .blur(40)          // blur สูงมาก → กลายเป็นสีกระจายสม่ำเสมอ
        .modulate({ brightness: 0.7, saturation: 1.2 })  // เข้มขึ้นนิด สดขึ้นนิด
        .toBuffer();

    // ── 3. scale ภาพจริง fit:contain (ภาพเต็ม ไม่โดนตัด) ──────────────────
    const fgBuffer = await sharp(inputPath)
        .resize(TARGET_W, TARGET_H, {
            fit: 'contain',
            position: 'centre',
            background: { r: 0, g: 0, b: 0, alpha: 0 },  // transparent padding
        })
        .png()
        .toBuffer();

    // ── 4. composite: วาง foreground ทับ background ──────────────────────────
    await sharp(bgBuffer)
        .composite([{ input: fgBuffer, blend: 'over' }])
        .png({ compressionLevel: 8 })
        .toFile(outputPath);

    // ── 5. ตรวจสอบผลลัพธ์ ─────────────────────────────────────────────────
    const out = await sharp(outputPath).metadata();
    console.log(`✅  Done   : ${out.width}×${out.height} px`);
    const sizeKB = Math.round((await import('fs')).default.statSync(outputPath).size / 1024);
    console.log(`📦  Size   : ${sizeKB} KB`);
}

// ── CLI entrypoint ───────────────────────────────────────────────────────────
const [,, inputArg, outputArg] = process.argv;
if (!inputArg || !outputArg) {
    console.error('❌  Usage: node scripts/make-cover.mjs <input.png> <output.png>');
    process.exit(1);
}
makeCover(
    path.resolve(inputArg),
    path.resolve(outputArg),
).catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
