#!/usr/bin/env node
/**
 * ปกสื่อ AI full-bleed — คุณภาพแบบ rounding/script-hub (Pollinations) + overlay ไทย
 * Usage: node scripts/render-media-covers-ai-pilot.mjs [slug...]
 */
import sharp from 'sharp';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAiPrompt, titleOverlaySvg, titleOverlayHeroSvg, titleOverlayBannerSvg, titleOverlayCleanSvg, W, H } from './lib/edu-cover-fullbleed.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const POLLINATIONS = 'https://image.pollinations.ai/prompt';

const SPECS = {
  'thai-word-types': {
    out: 'public/games/thai/thai-word-types-cover.png',
    title: 'ชนิดของคำ',
    subtitle: 'นาม · กริยา · คุณศัพท์ · สำนวน',
    footer: 'ป.3-4 · ภาษาไทย · สื่อการสอน',
    grade: 'ป.3-4',
    accent: '#7c2d12',
    scene:
      'male teacher pointing at a large whiteboard with three colorful boxes blue green purple representing noun verb adjective word types, Thai elementary students watching, drag-and-drop classification lesson, warm orange classroom',
    colors: 'main color tone: warm orange brown and navy accents',
  },
  'thai-punctuation-hub': {
    out: 'public/games/thai/thai-punctuation-hub/cover.png',
    title: 'คลังวรรคตอนไทย',
    subtitle: 'จุด · จุลภาค · คำถาม · อัศเจรีย์',
    footer: 'ป.4-5 · ภาษาไทย · สื่อการสอน Hub',
    grade: 'ป.4-5',
    accent: '#9f1239',
    scene:
      'male teacher at whiteboard showing large punctuation marks period comma question exclamation, Thai language punctuation lesson, pink rose classroom poster style',
    colors: 'main color tone: rose pink and deep red',
  },
  'decimal-media': {
    out: 'public/games/math/decimal-media-cover.png',
    title: 'ทศนิยม',
    subtitle: 'อ่าน · เปรียบเทียบ · บวกลบ',
    footer: 'ป.4 · คณิตศาสตร์ · สื่อการสอน',
    grade: 'ป.4',
    accent: '#1e3a8a',
    scene:
      'male teacher explaining decimal number 3.45 on whiteboard with place value blocks ones tenths hundredths, math classroom, blue educational poster',
    colors: 'main color tone: bright blue and navy',
  },
  'fact-opinion': {
    out: 'public/games/thai/fact-opinion-cover.png',
    title: 'ข้อเท็จจริง vs ความคิดเห็น',
    subtitle: 'Fact vs Opinion · แยกแยะความจริงกับความรู้สึก',
    footer: 'ป.4 · ภาษาไทย · สื่อการสอน',
    grade: 'ป.4',
    accent: '#7c2d12',
    scene:
      'male teacher pointing at a whiteboard showing a clear contrast between Fact (a blue box with a checkmark) and Opinion (a pink box with a thought bubble), cute cartoon style classroom, happy atmosphere',
    colors: 'main color tone: warm orange, blue and pink accents',
  },
  'thai-literature-hub': {
    out: 'public/games/thai/thai-literature-hub/cover.png',
    title: 'คลังวรรณคดีวรรณกรรม',
    subtitle: 'นิทาน · สุภาษิต · ข้อคิด',
    footer: 'ป.4-5 · ภาษาไทย · สื่อการสอน Hub',
    grade: 'ป.4-5',
    accent: '#a16207',
    scene:
      'male chibi Thai teacher reading Thai folktale to elementary students, whiteboard shows open storybook turtle character speech bubble proverb scroll moral lesson icons, warm golden yellow literature classroom, Thai decorative patterns, cute bright primary school poster',
    colors: 'main color tone: warm gold amber yellow and soft orange',
  },
  'vertebrate-sort': {
    out: 'public/games/science/vertebrate-sort-cover.png',
    overlay: 'hero',
    topClearPct: 32,
    title: 'สัตว์มี/ไม่มี',
    titleLine2: 'กระดูกสันหลัง',
    subtitle: 'ช้าง · ปลา · นก  ↔  ผีเสื้อ · หอย · ปู',
    footer: 'ป.3-4 · วิทยาศาสตร์ · สื่อการสอน',
    grade: 'ป.3-4',
    accent: '#047857',
    scene:
      'male chibi Thai science teacher helping elementary students sort animals into two colorful bins, left bin blue with elephant fish bird vertebrate animals, right bin orange with butterfly snail crab invertebrate animals, cute bright science classroom green nature theme, sorting game poster',
    colors: 'main color tone: emerald green mint blue and warm orange accents',
  },
  'water-cycle': {
    out: 'public/games/science/water-cycle-cover.png',
    overlay: 'banner',
    topClearPct: 24,
    title: 'วัฏจักรน้ำ',
    subtitle: 'ระเหย · ควบแน่น · ฝน · รวมตัว',
    footer: 'ป.3-5 · วิทยาศาสตร์ · สื่อการสอน',
    grade: 'ป.3-5',
    accent: '#0f766e',
    scene:
      'male chibi Thai science teacher explaining water cycle diagram on whiteboard with evaporation condensation precipitation collection arrows, mountains river sun clouds rain, Thai students watching, teal blue nature classroom poster',
    colors: 'main color tone: teal cyan blue and fresh green',
  },
  'bar-chart-media': {
    out: 'public/games/math/bar-chart-media-cover.png',
    overlay: 'banner',
    topClearPct: 24,
    title: 'แผนภูมิแท่ง',
    subtitle: 'อ่าน · เปรียบเทียบ · วิเคราะห์ข้อมูล',
    footer: 'ป.4-5 · คณิตศาสตร์ · สื่อการสอน',
    grade: 'ป.4-5',
    accent: '#1e3a8a',
    scene:
      'male chibi Thai math teacher showing colorful bar chart on whiteboard with rising bars blue green orange purple, students with notebooks, bright math classroom statistics lesson',
    colors: 'main color tone: bright blue navy and colorful chart bars',
  },
  'thai-matra-chart': {
    out: 'public/games/thai/thai-matra-chart-cover.png',
    overlay: 'banner',
    topClearPct: 24,
    title: 'มาตราตัวสะกด',
    subtitle: 'กก · กง · กด · กน · กบ · กม',
    footer: 'ป.1-3 · ภาษาไทย · สื่อการสอน',
    grade: 'ป.1-3',
    accent: '#be123c',
    scene:
      'male chibi Thai teacher pointing at Thai spelling rules chart matra table on whiteboard, pink rose classroom, cute Thai elementary students, spelling lesson poster',
    colors: 'main color tone: rose pink warm red and soft cream',
  },
  'states-of-matter': {
    out: 'public/games/science/states-of-matter-cover.png',
    overlay: 'banner',
    topClearPct: 24,
    title: 'สสาร 3 สถานะ',
    subtitle: 'แข็ง · ของเหลว · ก๊าซ',
    footer: 'ป.3-4 · วิทยาศาสตร์ · สื่อการสอน',
    grade: 'ป.3-4',
    accent: '#0369a1',
    scene:
      'male chibi Thai science teacher demonstrating ice water steam states of matter with thermometer slider on whiteboard, H2O molecule icons, bright cool blue classroom',
    colors: 'main color tone: ice blue cyan and white steam effects',
  },
  'phonics-chart': {
    out: 'public/games/english/phonics-chart-cover.png',
    overlay: 'banner',
    topClearPct: 24,
    title: 'Phonics Chart',
    subtitle: 'A–Z · blends · digraphs · เสียงตัวอักษร',
    footer: 'ป.1-3 · ภาษาอังกฤษ · สื่อการสอน',
    grade: 'ป.1-3',
    accent: '#15803d',
    scene:
      'male chibi Thai English teacher showing phonics chart with apple ball cat pictures on whiteboard, colorful letters blocks, Thai students learning English sounds, bright green classroom',
    colors: 'main color tone: fresh green lime and cheerful primary colors',
  },
  'thai-sentence-hub': {
    out: 'public/games/thai/thai-sentence-hub/cover.png',
    overlay: 'banner',
    overlayXl: true,
    darkText: true,
    noTeacher: true,
    serious: true,
    topClearPct: 30,
    seedOffset: 85,
    title: 'คลังประโยคไทย',
    subtitle: 'ประธาน · กริยา · กรรม · ส่วนขยาย',
    footer: 'ป.4-5 · ภาษาไทย · สื่อการสอน Hub',
    grade: 'ป.4-5',
    accent: '#15803d',
    scene:
      'polished 3D semi-realistic educational illustration like premium animation classroom, warm bright classroom with large whiteboard showing four colorful sentence blocks blue green orange purple connected with arrows, EXACTLY FOUR Thai elementary students seen from behind at wooden desks facing the whiteboard two boys two girls natural proportions NOT chibi, question mark quiz cards on board, soft warm natural lighting, NO teacher NO adult NO fifth child, professional Thai teaching media cover',
    colors: 'main color tone: warm peach orange classroom with mint green accents on whiteboard blocks, soft cinematic lighting',
  },
};

