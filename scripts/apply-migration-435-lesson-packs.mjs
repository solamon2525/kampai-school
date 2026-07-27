#!/usr/bin/env node
/**
 * Apply Phase 15 — seed lesson_packs from Phase 11–13 pairs (+ a few older pairs → ≥30)
 * Requires migration 435 schema applied first.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = readFileSync(resolve(root, '.env.local'), 'utf8');
const url = env.match(/VITE_SUPABASE_URL="?([^\r\n"]+)/)?.[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY="?([^\r\n"]+)/)?.[1];
const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: staff } = await sb.from('staff').select('id').like('name', '%ณัฐพงศ์%สิงห์ชมภู%')
  .eq('staff_type', 'teaching').order('created_at', { ascending: true }).limit(1).maybeSingle();
if (!staff) { console.error('staff missing'); process.exit(1); }

/** @type {Array<{pack_key:string,title:string,description:string,subject:string,grade_levels:string[],thumbnail_url:string,phase_tag:string,sort_order:number,media:string,worksheet:string}>} */
const PACKS = [
  // Phase 11
  { pack_key: 'p11-visual-elements', title: 'ชุดเรียนทัศนธาตุ', description: 'สื่อ + ใบงาน ทัศนธาตุในงานศิลปะ', subject: 'ศิลปะ', grade_levels: ['ป.2', 'ป.3', 'ป.4'], thumbnail_url: '/games/arts/visual-elements-media-cover.png', phase_tag: 'Phase11', sort_order: 110, media: '/games/arts/visual-elements-media.html', worksheet: '/games/arts/visual-elements-worksheet.html' },
  { pack_key: 'p11-rhythm-music', title: 'ชุดเรียนจังหวะดนตรี', description: 'สื่อ + ใบงาน จังหวะดนตรีพื้นฐาน', subject: 'ศิลปะ', grade_levels: ['ป.1', 'ป.2', 'ป.3'], thumbnail_url: '/games/arts/rhythm-music-media-cover.png', phase_tag: 'Phase11', sort_order: 111, media: '/games/arts/rhythm-music-media.html', worksheet: '/games/arts/rhythm-music-worksheet.html' },
  { pack_key: 'p11-dance-basics', title: 'ชุดเรียนนาฏศิลป์พื้นฐาน', description: 'สื่อ + ใบงาน นาฏศิลป์พื้นฐาน', subject: 'ศิลปะ', grade_levels: ['ป.1', 'ป.2', 'ป.3'], thumbnail_url: '/games/arts/dance-basics-media-cover.png', phase_tag: 'Phase11', sort_order: 112, media: '/games/arts/dance-basics-media.html', worksheet: '/games/arts/dance-basics-worksheet.html' },
  { pack_key: 'p11-home-crafts', title: 'ชุดเรียนงานบ้าน-ประดิษฐ์', description: 'สื่อ + ใบงาน งานบ้านและประดิษฐ์', subject: 'การงานอาชีพ', grade_levels: ['ป.1', 'ป.2', 'ป.3'], thumbnail_url: '/games/career/home-crafts-media-cover.png', phase_tag: 'Phase11', sort_order: 113, media: '/games/career/home-crafts-media.html', worksheet: '/games/career/home-crafts-worksheet.html' },
  { pack_key: 'p11-school-garden', title: 'ชุดเรียนเกษตรโรงเรียน', description: 'สื่อ + ใบงาน เกษตรในโรงเรียน', subject: 'การงานอาชีพ', grade_levels: ['ป.3', 'ป.4'], thumbnail_url: '/games/career/school-garden-media-cover.png', phase_tag: 'Phase11', sort_order: 114, media: '/games/career/school-garden-media.html', worksheet: '/games/career/school-garden-worksheet.html' },
  { pack_key: 'p11-food-nutrition', title: 'ชุดเรียนอาหาร-โภชนาการ', description: 'สื่อ + ใบงาน อาหารและโภชนาการ', subject: 'การงานอาชีพ', grade_levels: ['ป.2', 'ป.3'], thumbnail_url: '/games/career/food-nutrition-media-cover.png', phase_tag: 'Phase11', sort_order: 115, media: '/games/career/food-nutrition-media.html', worksheet: '/games/career/food-nutrition-worksheet.html' },
  { pack_key: 'p11-algorithm-unplugged', title: 'ชุดเรียนอัลกอริทึม unplugged', description: 'สื่อ + ใบงาน อัลกอริทึมแบบไม่ใช้คอม', subject: 'วิทยาศาสตร์', grade_levels: ['ป.1', 'ป.2', 'ป.3'], thumbnail_url: '/games/tech/algorithm-unplugged-media-cover.png', phase_tag: 'Phase11', sort_order: 116, media: '/games/tech/algorithm-unplugged-media.html', worksheet: '/games/tech/algorithm-unplugged-worksheet.html' },
  { pack_key: 'p11-data-presentation', title: 'ชุดเรียนข้อมูลและการนำเสนอ', description: 'สื่อ + ใบงาน ข้อมูลและกราฟ', subject: 'วิทยาศาสตร์', grade_levels: ['ป.3', 'ป.4'], thumbnail_url: '/games/tech/data-presentation-media-cover.png', phase_tag: 'Phase11', sort_order: 117, media: '/games/tech/data-presentation-media.html', worksheet: '/games/tech/data-presentation-worksheet.html' },
  { pack_key: 'p11-thai-geography', title: 'ชุดเรียนภูมิศาสตร์ไทย', description: 'สื่อ + ใบงาน ภูมิศาสตร์ไทยเบื้องต้น', subject: 'สังคมศึกษา', grade_levels: ['ป.3', 'ป.4'], thumbnail_url: '/games/social/thai-geography-media-cover.png', phase_tag: 'Phase11', sort_order: 118, media: '/games/social/thai-geography-media.html', worksheet: '/games/social/thai-geography-worksheet.html' },
  { pack_key: 'p11-citizen-duties', title: 'ชุดเรียนหน้าที่พลเมือง ป.ต้น', description: 'สื่อ + ใบงาน หน้าที่พลเมืองดี', subject: 'สังคมศึกษา', grade_levels: ['ป.1', 'ป.2', 'ป.3'], thumbnail_url: '/games/social/citizen-duties-p123-media-cover.png', phase_tag: 'Phase11', sort_order: 119, media: '/games/social/citizen-duties-p123-media.html', worksheet: '/games/social/citizen-duties-p123-worksheet.html' },
  // Phase 12
  { pack_key: 'p12-word-blend', title: 'ชุดเรียนประสมคำ', description: 'สื่อ + ใบงาน ประสมคำ ป.ต้น', subject: 'ภาษาไทย', grade_levels: ['ป.1', 'ป.2'], thumbnail_url: '/games/thai/word-blend-media-cover.png', phase_tag: 'Phase12', sort_order: 120, media: '/games/thai/word-blend-media.html', worksheet: '/games/thai/word-blend-worksheet.html' },
  { pack_key: 'p12-read-write-fluency', title: 'ชุดเรียนอ่าน-เขียนคล่อง', description: 'สื่อ + ใบงาน อ่านคล่องเขียนคล่อง', subject: 'ภาษาไทย', grade_levels: ['ป.1', 'ป.2'], thumbnail_url: '/games/thai/read-write-fluency-media-cover.png', phase_tag: 'Phase12', sort_order: 121, media: '/games/thai/read-write-fluency-media.html', worksheet: '/games/thai/read-write-fluency-worksheet.html' },
  { pack_key: 'p12-basic-vocab', title: 'ชุดเรียนคำพื้นฐาน', description: 'สื่อ + ใบงาน คำพื้นฐานใกล้ตัว', subject: 'ภาษาไทย', grade_levels: ['ป.1', 'ป.2'], thumbnail_url: '/games/thai/basic-vocab-p12-media-cover.png', phase_tag: 'Phase12', sort_order: 122, media: '/games/thai/basic-vocab-p12-media.html', worksheet: '/games/thai/basic-vocab-p12-worksheet.html' },
  { pack_key: 'p12-numbers-1-100', title: 'ชุดเรียนจำนวน 1–100', description: 'สื่อ + ใบงาน จำนวนนับ 1–100', subject: 'คณิตศาสตร์', grade_levels: ['ป.1', 'ป.2'], thumbnail_url: '/games/math/numbers-1-100-media-cover.png', phase_tag: 'Phase12', sort_order: 123, media: '/games/math/numbers-1-100-media.html', worksheet: '/games/math/numbers-1-100-worksheet.html' },
  { pack_key: 'p12-add-sub-100', title: 'ชุดเรียนบวกลบ ≤100', description: 'สื่อ + ใบงาน บวก–ลบไม่เกิน 100', subject: 'คณิตศาสตร์', grade_levels: ['ป.1', 'ป.2'], thumbnail_url: '/games/math/add-sub-within-100-media-cover.png', phase_tag: 'Phase12', sort_order: 124, media: '/games/math/add-sub-within-100-media.html', worksheet: '/games/math/add-sub-within-100-worksheet.html' },
  { pack_key: 'p12-basic-shapes', title: 'ชุดเรียนรูปทรงพื้นฐาน', description: 'สื่อ + ใบงาน รูปทรงพื้นฐาน', subject: 'คณิตศาสตร์', grade_levels: ['ป.1', 'ป.2'], thumbnail_url: '/games/math/basic-shapes-p12-media-cover.png', phase_tag: 'Phase12', sort_order: 125, media: '/games/math/basic-shapes-p12-media.html', worksheet: '/games/math/basic-shapes-p12-worksheet.html' },
  { pack_key: 'p12-alphabet-phonics', title: 'ชุดเรียน ABC Phonics', description: 'สื่อ + ใบงาน ตัวอักษรและเสียงต้น', subject: 'ภาษาอังกฤษ', grade_levels: ['ป.1', 'ป.2'], thumbnail_url: '/games/english/alphabet-phonics-media-cover.png', phase_tag: 'Phase12', sort_order: 126, media: '/games/english/alphabet-phonics-media.html', worksheet: '/games/english/alphabet-phonics-worksheet.html' },
  { pack_key: 'p12-sight-words-daily', title: 'ชุดเรียน Sight Words Daily', description: 'สื่อ + ใบงาน คำใช้บ่อยทุกวัน', subject: 'ภาษาอังกฤษ', grade_levels: ['ป.1', 'ป.2'], thumbnail_url: '/games/english/sight-words-daily-media-cover.png', phase_tag: 'Phase12', sort_order: 127, media: '/games/english/sight-words-daily-media.html', worksheet: '/games/english/sight-words-daily-worksheet.html' },
  { pack_key: 'p12-living-nonliving', title: 'ชุดเรียนสิ่งมีชีวิต-ไม่มีชีวิต', description: 'สื่อ + ใบงาน จำแนกสิ่งมีชีวิต', subject: 'วิทยาศาสตร์', grade_levels: ['ป.1', 'ป.2'], thumbnail_url: '/games/science/living-nonliving-media-cover.png', phase_tag: 'Phase12', sort_order: 128, media: '/games/science/living-nonliving-media.html', worksheet: '/games/science/living-nonliving-worksheet.html' },
  { pack_key: 'p12-materials-around', title: 'ชุดเรียนวัสดุรอบตัว', description: 'สื่อ + ใบงาน วัสดุรอบตัว', subject: 'วิทยาศาสตร์', grade_levels: ['ป.1', 'ป.2'], thumbnail_url: '/games/science/materials-around-media-cover.png', phase_tag: 'Phase12', sort_order: 129, media: '/games/science/materials-around-media.html', worksheet: '/games/science/materials-around-worksheet.html' },
  // Phase 13
  { pack_key: 'p13-percent-ratio', title: 'ชุดเรียนร้อยละ·อัตราส่วน', description: 'สื่อ + ใบงาน ร้อยละและอัตราส่วน ป.6', subject: 'คณิตศาสตร์', grade_levels: ['ป.6'], thumbnail_url: '/games/math/percent-ratio-media-cover.png', phase_tag: 'Phase13', sort_order: 130, media: '/games/math/percent-ratio-media.html', worksheet: '/games/math/percent-ratio-worksheet.html' },
  { pack_key: 'p13-simple-equation', title: 'ชุดเรียนสมการอย่างง่าย', description: 'สื่อ + ใบงาน สมการและแบบรูป ป.6', subject: 'คณิตศาสตร์', grade_levels: ['ป.6'], thumbnail_url: '/games/math/simple-equation-media-cover.png', phase_tag: 'Phase13', sort_order: 131, media: '/games/math/simple-equation-media.html', worksheet: '/games/math/simple-equation-worksheet.html' },
  { pack_key: 'p13-rhetoric-literature', title: 'ชุดเรียนโวหาร·วรรณคดี', description: 'สื่อ + ใบงาน โวหารและวรรณคดี ป.6', subject: 'ภาษาไทย', grade_levels: ['ป.6'], thumbnail_url: '/games/thai/rhetoric-literature-p6-media-cover.png', phase_tag: 'Phase13', sort_order: 132, media: '/games/thai/rhetoric-literature-p6-media.html', worksheet: '/games/thai/rhetoric-literature-p6-worksheet.html' },
  { pack_key: 'p13-electric-circuit', title: 'ชุดเรียนไฟฟ้า·วงจร', description: 'สื่อ + ใบงาน วงจรไฟฟ้าอย่างง่าย ป.6', subject: 'วิทยาศาสตร์', grade_levels: ['ป.6'], thumbnail_url: '/games/science/electric-circuit-media-cover.png', phase_tag: 'Phase13', sort_order: 133, media: '/games/science/electric-circuit-media.html', worksheet: '/games/science/electric-circuit-worksheet.html' },
  { pack_key: 'p13-body-systems', title: 'ชุดเรียนสารอาหาร·ระบบย่อย', description: 'สื่อ + ใบงาน สารอาหารและระบบย่อย ป.6', subject: 'วิทยาศาสตร์', grade_levels: ['ป.6'], thumbnail_url: '/games/science/body-systems-p6-media-cover.png', phase_tag: 'Phase13', sort_order: 134, media: '/games/science/body-systems-p6-media.html', worksheet: '/games/science/body-systems-p6-worksheet.html' },
  { pack_key: 'p13-english-tenses', title: 'ชุดเรียน Tenses ป.6', description: 'สื่อ + ใบงาน Present/Past/Future', subject: 'ภาษาอังกฤษ', grade_levels: ['ป.6'], thumbnail_url: '/games/english/english-tenses-p6-media-cover.png', phase_tag: 'Phase13', sort_order: 135, media: '/games/english/english-tenses-p6-media.html', worksheet: '/games/english/english-tenses-p6-worksheet.html' },
  { pack_key: 'p13-english-reading', title: 'ชุดเรียน Reading ป.6', description: 'สื่อ + ใบงาน อ่านจับใจความ', subject: 'ภาษาอังกฤษ', grade_levels: ['ป.6'], thumbnail_url: '/games/english/english-reading-p6-media-cover.png', phase_tag: 'Phase13', sort_order: 136, media: '/games/english/english-reading-p6-media.html', worksheet: '/games/english/english-reading-p6-worksheet.html' },
  { pack_key: 'p13-economics', title: 'ชุดเรียนเศรษฐศาสตร์ ป.6', description: 'สื่อ + ใบงาน ผู้ผลิต ผู้บริโภค ยั่งยืน', subject: 'สังคมศึกษา', grade_levels: ['ป.6'], thumbnail_url: '/games/social/economics-p6-media-cover.png', phase_tag: 'Phase13', sort_order: 137, media: '/games/social/economics-p6-media.html', worksheet: '/games/social/economics-p6-worksheet.html' },
  // Older pairs → ≥30
  { pack_key: 'legacy-fraction-pieces', title: 'ชุดเรียนเศษส่วน (ชิ้นส่วน)', description: 'สื่อ + ใบงาน เศษส่วนพื้นฐาน', subject: 'คณิตศาสตร์', grade_levels: ['ป.3', 'ป.4', 'ป.5'], thumbnail_url: '/games/math/fraction-pieces-cover.png', phase_tag: 'Legacy', sort_order: 50, media: '/games/math/fraction-pieces.html', worksheet: '/games/math/fraction-pieces-worksheet.html' },
  { pack_key: 'legacy-water-cycle', title: 'ชุดเรียนวัฏจักรน้ำ', description: 'สื่อ + ใบงาน วัฏจักรน้ำ', subject: 'วิทยาศาสตร์', grade_levels: ['ป.3', 'ป.4'], thumbnail_url: '/games/science/water-cycle-cover.png', phase_tag: 'Legacy', sort_order: 51, media: '/games/science/water-cycle.html', worksheet: '/games/science/water-cycle-worksheet.html' },
  { pack_key: 'legacy-digestive', title: 'ชุดเรียนระบบย่อยอาหาร', description: 'สื่อ + ใบงาน ระบบย่อยอาหาร', subject: 'วิทยาศาสตร์', grade_levels: ['ป.4', 'ป.5', 'ป.6'], thumbnail_url: '/games/science/digestive-system-media-cover.png', phase_tag: 'Legacy', sort_order: 52, media: '/games/science/digestive-system-media.html', worksheet: '/games/science/digestive-system-worksheet.html' },
  { pack_key: 'legacy-handwash', title: 'ชุดเรียนล้างมือ', description: 'สื่อ + ใบงาน ขั้นตอนการล้างมือ', subject: 'สุขศึกษา', grade_levels: ['ป.1', 'ป.2', 'ป.3'], thumbnail_url: '/games/health/handwash-media-cover.png', phase_tag: 'Legacy', sort_order: 53, media: '/games/health/handwash-media.html', worksheet: '/games/health/handwash-worksheet.html' },
];

