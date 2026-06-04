// gen-world-map.mjs — สร้าง SVG แผนที่โลก equirectangular จากข้อมูลทวีป (preview ก่อนเอาไปวาดใน CanvasTexture)
import { writeFileSync } from 'fs';
const W = 1024, H = 512;
const X = (lon) => (lon + 180) / 360 * W;
const Y = (lat) => (90 - lat) / 180 * H;
// ทวีป: [lon,lat] โดยประมาณ (stylized) + สี
export const CONTINENTS = [
  { key:'asia', name:'เอเชีย', color:'#fbbf24', c:[100,45], pts:[[40,40],[55,72],[100,75],[140,72],[150,55],[135,45],[143,30],[122,25],[122,12],[105,8],[100,20],[95,8],[80,8],[78,22],[60,25],[45,32]] },
  { key:'europe', name:'ยุโรป', color:'#f472b6', c:[18,55], pts:[[-10,45],[0,60],[12,66],[30,68],[40,60],[40,46],[28,40],[12,38],[0,43]] },
  { key:'africa', name:'แอฟริกา', color:'#34d399', c:[20,2], pts:[[-12,33],[12,35],[33,32],[44,12],[50,-12],[35,-35],[18,-35],[12,-18],[8,4],[-12,8],[-17,16]] },
  { key:'namerica', name:'อเมริกาเหนือ', color:'#60a5fa', c:[-100,45], pts:[[-160,68],[-120,71],[-90,68],[-60,60],[-55,47],[-72,42],[-80,25],[-97,16],[-107,22],[-125,40],[-130,55]] },
  { key:'samerica', name:'อเมริกาใต้', color:'#a78bfa', c:[-60,-20],pts:[[-78,8],[-60,10],[-50,0],[-35,-8],[-40,-23],[-58,-40],[-70,-53],[-73,-40],[-70,-18],[-80,-5]] },
  { key:'australia', name:'ออสเตรเลีย', color:'#fb923c', c:[134,-25],pts:[[115,-22],[130,-12],[143,-12],[151,-25],[150,-37],[138,-38],[120,-34],[113,-26]] },
  { key:'antarctica', name:'แอนตาร์กติกา', color:'#e5e7eb', c:[0,-80], pts:[[-180,-71],[180,-71],[180,-90],[-180,-90]] },
];
const poly = (pts, fill) => `<polygon points="${pts.map(([lo,la])=>`${X(lo).toFixed(1)},${Y(la).toFixed(1)}`).join(' ')}" fill="${fill}" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>`;
let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`;
svg += `<rect width="${W}" height="${H}" fill="#1d4ed8"/>`;
for (const ct of CONTINENTS) svg += poly(ct.pts, ct.color);
for (const ct of CONTINENTS) svg += `<text x="${X(ct.c[0]).toFixed(0)}" y="${Y(ct.c[1]).toFixed(0)}" font-size="16" fill="#0f172a" text-anchor="middle" font-family="sans-serif" font-weight="bold">${ct.name}</text>`;
svg += `</svg>`;
writeFileSync('tmp-world.svg', svg);
console.log('wrote tmp-world.svg');
