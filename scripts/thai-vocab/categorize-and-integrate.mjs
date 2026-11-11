import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractAllRawWords } from './ingest-sources.mjs';
import { dedupAndAuditWords, loadExistingCatalog } from './dedup-and-correct.mjs';
import { enrichWordItem, validateEnrichedItem } from './enrich-pedagogy.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');
const WORDS_DIR = path.join(ROOT, 'public/games/thai/thai-vocab-hub/data/words');

/**
 * Determines the most pedagogically appropriate category for a Thai word
 */
export function categorizeWord(word, meta = {}) {
  // 1. Royal vocabulary
  const royalKeywords = [
    'พระ', 'กริ้ว', 'ทูล', 'เสด็จ', 'ทรง', 'ชนนี', 'มเหสี',
    'ราชา', 'โอรส', 'โอษฐ์', 'เกศา', 'เนตร', 'พักตร์', 'หัตถ์', 'บาท',
    'สุบิน', 'สุรเสียง', 'ฉลองพระองค์', 'ภูษา', 'มาลา'
  ];
  if (royalKeywords.some(k => word.includes(k)) && !['พระอาทิตย์', 'พระจันทร์เสี้ยว'].includes(word)) {
    return 'royal';
  }

  // 2. Reduplication & Rhyming pairs (check before long length idioms)
  if (/^กระ[^\s]+กระ[^\s]+$/.test(word) || word.includes('ๆ') || ['กระฉับกระเฉง', 'กระเซอะกระเซิง', 'กระวนกระวาย', 'กระวีกระวาด', 'กลิ้งกลอก', 'ขยันหมั่นเพียร'].includes(word)) {
    return 'reduplication';
  }

  // 3. Idioms and Proverbs
  const idiomPatterns = [
    'กบในกะลาครอบ', 'กบเลือกนาย', 'น้ำพึ่งเรือเสือพึ่งป่า', 'ขี่ช้างจับตั๊กแตน',
    'ช้าๆ ได้พร้าเล่มงาม', 'ใจปลาซิว', 'ใจยักษ์ใจมาร', 'ใจไม้ไส้ระกำ',
    'แพะรับบาป', 'ข้าวยากหมากแพง', 'คางคกขึ้นวอ', 'เข็นครกขึ้นภูเขา',
    'กิ้งก่าได้ทอง', 'กระต่ายตื่นตูม', 'ฝนตกขี้หมูไหล', 'ฝนสั่งฟ้า'
  ];
  if (idiomPatterns.some(p => word.includes(p)) || (word.includes('ใจ') && word.length >= 6)) {
    return 'idioms';
  }

  // 3. Foreign Loanwords
  const loanwordsList = [
    'คอมพิวเตอร์', 'อินเทอร์เน็ต', 'แท็บเล็ต', 'กอล์ฟ', 'ช็อกโกแลต', 'เต็นท์',
    'สปาเกตตี', 'แฮนด์', 'แฮปปี้', 'เลเซอร์', 'เซ็นเซอร์', 'พอดแคสต์', 'คอนเทนต์',
    'โน้ตบุ๊ก', 'ไมโครโฟน', 'โปรเจกเตอร์', 'ฟุตบอล', 'บาสเกตบอล', 'วอลเลย์บอล',
    'แบดมินตัน', 'ปิงปอง', 'เทนนิส', 'กีตาร์', 'เปียโน', 'ไวโอลิน', 'โยเกิร์ต',
    'บาร์โค้ด', 'แฮนด์เมด', 'ไฮเทค', 'ออนไลน์', 'ออฟไลน์', 'แพลตฟอร์ม', 'อีเมล',
    'วิดีโอคลิป', 'ซอฟต์แวร์', 'ฮาร์ดแวร์', 'คีย์บอร์ด', 'เมาส์', 'ไฟร์วอลล์',
    'ไวไฟ', 'แบนด์วิดท์', 'อัปโหลด', 'ดาวน์โหลด', 'เซิร์ฟเวอร์', 'โปรไฟล์',
    'แบคทีเรีย', 'ไวรัส', 'สลัด', 'พิซซ่า', 'แซนด์วิช', 'เค้ก', 'ไอศกรีม'
  ];
  if (loanwordsList.some(lw => word.includes(lw))) {
    return 'loanwords';
  }

  // 4. Commonly Misspelled Words
  const misspelledList = [
    'กะพริบ', 'กะเพรา', 'กะทัดรัด', 'อนุญาต', 'สังเกต', 'โอกาส', 'บิณฑบาต',
    'กังวล', 'ตั๊กแตน', 'สวรรค์', 'อัศจรรย์', 'ปรากฏ', 'ปรารถนา', 'รสชาติ',
    'กะโหลก', 'ผัดไทย', 'คะนึง', 'ศีรษะ', 'ทรมาน'
  ];
  if (misspelledList.some(m => word === m)) {
    return 'misspelled';
  }

  // 5. Reduplication & Rhyming pairs
  if (/^กระ[^\s]+กระ[^\s]+$/.test(word) || word.includes('ๆ') || ['กระฉับกระเฉง', 'กระเซอะกระเซิง', 'กระวนกระวาย', 'กระวีกระวาด', 'กลิ้งกลอก', 'ขยันหมั่นเพียร'].includes(word)) {
    return 'reduplication';
  }

  // 6. Cluster Consonants (Blends)
  const blendPrefixes = ['กร', 'กล', 'กว', 'ขร', 'ขล', 'ขว', 'คร', 'คล', 'คว', 'ตร', 'ปร', 'ปล', 'ปว', 'พร', 'พล'];
  if (blendPrefixes.some(b => word.startsWith(b)) && word.length <= 10 && !word.startsWith('กระ')) {
    return 'blends';
  }

  // 7. Leading Consonants
  const leadingWords = ['ขมุกขมัว', 'ตวาด', 'เขย่า', 'กนก', 'ตลับ', 'สมาน', 'ฉลาด', 'สนิท', 'สลับ', 'ขยัน', 'ขยาย', 'ผลิต'];
  if (leadingWords.some(l => word.startsWith(l)) || (word.startsWith('ห') && ['หน', 'หม', 'หย', 'หล', 'หว'].some(h => word.startsWith(h)))) {
    return 'leading';
  }

  // 8. Classifiers
  const classifierList = ['หยด', 'แพ', 'เล่ม', 'คัน', 'ฉบับ', 'ดวง', 'แผ่น', 'ฟอง', 'บาน', 'องค์', 'รูป', 'ตัว'];
  if (classifierList.includes(word)) {
    return 'classifiers';
  }

  // 9. Science & Nature (p5-focus)
  const scienceKeywords = [
    'สิ่งแวดล้อม', 'ธรรมชาติ', 'ระบบนิเวศ', 'พลังงาน', 'อุณหภูมิ', 'แรงโน้มถ่วง',
    'โมเลกุล', 'อะตอม', 'เซลล์', 'แร่ธาตุ', 'ปฏิกิริยา', 'สังเคราะห์', 'ดาวเคราะห์',
    'บรรยากาศ', 'มลพิษ', 'นิเวศ', 'ธารลึก', 'หุบผา', 'ชะง่อนผา', 'ลมมรสุม'
  ];
  if (scienceKeywords.some(sk => word.includes(sk))) {
    return 'p5-focus';
  }

  // 10. Difficult / Academic
  if (word.length >= 8 || ['กบิลพัสดุ์', 'เนรมิต', 'มโนทัศน์', 'กัมมันตภาพรังสี', 'กัลปาวสาน'].includes(word)) {
    return 'difficult';
  }

  // Default: Elementary core lesson vocabulary
  return 'lesson';
}