async function findItemId(externalUrl) {
  const { data } = await sb.from('educational_hub_items').select('id')
    .eq('external_url', externalUrl).eq('is_published', true).limit(1).maybeSingle();
  return data?.id ?? null;
}

async function upsertPack(p) {
  const mediaId = await findItemId(p.media);
  const wsId = await findItemId(p.worksheet);
  if (!mediaId && !wsId) {
    console.warn('SKIP (no hub items)', p.pack_key);
    return false;
  }

  const payload = {
    pack_key: p.pack_key,
    title: p.title,
    description: p.description,
    subject: p.subject,
    grade_levels: p.grade_levels,
    thumbnail_url: p.thumbnail_url,
    sort_order: p.sort_order,
    is_published: true,
    owner_staff_id: staff.id,
    phase_tag: p.phase_tag,
  };

  const { data: existing } = await sb.from('lesson_packs').select('id').eq('pack_key', p.pack_key).maybeSingle();
  let packId = existing?.id;
  if (!existing) {
    const { data, error } = await sb.from('lesson_packs').insert(payload).select('id').single();
    if (error) throw error;
    packId = data.id;
    console.log('PACK INSERT', p.pack_key);
  } else {
    const { error } = await sb.from('lesson_packs').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', existing.id);
    if (error) throw error;
    console.log('PACK UPDATE', p.pack_key);
  }

  const roles = [
    mediaId ? { edu_hub_item_id: mediaId, role: 'media', sort_order: 1 } : null,
    wsId ? { edu_hub_item_id: wsId, role: 'worksheet', sort_order: 2 } : null,
  ].filter(Boolean);

  for (const row of roles) {
    await sb.from('lesson_pack_items').upsert(
      { pack_id: packId, ...row },
      { onConflict: 'pack_id,edu_hub_item_id', ignoreDuplicates: true },
    );
  }
  return true;
}

let ok = 0;
for (const p of PACKS) {
  if (await upsertPack(p)) ok += 1;
}
const { count } = await sb.from('lesson_packs').select('id', { count: 'exact', head: true }).eq('is_published', true);
console.log(`done Phase 15 seed — upserted ${ok}/${PACKS.length} · published packs ≈ ${count}`);
