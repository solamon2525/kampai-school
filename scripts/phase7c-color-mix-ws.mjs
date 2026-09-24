import fs from 'node:fs';

const p = 'public/games/arts/color-mix-worksheet.html';
let t = fs.readFileSync(p, 'utf8');
t = t.split('/games/arts/color-wheel-media.html').join('/games/arts/color-mix-media.html');
t = t.split('ใบงานวงล้อสี').join('ใบงานผสมสีแม่สี');
t = t.split("mediaLabel:'วงล้อสี'").join("mediaLabel:'ผสมสีแม่สี'");
if (!t.includes("worksheetKey:'color-mix'")) {
  t = t.replace('window.WORKSHEET_CONFIG={', "window.WORKSHEET_CONFIG={\n  worksheetKey:'color-mix',");
}
fs.writeFileSync(p, t);
console.log({
  media: t.includes('color-mix-media'),
  key: t.includes("worksheetKey:'color-mix'"),
  title: t.includes('ใบงานผสมสีแม่สี'),
});
