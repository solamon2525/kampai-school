#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = readFileSync(resolve(root, '.env.local'), 'utf8');
const url = env.match(/VITE_SUPABASE_URL="?([^\r\n"]+)/)?.[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY="?([^\r\n"]+)/)?.[1];
if (!url || !key) { console.error('missing env'); process.exit(1); }

const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: staff } = await sb.from('staff').select('id').like('name', '%ณัฐพงศ์%สิงห์ชมภู%')
  .eq('staff_type', 'teaching').order('created_at', { ascending: true }).limit(1).maybeSingle();
if (!staff) { console.error('staff missing'); process.exit(1); }

const DOCS = [
  { url: '/games/math/rounding.html', fmt: 'สื่อค่าประมาณ', features: ['โหมดหลักสิบ/ร้อย/พัน/ทศนิยม', 'แสดงเฉลยพร้อมคำอธิบาย', 'ไม่เก็บคะแนน'], version: 'v1.1.0', notes: 'เพิ่มโหมดทศนิยม ป.4' },
  { url: '/games/math/fraction-pieces.html', fmt: 'สื่อเศษส่วนชิ้น', features: ['แท่งเศษส่วน', 'เทียบเศษส่วน', 'โหมดฝึก'], version: 'v1.0.0', notes: 'media' },
  { url: '/games/math/times-table.html', fmt: 'ตารางสูตรคูณ', features: ['ตาราง 2-12', 'โหมดฝึกจำ', 'TTS'], version: 'v1.0.0', notes: 'media' },
  { url: '/games/thai/thai-sara-chart.html', fmt: 'แผนภาพสระไทย', features: ['สระทั้งหมด', 'แตะฟัง', 'ป.1-2'], version: 'v1.0.0', notes: 'media' },
  { url: '/games/thai/thai-matra-chart.html', fmt: 'มาตราตัวสะกด', features: ['กฎมาตรา', 'ตัวอย่างคำ', 'ป.1-3'], version: 'v1.0.0', notes: 'media' },
  { url: '/games/thai/thai-word-types.html', fmt: 'ชนิดของคำ ป.3-4', features: ['นาม กริยา คุณศัพท์', 'โหมดฝึก/จัดกล่อง', 'โหมดสำนวน'], version: 'v1.1.0', notes: 'เพิ่มสำนวน' },
  { url: '/games/english/phonics-chart.html', fmt: 'Phonics chart', features: ['เสียงตัวอักษร', 'แตะฟัง', 'ป.1-3'], version: 'v1.0.0', notes: 'media' },
  { url: '/games/english/grammar-mini.html', fmt: 'Grammar mini', features: ['is/are', 'a/an', 'this/that/these/those'], version: 'v1.1.0', notes: 'E3 demonstratives' },
  { url: '/games/science/water-cycle.html', fmt: 'วัฏจักรน้ำ', features: ['ขั้นคลิก', 'เรียงลำดับ', 'ป.3-5'], version: 'v1.0.0', notes: 'media' },
  { url: '/games/math/decimal-media.html', fmt: 'ทศนิยมสาธิต', features: ['อ่าน/เปรียบเทียบ/บวกลบ', 'โหมดฝึก', 'ป.4'], version: 'v1.0.0', notes: 'batch1' },
  { url: '/games/science/states-of-matter.html', fmt: 'สสาร 3 สถานะ', features: ['ของแข็ง/ของเหลว/แก๊ส', 'สไลเดอร์อุณหภูมิ', 'ป.4'], version: 'v1.0.0', notes: 'batch1' },
  { url: '/games/social/thailand-map.html', fmt: 'แผนที่จังหวัด', features: ['แตะภาค', 'จังหวัดตัวอย่าง', 'ป.4'], version: 'v1.0.0', notes: 'batch1' },
  { url: '/games/english/sight-words-p4.html', fmt: 'Sight Words ป.4', features: ['24 คำ', 'แฟลชการ์ด', 'ป.4'], version: 'v1.0.0', notes: 'batch1' },
  { url: '/games/thai/fact-opinion.html', fmt: 'ข้อเท็จจริง vs ความคิดเห็น', features: ['จำแนก', 'โหมดฝึก', 'ป.4'], version: 'v1.0.0', notes: 'batch2' },
  { url: '/games/math/bar-chart-media.html', fmt: 'แผนภูมิแท่ง', features: ['กรอกข้อมูล', 'อ่านกราฟ', 'ป.4'], version: 'v1.0.0', notes: 'batch2' },
  { url: '/games/social/good-citizen-media.html', fmt: 'พลเมืองดี', features: ['สถานการณ์', 'เลือกพฤติกรรม', 'ป.4'], version: 'v1.0.0', notes: 'batch2' },
  { url: '/games/science/vertebrate-sort.html', fmt: 'จำแนกสัตว์', features: ['มี/ไม่มีกระดูกสันหลัง', 'จัดกลุ่ม', 'ป.4'], version: 'v1.0.0', notes: 'batch2' },
  { url: '/games/math/angle-media.html', fmt: 'มุม', features: ['แหลม/ฉาก/ป้าน', 'โพรแทรกเตอร์', 'ป.4'], version: 'v1.0.0', notes: 'batch3' },
  { url: '/games/social/sukhothai-timeline.html', fmt: 'สมัยสุโขทัย', features: ['ไทม์ไลน์', 'บุคคลสำคัญ', 'ป.4'], version: 'v1.0.0', notes: 'batch3' },
  { url: '/games/health/food-label-media.html', fmt: 'อ่านฉลากอาหาร', features: ['สารอาหาร', 'วันหมดอายุ', 'ป.4'], version: 'v1.0.0', notes: 'batch3' },
  { url: '/games/english/follow-instructions.html', fmt: 'Follow Instructions', features: ['ฟัง/อ่านคำสั่ง', 'เลือกภาพ', 'ป.4'], version: 'v1.0.0', notes: 'batch3' },
  { url: '/games/math/number-line-media.html', fmt: 'เส้นจำนวน', features: ['ลากจุด', 'เปรียบเทียบ', 'ป.1-3'], version: 'v1.0.0', notes: 'M1' },
  { url: '/games/science/digestive-system-media.html', fmt: 'ระบบย่อยอาหาร', features: ['แผนภาพคลิก', 'เรียงลำดับ', 'ป.4-6'], version: 'v1.0.0', notes: 'S2' },
  { url: '/games/health/handwash-media.html', fmt: 'ล้างมือ 7 ขั้น', features: ['เรียงขั้นตอน', 'สไลด์เรียน', 'ป.1-3'], version: 'v1.0.0', notes: 'O3' },
];

for (const doc of DOCS) {
  const { data: item } = await sb.from('educational_hub_items').select('id')
    .eq('owner_staff_id', staff.id).eq('external_url', doc.url).maybeSingle();
  if (!item) { console.warn('SKIP no item', doc.url); continue; }
  const { error } = await sb.from('game_docs').upsert({
    item_id: item.id,
    owner_staff_id: staff.id,
    game_format: doc.fmt,
    features: doc.features,
    version: doc.version,
    notes: doc.notes,
  }, { onConflict: 'item_id' });
  if (error) throw error;
  console.log('DOC', doc.url);
}
