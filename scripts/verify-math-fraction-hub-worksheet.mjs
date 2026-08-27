import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'public/games/math/math-fraction-hub-worksheet.html'), 'utf8');
const source = html.match(/const FH_TOPICS=[\s\S]*?(?=window\.__FRACTION_HUB_TEST__)/)?.[0];
if (!source) throw new Error('ไม่พบตัวสร้างโจทย์เศษส่วน');

let activeLevel = 'mid', activeTopic = 'mixed';
const context = {
  document: { getElementById(id) { return id === 'selLevel' ? { value: activeLevel } : id === 'selTopic' ? { value: activeTopic } : { value: '6', dataset: {} }; } },
};
vm.runInNewContext(`${source}\nresult={topics:FH_TOPICS,levels:FH_LEVEL_DENOMS,buildTopic:fhBuildTopic,buildPool:fhBuildPool,answer:fhAnswer,bar:fhBarSvg,render:fhRenderQuestion,valueHtml:fhValueHtml,stepLabel:fhResultStepLabel,select:fhSelectPages};`, context, { timeout: 10000 });
const api = context.result;
const errors = [];

function expected(item) {
  const d = item.type.startsWith('mixed_') ? item.p4 : item.p2;
  if (item.type === 'shade' || item.type === 'read') return `${item.p0}/${item.p1}`;
  if (item.type === 'compare') return `${item.p0}/${d} < ${item.p1}/${d}`;
  if (item.type === 'whole') return `${item.p0} ${item.p1}/${item.p2}`;
  if (item.type === 'add' || item.type === 'subtract') {
    const numerator = item.type === 'add' ? item.p0 + item.p1 : item.p0 - item.p1;
    return simplifyMixed(numerator, d);
  }
  const left = item.p0 * d + item.p1;
  const right = item.p2 * d + item.p3;
  return simplifyMixed(item.type === 'mixed_add' ? left + right : left - right, d);
}
function gcd(a, b) { while (b) [a, b] = [b, a % b]; return Math.abs(a) || 1; }
function simplifyMixed(n, d) {
  const whole = Math.floor(n / d), remainder = n % d;
  if (!remainder) return String(whole);
  const divisor = gcd(remainder, d);
  return `${whole ? `${whole} ` : ''}${remainder / divisor}/${d / divisor}`;
}
function rng(seed) {
  let state = seed >>> 0;
  const random = () => { state += 0x6D2B79F5; let value = state; value = Math.imul(value ^ value >>> 15, value | 1); value ^= value + Math.imul(value ^ value >>> 7, value | 61); return ((value ^ value >>> 14) >>> 0) / 4294967296; };
  return { random, shuffle(items) { const result = [...items]; for (let i = result.length - 1; i > 0; i--) { const pick = Math.floor(random() * (i + 1)); [result[i], result[pick]] = [result[pick], result[i]]; } return result; } };
}

