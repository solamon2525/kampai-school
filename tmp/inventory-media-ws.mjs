import fs from 'fs';
import path from 'path';

const root = 'D:/kampai-school-main/public/games';

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else acc.push(p.replace(/\\/g, '/'));
  }
  return acc;
}

const all = walk(root);
const media = all.filter(
  (p) => /-(thinking-)?media\.html$/.test(p) && !p.includes('_template-media'),
);
const worksheets = all.filter(
  (p) => /-worksheet\.html$/.test(p) && !p.includes('_template-worksheet'),
);

function subject(p) {
  const rel = p.slice(root.length + 1);
  return rel.split('/')[0];
}
function base(p) {
  return path.basename(p);
}
function mediaStem(name) {
  return name.replace(/-thinking-media\.html$/, '').replace(/-media\.html$/, '');
}
function wsStem(name) {
  return name.replace(/-worksheet\.html$/, '');
}

const mediaByStem = new Map();
for (const m of media) mediaByStem.set(mediaStem(base(m)), m);
const wsByStem = new Map();
for (const w of worksheets) wsByStem.set(wsStem(base(w)), w);

// Known naming mismatches
const mediaToWsAlias = {
  'thai-narration-style': 'narration-style',
  'thai-implied-meaning': 'implied-meaning',
  'digestive-system': 'digestive',
  'long-division': 'division',
};

function findWsForMedia(stem) {
  if (wsByStem.has(stem)) return { ws: wsByStem.get(stem), how: 'exact' };
  if (mediaToWsAlias[stem] && wsByStem.has(mediaToWsAlias[stem])) {
    return { ws: wsByStem.get(mediaToWsAlias[stem]), how: 'alias:' + mediaToWsAlias[stem] };
  }
  if (stem.startsWith('thai-')) {
    const s = stem.slice(5);
    if (wsByStem.has(s)) return { ws: wsByStem.get(s), how: 'strip-thai' };
  }
  return null;
}

function findMediaForWs(stem) {
  if (mediaByStem.has(stem)) return { m: mediaByStem.get(stem), how: 'exact' };
  for (const [mStem, a] of Object.entries(mediaToWsAlias)) {
    if (a === stem && mediaByStem.has(mStem)) return { m: mediaByStem.get(mStem), how: 'alias:' + mStem };
  }
  if (mediaByStem.has('thai-' + stem)) return { m: mediaByStem.get('thai-' + stem), how: 'add-thai' };
  return null;
}

const mediaNoWs = [];
const mediaPaired = [];
for (const m of media) {
  const stem = mediaStem(base(m));
  const hit = findWsForMedia(stem);
  if (hit) mediaPaired.push({ file: base(m), sub: subject(m), stem, how: hit.how, ws: base(hit.ws) });
  else mediaNoWs.push({ file: base(m), sub: subject(m), stem });
}

const wsHub = [];
const wsPairedByName = [];
const wsNoMediaByName = [];
for (const w of worksheets) {
  const stem = wsStem(base(w));
  const isHub = stem.endsWith('-hub') || stem.includes('-hub-');
  if (isHub) wsHub.push({ file: base(w), sub: subject(w), stem });
  const hit = findMediaForWs(stem);
  if (hit) wsPairedByName.push({ file: base(w), sub: subject(w), stem, how: hit.how, media: base(hit.m) });
  else if (!isHub) wsNoMediaByName.push({ file: base(w), sub: subject(w), stem });
}

const missingSource = [];
const redirectOnly = [];
const okSource = [];
const noMeta = [];
const sourceMap = [];

