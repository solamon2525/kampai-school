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
  ['phonics-chart.html', 'phonics-media.html', 'phonics-chart', 'phonics-media'],
  ['sight-words-p4.html', 'sight-words-media.html', 'sight-words-p4', 'sight-words-media'],
  ['grammar-mini.html', 'grammar-mini-media.html', 'grammar-mini', 'grammar-mini-media'],
  ['follow-instructions.html', 'follow-instructions-media.html', 'follow-instructions', 'follow-instructions-media'],
];

for (const [oldF, newF, oldS, newS] of map) {
  const dest = `public/games/english/${newF}`;
  let t = fs.readFileSync(dest, 'utf8');
  t = t.split(`setSlug('${oldS}')`).join(`setSlug('${newS}')`);
  t = t.split(`MEDIA_SLUG = '${oldS}'`).join(`MEDIA_SLUG = '${newS}'`);
  fs.writeFileSync(dest, t);
  fs.writeFileSync(`public/games/english/${oldF}`, redirect(`/games/english/${newF}`));
  console.log('media+redirect', newF);
}

const ws = [
  ['phonics-worksheet.html', '/games/english/phonics-chart.html', '/games/english/phonics-media.html'],
  ['sight-words-worksheet.html', '/games/english/sight-words-p4.html', '/games/english/sight-words-media.html'],
  ['grammar-mini-worksheet.html', '/games/english/grammar-mini.html', '/games/english/grammar-mini-media.html'],
  ['follow-instructions-worksheet.html', '/games/english/follow-instructions.html', '/games/english/follow-instructions-media.html'],
];

for (const [f, o, n] of ws) {
  const p = `public/games/english/${f}`;
  let t = fs.readFileSync(p, 'utf8');
  if (!t.includes(o)) {
    console.log('MISS', f);
    continue;
  }
  fs.writeFileSync(p, t.split(o).join(n));
  console.log('ws', f);
}
