import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const html=fs.readFileSync(path.join(root,'public/games/math/mixed-number-media.html'),'utf8');
const source=html.match(/\/\* CORE_START \*\/([\s\S]*?)\/\* CORE_END \*\//)?.[1];
if(!source)throw new Error('ไม่พบ MixedNumberCore');
const context={window:{}};vm.runInNewContext(source,context,{timeout:5000});const api=context.window.MixedNumberCore,errors=[];
for(let d=2;d<=12;d++)for(let w=0;w<=6;w++)for(let n=0;n<d;n++){
  const improper=api.toImproper(w,n,d),mixed=api.fromImproper(improper,d);
  const expectedValue=w+n/d,actualValue=mixed.whole+(mixed.numerator/mixed.denominator);
  if(Math.abs(expectedValue-actualValue)>1e-12)errors.push(`convert ${w} ${n}/${d}`);
  const pos=api.numberLinePosition(expectedValue,Math.max(1,w+1));if(pos<0||pos>1)errors.push(`number line ${w} ${n}/${d}`);
}
for(let d1=2;d1<=10;d1++)for(let d2=2;d2<=10;d2++)for(const op of ['+','−']){
  const a={whole:3,numerator:d1-1,denominator:d1},b={whole:1,numerator:1,denominator:d2};
  const calc=api.operate(a,b,op);const av=a.whole+a.numerator/d1,bv=b.whole+b.numerator/d2,rv=calc.result.whole+calc.result.numerator/calc.result.denominator;
  if(Math.abs(rv-(op==='+'?av+bv:av-bv))>1e-12)errors.push(`operate ${d1} ${op} ${d2}`);
  if(calc.result.numerator&&api.gcd(calc.result.numerator,calc.result.denominator)!==1)errors.push(`unsimplified ${d1} ${op} ${d2}`);
}
const compareCases=[[{whole:1,numerator:2,denominator:3},{whole:1,numerator:3,denominator:4},-1],[{whole:2,numerator:1,denominator:5},{whole:1,numerator:9,denominator:10},1],[{whole:1,numerator:1,denominator:2},{whole:1,numerator:2,denominator:4},0]];
for(const[a,b,expected]of compareCases)if(api.compare(a,b)!==expected)errors.push('compare');
for(const token of ['ความหมายของจำนวนคละ','ภาพจำนวนเต็มและส่วนที่เหลือ','จำนวนคละ ↔ เศษเกิน','เปรียบเทียบจำนวนคละ','บวก–ลบแบบทีละขั้น','ตรวจคำตอบด้วยภาพและเส้นจำนวน','data-mode="learn"','data-mode="practice"','mixed-number-media'])if(!html.includes(token))errors.push(`missing ${token}`);
if(/submitScore\s*\(/.test(html))errors.push('media must not submit score');
if(errors.length){console.error(errors.slice(0,30).join('\n'));process.exit(1)}
console.log('PASS mixed-number media: conversion, simplification, comparison, exact operations, number-line bounds, six lessons');