async function fetchAiImage(prompt, seed) {
  const url =
    `${POLLINATIONS}/${encodeURIComponent(prompt)}` +
    `?width=${W}&height=${H}&nologo=true&model=flux&seed=${seed}`;
  const res = await fetch(url, { headers: { Accept: 'image/*' } });
  if (!res.ok) throw new Error(`Pollinations HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 5000) throw new Error('ภาพเล็กผิดปกติ');
  return buf;
}

async function renderOne(slug, spec) {
  const prompt = buildAiPrompt(spec.scene, spec.colors, {
    topClearPct: spec.topClearPct,
    overlay: spec.overlay,
    noTeacher: spec.noTeacher,
    serious: spec.serious,
  });
  const seed = 40_000 + [...slug].reduce((a, c) => a + c.charCodeAt(0), 0) + (spec.seedOffset || 0);
  console.log(`… ${slug} — สร้างภาพ AI (seed ${seed})`);
  const raw = await fetchAiImage(prompt, seed);
  const overlayArgs = {
    title: spec.title,
    titleLine2: spec.titleLine2,
    subtitle: spec.subtitle,
    footer: spec.footer,
    accent: spec.accent,
    grade: spec.grade,
    large: spec.overlayLarge,
    xl: spec.overlayXl,
    subtitlePlain: spec.subtitlePlain,
    darkText: spec.darkText,
  };
  const overlaySvg =
    spec.overlay === 'hero'
      ? titleOverlayHeroSvg(overlayArgs)
      : spec.overlay === 'banner'
        ? titleOverlayBannerSvg(overlayArgs)
        : spec.overlay === 'clean'
          ? titleOverlayCleanSvg(overlayArgs)
          : titleOverlaySvg(overlayArgs);
  const overlay = Buffer.from(overlaySvg, 'utf8');
  const dest = resolve(root, spec.out);
  await sharp(raw)
    .resize(W, H, { fit: 'cover', position: 'centre' })
    .composite([{ input: overlay, top: 0, left: 0 }])
    .png()
    .toFile(dest);
  console.log(`✓ ${slug} → ${spec.out}`);
}

const slugs = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SPECS);
for (const slug of slugs) {
  const spec = SPECS[slug];
  if (!spec) {
    console.error(`! ไม่รู้จัก: ${slug}`);
    process.exitCode = 1;
    continue;
  }
  try {
    await renderOne(slug, spec);
  } catch (e) {
    console.error(`✗ ${slug}:`, e.message);
    process.exitCode = 1;
  }
}
