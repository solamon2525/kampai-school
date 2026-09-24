#!/usr/bin/env node
/**
 * Generate a printable lithophane STL from a photo.
 * Dark areas = thicker plastic (opaque), bright areas = thinner (translucent).
 *
 * Usage:
 *   node scripts/generate-lithophane-stl.mjs <input.png> [out.stl]
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const inputPath = process.argv[2];
const outputPath =
  process.argv[3] ||
  path.join(
    path.dirname(inputPath),
    `${path.basename(inputPath, path.extname(inputPath))}-lithophane.stl`,
  );

if (!inputPath) {
  console.error("Usage: node scripts/generate-lithophane-stl.mjs <input.png> [out.stl]");
  process.exit(1);
}

// Print size (mm) — portrait plaque suitable for FDM
const WIDTH_MM = 100;
const MAX_HEIGHT_MM = 160;
const BORDER_MM = 4;
const BASE_MM = 0.8; // solid back plate
const MIN_RELIEF_MM = 0.4; // thinnest (bright)
const MAX_RELIEF_MM = 2.6; // thickest (dark)
const MAX_COLS = 220; // mesh resolution (cols); rows follow aspect

const src = sharp(inputPath).rotate(); // honor EXIF
const meta = await src.metadata();
const srcW = meta.width || 1;
const srcH = meta.height || 1;
const aspect = srcH / srcW;

const cols = Math.min(MAX_COLS, srcW);
const rows = Math.max(2, Math.round(cols * aspect));
const widthMm = WIDTH_MM;
const heightMm = Math.min(MAX_HEIGHT_MM, widthMm * aspect);
const cellX = widthMm / (cols - 1);
const cellY = heightMm / (rows - 1);

const { data, info } = await src
  .resize(cols, rows, { fit: "fill", kernel: sharp.kernel.lanczos3 })
  .removeAlpha()
  .greyscale()
  .raw()
  .toBuffer({ resolveWithObject: true });

const w = info.width;
const h = info.height;

/** luminance 0..1 → thickness above base (mm). Darker = thicker. */
function relief(v) {
  const t = 1 - v / 255; // invert: dark → 1
  return MIN_RELIEF_MM + t * (MAX_RELIEF_MM - MIN_RELIEF_MM);
}

// Height field including border frame
const bx = Math.max(1, Math.round(BORDER_MM / cellX));
const by = Math.max(1, Math.round(BORDER_MM / cellY));
const gw = w + bx * 2;
const gh = h + by * 2;
const heights = new Float32Array(gw * gh);

for (let y = 0; y < gh; y++) {
  for (let x = 0; x < gw; x++) {
    const i = y * gw + x;
    const inBorder = x < bx || x >= gw - bx || y < by || y >= gh - by;
    if (inBorder) {
      heights[i] = BASE_MM + MAX_RELIEF_MM; // frame rim
    } else {
      const sx = x - bx;
      const sy = y - by;
      heights[i] = BASE_MM + relief(data[sy * w + sx]);
    }
  }
}

function vtx(x, y, z) {
  return [x * cellX, (gh - 1 - y) * cellY, z];
}

/** Binary STL writer */
const triCount =
  // front surface quads (2 tris each)
  (gw - 1) * (gh - 1) * 2 +
  // back plate (2)
  2 +
  // 4 walls: each edge has (n-1)*2 tris
  (gw - 1) * 2 * 2 +
  (gh - 1) * 2 * 2;

const buf = Buffer.alloc(84 + triCount * 50);
buf.write("kampai lithophane", 0, "ascii");
buf.writeUInt32LE(triCount, 80);

let offset = 84;
let written = 0;

function writeTri(a, b, c) {
  const ux = b[0] - a[0];
  const uy = b[1] - a[1];
  const uz = b[2] - a[2];
  const vx = c[0] - a[0];
  const vy = c[1] - a[1];
  const vz = c[2] - a[2];
  let nx = uy * vz - uz * vy;
  let ny = uz * vx - ux * vz;
  let nz = ux * vy - uy * vx;
  const len = Math.hypot(nx, ny, nz) || 1;
  nx /= len;
  ny /= len;
  nz /= len;
  buf.writeFloatLE(nx, offset);
  buf.writeFloatLE(ny, offset + 4);
  buf.writeFloatLE(nz, offset + 8);
  offset += 12;
  for (const p of [a, b, c]) {
    buf.writeFloatLE(p[0], offset);
    buf.writeFloatLE(p[1], offset + 4);
    buf.writeFloatLE(p[2], offset + 8);
    offset += 12;
  }
  buf.writeUInt16LE(0, offset);
  offset += 2;
  written++;
}

