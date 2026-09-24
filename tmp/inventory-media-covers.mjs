import fs from 'fs';
import path from 'path';

const root = 'D:/kampai-school-main/public/games';
const exts = ['.svg', '.png', '.jpg', '.webp'];

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (/-media\.html$/i.test(ent.name) && !ent.name.startsWith('_template')) acc.push(p);
  }
  return acc;
}

function readSvgSize(filePath) {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    if (!text.includes('<svg')) return null;
    const vb = text.match(/viewBox\s*=\s*["']\s*[\d.+-]+\s+[\d.+-]+\s+([\d.]+)\s+([\d.]+)/i);
    if (vb) return { w: parseFloat(vb[1]), h: parseFloat(vb[2]), via: 'viewBox' };
    const w = text.match(/\bwidth\s*=\s*["']?([\d.]+)/i);
    const h = text.match(/\bheight\s*=\s*["']?([\d.]+)/i);
    if (w && h) return { w: parseFloat(w[1]), h: parseFloat(h[1]), via: 'attrs' };
  } catch {}
  return null;
}

function readPngSize(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    if (buf.length >= 24 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
      return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
    }
  } catch {}
  return null;
}

function candidatesFor(htmlPath) {
  const dir = path.dirname(htmlPath);
  const base = path.basename(htmlPath, '.html');
  const cands = new Set();
  for (const e of exts) cands.add(path.join(dir, base + '-cover' + e));
  if (base.endsWith('-thinking-media')) {
    const thinkingStem = base.replace(/-media$/, ''); // foo-thinking
    for (const e of exts) cands.add(path.join(dir, thinkingStem + '-cover' + e));
  }
  if (base.endsWith('-media')) {
    const short = base.replace(/-media$/, '');
    for (const e of exts) cands.add(path.join(dir, short + '-cover' + e));
  }
  return [...cands];
}

const medias = walk(root).sort();
const results = medias.map((htmlPath) => {
  const base = path.basename(htmlPath, '.html');
  const found = candidatesFor(htmlPath).filter((f) => fs.existsSync(f));
  const byExt = { svg: [], png: [], jpg: [], webp: [] };
  for (const f of found) {
    const e = path.extname(f).slice(1).toLowerCase();
    if (byExt[e]) byExt[e].push(f.replace(/\\/g, '/'));
  }
  const dims = [];
  for (const f of found) {
    const e = path.extname(f).toLowerCase();
    let size = null;
    if (e === '.svg') size = readSvgSize(f);
    else if (e === '.png') size = readPngSize(f);
    if (size) {
      const ratio = size.w / size.h;
      const ok169 = Math.abs(ratio - 16 / 9) < 0.03;
      dims.push({
        file: path.basename(f),
        ...size,
        ratio: Number(ratio.toFixed(3)),
        ok169,
      });
    }
  }
  return {
    html: htmlPath.replace(/\\/g, '/'),
    base,
    thinking: base.endsWith('-thinking-media'),
    found: found.map((f) => f.replace(/\\/g, '/')),
    svg: byExt.svg.length,
    png: byExt.png.length,
    jpg: byExt.jpg.length,
    webp: byExt.webp.length,
    hasAny: found.length > 0,
    svgOnly:
      byExt.svg.length > 0 &&
      byExt.png.length === 0 &&
      byExt.jpg.length === 0 &&
      byExt.webp.length === 0,
    dims,
  };
});

const out = {
  total: results.length,
  thinkingCount: results.filter((r) => r.thinking).length,
  withCover: results.filter((r) => r.hasAny).length,
  without: results.filter((r) => !r.hasAny).map((r) => r.html),
  withSvg: results.filter((r) => r.svg > 0).length,
  withPng: results.filter((r) => r.png > 0).length,
  svgOnly: results.filter((r) => r.svgOnly).map((r) => ({ html: r.html, covers: r.found })),
  bothSvgAndPng: results.filter((r) => r.svg > 0 && r.png > 0).length,
  wrongDims: results.flatMap((r) =>
    r.dims
      .filter((d) => !d.ok169)
      .map((d) => ({ html: r.html, ...d })),
  ),
  allDims: results.flatMap((r) => r.dims.map((d) => ({ base: r.base, ...d }))),
  detail: results.map((r) => ({
    base: r.base,
    status: !r.hasAny ? 'MISSING' : r.svgOnly ? 'SVG_ONLY' : r.png ? 'HAS_PNG' : 'HAS_OTHER',
    covers: r.found.map((f) => path.basename(f)),
  })),
};

fs.writeFileSync('D:/kampai-school-main/tmp/media-cover-inventory.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify({
  total: out.total,
  thinkingCount: out.thinkingCount,
  withCover: out.withCover,
  withoutCount: out.without.length,
  withSvg: out.withSvg,
  withPng: out.withPng,
  svgOnlyCount: out.svgOnly.length,
  bothSvgAndPng: out.bothSvgAndPng,
  wrongDimsCount: out.wrongDims.length,
}, null, 2));
console.log('WITHOUT:');
out.without.forEach((p) => console.log(p));
console.log('SVG_ONLY:');
out.svgOnly.forEach((r) => console.log(r.html, '=>', r.covers.join(', ')));
console.log('WRONG_DIMS:');
out.wrongDims.forEach((d) => console.log(d.html, d.file, `${d.w}x${d.h}`, `ratio=${d.ratio}`));
