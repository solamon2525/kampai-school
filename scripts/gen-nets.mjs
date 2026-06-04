// gen-nets.mjs — preview รูปคลี่ (net) ของแต่ละทรง ก่อนเอาไปวาดใน canvas เกม
import { writeFileSync } from 'fs';
// NETS: รูปคลี่ใน box 0..100 · ใช้ data เดียวกันทั้ง SVG preview และ canvas เกม
export const NETS = {
  cube: [ {t:'rect',x:39,y:6,w:22,h:22},{t:'rect',x:39,y:28,w:22,h:22},{t:'rect',x:39,y:50,w:22,h:22},{t:'rect',x:39,y:72,w:22,h:22},{t:'rect',x:17,y:28,w:22,h:22},{t:'rect',x:61,y:28,w:22,h:22} ],
  sqpyramid: [ {t:'rect',x:39,y:39,w:22,h:22},{t:'poly',p:[[39,39],[61,39],[50,17]]},{t:'poly',p:[[39,61],[61,61],[50,83]]},{t:'poly',p:[[39,39],[39,61],[17,50]]},{t:'poly',p:[[61,39],[61,61],[83,50]]} ],
  triprism: [ {t:'rect',x:20,y:40,w:20,h:34},{t:'rect',x:40,y:40,w:20,h:34},{t:'rect',x:60,y:40,w:20,h:34},{t:'poly',p:[[40,40],[60,40],[50,20]]},{t:'poly',p:[[40,74],[60,74],[50,94]]} ],
  cylinder: [ {t:'rect',x:30,y:36,w:40,h:32},{t:'circle',cx:50,cy:22,r:12},{t:'circle',cx:50,cy:82,r:12} ],
  cone: [ {t:'sector',cx:50,cy:16,r:42,a0:40,a1:140},{t:'circle',cx:50,cy:80,r:13} ],
};
const NAMES = { cube:'ลูกบาศก์', sqpyramid:'พีระมิด', triprism:'ปริซึมสามเหลี่ยม', cylinder:'ทรงกระบอก', cone:'กรวย' };
const COL = '#fcd34d';
function shapeSvg(s) {
  if (s.t==='rect') return `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" fill="${COL}" stroke="#0f172a" stroke-width="1.5"/>`;
  if (s.t==='poly') return `<polygon points="${s.p.map(p=>p.join(',')).join(' ')}" fill="${COL}" stroke="#0f172a" stroke-width="1.5"/>`;
  if (s.t==='circle') return `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" fill="${COL}" stroke="#0f172a" stroke-width="1.5"/>`;
  if (s.t==='sector') { const d=a=>a*Math.PI/180; const x0=s.cx+s.r*Math.cos(d(s.a0)),y0=s.cy+s.r*Math.sin(d(s.a0)),x1=s.cx+s.r*Math.cos(d(s.a1)),y1=s.cy+s.r*Math.sin(d(s.a1)); return `<path d="M${s.cx},${s.cy} L${x0.toFixed(1)},${y0.toFixed(1)} A${s.r},${s.r} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)} Z" fill="${COL}" stroke="#0f172a" stroke-width="1.5"/>`; }
  return '';
}
const keys = Object.keys(NETS);
let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${keys.length*120} 140" width="${keys.length*120}" height="140"><rect width="100%" height="100%" fill="#1e3a8a"/>`;
keys.forEach((k,i)=>{ svg+=`<g transform="translate(${i*120+10},6)">`; NETS[k].forEach(s=>svg+=shapeSvg(s)); svg+=`<text x="50" y="112" font-size="11" fill="#fff" text-anchor="middle" font-family="sans-serif">${NAMES[k]}</text></g>`; });
svg+=`</svg>`;
writeFileSync('tmp-nets.svg', svg);
console.log('wrote tmp-nets.svg');
