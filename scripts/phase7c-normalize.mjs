import fs from 'node:fs';

function redirect(to) {
  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta http-equiv="refresh" content="0;url=${to}">
<title>Redirect</title>
<script>location.replace('${to}'+location.search+location.hash)</script>
</head>
<body>
<p>ย้ายไป <a href="${to}">${to}</a></p>
</body>
</html>
`;
}

const map = [
  ['public/games/social/thailand-map.html', 'public/games/social/thailand-map-media.html', 'thailand-map', 'thailand-map-media', '/games/social/thailand-map-media.html'],
  ['public/games/social/sukhothai-timeline.html', 'public/games/social/sukhothai-timeline-media.html', 'sukhothai-timeline', 'sukhothai-timeline-media', '/games/social/sukhothai-timeline-media.html'],
  ['public/games/science/water-cycle.html', 'public/games/science/water-cycle-media.html', 'water-cycle', 'water-cycle-media', '/games/science/water-cycle-media.html'],
];

for (const [src, dest, oldS, newS, url] of map) {
  let t = fs.readFileSync(src, 'utf8');
  // if already redirect, skip
  if (t.includes('http-equiv="refresh"') && t.includes('-media.html')) {
    console.log('src already redirect', src);
    continue;
  }
  t = t.split(`setSlug('${oldS}')`).join(`setSlug('${newS}')`);
  t = t.split(`MEDIA_SLUG = '${oldS}'`).join(`MEDIA_SLUG = '${newS}'`);
  t = t.split(`GAME_SLUG='${oldS}'`).join(`GAME_SLUG='${newS}'`);
  t = t.split(`setSlug("${oldS}")`).join(`setSlug("${newS}")`);
  fs.writeFileSync(dest, t);
  fs.writeFileSync(src, redirect(url));
  console.log('normalized', dest);
}

const ws = [
  ['public/games/social/thailand-map-worksheet.html', '/games/social/thailand-map.html', '/games/social/thailand-map-media.html'],
  ['public/games/social/sukhothai-timeline-worksheet.html', '/games/social/sukhothai-timeline.html', '/games/social/sukhothai-timeline-media.html'],
  ['public/games/science/water-cycle-worksheet.html', '/games/science/water-cycle.html', '/games/science/water-cycle-media.html'],
];
for (const [f, o, n] of ws) {
  let t = fs.readFileSync(f, 'utf8');
  if (!t.includes(o)) {
    console.log('ws miss or already', f);
    continue;
  }
  fs.writeFileSync(f, t.split(o).join(n));
  console.log('ws', f);
}