for (const [level, denoms] of Object.entries(api.levels)) {
  activeLevel = level;
  const pools = new Map();
  for (const topic of api.topics) {
    const items = api.buildTopic(topic, level);
    pools.set(topic, items);
    const needed = ['shade', 'read', 'compare'].includes(topic) ? 18 : 24;
    if (items.length < needed) errors.push(`${level}/${topic}: มี ${items.length} ข้อ น้อยกว่า ${needed}`);
    if (new Set(items.map(item => item.key)).size !== items.length) errors.push(`${level}/${topic}: canonical key ซ้ำ`);
    for (const item of items) {
      const denominator = item.type.startsWith('mixed_') ? item.p4 : item.type === 'shade' || item.type === 'read' ? item.p1 : item.p2;
      if (!denoms.includes(denominator)) errors.push(`${level}/${item.key}: ตัวส่วนอยู่นอกระดับ`);
      if (item.type === 'subtract' && item.p0 <= item.p1) errors.push(`${level}/${item.key}: ผลลบไม่เป็นบวก`);
      if (item.type === 'add' && (item.p0 >= denominator || item.p1 >= denominator)) errors.push(`${level}/${item.key}: ตัวตั้งบวกต้องเป็นเศษส่วนแท้`);
      if (item.type === 'mixed_sub' && item.p0 * item.p4 + item.p1 <= item.p2 * item.p4 + item.p3) errors.push(`${level}/${item.key}: จำนวนคละลบไม่เป็นบวก`);
      if (api.answer(item) !== expected(item)) errors.push(`${level}/${item.key}: คำตอบผิด ${api.answer(item)} != ${expected(item)}`);
      const rendered = api.render(item);
      const expectedSlots = item.type === 'shade' || item.type === 'read' || item.type === 'whole' ? 2 : item.type === 'compare' ? 1 : 3;
      if ((rendered.match(/answer-slot/g) || []).length !== expectedSlots) errors.push(`${level}/${item.key}: ช่องเติมไม่มีเฉลยครบ`);
      if (rendered.includes('____')) errors.push(`${level}/${item.key}: ยังมีช่องเติมที่ไม่ผูกเฉลย`);
      const answer = api.answer(item);
      if (/^\d+ \d+\/\d+$/.test(answer)) {
        const mixed = api.valueHtml(answer);
        if (!mixed.includes('class="mixed-number"') || !mixed.includes(`data-mixed-number="${answer}"`)) errors.push(`${level}/${item.key}: จำนวนคละไม่ได้อยู่ในกลุ่มเดียว`);
        const visibleMixedText = mixed.replace(/<[^>]+>/g, '');
        if (visibleMixedText.includes('=') || (mixed.match(/class="whole-num"/g) || []).length !== 1 || (mixed.match(/class="frac-stack"/g) || []).length !== 1) errors.push(`${level}/${item.key}: โครงสร้างจำนวนคละไม่ชัดเจน`);
      }
      if (item.type === 'add' || item.type === 'subtract') {
        const raw = item.type === 'add' ? item.p0 + item.p1 : item.p0 - item.p1;
        const expectedLabel = raw > denominator ? 'ก่อนแปลงเป็นจำนวนคละ' : raw === denominator ? 'ก่อนแปลงเป็นจำนวนเต็ม' : gcd(raw, denominator) > 1 ? 'ก่อนย่อ' : 'รวมได้';
        if (api.stepLabel(raw, denominator) !== expectedLabel || !rendered.includes(expectedLabel)) errors.push(`${level}/${item.key}: คำอธิบายขั้นกลางไม่ตรงผลลัพธ์`);
      }
    }
    if (topic === 'shade' || topic === 'read') {
      for (const item of items.slice(0, 12)) {
        const svg = api.bar(item.p0, item.p1, topic === 'shade' ? 'solution' : 'given', false);
        const widths = [...svg.matchAll(/<rect[^>]*width="([\d.]+)"/g)].map(match => Number(match[1]));
        const active = (svg.match(topic === 'shade' ? /solution-fill/g : /given-fill/g) || []).length;
        if (active !== item.p0) errors.push(`${level}/${item.key}: จำนวนช่องที่ระบาย ${active} ไม่ตรง ${item.p0}`);
        if (widths.some(width => Math.abs(width - 360 / item.p1) > 1e-9)) errors.push(`${level}/${item.key}: ช่องภาพกว้างไม่เท่ากัน`);
      }
    }
  }
  const fullPool = api.topics.flatMap(topic => pools.get(topic));
  for (let seed = 1; seed <= 300; seed++) for (const topic of ['mixed', ...api.topics]) {
    activeTopic = topic;
    const count = topic === 'mixed' || ['shade', 'read', 'compare'].includes(topic) ? 6 : 8;
    const random = rng(seed * 101 + count);
    const selectedPool = topic === 'mixed' ? fullPool : pools.get(topic);
    const pages = api.select({ fullPool, selectedPool, count, pageCount: 3, shuffle: items => random.shuffle(items), nextRandom: random.random });
    const keys = pages.flat().map(item => item.key);
    if (pages.some(page => page.length !== count)) errors.push(`${level}/${topic}/seed${seed}: จำนวนข้อไม่ครบ`);
    if (new Set(keys).size !== keys.length) errors.push(`${level}/${topic}/seed${seed}: โจทย์ซ้ำข้ามหน้า`);
    if (topic === 'mixed' && new Set(pages.flat().map(item => item.type)).size !== api.topics.length) errors.push(`${level}/mixed/seed${seed}: ชุด 3 หน้าไม่ครบทักษะ`);
  }
}

if (errors.length) {
  console.error(errors.slice(0, 100).map(error => `FAIL ${error}`).join('\n'));
  if (errors.length > 100) console.error(`... และอีก ${errors.length - 100} รายการ`);
  process.exit(1);
}
console.log('PASS math fraction hub: 3 levels, 8 topics, equal SVG parts, correct answers, 300-seed uniqueness matrix');