// Front surface
for (let y = 0; y < gh - 1; y++) {
  for (let x = 0; x < gw - 1; x++) {
    const z00 = heights[y * gw + x];
    const z10 = heights[y * gw + x + 1];
    const z01 = heights[(y + 1) * gw + x];
    const z11 = heights[(y + 1) * gw + x + 1];
    const p00 = vtx(x, y, z00);
    const p10 = vtx(x + 1, y, z10);
    const p01 = vtx(x, y + 1, z01);
    const p11 = vtx(x + 1, y + 1, z11);
    writeTri(p00, p01, p10);
    writeTri(p10, p01, p11);
  }
}

// Back plate (z=0), outward normal -Z
{
  const p00 = vtx(0, 0, 0);
  const p10 = vtx(gw - 1, 0, 0);
  const p01 = vtx(0, gh - 1, 0);
  const p11 = vtx(gw - 1, gh - 1, 0);
  writeTri(p00, p10, p01);
  writeTri(p10, p11, p01);
}

// Bottom edge (y=gh-1 in grid → y=0 in mm after flip... walls use grid coords)
for (let x = 0; x < gw - 1; x++) {
  // top of image (grid y=0) wall
  {
    const a = vtx(x, 0, 0);
    const b = vtx(x + 1, 0, 0);
    const c = vtx(x, 0, heights[x]);
    const d = vtx(x + 1, 0, heights[x + 1]);
    writeTri(a, c, b);
    writeTri(b, c, d);
  }
  // bottom of image (grid y=gh-1)
  {
    const y = gh - 1;
    const a = vtx(x, y, 0);
    const b = vtx(x + 1, y, 0);
    const c = vtx(x, y, heights[y * gw + x]);
    const d = vtx(x + 1, y, heights[y * gw + x + 1]);
    writeTri(a, b, c);
    writeTri(b, d, c);
  }
}

for (let y = 0; y < gh - 1; y++) {
  // left wall x=0
  {
    const a = vtx(0, y, 0);
    const b = vtx(0, y + 1, 0);
    const c = vtx(0, y, heights[y * gw]);
    const d = vtx(0, y + 1, heights[(y + 1) * gw]);
    writeTri(a, b, c);
    writeTri(b, d, c);
  }
  // right wall x=gw-1
  {
    const x = gw - 1;
    const a = vtx(x, y, 0);
    const b = vtx(x, y + 1, 0);
    const c = vtx(x, y, heights[y * gw + x]);
    const d = vtx(x, y + 1, heights[(y + 1) * gw + x]);
    writeTri(a, c, b);
    writeTri(b, c, d);
  }
}

if (written !== triCount) {
  console.error(`Triangle count mismatch: wrote ${written}, expected ${triCount}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, buf.subarray(0, offset));

// Preview PNG (height visualization)
const previewPath = outputPath.replace(/\.stl$/i, "-preview.png");
const preview = Buffer.alloc(w * h * 3);
for (let i = 0; i < w * h; i++) {
  const t = data[i];
  preview[i * 3] = t;
  preview[i * 3 + 1] = t;
  preview[i * 3 + 2] = t;
}
await sharp(preview, { raw: { width: w, height: h, channels: 3 } })
  .png()
  .toFile(previewPath);

console.log(
  JSON.stringify(
    {
      input: inputPath,
      stl: outputPath,
      preview: previewPath,
      mesh: { cols: gw, rows: gh, triangles: triCount },
      size_mm: {
        width: +(widthMm + BORDER_MM * 2).toFixed(1),
        height: +(heightMm + BORDER_MM * 2).toFixed(1),
        thickness_max: +(BASE_MM + MAX_RELIEF_MM).toFixed(1),
      },
      bytes: offset,
    },
    null,
    2,
  ),
);