for (const w of worksheets) {
  const html = fs.readFileSync(w, 'utf8');
  const meta =
    html.match(/name=["']worksheet-source-media["']\s+content=["']([^"']+)["']/i) ||
    html.match(/content=["']([^"']+)["']\s+name=["']worksheet-source-media["']/i);
  const srcUrl = html.match(/sourceMediaUrl\s*:\s*['"]([^'"]+)['"]/);
  const url = (meta && meta[1]) || (srcUrl && srcUrl[1]) || null;
  if (!url) {
    noMeta.push({ file: base(w), sub: subject(w) });
    continue;
  }
  const local = path.join('D:/kampai-school-main/public', url.replace(/^\//, ''));
  const exists = fs.existsSync(local);
  sourceMap.push({ file: base(w), sub: subject(w), url, exists });
  if (!exists) {
    missingSource.push({ file: base(w), sub: subject(w), url });
    continue;
  }
  const content = fs.readFileSync(local, 'utf8');
  const hasRefresh = /meta\s+http-equiv=["']refresh["']/i.test(content);
  const hasLoc = /location\.(replace|href)\s*=/.test(content);
  const tiny = content.length < 1200 && (hasRefresh || hasLoc);
  const isMediaLike = /-(thinking-)?media\.html$/.test(url) || /\/index\.html$/.test(url);
  if (tiny || (hasRefresh && content.length < 3000)) {
    const refresh = content.match(/url=([^"'>\s]+)/i);
    const loc = content.match(/location\.(?:replace\(|href\s*=\s*)['"]([^'"]+)/);
    redirectOnly.push({
      file: base(w),
      sub: subject(w),
      url,
      target: (refresh && refresh[1]) || (loc && loc[1]) || null,
      size: content.length,
      isMediaLike,
    });
  } else {
    okSource.push({ file: base(w), url, size: content.length });
  }
}

const shallow = [];
const noWorkFill = [];
const stepStats = [];
for (const w of worksheets) {
  const html = fs.readFileSync(w, 'utf8');
  const stepRows = (html.match(/step-row/g) || []).length;
  const workFill = (html.match(/work-fill/g) || []).length;
  const workArea = (html.match(/work-area|work-space|scaffold/g) || []).length;
  stepStats.push({ file: base(w), sub: subject(w), stepRows, workFill, workArea });
  if (workFill === 0) noWorkFill.push({ file: base(w), sub: subject(w), stepRows });
  if (stepRows <= 3 && workFill === 0) {
    shallow.push({ file: base(w), sub: subject(w), stepRows, workFill, workArea });
  }
}

const practiceOk = [];
const practiceWeak = [];
for (const m of media) {
  const html = fs.readFileSync(m, 'utf8');
  const hasDataMode = /data-mode=["']practice["']/.test(html);
  const hasThai = /ฝึกสั้น/.test(html);
  if (hasDataMode || hasThai) practiceOk.push({ file: base(m), sub: subject(m), hasDataMode, hasThai });
  else practiceWeak.push({ file: base(m), sub: subject(m) });
}

const verCounts = {};
const mediaVers = {};
const wsVers = {};
function collectVers(files, bucket) {
  for (const f of files) {
    const html = fs.readFileSync(f, 'utf8');
    const uniq = [...new Set([...html.matchAll(/\?v=([\d.]+)/g)].map((x) => x[1]))];
    for (const v of uniq) {
      verCounts[v] = (verCounts[v] || 0) + 1;
      bucket[v] = (bucket[v] || 0) + 1;
    }
  }
}
collectVers(media, mediaVers);
collectVers(worksheets, wsVers);

// media cache versions specifically for shared assets
const mediaAssetVers = {};
for (const m of media) {
  const html = fs.readFileSync(m, 'utf8');
  for (const v of [...new Set([...html.matchAll(/\?v=([\d.]+)/g)].map((x) => x[1]))]) {
    mediaAssetVers[v] = (mediaAssetVers[v] || 0) + 1;
  }
}

function countBySub(files) {
  const o = {};
  for (const f of files) {
    const s = subject(f);
    o[s] = (o[s] || 0) + 1;
  }
  return o;
}

const coversDir = 'D:/kampai-school-main/output/covers';
const coverFiles = fs.existsSync(coversDir)
  ? fs.readdirSync(coversDir).filter((f) => /media/i.test(f))
  : [];

const out = {
  mediaTotal: media.length,
  wsTotal: worksheets.length,
  thinkingCount: media.filter((m) => /-thinking-media\.html$/.test(m)).length,
  mediaBySub: countBySub(media),
  wsBySub: countBySub(worksheets),
  mediaList: media
    .map((m) => ({ sub: subject(m), file: base(m), thinking: /-thinking-media/.test(m) }))
    .sort((a, b) => a.sub.localeCompare(b.sub) || a.file.localeCompare(b.file)),
  wsList: worksheets
    .map((w) => ({
      sub: subject(w),
      file: base(w),
      hub: /-hub-worksheet/.test(w),
    }))
    .sort((a, b) => a.sub.localeCompare(b.sub) || a.file.localeCompare(b.file)),
  mediaNoWs,
  mediaPairedCount: mediaPaired.length,
  mediaPairedAliased: mediaPaired.filter((x) => x.how !== 'exact'),
  wsHub,
  wsNoMediaByName,
  wsPairedByNameCount: wsPairedByName.length,
  missingSource,
  redirectOnly,
  okSourceCount: okSource.length,
  noMeta,
  shallow,
  noWorkFill,
  stepStatsLow: stepStats.filter((s) => s.stepRows <= 3).sort((a, b) => a.stepRows - b.stepRows),
  practiceWeak,
  practiceOkCount: practiceOk.length,
  practiceOkPartial: practiceOk.filter((p) => !p.hasDataMode || !p.hasThai),
  verCounts,
  mediaVers,
  wsVers,
  coverFiles,
  hubsOnDisk: walk(root)
    .filter((p) => /\/index\.html$/.test(p) && /-hub\//.test(p))
    .map((p) => p.slice(root.length + 1)),
};

fs.writeFileSync('D:/kampai-school-main/tmp/inventory-result.json', JSON.stringify(out, null, 2));
console.log('wrote tmp/inventory-result.json');
console.log(
  JSON.stringify(
    {
      mediaTotal: out.mediaTotal,
      wsTotal: out.wsTotal,
      thinkingCount: out.thinkingCount,
      mediaBySub: out.mediaBySub,
      wsBySub: out.wsBySub,
      mediaNoWs: out.mediaNoWs,
      wsNoMediaByName: out.wsNoMediaByName,
      missingSource: out.missingSource,
      redirectOnly: out.redirectOnly,
      noMeta: out.noMeta,
      shallowCount: out.shallow.length,
      noWorkFillCount: out.noWorkFill.length,
      practiceWeak: out.practiceWeak,
      practiceOkCount: out.practiceOkCount,
      verCounts: out.verCounts,
      mediaVers: out.mediaVers,
      wsVers: out.wsVers,
      coverCount: out.coverFiles.length,
      wsHubCount: out.wsHub.length,
      mediaPairedAliased: out.mediaPairedAliased,
    },
    null,
    2,
  ),
);