/**
 * Main integration execution function
 */
export function integrateNewWords({ maxPerCategory = 50 } = {}) {
  const existingMap = loadExistingCatalog();
  const rawItems = extractAllRawWords();
  const { skippedWords, correctedWords, newCandidates } = dedupAndAuditWords(rawItems, existingMap);

  console.log(`Ingestion stats:`);
  console.log(`- Total raw extracted: ${rawItems.length}`);
  console.log(`- Skipped existing words: ${skippedWords.length}`);
  console.log(`- Corrected typos: ${correctedWords.length}`);
  console.log(`- Truly new candidates: ${newCandidates.length}`);

  // Group candidates into categories
  const additionsByCategory = {};
  for (const item of newCandidates) {
    const cat = categorizeWord(item.word, item);
    if (!additionsByCategory[cat]) additionsByCategory[cat] = [];

    // Check if cap reached for balanced growth
    if (additionsByCategory[cat].length < maxPerCategory) {
      const enriched = enrichWordItem(item.word, cat, {
        category_evidence: `คำศัพท์ใหม่จากบัญชีคำพื้นฐานและบทเรียนประถมศึกษา บูรณาการเข้าหมวด ${cat}`
      });
      const valid = validateEnrichedItem(enriched);
      if (valid.isValid) {
        additionsByCategory[cat].push(enriched);
      }
    }
  }

  // Merge additions into category JSON files
  let totalAdded = 0;
  for (const [cat, items] of Object.entries(additionsByCategory)) {
    const filePath = path.join(WORDS_DIR, `${cat}.json`);
    if (fs.existsSync(filePath)) {
      const current = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (Array.isArray(current)) {
        // Ensure no internal duplicates
        const currentSet = new Set(current.map(c => c.word));
        const filteredNew = items.filter(it => !currentSet.has(it.word));
        const merged = [...current, ...filteredNew];
        fs.writeFileSync(filePath, JSON.stringify(merged, null, 2), 'utf8');
        totalAdded += filteredNew.length;
        console.log(`✅ Category [${cat}]: added ${filteredNew.length} words (total: ${merged.length})`);
      }
    }
  }

  console.log(`\n🎉 Total newly integrated words: ${totalAdded}`);
  return {
    skippedCount: skippedWords.length,
    correctedCount: correctedWords.length,
    totalAdded
  };
}
