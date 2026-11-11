import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');
const WORDS_DIR = path.join(ROOT, 'public/games/thai/thai-vocab-hub/data/words');

/**
 * Royal Society Dictionary (ราชบัณฑิตยสภา) Corrections for OCR errors, typos, and irregular transliterations
 */
export const ORTHOGRAPHY_FIXES = {
  // OCR broken characters & floating vowels
  'กบในกะลำครอบ': 'กบในกะลาครอบ',
  'กิ้งกำไดท้อง': 'กิ้งก่าได้ทอง',
  'กำ ดดั': 'กำจัด',
  'กำ นลั': 'กำนัล',
  'กรำบเรือ': 'กราบเรือ',
  'กวพี้นื บำ้น': 'กวีพื้นบ้าน',
  'ขวกัไขว่': 'ขวักไขว่',
  'กนั ดำร': 'กันดาร',
  'กงัหนั': 'กังหัน',
  'กงัวล': 'กังวล',
  'กลนั่ แกลง้': 'กลั่นแกล้ง',
  'กลำ้แกร่ง': 'กล้าแกร่ง',
  'จำ้ละหวนั่': 'จ้าละหวั่น',
  'ท้งัปวง': 'ทั้งปวง',
  'ตกั๊แตน': 'ตั๊กแตน',
  'ต้งัครรภ์': 'ตั้งครรภ์',
  'นำ้ พกัน้ำ แรง': 'น้ำพักน้ำแรง',
  'นำ้ พ่ึงเรือเสือพึ่งป่ำ': 'น้ำพึ่งเรือเสือพึ่งป่า',
  'ปลำยปล้ืม': 'ปลาบปลื้ม',
  'ผดำักนัรุก ผลดักนัรับ': 'ผลัดกันรุกผลัดกันรับ',
  'ผำ้หยกัร้ัง': 'ผ้าหยักรั้ง',
  'พกู่ นั': 'พู่กัน',
  'พกัฟ้ืน': 'พักฟื้น',
  'ร่วมดว้ย ช่วยกนั': 'ร่วมด้วยช่วยกัน',
  'วงิ่ ผลดั': 'วิ่งผลัด',
  'สิ่งแวดลอ้ ม': 'สิ่งแวดล้อม',
  'สิ้นเยอื่ ขำดใย': 'สิ้นเยื่อขาดใย',
  'เหยอืกน้ำ': 'เหยือกน้ำ',
  'ไหวหวนั่': 'ไหวหวั่น',
  'อดอยำกปำกแห้ง': 'อดอยากปากแห้ง',
  'เอ้ื อ เฟ้ื อ': 'เอื้อเฟื้อ',
  'โ อ บ เ อ้ื อ อ ำ รี': 'โอบเอื้ออารี',
  'ควายหงอน': 'ควายหงาน',
  'โฉงเฉง': 'โฉงฉาง',
  'ตะกราม': 'ตะกละ',

  // Spelling & Transliteration fixes per Royal Society
  'ฌำณ': 'ฌาน',
  'ฌาณ': 'ฌาน',
  'สึ นามิ': 'สึนามิ',
  'อภิปาย': 'อภิปราย',
  'สปาเก็ตตี้': 'สปาเกตตี',
  'คาปูชิโน่': 'คาปูชิโน',
  'เอสเปรสโซ่': 'เอสเปรสโซ',
  'รีโมท': 'รีโมต',
  'ปาฏิหารย์': 'ปาฏิหาริย์',
  'โอกาส': 'โอกาส',
  'กะปริบ': 'กะพริบ',
  'อัชฌาไตย': 'อธิปไตย',
  'ฮิวแมนอาร์ติแฟกต์': 'สิ่งประดิษฐ์มนุษย์',
  'โมดัลเวิร์บ': 'กริยานุเคราะห์'
};

/**
 * Loads the existing Thai Vocab Hub catalog
 * Returns Map of word -> Set of category slugs
 */
export function loadExistingCatalog() {
  const map = new Map();
  if (!fs.existsSync(WORDS_DIR)) return map;

  const files = fs.readdirSync(WORDS_DIR).filter(f => f.endsWith('.json'));
  for (const f of files) {
    const slug = f.replace('.json', '');
    const raw = JSON.parse(fs.readFileSync(path.join(WORDS_DIR, f), 'utf8'));
    const items = Array.isArray(raw) ? raw : (raw.words || []);
    for (const item of items) {
      const w = (item.word || '').trim();
      if (w) {
        if (!map.has(w)) map.set(w, new Set());
        map.get(w).add(slug);
      }
    }
  }
  return map;
}

/**
 * Audits, fixes orthography, and deduplicates words against existing catalog
 */
export function dedupAndAuditWords(wordItems, existingCatalog) {
  const skippedWords = [];
  const correctedWords = [];
  const newCandidates = [];
  const seenNewWords = new Set();

  for (const item of wordItems) {
    let word = (item.word || '').trim();
    if (!word) continue;

    // 1. Check & apply orthography fix
    if (ORTHOGRAPHY_FIXES[word]) {
      const fixed = ORTHOGRAPHY_FIXES[word];
      correctedWords.push({ original: word, corrected: fixed, source: item.source });
      word = fixed;
    }

    // 2. Check if already exists in existing catalog
    if (existingCatalog.has(word)) {
      skippedWords.push({
        word,
        source: item.source,
        existingCategories: Array.from(existingCatalog.get(word))
      });
      continue;
    }

    // 3. Check internal batch deduplication
    if (seenNewWords.has(word)) {
      continue; // Skip duplicate inside the incoming sources
    }

    seenNewWords.add(word);
    newCandidates.push({
      ...item,
      word
    });
  }

  return {
    skippedWords,
    correctedWords,
    newCandidates
  };
}
