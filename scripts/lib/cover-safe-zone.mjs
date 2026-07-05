#!/usr/bin/env node
/**
 * lib/cover-safe-zone.mjs — วิเคราะห์/ reframe safe zone หัวข้อปก (สระไทย)
 */
import sharp from 'sharp';

export const COVER_W = 1280;
export const COVER_H = 720;
export const TOP_SAFE_PX = 96; // ≈13% — สอดคล้อง GameCoverAiDialog top=34 + font

/** หาสัดส่วนพิกเซล "ข้อความขาว/สว่าง" ในแถบบนสุด (มักเป็นหัวข้อฝังใน PNG) */
export async function analyzeTopTitleBand(path) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const bandRows = Math.round(h * 0.14); // 14% บน
  let bright = 0;
  let samples = 0;
  let topBrightRow = h;

  for (let y = 0; y < bandRows; y++) {
    let rowBright = 0;
    for (let x = Math.floor(w * 0.15); x < Math.floor(w * 0.85); x += 2) {
      const i = (y * w + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum > 215 && r > 180 && g > 180 && b > 180) {
        bright++;
        rowBright++;
      }
      samples++;
    }
    if (rowBright > (w * 0.35) / 2 * 0.08 && topBrightRow === h) topBrightRow = y;
  }

  const brightPct = (bright / samples) * 100;
  // โปสเตอร์สื่อ: แถบขาวเต็มแถบบน = title bar ตั้งใจ (ไม่ใช่สระล้นขอบ)
  const posterTitleBar = brightPct > 85;
  // หัวข้อฝังในรูปแบบเกม full-bleed: ตัวอักษรขาวเยอะในแถบบน + เริ่มแถวแรก ๆ
  const risky = !posterTitleBar && brightPct > 2.5 && topBrightRow < bandRows * 0.45;
  return {
    path,
    w,
    h,
    brightPct: +brightPct.toFixed(1),
    topBrightRow,
    topBrightPct: +((topBrightRow / h) * 100).toFixed(1),
    risky,
  };
}

export async function reframeCoverSafeTop(src, topSafe = TOP_SAFE_PX) {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let r = 0, g = 0, b = 0;
  for (let x = 0; x < info.width; x++) {
    const i = x * 4;
    r += data[i]; g += data[i + 1]; b += data[i + 2];
  }
  const sky = { r: Math.round(r / info.width), g: Math.round(g / info.width), b: Math.round(b / info.width) };
  const extended = await sharp(src).extend({ top: topSafe, background: sky }).png().toBuffer();
  return sharp(extended).resize(COVER_W, COVER_H).png().toBuffer();
}
